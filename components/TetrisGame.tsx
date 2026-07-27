'use client';

import React, { useEffect, useRef, useState } from 'react';
import { COLS, ROWS, BLOCK_SIZE, COLORS, PIECES } from './tetrisConstants';

interface TetrisGameProps {
  mode: string;
  onMenu: () => void;
}

interface ScoreEntry {
  name: string;
  score: number;
  level: number;
}

const MAX_LEADERBOARD = 8;

// ==========================================
// 1. PURE ENGINE FUNCTIONS 
// ==========================================

const generateBag = () => {
  const bag = [1, 2, 3, 4, 5, 6, 7];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

const createMatrix = (w: number, h: number) => 
  Array.from({ length: h }, () => Array(w).fill(0));

const collide = (boardMatrix: number[][], playerPiece: { matrix: number[][], pos: { x: number, y: number } }) => {
  const m = playerPiece.matrix;
  const o = playerPiece.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (boardMatrix[y + o.y] && boardMatrix[y + o.y][x + o.x]) !== 0) return true;
    }
  }
  return false;
};

const merge = (boardMatrix: number[][], playerPiece: { matrix: number[][], pos: { x: number, y: number } }) => {
  playerPiece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) boardMatrix[y + playerPiece.pos.y][x + playerPiece.pos.x] = value;
    });
  });
};

const rotate = (matrix: number[][], dir: number) => {
  const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
  if (dir > 0) return rotated.map(row => row.reverse());
  return rotated.reverse();
};

