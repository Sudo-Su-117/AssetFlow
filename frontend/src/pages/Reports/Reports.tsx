import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, AlertTriangle, Clock, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../App';
import { fetchReportsOverview, downloadReportCSV } from '../../services/reports.api';
import type { ReportsOverviewData } from '../../types/reports';

export const Reports: React.FC = () => {
  const { currentRole, email } = useAuth();
  const [exporting, setExporting] = useState(false);

  // 1. Role Authorization Guard (Employees do not have access by default)
  const isAuthorized = currentRole.role !== 'EMPLOYEE';

  // 2. Fetch Reports Overview Data
  const { data: analytics, isLoading, isError, refetch } = useQuery({
    queryKey: ['reportsOverview', email],
    queryFn: () => fetchReportsOverview(email),
    enabled: isAuthorized && !!email
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadReportCSV(email);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  // Render Access Denied if unauthorized
  if (!isAuthorized) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="glass-card empty-state" style={{ maxWidth: '480px', padding: '3rem' }}>
          <ShieldAlert size={56} style={{ color: 'var(--color-danger)', marginBottom: '1.25rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Reports and business intelligence analytics are reserved for administrators, managers, and department heads.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Compiling analytical intelligence...</p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <AlertTriangle size={44} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Analysis Compilation Failure</h3>
        <button className="btn btn-primary" onClick={() => refetch()} style={{ marginTop: '1rem' }}>Retry Compile</button>
      </div>
    );
  }

  // Calculate SVG line chart coordinates for Maintenance Frequency
  const trend = analytics.maintenanceTrend;
  const maxCount = Math.max(...trend.map(t => t.count), 5);
  
  // Grid bounds for line chart: Width = 500, Height = 180
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = trend.map((t, idx) => {
    const x = paddingX + (idx / (trend.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (t.count / maxCount) * (height - paddingY * 2);
    return { x, y, month: t.month, count: t.count };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="main-content">
      {/* Title & Live Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Reports & Intelligence</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Historical business analytics aggregating asset checkouts, schedules, repair lifecycles, and compliance cycles.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.35rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', color: '#a7f3d0' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            Live DB Sync Active
          </div>
          <button 
            onClick={() => refetch()} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}
          >
            <Activity size={12} /> Sync Now
          </button>
        </div>
      </div>

      {/* Dynamic ERP Operational Insights Banner */}
      <div className="glass-card" style={{ 
        background: 'linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)', 
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ fontSize: '1.25rem' }}>💡</div>
        <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
          <strong>ERP Operational Insight:</strong>{' '}
          {analytics.idleAssets.length > 0 ? (
            <span>You have {analytics.idleAssets.length} idle asset(s) inactive for over 30 days. Consider re-allocating <strong>{analytics.idleAssets[0].name} ({analytics.idleAssets[0].assetTag})</strong> to reduce new procurement costs.</span>
          ) : analytics.assetsDueOrRetiring.length > 0 ? (
            <span>Preventive care alert: <strong>{analytics.assetsDueOrRetiring[0].name}</strong> requires maintenance attention soon. Resolve open tickets to maximize lifetime value.</span>
          ) : (
            <span>Your hardware fleet is running at 100% health parameters. All allocations are active and no discrepancies are pending.</span>
          )}
        </div>
      </div>

      {/* Double Charts Grid (Matches Wireframe) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Chart 1: Utilization by Department (Bar Chart) */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            Asset Utilization by Department
          </h3>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'flex-end', 
            height: '200px', 
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem'
          }}>
            {Object.entries(analytics.utilization).map(([dept, pct]) => (
              <div 
                key={dept} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  width: '60px' 
                }}
              >
                {/* Bar */}
                <div 
                  style={{ 
                    width: '32px', 
                    height: `${pct * 1.5}px`, // Scaled for 150px max
                    background: 'linear-gradient(180deg, var(--color-primary) 0%, rgba(59, 130, 246, 0.4) 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                  }}
                  className="bar-hover"
                  title={`${dept}: ${pct}%`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 15px var(--color-primary)';
                    e.currentTarget.style.transform = 'scaleY(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.transform = 'scaleY(1)';
                  }}
                >
                  {/* Percentage label floating */}
                  <span style={{ 
                    position: 'absolute', 
                    top: '-1.25rem', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    fontSize: '0.725rem', 
                    fontWeight: 700 
                  }}>
                    {pct}%
                  </span>
                </div>
                {/* X Axis Label */}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                  {dept}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Maintenance Frequency Trend (Line Chart) */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            Maintenance Event Trends
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
              {/* Y Axis Grid Marks */}
              {[0, 0.5, 1].map((ratio) => {
                const y = paddingY + ratio * (height - paddingY * 2);
                const value = Math.round(maxCount * (1 - ratio));
                return (
                  <g key={ratio}>
                    <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                    <text x={paddingX - 10} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{value}</text>
                  </g>
                );
              })}

              {/* Line segment */}
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                points={polylinePoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--bg-card)"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('r', '7');
                      e.currentTarget.setAttribute('stroke-width', '3');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('r', '4');
                      e.currentTarget.setAttribute('stroke-width', '2');
                    }}
                    title={`${p.month}: ${p.count}`}
                  />
                  {/* Label Month */}
                  {idx % 2 === 0 && (
                    <text
                      x={p.x}
                      y={height - 5}
                      fill="var(--text-muted)"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {p.month}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* Summary insights (Matches Wireframe text details) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
        
        {/* Left Grid: Usage Rankings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Most Used Assets */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Most Used Assets
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.mostUsedAssets.map((asset, idx) => (
                <div key={asset.assetTag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>0{idx + 1}.</span>
                    <strong>{asset.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({asset.assetTag})</span>
                  </div>
                  <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>{asset.usageCount} checkout sessions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Idle Assets */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Idle Assets (Prolonged Inactivity)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.idleAssets.length > 0 ? (
                analytics.idleAssets.map((asset) => (
                  <div key={asset.assetTag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{asset.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.4rem' }}>({asset.assetTag})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                      <Clock size={12} />
                      <span>unused {asset.daysIdle} days</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No idle assets currently.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: Warnings / Service Targets */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Assets Due for Maintenance / Nearing Retirement
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analytics.assetsDueOrRetiring.length > 0 ? (
                analytics.assetsDueOrRetiring.map((asset) => (
                  <div 
                    key={asset.assetTag} 
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.75rem'
                    }}
                  >
                    <AlertTriangle 
                      size={16} 
                      style={{ 
                        marginTop: '0.15rem', 
                        color: asset.severity === 'DANGER' ? '#ef4444' : '#f59e0b' 
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {asset.name} ({asset.assetTag})
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        marginTop: '0.15rem',
                        color: asset.severity === 'DANGER' ? '#fca5a5' : '#fde68a' 
                      }}>
                        {asset.warning}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Activity size={24} />
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>All active assets are within stable parameters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Export Report Action (Matches bottom of wireframe) */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          className="btn btn-primary" 
          disabled={exporting}
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={14} />
          {exporting ? 'Generating CSV...' : 'Export report'}
        </button>
      </div>

    </div>
  );
};
