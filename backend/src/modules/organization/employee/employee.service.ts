import prisma from '../../../db';

export class EmployeeService {
  static async getEmployees() {
    return prisma.user.findMany({
      orderBy: { name: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
  }

  static async updateEmployee(id: string, data: { name: string; email: string; departmentId: string | null }) {
    // Validate that the department is active before placing employee in it
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId }
      });

      if (!dept) {
        throw new Error('Department not found.');
      }

      if (dept.status === 'INACTIVE') {
        throw new Error('Cannot assign employees to an inactive department.');
      }
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingEmail && existingEmail.id !== id) {
      throw new Error('Email address is already in use by another user.');
    }

    return prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        departmentId: data.departmentId || null
      },
      include: {
        department: true
      }
    });
  }

  static async patchRole(id: string, role: string) {
    const validRoles = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    }

    return prisma.user.update({
      where: { id },
      data: { role },
      include: { department: true }
    });
  }

  static async patchStatus(id: string, status: string) {
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new Error('Invalid status. Must be ACTIVE or INACTIVE.');
    }

    // Optional rule: If deactivating an employee who is currently a department head,
    // we should alert or handle that, but letting prisma update is fine for now.

    return prisma.user.update({
      where: { id },
      data: { status },
      include: { department: true }
    });
  }
}
