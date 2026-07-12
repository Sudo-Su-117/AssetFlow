import type { BookingData, ResourceAvailabilityData } from '../types/booking';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchBookings(token: string): Promise<BookingData[]> {
  const res = await fetch(`${BASE_URL}/bookings`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch bookings');
  return res.json();
}

export async function fetchResourceAvailability(
  token: string,
  assetId: string,
  dateStr: string
): Promise<ResourceAvailabilityData[]> {
  const res = await fetch(`${BASE_URL}/resources/${assetId}/availability?date=${dateStr}`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch availability details');
  return res.json();
}

export async function createBooking(
  token: string,
  data: {
    assetId: string;
    startTime: string; // ISO
    endTime: string;   // ISO
    purpose?: string;
  }
): Promise<BookingData> {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errObj = await res.json();
    const error: any = new Error(errObj.error || 'Failed to create booking');
    if (res.status === 409) {
      error.code = 'CONFLICT';
      error.conflictingBooking = errObj.conflictingBooking;
    }
    throw error;
  }
  return res.json();
}

export async function cancelBooking(token: string, id: string): Promise<BookingData> {
  const res = await fetch(`${BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to cancel booking');
  return res.json();
}
