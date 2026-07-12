import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../../../services/dashboard.api';

export function useDashboard(userEmail: string) {
  return useQuery({
    queryKey: ['dashboard', userEmail],
    queryFn: () => fetchDashboardData(userEmail),
    refetchInterval: 30000, // Poll every 30 seconds for real-time aggregation updates
    retry: 2,               // Retry twice on failure before showing error screen
    enabled: !!userEmail    // Only query if userEmail is set
  });
}
