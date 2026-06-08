import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const STATUS_LABELS = {
  OPEN: 'Offen',
  IN_PROGRESS: 'Aktiv',
  DONE: 'Abgeschlossen',
};

export default function OrdersPage() {
  const shiftLeadId = localStorage.getItem('userId');
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async () => {
    if (!shiftLeadId) {
      setError('Keine Schichtleiter-ID im Login gefunden. Bitte neu einloggen.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.get('/api/orders', { params: { shiftLeadId } });
      setOrders(data || []);
    } catch (err) {
      setError(readError(err, 'Aufträge konnten nicht geladen werden.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => status === 'ALL' || order.status === status)
      .filter(order => {
        const text = [order.title, order.company, order.location, order.description, order.requiredRole, order.status]
          .join(' ')
          .toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [orders, search, status]);

  const setOrderStatus = async (orderId, nextStatus) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/api/orders/${orderId}/status`, { status: nextStatus });
      setOrders(current => current.map(order => order.id === data.id ? data : order));
      setMessage('Auftragsstatus wurde aktualisiert.');
    } catch (err) {
      setError(readError(err, 'Status konnte nicht aktualisiert werden.'));
    }
  };

  return (
    <Layout>
      <div className="sl-page">
        <div className="sl-page-header">
          <h1>Aufträge</h1>
          <p>Zugewiesene Aufträge des Schichtleiters · direkt aus dem Order Service</p>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}

        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Aufträge suchen"
            />
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="ALL">Alle Status</option>
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">Aktiv</option>
              <option value="DONE">Abgeschlossen</option>
            </select>
            <button className="secondary-button" type="button" onClick={loadOrders} disabled={loading}>
              {loading ? 'Lade…' : 'Aktualisieren'}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Firma / Ort</th>
                  <th>Zeitraum</th>
                  <th>Rolle</th>
                  <th>Status</th>
                  <th>Mitarbeiter</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: 16 }}>
                      {loading ? 'Aufträge werden geladen…' : 'Keine zugewiesenen Aufträge gefunden.'}
                    </td>
                  </tr>
                )}
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.title}</strong><br />
                      <span className="muted">#{order.id} · {order.description || 'Keine Beschreibung'}</span>
                    </td>
                    <td>{order.company || '—'}<br /><span className="muted">{order.location || '—'}</span></td>
                    <td>{formatDate(order.startDate)} bis {formatDate(order.endDate)}</td>
                    <td>{order.requiredRole || '—'}</td>
                    <td>
                      <select
                        className="compact-select"
                        value={order.status}
                        onChange={event => setOrderStatus(order.id, event.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>{order.employeeIds?.length ? order.employeeIds.map(id => `#${id}`).join(', ') : 'Noch keine'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('de-CH');
}

function readError(err, fallback) {
  return err?.response?.data?.message || err?.response?.data?.error || fallback;
}
