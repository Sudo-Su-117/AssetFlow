import React from 'react';
import { Edit, Trash2, Power } from 'lucide-react';
import type { DepartmentData } from '../../../types/organization';

interface DepartmentTableProps {
  departments: DepartmentData[];
  onEdit: (dept: DepartmentData) => void;
  onToggleStatus: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => void;
  onDelete: (id: string) => void;
}

export const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Head</th>
            <th>Parent Dept</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{dept.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.departmentCode}</div>
              </td>
              <td>
                {dept.headEmployee ? (
                  <div>{dept.headEmployee.name}</div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>--</span>
                )}
              </td>
              <td>
                {dept.parentDepartment ? (
                  <div>{dept.parentDepartment.name}</div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>--</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => onToggleStatus(dept.id, dept.status)}
                  className={`badge ${dept.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}
                  title={`Click to mark as ${dept.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}
                  style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  {dept.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => onEdit(dept)}
                    title="Edit Department"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => onDelete(dept.id)}
                    title="Delete Department"
                    style={{ padding: '0.4rem 0.6rem', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
