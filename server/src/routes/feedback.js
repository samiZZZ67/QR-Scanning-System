import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { submitFeedback, listFeedback } from '../controllers/feedbackController.js';

const router = Router();

// POST /api/orders/:id/feedback  — public (guests submit feedback after delivery)
router.post('/orders/:id/feedback', submitFeedback);

// GET /api/feedback  — staff only
router.get('/feedback', requireStaffPin, listFeedback);

export default router;
