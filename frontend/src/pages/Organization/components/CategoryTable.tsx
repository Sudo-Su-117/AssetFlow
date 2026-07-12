import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { CategoryData } from '../../../types/organization';

interface CategoryTableProps {
  categories: CategoryData[];
  onEdit: (cat: CategoryData) => void;
  onToggleStatus: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => void;
  onDelete: (id: string) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Custom Attributes</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{cat.name}</div>
              </td>
              <td>
                {cat.description ? (
                  <span>{cat.description}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No description</span>
                )}
              </td>
              <td>
                {cat.customFields ? (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {cat.customFields.split(',').map((f, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          fontSize: '0.75rem', 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)' 
                        }}
                      >
                        {f.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None defined</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => onToggleStatus(cat.id, cat.status)}
                  className={`badge ${cat.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}
                  title={`Click to mark as ${cat.status === 'ACTIVE' ? 'Inactive' : 'Active'}`}
                  style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                >
                  {cat.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => onEdit(cat)}
                    title="Edit Category"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => onDelete(cat.id)}
                    title="Delete Category"
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
