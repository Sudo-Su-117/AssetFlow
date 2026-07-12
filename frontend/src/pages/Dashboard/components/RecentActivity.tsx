import React from 'react';
import { History } from 'lucide-react';
import type { ActivityLogData } from '../../../types/dashboard';

interface RecentActivityProps {
  activities: ActivityLogData[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getFriendlyTime = (dateStr: string) => {
    try {
      const past = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return 'Yesterday';
      return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) {
      return 'Some time ago';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state">
        <History size={40} />
        <p>No recent activity logged.</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity) => (
        <div key={activity.id} className={`activity-item ${activity.type}`}>
          <div className="activity-marker"></div>
          <div className="activity-body">
            <div className="activity-msg">
              {activity.message}
              {activity.user && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  by {activity.user.name} ({activity.user.role.replace('_', ' ')})
                </span>
              )}
            </div>
            <div className="activity-time">{getFriendlyTime(activity.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
