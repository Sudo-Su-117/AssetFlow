import React from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  themeClass: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    text: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  themeClass,
  trend
}) => {
  return (
    <div className="glass-card kpi-card">
      <div className="kpi-header">
        <span>{title}</span>
        <div className={`kpi-icon-container ${themeClass}`}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {trend && (
        <div className={`kpi-trend ${trend.direction}`}>
          {trend.direction === 'up' && '↑'}
          {trend.direction === 'down' && '↓'}
          {trend.direction === 'neutral' && '•'}
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  );
};
