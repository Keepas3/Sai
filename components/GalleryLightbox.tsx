'use client';

// Fullscreen photo viewer for the Gallery's "All Photos" detailed view —
// portal/AnimatePresence structure adapted from TetrisModal.tsx (mounted
// guard, body-scroll lock, Escape-to-close, backdrop fade + spring-scale
// content box), swapped from a game board to an image + caption.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlatPhoto } from './GalleryDriftWall';

interface GalleryLightboxProps {
  photos: FlatPhoto[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function GalleryLightbox({ photos, activeIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const isOpen = activeIndex !== null;
  const photo = activeIndex !== null ? photos[activeIndex] : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex === null || photos.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((activeIndex - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') onNavigate((activeIndex + 1) % photos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, photos.length, onClose, onNavigate]);

  if (!mounted) return null;

  const goPrev = () => {
    if (activeIndex === null) return;
    onNavigate((activeIndex - 1 + photos.length) % photos.length);
  };
  const goNext = () => {
    if (activeIndex === null) return;
    onNavigate((activeIndex + 1) % photos.length);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && photo && (
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
              backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)', cursor: 'pointer'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '1100px', backgroundColor: '#0a0708',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10,
                color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.75rem', lineHeight: 1,
                background: 'rgba(0, 0, 0, 0.5)', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', cursor: 'pointer', padding: 0
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#e5729f')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
            >
              &times;
            </button>

            {photos.length > 1 && (
              <button
                onClick={goPrev}
                style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                  width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5729f')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)')}
                aria-label="Previous photo"
              >
                &#10094;
              </button>
            )}

            {photos.length > 1 && (
              <button
                onClick={goNext}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                  width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5729f')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)')}
                aria-label="Next photo"
              >
                &#10095;
              </button>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2rem', backgroundColor: '#000'
            }}>
              <img
                src={photo.url}
                alt={photo.title}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
              />
            </div>

            <div style={{ padding: '1rem 1.5rem 1.5rem', textAlign: 'center' }}>
              <span style={{
                display: 'inline-block', fontSize: '0.7rem', padding: '0.2rem 0.75rem', marginBottom: '0.5rem',
                background: 'rgba(242, 110, 140, 0.1)', color: '#f26e8c', borderRadius: '999px', fontWeight: 600
              }}>
                {photo.albumTitle}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)', margin: '0.25rem 0 0' }}>
                {photo.title}
              </h3>
              {photo.description && (
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginTop: '0.5rem', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                  {photo.description}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
