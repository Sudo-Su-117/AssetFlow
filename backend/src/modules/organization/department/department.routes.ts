import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authMiddleware } from '../../../middleware/auth';
import { adminOnly } from '../../../middleware/admin';

const router = Router();

// Apply auth and admin checks to all department master setup endpoints
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', DepartmentController.getDepartments);
router.post('/', DepartmentController.createDepartment);
router.put('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);
router.patch('/:id/status', DepartmentController.patchDepartmentStatus);

export default router;
