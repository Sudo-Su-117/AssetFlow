import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Wrench, UserCheck, Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../App';
import { 
  fetchMaintenanceRequests, 
  createMaintenanceRequest, 
  approveMaintenanceRequest, 
  assignTechnician, 
  startMaintenanceWork, 
  resolveMaintenanceRequest 
} from '../../services/maintenance.api';
import { fetchAssets } from '../../services/asset.api';
import type { MaintenanceRequestData } from '../../types/maintenance';

export const Maintenance: React.FC = () => {
  const { currentRole, email } = useAuth();
  const queryClient = useQueryClient();

  const isManager = currentRole.role === 'ADMIN' || currentRole.role === 'ASSET_MANAGER';
  const isTech = currentRole.role === 'ADMIN' || currentRole.role === 'ASSET_MANAGER' || currentRole.role === 'TECHNICIAN';

  // Modal open states
  const [reportOpen, setReportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  // Focus states
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  // Form states
  const [assetId, setAssetId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const [techName, setTechName] = useState('R. Varma');
  const [estimatedCost, setEstimatedCost] = useState('0');

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [finalCondition, setFinalCondition] = useState('GOOD');
  const [finalCost, setFinalCost] = useState('0');

  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Fetch Assets list for selectors
  const { data: assets = [] } = useQuery({
    queryKey: ['assets', email],
    queryFn: () => fetchAssets(email),
    enabled: !!email
  });

  // 2. Fetch Maintenance Requests list
  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['maintenance', email],
    queryFn: () => fetchMaintenanceRequests(email),
    enabled: !!email
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => createMaintenanceRequest(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setReportOpen(false);
      setAssetId('');
      setDescription('');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveMaintenanceRequest(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => assignTechnician(email, selectedReqId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setAssignOpen(false);
      setSelectedReqId(null);
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startMaintenanceWork(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (data: any) => resolveMaintenanceRequest(email, selectedReqId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setResolveOpen(false);
      setSelectedReqId(null);
      setResolutionNotes('');
    }
  });

  // Form Submits
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!assetId) return setValidationError('Please select an asset.');
    if (!description.trim()) return setValidationError('Please describe the issue.');

    try {
      await createMutation.mutateAsync({
        assetId,
        description: description.trim(),
        priority
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to raise request.');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!techName.trim()) return setValidationError('Please enter a technician.');
    
    const cost = parseFloat(estimatedCost);
    if (isNaN(cost) || cost < 0) return setValidationError('Cost must be a valid number.');

    try {
      await assignMutation.mutateAsync({
        assignedTechnician: techName.trim(),
        cost
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to assign technician.');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!resolutionNotes.trim()) return setValidationError('Resolution notes are required.');

    const cost = parseFloat(finalCost);
    if (isNaN(cost) || cost < 0) return setValidationError('Cost must be a valid number.');

    try {
      await resolveMutation.mutateAsync({
        resolutionNotes: resolutionNotes.trim(),
        finalCondition,
        cost
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to resolve request.');
    }
  };

  // Kanban Column Filter
  const getColCards = (statusStr: string) => {
    return requests.filter(r => r.status === statusStr);
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'HIGH':
        return { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' };
      case 'MEDIUM':
        return { background: 'rgba(245,158,11,0.15)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.2)' };
      default:
        return { background: 'rgba(59,130,246,0.15)', color: '#bfdbfe', border: '1px solid rgba(59,130,246,0.2)' };
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Maintenance Lifecycle</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track and dispatch repair requests through Kanban columns. Approving downtime moves assets to under maintenance.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setValidationError(null); setReportOpen(true); }}>
          <Plus size={16} /> Report Issue
        </button>
      </div>

      {/* Kanban Board Container */}
      {isLoading ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={36} className="spin-animation" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Syncing Board...</p>
        </div>
      ) : isError ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={44} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Board Sync Failure</h3>
          <button className="btn btn-primary" onClick={() => refetch()} style={{ marginTop: '1rem' }}>Retry Sync</button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '1rem', 
          flex: 1,
          minHeight: '400px',
          overflowY: 'hidden'
        }}>
          
          {/* COLUMNS */}
          {[
            { title: 'Pending', status: 'PENDING' },
            { title: 'Approved', status: 'APPROVED' },
            { title: 'Technician Assigned', status: 'TECHNICIAN_ASSIGNED' },
            { title: 'In Progress', status: 'IN_PROGRESS' },
            { title: 'Resolved', status: 'RESOLVED' }
          ].map((col) => {
            const colCards = getColCards(col.status);
            return (
              <div 
                key={col.status} 
                style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '100%',
                  overflowY: 'auto'
                }}
              >
                {/* Column Title Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {col.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards List container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colCards.length > 0 ? (
                    colCards.map((req) => (
                      <div 
                        key={req.id} 
                        style={{ 
                          background: req.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255,255,255,0.02)', 
                          border: `1px solid ${req.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`,
                          borderRadius: '8px', 
                          padding: '0.85rem',
                          boxShadow: 'var(--shadow-premium)'
                        }}
                      >
                        {/* Card Tag & Priority */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                            {req.asset?.assetTag}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px',
                              ...getPriorityStyle(req.priority)
                            }}
                          >
                            {req.priority}
                          </span>
                        </div>

                        {/* Card Title Model */}
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          {req.asset?.name}
                        </div>

                        {/* Issue description */}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                          {req.description}
                        </p>

                        {/* Assigned tech details */}
                        {req.assignedTechnician && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'inline-block' }}>
                            Tech: <strong>{req.assignedTechnician}</strong>
                          </div>
                        )}

                        {/* Resolved logs summary */}
                        {req.status === 'RESOLVED' && req.resolutionNotes && (
                          <div style={{ fontSize: '0.7rem', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.05)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.5rem', borderLeft: '2.5px solid #10b981' }}>
                            Resolved: "{req.resolutionNotes}"
                          </div>
                        )}

                        {/* Action buttons (Workflows progression) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          
                          {/* 1. Pending Column actions (Approve) */}
                          {req.status === 'PENDING' && isManager && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => approveMutation.mutate(req.id)}
                              disabled={approveMutation.isPending}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <UserCheck size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                              Approve Request
                            </button>
                          )}

                          {/* 2. Approved Column actions (Assign Tech) */}
                          {req.status === 'APPROVED' && isManager && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => { setSelectedReqId(req.id); setEstimatedCost('0'); setValidationError(null); setAssignOpen(true); }}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Wrench size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                              Assign Tech
                            </button>
                          )}

                          {/* 3. Tech Assigned Column actions (Start Work) */}
                          {req.status === 'TECHNICIAN_ASSIGNED' && isTech && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => startMutation.mutate(req.id)}
                              disabled={startMutation.isPending}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Play size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                              Start Progress
                            </button>
                          )}

                          {/* 4. In Progress Column actions (Resolve) */}
                          {req.status === 'IN_PROGRESS' && isTech && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => { setSelectedReqId(req.id); setFinalCost(req.cost.toString()); setResolutionNotes(''); setValidationError(null); setResolveOpen(true); }}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--color-success)' }}
                            >
                              <CheckCircle2 size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                              Resolve Repair
                            </button>
                          )}

                        </div>

                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No tasks
                    </div>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* Caption footer */}
      <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '3px solid var(--color-primary)', paddingLeft: '0.75rem' }}>
        Approving a card moves the asset status to "Under Maintenance" (downtime starts). Completing the repair returns it to "Available".
      </p>

      {/* MODAL 1: REPORT ISSUE (Employee Request Form) */}
      {reportOpen && (
        <div className="modal-overlay" onClick={() => setReportOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Report Breakdown / Issue
              </h3>
              <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleReportSubmit}>
              {/* Asset Selector */}
              <div className="form-group">
                <label className="form-label">Select Breakdown Asset</label>
                <select 
                  className="form-select"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                >
                  <option value="">-- Choose Asset from Registry --</option>
                  {assets.filter(a => a.status === 'AVAILABLE' || a.status === 'ALLOCATED').map(a => (
                    <option key={a.id} value={a.id}>{a.assetTag} - {a.name} ({a.status})</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low (Cosmetic/Minor)</option>
                  <option value="MEDIUM">Medium (Normal)</option>
                  <option value="HIGH">High (Urgent Breakdown)</option>
                </select>
              </div>

              {/* Issue Description */}
              <div className="form-group">
                <label className="form-label">Breakdown Details / Issue Description</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Describe what is broken, error messages, or symptoms..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'File Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TECHNICIAN (Managers Only) */}
      {assignOpen && (
        <div className="modal-overlay" onClick={() => setAssignOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Assign Repair Technician
              </h3>
              <button onClick={() => setAssignOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              {/* Technician Dropdown */}
              <div className="form-group">
                <label className="form-label">Assign Technician</label>
                <select 
                  className="form-select"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                >
                  <option value="R. Varma">R. Varma (IT Hardware Specialist)</option>
                  <option value="S. Patel">S. Patel (Infrastructure Repair)</option>
                  <option value="A. Kumar">A. Kumar (General Maintenance)</option>
                </select>
              </div>

              {/* Estimate Cost */}
              <div className="form-group">
                <label className="form-label">Estimated Cost (USD)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLUTION DIALOG */}
      {resolveOpen && (
        <div className="modal-overlay" onClick={() => setResolveOpen(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Complete Repair & Close Ticket
              </h3>
              <button onClick={() => setResolveOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit}>
              {/* Final Condition */}
              <div className="form-group">
                <label className="form-label">Final Asset Condition</label>
                <select 
                  className="form-select"
                  value={finalCondition}
                  onChange={(e) => setFinalCondition(e.target.value)}
                >
                  <option value="NEW">New (Replaced/Like New)</option>
                  <option value="GOOD">Good (Functional/Fixed)</option>
                  <option value="FAIR">Fair (Usable but worn)</option>
                </select>
              </div>

              {/* Final Cost */}
              <div className="form-group">
                <label className="form-label">Final Cost (USD)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                />
              </div>

              {/* Resolution Notes (Mandatory) */}
              <div className="form-group">
                <label className="form-label">Resolution Notes / Action Taken</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Describe repair actions, parts replaced, or details..."
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolveOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resolveMutation.isPending} style={{ background: 'var(--color-success)' }}>
                  {resolveMutation.isPending ? 'Resolving...' : 'Complete Repair check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
