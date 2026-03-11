import { prisma } from '../lib/prisma';
import { DiscogsService, type DiscogsRelease } from './discogs.service';

const discogsService = new DiscogsService();

// Stay well within Discogs' 60 req/min authenticated limit
const RATE_LIMIT_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SyncService {
  async startSync(userId: string) {
    const connection = await prisma.discogsConnection.findUnique({ where: { userId } });
    if (!connection) throw new Error('No Discogs connection found');
    if (connection.syncStatus === 'syncing') throw new Error('Sync already in progress');

    const job = await prisma.syncJob.create({
      data: { userId, status: 'running', startedAt: new Date() },
    });

    await prisma.discogsConnection.update({
      where: { userId },
      data: { syncStatus: 'syncing', lastSyncStartedAt: new Date() },
    });

    // Run async, don't await
    this.runSync(userId, job.id, connection).catch(async (err: Error) => {
      await prisma.syncJob
        .update({
          where: { id: job.id },
          data: { status: 'failed', completedAt: new Date(), error: err.message },
        })
        .catch(() => {});
      await prisma.discogsConnection
        .update({ where: { userId }, data: { syncStatus: 'failed' } })
        .catch(() => {});
    });

    return job;
  }

  private async runSync(
    userId: string,
    jobId: string,
    connection: { discogsUsername: string; accessToken: string; accessTokenSecret: string }
  ) {
    const seenInstanceIds = new Set<number>();
    let page = 1;
    let totalPages = 1;
    let itemsProcessed = 0;
    let pagesProcessed = 0;

    // --- Phase 1: Import collection ---
    do {
      const data = await discogsService.getCollectionPage(
        connection.discogsUsername,
        connection.accessToken,
        connection.accessTokenSecret,
        page
      );

      totalPages = data.pagination.pages;

      for (const release of data.releases) {
        await this.upsertItem(userId, release);
        seenInstanceIds.add(release.instance_id);
        itemsProcessed++;
      }

      pagesProcessed++;
      await prisma.syncJob.update({
        where: { id: jobId },
        data: { itemsProcessed, pagesProcessed },
      });

      page++;
      if (page <= totalPages) await sleep(RATE_LIMIT_MS);
    } while (page <= totalPages);

    // --- Phase 2: Mark removed items as deleted ---
    if (seenInstanceIds.size > 0) {
      await prisma.collectionItem.updateMany({
        where: {
          userId,
          isDeleted: false,
          discogsInstanceId: { notIn: Array.from(seenInstanceIds) },
        },
        data: { isDeleted: true },
      });
    }

    // --- Phase 3: Fetch marketplace stats ---
    const items = await prisma.collectionItem.findMany({
      where: { userId, isDeleted: false },
      select: { id: true, discogsReleaseId: true },
    });

    for (const item of items) {
      try {
        const stats = await discogsService.getReleaseStats(item.discogsReleaseId);
        await prisma.releaseValueSnapshot.create({
          data: {
            collectionItemId: item.id,
            lowestPrice: stats.lowest_price?.value ?? null,
            numForSale: stats.num_for_sale ?? null,
            // medianValue not available from this endpoint; extend later via price history
            medianValue: stats.lowest_price?.value ?? null,
          },
        });
      } catch {
        // Non-fatal: skip if stats unavailable (private listing, 404, etc.)
      }
      await sleep(RATE_LIMIT_MS);
    }

    // --- Done ---
    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: 'completed', completedAt: new Date(), itemsProcessed, pagesProcessed },
    });
    await prisma.discogsConnection.update({
      where: { userId },
      data: { syncStatus: 'completed', lastSyncCompletedAt: new Date() },
    });
  }

  private async upsertItem(userId: string, release: DiscogsRelease) {
    const info = release.basic_information;
    const artist = info.artists?.map((a) => a.name).join(', ') ?? 'Unknown';
    const genres: string[] = info.genres ?? [];
    const styles: string[] = info.styles ?? [];
    const formats: string[] = info.formats?.flatMap((f) => [f.name, ...(f.descriptions ?? [])]) ?? [];
    const labels: string[] = info.labels?.map((l) => l.name) ?? [];

    await prisma.collectionItem.upsert({
      where: {
        userId_discogsInstanceId: { userId, discogsInstanceId: release.instance_id },
      },
      create: {
        userId,
        discogsReleaseId: info.id,
        discogsInstanceId: release.instance_id,
        folderId: release.folder_id ?? 0,
        artist,
        title: info.title,
        year: info.year || null,
        country: info.country ?? null,
        coverImageUrl: info.cover_image ?? null,
        thumbImageUrl: info.thumb ?? null,
        dateAdded: release.date_added ? new Date(release.date_added) : null,
        rawJson: release,
        genres: { create: genres.map((g) => ({ genre: g })) },
        styles: { create: styles.map((s) => ({ style: s })) },
        formats: { create: formats.map((f) => ({ format: f })) },
        labels: { create: labels.map((l) => ({ label: l })) },
      },
      update: {
        artist,
        title: info.title,
        year: info.year || null,
        country: info.country ?? null,
        coverImageUrl: info.cover_image ?? null,
        thumbImageUrl: info.thumb ?? null,
        dateAdded: release.date_added ? new Date(release.date_added) : null,
        rawJson: release,
        isDeleted: false,
        genres: { deleteMany: {}, create: genres.map((g) => ({ genre: g })) },
        styles: { deleteMany: {}, create: styles.map((s) => ({ style: s })) },
        formats: { deleteMany: {}, create: formats.map((f) => ({ format: f })) },
        labels: { deleteMany: {}, create: labels.map((l) => ({ label: l })) },
      },
    });
  }
}
