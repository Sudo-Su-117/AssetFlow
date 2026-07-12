import prisma from '../db';
import { UserContext } from './analytics.service';

export interface AlertItem {
  type: string;
  count: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export class NotificationService {
  static async getAlerts(user: UserContext): Promise<AlertItem[]> {
    const { role, id: userId, departmentId } = user;
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const alerts: AlertItem[] = [];

    if (role === 'ADMIN' || role === 'ASSET_MANAGER') {
      const [overdueCount, pendingTransfersCount, maintenanceCount] = await Promise.all([
        // Overdue returns
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            expectedReturnDate: { lt: now }
          }
        }),
        // Pending transfers
        prisma.transfer.count({
          where: {
            status: 'PENDING'
          }
        }),
        // Maintenance due today or overdue
        prisma.maintenance.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledFor: { lte: endOfToday }
          }
        })
      ]);

      if (overdueCount > 0) {
        alerts.push({
          type: 'OVERDUE_RETURN',
          count: overdueCount,
          severity: 'HIGH',
          message: `${overdueCount} asset${overdueCount > 1 ? 's are' : ' is'} overdue for return.`
        });
      }

      if (pendingTransfersCount > 0) {
        alerts.push({
          type: 'PENDING_TRANSFER',
          count: pendingTransfersCount,
          severity: 'MEDIUM',
          message: `${pendingTransfersCount} transfer request${pendingTransfersCount > 1 ? 's are' : ' is'} pending approval.`
        });
      }

      if (maintenanceCount > 0) {
        alerts.push({
          type: 'MAINTENANCE_DUE',
          count: maintenanceCount,
          severity: 'HIGH',
          message: `${maintenanceCount} maintenance task${maintenanceCount > 1 ? 's require' : ' requires'} attention today.`
        });
      }
    } 
    
    else if (role === 'DEPARTMENT_HEAD' && departmentId) {
      const [overdueCount, pendingTransfersCount, maintenanceCount] = await Promise.all([
        // Overdue in department
        prisma.asset.count({
          where: {
            departmentId,
            status: 'ALLOCATED',
            expectedReturnDate: { lt: now }
          }
        }),
        // Pending transfers involving department
        prisma.transfer.count({
          where: {
            status: 'PENDING',
            OR: [
              { fromDepartmentId: departmentId },
              { toDepartmentId: departmentId }
            ]
          }
        }),
        // Maintenance in department
        prisma.maintenance.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledFor: { lte: endOfToday },
            asset: { departmentId }
          }
        })
      ]);

      if (overdueCount > 0) {
        alerts.push({
          type: 'OVERDUE_RETURN',
          count: overdueCount,
          severity: 'HIGH',
          message: `${overdueCount} department asset${overdueCount > 1 ? 's are' : ' is'} overdue for return.`
        });
      }

      if (pendingTransfersCount > 0) {
        alerts.push({
          type: 'PENDING_TRANSFER',
          count: pendingTransfersCount,
          severity: 'MEDIUM',
          message: `${pendingTransfersCount} department transfer request${pendingTransfersCount > 1 ? 's are' : ' is'} pending.`
        });
      }

      if (maintenanceCount > 0) {
        alerts.push({
          type: 'MAINTENANCE_DUE',
          count: maintenanceCount,
          severity: 'HIGH',
          message: `${maintenanceCount} department maintenance task${maintenanceCount > 1 ? 's require' : ' requires'} attention.`
        });
      }
    } 
    
    else {
      // Default: EMPLOYEE (personal scope)
      const [overdueCount, pendingTransfersCount, maintenanceCount] = await Promise.all([
        // Personal overdue
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            allocations: {
              some: {
                userId,
                returnedAt: null
              }
            },
            expectedReturnDate: { lt: now }
          }
        }),
        // Personal requested transfers
        prisma.transfer.count({
          where: {
            status: 'PENDING',
            requestedById: userId
          }
        }),
        // Maintenance on user's allocated assets
        prisma.maintenance.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledFor: { lte: endOfToday },
            asset: {
              allocations: {
                some: {
                  userId,
                  returnedAt: null
                }
              }
            }
          }
        })
      ]);

      if (overdueCount > 0) {
        alerts.push({
          type: 'OVERDUE_RETURN',
          count: overdueCount,
          severity: 'HIGH',
          message: `You have ${overdueCount} overdue asset${overdueCount > 1 ? 's' : ''} to return.`
        });
      }

      if (pendingTransfersCount > 0) {
        alerts.push({
          type: 'PENDING_TRANSFER',
          count: pendingTransfersCount,
          severity: 'LOW',
          message: `You have ${pendingTransfersCount} transfer request${pendingTransfersCount > 1 ? 's' : ''} pending.`
        });
      }

      if (maintenanceCount > 0) {
        alerts.push({
          type: 'MAINTENANCE_DUE',
          count: maintenanceCount,
          severity: 'MEDIUM',
          message: `An asset currently allocated to you has scheduled maintenance today.`
        });
      }
    }

    return alerts;
  }
}
