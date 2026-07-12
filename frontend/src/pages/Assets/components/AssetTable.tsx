import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { AssetData } from '../../../types/asset';

interface AssetTableProps {
  assets: AssetData[];
  onViewDetails: (asset: AssetData) => void;
  onEdit: (asset: AssetData) => void;
  onDelete: (id: string) => void;
  canWrite: boolean;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onViewDetails,
  onEdit,
  onDelete,
  canWrite
}) => {
  const getStatusBadge = (status: AssetData['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge badge-active">Available</span>;
      case 'ALLOCATED':
        return <span className="badge badge-active" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#bfdbfe', borderColor: 'rgba(59, 130, 246, 0.2)' }}>Allocated</span>;
      case 'RESERVED':
        return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#ddd6fe', borderColor: 'rgba(139, 92, 246, 0.2)' }}>Reserved</span>;
      case 'UNDER_MAINTENANCE':
        return <span className="badge badge-inactive" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fde68a', borderColor: 'rgba(245, 158, 11, 0.2)' }}>Maintenance</span>;
      case 'LOST':
      case 'RETIRED':
      case 'DISPOSED':
        return <span className="badge badge-inactive">{status.replace('_', ' ')}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tag</th>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Location</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => onViewDetails(asset)}>
              <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {asset.assetTag}
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{asset.name}</div>
                {asset.serialNumber && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>S/N: {asset.serialNumber}</div>
                )}
              </td>
              <td>
                {asset.category ? (
                  <span>{asset.category.name}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>--</span>
                )}
              </td>
              <td>{getStatusBadge(asset.status)}</td>
              <td>
                {asset.location ? (
                  <span>{asset.location}</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>--</span>
                )}
              </td>
              <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => onViewDetails(asset)}
                    title="View Details History"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <Eye size={14} />
                  </button>
                  {canWrite && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onEdit(asset)}
                        title="Edit Asset Registry"
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onDelete(asset.id)}
                        title="Delete Asset Registry"
                        style={{ padding: '0.4rem 0.6rem', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
