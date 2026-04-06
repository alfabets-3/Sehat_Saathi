import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Shield, Mic, Keyboard } from 'lucide-react';
import VoiceTriage from '../components/VoiceTriage';

export default function Triage() {
  const { user, authFetch } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [stage, setStage] = useState(0); // 0=intro, 1-3=stages
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(null); // null=choose, 'voice', 'manual'

  const startTriage = async () => {
    setLoading(true);
    try {
      const data = await authFetch('/api/triage/start', { method: 'POST' });
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setStage(1);
    } catch (e) { addToast('Failed to start triage', 'error'); }
    setLoading(false);
  };

  const submitStage = async () => {
    const stageQs = questions;
    const unanswered = stageQs.filter(q => answers[q.id] === undefined || answers[q.id] === null);
    if (unanswered.length > 0) { addToast('Please answer all questions', 'warning'); return; }
    setLoading(true);
    try {
      const stageAnswers = {};
      stageQs.forEach(q => { stageAnswers[q.id] = answers[q.id]; });
      const data = await authFetch('/api/triage/submit', { method: 'POST', body: JSON.stringify({ sessionId, stage, answers: stageAnswers }) });
      if (data.completed) {
        setResult(data);
      } else {
        setQuestions(data.questions);
        setStage(data.stage);
      }
    } catch (e) { addToast('Submission failed', 'error'); }
    setLoading(false);
  };

  const handleVoiceComplete = (data) => {
    setResult(data);
  };

  const sevColors = { CRITICAL:'var(--critical)', URGENT:'var(--urgent)', MODERATE:'var(--moderate)', ROUTINE:'var(--teal)' };
  const sevBg = { CRITICAL:'var(--critical-bg)', URGENT:'var(--urgent-bg)', MODERATE:'var(--moderate-bg)', ROUTINE:'var(--teal-bg)' };

  // Result Screen
  if (result) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'20px' }}>
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} style={{ textAlign:'center', paddingTop:'40px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:sevBg[result.severity], display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:`3px solid ${sevColors[result.severity]}` }}>
            {result.severity === 'CRITICAL' ? <AlertTriangle size={36} color={sevColors[result.severity]} /> : <CheckCircle size={36} color={sevColors[result.severity]} />}
          </div>
          <h1 style={{ font:'var(--text-h1)', marginBottom:'8px' }}>{t('triageComplete')}</h1>
          <div className={`badge badge-${result.severity.toLowerCase()}`} style={{ fontSize:'16px', padding:'8px 20px', marginBottom:'16px' }}>
            {result.severity}
          </div>
          <div style={{ font:'var(--text-stat)', color:sevColors[result.severity], marginBottom:'8px' }}>{result.score}/10</div>
          <p style={{ font:'var(--text-body)', color:'var(--text-secondary)', maxWidth:'320px', margin:'0 auto 24px' }}>{result.message}</p>
          {result.queuePosition && (
            <div className="card" style={{ marginBottom:'16px', textAlign:'left' }}>
              <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{t('queueStatus')}</div>
              <div style={{ font:'var(--text-stat)', color:'var(--primary)' }}>#{result.queuePosition}</div>
              <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>Est. wait: ~{result.estimatedWait} {t('minWait')}</div>
            </div>
          )}
          <div style={{ display:'flex', gap:'12px' }}>
            <button onClick={() => navigate('/patient/queue')} style={{ flex:1, padding:'14px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)' }}>{t('viewQueue')}</button>
            <button onClick={() => navigate('/patient')} style={{ flex:1, padding:'14px', background:'var(--primary-bg)', color:'var(--primary)', borderRadius:'var(--radius-pill)', font:'var(--text-button)' }}>{t('dashboard')}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Voice Mode
  if (mode === 'voice') {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
        <VoiceTriage onComplete={handleVoiceComplete} onCancel={() => setMode(null)} />
      </div>
    );
  }

  // Intro Screen (Choose Mode)
  if (stage === 0) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'20px' }}>
        <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-secondary)', marginBottom:'24px' }}><ArrowLeft size={20} /> {t('back')}</button>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ textAlign:'center', paddingTop:'20px' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:'var(--primary-bg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Shield size={40} color="var(--primary)" />
          </div>
          <h1 style={{ font:'var(--text-h1)', marginBottom:'8px' }}>{t('aiTriageAssessment')}</h1>
          <p style={{ font:'var(--text-body)', color:'var(--text-secondary)', maxWidth:'340px', margin:'0 auto 28px' }}>
            {t('triageIntro')}
          </p>

          {/* Voice Triage Option — Primary Action */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('voice')}
            id="voice-triage-btn"
            style={{
              width: '100%', maxWidth: '340px', padding: '16px 24px', marginBottom: '16px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #8B7EF0 50%, var(--teal) 100%)',
              color: 'white', borderRadius: 'var(--radius-lg)', font: 'var(--text-button)', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              boxShadow: '0 8px 32px rgba(107,92,231,0.35)',
              border: 'none', cursor: 'pointer',
            }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div>{t('voiceTriage')}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 400 }}>{t('voiceTriageDesc')}</div>
            </div>
          </motion.button>

          <div style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)', marginBottom: '16px' }}>— {t('or')} —</div>

          {/* Manual Triage Option */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxWidth:'340px', margin:'0 auto 24px', textAlign:'left' }}>
            {[t('emergencyScreening') + ' (30 sec)', t('severityAssessment') + ' (3-5 min)', t('contextHistory') + ' (1-2 min)'].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'var(--bg-card)', borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-1)' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700 }}>{i+1}</div>
                <span style={{ font:'var(--text-body-sm)' }}>{s}</span>
              </div>
            ))}
          </div>

          <button id="start-triage-btn" onClick={() => { setMode('manual'); startTriage(); }} disabled={loading}
            style={{
              padding:'14px 48px', background:'var(--bg-card)', color:'var(--primary)',
              borderRadius:'var(--radius-pill)', font:'var(--text-button)', fontSize: '15px',
              border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              margin: '0 auto', opacity: loading ? 0.7 : 1,
            }}>
            <Keyboard size={18} />
            {loading ? t('loading') : t('beginAssessment')}
          </button>
        </motion.div>
      </div>
    );
  }

  // Question Stage (Manual)
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
        <div style={{ font:'var(--text-body-medium)', color:'var(--primary)' }}>{t('stageOf', stage)}</div>
        <div style={{ width:'20px' }} />
      </div>

      {/* Progress bar */}
      <div style={{ height:'6px', background:'var(--border-light)', borderRadius:'3px', marginBottom:'24px', overflow:'hidden' }}>
        <motion.div initial={{width:0}} animate={{width:`${(stage/3)*100}%`}} style={{ height:'100%', background:'var(--primary)', borderRadius:'3px' }} />
      </div>

      <h2 style={{ font:'var(--text-h2)', marginBottom:'4px' }}>
        {stage===1 ? t('emergencyScreening') : stage===2 ? t('severityAssessment') : t('contextHistory')}
      </h2>
      <p style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)', marginBottom:'24px' }}>
        {stage===1 ? t('quickSafety') : stage===2 ? t('helpUnderstand') : t('fewMoreDetails')}
      </p>

      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
          {questions.map((q, qi) => (
            <div key={q.id} className="card" style={{ marginBottom:'12px' }}>
              <p style={{ font:'var(--text-body-medium)', marginBottom:'12px' }}>{q.text}</p>
              
              {q.type === 'boolean' && (
                <div style={{ display:'flex', gap:'10px' }}>
                  {[{v:true,l:t('yes')},{v:false,l:t('no')}].map(opt => (
                    <button key={String(opt.v)} onClick={() => setAnswers({...answers, [q.id]: opt.v})}
                      style={{ flex:1, padding:'12px', borderRadius:'var(--radius-md)', border:`2px solid ${answers[q.id]===opt.v?'var(--primary)':'var(--border)'}`, background:answers[q.id]===opt.v?'var(--primary-bg)':'var(--bg-card)', font:'var(--text-button)', color:answers[q.id]===opt.v?'var(--primary)':'var(--text-secondary)', transition:'all 0.2s' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'scale' && (
                <div>
                  <input type="range" min={q.min} max={q.max} value={answers[q.id]||0} onChange={e => setAnswers({...answers, [q.id]: parseInt(e.target.value)})}
                    style={{ width:'100%', accentColor:'var(--primary)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', font:'var(--text-caption)', color:'var(--text-tertiary)' }}>
                    <span>{q.labels?.[0]||q.min}</span>
                    <span style={{ font:'var(--text-stat)', fontSize:'24px', color:'var(--primary)' }}>{answers[q.id]||0}</span>
                    <span>{q.labels?.[10]||q.max}</span>
                  </div>
                </div>
              )}

              {q.type === 'select' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {q.options.map(opt => (
                    <button key={opt.value} onClick={() => setAnswers({...answers, [q.id]: opt.value})}
                      style={{ padding:'12px 16px', borderRadius:'var(--radius-md)', border:`2px solid ${answers[q.id]===opt.value?'var(--primary)':'var(--border)'}`, background:answers[q.id]===opt.value?'var(--primary-bg)':'var(--bg-card)', textAlign:'left', font:'var(--text-body-sm)', color:answers[q.id]===opt.value?'var(--primary)':'var(--text-primary)', transition:'all 0.2s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'multiselect' && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {q.options.map(opt => {
                    const sel = (answers[q.id]||[]).includes(opt.value);
                    return (
                      <button key={opt.value} onClick={() => {
                        const cur = answers[q.id] || [];
                        setAnswers({...answers, [q.id]: sel ? cur.filter(v=>v!==opt.value) : [...cur.filter(v=>v!=='none'), opt.value==='none'?'none':opt.value]});
                      }}
                        style={{ padding:'10px 16px', borderRadius:'var(--radius-pill)', border:`2px solid ${sel?'var(--primary)':'var(--border)'}`, background:sel?'var(--primary-bg)':'var(--bg-card)', font:'var(--text-body-sm)', color:sel?'var(--primary)':'var(--text-primary)', transition:'all 0.2s' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div style={{ marginTop:'20px', paddingBottom:'100px' }}>
        <button onClick={submitStage} disabled={loading} id="submit-stage-btn"
          style={{ width:'100%', padding:'16px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(107,92,231,0.3)', opacity:loading?0.7:1 }}>
          {loading ? t('loading') : stage === 3 ? t('completeAssessment') : t('nextStage')} {!loading && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
}
