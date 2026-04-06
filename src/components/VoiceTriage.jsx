import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyzeSymptoms, nlpToTriageAnswers } from '../lib/nlpEngine';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, Globe, ChevronDown, X, AlertTriangle,
  CheckCircle, Activity, Clock, Pill, Thermometer, Brain, RefreshCw
} from 'lucide-react';

const sevColors = { CRITICAL: '#FF4757', URGENT: '#FF8C42', MODERATE: '#FFD93D', ROUTINE: '#4ECDC4' };
const sevBg = { CRITICAL: '#FFE8EA', URGENT: '#FFF0E5', MODERATE: '#FFF9E0', ROUTINE: '#E0F7F5' };

const categoryIcons = {
  cardiac: '❤️', respiratory: '🫁', neurological: '🧠', trauma: '🩹',
  infection: '🦠', gastro: '🤢', pain: '💢', dermatological: '🧴',
  ophtha: '👁️', uro: '💧', general: '🏥', inflammation: '🔴', obstetric: '🤰',
};

export default function VoiceTriage({ onComplete, onCancel }) {
  const { t, lang, currentLang } = useLanguage();
  const { user, authFetch } = useAuth();
  const { addToast } = useToast();

  const [status, setStatus] = useState('idle'); // idle | listening | processing | result | error
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(currentLang.locale);
  const recognitionRef = useRef(null);
  const pulseRef = useRef(null);

  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  // Pulse animation
  useEffect(() => {
    if (status === 'listening') {
      let scale = 1;
      let growing = true;
      const animate = () => {
        if (growing) { scale += 0.005; if (scale >= 1.15) growing = false; }
        else { scale -= 0.005; if (scale <= 1) growing = true; }
        if (pulseRef.current) pulseRef.current.style.transform = `scale(${scale})`;
        if (status === 'listening') requestAnimationFrame(animate);
      };
      const frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }
  }, [status]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      addToast(t('voiceNotSupported'), 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLocale;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setTranscript('');
      setInterimText('');
      setAnalysis(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalT = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalT += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalT.trim()) setTranscript(prev => (prev + ' ' + finalT).trim());
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setStatus('error');
        addToast(`Voice error: ${event.error}`, 'error');
      }
    };

    recognition.onend = () => {
      // Auto-analyze after speech ends
      if (status === 'listening') {
        processTranscript();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, selectedLocale, status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    processTranscript();
  }, [transcript, interimText]);

  const processTranscript = useCallback(() => {
    const fullText = (transcript + ' ' + interimText).trim();
    if (!fullText) {
      setStatus('idle');
      return;
    }
    setStatus('processing');
    setTranscript(fullText);
    setInterimText('');

    // Simulate slight processing delay for UX
    setTimeout(() => {
      const langCode = LANGUAGES.find(l => l.locale === selectedLocale)?.code || 'en';
      const result = analyzeSymptoms(fullText, langCode);
      setAnalysis(result);
      setStatus('result');
    }, 800);
  }, [transcript, interimText, selectedLocale]);

  // Submit voice triage to backend
  const submitVoiceTriage = async () => {
    if (!analysis || analysis.symptoms.length === 0) {
      addToast(t('noSymptoms'), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Start a triage session
      const startRes = await authFetch('/api/triage/start', { method: 'POST' });
      const sessionId = startRes.sessionId;

      // Convert NLP analysis to triage answers and submit all 3 stages
      const answers = nlpToTriageAnswers(analysis);

      // Submit stage 1
      const s1 = await authFetch('/api/triage/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, stage: 1, answers: { q1_1: answers.q1_1, q1_2: answers.q1_2, q1_3: answers.q1_3 } }),
      });

      if (s1.completed) {
        onComplete?.(s1);
        return;
      }

      // Submit stage 2
      const s2Answers = {};
      ['q2_1', 'q2_2', 'q2_3', 'q2_4', 'q2_5', 'q2_6'].forEach(k => { s2Answers[k] = answers[k]; });
      const s2 = await authFetch('/api/triage/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, stage: 2, answers: s2Answers }),
      });

      if (s2.completed) {
        onComplete?.(s2);
        return;
      }

      // Submit stage 3
      const s3Answers = {};
      ['q3_1', 'q3_2', 'q3_3', 'q3_4', 'q3_5'].forEach(k => { s3Answers[k] = answers[k]; });
      const s3 = await authFetch('/api/triage/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, stage: 3, answers: s3Answers }),
      });

      onComplete?.(s3);
    } catch (err) {
      addToast('Failed to submit voice triage', 'error');
      console.error(err);
    }
    setSubmitting(false);
  };

  const reset = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
    setInterimText('');
    setAnalysis(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Language Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <X size={20} /> {t('cancel')}
        </button>
        <button onClick={() => setShowLangPicker(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: 'var(--radius-pill)', background: 'var(--primary-bg)', color: 'var(--primary)',
            font: 'var(--text-body-sm)', fontWeight: 600,
          }}>
          <Globe size={16} />
          {currentLang.native}
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px',
          background: 'linear-gradient(135deg, var(--primary), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(107,92,231,0.3)',
        }}>
          <Mic size={28} color="white" />
        </div>
        <h2 style={{ font: 'var(--text-h2)', marginBottom: '4px' }}>{t('speakSymptoms')}</h2>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>
          {t('speakDesc')}
        </p>
      </div>

      {/* Voice Recording Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <motion.button
          ref={pulseRef}
          whileTap={{ scale: 0.95 }}
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={status === 'processing' || status === 'result'}
          id="voice-record-btn"
          style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: status === 'listening'
              ? 'linear-gradient(135deg, #FF4757 0%, #FF6B81 100%)'
              : status === 'processing'
                ? 'linear-gradient(135deg, #FFB347 0%, #FF8C42 100%)'
                : 'linear-gradient(135deg, var(--primary) 0%, #8B7EF0 100%)',
            border: 'none', cursor: status === 'processing' || status === 'result' ? 'default' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '6px', color: 'white',
            boxShadow: status === 'listening'
              ? '0 0 0 20px rgba(255,71,87,0.15), 0 0 0 40px rgba(255,71,87,0.08), 0 8px 32px rgba(255,71,87,0.4)'
              : '0 8px 32px rgba(107,92,231,0.3)',
            transition: 'box-shadow 0.3s ease',
          }}>
          {status === 'listening' ? <MicOff size={32} /> : status === 'processing' ? <Activity size={32} className="animate-pulse" /> : <Mic size={32} />}
          <span style={{ fontSize: '11px', fontWeight: 700 }}>
            {status === 'listening' ? t('listening') : status === 'processing' ? t('processing') : t('tapToSpeak')}
          </span>
        </motion.button>
      </div>

      {/* Status Text */}
      {status === 'listening' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                style={{ width: '4px', height: '16px', borderRadius: '2px', background: 'var(--primary)' }} />
            ))}
          </div>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{t('speakNow')}</p>
        </motion.div>
      )}

      {/* Live Transcript */}
      {(transcript || interimText) && status !== 'result' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card" style={{ marginBottom: '16px', background: 'var(--primary-bg)', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ font: 'var(--text-caption)', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
            📝 {t('listening')}
          </div>
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {transcript}
            {interimText && <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}> {interimText}</span>}
          </p>
        </motion.div>
      )}

      {/* Analysis Result */}
      <AnimatePresence>
        {status === 'result' && analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            {/* Transcript */}
            <div className="card" style={{ marginBottom: '12px', background: 'var(--primary-bg)', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ font: 'var(--text-caption)', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
                🗣️ Your words
              </div>
              <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{analysis.rawText}"
              </p>
            </div>

            {/* Severity Card */}
            <div className="card" style={{
              marginBottom: '12px', textAlign: 'center',
              background: sevBg[analysis.severity], border: `2px solid ${sevColors[analysis.severity]}`,
            }}>
              <div style={{ font: 'var(--text-stat)', fontSize: '32px', color: sevColors[analysis.severity], marginBottom: '4px' }}>
                {analysis.score}/10
              </div>
              <span style={{
                display: 'inline-block', padding: '4px 16px', borderRadius: 'var(--radius-pill)',
                background: sevColors[analysis.severity], color: 'white',
                font: 'var(--text-button)', fontSize: '14px',
              }}>
                {analysis.severity}
              </span>
              <div style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Confidence: {Math.round(analysis.confidence * 100)}%
              </div>
            </div>

            {/* Detected Symptoms */}
            {analysis.symptoms.length > 0 ? (
              <div className="card" style={{ marginBottom: '12px' }}>
                <div style={{ font: 'var(--text-body-medium)', marginBottom: '10px' }}>
                  {t('detectedSymptoms')} ({analysis.symptoms.length})
                </div>
                {analysis.symptoms.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: i < analysis.symptoms.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{categoryIcons[s.category] || '🏥'}</span>
                      <div>
                        <div style={{ font: 'var(--text-body-sm)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {s.label.replace(/_/g, ' ')}
                        </div>
                        <div style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{s.category}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {s.critical && <AlertTriangle size={14} color="var(--critical)" />}
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                        background: s.weight >= 7 ? 'var(--critical-bg)' : s.weight >= 5 ? 'var(--urgent-bg)' : 'var(--teal-bg)',
                        color: s.weight >= 7 ? 'var(--critical)' : s.weight >= 5 ? 'var(--urgent)' : 'var(--teal)',
                        font: 'var(--text-caption)', fontWeight: 600,
                      }}>
                        {s.weight}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ marginBottom: '12px', textAlign: 'center', padding: '24px' }}>
                <MicOff size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 8px' }} />
                <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>{t('noSymptoms')}</p>
              </div>
            )}

            {/* Info Row */}
            {(analysis.duration || analysis.painLevel > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: analysis.duration ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '16px' }}>
                {analysis.painLevel > 0 && (
                  <div className="card-flat" style={{ textAlign: 'center' }}>
                    <Activity size={18} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ font: 'var(--text-stat)', fontSize: '20px', color: 'var(--primary)' }}>{analysis.painLevel}/10</div>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{t('painLevel')}</div>
                  </div>
                )}
                {analysis.duration && (
                  <div className="card-flat" style={{ textAlign: 'center' }}>
                    <Clock size={18} color="var(--peach-dark)" style={{ margin: '0 auto 4px' }} />
                    <div style={{ font: 'var(--text-stat)', fontSize: '20px', color: 'var(--peach-dark)', textTransform: 'capitalize' }}>{analysis.duration}</div>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{t('duration')}</div>
                  </div>
                )}
              </div>
            )}

            {/* Critical Alert */}
            {analysis.hasCritical && (
              <div style={{
                background: 'var(--critical-bg)', borderRadius: 'var(--radius-md)', padding: '14px',
                marginBottom: '16px', border: '2px solid var(--critical)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <AlertTriangle size={24} color="var(--critical)" />
                <div>
                  <div style={{ font: 'var(--text-body-medium)', color: 'var(--critical)' }}>🚨 Critical Symptoms Detected</div>
                  <div style={{ font: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    You will be prioritized immediately in the queue.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={reset}
                style={{
                  flex: 1, padding: '14px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-bg)', color: 'var(--primary)',
                  font: 'var(--text-button)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                <RefreshCw size={18} /> {t('tryAgain')}
              </button>
              <button onClick={submitVoiceTriage} disabled={submitting || analysis.symptoms.length === 0}
                id="submit-voice-triage-btn"
                style={{
                  flex: 2, padding: '14px', borderRadius: 'var(--radius-pill)',
                  background: analysis.symptoms.length > 0 ? 'var(--primary)' : 'var(--border)',
                  color: 'white', font: 'var(--text-button)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: analysis.symptoms.length > 0 ? '0 8px 24px rgba(107,92,231,0.3)' : 'none',
                  opacity: submitting ? 0.7 : 1,
                }}>
                <CheckCircle size={18} /> {submitting ? t('processing') : t('submitVoiceTriage')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Picker Modal */}
      <AnimatePresence>
        {showLangPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setShowLangPicker(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ font: 'var(--text-h3)' }}>{t('selectLanguage')}</h3>
                <button onClick={() => setShowLangPicker(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="var(--primary)" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { setSelectedLocale(l.locale); setShowLangPicker(false); }}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                      background: selectedLocale === l.locale ? 'var(--primary-bg)' : 'var(--bg-card)',
                      border: `2px solid ${selectedLocale === l.locale ? 'var(--primary)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{l.flag}</div>
                    <div style={{ font: 'var(--text-body-sm)', fontWeight: 600, color: selectedLocale === l.locale ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {l.native}
                    </div>
                    <div style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{l.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
