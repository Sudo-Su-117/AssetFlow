import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';
import { AssetTagService } from './assetTag.service';

export class AssetService {
  static async getAssets(
    user: UserContext,
    filters: {
      search?: string;
      category?: string;
      status?: string;
      department?: string;
    }
  ) {
    const { role, id: userId, departmentId: userDeptId } = user;

    // 1. Build Scope Filter based on User Role
    let scopeFilter: any = {};

    if (role === 'DEPARTMENT_HEAD' && userDeptId) {
      scopeFilter = { departmentId: userDeptId };
    } else if (role === 'EMPLOYEE') {
      scopeFilter = {
        allocations: {
          some: {
            userId: userId,
            returnedAt: null
          }
        }
      };
    }

    // 2. Build Search and Dropdown Filters
    const queryFilters: any[] = [scopeFilter];

    if (filters.search) {
      const searchStr = filters.search.trim();
      queryFilters.push({
        OR: [
          { name: { contains: searchStr } },
          { assetTag: { contains: searchStr } },
          { serialNumber: { contains: searchStr } },
          { location: { contains: searchStr } },
          { model: { contains: searchStr } }
        ]
      });
    }

    if (filters.category) {
      queryFilters.push({ categoryId: filters.category });
    }

    if (filters.status) {
      queryFilters.push({ status: filters.status });
    }

    if (filters.department) {
      queryFilters.push({ departmentId: filters.department });
    }

    return prisma.asset.findMany({
      where: {
        AND: queryFilters
      },
      include: {
        category: {
          select: { id: true, name: true }
        },
        department: {
          select: { id: true, name: true }
        }
      },
      orderBy: { assetTag: 'desc' }
    });
  }

  static async getAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        allocations: {
          orderBy: { allocatedAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        maintenanceRecords: {
          orderBy: { scheduledFor: 'desc' }
        },
        bookings: {
          orderBy: { startTime: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        transfers: {
          orderBy: { requestedAt: 'desc' },
          include: {
            fromDepartment: { select: { name: true } },
            toDepartment: { select: { name: true } },
            requestedBy: { select: { name: true } }
          }
        }
      }
    });
  }

  static async createAsset(
    user: UserContext,
    data: {
      name: string;
      categoryId: string;
      serialNumber?: string | null;
      location?: string | null;
      condition?: string | null;
      purchaseCost?: number;
      purchaseDate?: string | Date | null;
      bookable?: boolean;
      departmentId?: string | null;
      documents?: { name: string; url: string }[];
    }
  ) {
    // 1. Verify Category is Active
    const category = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('Category not found.');
    }
    if (category.status === 'INACTIVE') {
      throw new Error('Cannot assign assets to an inactive category.');
    }

    // 2. Verify Department is Active (if provided)
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        throw new Error('Department not found.');
      }
      if (dept.status === 'INACTIVE') {
        throw new Error('Cannot assign assets to an inactive department.');
      }
    }

    // 3. Verify Serial Number Uniqueness
    if (data.serialNumber && data.serialNumber.trim()) {
      const duplicate = await prisma.asset.findFirst({
        where: { serialNumber: data.serialNumber.trim() }
      });
      if (duplicate) {
        const error: any = new Error('An asset with this serial number already exists.');
        error.code = 'P2002'; // Simulate unique constraint error code
        throw error;
      }
    }

    // 4. Generate Tag and QR Code
    const assetTag = await AssetTagService.generateNextTag();
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${assetTag}`;

    // 5. Insert Record
    const purchaseCost = data.purchaseCost !== undefined ? parseFloat(data.purchaseCost as any) : 0.0;
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;

    return prisma.asset.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        serialNumber: data.serialNumber?.trim() || null,
        location: data.location || null,
        condition: data.condition || 'NEW',
        purchaseCost,
        purchaseDate,
        bookable: data.bookable || false,
        departmentId: data.departmentId || null,
        status: 'AVAILABLE', // Starts as available in registry
        assetTag,
        qrCode,
        documents: data.documents ? {
          createMany: {
            data: data.documents
          }
        } : undefined
      },
      include: {
        category: true,
        department: true,
        documents: true
      }
    });
  }

  static async updateAsset(
    id: string,
    data: {
      name: string;
      categoryId: string;
      serialNumber?: string | null;
      location?: string | null;
      condition?: string | null;
      purchaseCost?: number;
      purchaseDate?: string | Date | null;
      bookable?: boolean;
      departmentId?: string | null;
    }
  ) {
    // 1. Verify Category is Active
    const category = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('Category not found.');
    }
    if (category.status === 'INACTIVE') {
      throw new Error('Cannot assign assets to an inactive category.');
    }

    // 2. Verify Department is Active (if provided)
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        throw new Error('Department not found.');
      }
      if (dept.status === 'INACTIVE') {
        throw new Error('Cannot assign assets to an inactive department.');
      }
    }

    // 3. Verify Serial Number Uniqueness
    if (data.serialNumber && data.serialNumber.trim()) {
      const duplicate = await prisma.asset.findFirst({
        where: { 
          serialNumber: data.serialNumber.trim(),
          NOT: { id }
        }
      });
      if (duplicate) {
        const error: any = new Error('An asset with this serial number already exists.');
        error.code = 'P2002';
        throw error;
      }
    }

    const purchaseCost = data.purchaseCost !== undefined ? parseFloat(data.purchaseCost as any) : 0.0;
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;

    return prisma.asset.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        serialNumber: data.serialNumber?.trim() || null,
        location: data.location || null,
        condition: data.condition || 'NEW',
        purchaseCost,
        purchaseDate,
        bookable: data.bookable || false,
        departmentId: data.departmentId || null
        // Status is skipped to comply with downstream lock constraints
      },
      include: {
        category: true,
        department: true
      }
    });
  }

  static async patchStatus(id: string, status: string) {
    const validStatuses = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid asset lifecycle status.');
    }

    return prisma.asset.update({
      where: { id },
      data: { status }
    });
  }

  static async deleteAsset(id: string) {
    // Delete document references first due to cascade, but prisma relation does it automatically since onDelete: Cascade is configured!
    return prisma.asset.delete({
      where: { id }
    });
  }
}
