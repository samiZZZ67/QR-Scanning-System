import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { listTables, addTable, deleteTable } from '../controllers/tableController.js';

const router = Router();

// All table routes require staff authentication

// GET /api/tables
router.get('/', requireStaffPin, listTables);

// POST /api/tables
router.post('/', requireStaffPin, addTable);

// DELETE /api/tables/:number
router.delete('/:number', requireStaffPin, deleteTable);

export default router;
