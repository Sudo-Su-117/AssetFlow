import type { AuditCycleData, AuditRecordData, DiscrepancyData } from '../types/audit';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchAudits(token: string): Promise<AuditCycleData[]> {
  const res = await fetch(`${BASE_URL}/audits`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch audit cycles');
  return res.json();
}

export async function fetchAuditDetails(
  token: string,
  id: string
): Promise<{ auditCycle: AuditCycleData; records: AuditRecordData[]; discrepancies: DiscrepancyData[] }> {
  const res = await fetch(`${BASE_URL}/audits/${id}`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch audit details');
  return res.json();
}

export async function createAuditCycle(
  token: string,
  data: {
    title: string;
    departmentId: string;
    location?: string;
    startDate: string;
    endDate: string;
    assignedAuditors: string;
  }
): Promise<AuditCycleData> {
  const res = await fetch(`${BASE_URL}/audits`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create audit cycle');
  return res.json();
}

export async function verifyAsset(
  token: string,
  auditId: string,
  assetId: string,
  data: {
    verificationStatus: 'VERIFIED' | 'MISSING' | 'DAMAGED';
    remarks?: string;
  }
): Promise<AuditRecordData> {
  const res = await fetch(`${BASE_URL}/audits/${auditId}/assets/${assetId}/verify`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit verification check');
  return res.json();
}

export async function closeAuditCycle(token: string, id: string): Promise<AuditCycleData> {
  const res = await fetch(`${BASE_URL}/audits/${id}/close`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to close audit cycle');
  return res.json();
}
