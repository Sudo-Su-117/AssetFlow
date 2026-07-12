import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authMiddleware } from '../../../middleware/auth';
import { adminOnly } from '../../../middleware/admin';

const router = Router();

// Apply auth and admin check to all category master setup endpoints
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', CategoryController.getCategories);
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);
router.patch('/:id/status', CategoryController.patchCategoryStatus);

export default router;
