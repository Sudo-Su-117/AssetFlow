import type { AssetData } from './asset';

export interface BookingData {
  id: string;
  assetId: string;
  asset?: AssetData;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department?: { name: string };
  };
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  purpose: string | null;
  createdAt: string;
}

export interface ResourceAvailabilityData {
  id: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  bookedBy: string;
  department: string;
  purpose: string | null;
}
