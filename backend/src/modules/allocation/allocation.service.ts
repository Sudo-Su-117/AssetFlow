import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class AllocationService {
  static async getAllocations() {
    return prisma.allocation.findMany({
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        allocatedBy: { select: { name: true } }
      },
      orderBy: { allocatedAt: 'desc' }
    });
  }

  static async getAllocationDetails(assetId: string) {
    // Get the current active allocation if exists
    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId, status: 'ACTIVE' },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            department: { select: { id: true, name: true } } 
          } 
        },
        allocatedBy: { select: { name: true } }
      }
    });

    // Get the full history timeline for this asset
    const history = await prisma.allocation.findMany({
      where: { assetId },
      include: {
        user: { select: { name: true, email: true, department: { select: { name: true } } } },
        allocatedBy: { select: { name: true } }
      },
      orderBy: { allocatedAt: 'desc' }
    });

    return {
      activeAllocation,
      history
    };
  }

  static async createAllocation(
    user: UserContext,
    data: {
      assetId: string;
      userId: string;
      expectedReturnDate?: string | Date | null;
      conditionAtAllocation?: string | null;
      notes?: string | null;
    }
  ) {
    // 1. Verify Target Employee is Active
    const targetUser = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!targetUser) {
      throw new Error('Target employee not found.');
    }
    if (targetUser.status === 'INACTIVE') {
      throw new Error('Cannot assign assets to an inactive employee.');
    }

    // 2. Verify Asset is Available (Conflict Detection / Double Allocation Block)
    const activeAlloc = await prisma.allocation.findFirst({
      where: { assetId: data.assetId, status: 'ACTIVE' }
    });
    if (activeAlloc) {
      const error: any = new Error('Asset is already allocated to another user. Direct re-allocation is blocked.');
      error.code = 'CONFLICT';
      throw error;
    }

    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new Error('Asset not found.');
    }
    if (asset.status !== 'AVAILABLE') {
      throw new Error(`Asset is not available for allocation. Current status: ${asset.status}`);
    }

    // 3. Create active allocation
    const expectedReturnDate = data.expectedReturnDate ? new Date(data.expectedReturnDate) : null;
    const conditionAtAllocation = data.conditionAtAllocation || 'NEW';

    const allocation = await prisma.allocation.create({
      data: {
        assetId: data.assetId,
        userId: data.userId,
        allocatedById: user.id,
        expectedReturnDate,
        conditionAtAllocation,
        status: 'ACTIVE',
        notes: data.notes || null
      },
      include: {
        asset: true,
        user: true
      }
    });

    // 4. Update Asset status to ALLOCATED
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { status: 'ALLOCATED' }
    });

    // 5. Create Notification
    await prisma.notification.create({
      data: {
        userId: data.userId,
        message: `Asset ${allocation.asset.name} (${allocation.asset.assetTag}) has been allocated to you. Expected return: ${expectedReturnDate ? expectedReturnDate.toLocaleDateString() : 'N/A'}.`,
        type: 'GENERAL'
      }
    });

    // 6. Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'ASSET_ALLOCATED',
        message: `Asset ${allocation.asset.name} (${allocation.asset.assetTag}) allocated to ${allocation.user.name}.`,
        userId: user.id
      }
    });

    return allocation;
  }

  static async returnAsset(
    user: UserContext,
    allocationId: string,
    data: {
      conditionAtReturn: string;
      notes?: string | null;
    }
  ) {
    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
      include: { asset: true, user: true }
    });
    if (!allocation) {
      throw new Error('Allocation record not found.');
    }
    if (allocation.status === 'CLOSED') {
      throw new Error('Allocation is already closed.');
    }

    // 1. Close allocation
    const notesStr = data.notes ? `${allocation.notes || ''} | Return Notes: ${data.notes.trim()}` : allocation.notes;
    const updatedAllocation = await prisma.allocation.update({
      where: { id: allocationId },
      data: {
        returnedAt: new Date(),
        conditionAtReturn: data.conditionAtReturn,
        status: 'CLOSED',
        notes: notesStr
      }
    });

    // 2. Mark Asset status as AVAILABLE and update condition
    await prisma.asset.update({
      where: { id: allocation.assetId },
      data: { 
        status: 'AVAILABLE',
        condition: data.conditionAtReturn
      }
    });

    // 3. Create Notification
    await prisma.notification.create({
      data: {
        userId: allocation.userId,
        message: `Asset ${allocation.asset.name} (${allocation.asset.assetTag}) has been returned.`,
        type: 'GENERAL'
      }
    });

    // 4. Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'ASSET_ALLOCATED',
        message: `Asset ${allocation.asset.name} (${allocation.asset.assetTag}) returned by ${allocation.user.name}.`,
        userId: user.id
      }
    });

    return updatedAllocation;
  }
}
