import type { DashboardData } from '../types/dashboard';

const API_URL = 'http://localhost:5000/api/dashboard';

export async function fetchDashboardData(userEmail: string): Promise<DashboardData> {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userEmail}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = 'Failed to fetch dashboard data';
    try {
      const parsed = JSON.parse(errText);
      errMsg = parsed.error || errMsg;
    } catch (_) {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  return response.json();
}
