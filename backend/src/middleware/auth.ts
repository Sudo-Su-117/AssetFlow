import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { UserContext } from '../services/analytics.service';

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

    // In a production app, we would verify a JWT.
    // For this dashboard implementation, we treat the token as the user's email
    // to allow easy switching between different roles/scopes for demonstration.
    const user = await prisma.user.findUnique({
      where: { email: token }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      departmentId: user.departmentId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}
