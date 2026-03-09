import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { requireAuth } from '../middleware/auth';
import { DiscogsService } from '../services/discogs.service';
import { prisma } from '../lib/prisma';

export const discogsRouter = Router();

const discogsService = new DiscogsService();

// POST /api/discogs/connect/start
discogsRouter.post('/connect/start', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { authorizeUrl } = await discogsService.getRequestToken(userId!);
    res.json({ authorizeUrl });
  } catch (_err) {
    console.error('OAuth start error:', _err);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

// GET /api/discogs/connect/callback
discogsRouter.get('/connect/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query as Record<string, string>;
  try {
    await discogsService.handleCallback(oauth_token, oauth_verifier);
    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=true`);
  } catch (_err) {
    console.error('OAuth callback error:', _err);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=connection_failed`);
  }
});

// GET /api/discogs/connection
discogsRouter.get('/connection', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const connection = await prisma.discogsConnection.findUnique({
      where: { userId: userId! },
      select: {
        discogsUsername: true,
        connectedAt: true,
        lastSyncStartedAt: true,
        lastSyncCompletedAt: true,
        syncStatus: true,
      },
    });
    res.json({ connection });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to get connection' });
  }
});

// DELETE /api/discogs/connection
discogsRouter.delete('/connection', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    await prisma.discogsConnection.deleteMany({ where: { userId: userId! } });
    res.json({ ok: true });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});
