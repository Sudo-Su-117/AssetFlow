import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const list = await NotificationsService.getNotifications(req.user);
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.params;

      const updated = await NotificationsService.markAsRead(req.user, id);
      return res.json(updated);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      await NotificationsService.markAllAsRead(req.user);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to mark notifications read' });
    }
  }

  static async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const logs = await NotificationsService.getActivityLogs(req.user);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch activity logs' });
    }
  }
}
