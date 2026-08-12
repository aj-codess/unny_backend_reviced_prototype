import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import router from './routes/index.js';
import localStorageRoutes from './routes/local-storage.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', env: config.env }));

// Signed-URL file transfer endpoint used only when S3 isn't configured —
// see src/services/storage.service.js. Lives outside /api/v1 since, like an
// S3 presigned URL, access is controlled by the signature in the query
// string rather than a Bearer token.
app.use('/local-storage', localStorageRoutes);

app.use('/api/v1', router);

app.use(notFound);
app.use(errorHandler);

export default app;
