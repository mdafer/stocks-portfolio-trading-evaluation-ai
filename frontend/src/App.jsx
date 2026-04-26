import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Lists from './pages/Lists';
import ListDetail from './pages/ListDetail';
import Analyses from './pages/Analyses';
import CronJobs from './pages/CronJobs';
import Settings from './pages/Settings';
import CombinedView from './pages/CombinedView';
import NewsCenter from './pages/NewsCenter';
import DividendsCenter from './pages/DividendsCenter';
import EarningsCenter from './pages/EarningsCenter';
import StockDetail from './pages/StockDetail';
import MoversPage from './pages/MoversPage';
import StocksPage from './pages/StocksPage';
import SectorPage from './pages/SectorPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : children;
}

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/lists/compare" element={<CombinedView />} />
              <Route path="/lists/:id" element={<ListDetail />} />
              <Route path="/analyses" element={<Analyses />} />
              <Route path="/news" element={<NewsCenter />} />
              <Route path="/dividends" element={<DividendsCenter />} />
              <Route path="/earnings" element={<EarningsCenter />} />
              <Route path="/cron-jobs" element={<CronJobs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/stocks/sectors/:sectorId" element={<SectorPage />} />
              <Route path="/stocks/:symbol" element={<StockDetail />} />
              <Route path="/movers" element={<MoversPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
