import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Clock, Activity, Check, CheckCheck, Loader2, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../App';
import { fetchNotifications, markAsRead, markAllAsRead, fetchActivityLogs } from '../../services/notification.api';
import type { NotificationData, ActivityLogData } from '../../types/notification';

export const Notifications: React.FC = () => {
  const { email } = useAuth();
  const queryClient = useQueryClient();

  // Tab State
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'ALERTS' | 'APPROVALS' | 'BOOKINGS'>('ALL');

  // 1. Query Notifications list
  const { data: notifications = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['notifications', email],
    queryFn: () => fetchNotifications(email),
    enabled: !!email
  });

  // 2. Query Activity Logs audit trail
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['activityLogs', email],
    queryFn: () => fetchActivityLogs(email),
    enabled: !!email
  });

  // Mutations
  const readMutation = useMutation({
    mutationFn: (id: string) => markAsRead(email, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllAsRead(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  // Relative Time helper (matches "2m ago", "1d ago" wireframe tags)
  const getRelativeTime = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Filter logic based on tabs
  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === 'ALL') return true;
    if (selectedTab === 'ALERTS') {
      return n.type === 'OVERDUE_RETURN' || n.type === 'ALERT';
    }
    if (selectedTab === 'APPROVALS') {
      return n.type === 'TRANSFER_REQUEST' || n.type === 'APPROVAL';
    }
    if (selectedTab === 'BOOKINGS') {
      return n.type === 'BOOKING';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeStyle = (type: string) => {
    if (type === 'OVERDUE_RETURN' || type === 'ALERT') {
      return { background: '#f87171' }; // Red dot
    }
    if (type === 'TRANSFER_REQUEST' || type === 'APPROVAL') {
      return { background: '#fbbf24' }; // Yellow dot
    }
    if (type === 'BOOKING') {
      return { background: '#60a5fa' }; // Blue dot
    }
    return { background: '#9ca3af' }; // Gray dot
  };

  return (
    <div className="main-content">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Events & Auditing</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Chronological notifications and immutable activity audit logs mapping compliance trails.
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            className="btn btn-secondary" 
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Notification Feed (Matches Wireframe columns/spacing) */}
        <div>
          {/* Category Tabs (All, Alerts, Approvals, Bookings) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ALERTS', label: 'Alerts' },
              { id: 'APPROVALS', label: 'Approvals' },
              { id: 'BOOKINGS', label: 'Bookings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`btn ${selectedTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  borderRadius: '8px', 
                  padding: '0.4rem 1rem', 
                  fontSize: '0.85rem',
                  borderColor: selectedTab === tab.id ? 'var(--color-primary)' : 'var(--border-color)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed List Container */}
          {isLoadingAlerts ? (
            <div className="glass-card" style={{ padding: '3rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="spin-animation" style={{ color: 'var(--color-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Retrieving feed alerts...</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
              {filteredNotifications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && readMutation.mutate(notif.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                        background: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.02)',
                        cursor: notif.isRead ? 'default' : 'pointer',
                        transition: 'background 0.2s'
                      }}
                      className={notif.isRead ? '' : 'bar-hover'}
                    >
                      {/* Left: Indicator dot + Text */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, paddingRight: '1rem' }}>
                        {/* Status Marker dot */}
                        <div 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            flexShrink: 0,
                            ...getTypeStyle(notif.type),
                            opacity: notif.isRead ? 0.35 : 1
                          }} 
                        />
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: notif.isRead ? 500 : 700, 
                          color: notif.isRead ? 'var(--text-muted)' : 'var(--text-primary)',
                          lineHeight: 1.4
                        }}>
                          {notif.message}
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {getRelativeTime(notif.createdAt)}
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', color: 'var(--text-muted)' }}>
                  <Bell size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No events in this category.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Immutable Activity Logs Timeline */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--color-primary)' }} />
              Audit Logs Timeline
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Immutable system operations ledger. Tracks performing actors for accountability.
            </p>

            {isLoadingLogs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <Loader2 className="spin-animation" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : logs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    style={{ 
                      fontSize: '0.8rem', 
                      lineHeight: 1.5,
                      borderLeft: '2px solid var(--border-color)',
                      paddingLeft: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    {/* Timeline Node dot */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-5px', 
                      top: '4px', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: 'var(--color-primary)' 
                    }} />

                    {/* Actor + Message */}
                    <div>
                      <strong>{log.user?.name || 'System Action'}</strong> ({log.user?.role?.replace('_', ' ') || 'SYSTEM'})
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {log.message}
                    </p>

                    {/* Timestamp */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                <Info size={24} />
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No activity records matching scope.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
