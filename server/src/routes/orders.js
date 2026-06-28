import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = Router();

// POST /api/orders  — public (guests place orders)
router.post('/', createOrder);

// GET /api/orders  — staff only
router.get('/', requireStaffPin, listOrders);

// GET /api/orders/:id  — public (guests track their order)
router.get('/:id', getOrder);

// PATCH /api/orders/:id/status  — staff only
router.patch('/:id/status', requireStaffPin, updateOrderStatus);

export default router;
