import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculators, categories } from '../calculators/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentHistory, setRecentHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listHistory({ limit: 5 })
      .then(({ history }) => setRecentHistory(history))
      .catch(() => {});
  }, []);

  const filtered = calculators.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.shortDescription.toLowerCase().includes(search.toLowerCase())
  );

  const greet = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Chào buổi sáng';
    if (h < 14) return 'Chào buổi trưa';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  return (
    <div className="main fade-in">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Trang chủ</div>
          <h1 className="page-title">{greet}, {user?.full_name?.split(' ').pop()}</h1>
          <p className="page-subtitle">Hệ thống bảng kiểm và công cụ tính toán y khoa, được biên soạn dựa trên các hướng dẫn cập nhật và phác đồ nội bộ của Trung tâm.</p>
        </div>
      </div>

      <div className="mb-lg">
        <input
          type="search"
          placeholder="Tìm bảng kiểm: VD: CHA2DS2, GRACE, eGFR, BMI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 15 }}
        />
      </div>

      {categories.map(cat => {
        const items = filtered.filter(c => c.category === cat.id);
        if (!items.length) return null;
        return (
          <section key={cat.id} className="mb-lg">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              {cat.label}
            </h2>
            <div className="grid-3">
              {items.map(c => (
                <div
                  key={c.id}
                  className="card card-hover"
                  onClick={() => navigate(`/calc/${c.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18 }}>{c.name}</h3>
                    <span className="badge badge-neutral">{c.categoryLabel}</span>
                  </div>
                  <div className="text-sm text-muted mt-sm">{c.shortDescription}</div>
                  <div className="text-xs text-soft mt-md" style={{ paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                    {c.reference?.split(';')[0]}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {recentHistory.length > 0 && (
        <section className="mt-lg">
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Hoạt động gần đây</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Bảng kiểm</th>
                  <th>Bệnh nhân</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map(h => (
                  <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/history/${h.id}`)}>
                    <td className="text-muted">{new Date(h.created_at).toLocaleString('vi-VN')}</td>
                    <td>{h.calculator_name}</td>
                    <td>{h.patient_name || <span className="text-muted">—</span>}</td>
                    <td><strong>{h.result.score}</strong> {h.result.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
