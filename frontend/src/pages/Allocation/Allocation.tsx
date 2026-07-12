import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Calendar, 
  ArrowLeftRight, 
  UserCheck, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  Loader2, 
  FileText, 
  Undo2 
} from 'lucide-react';
import { useAuth } from '../../App';
import { 
  fetchAllocationDetails, 
  createAllocation, 
  returnAsset, 
  fetchTransfers, 
  createTransferRequest, 
  approveTransfer, 
  rejectTransfer 
} from '../../services/allocation.api';
import { fetchAssets } from '../../services/asset.api';
import { fetchEmployees } from '../../services/organization.api';
import type { AssetData } from '../../types/asset';

export const Allocation: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  const canWrite = currentRole.role === 'ADMIN' || currentRole.role === 'ASSET_MANAGER';

  // Selection state
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  
  // Return Dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnNotes, setReturnNotes] = useState('');

  // Form states
  const [newOwnerId, setNewOwnerId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('NEW');

  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALLOCATE' | 'TRANSFER'>('ALLOCATE');

  // 1. Fetch Assets list
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', email],
    queryFn: () => fetchAssets(email),
    enabled: !!email
  });

  // 2. Fetch Employee list for selectors
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', email],
    queryFn: () => fetchEmployees(email),
    enabled: !!email
  });

  // 3. Fetch Selected Asset's Allocation Logs & History
  const { 
    data: allocDetails = { activeAllocation: null, history: [] }, 
    isLoading: isLoadingDetails,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ['allocationDetails', selectedAssetId, email],
    queryFn: () => fetchAllocationDetails(email, selectedAssetId),
    enabled: !!selectedAssetId
  });

  // 4. Fetch Pending Transfers Approval list
  const { data: transfersList = [], refetch: refetchTransfers } = useQuery({
    queryKey: ['transfers', email],
    queryFn: () => fetchTransfers(email),
    enabled: !!email
  });

  // Mutations
  const checkoutMutation = useMutation({
    mutationFn: (data: any) => createAllocation(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['allocationDetails', selectedAssetId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNewOwnerId('');
      setCheckoutNotes('');
      setExpectedReturnDate('');
    }
  });

  const returnMutation = useMutation({
    mutationFn: (data: any) => returnAsset(email, allocDetails.activeAllocation!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['allocationDetails', selectedAssetId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReturnDialogOpen(false);
      setReturnNotes('');
    }
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => createTransferRequest(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setTransferTargetId('');
      setTransferReason('');
      alert('Transfer request submitted successfully. Awaiting Manager approval.');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveTransfer(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedAssetId) {
        refetchDetails();
      }
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectTransfer(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });

  // Submit handlers
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!newOwnerId) return setSubmitError('Please select a target employee.');

    try {
      await checkoutMutation.mutateAsync({
        assetId: selectedAssetId,
        userId: newOwnerId,
        expectedReturnDate: expectedReturnDate || null,
        conditionAtAllocation: checkoutCondition,
        notes: checkoutNotes
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Direct allocation failed.');
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await returnMutation.mutateAsync({
        conditionAtReturn: returnCondition,
        notes: returnNotes
      });
    } catch (err: any) {
      alert(err.message || 'Asset return failed.');
    }
  };

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!transferTargetId) return setSubmitError('Please select the recipient employee.');
    if (!transferReason.trim()) return setSubmitError('Please provide a reason for the transfer.');

    try {
      await transferMutation.mutateAsync({
        assetId: selectedAssetId,
        toUserId: transferTargetId,
        reason: transferReason
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Transfer request failed.');
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const activeAllocation = allocDetails.activeAllocation;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="main-content">
      
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Asset Allocation & Transfers</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Manage physical asset assignments. Prevents double-allocation using strict approval workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Asset Selection & Workflows */}
        <div>
          {/* Asset Selection (Searchable select selector card) */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Select Asset to Manage</label>
            <select
              value={selectedAssetId}
              onChange={(e) => { setSelectedAssetId(e.target.value); setSubmitError(null); }}
              className="form-input"
              style={{ padding: '0.75rem', width: '100%' }}
            >
              <option value="">-- Choose Asset from Directory --</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} - {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {/* If Loading asset logs */}
          {selectedAssetId && isLoadingDetails && (
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="spin-animation" style={{ color: 'var(--color-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Syncing ownership state...</p>
            </div>
          )}

          {/* If asset is selected */}
          {selectedAssetId && !isLoadingDetails && selectedAsset && (
            <>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('ALLOCATE'); setSubmitError(null); }}
                  style={{
                    flex: 1,
                    background: activeTab === 'ALLOCATE' ? 'rgba(59, 130, 246, 0.15)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: activeTab === 'ALLOCATE' ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Direct Allocation & Return
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('TRANSFER'); setSubmitError(null); }}
                  style={{
                    flex: 1,
                    background: activeTab === 'TRANSFER' ? 'rgba(59, 130, 246, 0.15)' : 'none',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: activeTab === 'TRANSFER' ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Initiate Asset Transfer
                </button>
              </div>

              {/* Workflow Error messages */}
              {submitError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  {submitError}
                </div>
              )}

              {/* TAB 1: ALLOCATION & RETURN */}
              {activeTab === 'ALLOCATE' && (
                <>
                  {activeAllocation ? (
                    // 1. ALLOCATED Warning banner
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.25)', 
                      borderRadius: '12px', 
                      padding: '1.25rem', 
                      marginBottom: '1.5rem', 
                      color: '#fca5a5' 
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ marginTop: '0.15rem' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            Already Allocated to {activeAllocation.user?.name} ({activeAllocation.user?.department?.name || 'No Dept'})
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>
                            Direct re-allocation is blocked. Submit a transfer request under the <strong>Initiate Asset Transfer</strong> tab or return the asset below.
                          </div>
                        </div>
                      </div>

                      {/* Return Asset check-in action (Managers Only) */}
                      {canWrite && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setReturnDialogOpen(true)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                          >
                            <Undo2 size={12} style={{ marginRight: '0.35rem' }} /> Return check-in
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 2. AVAILABLE Info banner
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.25)', 
                      borderRadius: '12px', 
                      padding: '1.25rem', 
                      marginBottom: '1.5rem', 
                      color: '#a7f3d0' 
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Info size={20} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Asset is Available in Float Pool
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem', marginLeft: '2.1rem' }}>
                        You can directly allocate this asset to any active employee.
                      </p>
                    </div>
                  )}

                  {/* DIRECT ALLOCATION FORM (Shown only if available) */}
                  {!activeAllocation && (
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        Direct Asset Allocation Checkout
                      </h3>
                      {canWrite ? (
                        <form onSubmit={handleCheckout}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {/* Target Employee */}
                            <div className="form-group">
                              <label className="form-label">Assign to Employee</label>
                              <select 
                                className="form-select"
                                value={newOwnerId}
                                onChange={(e) => setNewOwnerId(e.target.value)}
                              >
                                <option value="">Select Employee...</option>
                                {employees.filter(emp => emp.status === 'ACTIVE').map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.email})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Expected Return Date */}
                            <div className="form-group">
                              <label className="form-label">Expected Return Date (Optional)</label>
                              <input 
                                type="date" 
                                className="form-input" 
                                value={expectedReturnDate}
                                onChange={(e) => setExpectedReturnDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {/* Condition */}
                            <div className="form-group">
                              <label className="form-label">Initial Condition</label>
                              <select 
                                className="form-select"
                                value={checkoutCondition}
                                onChange={(e) => setCheckoutCondition(e.target.value)}
                              >
                                <option value="NEW">New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="POOR">Poor</option>
                              </select>
                            </div>
                          </div>

                          {/* Checkout Notes */}
                          <div className="form-group">
                            <label className="form-label">Checkout Notes</label>
                            <textarea 
                              className="form-textarea" 
                              placeholder="Condition at checkout, instructions..." 
                              rows={2}
                              value={checkoutNotes}
                              onChange={(e) => setCheckoutNotes(e.target.value)}
                            />
                          </div>

                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={checkoutMutation.isPending}
                          >
                            {checkoutMutation.isPending ? 'Checking Out...' : 'Check Out Asset'}
                          </button>
                        </form>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Access Denied: Only Admin or Asset Manager accounts can check out available assets.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: TRANSFER REQUEST */}
              {activeTab === 'TRANSFER' && (
                <>
                  {activeAllocation ? (
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        Initiate Ownership Transfer
                      </h3>
                      <form onSubmit={handleTransferRequest}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          {/* From current owner */}
                          <div className="form-group">
                            <label className="form-label">From Holder (Current)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={activeAllocation.user?.name || ''} 
                              disabled 
                            />
                          </div>
                          
                          {/* To new recipient */}
                          <div className="form-group">
                            <label className="form-label">To Employee (Recipient)</label>
                            <select 
                              className="form-select"
                              value={transferTargetId}
                              onChange={(e) => setTransferTargetId(e.target.value)}
                            >
                              <option value="">Select Employee...</option>
                              {employees.filter(emp => emp.id !== activeAllocation.userId && emp.status === 'ACTIVE').map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="form-group">
                          <label className="form-label">Reason for Transfer</label>
                          <textarea 
                            className="form-textarea" 
                            placeholder="State reason for ownership change..." 
                            rows={3}
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={transferMutation.isPending}
                        >
                          {transferMutation.isPending ? 'Submitting...' : 'Submit Transfer Request'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    // AVAILABLE Info warning
                    <div style={{ 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      border: '1px solid rgba(245, 158, 11, 0.25)', 
                      borderRadius: '12px', 
                      padding: '1.25rem', 
                      marginBottom: '2rem', 
                      color: '#fde68a' 
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ marginTop: '0.15rem' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Asset is in Float Pool</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>
                            This asset is currently not allocated to anyone. You can only request transfers for active allocations. Use the <strong>Direct Allocation & Return</strong> tab to assign it.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TIMELINE: OWNERSHIP HISTORY (Chronological, matching wireframe layout) */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  Allocation History
                </h3>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  {allocDetails.history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {allocDetails.history.map((hist) => (
                        <div 
                          key={hist.id} 
                          style={{ 
                            fontSize: '0.875rem', 
                            lineHeight: 1.5,
                            borderLeft: `2.5px solid ${hist.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--border-color)'}`,
                            paddingLeft: '0.75rem' 
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {formatDate(hist.allocatedAt)} - {hist.status === 'ACTIVE' ? 'Allocated to' : 'Returned by'} {hist.user?.name} ({hist.user?.department?.name || 'No Dept'})
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Condition: <span style={{ color: 'var(--text-primary)' }}>{hist.status === 'ACTIVE' ? hist.conditionAtAllocation : hist.conditionAtReturn || 'GOOD'}</span>
                            {hist.notes && ` • Note: ${hist.notes}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      No history recorded.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Empty Selector banner */}
          {!selectedAssetId && (
            <div className="glass-card empty-state" style={{ height: '350px' }}>
              <Building2 size={44} />
              <p style={{ marginTop: '0.5rem' }}>Select an asset above to manage allocations or request transfers.</p>
            </div>
          )}

        </div>

        {/* Right Column: Pending Approvals Table (Visible only to Admin / Managers) */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={18} style={{ color: 'var(--color-primary)' }} />
              Pending Transfers
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Transfer requests submitted by employees. Manager approval updates active owners automatically.
            </p>

            {transfersList.filter(t => t.status === 'PENDING').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transfersList.filter(t => t.status === 'PENDING').map((tx) => (
                  <div 
                    key={tx.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '1rem' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{tx.asset?.assetTag}</strong>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tx.asset?.name}</div>
                      </div>
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fde68a', fontSize: '0.7rem' }}>Pending</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      From: <strong>{tx.fromUser?.name}</strong>
                      <br />
                      To: <strong>{tx.toUser?.name}</strong>
                      {tx.reason && (
                        <div style={{ marginTop: '0.35rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '0.25rem 0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--border-color)' }}>
                          Reason: "{tx.reason}"
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Only for Admins/Managers) */}
                    {canWrite ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => rejectMutation.mutate(tx.id)}
                          disabled={rejectMutation.isPending}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                        >
                          <X size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                          Reject
                        </button>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => approveMutation.mutate(tx.id)}
                          disabled={approveMutation.isPending}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Check size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                          Approve
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Awaiting Manager review.
                      </div>
                    )}

                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <Check size={28} />
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No pending transfers requests.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* DIALOG 1: RETURN CHECK-IN FORM (Managers Only) */}
      {returnDialogOpen && activeAllocation && (
        <div className="modal-overlay" onClick={() => setReturnDialogOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Asset Return check-in
              </h3>
              <button 
                onClick={() => setReturnDialogOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReturn}>
              {/* Asset Identifiers */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>Asset: <strong>{selectedAsset?.assetTag} - {selectedAsset?.name}</strong></div>
                <div>Returned By: <strong>{activeAllocation.user?.name}</strong></div>
              </div>

              {/* Condition */}
              <div className="form-group">
                <label className="form-label">Return Condition</label>
                <select 
                  className="form-select"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor (Damaged)</option>
                </select>
              </div>

              {/* Check-in Notes */}
              <div className="form-group">
                <label className="form-label">Return Notes</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="State condition remarks or return details..." 
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setReturnDialogOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={returnMutation.isPending}
                  style={{ background: 'var(--color-primary)' }}
                >
                  {returnMutation.isPending ? 'Processing...' : 'Complete Return check-in'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
