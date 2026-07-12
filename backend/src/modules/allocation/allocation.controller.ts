import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AllocationService } from './allocation.service';
import { TransferService } from './transfer.service';

export class AllocationController {
  // -------------------------------------------------------------
  // Allocations
  // -------------------------------------------------------------
  static async getAllocations(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await AllocationService.getAllocations();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch allocations' });
    }
  }

  static async getAllocationDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { assetId } = req.params;
      const details = await AllocationService.getAllocationDetails(assetId);
      return res.json(details);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch allocation details' });
    }
  }

  static async createAllocation(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Only Admin or Asset Manager can directly allocate assets
      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { assetId, userId } = req.body;
      if (!assetId || !userId) {
        return res.status(400).json({ error: 'Asset ID and Target Employee ID are required.' });
      }

      const allocation = await AllocationService.createAllocation(req.user, req.body);
      return res.status(201).json(allocation);
    } catch (err: any) {
      if (err.code === 'CONFLICT') {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async returnAsset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Admin or Asset Manager can check back in assets
      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { id } = req.params;
      const { conditionAtReturn } = req.body;
      if (!conditionAtReturn) {
        return res.status(400).json({ error: 'Condition rating is required during returns check-in.' });
      }

      const allocation = await AllocationService.returnAsset(req.user, id, req.body);
      return res.json(allocation);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // -------------------------------------------------------------
  // Transfers
  // -------------------------------------------------------------
  static async getTransfers(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await TransferService.getTransfers();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch transfers' });
    }
  }

  static async createTransferRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { assetId, toUserId } = req.body;
      if (!assetId || !toUserId) {
        return res.status(400).json({ error: 'Asset ID and Target Employee ID are required.' });
      }

      const transfer = await TransferService.createTransferRequest(req.user, req.body);
      return res.status(201).json(transfer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async approveTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const transfer = await TransferService.approveTransfer(req.user, id);
      return res.json(transfer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async rejectTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const transfer = await TransferService.rejectTransfer(req.user, id);
      return res.json(transfer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
