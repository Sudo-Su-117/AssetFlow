import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Layers, 
  LayoutDashboard, 
  Settings, 
  Package, 
  ArrowLeftRight, 
  Calendar, 
  Wrench, 
  ShieldCheck, 
  BarChart3, 
  Bell,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Organization } from './pages/Organization/Organization';

const queryClient = new QueryClient();

// Roles for Simulation
export const ROLES = [
  { label: 'Admin (Sarah Connor)', email: 'admin@assetflow.com', role: 'ADMIN' },
  { label: 'Asset Manager (John Doe)', email: 'manager@assetflow.com', role: 'ASSET_MANAGER' },
  { label: 'IT Department Head (James Smith)', email: 'ithead@assetflow.com', role: 'DEPARTMENT_HEAD' },
  { label: 'HR Department Head (Emily Davis)', email: 'hrhead@assetflow.com', role: 'DEPARTMENT_HEAD' },
  { label: 'Employee (Alex Johnson - IT)', email: 'employee@assetflow.com', role: 'EMPLOYEE' },
  { label: 'Employee (Priya Sharma - HR)', email: 'priya@assetflow.com', role: 'EMPLOYEE' }
];

// Simulated Authentication Context
interface AuthContextType {
  email: string;
  setEmail: (email: string) => void;
  currentRole: typeof ROLES[0];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

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

// Forbidden access view for non-admin on Organization Setup
export const ForbiddenScreen: React.FC = () => {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '550px', margin: '5rem auto' }}>
      <div className="glass-card" style={{ padding: '3rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          The **Organization Setup** module is restricted to system administrators only. 
          Please use the role selector in the top bar to switch to an **Admin** profile to view this page.
        </p>
        <Link to="/" className="btn btn-secondary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

// Global App Layout with Left Sidebar + Top Navbar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { email, setEmail } = useAuth();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="app-layout">
      {/* 1. Left Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to="/" className="logo">
            <Layers size={22} />
            <span>Asset</span>Flow
          </Link>
        </div>
        <nav className="sidebar-menu">
          <Link to="/" className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/organization" className={`sidebar-item ${location.pathname.startsWith('/organization') ? 'active' : ''}`}>
            <Settings size={18} />
            Organization Setup
          </Link>
          <Link to="/assets/register" className={`sidebar-item ${location.pathname.startsWith('/assets') ? 'active' : ''}`}>
            <Package size={18} />
            Assets
          </Link>
          <Link to="/transfers/request" className={`sidebar-item ${location.pathname.startsWith('/transfers') ? 'active' : ''}`}>
            <ArrowLeftRight size={18} />
            Allocation & Transfer
          </Link>
          <Link to="/bookings/new" className={`sidebar-item ${location.pathname.startsWith('/bookings') ? 'active' : ''}`}>
            <Calendar size={18} />
            Resource Booking
          </Link>
          <Link to="/maintenance/request" className={`sidebar-item ${location.pathname.startsWith('/maintenance') ? 'active' : ''}`}>
            <Wrench size={18} />
            Maintenance
          </Link>
          <Link to="/audit" className={`sidebar-item ${location.pathname.startsWith('/audit') ? 'active' : ''}`}>
            <ShieldCheck size={18} />
            Audit
          </Link>
          <Link to="/reports" className={`sidebar-item ${location.pathname.startsWith('/reports') ? 'active' : ''}`}>
            <BarChart3 size={18} />
            Reports
          </Link>
          <Link to="/notifications" className={`sidebar-item ${location.pathname.startsWith('/notifications') ? 'active' : ''}`}>
            <Bell size={18} />
            Notifications
          </Link>
        </nav>
      </aside>

      {/* 2. Content Column */}
      <div className="content-wrapper">
        {/* Global Top Navbar */}
        <div className="top-navbar">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulate Authenticated Session:</span>
          <select 
            className="role-select" 
            value={email} 
            onChange={handleRoleChange}
            title="Switch user simulation role"
            style={{ width: '280px' }}
          >
            {ROLES.map((r) => (
              <option key={r.email} value={r.email}>
                {r.label} ({r.role})
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Page Content */}
        {children}
      </div>
    </div>
  );
};

function App() {
  const [email, setEmail] = useState<string>(ROLES[0].email);

  const currentRole = ROLES.find(r => r.email === email) || ROLES[0];

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ email, setEmail, currentRole }}>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/organization" element={<Organization />} />
              
              {/* Navigation Placeholders */}
              <Route 
                path="/assets/register" 
                element={<ModulePlaceholder title="Asset Registration" icon={<Package size={32} />} />} 
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
              <Route 
                path="/audit" 
                element={<ModulePlaceholder title="System Audit Logs" icon={<ShieldCheck size={32} />} />} 
              />
              <Route 
                path="/reports" 
                element={<ModulePlaceholder title="Analytics & Reports" icon={<BarChart3 size={32} />} />} 
              />
              <Route 
                path="/notifications" 
                element={<ModulePlaceholder title="System Notifications" icon={<Bell size={32} />} />} 
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
