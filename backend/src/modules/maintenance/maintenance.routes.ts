import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all maintenance workflow paths
router.use(authMiddleware);

router.get('/maintenance', MaintenanceController.getMaintenanceRequests);
router.post('/maintenance', MaintenanceController.createRequest);
router.patch('/maintenance/:id/approve', MaintenanceController.approveRequest);
router.patch('/maintenance/:id/assign', MaintenanceController.assignTechnician);
router.patch('/maintenance/:id/start', MaintenanceController.startWork);
router.patch('/maintenance/:id/resolve', MaintenanceController.resolveRequest);

export default router;
