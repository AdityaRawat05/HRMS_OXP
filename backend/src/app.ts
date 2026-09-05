import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

const app: Application = express();

// Security & Parsing Middleware
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Security Header Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API Routes
app.use('/api', apiRouter);

// Fallback & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