const MiniPiece = ({ type }: { type: number | null }) => {
  if (!type) return null;
  const matrix = PIECES[type];
  return (
    <div style={{ display: 'grid', gap: '1px', gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` }}>
      {matrix.map((row, y) => row.map((val, x) => (
        <div 
          key={`${x}-${y}`} 
          style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: val ? COLORS[val] : 'transparent', boxShadow: val ? `0 0 8px ${COLORS[val]}` : 'none' }}
        />
      )))}
    </div>
  );
};


// ==========================================
// 2. MAIN REACT COMPONENT
// ==========================================

export default function TetrisGame({ mode, onMenu }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const board = useRef<number[][]>(createMatrix(COLS, ROWS));
  const dropCounter = useRef(0);
  const dropInterval = useRef(1000); 
  const lastTime = useRef(0);
  
  const isLockingRef = useRef(false);
  const lockTimerRef = useRef(0);
  
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const lastMoveRef = useRef<'move' | 'rotate' | 'drop' | null>(null);
  const b2bRef = useRef(false);
  const comboRef = useRef(-1);
  const actionTextRef = useRef({ text: '', timer: 0 });

  const nextPiecesRef = useRef<number[]>([...generateBag(), ...generateBag()]);
  const holdPieceRef = useRef<number | null>(null);
  const canHoldRef = useRef(true);

  // --- NEW: Game Flow & Leaderboard State ---
  const [gameState, setGameState] = useState<'PLAYING' | 'NAME_ENTRY' | 'LEADERBOARD'>('PLAYING');
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [nameInput, setNameInput] = useState('');

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [showControls, setShowControls] = useState(false);
  const showControlsRef = useRef(false);
  const [listeningAction, setListeningAction] = useState<string | null>(null);
  const listeningActionRef = useRef<string | null>(null);
  
  const [tuning, setTuning] = useState({ das: 170, arr: 30, dcd: 0, sdf: 30 });
  const tuningRef = useRef(tuning);
  useEffect(() => { tuningRef.current = tuning; }, [tuning]);

  const [controls, setControls] = useState({ 
    'Left': 'ArrowLeft', 'Right': 'ArrowRight', 'Down': 'ArrowDown', 
    'Rotate CW': 'ArrowUp', 'Rotate CCW': 'z', 'Rotate 180': 'a', 
    'Hard Drop': ' ', 'Hold': 'c' 
  });
  const controlsRef = useRef(controls);
  useEffect(() => { controlsRef.current = controls; }, [controls]);

  const keysDown = useRef({ left: false, right: false, down: false });
  const dasTimers = useRef({ das: 0, arr: 0, dcd: 0 });

  const player = useRef({ pos: { x: 0, y: 0 }, matrix: [] as number[][], type: 0 });
  
  const [uiState, setUiState] = useState({ 
    score: 0, lines: 0, level: 1, next: nextPiecesRef.current.slice(0, 5), hold: null as number | null, actionText: '' 
  });

  const syncUi = () => {
    setUiState({ 
      score: scoreRef.current, lines: linesRef.current, level: levelRef.current, 
      next: nextPiecesRef.current.slice(0, 5), hold: holdPieceRef.current, actionText: actionTextRef.current.text 
    });
  };

  // --- NEW: Load Leaderboard on Mount ---
  useEffect(() => {
    const saved = localStorage.getItem('tetrisLeaderboard');
    if (saved) {
      try { setLeaderboard(JSON.parse(saved)); } catch (e) { console.error('Failed to load leaderboard'); }
    }
  }, []);

  const saveHighScore = () => {
    const newEntry: ScoreEntry = { 
      name: nameInput.trim() || 'AAA', 
      score: scoreRef.current, 
      level: levelRef.current 
    };
    
    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD);
      
    setLeaderboard(newLeaderboard);
    localStorage.setItem('tetrisLeaderboard', JSON.stringify(newLeaderboard));
    setGameState('LEADERBOARD');
  };

  const isTSpin = () => {
    if (player.current.type !== 3) return false;
    if (lastMoveRef.current !== 'rotate') return false;

    let corners = 0;
    const { x, y } = player.current.pos;
    const checkCorner = (cx: number, cy: number) => {
      if (cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && board.current[cy][cx] !== 0)) corners++;
    };
    checkCorner(x, y); checkCorner(x + 2, y); checkCorner(x, y + 2); checkCorner(x + 2, y + 2);
    return corners >= 3;
  };

  const playerReset = () => {
    player.current.type = nextPiecesRef.current.shift()!;
    if (nextPiecesRef.current.length <= 5) nextPiecesRef.current.push(...generateBag());
    
    player.current.matrix = PIECES[player.current.type];
    player.current.pos.y = 0;
    player.current.pos.x = Math.floor(COLS / 2) - Math.floor(player.current.matrix[0].length / 2);
    
    canHoldRef.current = true;
    isLockingRef.current = false;
    lockTimerRef.current = 0;
    lastMoveRef.current = null;
    
    if (keysDown.current.left || keysDown.current.right) dasTimers.current.dcd = tuningRef.current.dcd;
    syncUi();

    if (collide(board.current, player.current)) {
      // --- NEW: Game Over Check & Transition ---
      const isHighScore = leaderboard.length < MAX_LEADERBOARD || scoreRef.current > (leaderboard[leaderboard.length - 1]?.score || 0);
      
      if (isHighScore && scoreRef.current > 0) {
        setGameState('NAME_ENTRY');
      } else {
        setGameState('LEADERBOARD');
      }
    }
  };

  // --- NEW: Restart logic isolated so it doesn't trigger instant game overs ---
  const restartGame = () => {
    board.current = createMatrix(COLS, ROWS);
    scoreRef.current = 0; linesRef.current = 0; levelRef.current = 1; holdPieceRef.current = null; dropInterval.current = 1000;
    comboRef.current = -1; b2bRef.current = false; actionTextRef.current = {text: '', timer: 0};
    nextPiecesRef.current = [...generateBag(), ...generateBag()];
    
    player.current.type = nextPiecesRef.current.shift()!;
    player.current.matrix = PIECES[player.current.type];
    player.current.pos.y = 0;
    player.current.pos.x = Math.floor(COLS / 2) - Math.floor(player.current.matrix[0].length / 2);
    
    setNameInput('');
    setGameState('PLAYING');
    syncUi();
  };

  const lockPiece = () => {
    merge(board.current, player.current); 
    const tSpin = isTSpin();
    
    let linesCleared = 0;
    outer: for (let y = board.current.length - 1; y >= 0; --y) {
      for (let x = 0; x < board.current[y].length; ++x) {
        if (board.current[y][x] === 0) continue outer;
      }
      const row = board.current.splice(y, 1)[0].fill(0);
      board.current.unshift(row);
      ++y; linesCleared++;
    }

    if (linesCleared > 0) {
      comboRef.current++;
      let baseScore = 0;
      let isDifficult = false;
      let actionStr = '';

      if (tSpin) {
        isDifficult = true;
        if (linesCleared === 1) { baseScore = 800; actionStr = 'T-Spin Single'; }
        else if (linesCleared === 2) { baseScore = 1200; actionStr = 'T-Spin Double'; }
        else if (linesCleared === 3) { baseScore = 1600; actionStr = 'T-Spin Triple'; }
      } else {
        if (linesCleared === 1) { baseScore = 100; }
        else if (linesCleared === 2) { baseScore = 300; }
        else if (linesCleared === 3) { baseScore = 500; }
        else if (linesCleared === 4) { baseScore = 800; actionStr = 'Tetris'; isDifficult = true; }
      }

      let calculatedScore = baseScore * levelRef.current;
      
      if (isDifficult) {
        if (b2bRef.current) {
          calculatedScore = Math.floor(calculatedScore * 1.5);
          actionStr = 'B2B ' + actionStr;
        }
        b2bRef.current = true;
      } else {
        b2bRef.current = false;
      }

      if (comboRef.current > 0) {
        calculatedScore += 50 * comboRef.current * levelRef.current;
        actionStr += `\n${comboRef.current} Combo`;
      }

      scoreRef.current += calculatedScore;
      linesRef.current += linesCleared;
      levelRef.current = Math.floor(linesRef.current / 10) + 1; 
      dropInterval.current = Math.max(100, 1000 - (levelRef.current - 1) * 100); 
      
      if (actionStr) actionTextRef.current = { text: actionStr, timer: 2000 };
    } else {
      comboRef.current = -1;
      if (tSpin) {
        scoreRef.current += 400 * levelRef.current;
        actionTextRef.current = { text: 'T-SPIN', timer: 1500 };
      }
    }

    playerReset(); 
    dropCounter.current = 0;
  };

  const getGhostY = () => {
    let ghostY = player.current.pos.y;
    while (!collide(board.current, { matrix: player.current.matrix, pos: { x: player.current.pos.x, y: ghostY } })) {
      ghostY++;
    }
    return ghostY - 1;
  };

  const playerDrop = (drops = 1, isSoftDrop = false) => {
    let droppedThisFrame = 0;
    for (let i = 0; i < drops; i++) {
      player.current.pos.y++;
      if (collide(board.current, player.current)) {
        player.current.pos.y--; 
        dropCounter.current = 0; 
        break;
      }
      droppedThisFrame++;
    }
    if (isSoftDrop && droppedThisFrame > 0) {
      scoreRef.current += droppedThisFrame; 
      syncUi();
    }
  };

  const hardDrop = () => {
    const dist = getGhostY() - player.current.pos.y;
    scoreRef.current += dist * 2; 
    player.current.pos.y += dist; 
    lastMoveRef.current = 'drop';
    lockPiece(); 
  };

  const playerMove = (offset: number) => {
    player.current.pos.x += offset;
    if (collide(board.current, player.current)) {
      player.current.pos.x -= offset;
      return false; 
    } else {
      lastMoveRef.current = 'move';
      if (isLockingRef.current) lockTimerRef.current = 0;
      return true; 
    }
  };

  const playerRotate = (dir: number) => {
    const pos = player.current.pos.x;
    let offset = 1;
    
    if (dir === 2) player.current.matrix = rotate(rotate(player.current.matrix, 1), 1);
    else player.current.matrix = rotate(player.current.matrix, dir);
    
    while (collide(board.current, player.current)) {
      player.current.pos.x += offset; 
      offset = -(offset + (offset > 0 ? 1 : -1));
      
      if (offset > player.current.matrix[0].length) {
        if (dir === 2) player.current.matrix = rotate(rotate(player.current.matrix, -1), -1);
        else player.current.matrix = rotate(player.current.matrix, -dir); 
        
        player.current.pos.x = pos; 
        return;
      }
    }
    lastMoveRef.current = 'rotate';
    if (isLockingRef.current) lockTimerRef.current = 0;
  };

  const holdPiece = () => {
    if (!canHoldRef.current) return;
    if (holdPieceRef.current === null) {
      holdPieceRef.current = player.current.type; playerReset();
    } else {
      const temp = player.current.type; player.current.type = holdPieceRef.current; player.current.matrix = PIECES[player.current.type];
      holdPieceRef.current = temp; player.current.pos.y = 0; player.current.pos.x = Math.floor(COLS / 2) - Math.floor(player.current.matrix[0].length / 2);
      canHoldRef.current = false; 
      isLockingRef.current = false;
      lockTimerRef.current = 0;
      lastMoveRef.current = null;
      if (keysDown.current.left || keysDown.current.right) dasTimers.current.dcd = tuningRef.current.dcd;
      syncUi();
    }
  };

  const drawMatrix = (ctx: CanvasRenderingContext2D, matrix: number[][], offset: { x: number, y: number }, isGhost = false) => {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const color = COLORS[value] as string;
          if (isGhost) {
            ctx.fillStyle = color; ctx.globalAlpha = 0.2; ctx.shadowBlur = 0;
            ctx.fillRect((x + offset.x) * BLOCK_SIZE + 1, (y + offset.y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1;
            ctx.strokeRect((x + offset.x) * BLOCK_SIZE + 1, (y + offset.y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.globalAlpha = 1.0; 
          } else {
            ctx.fillStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color;
            ctx.fillRect((x + offset.x) * BLOCK_SIZE + 1, (y + offset.y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
      });
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    drawMatrix(ctx, board.current, { x: 0, y: 0 }); 
    const ghostY = getGhostY();
    drawMatrix(ctx, player.current.matrix, { x: player.current.pos.x, y: ghostY }, true);
    drawMatrix(ctx, player.current.matrix, player.current.pos); 
  };

  const update = (time = 0) => {
    if (lastTime.current === 0) {
      lastTime.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = time - lastTime.current;
    lastTime.current = time;

    // Only progress logic if actually playing
    if (gameStateRef.current === 'PLAYING') {
      
      if (actionTextRef.current.timer > 0) {
        actionTextRef.current.timer -= deltaTime;
        if (actionTextRef.current.timer <= 0) {
          actionTextRef.current.text = '';
          syncUi();
        }
      }

      if (!isPausedRef.current && !showControlsRef.current) {
        if (keysDown.current.left || keysDown.current.right) {
          if (dasTimers.current.dcd > 0) {
            dasTimers.current.dcd -= deltaTime;
          } else {
            dasTimers.current.das += deltaTime;
            if (dasTimers.current.das >= tuningRef.current.das) {
              dasTimers.current.arr += deltaTime;
              const currentArr = tuningRef.current.arr;
              if (currentArr === 0) {
                let moved = true;
                while(moved) moved = playerMove(keysDown.current.left ? -1 : 1);
              } else {
                while (dasTimers.current.arr >= currentArr) {
                  playerMove(keysDown.current.left ? -1 : 1);
                  dasTimers.current.arr -= currentArr;
                }
              }
            }
          }
        } else {
          dasTimers.current.das = 0;
          dasTimers.current.arr = 0;
          dasTimers.current.dcd = 0;
        }

        if (keysDown.current.down) {
           if (tuningRef.current.sdf >= 41) {
              const dist = getGhostY() - player.current.pos.y;
              if (dist > 0) {
                scoreRef.current += dist; 
                player.current.pos.y += dist; 
                lastMoveRef.current = 'drop';
                syncUi(); 
              }
           } else {
              dropCounter.current += deltaTime * tuningRef.current.sdf; 
              lastMoveRef.current = 'drop';
           }
        } else {
           dropCounter.current += deltaTime;
        }

        player.current.pos.y++;
        const isSupported = collide(board.current, player.current);
        player.current.pos.y--;

        if (isSupported) {
          isLockingRef.current = true;
          lockTimerRef.current += deltaTime;
          const currentLockDelay = Math.max(150, 500 - (levelRef.current - 1) * 25);
          if (lockTimerRef.current >= currentLockDelay) lockPiece();
        } else {
          isLockingRef.current = false;
          lockTimerRef.current = 0;
          
          if (dropCounter.current > dropInterval.current) {
            const drops = Math.floor(dropCounter.current / dropInterval.current);
            const isSoftDrop = keysDown.current.down && tuningRef.current.sdf < 41;
            playerDrop(drops, isSoftDrop);
            
            if (dropCounter.current > 0) {
               dropCounter.current %= dropInterval.current; 
            }
          }
        }
      }
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas);
    }
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    playerReset();
    requestRef.current = requestAnimationFrame(update);

    const handleKeyDown = (e: KeyboardEvent) => {
      // --- Prevent Game Keys from firing if typing a name or viewing Leaderboard ---
      if (gameStateRef.current !== 'PLAYING') return;

      if (listeningActionRef.current) {
        e.preventDefault();
        setControls(prev => ({ ...prev, [listeningActionRef.current!]: e.key }));
        listeningActionRef.current = null;
        setListeningAction(null);
        return;
      }
      
      const c = controlsRef.current;
      const mappedKeys = Object.values(c);
      
      if (mappedKeys.includes(e.key) || e.key === 'p' || e.key === 'Escape') {
        e.preventDefault(); 
      }
      
      if (e.key === 'p' || e.key === 'Escape') {
        const willShow = !showControlsRef.current;
        showControlsRef.current = willShow;
        setShowControls(willShow); 
        isPausedRef.current = willShow; 
        setIsPaused(willShow); 
        return;
      }

      if (isPausedRef.current || showControlsRef.current) return;
      if (e.repeat) return; 

      if (e.key === c['Left']) {
        keysDown.current.left = true;
        dasTimers.current.das = 0;
        dasTimers.current.arr = 0;
        dasTimers.current.dcd = 0; 
        playerMove(-1); 
      } 
      else if (e.key === c['Right']) {
        keysDown.current.right = true;
        dasTimers.current.das = 0;
        dasTimers.current.arr = 0;
        dasTimers.current.dcd = 0; 
        playerMove(1); 
      }
      else if (e.key === c['Down']) keysDown.current.down = true;
      else if (e.key === c['Rotate CW']) playerRotate(1);
      else if (e.key === c['Rotate CCW']) playerRotate(-1);
      else if (e.key === c['Rotate 180']) playerRotate(2);
      else if (e.key === c['Hard Drop']) hardDrop();
      else if (e.key === c['Hold']) holdPiece();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const c = controlsRef.current;
      if (e.key === c['Left']) keysDown.current.left = false;
      if (e.key === c['Right']) keysDown.current.right = false;
      if (e.key === c['Down']) keysDown.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, []); 

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '3rem', alignItems: 'flex-start', justifyContent: 'center', fontFamily: 'monospace', userSelect: 'none', width: '100%', maxWidth: '48rem' }}>
      
      {/* Left Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '7rem', paddingTop: '1rem', justifyContent: 'space-between', height: '600px' }}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 'bold', margin: 0 }}>HOLD</p>
            <div style={{ width: '7rem', height: '6rem', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}>
               <MiniPiece type={uiState.hold} />
            </div>
          </div>
          
          {gameState === 'PLAYING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => { 
                  const willShow = !showControlsRef.current;
                  showControlsRef.current = willShow;
                  setShowControls(willShow); 
                  isPausedRef.current = willShow; 
                  setIsPaused(willShow); 
                }} 
                style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                {showControls ? 'Resume' : 'Settings'}
              </button>
            </div>
          )}
        </div>

        <button onClick={onMenu} style={{ padding: '8px', backgroundColor: 'rgba(229,114,159,0.1)', color: '#e5729f', border: '1px solid rgba(229,114,159,0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Quit
        </button>
      </div>

      {/* Center Panel */}
      <div style={{ position: 'relative', border: '2px solid rgba(255,255,255,0.1)', backgroundColor: 'black', borderRadius: '0.5rem', boxShadow: '0 0 30px rgba(0,0,0,0.5)', overflow: 'hidden', flexShrink: 0 }}>
        <canvas ref={canvasRef} width={300} height={600} style={{ display: 'block' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />

        {/* HIGH SCORE ENTRY OVERLAY */}
        {gameState === 'NAME_ENTRY' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: '2rem' }}>
             <h3 style={{ color: '#e5729f', letterSpacing: '0.1em', marginBottom: '1rem', marginTop: 0, fontSize: '1.25rem', textAlign: 'center' }}>NEW HIGH SCORE!</h3>
             <p style={{ color: 'white', marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.5)', margin: '0 0 2rem 0' }}>{uiState.score}</p>
             
             <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Enter Initials</p>
             <input 
               autoFocus
               maxLength={3}
               value={nameInput}
               onChange={(e) => setNameInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
               onKeyDown={(e) => { if (e.key === 'Enter') saveHighScore(); }}
               style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid #e5729f', color: 'white', fontSize: '2.5rem', width: '6rem', textAlign: 'center', textTransform: 'uppercase', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.2em', padding: '0 0 0.5rem 0' }}
             />
             <button onClick={saveHighScore} style={{ marginTop: '2.5rem', backgroundColor: '#e5729f', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 32px', cursor: 'pointer', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '0.1em', fontWeight: 'bold' }}>
               Save
             </button>
          </div>
        )}

        {/* LEADERBOARD OVERLAY */}
        {gameState === 'LEADERBOARD' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30, padding: '2rem 1.5rem' }}>
            <h3 style={{ color: 'white', letterSpacing: '0.2em', marginBottom: '1.5rem', marginTop: 0, fontSize: '1.25rem', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>LEADERBOARD</h3>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {leaderboard.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '2rem' }}>NO SCORES YET</p>
              )}
              {leaderboard.map((entry, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: i === 0 ? 'rgba(229,114,159,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: i === 0 ? '#e5729f' : 'rgba(255,255,255,0.5)', fontSize: '12px', width: '1.5rem' }}>#{i + 1}</span>
                      <span style={{ color: i === 0 ? 'white' : 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em' }}>{entry.name}</span>
                    </div>
                    <span style={{ color: i === 0 ? '#e5729f' : 'white', fontSize: '14px', fontFamily: 'monospace', textShadow: i === 0 ? '0 0 8px rgba(229,114,159,0.5)' : 'none' }}>
                      {entry.score}
                    </span>
                 </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
               <button onClick={restartGame} style={{ backgroundColor: '#e5729f', color: 'white', border: 'none', borderRadius: '4px', padding: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                 Play Again
               </button>
               <button onClick={onMenu} style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: '4px', padding: '10px', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                 Main Menu
               </button>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {isPaused && !showControls && gameState === 'PLAYING' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <h3 style={{ color: 'white', letterSpacing: '0.3em', margin: 0, textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>PAUSED</h3>
          </div>
        )}

        {/* SETTINGS OVERLAY */}
        {showControls && gameState === 'PLAYING' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 20, padding: '2rem 1.5rem', overflowY: 'auto' }}>
            
            <h3 style={{ color: 'white', letterSpacing: '0.2em', marginBottom: '1.2rem', marginTop: 0, fontSize: '1.1rem' }}>SETTINGS</h3>
            
            <p style={{ color: '#e5729f', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.75rem 0', alignSelf: 'flex-start' }}>Keybinds</p>
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
              {Object.entries(controls).map(([action, keyName]) => (
                <div key={action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', textTransform: 'uppercase', textAlign: 'center' }}>
                    {action}
                  </span>
                  <button
                    onClick={() => {
                      setListeningAction(action);
                      listeningActionRef.current = action;
                    }}
                    style={{ backgroundColor: listeningAction === action ? '#e5729f' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '10px', cursor: 'pointer', width: '100%', maxWidth: '90px', textAlign: 'center', height: '26px' }}
                  >
                    {listeningAction === action ? '...' : (keyName === ' ' ? 'Space' : keyName.replace('Arrow', ''))}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <p style={{ color: '#e5729f', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Handling</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>DAS (Delay)</span>
                  <span style={{ color: 'white', fontSize: '10px' }}>{tuning.das}ms</span>
                </div>
                <input type="range" min="50" max="300" step="10" value={tuning.das} onChange={(e) => setTuning(p => ({...p, das: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#e5729f', height: '4px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>ARR (Speed)</span>
                  <span style={{ color: 'white', fontSize: '10px' }}>{tuning.arr}ms</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={tuning.arr} onChange={(e) => setTuning(p => ({...p, arr: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#e5729f', height: '4px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>DCD (DAS Cut)</span>
                  <span style={{ color: 'white', fontSize: '10px' }}>{tuning.dcd}ms</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={tuning.dcd} onChange={(e) => setTuning(p => ({...p, dcd: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#e5729f', height: '4px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>SDF (Soft Drop)</span>
                  <span style={{ color: 'white', fontSize: '10px' }}>{tuning.sdf >= 41 ? 'MAX' : `${tuning.sdf}x`}</span>
                </div>
                <input type="range" min="2" max="41" step="1" value={tuning.sdf} onChange={(e) => setTuning(p => ({...p, sdf: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#e5729f', height: '4px' }} />
              </div>
            </div>

            <button 
              onClick={() => {
                showControlsRef.current = false;
                setShowControls(false);
                isPausedRef.current = false;
                setIsPaused(false);
              }} 
              style={{ marginTop: '1.5rem', backgroundColor: '#e5729f', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 24px', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '7rem', paddingTop: '1rem', height: '600px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 'bold', margin: 0 }}>NEXT</p>
          <div style={{ width: '7rem', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', gap: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)', margin: '0 auto' }}>
             {uiState.next.map((type, idx) => <MiniPiece key={idx} type={type} />)}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', paddingRight: '0.5rem', textAlign: 'right', flex: 1 }}>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', margin: 0 }}>Score</p>
            <p style={{ fontSize: '1.25rem', color: '#e5729f', fontWeight: 'bold', textShadow: '0 0 8px rgba(229,114,159,0.5)', margin: 0 }}>{uiState.score}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', margin: 0 }}>Level</p>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', margin: 0 }}>{uiState.level}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', margin: 0 }}>Lines</p>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', margin: 0 }}>{uiState.lines}</p>
          </div>
          
          <div style={{ marginTop: 'auto', minHeight: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {uiState.actionText && (
               <p style={{ color: '#e5729f', fontSize: '11px', fontWeight: 'bold', textShadow: '0 0 8px rgba(229,114,159,0.8)', margin: 0, lineHeight: 1.4, textTransform: 'uppercase' }}>
                 {uiState.actionText.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
               </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}