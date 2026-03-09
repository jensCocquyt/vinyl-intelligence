import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { Prisma } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const collectionRouter = Router();

const VALID_SORT_FIELDS: Record<string, keyof Prisma.CollectionItemOrderByWithRelationInput> = {
  artist: 'artist',
  title: 'title',
  year: 'year',
  dateAdded: 'dateAdded',
};

// GET /api/collection
collectionRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const {
      search,
      genre,
      style,
      format,
      decade,
      country,
      sortBy = 'dateAdded',
      sortDirection = 'desc',
      page = '1',
      pageSize = '50',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = Math.min(parseInt(pageSize), 100);
    const dir = sortDirection === 'asc' ? 'asc' : 'desc';
    const sortField = VALID_SORT_FIELDS[sortBy] ?? 'dateAdded';

    const where: Prisma.CollectionItemWhereInput = {
      userId: userId!,
      isDeleted: false,
      ...(search && {
        OR: [
          { artist: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(country && { country }),
      ...(genre && { genres: { some: { genre } } }),
      ...(style && { styles: { some: { style } } }),
      ...(format && { formats: { some: { format } } }),
      ...(decade && {
        year: { gte: parseInt(decade), lt: parseInt(decade) + 10 },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.collectionItem.findMany({
        where,
        orderBy: { [sortField]: dir },
        skip,
        take,
        include: {
          genres: { select: { genre: true } },
          styles: { select: { style: true } },
          formats: { select: { format: true } },
          labels: { select: { label: true } },
          valueSnapshots: {
            orderBy: { capturedAt: 'desc' },
            take: 1,
            select: { medianValue: true, lowestPrice: true },
          },
        },
      }),
      prisma.collectionItem.count({ where }),
    ]);

    res.json({ items, total, page: parseInt(page), pageSize: take });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// GET /api/collection/:id
collectionRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const item = await prisma.collectionItem.findFirst({
      where: { id: req.params.id, userId: userId!, isDeleted: false },
      include: {
        genres: true,
        styles: true,
        formats: true,
        labels: true,
        valueSnapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});
