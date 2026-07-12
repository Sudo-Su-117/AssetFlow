import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Loader2, 
  Calendar, 
  Wrench, 
  UserCheck, 
  FileText, 
  ArrowLeftRight,
  Download,
  Info
} from 'lucide-react';
import { fetchAssetById } from '../../../services/asset.api';
import { useAuth } from '../../../App';

interface AssetDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string | null;
}

type DrawerTab = 'details' | 'allocations' | 'maintenance' | 'bookings' | 'documents';

export const AssetDetailsDrawer: React.FC<AssetDetailsDrawerProps> = ({
  isOpen,
  onClose,
  assetId
}) => {
  const { email } = useAuth();
  const [activeTab, setActiveTab] = useState<DrawerTab>('details');

  // Query nested relations dynamically when drawer opens
  const { data: asset, isLoading, isError } = useQuery({
    queryKey: ['assetDetails', assetId, email],
    queryFn: () => fetchAssetById(email, assetId!),
    enabled: isOpen && !!assetId,
  });

  if (!isOpen) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {asset ? asset.assetTag : 'Syncing...'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {asset ? asset.name : 'Fetching asset registry details'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading details */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <Loader2 size={32} className="spin-animation" style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fetching relational logs...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
            <Info size={32} style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Could not load historical log summaries.</p>
          </div>
        )}

        {/* Drawer Body content */}
        {asset && !isLoading && (
          <div className="drawer-body">
            
            {/* Tab selection keys */}
            <div className="drawer-tabs">
              <button 
                className={`drawer-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Core Info
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
                onClick={() => setActiveTab('allocations')}
              >
                Allocations
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                onClick={() => setActiveTab('maintenance')}
              >
                Maintenance
              </button>
              {asset.bookable && (
                <button 
                  className={`drawer-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bookings')}
                >
                  Bookings
                </button>
              )}
              <button 
                className={`drawer-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                Docs ({asset.documents?.length || 0})
              </button>
            </div>

            {/* TAB CONTENTS */}

            {/* 1. Core Info Tab */}
            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* QR Code and basic status banner */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  {asset.qrCode ? (
                    <img 
                      src={asset.qrCode} 
                      alt={`QR Code for ${asset.assetTag}`} 
                      style={{ width: '110px', height: '110px', background: 'white', padding: '4px', borderRadius: '6px' }}
                      title="Asset Identity QR Code"
                    />
                  ) : (
                    <div style={{ width: '110px', height: '110px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                      No QR Code
                    </div>
                  )}
                  <div>
                    <span className="detail-label">Lifecycle Status</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                      {asset.status.toLowerCase().replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Condition: <strong style={{ color: 'var(--text-primary)' }}>{asset.condition || 'NEW'}</strong>
                    </div>
                  </div>
                </div>

                {/* Metadata details list */}
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Serial Number</span>
                    <span className="detail-value">{asset.serialNumber || '--'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Asset Category</span>
                    <span className="detail-value">{asset.category?.name || '--'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Physical Location</span>
                    <span className="detail-value">{asset.location || '--'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Owner Department</span>
                    <span className="detail-value">{asset.department?.name || '--'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Purchase Date</span>
                    <span className="detail-value">{formatDate(asset.purchaseDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Purchase Cost</span>
                    <span className="detail-value">
                      {asset.purchaseCost ? `$${asset.purchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '--'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bookable Resource</span>
                    <span className="detail-value">{asset.bookable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created Date</span>
                    <span className="detail-value">{formatDate(asset.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Allocations History Tab */}
            {activeTab === 'allocations' && (
              <div>
                {asset.allocations && asset.allocations.length > 0 ? (
                  <div className="activity-list" style={{ paddingLeft: '0.5rem' }}>
                    {asset.allocations.map((alloc) => (
                      <div key={alloc.id} className="activity-item">
                        <div className="activity-marker" style={{ background: alloc.returnedAt ? 'var(--color-primary)' : 'var(--color-success)', boxShadow: alloc.returnedAt ? 'none' : '0 0 8px var(--color-success)' }}></div>
                        <div className="activity-body">
                          <div className="activity-msg">
                            <strong>{alloc.user.name}</strong> ({alloc.user.email})
                            {!alloc.returnedAt && (
                              <span className="badge badge-active" style={{ fontSize: '0.65rem', marginLeft: '0.5rem', padding: '0.1rem 0.4rem' }}>Current</span>
                            )}
                          </div>
                          <div className="activity-time" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            Checked Out: {formatDate(alloc.allocatedAt)} 
                            {alloc.returnedAt ? ` • Returned: ${formatDate(alloc.returnedAt)}` : ''}
                          </div>
                          {alloc.notes && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderLeft: '2px solid var(--border-color)', marginTop: '0.25rem', borderRadius: '0 4px 4px 0' }}>
                              Note: {alloc.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <UserCheck size={36} />
                    <p>No allocation history found for this asset.</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Maintenance Logs Tab */}
            {activeTab === 'maintenance' && (
              <div>
                {asset.maintenanceRecords && asset.maintenanceRecords.length > 0 ? (
                  <div className="activity-list" style={{ paddingLeft: '0.5rem' }}>
                    {asset.maintenanceRecords.map((maint) => (
                      <div key={maint.id} className="activity-item">
                        <div className="activity-marker" style={{ background: maint.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-warning)' }}></div>
                        <div className="activity-body">
                          <div className="activity-msg" style={{ fontWeight: 600 }}>
                            {maint.description}
                          </div>
                          <div className="activity-time" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            Scheduled: {formatDate(maint.scheduledFor)}
                            {maint.completedAt ? ` • Finished: ${formatDate(maint.completedAt)}` : ` • Status: ${maint.status.replace('_', ' ')}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Cost: <strong>${maint.cost}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Wrench size={36} />
                    <p>No maintenance logs available.</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. Booking History Tab (Rendered only if bookable) */}
            {activeTab === 'bookings' && (
              <div>
                {asset.bookings && asset.bookings.length > 0 ? (
                  <div className="activity-list" style={{ paddingLeft: '0.5rem' }}>
                    {asset.bookings.map((booking) => (
                      <div key={booking.id} className="activity-item">
                        <div className="activity-marker" style={{ background: booking.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-primary)' }}></div>
                        <div className="activity-body">
                          <div className="activity-msg">
                            Reserved by <strong>{booking.user.name}</strong>
                          </div>
                          <div className="activity-time" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            Start: {new Date(booking.startTime).toLocaleString()}
                            <br />
                            End: {new Date(booking.endTime).toLocaleString()}
                          </div>
                          {booking.purpose && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Purpose: "{booking.purpose}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Calendar size={36} />
                    <p>No booking history records.</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                {asset.documents && asset.documents.length > 0 ? (
                  <div className="document-list">
                    {asset.documents.map((doc) => (
                      <a 
                        key={doc.id} 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); alert(`Simulating invoice/manual file download for: ${doc.name}`); }}
                        className="document-item"
                        title="Download manual/invoice attachment"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                          <span>{doc.name}</span>
                        </div>
                        <Download size={14} style={{ color: 'var(--text-muted)' }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FileText size={36} />
                    <p>No warranty files or invoices attached.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
