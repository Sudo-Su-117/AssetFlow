import { Router } from 'express';
import { AllocationController } from './allocation.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Secure all routes with authentication middleware
router.use(authMiddleware);

// Direct Allocation Endpoints
router.get('/allocations', AllocationController.getAllocations);
router.get('/allocations/asset/:assetId', AllocationController.getAllocationDetails);
router.post('/allocations', AllocationController.createAllocation);
router.patch('/allocations/:id/return', AllocationController.returnAsset);

// Transfer Request Endpoints
router.get('/transfers', AllocationController.getTransfers);
router.post('/transfers', AllocationController.createTransferRequest);
router.patch('/transfers/:id/approve', AllocationController.approveTransfer);
router.patch('/transfers/:id/reject', AllocationController.rejectTransfer);

export default router;
