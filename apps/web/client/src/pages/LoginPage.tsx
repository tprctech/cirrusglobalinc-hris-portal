import { useState, type FormEvent } from 'react';
import { useAuth } from '../app/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/cirrus-logo.webp" alt="Cirrus Global" className="login-logo-img" />
        </div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to Cirrus Performance Hub</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="login-forgot-row">
            <button type="button" className="login-forgot-link" onClick={() => setForgotPasswordOpen(true)}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Cirrus Performance Hub &copy; {new Date().getFullYear()}
        </p>
      </div>

      {forgotPasswordOpen && (
        <div className="login-modal-backdrop" onClick={() => setForgotPasswordOpen(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="login-modal-title">Forgot Your Password?</h2>
            <p className="login-modal-message">
              Please contact your <strong>Admin</strong> or <strong>HR representative</strong> to have your password reset.
            </p>
            <p className="login-modal-note">
              They can reset your password from the HR Center, and you'll be given a new default password to sign in with.
            </p>
            <button className="login-modal-btn" onClick={() => setForgotPasswordOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
