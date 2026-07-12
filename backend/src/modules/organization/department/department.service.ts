import prisma from '../../../db';

export class DepartmentService {
  static async getDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        parentDepartment: {
          select: { id: true, name: true }
        },
        headEmployee: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: {
            users: true,
            assets: true
          }
        }
      }
    });
  }

  static async createDepartment(data: {
    name: string;
    departmentCode: string;
    parentDepartmentId?: string | null;
    headEmployeeId?: string | null;
  }) {
    // 1. Uniqueness check
    const existingName = await prisma.department.findUnique({ where: { name: data.name } });
    if (existingName) {
      throw new Error('A department with this name already exists.');
    }

    const existingCode = await prisma.department.findUnique({ where: { departmentCode: data.departmentCode } });
    if (existingCode) {
      throw new Error('A department with this code already exists.');
    }

    // 2. Validate Parent
    if (data.parentDepartmentId) {
      const parent = await prisma.department.findUnique({ where: { id: data.parentDepartmentId } });
      if (!parent) {
        throw new Error('Parent department not found.');
      }
      if (parent.status === 'INACTIVE') {
        throw new Error('Cannot set an inactive department as a parent.');
      }
    }

    // 3. Create department
    const dept = await prisma.department.create({
      data: {
        name: data.name,
        departmentCode: data.departmentCode,
        parentDepartmentId: data.parentDepartmentId || null,
        headEmployeeId: data.headEmployeeId || null
      }
    });

    // 4. Validate and set Head Employee
    if (data.headEmployeeId) {
      const headUser = await prisma.user.findUnique({ where: { id: data.headEmployeeId } });
      if (!headUser) {
        throw new Error('Head employee not found.');
      }

      // If user is in another department, throw error
      if (headUser.departmentId && headUser.departmentId !== dept.id) {
        // Automatically move them if they don't belong anywhere, otherwise throw error
        throw new Error('The selected department head must belong to this department.');
      }

      // Set user's department and role
      await prisma.user.update({
        where: { id: headUser.id },
        data: {
          departmentId: dept.id,
          role: 'DEPARTMENT_HEAD'
        }
      });
    }

    return dept;
  }

  static async updateDepartment(
    id: string,
    data: {
      name: string;
      departmentCode: string;
      parentDepartmentId?: string | null;
      headEmployeeId?: string | null;
    }
  ) {
    // 1. Uniqueness check
    const existingName = await prisma.department.findUnique({ where: { name: data.name } });
    if (existingName && existingName.id !== id) {
      throw new Error('Another department with this name already exists.');
    }

    const existingCode = await prisma.department.findUnique({ where: { departmentCode: data.departmentCode } });
    if (existingCode && existingCode.id !== id) {
      throw new Error('Another department with this code already exists.');
    }

    // 2. Cyclic Hierarchy Check (Loop Detection)
    if (data.parentDepartmentId) {
      if (data.parentDepartmentId === id) {
        throw new Error('Cyclic department hierarchy: A department cannot be its own parent.');
      }

      let currentParentId: string | null = data.parentDepartmentId;
      while (currentParentId) {
        if (currentParentId === id) {
          throw new Error('Cyclic department hierarchy: This selection would create a circular loop.');
        }

        const parentDept = await prisma.department.findUnique({
          where: { id: currentParentId },
          select: { parentDepartmentId: true }
        });

        currentParentId = parentDept?.parentDepartmentId || null;
      }
    }

    // 3. Head Employee validation: Employee must belong to this department
    if (data.headEmployeeId) {
      const headUser = await prisma.user.findUnique({ where: { id: data.headEmployeeId } });
      if (!headUser) {
        throw new Error('Selected head employee not found.');
      }
      
      // Enforce the rule: employee must belong to this department
      if (headUser.departmentId !== id) {
        throw new Error('Department head must belong to this department. Please assign the employee to this department first.');
      }

      // Update their role to DEPARTMENT_HEAD
      await prisma.user.update({
        where: { id: data.headEmployeeId },
        data: { role: 'DEPARTMENT_HEAD' }
      });
    }

    // 4. Update the department
    return prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        departmentCode: data.departmentCode,
        parentDepartmentId: data.parentDepartmentId || null,
        headEmployeeId: data.headEmployeeId || null
      }
    });
  }

  static async patchStatus(id: string, status: string) {
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new Error('Invalid status. Must be ACTIVE or INACTIVE.');
    }

    // If making a department INACTIVE, and it is a parent department, we should check if its sub-departments are active
    // The rules don't strictly block it, but let's update its status
    return prisma.department.update({
      where: { id },
      data: { status }
    });
  }

  static async deleteDepartment(id: string) {
    // Check if there are employees in this department
    const userCount = await prisma.user.count({ where: { departmentId: id } });
    if (userCount > 0) {
      throw new Error('Department cannot be deleted because it contains employees. Deactivate it instead.');
    }

    // Check if there are assets in this department
    const assetCount = await prisma.asset.count({ where: { departmentId: id } });
    if (assetCount > 0) {
      throw new Error('Department cannot be deleted because it has assets assigned. Deactivate it instead.');
    }

    return prisma.department.delete({
      where: { id }
    });
  }
}
