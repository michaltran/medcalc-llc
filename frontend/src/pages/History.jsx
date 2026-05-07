import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api.js';

const RISK_LABELS = { low: 'Thấp', mod: 'Trung bình', high: 'Cao', 'very-high': 'Rất cao' };

export function HistoryList() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.listHistory({ limit: 100 }).then(({ history }) => setHistory(history));
  }, []);

  return (
    <div className="main fade-in">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Lịch sử</div>
          <h1 className="page-title">Lịch sử tính toán</h1>
          <p className="page-subtitle">Tất cả các bảng kiểm bạn đã thực hiện gần đây.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📊</div>
          <div>Chưa có lịch sử nào</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Bảng kiểm</th>
                <th>Bệnh nhân</th>
                <th>Kết quả</th>
                <th>Mức độ</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/history/${h.id}`)}>
                  <td className="text-muted">{new Date(h.created_at).toLocaleString('vi-VN')}</td>
                  <td><strong>{h.calculator_name}</strong></td>
                  <td>{h.patient_name || <span className="text-muted">—</span>}</td>
                  <td><strong>{h.result.score}</strong> <span className="text-muted text-xs">{h.result.unit}</span></td>
                  <td>
                    {h.result.riskLevel && (
                      <span className={`badge badge-${h.result.riskLevel}`}>{RISK_LABELS[h.result.riskLevel]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    api.getHistory(id).then(({ entry }) => setEntry(entry));
  }, [id]);

  if (!entry) return <div className="main"><div className="empty">Đang tải...</div></div>;

  return (
    <div className="main fade-in">
      <button className="btn btn-ghost mb-md no-print" onClick={() => navigate(-1)}>← Quay lại</button>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Báo cáo bảng kiểm</div>
          <h1 className="page-title">{entry.calculator_name}</h1>
          <p className="page-subtitle">
            Thực hiện ngày {new Date(entry.created_at).toLocaleString('vi-VN')} bởi {entry.user_name}
          </p>
        </div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}>🖨 In / PDF</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="mb-md">Thông tin bệnh nhân</h3>
          {entry.patient_name ? (
            <div>
              <div><strong>{entry.patient_name}</strong></div>
              <div className="text-sm text-muted">Mã BA: <code>{entry.medical_record_number}</code></div>
              {entry.date_of_birth && <div className="text-sm text-muted">Ngày sinh: {new Date(entry.date_of_birth).toLocaleDateString('vi-VN')}</div>}
              {entry.gender && <div className="text-sm text-muted">Giới tính: {entry.gender === 'M' ? 'Nam' : entry.gender === 'F' ? 'Nữ' : 'Khác'}</div>}
            </div>
          ) : (
            <div className="text-muted">Không liên kết với hồ sơ bệnh nhân</div>
          )}
        </div>

        <div className="card result-panel" style={{ marginTop: 0 }}>
          <div className="result-label">Kết quả</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="result-score">{entry.result.score}</span>
            {entry.result.unit && <span className="result-score-unit">{entry.result.unit}</span>}
          </div>
          {entry.result.summary && <div className="text-sm text-muted mt-sm">{entry.result.summary}</div>}
          <div className="mt-sm">
            {entry.result.riskLevel && (
              <span className={`badge badge-${entry.result.riskLevel}`}>{RISK_LABELS[entry.result.riskLevel]}</span>
            )}
          </div>
          <div className="result-interpretation">
            <strong>Khuyến cáo:</strong> {entry.interpretation || entry.result.interpretation}
          </div>
        </div>
      </div>

      <div className="card mt-md">
        <h3 className="mb-md">Thông số đầu vào</h3>
        <table>
          <tbody>
            {Object.entries(entry.inputs).map(([key, val]) => (
              <tr key={key}>
                <td className="text-muted" style={{ width: '40%' }}>{key}</td>
                <td><strong>{String(val)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entry.notes && (
        <div className="card mt-md">
          <h3 className="mb-md">Ghi chú</h3>
          <div className="text-sm">{entry.notes}</div>
        </div>
      )}

      <div className="text-xs text-muted mt-lg" style={{ paddingTop: 16, borderTop: '1px dashed var(--line)' }}>
        Báo cáo được tạo bởi Hệ thống MedCalc LLC – TTYT khu vực Liên Chiểu
      </div>
    </div>
  );
}
