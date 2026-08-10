import admin from 'firebase-admin';
import { config } from './env.js';

let firebaseApp = null;
let attempted = false;

/**
 * Lazily initializes firebase-admin only if credentials are configured.
 * Push notifications are an enhancement, not a hard dependency — the API
 * must keep working in environments where FCM isn't set up yet.
 */
export const getFirebaseApp = () => {
  if (firebaseApp || attempted) return firebaseApp;
  attempted = true;

  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  return firebaseApp;
};

export default admin;
