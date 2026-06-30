import { Router } from 'express';
import authRoutes from './auth.js';
import menuRoutes from './menu.js';
import orderRoutes from './orders.js';
import tableRoutes from './tables.js';
import feedbackRoutes from './feedback.js';
import notificationRoutes from './notifications.js';
import reportRoutes from './reports.js';
import assetRoutes from './assets.js';
import aiRoutes from './ai.js';
import { requireStaffPin } from '../middlewares/auth.js';
import {
  createManagerNotification,
  listManagerNotifications,
  resolveManagerNotification
} from '../controllers/notificationController.js';

const router = Router();

// POST /api/staff/session
router.use('/staff', authRoutes);

// GET /api/menu, CRUD /api/menu-items, CRUD /api/categories
router.use('/', menuRoutes);

// CRUD /api/orders + /api/orders/:id/status
router.use('/orders', orderRoutes);

// CRUD /api/tables, floors, rooms, staff
router.use('/tables', tableRoutes);

// POST /api/orders/:id/feedback, GET /api/feedback
router.use('/', feedbackRoutes);

// CRUD /api/service-notifications
router.use('/service-notifications', notificationRoutes);

// Manager notifications (staff calls manager)
router.post('/manager-notifications', requireStaffPin, createManagerNotification);
router.get('/manager-notifications', requireStaffPin, listManagerNotifications);
router.patch('/manager-notifications/:id/resolve', requireStaffPin, resolveManagerNotification);

// GET /api/reports/today, GET /api/reports/range
router.use('/reports', reportRoutes);

// GET /api/assets, PATCH /api/assets/:key, POST /api/uploads/image
router.use('/', assetRoutes);

// POST /api/ai/groq, POST /api/ai/groq/image
router.use('/ai', aiRoutes);

export default router;
