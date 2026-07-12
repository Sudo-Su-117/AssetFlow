export interface AssetDocumentData {
  id: string;
  name: string;
  url: string;
  assetId: string;
  createdAt: string;
}

export interface AssetData {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string | null;
  category?: { id: string; name: string; description: string | null } | null;
  status: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
  serialNumber: string | null;
  model: string | null;
  location: string | null;
  value: number;
  expectedReturnDate: string | null;
  departmentId: string | null;
  department?: { id: string; name: string; departmentCode: string } | null;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | null;
  purchaseDate: string | null;
  purchaseCost: number;
  bookable: boolean;
  imageUrl: string | null;
  qrCode: string | null;
  createdAt: string;
  documents?: AssetDocumentData[];
  
  // Historical data when fetched by ID
  allocations?: Array<{
    id: string;
    allocatedAt: string;
    returnedAt: string | null;
    notes: string | null;
    user: { id: string; name: string; email: string };
  }>;
  maintenanceRecords?: Array<{
    id: string;
    status: string;
    description: string;
    cost: number;
    scheduledFor: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
  bookings?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    purpose: string | null;
    user: { name: string; email: string };
  }>;
  transfers?: Array<{
    id: string;
    status: string;
    requestedAt: string;
    fromDepartment: { name: string };
    toDepartment: { name: string };
    requestedBy: { name: string };
  }>;
}
