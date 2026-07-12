import type { MaintenanceRequestData } from '../types/maintenance';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchMaintenanceRequests(token: string): Promise<MaintenanceRequestData[]> {
  const res = await fetch(`${BASE_URL}/maintenance`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch maintenance requests');
  return res.json();
}

export async function createMaintenanceRequest(
  token: string,
  data: {
    assetId: string;
    description: string;
    priority?: string;
  }
): Promise<MaintenanceRequestData> {
  const res = await fetch(`${BASE_URL}/maintenance`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to raise maintenance request');
  return res.json();
}

export async function approveMaintenanceRequest(token: string, id: string): Promise<MaintenanceRequestData> {
  const res = await fetch(`${BASE_URL}/maintenance/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve maintenance request');
  return res.json();
}

export async function assignTechnician(
  token: string,
  id: string,
  data: {
    assignedTechnician: string;
    cost?: number;
  }
): Promise<MaintenanceRequestData> {
  const res = await fetch(`${BASE_URL}/maintenance/${id}/assign`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to assign technician');
  return res.json();
}

export async function startMaintenanceWork(token: string, id: string): Promise<MaintenanceRequestData> {
  const res = await fetch(`${BASE_URL}/maintenance/${id}/start`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to start maintenance work');
  return res.json();
}

export async function resolveMaintenanceRequest(
  token: string,
  id: string,
  data: {
    resolutionNotes: string;
    finalCondition: string;
    cost?: number;
  }
): Promise<MaintenanceRequestData> {
  const res = await fetch(`${BASE_URL}/maintenance/${id}/resolve`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to resolve maintenance request');
  return res.json();
}
