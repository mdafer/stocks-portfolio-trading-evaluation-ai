import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Auth() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin((v) => !v); setError(''); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">◈</div>
          <h1 className="auth-title">StockEval</h1>
          <p className="auth-subtitle">{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          {!isLogin && (
            <div className="field">
              <label>Name</label>
              <input placeholder="Your name" value={form.name} onChange={set('name')} required autoFocus={!isLogin} />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required autoFocus={isLogin} />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="link-btn" onClick={switchMode}>{isLogin ? 'Register' : 'Sign in'}</button>
        </p>
      </div>
    </div>
  );
}
