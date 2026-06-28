import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { grokText, grokImage } from '../controllers/aiController.js';

const router = Router();

// All AI routes require staff authentication

// POST /api/ai/grok
router.post('/grok', requireStaffPin, grokText);

// POST /api/ai/grok/image
router.post('/grok/image', requireStaffPin, grokImage);

export default router;
