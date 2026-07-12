import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { DepartmentService } from './department.service';

export class DepartmentController {
  static async getDepartments(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await DepartmentService.getDepartments();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch departments' });
    }
  }

  static async createDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, departmentCode, parentDepartmentId, headEmployeeId } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Department name is required' });
      }
      if (!departmentCode || typeof departmentCode !== 'string' || !departmentCode.trim()) {
        return res.status(400).json({ error: 'Department code is required' });
      }

      const dept = await DepartmentService.createDepartment({
        name: name.trim(),
        departmentCode: departmentCode.trim(),
        parentDepartmentId: parentDepartmentId || null,
        headEmployeeId: headEmployeeId || null
      });
      return res.status(201).json(dept);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, departmentCode, parentDepartmentId, headEmployeeId } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Department name is required' });
      }
      if (!departmentCode || typeof departmentCode !== 'string' || !departmentCode.trim()) {
        return res.status(400).json({ error: 'Department code is required' });
      }

      const dept = await DepartmentService.updateDepartment(id, {
        name: name.trim(),
        departmentCode: departmentCode.trim(),
        parentDepartmentId: parentDepartmentId || null,
        headEmployeeId: headEmployeeId || null
      });
      return res.json(dept);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await DepartmentService.deleteDepartment(id);
      return res.json({ message: 'Department deleted successfully' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async patchDepartmentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const dept = await DepartmentService.patchStatus(id, status);
      return res.json(dept);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
