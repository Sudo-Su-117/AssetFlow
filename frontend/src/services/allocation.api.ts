import type { AllocationData, TransferRequestData } from '../types/allocation';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// -------------------------------------------------------------
// Allocations API
// -------------------------------------------------------------
export async function fetchAllocations(token: string): Promise<AllocationData[]> {
  const res = await fetch(`${BASE_URL}/allocations`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch allocations list');
  return res.json();
}

export async function fetchAllocationDetails(
  token: string,
  assetId: string
): Promise<{ activeAllocation: AllocationData | null; history: AllocationData[] }> {
  const res = await fetch(`${BASE_URL}/allocations/asset/${assetId}`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch allocation logs');
  return res.json();
}

export async function createAllocation(
  token: string,
  data: {
    assetId: string;
    userId: string;
    expectedReturnDate?: string | null;
    conditionAtAllocation?: string;
    notes?: string;
  }
): Promise<AllocationData> {
  const res = await fetch(`${BASE_URL}/allocations`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to check out asset');
  return res.json();
}

export async function returnAsset(
  token: string,
  allocationId: string,
  data: {
    conditionAtReturn: string;
    notes?: string;
  }
): Promise<AllocationData> {
  const res = await fetch(`${BASE_URL}/allocations/${allocationId}/return`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to process return checkout');
  return res.json();
}

// -------------------------------------------------------------
// Transfers API
// -------------------------------------------------------------
export async function fetchTransfers(token: string): Promise<TransferRequestData[]> {
  const res = await fetch(`${BASE_URL}/transfers`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch transfer logs');
  return res.json();
}

export async function createTransferRequest(
  token: string,
  data: {
    assetId: string;
    toUserId: string;
    reason: string;
  }
): Promise<TransferRequestData> {
  const res = await fetch(`${BASE_URL}/transfers`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit transfer request');
  return res.json();
}

export async function approveTransfer(token: string, id: string): Promise<TransferRequestData> {
  const res = await fetch(`${BASE_URL}/transfers/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve transfer');
  return res.json();
}

export async function rejectTransfer(token: string, id: string): Promise<TransferRequestData> {
  const res = await fetch(`${BASE_URL}/transfers/${id}/reject`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to reject transfer');
  return res.json();
}
