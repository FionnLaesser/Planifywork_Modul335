import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const inputStyle = {
  padding: '6px 10px', borderRadius: 6,
  border: '1px solid #ccc', fontSize: 14,
};

const cardStyle = {
  border: '1px solid #e2e8f0', borderRadius: 10,
  padding: 16, background: '#fff',
};

export default function RapportsPage() {
  const [employees, setEmployees]   = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [rapports, setRapports]     = useState([]);
  const [imageUrls, setImageUrls]   = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const blobUrlsRef                 = useRef({});

  // Blob-URLs beim Verlassen der Seite freigeben
  useEffect(() => {
    return () => Object.values(blobUrlsRef.current).forEach(URL.revokeObjectURL);
  }, []);

  useEffect(() => {
    api.get('/api/users', { params: { role: 'EMPLOYEE' } })
      .then(res => setEmployees(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Mitarbeiterliste konnte nicht geladen werden'));
  }, []);

  const loadRapports = async (empId) => {
    setRapports([]);
    setImageUrls({});
    if (!empId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/media/employee/${empId}`);
      setRapports(Array.isArray(data) ? data : []);
    } catch {
      setError('Rapporte konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadImage = async (id) => {
    if (imageUrls[id]) return;
    try {
      const res = await api.get(`/api/media/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      blobUrlsRef.current[id] = url;
      setImageUrls(prev => ({ ...prev, [id]: url }));
    } catch {
      setImageUrls(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleSelect = (e) => {
    setSelectedId(e.target.value);
    loadRapports(e.target.value);
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleString('de-CH') : '—';
  const kb  = (b)  => b  ? `${Math.round(b / 1024)} KB` : '—';

  return (
    <div className="hr-page">
      <Link to="/dashboard" className="back-link">Zurück zum Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Rapport-Bilder</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Von Mitarbeitern hochgeladene Rapportfotos aus der Mobile App (gespeichert in MongoDB)
      </p>

      {error && <p className="form-error">{error}</p>}

      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 14 }}>
          Mitarbeiter auswählen<br />
          <select value={selectedId} onChange={handleSelect}
            style={{ ...inputStyle, minWidth: 240, marginTop: 4 }}>
            <option value="">— Mitarbeiter wählen —</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.username})
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="muted">Lade Rapporte…</p>}

      {!loading && selectedId && rapports.length === 0 && (
        <p className="muted">Keine Rapporte vorhanden für diesen Mitarbeiter.</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {rapports.map(r => (
          <div key={r.id} style={cardStyle}>
            <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{r.filename}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
              {fmt(r.uploadedAt)}
            </p>
            {r.orderId && (
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
                Auftrags-ID: <strong>{r.orderId}</strong>
              </p>
            )}
            {r.metadata?.note && (
              <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', marginBottom: 6 }}>
                „{r.metadata.note}"
              </p>
            )}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              {r.contentType} · {kb(r.fileSize)}
            </p>

            {!imageUrls[r.id] && (
              <button onClick={() => loadImage(r.id)} style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 6,
                border: '1px solid #cbd5e1', background: '#f8fafc',
                cursor: 'pointer',
              }}>
                Bild laden
              </button>
            )}
            {imageUrls[r.id] === 'error' && (
              <p style={{ fontSize: 12, color: '#dc2626' }}>Bild konnte nicht geladen werden</p>
            )}
            {imageUrls[r.id] && imageUrls[r.id] !== 'error' && (
              <img
                src={imageUrls[r.id]}
                alt={r.filename}
                style={{ width: '100%', borderRadius: 6, maxHeight: 260, objectFit: 'cover', marginTop: 4 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
