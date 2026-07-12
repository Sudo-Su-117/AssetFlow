import prisma from '../db';

export interface UserContext {
  id: string;
  role: string;
  departmentId: string | null;
}

export class AnalyticsService {
  static async getKPIs(user: UserContext) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const { role, id: userId, departmentId } = user;

    if (role === 'ADMIN' || role === 'ASSET_MANAGER') {
      const [
        availableAssets,
        allocatedAssets,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns,
        overdueAssets
      ] = await Promise.all([
        // Available Assets
        prisma.asset.count({ where: { status: 'AVAILABLE' } }),
        
        // Allocated Assets
        prisma.asset.count({ where: { status: 'ALLOCATED' } }),
        
        // Maintenance Today: maintenance scheduled/created for today or asset is under maintenance
        prisma.maintenance.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledFor: { gte: startOfToday, lte: endOfToday }
          }
        }),

        // Active Bookings
        prisma.booking.count({ where: { status: 'ACTIVE' } }),

        // Pending Transfers
        prisma.transfer.count({ where: { status: 'PENDING' } }),

        // Upcoming Returns: expected return date is in the future
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            expectedReturnDate: { gt: now }
          }
        }),

        // Overdue Returns: expected return date in the past
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            expectedReturnDate: { lt: now }
          }
        })
      ]);

      return {
        availableAssets,
        allocatedAssets,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns: upcomingReturns + overdueAssets, // Total upcoming return trackers (or just upcoming returns in future)
        overdueAssets // Extra count to help with detail screens
      };
    } 
    
    if (role === 'DEPARTMENT_HEAD' && departmentId) {
      const [
        availableAssets,
        allocatedAssets,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns,
        overdueAssets
      ] = await Promise.all([
        // Department Available Assets
        prisma.asset.count({ where: { status: 'AVAILABLE', departmentId } }),

        // Department Allocated Assets
        prisma.asset.count({ where: { status: 'ALLOCATED', departmentId } }),

        // Department Maintenance Today
        prisma.maintenance.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            scheduledFor: { gte: startOfToday, lte: endOfToday },
            asset: { departmentId }
          }
        }),

        // Active Bookings for Department Assets
        prisma.booking.count({
          where: {
            status: 'ACTIVE',
            asset: { departmentId }
          }
        }),

        // Pending Transfers involving Department
        prisma.transfer.count({
          where: {
            status: 'PENDING',
            OR: [
              { fromDepartmentId: departmentId },
              { toDepartmentId: departmentId }
            ]
          }
        }),

        // Upcoming Returns in Department
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            departmentId,
            expectedReturnDate: { gt: now }
          }
        }),

        // Overdue Returns in Department
        prisma.asset.count({
          where: {
            status: 'ALLOCATED',
            departmentId,
            expectedReturnDate: { lt: now }
          }
        })
      ]);

      return {
        availableAssets,
        allocatedAssets,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns: upcomingReturns + overdueAssets,
        overdueAssets
      };
    }

    // Default to EMPLOYEE role (personal data scope)
    const deptId = departmentId || '';
    const [
      availableAssets, // Can view department's available assets to know what they can request
      allocatedAssets, // Allocated specifically to this employee
      maintenanceToday, // Maintenance on assets allocated to this employee
      activeBookings, // Bookings made by this employee
      pendingTransfers, // Transfers requested by this employee
      upcomingReturns, // Upcoming returns for this employee
      overdueAssets // Overdue returns for this employee
    ] = await Promise.all([
      prisma.asset.count({ where: { status: 'AVAILABLE', departmentId: deptId } }),
      
      prisma.asset.count({
        where: {
          status: 'ALLOCATED',
          allocations: {
            some: {
              userId: userId,
              returnedAt: null
            }
          }
        }
      }),

      prisma.maintenance.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          scheduledFor: { gte: startOfToday, lte: endOfToday },
          asset: {
            allocations: {
              some: {
                userId: userId,
                returnedAt: null
              }
            }
          }
        }
      }),

      prisma.booking.count({
        where: {
          status: 'ACTIVE',
          userId: userId
        }
      }),

      prisma.transfer.count({
        where: {
          status: 'PENDING',
          requestedById: userId
        }
      }),

      prisma.asset.count({
        where: {
          status: 'ALLOCATED',
          allocations: {
            some: {
              userId: userId,
              returnedAt: null
            }
          },
          expectedReturnDate: { gt: now }
        }
      }),

      prisma.asset.count({
        where: {
          status: 'ALLOCATED',
          allocations: {
            some: {
              userId: userId,
              returnedAt: null
            }
          },
          expectedReturnDate: { lt: now }
        }
      })
    ]);

    return {
      availableAssets,
      allocatedAssets,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns: upcomingReturns + overdueAssets,
      overdueAssets
    };
  }
}
