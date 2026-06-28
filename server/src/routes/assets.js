import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import {
  listAssets,
  updateAsset,
  uploadImageHandler
} from '../controllers/assetController.js';

const router = Router();

// GET /api/assets  — public (needed to render landing page hero / menu banner)
router.get('/assets', listAssets);

// PATCH /api/assets/:key  — staff only
router.patch('/assets/:key', requireStaffPin, updateAsset);

// POST /api/uploads/image  — staff only, with stricter upload rate limit
router.post('/uploads/image', requireStaffPin, uploadLimiter, uploadImageHandler);

export default router;
