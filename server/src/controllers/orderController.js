import { asyncHandler } from '../middlewares/asyncHandler.js';
import { notifyManager } from '../services/telegram.js';

/**
 * POST /api/orders  (public)
 * Creates an order, fires real-time events, and sends Telegram notification.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const order = await repository.createOrder(req.body);
  if (io) io.emit('order.created', order);
  notifyManager(order).catch((err) => console.warn('[Telegram]', err.message));
  res.status(201).json(order);
});

/**
 * GET /api/orders  (staff)
 * Returns orders filtered by floor, status, and/or active-only flag.
 */
export const listOrders = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const orders = await repository.listOrders({
    floor: req.query.floor,
    status: req.query.status,
    active: req.query.active === '1' || req.query.active === 'true'
  });
  res.json(orders);
});

/**
 * GET /api/orders/:id  (public)
 * Returns a single order so guests can track their order status.
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const order = await repository.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json(order);
});

/**
 * PATCH /api/orders/:id/status  (staff)
 * Advances an order through the status machine and broadcasts the change.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const order = await repository.updateOrderStatus(req.params.id, req.body.status);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (io) io.emit('order.statusChanged', order);
  return res.json(order);
});

/**
 * PATCH /api/orders/:id/notes  (staff)
 * Updates kitchen notes for an order and broadcasts the change.
 */
export const updateOrderNotes = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const order = await repository.updateOrderNotes(req.params.id, req.body.notes);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (io) io.emit('order.statusChanged', order);
  return res.json(order);
});
