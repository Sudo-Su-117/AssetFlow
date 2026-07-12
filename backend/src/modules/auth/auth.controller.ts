import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuthService } from './auth.service';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required fields.' });
      }

      const result = await AuthService.signup(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.message.includes('Conflict')) {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required fields.' });
      }

      const result = await AuthService.login(req.body);
      return res.json(result);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      if (err.message.includes('Unauthorized')) {
        return res.status(401).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required.' });
      }

      const result = await AuthService.refresh(refreshToken);
      return res.json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const result = await AuthService.forgotPassword(email);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required.' });
      }

      const result = await AuthService.resetPassword(req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const profile = await AuthService.getUserProfile(req.user.id);
      return res.json(profile);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }
}
