import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ReportsService } from './reports.service';

export class ReportsController {
  static async getOverview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const overview = await ReportsService.getOverview(req.user);
      return res.json(overview);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message || 'Failed to generate report overview' });
    }
  }

  static async exportCSV(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const csv = await ReportsService.exportCSV(req.user);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assetflow_intelligence_report.csv');
      return res.status(200).send(csv);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message || 'Failed to export report' });
    }
  }
}
