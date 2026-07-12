import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, Key } from 'lucide-react';
import { loginUser, signupUser, forgotPassword, resetPassword } from '../../services/auth.api';

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string; role: string }) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  // Mode selectors: 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET'
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET'>('LOGIN');

  // Input states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // UI state variables
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleModeChange = (newMode: 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET') => {
    clearMessages();
    setMode(newMode);
    setPasswordInput('');
    setConfirmPasswordInput('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!emailInput.trim() || !passwordInput.trim()) {
      return setErrorMsg('All fields are required.');
    }

    setLoading(true);
    try {
      const response = await loginUser({
        email: emailInput.trim(),
        password: passwordInput.trim()
      });
      onAuthSuccess(response.accessToken, response.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!nameInput.trim() || !emailInput.trim() || !passwordInput.trim() || !confirmPasswordInput.trim()) {
      return setErrorMsg('All fields are required.');
    }

    if (passwordInput !== confirmPasswordInput) {
      return setErrorMsg('Passwords do not match.');
    }

    if (passwordInput.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      await signupUser({
        name: nameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput.trim()
      });
      setSuccessMsg('Account registered successfully as Employee! You can now log in.');
      handleModeChange('LOGIN');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!emailInput.trim()) {
      return setErrorMsg('Email is required.');
    }

    setLoading(true);
    try {
      const res = await forgotPassword(emailInput.trim());
      setSuccessMsg(res.message || 'Verification link dispatched.');
      handleModeChange('RESET'); // Automatically redirect to reset page for demonstration convenience
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!emailInput.trim() || !passwordInput.trim() || !confirmPasswordInput.trim()) {
      return setErrorMsg('All fields are required.');
    }

    if (passwordInput !== confirmPasswordInput) {
      return setErrorMsg('Passwords do not match.');
    }

    setLoading(true);
    try {
      await resetPassword({
        email: emailInput.trim(),
        newPassword: passwordInput.trim()
      });
      setSuccessMsg('Password reset completed successfully. Log in with your new password.');
      handleModeChange('LOGIN');
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
      padding: '1.5rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      
      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        
        {/* logo and header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(59, 130, 246, 0.4) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            AF
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>
            AssetFlow — {mode.toLowerCase()}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enterprise Asset Management
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}

        {/* --- MODE 1: LOGIN --- */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ color: '#fff' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="**********"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => handleModeChange('FORGOT')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin-animation" style={{ margin: '0 auto' }} /> : 'Log In'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 700 }}>
                ⚡ Developer Quick Pass
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem', margin: 0 }}
                  onClick={() => onAuthSuccess('admin@assetflow.com', { id: 'sim-admin', name: 'Sarah Connor', email: 'admin@assetflow.com', role: 'ADMIN', departmentId: null })}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem', margin: 0 }}
                  onClick={() => onAuthSuccess('manager@assetflow.com', { id: 'sim-manager', name: 'John Doe', email: 'manager@assetflow.com', role: 'ASSET_MANAGER', departmentId: null })}
                >
                  Manager
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem', margin: 0 }}
                  onClick={() => onAuthSuccess('ithead@assetflow.com', { id: 'sim-ithead', name: 'James Smith', email: 'ithead@assetflow.com', role: 'DEPARTMENT_HEAD', departmentId: 'sim-it-dept' })}
                >
                  Dept Head
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem', margin: 0 }}
                  onClick={() => onAuthSuccess('employee@assetflow.com', { id: 'sim-employee', name: 'Alex Johnson', email: 'employee@assetflow.com', role: 'EMPLOYEE', departmentId: 'sim-it-dept' })}
                >
                  Employee
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>New here?</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => handleModeChange('SIGNUP')}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* --- MODE 2: SIGNUP --- */}
        {mode === 'SIGNUP' && (
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="James Smith"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="At least 6 characters"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: '#fff' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="Confirm password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            {/* Wireframe Box Disclaimer */}
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px dashed rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.8rem',
              lineHeight: 1.4,
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Sign up creates an employee account. Administrative roles are assigned later by an Administrator.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin-animation" style={{ margin: '0 auto' }} /> : 'Register'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => handleModeChange('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', margin: '0 auto' }}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          </form>
        )}

        {/* --- MODE 3: FORGOT PASSWORD --- */}
        {mode === 'FORGOT' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: '#fff' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin-animation" style={{ margin: '0 auto' }} /> : 'Request Reset Link'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => handleModeChange('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', margin: '0 auto' }}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          </form>
        )}

        {/* --- MODE 4: RESET PASSWORD (Convenient demonstration mode) --- */}
        {mode === 'RESET' && (
          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#fff' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: '#fff' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin-animation" style={{ margin: '0 auto' }} /> : 'Update Password'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => handleModeChange('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', margin: '0 auto' }}
              >
                <ArrowLeft size={14} /> Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
