import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(`[config] Missing environment variables: ${missing.join(', ')}`);
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || '*',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
    presignExpiresSeconds: Number(process.env.AWS_S3_PRESIGN_EXPIRES_SECONDS) || 300,
  },

  // Used automatically whenever AWS_S3_BUCKET / AWS credentials are not set —
  // see src/services/storage.service.js. Lets uploads work in local dev, or
  // as an emergency fallback if the S3 bucket/credentials expire.
  localStorage: {
    dir: process.env.LOCAL_STORAGE_DIR || 'storage/uploads',
    baseUrl: process.env.LOCAL_STORAGE_BASE_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
    presignExpiresSeconds: Number(process.env.LOCAL_STORAGE_PRESIGN_EXPIRES_SECONDS) || 300,
    uploadSecret: process.env.LOCAL_STORAGE_UPLOAD_SECRET || process.env.JWT_ACCESS_SECRET || 'unny-local-storage-dev-secret',
    maxUploadMb: Number(process.env.LOCAL_STORAGE_MAX_UPLOAD_MB) || 25,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
  },
};
