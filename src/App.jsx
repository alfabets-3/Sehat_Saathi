import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import Triage from './pages/Triage';
import QueueStatus from './pages/QueueStatus';
import HealthRecords from './pages/HealthRecords';
import BookAppointment from './pages/BookAppointment';
import SOS from './pages/SOS';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import Heatmap from './pages/Heatmap';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="animate-pulse" style={{font:'var(--text-h2)',color:'var(--primary)'}}>Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/triage" element={<ProtectedRoute roles={['patient']}><Triage /></ProtectedRoute>} />
        <Route path="/patient/queue" element={<ProtectedRoute roles={['patient']}><QueueStatus /></ProtectedRoute>} />
        <Route path="/patient/records" element={<ProtectedRoute roles={['patient']}><HealthRecords /></ProtectedRoute>} />
        <Route path="/patient/book" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />
        <Route path="/patient/sos" element={<ProtectedRoute roles={['patient']}><SOS /></ProtectedRoute>} />
        <Route path="/patient/heatmap" element={<ProtectedRoute roles={['patient']}><Heatmap /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/heatmap" element={<ProtectedRoute roles={['doctor']}><Heatmap /></ProtectedRoute>} />
        <Route path="/pharmacy" element={<ProtectedRoute roles={['pharmacist']}><PharmacyDashboard /></ProtectedRoute>} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <Navbar />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
