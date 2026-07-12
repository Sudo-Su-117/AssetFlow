import prisma from '../../db';
import { UserContext } from '../../services/analytics.service';

export class BookingService {
  // Helper to dynamically calculate booking lifecycle status on fetch
  private static mapDynamicStatus(booking: any): string {
    if (booking.status === 'CANCELLED') {
      return 'CANCELLED';
    }
    
    const now = new Date();
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    if (now < start) {
      return 'UPCOMING';
    } else if (now >= start && now <= end) {
      return 'ONGOING';
    } else {
      return 'COMPLETED';
    }
  }

  static async getBookings() {
    const list = await prisma.booking.findMany({
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true, department: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' }
    });

    return list.map(b => ({
      ...b,
      status: this.mapDynamicStatus(b)
    }));
  }

  static async getResourceAvailability(assetId: string, dateStr: string) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const bookings = await prisma.booking.findMany({
      where: {
        assetId,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay }
      },
      include: {
        user: { select: { name: true, email: true, department: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' }
    });

    const mappedBookings = bookings.map(b => ({
      id: b.id,
      start: b.startTime.toISOString().substring(11, 16), // "HH:MM" format
      end: b.endTime.toISOString().substring(11, 16),
      status: this.mapDynamicStatus(b),
      bookedBy: b.user.name,
      department: b.user.department?.name || 'External',
      purpose: b.purpose
    }));

    return mappedBookings;
  }

  static async createBooking(
    user: UserContext,
    data: {
      assetId: string;
      startTime: string | Date;
      endTime: string | Date;
      purpose?: string | null;
    }
  ) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new Error('Resource not found.');
    }
    if (!asset.bookable) {
      throw new Error('This asset is not registered as a bookable resource.');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Start Time and End Time must be valid ISO date strings.');
    }

    if (start >= end) {
      throw new Error('Start Time must be chronologically before End Time.');
    }

    // Enforce booking in the future (optional, but let's allow same-day current bookings)
    const now = new Date();
    if (end < now) {
      throw new Error('Cannot schedule booking slots entirely in the past.');
    }

    // Conflict Detection: Overlap checks
    const overlapping = await prisma.booking.findFirst({
      where: {
        assetId: data.assetId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            // Requested start overlaps inside an existing booking
            startTime: { lt: end },
            endTime: { gt: start }
          }
        ]
      },
      include: {
        user: { select: { name: true, department: { select: { name: true } } } }
      }
    });

    if (overlapping) {
      const error: any = new Error(
        `Booking conflict: Requested slot overlaps with booking by ${overlapping.user.name} (${overlapping.user.department?.name || 'Operations'}) from ${overlapping.startTime.toISOString().substring(11, 16)} to ${overlapping.endTime.toISOString().substring(11, 16)}.`
      );
      error.code = 'CONFLICT';
      error.conflictingBooking = {
        bookedBy: overlapping.user.name,
        department: overlapping.user.department?.name || 'General',
        start: overlapping.startTime.toISOString().substring(11, 16),
        end: overlapping.endTime.toISOString().substring(11, 16)
      };
      throw error;
    }

    const booking = await prisma.booking.create({
      data: {
        assetId: data.assetId,
        userId: user.id,
        startTime: start,
        endTime: end,
        status: 'ACTIVE', // Dynamically maps to UPCOMING/ONGOING
        purpose: data.purpose || null
      },
      include: {
        asset: true,
        user: true
      }
    });

    // Write Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        message: `Resource Booking Confirmed: ${booking.asset.name} reserved for ${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'BOOKING'
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'ASSET_CREATED',
        message: `Resource ${booking.asset.name} booked by ${booking.user.name}.`,
        userId: user.id
      }
    });

    return {
      ...booking,
      status: this.mapDynamicStatus(booking)
    };
  }

  static async updateBooking(
    user: UserContext,
    id: string,
    data: {
      startTime: string | Date;
      endTime: string | Date;
      purpose?: string | null;
    }
  ) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found.');
    }

    // Authorization checks
    if (booking.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: You can only reschedule your own reservations.');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new Error('Start Time must be before End Time.');
    }

    // Conflict Check (excluding current booking)
    const overlapping = await prisma.booking.findFirst({
      where: {
        assetId: booking.assetId,
        status: { not: 'CANCELLED' },
        NOT: { id },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start }
          }
        ]
      },
      include: {
        user: { select: { name: true } }
      }
    });

    if (overlapping) {
      const error: any = new Error(`Rescheduling conflict: Overlaps with booking by ${overlapping.user.name}.`);
      error.code = 'CONFLICT';
      throw error;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        purpose: data.purpose !== undefined ? data.purpose : booking.purpose
      },
      include: {
        asset: true,
        user: true
      }
    });

    return {
      ...updated,
      status: this.mapDynamicStatus(updated)
    };
  }

  static async cancelBooking(user: UserContext, id: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'ASSET_MANAGER') {
      throw new Error('Forbidden: You can only cancel your own bookings.');
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        asset: true,
        user: true
      }
    });

    // Write Notification
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        message: `Resource Booking Cancelled: ${updated.asset.name} reservation has been cancelled.`,
        type: 'BOOKING'
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        type: 'ASSET_CREATED',
        message: `Resource booking for ${updated.asset.name} cancelled by ${updated.user.name}.`,
        userId: user.id
      }
    });

    return {
      ...updated,
      status: 'CANCELLED'
    };
  }
}
