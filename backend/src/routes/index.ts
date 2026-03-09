import { Router } from 'express';
import { discogsRouter } from './discogs';
import { syncRouter } from './sync';
import { dashboardRouter } from './dashboard';
import { collectionRouter } from './collection';

export const router = Router();

router.use('/discogs', discogsRouter);
router.use('/collection', collectionRouter);
router.use('/collection', syncRouter);
router.use('/dashboard', dashboardRouter);
