import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useToast } from '../components/Toast.jsx';

export default function Patients() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSelectMode = searchParams.get('select') === '1';
  const returnUrl = searchParams.get('return') || '/';
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.listPatients(search).then(({ patients }) => setPatients(patients)).catch(err => toast.show(err.message, 'error'));
  }
  useEffect(() => { load(); }, [search]);

  function handleSelect(p) {
    if (isSelectMode) {
      navigate(`${returnUrl}?patient=${p.id}`);
    } else {
      navigate(`/patients/${p.id}`);
    }
  }

  return (
    <div className="main fade-in">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Quản lý bệnh nhân</div>
          <h1 className="page-title">{isSelectMode ? 'Chọn bệnh nhân' : 'Hồ sơ bệnh nhân'}</h1>
          <p className="page-subtitle">Tra cứu, quản lý hồ sơ bệnh nhân và lịch sử các bảng kiểm đã thực hiện</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          + Thêm bệnh nhân mới
        </button>
      </div>

      {showForm && (
        <PatientForm
          onClose={() => setShowForm(false)}
          onCreated={(p) => {
            setShowForm(false);
            toast.show('Đã tạo hồ sơ bệnh nhân', 'success');
            load();
            if (isSelectMode) navigate(`${returnUrl}?patient=${p.id}`);
          }}
        />
      )}

      <div className="mb-lg">
        <input
          type="search"
          placeholder="Tìm theo mã bệnh án, họ tên, số điện thoại..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {patients.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">👤</div>
          <div>Chưa có bệnh nhân nào{search && ` trùng với "${search}"`}</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Mã BA</th>
                <th>Họ và tên</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Số điện thoại</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(p)}>
                  <td><code>{p.medical_record_number}</code></td>
                  <td><strong>{p.full_name}</strong></td>
                  <td>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>{p.gender === 'M' ? 'Nam' : p.gender === 'F' ? 'Nữ' : '—'}</td>
                  <td>{p.phone || '—'}</td>
                  <td>{isSelectMode ? <span className="badge badge-low">Chọn</span> : <span className="text-muted text-xs">Xem chi tiết →</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PatientForm({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    medical_record_number: '',
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { patient } = await api.createPatient(form);
      onCreated(patient);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card mb-lg">
      <div className="flex-between mb-md">
        <h3>Thêm bệnh nhân mới</h3>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>
      <form onSubmit={submit}>
        <div className="grid-2">
          <div className="field">
            <label>Mã bệnh án *</label>
            <input required value={form.medical_record_number} onChange={e => setForm({ ...form, medical_record_number: e.target.value })} />
          </div>
          <div className="field">
            <label>Họ và tên *</label>
            <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="field">
            <label>Ngày sinh</label>
            <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div className="field">
            <label>Giới tính</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">— Chọn —</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
              <option value="O">Khác</option>
            </select>
          </div>
          <div className="field">
            <label>Số điện thoại</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Địa chỉ</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-sm mt-md">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
        </div>
      </form>
    </div>
  );
}
