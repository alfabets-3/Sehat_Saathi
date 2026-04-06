import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Stethoscope, ClipboardList, FileText, Calendar, AlertTriangle, MapPin, LogOut, Activity, Sparkles, ChevronRight } from 'lucide-react';

export default function PatientDashboard() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [queueStatus, setQueueStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const profile = user?.profile;

  useEffect(() => {
    if (user?.refId) {
      fetch(`/api/queue/patient/${user.refId}`).then(r=>r.json()).then(setQueueStatus).catch(()=>{});
      fetch('/api/stats').then(r=>r.json()).then(setStats).catch(()=>{});
    }
  }, [user]);

  const quickActions = [
    { icon: Stethoscope, label: 'Start Triage', desc: 'AI symptom assessment', path: '/patient/triage', color: 'var(--primary)', bg: 'var(--primary-bg)' },
    { icon: ClipboardList, label: 'Queue Status', desc: 'Check your position', path: '/patient/queue', color: 'var(--teal)', bg: 'var(--teal-bg)' },
    { icon: FileText, label: 'Health Records', desc: 'View ABHA records', path: '/patient/records', color: 'var(--rose)', bg: 'var(--rose-bg)' },
    { icon: Calendar, label: 'Book Appointment', desc: 'Schedule a visit', path: '/patient/book', color: 'var(--peach-dark)', bg: 'var(--peach-bg)' },
    { icon: MapPin, label: 'Health Heatmap', desc: 'Community health alerts', path: '/patient/heatmap', color: 'var(--critical)', bg: 'var(--critical-bg)' },
    { icon: AlertTriangle, label: 'Emergency SOS', desc: 'One-tap ambulance', path: '/patient/sos', color: '#FF4757', bg: '#FFE8EA' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6B5CE7 0%, #8B7EF0 50%, #4ECDC4 100%)',
        padding: '24px 20px 32px', borderRadius: '0 0 32px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ font: 'var(--text-body-sm)', color: 'rgba(255,255,255,0.8)' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</p>
            <h1 style={{ font: 'var(--text-h1)', color: 'white' }}>{profile?.name || 'Patient'}</h1>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <LogOut size={18} color="white" />
          </button>
        </div>
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Queue', value: stats?.queueWaiting || 0, icon: '👥' },
            { label: 'Doctors', value: stats?.doctors || 0, icon: '🩺' },
            { label: 'Alerts', value: stats?.redAlerts || 0, icon: '🔴' },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', borderRadius:'14px', padding:'12px', textAlign:'center' }}>
              <span style={{ fontSize:'20px' }}>{s.icon}</span>
              <div style={{ font:'var(--text-stat)', color:'white', fontSize:'22px', marginTop:'4px' }}>{s.value}</div>
              <div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.7)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Queue Alert */}
        {queueStatus?.inQueue && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            onClick={() => navigate('/patient/queue')}
            style={{
              background: 'linear-gradient(135deg, var(--teal-bg) 0%, #E0F7F5 100%)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '20px',
              border: '1.5px solid var(--teal)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Activity size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font:'var(--text-body-medium)', color:'var(--teal-dark)' }}>You're in queue — Position #{queueStatus.position}</div>
              <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>~{queueStatus.estimatedWait} min wait • Dr. {queueStatus.entry?.doctor_name}</div>
            </div>
            <ChevronRight size={20} color="var(--teal)" />
          </motion.div>
        )}

        {/* Quick Actions */}
        <h2 style={{ font: 'var(--text-h3)', marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {quickActions.map((a, i) => (
            <motion.button key={a.label} id={`action-${a.label.toLowerCase().replace(/\s/g,'-')}`}
              initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
              onClick={() => navigate(a.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
                padding: '18px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-1)', transition: 'all 0.2s var(--ease)', textAlign: 'left',
                border: a.label === 'Emergency SOS' ? '1.5px solid #FF4757' : '1px solid var(--border-light)',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
            >
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:a.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <a.icon size={22} color={a.color} />
              </div>
              <div>
                <div style={{ font:'var(--text-body-medium)', color:'var(--text-primary)' }}>{a.label}</div>
                <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginTop:'2px' }}>{a.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ABHA Card */}
        {profile?.abha_id && (
          <div style={{
            background: 'linear-gradient(135deg, #2D2B55 0%, #6B5CE7 100%)',
            borderRadius: 'var(--radius-xl)', padding: '24px', color: 'white', marginBottom: '20px',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <p style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>AYUSHMAN BHARAT</p>
                <p style={{ font:'var(--text-h3)', color:'white' }}>Health Account</p>
              </div>
              <Sparkles size={28} color="rgba(255,255,255,0.5)" />
            </div>
            <p style={{ font:'var(--text-stat)', fontSize:'20px', letterSpacing:'2px', marginBottom:'12px' }}>{profile.abha_id}</p>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div><p style={{font:'var(--text-caption)',color:'rgba(255,255,255,0.6)'}}>Name</p><p style={{font:'var(--text-body-sm)'}}>{profile.name}</p></div>
              <div><p style={{font:'var(--text-caption)',color:'rgba(255,255,255,0.6)'}}>Blood</p><p style={{font:'var(--text-body-sm)'}}>{profile.blood_group}</p></div>
              <div><p style={{font:'var(--text-caption)',color:'rgba(255,255,255,0.6)'}}>Gender</p><p style={{font:'var(--text-body-sm)'}}>{profile.gender}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
