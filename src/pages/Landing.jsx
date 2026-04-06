import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Heart, Shield, Stethoscope, Pill, MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    const paths = { patient: '/patient', doctor: '/doctor', pharmacist: '/pharmacy' };
    navigate(paths[user.role] || '/patient', { replace: true });
    return null;
  }

  const features = [
    { icon: Stethoscope, title: 'AI Triage', desc: '3-stage symptom assessment with intelligent severity scoring', color: 'var(--primary)' },
    { icon: Clock, title: 'Smart Queue', desc: 'Predictive wait times with real-time transparency', color: 'var(--teal)' },
    { icon: Shield, title: 'Health Records', desc: 'ABHA-linked digital health records with AI wellness tips', color: 'var(--rose)' },
    { icon: Pill, title: 'Pharmacy', desc: 'Instant prescription routing with stock intelligence', color: 'var(--peach)' },
    { icon: MapPin, title: 'Health Heatmap', desc: 'Village-level disease surveillance and outbreak alerts', color: 'var(--critical)' },
    { icon: Sparkles, title: 'AI Wellness', desc: 'Personalized health recommendations powered by AI', color: 'var(--teal-dark)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6B5CE7 0%, #8B7EF0 40%, #4ECDC4 100%)',
        padding: '60px 24px 80px', textAlign: 'center', position: 'relative',
        borderRadius: '0 0 40px 40px', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', top:'40%', left:'10%', width:'80px', height:'80px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'80px', height:'80px', borderRadius:'24px', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(10px)', marginBottom:'20px', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
            <Heart size={40} color="white" fill="white" />
          </div>
          <h1 style={{ font: 'var(--text-display)', color: 'white', marginBottom: '12px', fontSize: '38px' }}>
            Sehat Saathi
          </h1>
          <p style={{ font: 'var(--text-body)', color: 'rgba(255,255,255,0.9)', maxWidth: '340px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            AI-Powered Smart Healthcare for Rural India
          </p>
          <button
            id="get-started-btn"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px', background: 'white', color: 'var(--primary)',
              borderRadius: 'var(--radius-pill)', font: 'var(--text-button)',
              fontSize: '17px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              transition: 'all 0.3s var(--ease)', cursor: 'pointer',
            }}
            onMouseOver={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'; }}
            onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}
          >
            Get Started <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ font: 'var(--text-h2)', textAlign: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>
          Transforming Rural Healthcare
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                padding: '20px', boxShadow: 'var(--shadow-1)',
                transition: 'all 0.3s var(--ease)', cursor: 'pointer',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
            >
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: f.color + '15', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ font: 'var(--text-body-medium)', marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Demo Access */}
      <div style={{ padding: '0 20px 60px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-bg) 0%, #F0ECFF 100%)',
          borderRadius: 'var(--radius-xl)', padding: '28px', border: '1px solid var(--border)',
        }}>
          <h3 style={{ font: 'var(--text-h3)', marginBottom: '4px' }}>🚀 Quick Demo Access</h3>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Try any portal instantly with demo credentials
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { role: 'patient', label: '🧑 Patient', color: 'var(--primary)' },
              { role: 'doctor', label: '🩺 Doctor', color: 'var(--teal)' },
              { role: 'pharmacist', label: '💊 Pharmacy', color: 'var(--rose)' },
            ].map(r => (
              <DemoButton key={r.role} {...r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoButton({ role, label, color }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await login(role);
      const paths = { patient: '/patient', doctor: '/doctor', pharmacist: '/pharmacy' };
      navigate(paths[role]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <button id={`demo-${role}`} onClick={handleClick} disabled={loading}
      style={{
        flex: 1, minWidth: '100px', padding: '12px 16px',
        background: color, color: 'white', borderRadius: 'var(--radius-md)',
        font: 'var(--text-button)', fontSize: '14px',
        transition: 'all 0.2s var(--ease)', opacity: loading ? 0.7 : 1,
        boxShadow: `0 4px 16px ${color}40`,
      }}
      onMouseOver={e => { if(!loading) e.target.style.transform = 'scale(0.97)'; }}
      onMouseOut={e => { e.target.style.transform = 'scale(1)'; }}
    >
      {loading ? '...' : label}
    </button>
  );
}
