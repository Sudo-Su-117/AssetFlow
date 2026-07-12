import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class TransferService {
  static async getTransfers(user: UserContext) {
    const { role, id: userId, departmentId } = user;

    if (role === 'ADMIN' || role === 'ASSET_MANAGER') {
      return prisma.transfer.findMany({
        include: {
          asset: true,
          fromDepartment: true,
          toDepartment: true,
          requestedBy: true,
          approvedBy: true,
          fromUser: true,
          toUser: true
        },
        orderBy: { requestedAt: 'desc' }
      });
    }

    // Managers/Heads see department-scoped requests
    if (role === 'DEPARTMENT_HEAD' && departmentId) {
      return prisma.transfer.findMany({
        where: {
          OR: [
            { fromDepartmentId: departmentId },
            { toDepartmentId: departmentId }
          ]
        },
        include: {
          asset: true,
          fromDepartment: true,
          toDepartment: true,
          requestedBy: true,
          approvedBy: true,
          fromUser: true,
          toUser: true
        },
        orderBy: { requestedAt: 'desc' }
      });
    }

    // Employees only see their own requested transfers
    return prisma.transfer.findMany({
      where: { requestedById: userId },
      include: {
        asset: true,
        fromDepartment: true,
        toDepartment: true,
        requestedBy: true,
        approvedBy: true,
        fromUser: true,
        toUser: true
      },
      orderBy: { requestedAt: 'desc' }
    });
  }

  static async createTransferRequest(user: UserContext, data: { assetId: string; toUserId: string; reason: string }) {
    // 1. Resolve Recipient User Profile
    const toUser = await prisma.user.findUnique({ where: { id: data.toUserId } });
    if (!toUser) {
      throw new Error('Target employee not found.');
    }

    // 2. Validate current allocation checkout status
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
    const transfer = await prisma.transfer.create({
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

    // 4. Create Notification
    await prisma.notification.create({
      data: {
        userId: transfer.toUserId!,
        message: `Ownership Transfer requested: ${transfer.fromUser?.name || 'Someone'} wants to transfer ${transfer.asset.name} (${transfer.asset.assetTag}) to you.`,
        type: 'TRANSFER_REQUEST'
      }
    });

    // 5. Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'TRANSFER_REQUESTED',
        message: `Transfer request initiated for ${transfer.asset.name} (${transfer.asset.assetTag}) from ${transfer.fromUser?.name || 'Sender'} to ${transfer.toUser?.name || 'Recipient'}.`,
        userId: user.id
      }
    });

    return transfer;
  }

  static async approveTransfer(user: UserContext, id: string) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

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

    // TRANSACTION: Close previous checkout + Open new checkout + Update asset
    const approvedTx = await prisma.$transaction(async (tx) => {
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

      // D. Update transfer status
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

    // Create Notification for recipient
    await prisma.notification.create({
      data: {
        userId: approvedTx.toUserId!,
        message: `Ownership Transfer Approved: ${approvedTx.asset.name} (${approvedTx.asset.assetTag}) is now allocated to you.`,
        type: 'TRANSFER_REQUEST'
      }
    });

    // Create Notification for original holder
    await prisma.notification.create({
      data: {
        userId: approvedTx.fromUserId!,
        message: `Ownership Transfer Completed: ${approvedTx.asset.name} (${approvedTx.asset.assetTag}) has been transferred to ${approvedTx.toUser?.name}.`,
        type: 'TRANSFER_REQUEST'
      }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'TRANSFER_REQUESTED',
        message: `Transfer approved for ${approvedTx.asset.name} (${approvedTx.asset.assetTag}) to ${approvedTx.toUser?.name}.`,
        userId: user.id
      }
    });

    return approvedTx;
  }

  static async rejectTransfer(user: UserContext, id: string) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { asset: true }
    });
    if (!transfer) {
      throw new Error('Transfer request not found.');
    }
    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer request is already resolved.');
    }

    const updated = await prisma.transfer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: user.id,
        approvedAt: new Date()
      },
      include: {
        asset: true,
        fromUser: true,
        toUser: true
      }
    });

    // Create Notification for requester
    await prisma.notification.create({
      data: {
        userId: updated.requestedById,
        message: `Ownership Transfer Rejected: request for ${updated.asset.name} (${updated.asset.assetTag}) was rejected.`,
        type: 'TRANSFER_REQUEST'
      }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'TRANSFER_REQUESTED',
        message: `Transfer request rejected for ${updated.asset.name} (${updated.asset.assetTag}).`,
        userId: user.id
      }
    });

    return updated;
  }
}
