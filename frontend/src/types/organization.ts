export interface DepartmentData {
  id: string;
  name: string;
  departmentCode: string;
  parentDepartmentId: string | null;
  parentDepartment?: { id: string; name: string } | null;
  headEmployeeId: string | null;
  headEmployee?: { id: string; name: string; email: string } | null;
  status: 'ACTIVE' | 'INACTIVE';
  _count?: {
    users: number;
    assets: number;
  };
}

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  customFields: string | null; // Comma-separated field names
  status: 'ACTIVE' | 'INACTIVE';
  _count?: {
    assets: number;
  };
}

export interface EmployeeData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: string | null;
  department?: { id: string; name: string } | null;
}
