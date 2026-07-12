import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  Wrench, 
  ArrowLeftRight, 
  Clock, 
  RefreshCw, 
  Activity, 
  Zap, 
  AlertCircle,
  FileQuestion
} from 'lucide-react';
import { useDashboard } from './hooks/useDashboard';
import { KPICard } from './components/KPICard';
import { AlertBanner } from './components/AlertBanner';
import { RecentActivity } from './components/RecentActivity';
import { QuickActions } from './components/QuickActions';
import { OverviewGrid } from './components/OverviewGrid';
import { useAuth } from '../../App';

export const Dashboard: React.FC = () => {
  const { email: selectedUserEmail } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching 
  } = useDashboard(selectedUserEmail);

  useEffect(() => {
    if (data) {
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString());
    }
  }, [data]);

  const handleManualRefresh = () => {
    refetch();
  };

  // 1. Loading Skeletons
  if (isLoading) {
    return (
      <div className="main-content">
        <header className="dashboard-header">
          <div className="title-area">
            <h1>AssetFlow</h1>
            <p>Operational Command Center</p>
          </div>
          <div className="header-controls">
            <div className="skeleton" style={{ width: '220px', height: '38px', borderRadius: '10px' }}></div>
            <div className="skeleton" style={{ width: '100px', height: '38px', borderRadius: '10px' }}></div>
          </div>
        </header>

        {/* KPI Grid Skeleton */}
        <div className="kpi-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-kpi"></div>
          ))}
        </div>

        {/* Overview Layout Skeleton */}
        <div className="dashboard-sections">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="skeleton skeleton-card" style={{ height: '180px' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
          </div>
          <div className="skeleton skeleton-card" style={{ height: '500px' }}></div>
        </div>
      </div>
    );
  }

  // 2. Error View
  if (isError) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card error-container">
          <AlertCircle size={48} className="alert-icon" style={{ color: 'var(--color-danger)' }} />
          <h2 className="error-title">Database Sync Failed</h2>
          <p className="error-desc">
            {error instanceof Error ? error.message : 'Could not connect to the backend server. Make sure the Node.js backend is running on port 5000.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleManualRefresh}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts = data?.alerts || [];
  const quickActions = data?.quickActions || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="main-content">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="title-area">
          <h1>AssetFlow</h1>
          <p>Operational Command Center</p>
        </div>
        
        <div className="header-controls">
          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Last sync: {lastUpdated}
            </span>
          )}

          {/* Managed by global topbar */}

          {/* Manual Refetch Button */}
          <button 
            className="btn btn-secondary" 
            onClick={handleManualRefresh} 
            disabled={isFetching}
            title="Refresh dashboard stats"
          >
            <RefreshCw size={14} className={isFetching ? 'spin-animation' : ''} />
            {isFetching ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="kpi-grid">
          <KPICard 
            title="Available Assets" 
            value={kpis.availableAssets} 
            icon={<CheckCircle2 size={18} />} 
            themeClass="success"
            trend={{ text: 'Ready for use', direction: 'neutral' }}
          />
          <KPICard 
            title="Allocated Assets" 
            value={kpis.allocatedAssets} 
            icon={<UserCheck size={18} />} 
            themeClass="primary"
            trend={{ text: 'Currently deployed', direction: 'neutral' }}
          />
          <KPICard 
            title="Active Bookings" 
            value={kpis.activeBookings} 
            icon={<Calendar size={18} />} 
            themeClass="info"
            trend={{ text: 'Today\'s reservations', direction: 'up' }}
          />
          <KPICard 
            title="Maintenance Today" 
            value={kpis.maintenanceToday} 
            icon={<Wrench size={18} />} 
            themeClass="warning"
            trend={kpis.maintenanceToday > 0 ? { text: 'Tickets in progress', direction: 'down' } : undefined}
          />
          <KPICard 
            title="Pending Transfers" 
            value={kpis.pendingTransfers} 
            icon={<ArrowLeftRight size={18} />} 
            themeClass="warning"
            trend={kpis.pendingTransfers > 0 ? { text: 'Requires approval', direction: 'up' } : undefined}
          />
          <KPICard 
            title="Overdue Returns" 
            value={kpis.overdueAssets} 
            icon={<Clock size={18} />} 
            themeClass="danger"
            trend={kpis.overdueAssets > 0 ? { text: 'Action required', direction: 'down' } : undefined}
          />
        </div>
      )}

      {/* Main Aggregations and Operations */}
      <OverviewGrid>
        {/* Left Column: Quick Actions and Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Actions Panel */}
          <div className="glass-card">
            <h3 className="section-title">
              <Zap size={18} style={{ color: 'var(--color-primary)' }} />
              Quick Operations
            </h3>
            <QuickActions actions={quickActions} />
          </div>

          {/* Recent Activity Timeline */}
          <div className="glass-card">
            <h3 className="section-title">
              <Activity size={18} style={{ color: 'var(--color-info)' }} />
              System Activity Feed
            </h3>
            <RecentActivity activities={recentActivity} />
          </div>
        </div>

        {/* Right Column: Alert banners and System summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ height: '100%' }}>
            <h3 className="section-title">
              <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
              Attention Required
            </h3>
            {alerts.length > 0 ? (
              <div className="alerts-container">
                {alerts.map((alert, idx) => (
                  <AlertBanner key={idx} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle2 size={40} style={{ color: 'var(--color-success)' }} />
                <p>All clear! No overdue items or pending issues.</p>
              </div>
            )}

            {/* Quick summary notes */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>System Notice</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Dashboard data is filtered dynamically depending on your user scope. Admins view global metrics, Department Heads view their department parameters, and Employees track personal asset obligations.
              </p>
            </div>
          </div>
        </div>
      </OverviewGrid>

      {/* Spin Animation Injection */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
