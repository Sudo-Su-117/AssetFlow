import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { EmployeeService } from './employee.service';

export class EmployeeController {
  static async getEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await EmployeeService.getEmployees();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch employees' });
    }
  }

  static async updateEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, departmentId } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emp = await EmployeeService.updateEmployee(id, {
        name: name.trim(),
        email: email.trim(),
        departmentId: departmentId || null
      });
      return res.json(emp);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async patchEmployeeRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      const emp = await EmployeeService.patchRole(id, role);
      return res.json(emp);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async patchEmployeeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const emp = await EmployeeService.patchStatus(id, status);
      return res.json(emp);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
