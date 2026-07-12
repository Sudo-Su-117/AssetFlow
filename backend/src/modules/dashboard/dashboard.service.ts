import { AnalyticsService, UserContext } from '../../services/analytics.service';
import { ActivityService } from '../../services/activity.service';
import { NotificationService } from '../../services/notification.service';

export class DashboardService {
  static async getDashboardData(user: UserContext) {
    const [kpis, alerts, recentActivity] = await Promise.all([
      AnalyticsService.getKPIs(user),
      NotificationService.getAlerts(user),
      ActivityService.getRecentActivity(user, 20)
    ]);

    // Define permitted Quick Actions based on roles
    let quickActions: string[] = [];
    
    if (user.role === 'ADMIN' || user.role === 'ASSET_MANAGER') {
      quickActions = ['REGISTER_ASSET', 'BOOK_RESOURCE', 'RAISE_MAINTENANCE', 'REQUEST_TRANSFER'];
    } else if (user.role === 'DEPARTMENT_HEAD') {
      quickActions = ['BOOK_RESOURCE', 'RAISE_MAINTENANCE', 'REQUEST_TRANSFER'];
    } else {
      quickActions = ['BOOK_RESOURCE', 'REQUEST_TRANSFER'];
    }

    return {
      kpis,
      alerts,
      quickActions,
      recentActivity
    };
  }
}
