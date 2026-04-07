import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import LogOut from lucide-react
import { Home, Stethoscope, ClipboardList, Map, Activity, LogOut } from 'lucide-react';

const navConfigs = {
  patient: [
    { path: '/patient', icon: Home, label: 'Home' },
    { path: '/patient/triage', icon: Stethoscope, label: 'Triage' },
    { path: '/patient/queue', icon: ClipboardList, label: 'Queue' },
    { path: '/patient/records', icon: Activity, label: 'Records' },
    { path: '/patient/heatmap', icon: Map, label: 'Heatmap' },
  ],
  doctor: [
    { path: '/doctor', icon: Home, label: 'Dashboard' },
    { path: '/doctor/heatmap', icon: Map, label: 'Heatmap' },
  ],
  pharmacist: [
    { path: '/pharmacy', icon: Home, label: 'Dashboard' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth(); // Correctly grabbing user and logout
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;
  const items = navConfigs[user.role] || navConfigs.patient;

  // Optimized logout handler based on your AuthContext notes
  const handleLogout = () => {
    // 1. Navigate to landing/login page first to avoid ProtectedRoute race conditions
    navigate('/', { replace: true });
    
    // 2. Then clear the auth state
    logout();
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--nav-height)', background: 'var(--bg-card)',
      boxShadow: '0 -4px 20px rgba(107,92,231,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px', paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100, borderTop: '1px solid var(--border-light)',
    }}>
      {/* Dynamic Nav Items */}
      {items.map(item => {
        const active = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            id={`nav-${item.label.toLowerCase()}`}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease', minWidth: '56px',
              background: active ? 'var(--primary-bg)' : 'transparent',
              transform: active ? 'scale(1.05)' : 'scale(1)',
              border: 'none', cursor: 'pointer'
            }}
          >
            <Icon size={22} fill={active ? 'var(--primary)' : 'none'} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: '11px', fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        );
      })}

      {/* Actual Logout Button */}
      <button
        id="nav-logout"
        onClick={handleLogout}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          color: '#ef4444', // Red color to indicate logout
          transition: 'all 0.2s ease', minWidth: '56px',
          background: 'transparent', border: 'none', cursor: 'pointer'
        }}
      >
        <LogOut size={22} strokeWidth={1.8} />
        <span style={{ fontSize: '11px', fontWeight: 500 }}>Logout</span>
      </button>
    </nav>
  );
}
