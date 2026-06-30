import { asyncHandler } from '../middlewares/asyncHandler.js';

export const listFloors = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listFloors(true));
});

export const addFloor = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const floor = await repository.createFloor(req.body);
  res.status(201).json(floor);
});

export const updateFloor = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const floor = await repository.updateFloor(req.params.id, req.body);
  if (!floor) return res.status(404).json({ error: 'Floor not found' });
  return res.json(floor);
});

export const deleteFloor = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const changes = await repository.deleteFloor(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Floor not found' });
  return res.status(204).end();
});

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

export const updateTable = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const table = await repository.updateTable(req.params.number, req.body);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  return res.json(table);
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

export const listRooms = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listRooms());
});

export const addRoom = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const room = await repository.addRoom(req.body);
  res.status(201).json(room);
});

export const updateRoom = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const room = await repository.updateRoom(req.params.id, req.body);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json(room);
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const changes = await repository.deleteRoom(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Room not found' });
  return res.status(204).end();
});

/**
 * GET /api/staff  (admin)
 * List all staff members
 */
export const listStaffMembers = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  res.json(await repository.listStaffMembers());
});

/**
 * POST /api/staff  (admin)
 * Create new staff member
 */
export const createStaffMember = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const staff = await repository.createStaffMember(req.body);
  res.status(201).json(staff);
});

/**
 * PATCH /api/staff/:id  (admin)
 * Update staff member
 */
export const updateStaffMember = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const staff = await repository.updateStaffMember(req.params.id, req.body);
  if (!staff) return res.status(404).json({ error: 'Staff member not found' });
  return res.json(staff);
});

/**
 * DELETE /api/staff/:id  (admin)
 * Delete/deactivate staff member
 */
export const deleteStaffMember = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const changes = await repository.deleteStaffMember(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Staff member not found' });
  return res.status(204).end();
});

/**
 * PATCH /api/staff/:id/online  (staff)
 * Set staff member online status
 */
export const setStaffOnline = asyncHandler(async (req, res) => {
  const { repository } = req.app.locals;
  const staff = await repository.setStaffOnline(req.params.id, req.body.online);
  if (!staff) return res.status(404).json({ error: 'Staff member not found' });
  return res.json(staff);
});
