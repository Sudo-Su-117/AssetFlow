import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, X, Lock, Check, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../App';
import { 
  fetchAudits, 
  fetchAuditDetails, 
  createAuditCycle, 
  verifyAsset, 
  closeAuditCycle 
} from '../../services/audit.api';
import { fetchDepartments } from '../../services/organization.api';
import type { AuditCycleData, AuditRecordData } from '../../types/audit';

export const Audit: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = currentRole.role === 'ADMIN' || currentRole.role === 'ASSET_MANAGER';

  // Selected State
  const [selectedAuditId, setSelectedAuditId] = useState('');
  
  // Modal states
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedAuditors, setAssignedAuditors] = useState('');
  
  // Row inline remarks state (maps recordId -> string)
  const [remarksInput, setRemarksInput] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Fetch Audit Cycles list
  const { data: audits = [] } = useQuery({
    queryKey: ['audits', email],
    queryFn: () => fetchAudits(email),
    enabled: !!email,
    onSuccess: (data) => {
      // Auto select the first audit cycle if none is selected
      if (data.length > 0 && !selectedAuditId) {
        setSelectedAuditId(data[0].id);
      }
    }
  });

  // 2. Fetch Selected Audit Cycle Details (records, discrepancies)
  const { 
    data: auditDetails = { auditCycle: null as any, records: [] as AuditRecordData[], discrepancies: [] as any[] }, 
    isLoading: isLoadingDetails,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ['auditDetails', selectedAuditId, email],
    queryFn: () => fetchAuditDetails(email, selectedAuditId),
    enabled: !!selectedAuditId
  });

  // 3. Fetch Departments for creation modal
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', email],
    queryFn: () => fetchDepartments(email),
    enabled: !!email
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => createAuditCycle(email, data),
    onSuccess: (newCycle) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setSelectedAuditId(newCycle.id);
      setCreateOpen(false);
      setTitle('');
      setDepartmentId('');
      setLocationInput('');
      setStartDate('');
      setEndDate('');
      setAssignedAuditors('');
    }
  });

  const verifyMutation = useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: any }) => verifyAsset(email, selectedAuditId, assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditDetails', selectedAuditId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAuditCycle(email, selectedAuditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditDetails', selectedAuditId] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert('Audit Cycle successfully closed and locked. All discrepancies logged.');
    }
  });

  // Submits
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || !departmentId || !startDate || !endDate || !assignedAuditors.trim()) {
      return setValidationError('All fields are required.');
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        departmentId,
        location: locationInput.trim() || undefined,
        startDate,
        endDate,
        assignedAuditors: assignedAuditors.trim()
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to create campaign.');
    }
  };

  const handleVerifyClick = async (assetId: string, status: 'VERIFIED' | 'MISSING' | 'DAMAGED', recordId: string) => {
    const remark = remarksInput[recordId] || '';
    try {
      await verifyMutation.mutateAsync({
        assetId,
        data: {
          verificationStatus: status,
          remarks: remark.trim() || undefined
        }
      });
    } catch (err: any) {
      alert(err.message || 'Failed to submit verification check.');
    }
  };

  const handleRemarksBlur = async (assetId: string, status: string, recordId: string) => {
    if (status === 'PENDING') return; // Only save remarks if a status is checked
    const remark = remarksInput[recordId] || '';
    try {
      await verifyMutation.mutateAsync({
        assetId,
        data: {
          verificationStatus: status as any,
          remarks: remark.trim() || undefined
        }
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCloseCycle = () => {
    if (!window.confirm('Close Audit Cycle? This action generates final reports, locked records, and cannot be undone.')) return;
    closeMutation.mutate();
  };

  const cycle = auditDetails.auditCycle;
  const records = auditDetails.records;
  const discrepancies = auditDetails.discrepancies;
  const isClosed = cycle?.status === 'CLOSED';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="main-content">
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Asset Audit Cycles</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Conduct physical asset audits. Discrepancy reports are compiled automatically.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Cycle Selector */}
          <select
            value={selectedAuditId}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem', minWidth: '220px', margin: 0 }}
          >
            <option value="">-- Choose Audit Campaign --</option>
            {audits.map(aud => (
              <option key={aud.id} value={aud.id}>{aud.title} ({aud.status})</option>
            ))}
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setValidationError(null); setCreateOpen(true); }}>
              <Plus size={16} /> Create Campaign
            </button>
          )}
        </div>
      </div>

      {/* Selected Audit workspace */}
      {selectedAuditId && cycle ? (
        isLoadingDetails ? (
          <div className="glass-card" style={{ padding: '4rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Compiling checklist...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Top Summary Card (Matches Wireframe) */}
            <div className="glass-card" style={{ 
              padding: '1.5rem', 
              background: isClosed ? 'rgba(255,255,255,0.01)' : 'rgba(59, 130, 246, 0.02)',
              border: `1px solid ${isClosed ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.15)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {cycle.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>Scope: <strong>{cycle.department?.name} Department</strong></div>
                    {cycle.location && <div>Location: <strong>{cycle.location}</strong></div>}
                    <div>Dates: <strong>{formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}</strong></div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Assigned Auditors: <span style={{ color: 'var(--text-secondary)' }}>{cycle.assignedAuditors}</span>
                  </div>
                </div>

                <span className={`badge ${isClosed ? 'badge-inactive' : 'badge-active'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                  {isClosed ? 'CLOSED (LOCKED)' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* 2. Discrepancy Summary Banner (Yellow warning bar matching wireframe) */}
            {discrepancies.length > 0 && (
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.12)', 
                border: '1px solid rgba(245, 158, 11, 0.25)', 
                borderRadius: '8px', 
                padding: '1rem', 
                color: '#fde68a',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertOctagon size={18} style={{ color: '#f59e0b' }} />
                <span>
                  {discrepancies.length} assets flagged — discrepancy report compiled automatically.
                </span>
              </div>
            )}

            {/* 3. Central Verification Checklist Table */}
            <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Tag / Model</th>
                    <th>Expected Location</th>
                    <th>Verification Status</th>
                    <th>Auditor Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const status = rec.verificationStatus;
                    const rInputVal = remarksInput[rec.id] !== undefined ? remarksInput[rec.id] : (rec.remarks || '');
                    
                    return (
                      <tr key={rec.id}>
                        {/* Asset info */}
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{rec.asset?.assetTag}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rec.asset?.name}</div>
                        </td>

                        {/* Location expected */}
                        <td style={{ fontSize: '0.85rem' }}>
                          {rec.expectedLocation}
                        </td>

                        {/* Verification Status bubbles (Matches wireframe layout) */}
                        <td>
                          {isClosed ? (
                            // Read-only badge if closed
                            <span 
                              className="badge"
                              style={{
                                background: status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.1)' : status === 'MISSING' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                color: status === 'VERIFIED' ? '#a7f3d0' : status === 'MISSING' ? '#fca5a5' : '#e5e7eb'
                              }}
                            >
                              {status}
                            </span>
                          ) : (
                            // Interactive Bubbles
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                type="button" 
                                className="btn"
                                onClick={() => handleVerifyClick(rec.assetId, 'VERIFIED', rec.id)}
                                style={{ 
                                  padding: '0.25rem 0.6rem', 
                                  fontSize: '0.75rem',
                                  borderRadius: '50px',
                                  borderColor: status === 'VERIFIED' ? '#10b981' : 'var(--border-color)',
                                  background: status === 'VERIFIED' ? 'rgba(16,185,129,0.15)' : 'transparent',
                                  color: status === 'VERIFIED' ? '#10b981' : 'var(--text-secondary)'
                                }}
                              >
                                Verified
                              </button>
                              <button 
                                type="button" 
                                className="btn"
                                onClick={() => handleVerifyClick(rec.assetId, 'MISSING', rec.id)}
                                style={{ 
                                  padding: '0.25rem 0.6rem', 
                                  fontSize: '0.75rem',
                                  borderRadius: '50px',
                                  borderColor: status === 'MISSING' ? '#ef4444' : 'var(--border-color)',
                                  background: status === 'MISSING' ? 'rgba(239,68,68,0.15)' : 'transparent',
                                  color: status === 'MISSING' ? '#ef4444' : 'var(--text-secondary)'
                                }}
                              >
                                Missing
                              </button>
                              <button 
                                type="button" 
                                className="btn"
                                onClick={() => handleVerifyClick(rec.assetId, 'DAMAGED', rec.id)}
                                style={{ 
                                  padding: '0.25rem 0.6rem', 
                                  fontSize: '0.75rem',
                                  borderRadius: '50px',
                                  borderColor: status === 'DAMAGED' ? '#6b7280' : 'var(--border-color)',
                                  background: status === 'DAMAGED' ? 'rgba(107,114,128,0.15)' : 'transparent',
                                  color: status === 'DAMAGED' ? '#9ca3af' : 'var(--text-secondary)'
                                }}
                              >
                                Damaged
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Remarks input field */}
                        <td>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Add verification notes..." 
                            value={rInputVal}
                            onChange={(e) => setRemarksInput({ ...remarksInput, [rec.id]: e.target.value })}
                            onBlur={() => handleRemarksBlur(rec.assetId, status, rec.id)}
                            disabled={isClosed}
                            style={{ margin: 0, padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '100%', maxWidth: '280px' }}
                          />
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Bottom Close action (Admins Only) */}
            {isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={isClosed || closeMutation.isPending}
                  onClick={handleCloseCycle}
                  style={{ 
                    borderColor: isClosed ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.25)', 
                    color: isClosed ? 'var(--text-muted)' : '#f87171' 
                  }}
                >
                  <Lock size={14} style={{ marginRight: '0.35rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  {isClosed ? 'Audit Cycle Closed' : 'Close Audit Cycle'}
                </button>
              </div>
            )}

          </div>
        )
      ) : (
        <div className="glass-card empty-state" style={{ height: '350px' }}>
          <ShieldCheck size={44} />
          <p style={{ marginTop: '0.5rem' }}>Select an audit cycle or create a new campaign to begin compliance checks.</p>
        </div>
      )}

      {/* DIALOG 1: CREATE AUDIT CYCLE MODAL */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Create Compliance Audit Cycle
              </h3>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Audit Cycle Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Q3 IT Hardware Audit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Department Scoping */}
              <div className="form-group">
                <label className="form-label">Scope Department</label>
                <select 
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Location Scope */}
              <div className="form-group">
                <label className="form-label">Audit Location (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. HQ Floor 2, Server Room"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Auditors emails list */}
              <div className="form-group">
                <label className="form-label">Assigned Auditors (Emails, comma-separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. admin@assetflow.com, auditor@assetflow.com"
                  value={assignedAuditors}
                  onChange={(e) => setAssignedAuditors(e.target.value)}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Generating...' : 'Start Audit Campaign'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
