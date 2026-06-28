import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * POST /api/categories  (staff)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const category = await repository.createCategory(req.body);
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  res.status(201).json(category);
});

/**
 * PATCH /api/categories/:id  (staff)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const category = await repository.updateCategory(req.params.id, req.body);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  return res.json(category);
});

/**
 * DELETE /api/categories/:id  (staff)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { repository, io } = req.app.locals;
  const changes = await repository.deleteCategory(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Category not found' });
  if (io) io.emit('menu.changed', await repository.getMenu(true));
  return res.status(204).end();
});
