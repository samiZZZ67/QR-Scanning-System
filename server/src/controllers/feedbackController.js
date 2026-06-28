import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * POST /api/orders/:id/feedback  (public)
 * Submits guest feedback for a delivered order. Also writes per-item reviews
 * and broadcasts multiple socket events so the dashboard updates live.
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const feedback = await repository.submitOrderFeedback(req.params.id, req.body);
  if (!feedback) return res.status(404).json({ error: 'Order not found' });

  // Broadcast all affected resources
  if (io) {
    const order = await repository.getOrder(req.params.id);
    io.emit('feedback.created', feedback);
    io.emit('order.statusChanged', order);
    io.emit('menu.changed', await repository.getMenu(true));
  }

  return res.status(201).json(feedback);
});

/**
 * GET /api/feedback  (staff)
 * Lists recent order feedback, newest first.
 */
export const listFeedback = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listFeedback({ limit: req.query.limit }));
});
