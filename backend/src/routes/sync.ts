import { Router } from 'express';
import { getAuth } from '@clerk/express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { SyncService } from '../services/sync.service';
import { prisma } from '../lib/prisma';

export const syncRouter = Router();

const syncService = new SyncService();

const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => getAuth(req).userId ?? req.ip ?? 'unknown',
  message: { error: 'Too many sync requests. Please wait before syncing again.' },
});

// POST /api/collection/sync
syncRouter.post('/sync', requireAuth, syncLimiter, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const job = await syncService.startSync(userId!);
    res.json({ jobId: job.id, status: job.status });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' });
  }
});

// GET /api/collection/sync-status
syncRouter.get('/sync-status', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const [connection, latestJob] = await Promise.all([
      prisma.discogsConnection.findUnique({
        where: { userId: userId! },
        select: {
          syncStatus: true,
          lastSyncStartedAt: true,
          lastSyncCompletedAt: true,
        },
      }),
      prisma.syncJob.findFirst({
        where: { userId: userId! },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ connection, latestJob });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// GET /api/collection/sync-history
syncRouter.get('/sync-history', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const jobs = await prisma.syncJob.findMany({
      where: { userId: userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ jobs });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to get sync history' });
  }
});
