import { WebSocketServer } from 'ws';
import { verifyAccessToken } from '../utils/jwt.js';
import { registerConnection, removeConnection } from '../services/websocket.service.js';
import { logger } from '../utils/logger.js';

/**
 * Real-time channel for notifications (submission received, review decision,
 * collaboration/supervision invites). Clients connect to:
 *   wss://<host>/ws?token=<accessToken>
 */
export const initWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let userId;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      ws.close(4001, 'Invalid or expired token');
      return;
    }

    registerConnection(userId, ws);
    ws.send(JSON.stringify({ event: 'connected', userId }));

    ws.on('close', () => removeConnection(userId, ws));
    ws.on('error', (err) => logger.error('WebSocket error', err.message));
  });

  logger.info('WebSocket server attached at /ws');
  return wss;
};
