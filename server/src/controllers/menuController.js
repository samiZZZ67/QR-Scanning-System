import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * GET /api/menu?includeUnavailable=1
 * Returns all categories and menu items. Staff can request unavailable items.
 */
export const getMenu = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const includeUnavailable =
    req.query.includeUnavailable === '1' || req.query.includeUnavailable === 'true';
  res.json(await repository.getMenu(includeUnavailable));
});

/**
 * GET /api/menu-items/:id/reviews
 * Returns the latest reviews for a specific menu item.
 */
export const getItemReviews = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const reviews = await repository.listMenuItemReviews(req.params.id);
  res.json(reviews);
});

/**
 * POST /api/menu-items  (staff)
 * Creates a new menu item and broadcasts a menu.changed socket event.
 */
export const createMenuItem = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const item = await repository.createMenuItem(req.body);
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  res.status(201).json(item);
});

/**
 * PATCH /api/menu-items/:id  (staff)
 */
export const updateMenuItem = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const item = await repository.updateMenuItem(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  return res.json(item);
});

/**
 * DELETE /api/menu-items/:id  (staff)
 */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const changes = await repository.deleteMenuItem(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Menu item not found' });
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  return res.status(204).end();
});
