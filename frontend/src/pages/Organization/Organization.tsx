import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Tags, 
  Users, 
  Plus, 
  Search, 
  Loader2, 
  Settings 
} from 'lucide-react';
import { useAuth, ForbiddenScreen } from '../../App';
import { 
  // Dept APIs
  fetchDepartments, createDepartment, updateDepartment, patchDepartmentStatus, deleteDepartment,
  // Cat APIs
  fetchCategories, createCategory, updateCategory, patchCategoryStatus, deleteCategory,
  // Emp APIs
  fetchEmployees, updateEmployee, patchEmployeeRole, patchEmployeeStatus
} from '../../services/organization.api';
import { DepartmentTable } from './components/DepartmentTable';
import { CategoryTable } from './components/CategoryTable';
import { EmployeeTable } from './components/EmployeeTable';
import { OrganizationDialog } from './components/OrganizationDialog';
import type { DepartmentData, CategoryData, EmployeeData } from '../../types/organization';

type ActiveTab = 'departments' | 'categories' | 'employees';

export const Organization: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog Modal States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // 2. React Query Fetching
  const { 
    data: departments = [], 
    isLoading: isLoadingDepts, 
    isError: isErrorDepts, 
    error: errorDepts 
  } = useQuery({
    queryKey: ['departments', email],
    queryFn: () => fetchDepartments(email),
    enabled: currentRole.role === 'ADMIN'
  });

  const { 
    data: categories = [], 
    isLoading: isLoadingCats, 
    isError: isErrorCats, 
    error: errorCats 
  } = useQuery({
    queryKey: ['categories', email],
    queryFn: () => fetchCategories(email),
    enabled: currentRole.role === 'ADMIN'
  });

  const { 
    data: employees = [], 
    isLoading: isLoadingEmps, 
    isError: isErrorEmps, 
    error: errorEmps 
  } = useQuery({
    queryKey: ['employees', email],
    queryFn: () => fetchEmployees(email),
    enabled: currentRole.role === 'ADMIN'
  });

  const isLoading = isLoadingDepts || isLoadingCats || isLoadingEmps;
  const isError = isErrorDepts || isErrorCats || isErrorEmps;

  // 3. Mutation Operations
  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (selectedItem) {
        // Edit / Update
        if (activeTab === 'departments') {
          return updateDepartment(email, selectedItem.id, formData);
        } else if (activeTab === 'categories') {
          return updateCategory(email, selectedItem.id, formData);
        } else if (activeTab === 'employees') {
          return updateEmployee(email, selectedItem.id, formData);
        }
      } else {
        // Add / Create
        if (activeTab === 'departments') {
          return createDepartment(email, formData);
        } else if (activeTab === 'categories') {
          return createCategory(email, formData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab, email] });
      // Clear selections and close modal
      setDialogOpen(false);
      setSelectedItem(null);
    }
  });

  // 1. Authorization Gate (Only ADMIN can see this page)
  // Placed after all hook declarations to satisfy React Rules of Hooks
  if (currentRole.role !== 'ADMIN') {
    return <ForbiddenScreen />;
  }

  // 4. Action Handlers
  const handleOpenAddDialog = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item: any) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    await saveMutation.mutateAsync(formData);
  };

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      if (activeTab === 'departments') {
        await patchDepartmentStatus(email, id, nextStatus);
      } else if (activeTab === 'categories') {
        await patchCategoryStatus(email, id, nextStatus);
      } else if (activeTab === 'employees') {
        await patchEmployeeStatus(email, id, nextStatus);
      }
      queryClient.invalidateQueries({ queryKey: [activeTab, email] });
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await patchEmployeeRole(email, id, newRole);
      queryClient.invalidateQueries({ queryKey: ['employees', email] });
      // Invalidate dashboard as roles influence quick actions and KPI counts
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      alert(err.message || 'Failed to promote employee role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;

    try {
      if (activeTab === 'departments') {
        await deleteDepartment(email, id);
      } else if (activeTab === 'categories') {
        await deleteCategory(email, id);
      }
      queryClient.invalidateQueries({ queryKey: [activeTab, email] });
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  // 5. Search Filters
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      if (activeTab === 'departments') return departments;
      if (activeTab === 'categories') return categories;
      return employees;
    }

    if (activeTab === 'departments') {
      return departments.filter(
        (d) => d.name.toLowerCase().includes(query) || d.departmentCode.toLowerCase().includes(query)
      );
    }
    
    if (activeTab === 'categories') {
      return categories.filter(
        (c) => c.name.toLowerCase().includes(query) || (c.description && c.description.toLowerCase().includes(query))
      );
    }

    return employees.filter(
      (e) => e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query)
    );
  };

  const filteredData = getFilteredData();

  if (isLoading) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Syncing Master Records...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-card error-container">
          <Settings size={48} className="alert-icon" style={{ color: 'var(--color-danger)' }} />
          <h2 className="error-title">Sync Error</h2>
          <p className="error-desc">Could not synchronize administrative datasets. Ensure the backend Express port is listening.</p>
          <button className="btn btn-primary" onClick={() => queryClient.refetchQueries()}>
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Tab controls and + Add buttons */}
      <div className="tab-bar">
        <div className="tabs-list">
          <button 
            className={`tab-trigger ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
          >
            <Building2 size={14} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Departments
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          >
            <Tags size={14} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Asset Categories
          </button>
          <button 
            className={`tab-trigger ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => { setActiveTab('employees'); setSearchQuery(''); }}
          >
            <Users size={14} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
            Employees
          </button>
        </div>

        {/* Global Add button (Disabled for employees tab since employees are registered via signup/import) */}
        {activeTab !== 'employees' && (
          <button className="btn btn-primary" onClick={handleOpenAddDialog}>
            <Plus size={16} /> Add {activeTab === 'departments' ? 'Department' : 'Category'}
          </button>
        )}
      </div>

      {/* Search Input Filter */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)' 
            }} 
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder={`Search ${activeTab}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', width: '100%', maxWidth: '400px' }}
          />
        </div>
      </div>

      {/* Main Aggregation Master Data Tables */}
      <div className="glass-card" style={{ minHeight: '350px' }}>
        {filteredData.length > 0 ? (
          <>
            {activeTab === 'departments' && (
              <DepartmentTable 
                departments={filteredData as DepartmentData[]} 
                onEdit={handleOpenEditDialog}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'categories' && (
              <CategoryTable 
                categories={filteredData as CategoryData[]} 
                onEdit={handleOpenEditDialog}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'employees' && (
              <EmployeeTable 
                employees={filteredData as EmployeeData[]} 
                onEdit={handleOpenEditDialog}
                onRoleChange={handleRoleChange}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </>
        ) : (
          <div className="empty-state">
            <Search size={44} />
            <p style={{ marginTop: '0.5rem' }}>No matching records found.</p>
          </div>
        )}
      </div>

      {/* Explanatory Caption corresponding to Supplied Wireframe */}
      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '3px solid var(--color-primary)', paddingLeft: '0.75rem' }}>
        Editing a department or asset category here drives the picklist selection forms in Screen 4 (Asset Registration) & Screen 5 (Allocations & Transfers).
      </p>

      {/* Add / Edit modal overlays */}
      <OrganizationDialog 
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={activeTab}
        item={selectedItem}
        onSave={handleSave}
        departmentsList={departments}
        employeesList={employees}
      />
    </div>
  );
};
