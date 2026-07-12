import React from 'react';

interface OverviewGridProps {
  children: React.ReactNode;
}

export const OverviewGrid: React.FC<OverviewGridProps> = ({ children }) => {
  return (
    <div className="dashboard-sections">
      {children}
    </div>
  );
};
