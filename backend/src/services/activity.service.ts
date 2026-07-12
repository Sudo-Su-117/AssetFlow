import prisma from '../db';
import { UserContext } from './analytics.service';

export class ActivityService {
  static async getRecentActivity(user: UserContext, limit = 20) {
    const { role, id: userId, departmentId } = user;

    if (role === 'ADMIN' || role === 'ASSET_MANAGER') {
      return prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    }

    if (role === 'DEPARTMENT_HEAD' && departmentId) {
      return prisma.activityLog.findMany({
        where: {
          user: {
            departmentId: departmentId
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    }

    // Default: EMPLOYEE (only logs related to themselves)
    return prisma.activityLog.findMany({
      where: {
        userId: userId
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }
}
