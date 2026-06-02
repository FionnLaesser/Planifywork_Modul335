import { useNavigate, Link } from 'react-router-dom';

const CARDS = [
  { to: '/users',    mark: 'HR',   title: 'Benutzerverwaltung', desc: 'Mitarbeiter und Rollen verwalten' },
  { to: '/time',     mark: 'Zeit', title: 'Stundenübersicht',   desc: 'Check-in/out und Monatsstunden prüfen' },
  { to: '/invoices', mark: 'CHF',  title: 'Rechnungen',         desc: 'Erstellen, versenden und abrechnen' },
  { to: '/absences', mark: 'Abw',  title: 'Absenzen & Ferien',  desc: 'Anträge prüfen und genehmigen' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="hr-page">
      <div className="app-header">
        <div>
          <p className="eyebrow">Planifywork</p>
          <h1>HR Dashboard</h1>
          <p className="muted">Personal, Stunden, Absenzen und Rechnungen verwalten</p>
        </div>
        <button className="ghost-button" onClick={logout}>Abmelden</button>
      </div>

      <div className="dashboard-grid">
        {CARDS.map(card => (
          <Link key={card.to} to={card.to} className="dashboard-card">
            <span className="tile-mark">{card.mark}</span>
            <span className="dashboard-card-title">{card.title}</span>
            <span className="dashboard-card-desc">{card.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
