// Tracks live WebSocket connections per user so notifications can be pushed
// in real time. Kept as an in-memory map — for multi-instance deployments,
// back this with a pub/sub layer (e.g. Redis) so a notification created on
// instance A reaches a socket held open on instance B.
const connections = new Map(); // userId -> Set<ws>

export const registerConnection = (userId, ws) => {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(ws);
};

export const removeConnection = (userId, ws) => {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) connections.delete(userId);
};

export const broadcastToUser = (userId, payload) => {
  const set = connections.get(userId);
  if (!set || set.size === 0) return;
  const message = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
};
