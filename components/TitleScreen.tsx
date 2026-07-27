'use client';
import React, { useEffect, useState } from 'react';

interface TitleScreenProps {
  onPlay: (mode: string) => void;
}

interface ScoreEntry {
  name: string;
  score: number;
  level: number;
}

export default function TitleScreen({ onPlay }: TitleScreenProps) {
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tetrisLeaderboard');
    if (saved) {
      try { 
        setLeaderboard(JSON.parse(saved)); 
      } catch (e) { 
        console.error('Failed to load leaderboard'); 
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'white', fontFamily: 'monospace' }}>
      
      <h1 style={{ fontSize: '3rem', color: '#e5729f', textShadow: '0 0 20px rgba(229,114,159,0.8)', margin: '0 0 0.5rem 0', letterSpacing: '0.2em' }}>
        TETRIS
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: leaderboard.length > 0 ? '2rem' : '4rem', letterSpacing: '0.3em', fontSize: '0.875rem' }}>
        ARCADE EDITION
      </p>

      {/* --- NEW: Title Screen Leaderboard Display --- */}
      {leaderboard.length > 0 && (
        <div style={{ marginBottom: '3rem', width: '100%', maxWidth: '280px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1.25rem' }}>
          <h3 style={{ color: '#e5729f', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Top Scores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)', borderBottom: i !== 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: i !== 4 ? '0.25rem' : '0' }}>
                <span style={{ fontWeight: i === 0 ? 'bold' : 'normal', letterSpacing: '0.1em' }}>
                  {i + 1}. {entry.name}
                </span>
                <span style={{ color: i === 0 ? '#e5729f' : 'inherit', textShadow: i === 0 ? '0 0 8px rgba(229,114,159,0.5)' : 'none' }}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => onPlay('standard')}
        style={{ 
          backgroundColor: 'rgba(229,114,159,0.15)', border: '1px solid #e5729f', color: 'white', 
          padding: '16px 48px', fontSize: '1.25rem', cursor: 'pointer', borderRadius: '8px', 
          textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'all 0.2s', 
          boxShadow: '0 0 15px rgba(229,114,159,0.2)' 
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(229,114,159,0.4)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(229,114,159,0.6)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(229,114,159,0.15)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(229,114,159,0.2)';
        }}
      >
        Play
      </button>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', textTransform: 'uppercase' }}>
          Mode: Standard
        </span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', textTransform: 'uppercase' }}>
          More Modes Locked
        </span>
      </div>

    </div>
  );
}