import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../App';
import { fetchAssets, createAsset, updateAsset, deleteAsset } from '../../services/asset.api';
import { fetchCategories, fetchDepartments } from '../../services/organization.api';
import { AssetTable } from './components/AssetTable';
import { AssetFilters } from './components/AssetFilters';
import { RegisterAssetModal } from './components/RegisterAssetModal';
import { AssetDetailsDrawer } from './components/AssetDetailsDrawer';
import type { AssetData } from '../../types/asset';

export const Assets: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  // Role permissions gate
  const canWrite = currentRole.role === 'ADMIN' || currentRole.role === 'ASSET_MANAGER';

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Dialog / Drawer States
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [selectedEditAsset, setSelectedEditAsset] = useState<AssetData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Debounce search input to limit API overhead
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Master lists query to feed filters and modals
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', email],
    queryFn: () => fetchCategories(email),
    enabled: !!email
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', email],
    queryFn: () => fetchDepartments(email),
    enabled: !!email
  });

  // Main Assets registry query (refetch triggers on search/filter/role modifications)
  const { 
    data: assets = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['assets', email, debouncedSearch, categoryFilter, statusFilter, deptFilter],
    queryFn: () => fetchAssets(email, {
      search: debouncedSearch,
      category: categoryFilter,
      status: statusFilter,
      department: deptFilter
    }),
    enabled: !!email
  });

  // Mutation handlers
  const saveAssetMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (selectedEditAsset) {
        return updateAsset(email, selectedEditAsset.id, formData);
      } else {
        return createAsset(email, formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      // Invalidate dashboard charts counts as well
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
      setSelectedEditAsset(null);
    }
  });

  // Action handlers
  const handleOpenAddModal = () => {
    setSelectedEditAsset(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (asset: AssetData) => {
    setSelectedEditAsset(asset);
    setModalOpen(true);
  };

  const handleSaveAsset = async (formData: any) => {
    await saveAssetMutation.mutateAsync(formData);
  };

  const handleOpenDetails = (asset: AssetData) => {
    setSelectedAssetId(asset.id);
    setDrawerOpen(true);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset from the registry?')) return;
    try {
      await deleteAsset(email, id);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  return (
    <div className="main-content">
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Asset Master Registry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Search, filter, and manage physical items. Restricted by role access controls.
          </p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Register Asset
          </button>
        )}
      </div>

      {/* Search Input Bar (Matches Wireframe Top) */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
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
            placeholder="Search by tag, serial, or name..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ paddingLeft: '2.75rem', width: '100%', maxWidth: '480px' }}
          />
        </div>
      </div>

      {/* combinable Filter Dropdowns (Matches Wireframe 2nd Row) */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <AssetFilters 
          category={categoryFilter}
          setCategory={setCategoryFilter}
          status={statusFilter}
          setStatus={setStatusFilter}
          department={deptFilter}
          setDepartment={setDeptFilter}
          categoriesList={categories}
          departmentsList={departments}
        />
      </div>

      {/* Registry Database List */}
      <div className="glass-card" style={{ minHeight: '350px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px' }}>
            <Loader2 size={36} className="spin-animation" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Syncing Asset Directory...</p>
          </div>
        ) : isError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px' }}>
            <Package size={44} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sync Failed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Could not retrieve asset list. Verify server status.
            </p>
            <button className="btn btn-primary" onClick={() => refetch()}>Retry Connection</button>
          </div>
        ) : assets.length > 0 ? (
          <AssetTable 
            assets={assets}
            onViewDetails={handleOpenDetails}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteAsset}
            canWrite={canWrite}
          />
        ) : (
          <div className="empty-state" style={{ height: '350px' }}>
            <Package size={44} />
            <p style={{ marginTop: '0.5rem' }}>No assets found in the registry.</p>
          </div>
        )}
      </div>

      {/* Registration & Edit modal */}
      <RegisterAssetModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedEditAsset}
        onSave={handleSaveAsset}
        categoriesList={categories}
        departmentsList={departments}
      />

      {/* Relational details slider panel */}
      <AssetDetailsDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        assetId={selectedAssetId}
      />
    </div>
  );
};
