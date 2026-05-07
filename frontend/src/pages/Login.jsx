import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand-large">
          <div className="login-brand-mark">L</div>
          <div className="login-title">MedCalc LLC</div>
          <div className="login-sub">Trung tâm Y tế khu vực Liên Chiểu</div>
        </div>

        <div className="field">
          <label>Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            required
            placeholder="vd: bs.nguyenvan"
          />
        </div>

        <div className="field">
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{
            background: 'var(--crimson-soft)', color: 'var(--crimson)',
            padding: '10px 12px', borderRadius: 'var(--r-md)', fontSize: 13,
            marginBottom: 'var(--space-md)'
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-warm)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--ink-muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>Tài khoản demo:</strong>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            • admin / admin@123<br />
            • bs.nguyenvan / bacsi@123
          </div>
        </div>
      </form>
    </div>
  );
}
