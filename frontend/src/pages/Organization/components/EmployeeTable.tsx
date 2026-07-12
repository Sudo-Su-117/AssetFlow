import React from 'react';
import { Edit } from 'lucide-react';
import type { EmployeeData } from '../../../types/organization';

interface EmployeeTableProps {
  employees: EmployeeData[];
  onEdit: (emp: EmployeeData) => void;
  onRoleChange: (id: string, newRole: string) => void;
  onToggleStatus: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onRoleChange,
  onToggleStatus
}) => {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role (Promotions)</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{emp.name}</div>
              </td>
              <td>{emp.email}</td>
              <td>
                {emp.department ? (
                  <span 
                    style={{ 
                      fontSize: '0.8rem', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: 'var(--color-primary)', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      border: '1px solid rgba(59, 130, 246, 0.2)' 
                    }}
                  >
                    {emp.department.name}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>--</span>
                )}
              </td>
              <td>
                <select
                  value={emp.role}
                  onChange={(e) => onRoleChange(emp.id, e.target.value)}
                  className="role-select"
                  style={{ 
                    padding: '0.3rem 0.6rem', 
                    fontSize: '0.8rem', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px'
                  }}
                  title="Promote or demote user role"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => onToggleStatus(emp.id, emp.status)}
                  className={`badge ${emp.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}
                  title={`Click to mark as ${emp.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}
                  style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td style={{ textAlign: 'right' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => onEdit(emp)}
                  title="Edit Employee Information"
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <Edit size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
