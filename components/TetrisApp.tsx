'use client';

import React, { useState } from 'react';
import TitleScreen from './TitleScreen';
import TetrisGame from './TetrisGame';

export default function TetrisApp() {
  const [view, setView] = useState<'TITLE' | 'PLAYING'>('TITLE');
  const [gameMode, setGameMode] = useState('standard');

  const handlePlay = (mode: string) => {
    setGameMode(mode);
    setView('PLAYING');
  };

  const handleMenu = () => {
    setView('TITLE');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {view === 'TITLE' && <TitleScreen onPlay={handlePlay} />}
      
      {/* We pass the gameMode down, and give it a way to return to the menu! */}
      {view === 'PLAYING' && <TetrisGame mode={gameMode} onMenu={handleMenu} />}
    </div>
  );
}