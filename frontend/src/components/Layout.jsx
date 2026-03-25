import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Overview', icon: '▣', end: true },
  { to: '/lists', label: 'Portfolios', icon: '▤' },
  { to: '/analyses', label: 'Analyses', icon: '◈' },
  { to: '/cron-jobs', label: 'Scheduled', icon: '⏱' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◈</span>
          <span>StockEval</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">⏏</button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
