import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authMiddleware } from '../../../middleware/auth';
import { adminOnly } from '../../../middleware/admin';

const router = Router();

// Apply auth and admin checks to all employee directory operations
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', EmployeeController.getEmployees);
router.put('/:id', EmployeeController.updateEmployee);
router.patch('/:id/role', EmployeeController.patchEmployeeRole);
router.patch('/:id/status', EmployeeController.patchEmployeeStatus);

export default router;
