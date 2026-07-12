import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from './audit.service';

export class AuditController {
  static async getAudits(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await AuditService.getAudits();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch audit cycles' });
    }
  }

  static async getAuditDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const details = await AuditService.getAuditDetails(id);
      return res.json(details);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch audit details' });
    }
  }

  static async createAuditCycle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Creating audit cycles restricted to Admin/Asset Manager
      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { title, departmentId, startDate, endDate, assignedAuditors } = req.body;
      if (!title || !departmentId || !startDate || !endDate || !assignedAuditors) {
        return res.status(400).json({ error: 'Title, Department, Scope Dates, and Auditors are required.' });
      }

      const cycle = await AuditService.createAuditCycle(req.user, req.body);
      return res.status(201).json(cycle);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async verifyAsset(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id, assetId } = req.params;
      const { verificationStatus } = req.body;

      if (!verificationStatus) {
        return res.status(400).json({ error: 'Verification status rating is required.' });
      }

      const record = await AuditService.verifyAsset(req.user, id, assetId, req.body);
      return res.json(record);
    } catch (err: any) {
      if (err.message.includes('Conflict')) {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async closeAuditCycle(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      // Closing audit cycle restricted to Admin/Asset Manager
      if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Admin or Asset Manager privileges required.' });
      }

      const { id } = req.params;
      const cycle = await AuditService.closeAuditCycle(req.user, id);
      return res.json(cycle);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
