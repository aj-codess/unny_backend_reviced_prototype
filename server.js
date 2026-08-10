import http from 'http';
import app from './src/app.js';
import prisma from './src/config/db.js';
import { config } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { initWebSocketServer } from './src/sockets/index.js';

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(config.port, () => {
  logger.info(`Unny API listening on port ${config.port} [${config.env}]`);
});

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
