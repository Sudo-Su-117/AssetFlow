import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Apply auth to all scheduling actions
router.use(authMiddleware);

router.get('/bookings', BookingController.getBookings);
router.get('/resources/:id/availability', BookingController.getResourceAvailability);
router.post('/bookings', BookingController.createBooking);
router.put('/bookings/:id', BookingController.updateBooking);
router.delete('/bookings/:id', BookingController.cancelBooking); // Delete acts as Cancel

export default router;
