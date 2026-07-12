export interface KPIData {
  availableAssets: number;
  allocatedAssets: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  overdueAssets: number;
}

export interface AlertData {
  type: string;
  count: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export interface ActivityLogData {
  id: string;
  type: string;
  message: string;
  userId: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface DashboardData {
  kpis: KPIData;
  alerts: AlertData[];
  quickActions: string[];
  recentActivity: ActivityLogData[];
}
