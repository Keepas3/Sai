'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../app/utils/supabaseClient'; // Adjust path if needed
import { useBackgroundTheme } from './UseBackgroundTheme'; // Adjust path if needed
import ControlsSettings from './ControlsSettings';
interface TitleScreenProps {
  onPlay: (mode: string) => void;
}

interface ScoreEntry {
  name: string;
  score: number;
  level: number;
  mode: string;
}

export const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

export default function TitleScreen({ onPlay }: TitleScreenProps) {
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [allTimeBest, setAllTimeBest] = useState<ScoreEntry | null>(null);
  // Zen/sandbox mode doesn't score or compete, so it has no leaderboard tab —
  // only the two competitive modes are selectable here.
  const [viewMode, setViewMode] = useState<'sprint' | 'blitz'>('sprint');
  const {
    themeId: backgroundThemeId,
    themes: backgroundThemes,
    setThemeId: setBackgroundThemeId,
    isLoading: isLoadingThemes,
  } = useBackgroundTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelectTheme = (id: string) => {
    setBackgroundThemeId(id);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const ascending = viewMode === 'sprint';

      // The all-time best score for this mode — pinned at the top no
      // matter what month it happened in.
      const { data: bestData, error: bestError } = await supabase
        .from('tetris_scores')
        .select('name, score, level, mode')
        .eq('mode', viewMode)
        .order('score', { ascending })
        .limit(1);

      const best = !bestError && bestData && bestData.length > 0 ? bestData[0] : null;
      setAllTimeBest(best);

      // This month's top 10 — resets automatically as soon as the
      // calendar rolls into a new month (anchored to UTC so the reset
      // happens at the same instant for everyone, not each viewer's
      // local midnight).
      const now = new Date();
      const startOfMonthUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      ).toISOString();

      const { data, error } = await supabase
        .from('tetris_scores')
        .select('name, score, level, mode')
        .eq('mode', viewMode)
        .gte('created_at', startOfMonthUTC)
        .order('score', { ascending })
        .limit(10); // limit of scores shown

      if (!error && data) {
        // Avoid showing the pinned all-time best a second time if it
        // also happened to be set this month.
        const withoutDuplicate = best
          ? data.filter((entry) => !(entry.name === best.name && entry.score === best.score))
          : data;
        setLeaderboard(withoutDuplicate);
      }
    };
    fetchLeaderboard();
  }, [viewMode]);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 0,
        width: '100%',
        height: '100%',
        color: 'white',
        fontFamily: 'monospace',
        overflow: 'hidden',
      }}
    >
      {/* Dims whatever background image/theme is behind this, so text and
          boxes stay readable no matter how bright or busy the photo is. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(4,4,7,0.62) 0%, rgba(4,4,7,0.34) 42%, rgba(4,4,7,0.68) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
      {/* Settings button */}
      <button
        onClick={() => setIsSettingsOpen((open) => !open)}
        aria-label="Background settings"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          color: isSettingsOpen ? '#e5729f' : 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontSize: '1.35rem',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          padding: 0,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          transition: 'color 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = '#e5729f'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = isSettingsOpen ? '#e5729f' : 'rgba(255,255,255,0.75)'; }}
      >
        ⚙
      </button>


      

      {isSettingsOpen && (
        <>
          {/* Click-away layer */}
          <div
            onClick={() => setIsSettingsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 15 }}
          />

          <div
            style={{
              position: 'absolute',
              top: '3.5rem',
              right: '1rem',
              backgroundColor: 'rgba(10,10,15,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              minWidth: '150px',
              zIndex: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                margin: '0 0 0.25rem 0',
              }}
            >
              Background
            </p>
            {backgroundThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: theme.id === backgroundThemeId ? 'rgba(229,114,159,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.35rem 0.4rem',
                  cursor: 'pointer',
                  color: theme.id === backgroundThemeId ? '#e5729f' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: theme.swatchColor,
                    border: '1px solid rgba(255,255,255,0.25)',
                    flexShrink: 0,
                  }}
                />
                {theme.label}
              </button>
            ))}
            {isLoadingThemes && (
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: '0.25rem 0 0 0' }}>
                Loading more…
              </p>
            )}
          </div>
        </>
      )}


      <h1 style={{ fontSize: '3rem', color: '#e5729f', textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 20px rgba(229,114,159,0.8)', margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>
        Raining Blocks
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.85)', marginBottom: '2rem', letterSpacing: '0.3em', fontSize: '0.875rem' }}>
        
      </p>

      {/* Leaderboard Section */}
      <div style={{ marginBottom: '3rem', width: '100%', maxWidth: '340px', backgroundColor: 'rgba(5,5,8,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 10px 35px rgba(0,0,0,0.45)' }}>
        
        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewMode('sprint')}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: viewMode === 'sprint' ? '#e5729f' : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: viewMode === 'sprint' ? 'bold' : 'normal', transition: 'color 0.2s' }}
          >
            40 Lines
          </button>
          <button 
            onClick={() => setViewMode('blitz')}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: viewMode === 'blitz' ? '#e5729f' : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: viewMode === 'blitz' ? 'bold' : 'normal', transition: 'color 0.2s' }}
          >
            Blitz (3 min)
          </button>
        </div>

        {/* All-time best, pinned above the monthly list */}
        {allTimeBest && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: '0.875rem',
              color: '#ffd76a',
              paddingBottom: '0.5rem',
              marginBottom: '0.75rem',
              borderBottom: '1px solid rgba(255,215,106,0.25)',
            }}
          >
            <span style={{ fontWeight: 'bold', letterSpacing: '0.08em' }}>
              ★ All-Time · {allTimeBest.name}
            </span>
            <span style={{ textShadow: '0 0 8px rgba(255,215,106,0.6)', fontWeight: 'bold' }}>
              {viewMode === 'sprint' ? formatTime(allTimeBest.score) : allTimeBest.score}
            </span>
          </div>
        )}

        <p
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: '0 0 0.5rem 0',
          }}
        >
          This Month
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '120px' }}>
          {leaderboard.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', textAlign: 'center', marginTop: '1.5rem' }}>NO SCORES YET</p>
          ) : (
            leaderboard.map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: i === 0 ? 'white' : 'rgba(255,255,255,0.7)', borderBottom: i !== leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: i !== leaderboard.length - 1 ? '0.25rem' : '0' }}>
                <span style={{ fontWeight: i === 0 ? 'bold' : 'normal', letterSpacing: '0.1em' }}>
                  {i + 1}. {entry.name}
                </span>
                <span style={{ color: i === 0 ? '#e5729f' : 'inherit', textShadow: i === 0 ? '0 0 8px rgba(229,114,159,0.5)' : 'none' }}>
                  {viewMode === 'sprint' ? formatTime(entry.score) : entry.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Play Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => onPlay('standard')}
          style={{
            backgroundColor: 'rgba(10,10,14,0.55)', border: '1px solid #e5729f', color: 'white',
            padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '8px',
            textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'all 0.2s',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 25px rgba(229,114,159,0.6)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10,10,14,0.55)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'; }}
        >
          Zen Mode
        </button>

        <button
          onClick={() => onPlay('sprint')}
          style={{
            backgroundColor: 'rgba(10,10,14,0.55)', border: '1px solid #e5729f', color: 'white',
            padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '8px',
            textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'all 0.2s',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(229,114,159,0.5)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 25px rgba(229,114,159,0.6)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10,10,14,0.55)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'; }}
        >
          40 Lines
        </button>

        <button
          onClick={() => onPlay('blitz')}
          style={{
            backgroundColor: 'rgba(10,10,14,0.55)', border: '1px solid #e5729f', color: 'white',
            padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '8px',
            textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'all 0.2s',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(229,114,159,0.5)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 25px rgba(229,114,159,0.6)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10,10,14,0.55)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'; }}
        >
          Blitz (3 min)
        </button>
      </div>

      <button
        onClick={() => onPlay('versus-lobby')}
        style={{
          marginTop: '1rem',
          backgroundColor: 'rgba(10,10,14,0.55)', border: '1px solid #e5729f', color: 'white',
          padding: '10px 24px', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '8px',
          textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'all 0.2s',
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)',
        }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 25px rgba(229,114,159,0.6)'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(10,10,14,0.55)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4), 0 0 15px rgba(229,114,159,0.25)'; }}
      >
        Online Play
      </button>

      

    </div>
    </div>
  );
}