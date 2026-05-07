import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { findCalculator } from '../calculators/index.js';

const RISK_LABELS = { low: 'Thấp', mod: 'Trung bình', high: 'Cao', 'very-high': 'Rất cao' };

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getPatient(id).then(({ patient, history }) => {
      setPatient(patient);
      setHistory(history);
    });
  }, [id]);

  if (!patient) return <div className="main"><div className="empty">Đang tải...</div></div>;

  return (
    <div className="main fade-in">
      <button className="btn btn-ghost mb-md" onClick={() => navigate(-1)}>← Quay lại</button>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Hồ sơ bệnh nhân</div>
          <h1 className="page-title">{patient.full_name}</h1>
          <p className="page-subtitle">
            Mã BA: <code>{patient.medical_record_number}</code>
            {patient.date_of_birth && ` · ${new Date(patient.date_of_birth).toLocaleDateString('vi-VN')}`}
            {patient.gender && ` · ${patient.gender === 'M' ? 'Nam' : patient.gender === 'F' ? 'Nữ' : 'Khác'}`}
            {patient.phone && ` · ${patient.phone}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/?_=' + Date.now())}>
          + Tính toán mới
        </button>
      </div>

      {patient.address && (
        <div className="card mb-md">
          <div className="text-xs" style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>Địa chỉ</div>
          <div>{patient.address}</div>
        </div>
      )}

      <h2 className="mb-md">Lịch sử bảng kiểm ({history.length})</h2>

      {history.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📋</div>
          <div>Chưa có bảng kiểm nào được thực hiện cho bệnh nhân này</div>
        </div>
      ) : (
        <div className="flex-col gap-md">
          {history.map(h => {
            const result = JSON.parse(h.result_json);
            const calc = findCalculator(h.calculator_id);
            return (
              <div key={h.id} className="card card-hover" onClick={() => navigate(`/history/${h.id}`)}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="text-xs text-muted">
                      {new Date(h.created_at).toLocaleString('vi-VN')} · {h.user_name}
                    </div>
                    <h4 style={{ marginTop: 4 }}>{h.calculator_name}</h4>
                    {h.interpretation && <div className="text-sm text-muted mt-sm">{h.interpretation}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--teal-deep)', lineHeight: 1 }}>
                      {result.score}
                    </div>
                    <div className="text-xs text-muted">{result.unit}</div>
                    {result.riskLevel && (
                      <span className={`badge badge-${result.riskLevel}`} style={{ marginTop: 6 }}>
                        {RISK_LABELS[result.riskLevel]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
