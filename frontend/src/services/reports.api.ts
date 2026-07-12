import type { ReportsOverviewData } from '../types/reports';

const BASE_URL = 'http://localhost:5000/api';

export async function fetchReportsOverview(token: string): Promise<ReportsOverviewData> {
  const res = await fetch(`${BASE_URL}/reports/overview`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch analytics overview');
  return res.json();
}

export async function downloadReportCSV(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/reports/export`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to download report export.');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assetflow_intelligence_${new Date().toISOString().substring(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
