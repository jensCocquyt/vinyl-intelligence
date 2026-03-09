import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Lazily ensure user record exists in DB
  prisma.user
    .upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    })
    .catch(() => {});

  next();
}
