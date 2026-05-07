import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { categories, getCalculatorsByCategory } from '../calculators/index.js';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">L</div>
        <div className="brand-text">
          <span className="brand-name">MedCalc LLC</span>
          <span className="brand-sub">TTYT Liên Chiểu</span>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Tổng quan</div>
        <NavLink to="/" end className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <Icon path="M3 12l9-9 9 9M5 10v10h14V10" /> Trang chủ
        </NavLink>
        <NavLink to="/patients" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <Icon path="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" /> Bệnh nhân
        </NavLink>
        <NavLink to="/history" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <Icon path="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /> Lịch sử tính toán
        </NavLink>
        <NavLink to="/protocols" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> Phác đồ nội bộ
        </NavLink>
      </div>

      {categories.map(cat => {
        const items = getCalculatorsByCategory(cat.id);
        if (!items.length) return null;
        return (
          <div className="nav-section" key={cat.id}>
            <div className="nav-section-label">{cat.icon} {cat.label}</div>
            {items.map(c => (
              <NavLink
                key={c.id}
                to={`/calc/${c.id}`}
                className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}
              >
                <span style={{ width: 18, fontSize: 12, color: 'var(--ink-soft)' }}>•</span>
                {c.name}
              </NavLink>
            ))}
          </div>
        );
      })}

      <div className="sidebar-footer">
        {user && (
          <>
            <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{user.full_name}</div>
            <div>{user.department || user.role}</div>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: 8, padding: '4px 0', fontSize: 12 }}>
              Đăng xuất →
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function Icon({ path }) {
  return (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
