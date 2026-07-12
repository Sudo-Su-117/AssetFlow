import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { BookingService } from './booking.service';

export class BookingController {
  static async getBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const list = await BookingService.getBookings();
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch bookings list' });
    }
  }

  static async getResourceAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date query string (YYYY-MM-DD) is required.' });
      }

      const list = await BookingService.getResourceAvailability(id, date);
      return res.json(list);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch resource availability' });
    }
  }

  static async createBooking(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { assetId, startTime, endTime } = req.body;
      if (!assetId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Resource, Start Time, and End Time are required.' });
      }

      const booking = await BookingService.createBooking(req.user, req.body);
      return res.status(201).json(booking);
    } catch (err: any) {
      if (err.code === 'CONFLICT') {
        return res.status(409).json({ error: err.message, conflictingBooking: err.conflictingBooking });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateBooking(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const { startTime, endTime } = req.body;
      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Start Time and End Time are required.' });
      }

      const booking = await BookingService.updateBooking(req.user, id, req.body);
      return res.json(booking);
    } catch (err: any) {
      if (err.code === 'CONFLICT') {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async cancelBooking(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const booking = await BookingService.cancelBooking(req.user, id);
      return res.json(booking);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
