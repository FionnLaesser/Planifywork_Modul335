import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage    from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage    from './pages/UsersPage';
import TimePage     from './pages/TimePage';
import InvoicesPage from './pages/InvoicesPage';
import AbsencesPage from './pages/AbsencesPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="hr-app">
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/users"     element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/time"      element={<ProtectedRoute><TimePage /></ProtectedRoute>} />
          <Route path="/invoices"  element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
          <Route path="/absences"  element={<ProtectedRoute><AbsencesPage /></ProtectedRoute>} />
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
