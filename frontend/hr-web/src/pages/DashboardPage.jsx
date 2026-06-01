import { useNavigate, Link } from 'react-router-dom';

const CARDS = [
  { to: '/users',    icon: '👤', title: 'Benutzerverwaltung',     desc: 'Mitarbeiter & Rollen verwalten' },
  { to: '/time',     icon: '⏱️', title: 'Stundenübersicht',        desc: 'Check-in/out und Monatsstunden' },
  { to: '/invoices', icon: '🧾', title: 'Rechnungen',              desc: 'Erstellen, versenden & abrechnen' },
  { to: '/absences', icon: '📅', title: 'Absenzen & Ferien',       desc: 'Anträge prüfen und genehmigen' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>HR Dashboard</h1>
        <button onClick={logout}
          style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: 'none', fontSize: 14 }}>
          Abmelden
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {CARDS.map(card => (
          <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: 24, borderRadius: 8, border: '1px solid #e0e0e0',
              cursor: 'pointer', transition: 'box-shadow 0.15s',
              background: '#fff',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#111', marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
