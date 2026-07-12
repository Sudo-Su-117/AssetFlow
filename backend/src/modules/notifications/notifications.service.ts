import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class NotificationsService {
  static async getNotifications(user: UserContext) {
    const { id: userId, role } = user;

    // Employees only see their own notifications.
    // Managers/Admins see all notifications for compliance visibility.
    const whereClause = role === 'EMPLOYEE' ? { userId } : {};

    return prisma.notification.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async markAsRead(user: UserContext, id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found.');
    }

    // Employees can only mark their own notifications as read.
    if (user.role === 'EMPLOYEE' && notification.userId !== user.id) {
      throw new Error('Forbidden: You can only read your own notifications.');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(user: UserContext) {
    const { id: userId, role } = user;

    const whereClause = role === 'EMPLOYEE' ? { userId, isRead: false } : { isRead: false };

    return prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true }
    });
  }

  static async getActivityLogs(user: UserContext) {
    const { id: userId, role, departmentId } = user;

    let whereClause = {};

    if (role === 'EMPLOYEE') {
      // Employees see logs they generated
      whereClause = { userId };
    } else if (role === 'DEPARTMENT_HEAD') {
      // Department Heads see logs of users in their department
      whereClause = {
        user: { departmentId }
      };
    }

    return prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
