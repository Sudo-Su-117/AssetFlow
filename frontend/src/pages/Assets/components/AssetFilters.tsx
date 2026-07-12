

import React from 'react';
import type { CategoryData, DepartmentData } from '../../../types/organization';

interface AssetFiltersProps {
  category: string;
  setCategory: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  categoriesList: CategoryData[];
  departmentsList: DepartmentData[];
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  category,
  setCategory,
  status,
  setStatus,
  department,
  setDepartment,
  categoriesList,
  departmentsList
}) => {
  const STATUSES = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Allocated', value: 'ALLOCATED' },
    { label: 'Reserved', value: 'RESERVED' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Retired', value: 'RETIRED' },
    { label: 'Disposed', value: 'DISPOSED' }
  ];

  return (
    <div className="filters-grid">
      {/* Category Filter */}
      <div className="detail-item">
        <label className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Category</label>
        <select 
          className="form-select" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All Categories</option>
          {categoriesList.filter(c => c.status === 'ACTIVE').map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="detail-item">
        <label className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</label>
        <select 
          className="form-select" 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Department Filter */}
      <div className="detail-item">
        <label className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Owner Department</label>
        <select 
          className="form-select" 
          value={department} 
          onChange={(e) => setDepartment(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All Departments</option>
          {departmentsList.filter(d => d.status === 'ACTIVE').map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.departmentCode})</option>
          ))}
        </select>
      </div>
    </div>
  );
};
