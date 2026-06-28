import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * GET /api/tables  (staff)
 */
export const listTables = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listTables());
});

/**
 * POST /api/tables  (staff)
 * Adds a new table; the floor is derived automatically from the table number.
 */
export const addTable = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const table = await repository.addTable(req.body);
  res.status(201).json(table);
});

/**
 * DELETE /api/tables/:number  (staff)
 */
export const deleteTable = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const changes = await repository.deleteTable(req.params.number);
  if (!changes) return res.status(404).json({ error: 'Table not found' });
  return res.status(204).end();
});
