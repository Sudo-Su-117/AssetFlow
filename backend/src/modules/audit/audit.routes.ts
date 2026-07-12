import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Secure all audit paths with authentication checkouts
router.use(authMiddleware);

router.get('/audits', AuditController.getAudits);
router.get('/audits/:id', AuditController.getAuditDetails);
router.post('/audits', AuditController.createAuditCycle);
router.patch('/audits/:id/assets/:assetId/verify', AuditController.verifyAsset);
router.patch('/audits/:id/close', AuditController.closeAuditCycle);

export default router;
