import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { MaintenanceService } from './maintenance.service';

export class MaintenanceController {
  static async getMaintenanceRequests(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const list = await MaintenanceService.getMaintenanceRequests(req.user);
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch maintenance requests' });
    }
  }

  static async createRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { assetId, description } = req.body;
      if (!assetId || !description) {
        return res.status(400).json({ error: 'Asset and Issue Description are required.' });
      }

      const request = await MaintenanceService.createRequest(req.user, req.body);
      return res.status(201).json(request);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async approveRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const request = await MaintenanceService.approveRequest(req.user, id);
      return res.json(request);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async assignTechnician(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { assignedTechnician } = req.body;
      
      if (!assignedTechnician) {
        return res.status(400).json({ error: 'Technician name is required.' });
      }

      const request = await MaintenanceService.assignTechnician(req.user, id, req.body);
      return res.json(request);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async startWork(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const request = await MaintenanceService.startWork(req.user, id);
      return res.json(request);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async resolveRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;
      const { resolutionNotes } = req.body;

      if (!resolutionNotes) {
        return res.status(400).json({ error: 'Resolution notes are required to resolve request.' });
      }

      const request = await MaintenanceService.resolveRequest(req.user, id, req.body);
      return res.json(request);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
