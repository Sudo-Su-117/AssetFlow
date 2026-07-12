import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class TransferService {
  static async getTransfers() {
    return prisma.transfer.findMany({
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
  }

  static async createTransferRequest(
    user: UserContext,
    data: {
      assetId: string;
      toUserId: string;
      reason: string;
    }
  ) {
    // 1. Verify Target User is Active
    const toUser = await prisma.user.findUnique({ where: { id: data.toUserId } });
    if (!toUser) {
      throw new Error('Target employee not found.');
    }
    if (toUser.status === 'INACTIVE') {
      throw new Error('Cannot transfer assets to an inactive employee.');
    }

    // 2. Locate Active Owner for the Asset
    const activeAlloc = await prisma.allocation.findFirst({
      where: { assetId: data.assetId, status: 'ACTIVE' },
      include: { user: true }
    });
    if (!activeAlloc) {
      throw new Error('Asset is not currently allocated. Use direct allocation instead.');
    }

    // If attempting to transfer to the self/current owner, reject
    if (activeAlloc.userId === data.toUserId) {
      throw new Error('Target employee is already the current owner of this asset.');
    }

    // 3. Create Transfer record
    return prisma.transfer.create({
      data: {
        assetId: data.assetId,
        fromDepartmentId: activeAlloc.user.departmentId || 'UNASSIGNED',
        toDepartmentId: toUser.departmentId || 'UNASSIGNED',
        fromUserId: activeAlloc.userId,
        toUserId: data.toUserId,
        status: 'PENDING',
        requestedById: user.id,
        reason: data.reason || 'None provided'
      },
      include: {
        asset: true,
        fromUser: true,
        toUser: true
      }
    });
  }

  static async approveTransfer(user: UserContext, id: string) {
    // Restrict approval actions to Admin / Asset Manager
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    // 1. Retrieve Request Details
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        asset: true,
        toUser: true
      }
    });
    if (!transfer) {
      throw new Error('Transfer request not found.');
    }
    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer request is already resolved.');
    }

    // 2. TRANSACTION: Close previous checkout + Open new checkout + Update asset
    return prisma.$transaction(async (tx) => {
      // A. Close active allocation for original holder
      const activeAlloc = await tx.allocation.findFirst({
        where: { assetId: transfer.assetId, userId: transfer.fromUserId!, status: 'ACTIVE' }
      });
      
      if (activeAlloc) {
        await tx.allocation.update({
          where: { id: activeAlloc.id },
          data: {
            returnedAt: new Date(),
            conditionAtReturn: transfer.asset.condition || 'GOOD',
            status: 'CLOSED',
            notes: `${activeAlloc.notes || ''} | Automatically returned via Transfer Approval (${transfer.id})`
          }
        });
      }

      // B. Create active allocation for new holder
      await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          userId: transfer.toUserId!,
          allocatedById: user.id,
          conditionAtAllocation: transfer.asset.condition || 'NEW',
          status: 'ACTIVE',
          notes: `Allocated via approved transfer request: ${transfer.reason}`
        }
      });

      // C. Update asset ownership references
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: {
          departmentId: transfer.toUser?.departmentId || null,
          status: 'ALLOCATED'
        }
      });

      // D. Update transfer status banner
      return tx.transfer.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: user.id,
          approvedAt: new Date()
        },
        include: {
          asset: true,
          fromUser: true,
          toUser: true
        }
      });
    });
  }

  static async rejectTransfer(user: UserContext, id: string) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) {
      throw new Error('Transfer request not found.');
    }
    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer request is already resolved.');
    }

    return prisma.transfer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: user.id,
        approvedAt: new Date()
      }
    });
  }
}
