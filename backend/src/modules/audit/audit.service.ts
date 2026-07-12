import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class AuditService {
  static async getAudits() {
    return prisma.auditCycle.findMany({
      include: { department: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAuditDetails(id: string) {
    const auditCycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } }
    });
    if (!auditCycle) {
      throw new Error('Audit Cycle not found.');
    }

    const records = await prisma.auditRecord.findMany({
      where: { auditCycleId: id },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true, condition: true } }
      },
      orderBy: { asset: { assetTag: 'asc' } }
    });

    const discrepancies = await prisma.discrepancyReport.findMany({
      where: { auditCycleId: id },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } }
      },
      orderBy: { generatedAt: 'desc' }
    });

    return {
      auditCycle,
      records,
      discrepancies
    };
  }

  static async createAuditCycle(
    user: UserContext,
    data: {
      title: string;
      departmentId: string;
      location?: string;
      startDate: string | Date;
      endDate: string | Date;
      assignedAuditors: string; // Comma separated emails
    }
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) {
      throw new Error('Target department not found.');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      throw new Error('Start date must be before End date.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create Cycle
      const cycle = await tx.auditCycle.create({
        data: {
          title: data.title,
          departmentId: data.departmentId,
          location: data.location || null,
          startDate: start,
          endDate: end,
          assignedAuditors: data.assignedAuditors || user.email,
          status: 'ACTIVE'
        }
      });

      // 2. Query all assets inside scoped department
      const assets = await tx.asset.findMany({
        where: { departmentId: data.departmentId }
      });

      // 3. Create Audit Records checklist
      for (const asset of assets) {
        await tx.auditRecord.create({
          data: {
            auditCycleId: cycle.id,
            assetId: asset.id,
            expectedLocation: asset.location || 'HQ General Floor',
            verificationStatus: 'PENDING'
          }
        });
      }

      return cycle;
    });
  }

  static async verifyAsset(
    user: UserContext,
    auditId: string,
    assetId: string,
    data: {
      verificationStatus: 'VERIFIED' | 'MISSING' | 'DAMAGED';
      remarks?: string;
    }
  ) {
    const cycle = await prisma.auditCycle.findUnique({ where: { id: auditId } });
    if (!cycle) {
      throw new Error('Audit Cycle not found.');
    }
    if (cycle.status === 'CLOSED') {
      throw new Error('Conflict: Audit Cycle is closed and locked against further modifications.');
    }

    const record = await prisma.auditRecord.findFirst({
      where: { auditCycleId: auditId, assetId }
    });
    if (!record) {
      throw new Error('Audit record not found for this asset in this cycle.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update verification record
      const updatedRecord = await tx.auditRecord.update({
        where: { id: record.id },
        data: {
          verificationStatus: data.verificationStatus,
          remarks: data.remarks || null,
          verifiedBy: user.email,
          verifiedAt: new Date()
        }
      });

      // 2. Discrepancy report auto-generation engine
      const existingDiscrepancy = await tx.discrepancyReport.findFirst({
        where: { auditCycleId: auditId, assetId }
      });

      if (data.verificationStatus === 'MISSING' || data.verificationStatus === 'DAMAGED') {
        // Upsert discrepancy entry
        if (!existingDiscrepancy) {
          await tx.discrepancyReport.create({
            data: {
              auditCycleId: auditId,
              assetId,
              issueType: data.verificationStatus,
              severity: data.verificationStatus === 'MISSING' ? 'HIGH' : 'MEDIUM',
              resolutionStatus: 'PENDING'
            }
          });
        } else {
          await tx.discrepancyReport.update({
            where: { id: existingDiscrepancy.id },
            data: {
              issueType: data.verificationStatus,
              severity: data.verificationStatus === 'MISSING' ? 'HIGH' : 'MEDIUM'
            }
          });
        }
      } else if (data.verificationStatus === 'VERIFIED') {
        // If fixed/verified, clear any auto-generated discrepancy report
        if (existingDiscrepancy) {
          await tx.discrepancyReport.delete({
            where: { id: existingDiscrepancy.id }
          });
        }
      }

      return updatedRecord;
    });
  }

  static async closeAuditCycle(user: UserContext, id: string) {
    if (user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: Admin or Asset Manager privileges required.');
    }

    const cycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: { discrepancies: true }
    });
    if (!cycle) {
      throw new Error('Audit Cycle not found.');
    }
    if (cycle.status === 'CLOSED') {
      throw new Error('Audit Cycle is already closed.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Lock cycle
      const updatedCycle = await tx.auditCycle.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      });

      // 2. Propagate unresolved discrepancies to other systems
      for (const discrepancy of cycle.discrepancies) {
        if (discrepancy.issueType === 'MISSING') {
          // Flag asset status as LOST in directory
          await tx.asset.update({
            where: { id: discrepancy.assetId },
            data: { status: 'LOST' }
          });
        } else if (discrepancy.issueType === 'DAMAGED') {
          // Log a maintenance entry automatically
          await tx.maintenance.create({
            data: {
              assetId: discrepancy.assetId,
              description: `Auto-created from Q3 Audit cycle. Issue: Damaged during audit check-in.`,
              priority: 'MEDIUM',
              status: 'PENDING'
            }
          });
        }
      }

      return updatedCycle;
    });
  }
}
