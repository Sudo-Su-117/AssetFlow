import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth';
import { validateDashboardQuery } from './dashboard.validator';

const router = Router();

// GET /api/dashboard
router.get('/', authMiddleware, validateDashboardQuery, DashboardController.getDashboard);

export default router;
