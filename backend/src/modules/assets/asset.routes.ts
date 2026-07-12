import { Router } from 'express';
import { AssetController } from './asset.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Apply authentication to all asset operations
router.use(authMiddleware);

router.get('/', AssetController.getAssets);
router.get('/:id', AssetController.getAssetById);
router.post('/', AssetController.createAsset);
router.put('/:id', AssetController.updateAsset);
router.patch('/:id/status', AssetController.patchAssetStatus);
router.delete('/:id', AssetController.deleteAsset);

export default router;
