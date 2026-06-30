import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { groqText, groqImage } from '../controllers/aiController.js';

const router = Router();

// All AI routes require staff authentication

// POST /api/ai/groq
router.post('/groq', requireStaffPin, groqText);

// POST /api/ai/groq/image
router.post('/groq/image', requireStaffPin, groqImage);

export default router;
