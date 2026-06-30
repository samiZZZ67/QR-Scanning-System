import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import {
  listFloors,
  addFloor,
  updateFloor,
  deleteFloor,
  listTables,
  addTable,
  updateTable,
  deleteTable,
  listRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  listStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  setStaffOnline
} from '../controllers/tableController.js';

const router = Router();

// All table routes require staff authentication

// ─── Floors ───────────────────────────────────────────────────────────────────

// GET /api/tables/floors
router.get('/floors', requireStaffPin, listFloors);

// POST /api/tables/floors
router.post('/floors', requireStaffPin, addFloor);

// PATCH /api/tables/floors/:id
router.patch('/floors/:id', requireStaffPin, updateFloor);

// DELETE /api/tables/floors/:id
router.delete('/floors/:id', requireStaffPin, deleteFloor);

// ─── Tables ───────────────────────────────────────────────────────────────────

// GET /api/tables
router.get('/', requireStaffPin, listTables);

// POST /api/tables
router.post('/', requireStaffPin, addTable);

// PATCH /api/tables/:number
router.patch('/:number', requireStaffPin, updateTable);

// DELETE /api/tables/:number
router.delete('/:number', requireStaffPin, deleteTable);

// ─── Rooms ────────────────────────────────────────────────────────────────────

// GET /api/tables/rooms
router.get('/rooms', requireStaffPin, listRooms);

// POST /api/tables/rooms
router.post('/rooms', requireStaffPin, addRoom);

// PATCH /api/tables/rooms/:id
router.patch('/rooms/:id', requireStaffPin, updateRoom);

// DELETE /api/tables/rooms/:id
router.delete('/rooms/:id', requireStaffPin, deleteRoom);

// ─── Staff Management ──────────────────────────────────────────────────────────

// GET /api/staff
router.get('/staff', requireStaffPin, listStaffMembers);

// POST /api/staff
router.post('/staff', requireStaffPin, createStaffMember);

// PATCH /api/staff/:id
router.patch('/staff/:id', requireStaffPin, updateStaffMember);

// PATCH /api/staff/:id/online
router.patch('/staff/:id/online', requireStaffPin, setStaffOnline);

// DELETE /api/staff/:id
router.delete('/staff/:id', requireStaffPin, deleteStaffMember);

export default router;
