import { Router } from 'express';
import { requireStaffPin } from '../middlewares/auth.js';
import { getTodayReport, getRangeReport } from '../controllers/reportController.js';

const router = Router();

// All report routes require staff authentication

// GET /api/reports/today
router.get('/today', requireStaffPin, getTodayReport);

// GET /api/reports/range?range=daily|weekly|monthly|yearly&from=&to=
router.get('/range', requireStaffPin, getRangeReport);

export default router;
