export interface NotificationData {
  id: string;
  userId: string;
  message: string;
  type: string; // "OVERDUE_RETURN", "MAINTENANCE_DUE", "TRANSFER_REQUEST", "GENERAL", etc.
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLogData {
  id: string;
  type: string; // "ASSET_CREATED", "ASSET_ALLOCATED", "MAINTENANCE_CREATED", etc.
  message: string;
  userId: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}
