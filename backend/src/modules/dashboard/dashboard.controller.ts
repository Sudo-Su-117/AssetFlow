import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: User context missing' });
      }

      const dashboardData = await DashboardService.getDashboardData(req.user);
      return res.json(dashboardData);
    } catch (error) {
      console.error('DashboardController Error:', error);
      return res.status(500).json({ error: 'Internal Server Error fetching dashboard analytics' });
    }
  }
}
