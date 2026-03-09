import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';
import { router } from './routes';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
