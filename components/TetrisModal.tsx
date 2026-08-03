'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TetrisApp from './TetrisApp'; // <-- Updated Import
import { useBackgroundTheme } from './UseBackgroundTheme'; // Adjust path if needed

interface TetrisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TetrisModal({ isOpen, onClose }: TetrisModalProps) {
  const [mounted, setMounted] = useState(false);
  const { theme: backgroundTheme } = useBackgroundTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  // "Classic" keeps the modal's original hand-tuned gradient; every other
  // theme applies the same background used on the title screen so both
  // stay in sync when changed from the settings panel.
  const isClassicTheme = backgroundTheme.id === 'default';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            zIndex: 999999, fontFamily: 'var(--font-comfortaa), -apple-system, sans-serif', color: 'white'
          }}
        >
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', cursor: 'pointer'
            }}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '850px', backgroundColor: '#0a0708',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(9, 9, 11, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e5729f', boxShadow: '0 0 8px #e5729f' }} />
                <h2 style={{ fontFamily: 'monospace', fontSize: '0.875rem', letterSpacing: '0.2em', color: 'rgba(255, 255, 255, 0.9)', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>
                  Raining Blocks
                </h2>
              </div>
              
              <button 
                onClick={onClose}
                style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1.5rem', lineHeight: 1, background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 50, padding: 0 }}
                onMouseOver={(e) => e.currentTarget.style.color = '#e5729f'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
              >
                &times;
              </button>
            </div>

            <div style={{
              position: 'relative',
              flex: 1, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', minHeight: '650px',
              maxHeight: '90vh', overflowY: 'auto',
              backgroundImage: isClassicTheme ? 'linear-gradient(to bottom, #121214, #0a0708)' : backgroundTheme.backgroundImage,
              backgroundColor: isClassicTheme ? undefined : backgroundTheme.backgroundColor,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transition: 'background-image 0.4s ease, background-color 0.4s ease',
            }}>
              
              {/* WE RENDER THE MANAGER APP INSTEAD OF JUST THE GAME DIRECTLY */}
              <TetrisApp />
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}