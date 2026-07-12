import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { CategoryService } from './category.service';

export class CategoryController {
  static async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await CategoryService.getCategories();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch categories' });
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, customFields } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required and must be a string' });
      }
      const cat = await CategoryService.createCategory({ name: name.trim(), description, customFields });
      return res.status(201).json(cat);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, customFields } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required and must be a string' });
      }
      const cat = await CategoryService.updateCategory(id, { name: name.trim(), description, customFields });
      return res.json(cat);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      return res.json({ message: 'Category deleted successfully' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async patchCategoryStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const cat = await CategoryService.patchStatus(id, status);
      return res.json(cat);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
