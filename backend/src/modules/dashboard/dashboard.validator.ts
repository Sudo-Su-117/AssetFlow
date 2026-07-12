import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const dashboardQuerySchema = z.object({
  // Add any query parameters here if pagination or date filtering is introduced in the future
  refresh: z.enum(['true', 'false']).optional()
});

export function validateDashboardQuery(req: Request, res: Response, next: NextFunction) {
  try {
    dashboardQuerySchema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}
