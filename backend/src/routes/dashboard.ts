import type { Request } from 'express';
import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const dashboardRouter = Router();

function uid(req: Request): string {
  return getAuth(req).userId!;
}

function activeWhere(userId: string) {
  return { userId, isDeleted: false as const };
}

function computeMedian(sorted: number[]): number | null {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// GET /api/dashboard/summary
dashboardRouter.get('/summary', requireAuth, async (req, res) => {
  try {
    const where = activeWhere(uid(req));

    const [totalRecords, valuedRecords, snapshots] = await Promise.all([
      prisma.collectionItem.count({ where }),
      prisma.collectionItem.count({
        where: { ...where, valueSnapshots: { some: {} } },
      }),
      prisma.releaseValueSnapshot.findMany({
        where: { collectionItem: where, medianValue: { not: null } },
        distinct: ['collectionItemId'],
        orderBy: { capturedAt: 'desc' },
        select: { medianValue: true },
      }),
    ]);

    const values = snapshots.map((s) => Number(s.medianValue)).sort((a, b) => a - b);

    res.json({
      totalRecords,
      uniqueReleases: totalRecords,
      valuedRecords,
      estimatedMedianValue: computeMedian(values),
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/dashboard/value
dashboardRouter.get('/value', requireAuth, async (req, res) => {
  try {
    const where = activeWhere(uid(req));

    const snapshots = await prisma.releaseValueSnapshot.findMany({
      where: { collectionItem: where, medianValue: { not: null } },
      distinct: ['collectionItemId'],
      orderBy: { capturedAt: 'desc' },
      select: { medianValue: true },
    });

    const values = snapshots.map((s) => Number(s.medianValue)).sort((a, b) => a - b);

    res.json({
      minValue: values[0] ?? null,
      medianValue: computeMedian(values),
      maxValue: values[values.length - 1] ?? null,
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch value overview' });
  }
});

// GET /api/dashboard/top-artists
dashboardRouter.get('/top-artists', requireAuth, async (req, res) => {
  try {
    const result = await prisma.collectionItem.groupBy({
      by: ['artist'],
      where: activeWhere(uid(req)),
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    res.json(result.map((r) => ({ artist: r.artist, count: r._count.id })));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch top artists' });
  }
});

// GET /api/dashboard/top-genres
dashboardRouter.get('/top-genres', requireAuth, async (req, res) => {
  try {
    const result = await prisma.collectionItemGenre.groupBy({
      by: ['genre'],
      where: { collectionItem: activeWhere(uid(req)) },
      _count: { genre: true },
      orderBy: { _count: { genre: 'desc' } },
    });
    res.json(result.map((r) => ({ genre: r.genre, count: r._count.genre })));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// GET /api/dashboard/top-styles
dashboardRouter.get('/top-styles', requireAuth, async (req, res) => {
  try {
    const result = await prisma.collectionItemStyle.groupBy({
      by: ['style'],
      where: { collectionItem: activeWhere(uid(req)) },
      _count: { style: true },
      orderBy: { _count: { style: 'desc' } },
    });
    res.json(result.map((r) => ({ style: r.style, count: r._count.style })));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

// GET /api/dashboard/formats
dashboardRouter.get('/formats', requireAuth, async (req, res) => {
  try {
    const result = await prisma.collectionItemFormat.groupBy({
      by: ['format'],
      where: { collectionItem: activeWhere(uid(req)) },
      _count: { format: true },
      orderBy: { _count: { format: 'desc' } },
    });
    res.json(result.map((r) => ({ format: r.format, count: r._count.format })));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch formats' });
  }
});

// GET /api/dashboard/decades
dashboardRouter.get('/decades', requireAuth, async (req, res) => {
  try {
    const items = await prisma.collectionItem.findMany({
      where: { ...activeWhere(uid(req)), year: { not: null } },
      select: { year: true },
    });

    const counts: Record<string, number> = {};
    for (const item of items) {
      if (!item.year) continue;
      const decade = `${Math.floor(item.year / 10) * 10}s`;
      counts[decade] = (counts[decade] ?? 0) + 1;
    }

    const result = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([decade, count]) => ({ decade, count }));

    res.json(result);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch decades' });
  }
});

// GET /api/dashboard/countries
dashboardRouter.get('/countries', requireAuth, async (req, res) => {
  try {
    const result = await prisma.collectionItem.groupBy({
      by: ['country'],
      where: { ...activeWhere(uid(req)), country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json(result.map((r) => ({ country: r.country, count: r._count.id })));
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/dashboard/valuable-releases
dashboardRouter.get('/valuable-releases', requireAuth, async (req, res) => {
  try {
    const where = activeWhere(uid(req));

    const snapshots = await prisma.releaseValueSnapshot.findMany({
      where: { collectionItem: where, medianValue: { not: null } },
      distinct: ['collectionItemId'],
      orderBy: { capturedAt: 'desc' },
      include: {
        collectionItem: {
          select: {
            id: true,
            artist: true,
            title: true,
            year: true,
            country: true,
            coverImageUrl: true,
          },
        },
      },
    });

    const top = snapshots
      .sort((a, b) => Number(b.medianValue) - Number(a.medianValue))
      .slice(0, 25)
      .map((s) => ({
        ...s.collectionItem,
        medianValue: Number(s.medianValue),
      }));

    res.json(top);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch valuable releases' });
  }
});

// GET /api/dashboard/insights
dashboardRouter.get('/insights', requireAuth, async (req, res) => {
  try {
    const where = activeWhere(uid(req));
    const insights: string[] = [];

    const [topGenres, items, topArtists, topValue] = await Promise.all([
      prisma.collectionItemGenre.groupBy({
        by: ['genre'],
        where: { collectionItem: where },
        _count: { genre: true },
        orderBy: { _count: { genre: 'desc' } },
        take: 1,
      }),
      prisma.collectionItem.findMany({
        where: { ...where, year: { not: null } },
        select: { year: true },
      }),
      prisma.collectionItem.groupBy({
        by: ['artist'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      prisma.releaseValueSnapshot.findFirst({
        where: { collectionItem: where, medianValue: { not: null } },
        orderBy: { medianValue: 'desc' },
        include: {
          collectionItem: { select: { artist: true, title: true } },
        },
      }),
    ]);

    if (topGenres[0]) {
      insights.push(`${topGenres[0].genre} is your dominant genre`);
    }

    if (items.length) {
      const decadeCounts: Record<number, number> = {};
      for (const item of items) {
        if (!item.year) continue;
        const decade = Math.floor(item.year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] ?? 0) + 1;
      }
      const topDecade = Object.entries(decadeCounts).sort(([, a], [, b]) => b - a)[0];
      if (topDecade) insights.push(`Most of your records are from the ${topDecade[0]}s`);
    }

    if (topArtists[0]) {
      insights.push(
        `${topArtists[0].artist} appears most in your collection (${topArtists[0]._count.id} records)`
      );
    }

    if (topValue) {
      insights.push(
        `Your most valuable record is ${topValue.collectionItem.artist} – ${topValue.collectionItem.title}`
      );
    }

    res.json(insights);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});
