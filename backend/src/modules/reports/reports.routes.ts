import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Secure all analytical metrics routes with authentication checks
router.use(authMiddleware);

router.get('/reports/overview', ReportsController.getOverview);
router.get('/reports/export', ReportsController.exportCSV);

export default router;
