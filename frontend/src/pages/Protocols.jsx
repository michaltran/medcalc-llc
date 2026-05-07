import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import Markdown from '../components/Markdown.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { calculators } from '../calculators/index.js';

export function ProtocolsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [protocols, setProtocols] = useState([]);

  useEffect(() => {
    api.listProtocols().then(({ protocols }) => setProtocols(protocols));
  }, []);

  return (
    <div className="main fade-in">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Phác đồ điều trị nội bộ</div>
          <h1 className="page-title">Phác đồ TTYT Liên Chiểu</h1>
          <p className="page-subtitle">Tài liệu hướng dẫn lâm sàng được biên soạn và phê duyệt nội bộ, gắn liền với các bảng kiểm tương ứng.</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => navigate('/protocols/new')}>+ Thêm phác đồ</button>
        )}
      </div>

      {protocols.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📚</div>
          <div>Chưa có phác đồ nào</div>
        </div>
      ) : (
        <div className="grid-3">
          {protocols.map(p => (
            <div key={p.id} className="card card-hover" onClick={() => navigate(`/protocols/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="badge badge-neutral">v{p.version}</span>
                {p.department && <span className="text-xs text-muted">{p.department}</span>}
              </div>
              <h3 style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}>{p.title}</h3>
              <div className="text-xs text-muted mt-md" style={{ paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                Cập nhật: {new Date(p.updated_at).toLocaleDateString('vi-VN')}
                {p.updated_by_name && ` · ${p.updated_by_name}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProtocolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [protocol, setProtocol] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    api.getProtocol(id).then(({ protocol }) => {
      setProtocol(protocol);
      setDraft(protocol);
    });
  }, [id]);

  if (!protocol) return <div className="main"><div className="empty">Đang tải...</div></div>;

  async function save() {
    try {
      const { protocol: updated } = await api.updateProtocol(protocol.id, draft);
      setProtocol(updated);
      setEditing(false);
      toast.show('Đã cập nhật phác đồ', 'success');
    } catch (err) {
      toast.show(err.message, 'error');
    }
  }

  return (
    <div className="main fade-in">
      <button className="btn btn-ghost mb-md no-print" onClick={() => navigate(-1)}>← Quay lại</button>

      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="page-eyebrow">Phác đồ điều trị · v{protocol.version}</div>
          {editing ? (
            <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={{ fontSize: 28, fontFamily: 'var(--font-display)' }} />
          ) : (
            <h1 className="page-title">{protocol.title}</h1>
          )}
          <p className="page-subtitle">
            {protocol.department || 'Toàn viện'} · Cập nhật {new Date(protocol.updated_at).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-sm no-print">
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨 In</button>
          {user?.role === 'admin' && !editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>✎ Chỉnh sửa</button>
          )}
          {editing && (
            <>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setDraft(protocol); }}>Hủy</button>
              <button className="btn btn-primary" onClick={save}>Lưu</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        {editing ? (
          <textarea
            rows="30"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            value={draft.content_md}
            onChange={e => setDraft({ ...draft, content_md: e.target.value })}
          />
        ) : (
          <Markdown content={protocol.content_md} />
        )}
      </div>
    </div>
  );
}

export function ProtocolNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    calculator_id: '',
    title: '',
    department: '',
    version: '1.0',
    content_md: '# Tiêu đề phác đồ\n\nNội dung...'
  });

  if (user?.role !== 'admin') {
    return <div className="main"><div className="empty">Bạn không có quyền truy cập trang này</div></div>;
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const { protocol } = await api.saveProtocol(form);
      toast.show('Đã tạo phác đồ', 'success');
      navigate(`/protocols/${protocol.id}`);
    } catch (err) {
      toast.show(err.message, 'error');
    }
  }

  return (
    <div className="main fade-in">
      <button className="btn btn-ghost mb-md" onClick={() => navigate(-1)}>← Quay lại</button>
      <h1 className="mb-md">Phác đồ mới</h1>
      <form onSubmit={submit} className="card">
        <div className="grid-2">
          <div className="field">
            <label>Bảng kiểm liên quan *</label>
            <select required value={form.calculator_id} onChange={e => setForm({ ...form, calculator_id: e.target.value })}>
              <option value="">— Chọn —</option>
              {calculators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Khoa</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="VD: Khoa Nội Tim mạch" />
          </div>
          <div className="field">
            <label>Tiêu đề *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Phiên bản</label>
            <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Nội dung (Markdown) *</label>
          <textarea
            required rows="20"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            value={form.content_md}
            onChange={e => setForm({ ...form, content_md: e.target.value })}
          />
          <div className="field-hint">Hỗ trợ: # heading, **bold**, bảng |..|, - danger, &gt; trích dẫn</div>
        </div>
        <button type="submit" className="btn btn-primary">Tạo phác đồ</button>
      </form>
    </div>
  );
}
