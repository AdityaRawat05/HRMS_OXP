import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`==================================================`);
  console.log(`  PeoplePay360 Backend API Server Running`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  URL: http://localhost:${env.PORT}`);
  console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
  console.log(`==================================================`);
});

process.on('unhandledRejection', (reason: Error) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Uncaught Exception]', error);
  process.exit(1);
});

export default server;
