import type { AssetData } from '../types/asset';

const BASE_URL = 'http://localhost:5000/api';

function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchAssets(
  token: string,
  filters: { search?: string; category?: string; status?: string; department?: string } = {}
): Promise<AssetData[]> {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.department) queryParams.append('department', filters.department);

  const res = await fetch(`${BASE_URL}/assets?${queryParams.toString()}`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch assets');
  return res.json();
}

export async function fetchAssetById(token: string, id: string): Promise<AssetData> {
  const res = await fetch(`${BASE_URL}/assets/${id}`, {
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch asset details');
  return res.json();
}

export async function createAsset(token: string, data: Partial<AssetData>): Promise<AssetData> {
  const res = await fetch(`${BASE_URL}/assets`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to register asset');
  return res.json();
}

export async function updateAsset(token: string, id: string, data: Partial<AssetData>): Promise<AssetData> {
  const res = await fetch(`${BASE_URL}/assets/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update asset');
  return res.json();
}

export async function patchAssetStatus(token: string, id: string, status: string): Promise<AssetData> {
  const res = await fetch(`${BASE_URL}/assets/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to patch asset status');
  return res.json();
}

export async function deleteAsset(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/assets/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete asset');
}
