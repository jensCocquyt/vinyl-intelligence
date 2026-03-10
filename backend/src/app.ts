import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';
import { router } from './routes';
import { requestId } from './middleware/requestId';

export const app = express();

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:4200',
      /\.vercel\.app$/,
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ ok: true, requestId: req.headers['x-request-id'] });
});
