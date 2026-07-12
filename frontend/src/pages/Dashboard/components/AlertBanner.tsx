import React from 'react';
import { AlertTriangle, ArrowLeftRight, Wrench, AlertCircle } from 'lucide-react';
import type { AlertData } from '../../../types/dashboard';

interface AlertBannerProps {
  alert: AlertData;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert }) => {
  const getAlertConfig = () => {
    switch (alert.type) {
      case 'OVERDUE_RETURN':
        return {
          icon: <AlertTriangle className="alert-icon" size={20} />,
          severityClass: 'high'
        };
      case 'PENDING_TRANSFER':
        return {
          icon: <ArrowLeftRight className="alert-icon" size={20} />,
          severityClass: alert.severity === 'HIGH' ? 'high' : 'medium'
        };
      case 'MAINTENANCE_DUE':
        return {
          icon: <Wrench className="alert-icon" size={20} />,
          severityClass: 'high'
        };
      default:
        return {
          icon: <AlertCircle className="alert-icon" size={20} />,
          severityClass: alert.severity.toLowerCase() as 'high' | 'medium' | 'low'
        };
    }
  };

  const { icon, severityClass } = getAlertConfig();

  return (
    <div className={`alert-banner ${severityClass}`}>
      {icon}
      <div className="alert-content">
        <div className="alert-message">{alert.message}</div>
      </div>
    </div>
  );
};
