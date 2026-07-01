import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * POST /api/service-notifications  (public)
 * Guest calls waiter or requests the bill. Fires a socket event for the dashboard.
 */
export const createNotification = asyncHandler(async (req, res) => {
  // Reject call-waiter requests originating from the Kitchen role
  if (req.body?.type === 'call-waiter' && req.staff?.role === 'Kitchen') {
    return res.status(403).json({ error: 'Kitchen role is not allowed to call waiter.' });
  }

  const { repository, io } = req.app.locals;
  const row = await repository.createServiceNotification(req.body || {});
  // Re-fetch the mapped notification (SQLite returns the raw row)
  const notifications = await repository.listServiceNotifications();
  const notification = notifications.find((n) => n.id === row.id) || row;

  // Broadcast to all admin/waiter connections
  if (io) io.emit('serviceNotification.created', notification);

  // If a specific waiter was targeted by the kitchen, emit a dedicated event
  // to the waiter room so WaiterPage can distinguish it
  const targetWaiterName = req.body?.targetWaiterName;
  const targetWaiterId = req.body?.targetWaiterId;
  if (io && targetWaiterName) {
    io.to('role:waiter').emit('kitchenCallWaiter', {
      ...notification,
      targetWaiterName,
      targetWaiterId: targetWaiterId ? Number(targetWaiterId) : null,
    });
  }

  res.status(201).json(notification);
});

/**
 * GET /api/service-notifications  (staff)
 * Lists notifications, optionally filtered by floor and/or status.
 */
export const listNotifications = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(
    await repository.listServiceNotifications({
      floor: req.query.floor,
      status: req.query.status
    })
  );
});

/**
 * PATCH /api/service-notifications/:id/resolve  (staff)
 * Marks a notification as resolved and broadcasts the update.
 */
export const resolveNotification = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const notification = await repository.resolveServiceNotification(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (io) io.emit('serviceNotification.resolved', notification);
  return res.json(notification);
});

/**
 * POST /api/manager-notifications  (staff)
 * Staff member calls manager for assistance
 */
export const createManagerNotification = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const notification = await repository.createManagerNotification(req.body || {});
  if (io) io.emit('managerNotification.created', notification);
  res.status(201).json(notification);
});

/**
 * GET /api/manager-notifications  (admin)
 * Lists manager notifications, optionally filtered by status
 */
export const listManagerNotifications = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(
    await repository.listManagerNotifications({
      status: req.query.status
    })
  );
});

/**
 * PATCH /api/manager-notifications/:id/resolve  (admin)
 * Marks a manager notification as resolved and broadcasts the update
 */
export const resolveManagerNotification = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const notification = await repository.resolveManagerNotification(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (io) io.emit('managerNotification.resolved', notification);
  return res.json(notification);
});
