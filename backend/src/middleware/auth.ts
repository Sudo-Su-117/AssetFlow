import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { UserContext } from '../services/analytics.service';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-secret-key-12345';

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Empty token' });
    }

    // Try decoding as JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; departmentId?: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      if (user) {
        if (user.status === 'INACTIVE') {
          return res.status(403).json({ error: 'Forbidden: Account disabled.' });
        }
        req.user = {
          id: user.id,
          role: user.role,
          departmentId: user.departmentId
        };
        return next();
      }
    } catch (err) {
      // Fallback: If decode fails, treat token as raw user email for seeds/compatibility
      const user = await prisma.user.findUnique({
        where: { email: token }
      });
      if (user) {
        if (user.status === 'INACTIVE') {
          return res.status(403).json({ error: 'Forbidden: Account disabled.' });
        }
        req.user = {
          id: user.id,
          role: user.role,
          departmentId: user.departmentId
        };
        return next();
      }
    }

    return res.status(401).json({ error: 'Unauthorized: Invalid token or user not found' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}
