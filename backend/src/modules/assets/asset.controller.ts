import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AssetService } from './asset.service';

export class AssetController {
  static async getAssets(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { search, category, status, department } = req.query;
      const list = await AssetService.getAssets(req.user, {
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' ? category : undefined,
        status: typeof status === 'string' ? status : undefined,
        department: typeof department === 'string' ? department : undefined
      });

      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch assets' });
    }
  }

  static async getAssetById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const asset = await AssetService.getAssetById(id);
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      return res.json(asset);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch asset details' });
    }
  }

  static async createAsset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Restrict write access to Admin or Asset Manager
      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { name, categoryId } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Asset name is required.' });
      }
      if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        return res.status(400).json({ error: 'Category ID is required.' });
      }

      const asset = await AssetService.createAsset(req.user, req.body);
      return res.status(201).json(asset);
    } catch (err: any) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: err.message || 'Duplicate unique field (e.g. Serial Number).' });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateAsset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { id } = req.params;
      const { name, categoryId } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Asset name is required.' });
      }
      if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        return res.status(400).json({ error: 'Category ID is required.' });
      }

      const asset = await AssetService.updateAsset(id, req.body);
      return res.json(asset);
    } catch (err: any) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: err.message || 'Duplicate Serial Number.' });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async patchAssetStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required.' });
      }

      const asset = await AssetService.patchStatus(id, status);
      return res.json(asset);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteAsset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { id } = req.params;
      await AssetService.deleteAsset(id);
      return res.json({ message: 'Asset record deleted successfully' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
