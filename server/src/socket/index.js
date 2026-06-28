/**
 * Sets up Socket.IO connection handling.
 *
 * Clients emit a 'subscribe' event with { role, floor, orderId } to join
 * targeted rooms so broadcasts can be scoped (e.g. floor-specific orders).
 */
export function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.on('subscribe', (subscription = {}) => {
      const role = subscription.role || 'guest';
      socket.join(`role:${role}`);
      if (subscription.floor) socket.join(`floor:${subscription.floor}`);
      if (subscription.orderId) socket.join(`order:${subscription.orderId}`);
    });
  });
}

/**
 * Safely emits a Socket.IO event. No-ops when io is null/undefined
 * (e.g. during tests or when the socket server is not initialised).
 */
export function emit(io, event, payload) {
  if (io) io.emit(event, payload);
}
