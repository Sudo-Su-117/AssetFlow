import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class MaintenanceService {
  static async getMaintenanceRequests(user: UserContext) {
    const { role, id: userId, departmentId } = user;

    if (role === 'ADMIN' || role === 'ASSET_MANAGER') {
      return prisma.maintenance.findMany({
        include: {
          asset: true,
          requestedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (role === 'DEPARTMENT_HEAD' && departmentId) {
      return prisma.maintenance.findMany({
        where: {
          asset: { departmentId }
        },
        include: {
          asset: true,
          requestedBy: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Employees only see their own requested maintenance tickets
    return prisma.maintenance.findMany({
      where: { requestedById: userId },
      include: {
        asset: true,
        requestedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createRequest(
    user: UserContext,
    data: {
      assetId: string;
      description: string;
      priority?: string;
    }
  ) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new Error('Asset not found.');
    }

    const request = await prisma.maintenance.create({
      data: {
        assetId: data.assetId,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'PENDING',
        requestedById: user.id
      },
      include: {
        asset: true
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        message: `Maintenance request created for ${request.asset.name} (${request.asset.assetTag}).`,
        type: 'GENERAL'
      }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'MAINTENANCE_CREATED',
        message: `Maintenance request created for ${request.asset.name} (${request.asset.assetTag}).`,
        userId: user.id
      }
    });

    return request;
  }

  static async approveRequest(user: UserContext, id: string) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const request = await prisma.maintenance.findUnique({ where: { id } });
    if (!request) {
      throw new Error('Maintenance request not found.');
    }
    if (request.status !== 'PENDING') {
      throw new Error('Only PENDING requests can be approved.');
    }

    const approved = await prisma.$transaction(async (tx) => {
      // 1. Move card to APPROVED
      const updated = await tx.maintenance.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        },
        include: { asset: true }
      });

      // 2. Change Asset status to UNDER_MAINTENANCE (downtime starts)
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: 'UNDER_MAINTENANCE' }
      });

      return updated;
    });

    // Create Notification for requester if exists
    if (approved.requestedById) {
      await prisma.notification.create({
        data: {
          userId: approved.requestedById,
          message: `Maintenance request approved for ${approved.asset.name} (${approved.asset.assetTag}). Asset is now under maintenance.`,
          type: 'GENERAL'
        }
      });
    }

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'MAINTENANCE_CREATED',
        message: `Maintenance approved for ${approved.asset.name} (${approved.asset.assetTag}).`,
        userId: user.id
      }
    });

    return approved;
  }

  static async assignTechnician(
    user: UserContext,
    id: string,
    data: {
      assignedTechnician: string;
      cost?: number;
    }
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const request = await prisma.maintenance.findUnique({ where: { id } });
    if (!request) {
      throw new Error('Maintenance request not found.');
    }
    
    if (request.status !== 'APPROVED') {
      throw new Error('Requests must be APPROVED before technician assignment.');
    }

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        assignedTechnician: data.assignedTechnician,
        cost: data.cost !== undefined ? parseFloat(data.cost as any) : request.cost
      },
      include: { asset: true }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'MAINTENANCE_CREATED',
        message: `Technician ${data.assignedTechnician} assigned to repair for ${updated.asset.name} (${updated.asset.assetTag}).`,
        userId: user.id
      }
    });

    return updated;
  }

  static async startWork(user: UserContext, id: string) {
    const request = await prisma.maintenance.findUnique({ where: { id } });
    if (!request) {
      throw new Error('Maintenance request not found.');
    }

    if (request.status !== 'TECHNICIAN_ASSIGNED') {
      throw new Error('Only requests in TECHNICIAN_ASSIGNED status can move to IN_PROGRESS.');
    }

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      },
      include: { asset: true }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'MAINTENANCE_CREATED',
        message: `Work started on ${updated.asset.name} (${updated.asset.assetTag}).`,
        userId: user.id
      }
    });

    return updated;
  }

  static async resolveRequest(
    user: UserContext,
    id: string,
    data: {
      resolutionNotes: string;
      finalCondition?: string;
      cost?: number;
    }
  ) {
    const request = await prisma.maintenance.findUnique({ where: { id } });
    if (!request) {
      throw new Error('Maintenance request not found.');
    }

    if (request.status !== 'IN_PROGRESS') {
      throw new Error('Only requests currently IN_PROGRESS can be resolved.');
    }

    if (!data.resolutionNotes || !data.resolutionNotes.trim()) {
      throw new Error('Resolution notes are mandatory during closure.');
    }

    const resolved = await prisma.$transaction(async (tx) => {
      // 1. Mark request as RESOLVED
      const updated = await tx.maintenance.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNotes: data.resolutionNotes.trim(),
          cost: data.cost !== undefined ? parseFloat(data.cost as any) : request.cost
        },
        include: { asset: true }
      });

      // 2. Transition Asset back to AVAILABLE, and update condition rating
      await tx.asset.update({
        where: { id: request.assetId },
        data: { 
          status: 'AVAILABLE',
          condition: data.finalCondition || 'GOOD'
        }
      });

      return updated;
    });

    // Create Notification for requester
    if (resolved.requestedById) {
      await prisma.notification.create({
        data: {
          userId: resolved.requestedById,
          message: `Maintenance request resolved for ${resolved.asset.name} (${resolved.asset.assetTag}). Final condition: ${data.finalCondition || 'GOOD'}.`,
          type: 'GENERAL'
        }
      });
    }

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'MAINTENANCE_CREATED',
        message: `Maintenance ticket resolved for ${resolved.asset.name} (${resolved.asset.assetTag}).`,
        userId: user.id
      }
    });

    return resolved;
  }
}
