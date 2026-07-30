'use client';

import React from 'react';
import { useAudio } from './AudioContext';
import { motion } from 'framer-motion';

export default function NowPlayingWidget() {
  const { isPlaying, togglePlay, track, volume, setVolume } = useAudio();

  if (!track) return null;

  return (
    <motion.div
      drag
      dragMomentum={false} // Stops it from sliding after you let go
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        backgroundColor: 'rgba(10, 7, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        padding: '0.4rem 0.8rem', // ~5% smaller padding
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        fontFamily: 'monospace',
        cursor: 'grab',
      }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          onClick={togglePlay}
          style={{
            backgroundColor: '#e5729f',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '26px', // ~5% smaller button
            height: '26px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        {/* Constrain width to 160px so the ellipsis kicks in automatically */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '160px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Now Playing
          </span>
          <span style={{ 
            fontSize: '11px', 
            color: 'white', 
            fontWeight: 'bold', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',        // Hide what bleeds past 160px
            textOverflow: 'ellipsis',  // Add the "..."
            display: 'block'           // Required for textOverflow to work on a span
          }}>
            {track.title} {track.artist ? `— ${track.artist}` : ''}
          </span>
        </div>
      </div>

      {/* Visual Divider */}
      <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

      {/* Volume Mixer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {/* minWidth prevents the slider from shifting left/right when the number changes */}
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', minWidth: '24px', textAlign: 'right' }}>
          {Math.round(volume * 100)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onPointerDown={(e) => e.stopPropagation()} // Prevents sliding volume from dragging the widget
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{
            width: '50px', // ~5% smaller slider
            height: '4px',
            accentColor: '#e5729f',
            cursor: 'pointer'
          }}
        />
      </div>
    </motion.div>
  );
}