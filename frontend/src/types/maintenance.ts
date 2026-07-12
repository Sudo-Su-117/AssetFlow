import type { AssetData } from './asset';

export interface MaintenanceRequestData {
  id: string;
  assetId: string;
  asset?: AssetData;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'TECHNICIAN_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTechnician: string | null;
  requestedById: string | null;
  requestedBy?: { id: string; name: string; email: string };
  cost: number;
  scheduledFor: string;
  approvedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}
