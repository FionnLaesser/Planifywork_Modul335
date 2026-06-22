import { useNavigate, Link } from 'react-router-dom';

const CARDS = [
  { to: '/users',    mark: 'HR',   title: 'Benutzerverwaltung', desc: 'Mitarbeiter und Rollen verwalten' },
  { to: '/time',     mark: 'Zeit', title: 'Stundenübersicht',   desc: 'Check-in/out, Monatsstunden und Pausenverstösse prüfen' },
  { to: '/hour-budgets', mark: 'Std', title: 'Stundenfreigabe', desc: 'Monatliche Stundenkontingente für Schichtleiter festlegen' },
  { to: '/invoices', mark: 'CHF',  title: 'Rechnungen',         desc: 'Rechnungen erstellen, versenden und abrechnen' },
  { to: '/payroll',  mark: 'Lohn', title: 'Lohnauszüge',       desc: 'Monatslohn aus Stunden, Rate, Zuschlägen und Abzügen berechnen' },
  { to: '/absences', mark: 'Abw',  title: 'Absenzen & Ferien',  desc: 'Anträge prüfen und genehmigen' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
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
