import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class MaintenanceService {
  static async getMaintenanceRequests(user: UserContext) {
    const { role, id: userId } = user;

    // Employees can only view repairs they raised.
    // Managers, Admins, and Technicians can see all maintenance requests.
    const whereClause = role === 'EMPLOYEE' ? { requestedById: userId } : {};

    return prisma.maintenance.findMany({
      where: whereClause,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true, condition: true } },
        requestedBy: { select: { id: true, name: true, email: true } }
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

    // Creating request defaults status to PENDING. Asset lifecycle remains unchanged.
    return prisma.maintenance.create({
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

    return prisma.$transaction(async (tx) => {
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
    
    // Technicians can only be assigned to approved requests.
    if (request.status !== 'APPROVED') {
      throw new Error('Requests must be APPROVED before technician assignment.');
    }

    return prisma.maintenance.update({
      where: { id },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        assignedTechnician: data.assignedTechnician,
        cost: data.cost !== undefined ? parseFloat(data.cost as any) : request.cost
      },
      include: { asset: true }
    });
  }

  static async startWork(user: UserContext, id: string) {
    const request = await prisma.maintenance.findUnique({ where: { id } });
    if (!request) {
      throw new Error('Maintenance request not found.');
    }

    // Start work allowed for assigned technician or managers/admins
    if (request.status !== 'TECHNICIAN_ASSIGNED') {
      throw new Error('Only requests in TECHNICIAN_ASSIGNED status can move to IN_PROGRESS.');
    }

    return prisma.maintenance.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      },
      include: { asset: true }
    });
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

    return prisma.$transaction(async (tx) => {
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
  }
}
