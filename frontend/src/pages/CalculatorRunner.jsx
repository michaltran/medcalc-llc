import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { findCalculator } from '../calculators/index.js';
import { api } from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Markdown from '../components/Markdown.jsx';

const RISK_LABELS = {
  low: 'Nguy cơ thấp',
  mod: 'Nguy cơ trung bình',
  high: 'Nguy cơ cao',
  'very-high': 'Nguy cơ rất cao',
  neutral: '—'
};

export default function CalculatorRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const calculator = useMemo(() => findCalculator(id), [id]);
  const [values, setValues] = useState({});
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState('');
  const [protocols, setProtocols] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load preselected patient
  useEffect(() => {
    const pid = searchParams.get('patient');
    if (pid) {
      api.getPatient(pid).then(({ patient }) => setPatient(patient)).catch(() => {});
    }
  }, [searchParams]);

  // Load protocols
  useEffect(() => {
    if (!calculator) return;
    api.getProtocolsByCalculator(calculator.id)
      .then(({ protocols }) => setProtocols(protocols))
      .catch(() => {});
  }, [calculator]);

  // Reset values when calculator changes
  useEffect(() => {
    setValues({});
    setNotes('');
  }, [id]);

  if (!calculator) {
    return (
      <div className="main">
        <h1>Không tìm thấy bảng kiểm</h1>
        <button className="btn btn-secondary mt-md" onClick={() => navigate('/')}>← Quay về trang chủ</button>
      </div>
    );
  }

  const setValue = (key, value) => setValues(v => ({ ...v, [key]: value }));

  // Validation: all required inputs filled
  const isComplete = calculator.inputs.every(inp => {
    const v = values[inp.id];
    if (inp.type === 'binary') return v === 0 || v === 1;
    if (inp.type === 'choice' || inp.type === 'select') return v !== undefined && v !== null && v !== '';
    if (inp.type === 'number') return v !== undefined && v !== null && v !== '' && !isNaN(Number(v));
    return v !== undefined;
  });

  const result = isComplete ? calculator.compute(values) : null;

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await api.saveHistory({
        patient_id: patient ? patient.id : null,
        calculator_id: calculator.id,
        calculator_name: calculator.fullName,
        inputs: values,
        result,
        interpretation: result.interpretation,
        notes
      });
      toast.show('Đã lưu kết quả vào lịch sử', 'success');
    } catch (err) {
      toast.show('Lỗi khi lưu: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="main fade-in">
      <div className="page-header no-print">
        <div>
          <div className="page-eyebrow">{calculator.categoryLabel}</div>
          <h1 className="page-title">{calculator.fullName}</h1>
          <p className="page-subtitle">{calculator.longDescription}</p>
        </div>
      </div>

      {/* Patient context bar */}
      <div className="card mb-lg no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
            Bệnh nhân
          </div>
          {patient ? (
            <div style={{ marginTop: 4 }}>
              <strong>{patient.full_name}</strong>
              <span className="text-muted text-sm" style={{ marginLeft: 12 }}>
                MS: {patient.medical_record_number}
                {patient.date_of_birth && ` · ${formatDate(patient.date_of_birth)}`}
                {patient.gender && ` · ${patient.gender === 'M' ? 'Nam' : patient.gender === 'F' ? 'Nữ' : 'Khác'}`}
              </span>
            </div>
          ) : (
            <div className="text-muted text-sm" style={{ marginTop: 4 }}>Không liên kết với hồ sơ bệnh nhân (kết quả vẫn được tính nhưng không lưu vào hồ sơ)</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {patient && <button className="btn btn-ghost" onClick={() => setPatient(null)}>Bỏ liên kết</button>}
          <button className="btn btn-secondary" onClick={() => navigate('/patients?select=1&return=' + encodeURIComponent('/calc/' + calculator.id))}>
            {patient ? 'Đổi bệnh nhân' : 'Chọn bệnh nhân'}
          </button>
        </div>
      </div>

      <div className="grid-calculator">
        {/* Inputs */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Nhập thông số lâm sàng</h3>

            {calculator.inputs.map(input => (
              <InputField
                key={input.id}
                input={input}
                value={values[input.id]}
                onChange={(v) => setValue(input.id, v)}
              />
            ))}

            <div className="divider" />

            <div className="field">
              <label>Ghi chú (tùy chọn)</label>
              <textarea
                rows="2"
                placeholder="VD: Đo tại phòng khám lúc 09:00, BN có tăng HA cấp tính..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="text-xs text-muted mt-md" style={{ paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
              📚 Tham khảo: {calculator.reference}
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div>
          <div style={{ position: 'sticky', top: 24 }}>
            {result ? (
              <ResultPanel
                result={result}
                calculator={calculator}
                values={values}
                patient={patient}
                user={user}
                onSave={handleSave}
                onPrint={handlePrint}
                saving={saving}
                notes={notes}
              />
            ) : (
              <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⌛</div>
                <div className="text-sm">Vui lòng nhập đầy đủ thông số để xem kết quả</div>
              </div>
            )}

            {protocols.length > 0 && (
              <div className="card mt-md no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <strong>Phác đồ nội bộ kèm theo</strong>
                </div>
                {protocols.map(p => (
                  <a
                    key={p.id}
                    href={`/protocols/${p.id}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/protocols/${p.id}`); }}
                    style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--line)' }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--teal-deep)' }}>{p.title}</div>
                    <div className="text-xs text-muted">v{p.version} · {p.department || 'Toàn viện'}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ input, value, onChange }) {
  if (input.type === 'binary') {
    return (
      <div className="field">
        <label>{input.label}</label>
        {input.hint && <div className="field-hint" style={{ marginTop: -2, marginBottom: 6 }}>{input.hint}</div>}
        <div className="choice-row">
          <button
            type="button"
            className={'choice' + (value === 0 ? ' selected' : '')}
            onClick={() => onChange(0)}
          >Không</button>
          <button
            type="button"
            className={'choice' + (value === 1 ? ' selected points' : '')}
            onClick={() => onChange(1)}
          >Có {input.points ? `(+${input.points})` : ''}</button>
        </div>
      </div>
    );
  }

  if (input.type === 'choice') {
    return (
      <div className="field">
        <label>{input.label}</label>
        {input.hint && <div className="field-hint" style={{ marginTop: -2, marginBottom: 6 }}>{input.hint}</div>}
        <div className="choice-row">
          {input.options.map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              className={'choice' + (value === opt.value ? (opt.points ? ' selected points' : ' selected') : '')}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}{opt.points ? ` (+${opt.points})` : ''}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (input.type === 'select') {
    return (
      <div className="field">
        <label>{input.label}</label>
        {input.hint && <div className="field-hint">{input.hint}</div>}
        <select value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : (isNaN(e.target.value) ? e.target.value : Number(e.target.value)))}>
          <option value="">— Chọn —</option>
          {input.options.map(opt => (
            <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (input.type === 'number') {
    return (
      <div className="field">
        <label>{input.label} {input.unit && <span className="text-muted text-xs">({input.unit})</span>}</label>
        {input.hint && <div className="field-hint">{input.hint}</div>}
        <input
          type="number"
          value={value ?? ''}
          min={input.min}
          max={input.max}
          step={input.step || 1}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={input.unit}
        />
      </div>
    );
  }
  return null;
}

function ResultPanel({ result, calculator, values, patient, user, onSave, onPrint, saving, notes }) {
  const badgeClass = `badge badge-${result.riskLevel}`;
  return (
    <div className="result-panel">
      <div className="result-label">Kết quả</div>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span className="result-score">{result.score}</span>
        {result.unit && <span className="result-score-unit">{result.unit}</span>}
      </div>

      {result.summary && (
        <div className="text-sm text-muted mt-sm">{result.summary}</div>
      )}

      <div className="mt-md">
        <span className={badgeClass}>{RISK_LABELS[result.riskLevel] || result.riskLevel}</span>
      </div>

      {result.breakdown && result.breakdown.length > 0 && (
        <div className="mt-md text-xs text-muted">
          <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 4 }}>Chi tiết:</strong>
          {result.breakdown.map((b, idx) => (
            <div key={idx}>· {b.label} <strong>(+{b.points})</strong></div>
          ))}
        </div>
      )}

      <div className="result-interpretation">
        <strong>Khuyến cáo:</strong> {result.interpretation}
      </div>

      {/* Print-only metadata */}
      <div style={{ display: 'none' }} className="print-only">
        <div className="divider" />
        <div className="text-xs">
          <div><strong>Bệnh nhân:</strong> {patient ? `${patient.full_name} (MS: ${patient.medical_record_number})` : 'Không xác định'}</div>
          <div><strong>Người thực hiện:</strong> {user?.full_name}</div>
          <div><strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}</div>
          {notes && <div><strong>Ghi chú:</strong> {notes}</div>}
        </div>
      </div>

      <div className="flex gap-sm mt-lg no-print">
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Đang lưu...' : '💾 Lưu vào lịch sử'}
        </button>
        <button className="btn btn-secondary" onClick={onPrint}>
          🖨 In / PDF
        </button>
      </div>

      <style>{`
        @media print { .print-only { display: block !important; } }
      `}</style>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('vi-VN');
  } catch { return d; }
}
