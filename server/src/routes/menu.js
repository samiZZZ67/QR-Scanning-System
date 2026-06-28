import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import {
  getMenu,
  getItemReviews,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';
import {
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET /api/menu
router.get('/menu', getMenu);

// GET /api/menu-items/:id/reviews
router.get('/menu-items/:id/reviews', getItemReviews);

// ── Staff: menu items ─────────────────────────────────────────────────────────
// POST /api/menu-items
router.post('/menu-items', requireStaffPin, createMenuItem);

// PATCH /api/menu-items/:id
router.patch('/menu-items/:id', requireStaffPin, updateMenuItem);

// DELETE /api/menu-items/:id
router.delete('/menu-items/:id', requireStaffPin, deleteMenuItem);

// ── Staff: categories ─────────────────────────────────────────────────────────
// POST /api/categories
router.post('/categories', requireStaffPin, createCategory);

// PATCH /api/categories/:id
router.patch('/categories/:id', requireStaffPin, updateCategory);

// DELETE /api/categories/:id
router.delete('/categories/:id', requireStaffPin, deleteCategory);

export default router;
