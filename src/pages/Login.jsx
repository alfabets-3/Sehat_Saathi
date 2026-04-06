import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Phone, Shield, ArrowLeft, Heart } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) { addToast('Enter valid 10-digit phone number', 'error'); return; }
    setLoading(true);
    try {
      const res = await login(null, phone);
      if (res.success) { setStep('otp'); addToast('OTP sent! Use 123456 for demo', 'success'); }
      else addToast(res.error || 'Failed to send OTP', 'error');
    } catch { addToast('Network error', 'error'); }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { addToast('Enter 6-digit OTP', 'error'); return; }
    setLoading(true);
    try {
      const res = await login(null, phone, otp);
      if (res.token) {
        addToast('Login successful!', 'success');
        const paths = { patient: '/patient', doctor: '/doctor', pharmacist: '/pharmacy' };
        navigate(paths[res.user.role] || '/patient');
      } else addToast(res.error || 'Invalid OTP', 'error');
    } catch { addToast('Verification failed', 'error'); }
    setLoading(false);
  };

  const handleDemo = async (role) => {
    setLoading(true);
    try {
      await login(role);
      const paths = { patient: '/patient', doctor: '/doctor', pharmacist: '/pharmacy' };
      navigate(paths[role]);
    } catch { addToast('Demo login failed', 'error'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6B5CE7 0%, #8B7EF0 100%)',
        padding: '20px 20px 50px', borderRadius: '0 0 32px 32px', position: 'relative',
      }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={24} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{ font: 'var(--text-h2)', color: 'white' }}>Welcome Back</h1>
            <p style={{ font: 'var(--text-body-sm)', color: 'rgba(255,255,255,0.8)' }}>Login to Sehat Saathi</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px 20px', flex: 1, maxWidth: '440px', width: '100%', margin: '0 auto' }}>
        
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-tertiary)' }} />
                <input className="form-input" type="tel" placeholder="Enter 10-digit number"
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ paddingLeft: '48px' }} maxLength={10} id="phone-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} id="send-otp-btn" style={{
              width: '100%', height: '56px', background: 'var(--primary)', color: 'white',
              borderRadius: 'var(--radius-pill)', font: 'var(--text-button)',
              boxShadow: '0 8px 24px rgba(107,92,231,0.3)', transition: 'all 0.2s var(--ease)',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter the OTP sent to <strong>+91 {phone}</strong>
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">OTP Code</label>
              <div style={{ position: 'relative' }}>
                <Shield size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-tertiary)' }} />
                <input className="form-input" type="text" placeholder="123456"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ paddingLeft: '48px', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }} maxLength={6} id="otp-input" />
              </div>
              <p style={{ font: 'var(--text-caption)', color: 'var(--teal)', marginTop: '8px' }}>
                💡 Demo OTP: <strong>123456</strong>
              </p>
            </div>
            <button type="submit" disabled={loading} id="verify-btn" style={{
              width: '100%', height: '56px', background: 'var(--primary)', color: 'white',
              borderRadius: 'var(--radius-pill)', font: 'var(--text-button)',
              boxShadow: '0 8px 24px rgba(107,92,231,0.3)', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); }}
              style={{ width: '100%', marginTop: '12px', padding: '12px', color: 'var(--text-secondary)', font: 'var(--text-body-sm)' }}>
              Change number
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>OR USE DEMO</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Demo Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { role: 'patient', label: '🧑 Login as Patient', sub: 'Rajesh Kumar · 9876500001', bg: 'var(--primary-bg)', color: 'var(--primary)' },
            { role: 'doctor', label: '🩺 Login as Doctor', sub: 'Dr. Anil Verma · 9876500101', bg: 'var(--teal-bg)', color: 'var(--teal-dark)' },
            { role: 'pharmacist', label: '💊 Login as Pharmacist', sub: 'Jan Aushadhi Kendra · 9876500201', bg: 'var(--peach-bg)', color: 'var(--peach-dark)' },
          ].map(d => (
            <button key={d.role} id={`demo-login-${d.role}`} onClick={() => handleDemo(d.role)} disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: d.bg, borderRadius: 'var(--radius-md)',
                border: '1.5px solid transparent', transition: 'all 0.2s var(--ease)',
                textAlign: 'left', opacity: loading ? 0.7 : 1,
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div>
                <div style={{ font: 'var(--text-body-medium)', color: d.color }}>{d.label}</div>
                <div style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>{d.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
