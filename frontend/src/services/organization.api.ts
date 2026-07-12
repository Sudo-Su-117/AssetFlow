import type { DepartmentData, CategoryData, EmployeeData } from '../types/organization';

const BASE_URL = 'http://localhost:5000/api';

// Helper to compile headers with Auth Token
function getHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// -------------------------------------------------------------
// Departments APIs
// -------------------------------------------------------------
export async function fetchDepartments(token: string): Promise<DepartmentData[]> {
  const res = await fetch(`${BASE_URL}/departments`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch departments');
  return res.json();
}

export async function createDepartment(token: string, data: Partial<DepartmentData>): Promise<DepartmentData> {
  const res = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create department');
  return res.json();
}

export async function updateDepartment(token: string, id: string, data: Partial<DepartmentData>): Promise<DepartmentData> {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update department');
  return res.json();
}

export async function patchDepartmentStatus(token: string, id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<DepartmentData> {
  const res = await fetch(`${BASE_URL}/departments/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update department status');
  return res.json();
}

export async function deleteDepartment(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete department');
}

// -------------------------------------------------------------
// Categories APIs
// -------------------------------------------------------------
export async function fetchCategories(token: string): Promise<CategoryData[]> {
  const res = await fetch(`${BASE_URL}/categories`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch categories');
  return res.json();
}

export async function createCategory(token: string, data: Partial<CategoryData>): Promise<CategoryData> {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create category');
  return res.json();
}

export async function updateCategory(token: string, id: string, data: Partial<CategoryData>): Promise<CategoryData> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update category');
  return res.json();
}

export async function patchCategoryStatus(token: string, id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<CategoryData> {
  const res = await fetch(`${BASE_URL}/categories/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update category status');
  return res.json();
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete category');
}

// -------------------------------------------------------------
// Employees APIs
// -------------------------------------------------------------
export async function fetchEmployees(token: string): Promise<EmployeeData[]> {
  const res = await fetch(`${BASE_URL}/employees`, { headers: getHeaders(token) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch employees');
  return res.json();
}

export async function updateEmployee(token: string, id: string, data: Partial<EmployeeData>): Promise<EmployeeData> {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update employee details');
  return res.json();
}

export async function patchEmployeeRole(token: string, id: string, role: string): Promise<EmployeeData> {
  const res = await fetch(`${BASE_URL}/employees/${id}/role`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to promote employee role');
  return res.json();
}

export async function patchEmployeeStatus(token: string, id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<EmployeeData> {
  const res = await fetch(`${BASE_URL}/employees/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update employee status');
  return res.json();
}
