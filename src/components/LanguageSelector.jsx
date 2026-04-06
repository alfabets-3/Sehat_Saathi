import { useState } from 'react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Check } from 'lucide-react';

export default function LanguageSelector({ style = {} }) {
  const { lang, changeLang, t, currentLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
          borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.15)',
          color: 'white', font: 'var(--text-caption)', fontWeight: 600,
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
          ...style,
        }}>
        <Globe size={14} />
        {currentLang.native}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', padding: '20px', maxHeight: '70vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ font: 'var(--text-h3)' }}>{t('selectLanguage')}</h3>
                <button onClick={() => setOpen(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="var(--primary)" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { changeLang(l.code); setOpen(false); }}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                      background: lang === l.code ? 'var(--primary-bg)' : 'var(--bg-card)',
                      border: `2px solid ${lang === l.code ? 'var(--primary)' : 'var(--border)'}`,
                      transition: 'all 0.2s', position: 'relative',
                    }}>
                    {lang === l.code && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="white" />
                      </div>
                    )}
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{l.flag}</div>
                    <div style={{ font: 'var(--text-body-sm)', fontWeight: 600, color: lang === l.code ? 'var(--primary)' : 'var(--text-primary)' }}>
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
    </>
  );
}
