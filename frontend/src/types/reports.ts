export interface ReportsOverviewData {
  utilization: Record<string, number>;
  maintenanceTrend: { month: string; count: number }[];
  idleAssets: { assetTag: string; name: string; daysIdle: number }[];
  mostUsedAssets: { assetTag: string; name: string; usageCount: number }[];
  assetsDueOrRetiring: { assetTag: string; name: string; warning: string; severity: 'WARNING' | 'DANGER' }[];
}
