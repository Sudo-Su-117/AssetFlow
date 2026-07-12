import React from 'react';
import { PlusCircle, Calendar, Wrench, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionsProps {
  actions: string[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'REGISTER_ASSET':
        return {
          label: 'Register Asset',
          path: '/assets/register',
          icon: <PlusCircle size={24} />
        };
      case 'BOOK_RESOURCE':
        return {
          label: 'Book Resource',
          path: '/bookings/new',
          icon: <Calendar size={24} />
        };
      case 'RAISE_MAINTENANCE':
        return {
          label: 'Raise Maintenance',
          path: '/maintenance/request',
          icon: <Wrench size={24} />
        };
      case 'REQUEST_TRANSFER':
        return {
          label: 'Request Transfer',
          path: '/transfers/request',
          icon: <ArrowLeftRight size={24} />
        };
      default:
        return null;
    }
  };

  if (!actions || actions.length === 0) {
    return (
      <div className="empty-state">
        <p>No actions available for your role.</p>
      </div>
    );
  }

  return (
    <div className="actions-grid">
      {actions.map((action) => {
        const config = getActionConfig(action);
        if (!config) return null;

        return (
          <Link key={action} to={config.path} className="action-btn">
            {config.icon}
            <span>{config.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
