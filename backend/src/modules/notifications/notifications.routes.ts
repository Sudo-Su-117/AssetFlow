import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Secure all paths under authentication middleware
router.use(authMiddleware);

router.get('/notifications', NotificationsController.getNotifications);
router.patch('/notifications/read-all', NotificationsController.markAllAsRead);
router.patch('/notifications/:id/read', NotificationsController.markAsRead);
router.get('/activity', NotificationsController.getActivityLogs);

export default router;
