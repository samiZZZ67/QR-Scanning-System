import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { createSession } from '../controllers/authController.js';

const router = Router();

// POST /api/staff/session
// authLimiter protects against brute force; createSession does constant-time PIN check.
router.post('/session', authLimiter, createSession);

export default router;
