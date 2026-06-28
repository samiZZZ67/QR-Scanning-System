import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import {
  createNotification,
  listNotifications,
  resolveNotification
} from '../controllers/notificationController.js';

const router = Router();

// POST /api/service-notifications  — public (guests call waiter / request bill)
router.post('/', createNotification);

// GET /api/service-notifications  — staff only
router.get('/', requireStaffPin, listNotifications);

// PATCH /api/service-notifications/:id/resolve  — staff only
router.patch('/:id/resolve', requireStaffPin, resolveNotification);

export default router;
