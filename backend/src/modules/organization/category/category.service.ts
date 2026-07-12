import prisma from '../../../db';

export class CategoryService {
  static async getCategories() {
    return prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assets: true }
        }
      }
    });
  }

  static async createCategory(data: { name: string; description?: string; customFields?: string }) {
    const existing = await prisma.assetCategory.findUnique({
      where: { name: data.name.toUpperCase() }
    });

    if (existing) {
      throw new Error('A category with this name already exists.');
    }

    return prisma.assetCategory.create({
      data: {
        name: data.name.toUpperCase(),
        description: data.description || null,
        customFields: data.customFields || null
      }
    });
  }

  static async updateCategory(id: string, data: { name: string; description?: string; customFields?: string }) {
    const existing = await prisma.assetCategory.findUnique({
      where: { name: data.name.toUpperCase() }
    });

    if (existing && existing.id !== id) {
      throw new Error('Another category with this name already exists.');
    }

    return prisma.assetCategory.update({
      where: { id },
      data: {
        name: data.name.toUpperCase(),
        description: data.description ?? null,
        customFields: data.customFields ?? null
      }
    });
  }

  static async deleteCategory(id: string) {
    // Check if any assets reference this category
    const assetCount = await prisma.asset.count({
      where: { categoryId: id }
    });

    if (assetCount > 0) {
      throw new Error('Category cannot be deleted because it is referenced by existing assets. Deactivate it instead.');
    }

    return prisma.assetCategory.delete({
      where: { id }
    });
  }

  static async patchStatus(id: string, status: string) {
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new Error('Invalid status. Must be ACTIVE or INACTIVE.');
    }

    return prisma.assetCategory.update({
      where: { id },
      data: { status }
    });
  }
}
