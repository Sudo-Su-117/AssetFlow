import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layers, ArrowLeft, PlusCircle, Calendar, Wrench, ArrowLeftRight } from 'lucide-react';
import { Dashboard } from './pages/Dashboard/Dashboard';

const queryClient = new QueryClient();

// Reusable Module Placeholder Screen
const ModulePlaceholder: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '3rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          {icon}
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          This is a placeholder page for the <strong>{title}</strong> module. Real functional code for this screener will be implemented in subsequent phases.
        </p>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

// Main Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      {/* Global Header Navigation */}
      <header className="layout-header">
        <Link to="/" className="logo">
          <Layers size={22} />
          <span>Asset</span>Flow
        </Link>
        <nav className="nav-links">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/assets/register" className={`nav-item ${location.pathname.startsWith('/assets') ? 'active' : ''}`}>
            Assets
          </Link>
          <Link to="/bookings/new" className={`nav-item ${location.pathname.startsWith('/bookings') ? 'active' : ''}`}>
            Bookings
          </Link>
          <Link to="/maintenance/request" className={`nav-item ${location.pathname.startsWith('/maintenance') ? 'active' : ''}`}>
            Maintenance
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      {children}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Quick Action Navigation Placeholders */}
            <Route 
              path="/assets/register" 
              element={<ModulePlaceholder title="Asset Registration" icon={<PlusCircle size={32} />} />} 
            />
            <Route 
              path="/bookings/new" 
              element={<ModulePlaceholder title="Resource Booking" icon={<Calendar size={32} />} />} 
            />
            <Route 
              path="/maintenance/request" 
              element={<ModulePlaceholder title="Raise Maintenance Request" icon={<Wrench size={32} />} />} 
            />
            <Route 
              path="/transfers/request" 
              element={<ModulePlaceholder title="Request Transfer" icon={<ArrowLeftRight size={32} />} />} 
            />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </AppLayout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
