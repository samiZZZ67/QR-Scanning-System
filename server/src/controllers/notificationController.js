import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * POST /api/service-notifications  (public)
 * Guest calls waiter or requests the bill. Fires a socket event for the dashboard.
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const row = await repository.createServiceNotification(req.body);
  // Re-fetch the mapped notification (SQLite returns the raw row)
  const notifications = await repository.listServiceNotifications();
  const notification = notifications.find((n) => n.id === row.id) || row;
  if (io) io.emit('serviceNotification.created', notification);
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
