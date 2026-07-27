'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';
import TetrisModal from '@/components/TetrisModal';
import TetrisGame from '@/components/TetrisGame';

interface MediaItem {
  title: string;
  creator?: string; 
  coverImageUrl?: string;
  status: 'playing' | 'completed' | 'backlog' | 'reading';
  rating?: string;
  review?: string;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'games' | 'books'>('games');
  const [games, setGames] = useState<MediaItem[]>([]);
  const [books, setBooks] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTetrisOpen, setIsTetrisOpen] = useState(false);
  
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        const data = await client.fetch(`{
          "gamesData": *[_type == "game" && defined(gamesList)] | order(_updatedAt desc)[0] {
            gamesList[] {
              title,
              "creator": developer,
              "coverImageUrl": coverImage.asset->url,
              status,
              rating,
              review
            }
          },
          "booksData": *[_type == "book" && defined(booksList)] | order(_updatedAt desc)[0] {
            booksList[] {
              title,
              "creator": author,
              "coverImageUrl": coverImage.asset->url,
              status,
              rating,
              review
            }
          }
        }`, {}, { cache: 'no-store' });
          if (data) {
          setGames(data.gamesData?.gamesList || []);
          setBooks(data.booksData?.booksList || []);
        }
      } catch (err) {
        console.error("Failed fetching dynamic library logs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLibraryData();
  }, []);

  const handleTabChange = (tab: 'games' | 'books') => {
    setExpandedCardIndex(null);
    setActiveTab(tab);
  };

  const getStatusLabel = (status: string, type: 'games' | 'books') => {
    if (status === 'playing' || status === 'reading') {
      return type === 'games' ? '🎮 Playing' : '📖 Reading';
    }
    if (status === 'completed') return '🏆 Finished';
    return '⏳ Backlog';
  };

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <Navbar />
        <main className="page-container flex items-center justify-center min-h-[50vh]">
          <h2 className="text-white/60 font-mono text-lg animate-pulse">Loading Logs...</h2>
        </main>
      </div>
    );
  }

  const currentItems = activeTab === 'games' ? games : books;

  return (
    // Note the Fragment <> wrapper here. This allows the modal to escape the content-wrapper!
    <>
      <div className="content-wrapper min-h-screen text-white relative">
        <Navbar />

        <main className="page-container px-4 py-12">
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              padding: '4px',
              position: 'relative'
            }}>
              
              {/* --- TETRIS EASTER EGG BUTTON --- */}
              <button
                type="button"
                onClick={() => {
                  console.log("Tetris triggered!"); // Quick console check to guarantee clicks are registering
                  setIsTetrisOpen(true);
                }}
                /* Pushed slightly further left (-left-12), bumped z-index to 50, and added padding (p-2) for a bigger hitbox */
                className="absolute -left-12 top-1/2 -translate-y-1/2 z-50 cursor-pointer group transition-all duration-500 outline-none border-none bg-transparent p-2"
                title="Play Tetris"
              >
                <img
                  src="/Tetrist.png"
                  alt="Tetris Easter Egg"
                  className="opacity-10 group-hover:opacity-60 transition-all duration-500 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(229,114,159,0.8)]"
                  style={{ 
                    width: '30px',
                    height: '30px',
                    objectFit: 'contain',
                    transform: 'rotate(320deg)' 
                  }}
                />
              </button>
      
              {/* Tab A: Games */}
              <button
                onClick={() => handleTabChange('games')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 24px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  outline: 'none',
                  userSelect: 'none',
                  borderRadius: '6px',
                  border: activeTab === 'games' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                  backgroundColor: activeTab === 'games' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: activeTab === 'games' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    transition: 'color 0.15s ease', 
                    color: activeTab === 'games' ? '#e5729f' : 'rgba(255, 255, 255, 0.3)' 
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <rect x="5" y="3" width="14" height="18" rx="7" />
                  <path d="M12 3v9" />
                  <rect x="11" y="6" width="2" height="3" rx="1" />
                </svg>
                Games
              </button>

              {/* Tab B: Books */}
              <button
                onClick={() => handleTabChange('books')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 24px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  outline: 'none',
                  userSelect: 'none',
                  borderRadius: '6px',
                  border: activeTab === 'books' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                  backgroundColor: activeTab === 'books' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: activeTab === 'books' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg
                  style={{ width: '16px', height: '16px', transition: 'color 0.15s ease', color: activeTab === 'books' ? '#e5729f' : 'rgba(255, 255, 255, 0.3)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Books
              </button>
            </div>
          </div>

          {/* --- ITEMS CONTAINER RENDER GRID LAYOUT --- */}
          {currentItems.length === 0 ? (
            <div className="text-center mt-12 py-12">
              <h2 className="text-white/40 text-lg font-mono italic">
                No entries published under {activeTab} yet.
              </h2>
            </div>
          ) : (
            <div className="games-grid">
              {currentItems.map((item, index) => {
                const isExpanded = expandedCardIndex === index;
                const isCurrentActive = item.status === 'playing' || item.status === 'reading';

                return (
                  <div 
                    key={index} 
                    onClick={() => setExpandedCardIndex(isExpanded ? null : index)}
                    className={`game-card ${isCurrentActive ? 'is-playing' : ''}`}
                    style={{ height: 'auto', transition: 'all 0.3s ease' }}
                  >
                    <div className="game-art-wrapper w-full aspect-[3/4]" style={{ position: 'relative' }}>
                      <div className="absolute top-3 left-3 z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider
                          ${isCurrentActive ? 'text-green-400' : ''}
                          ${item.status === 'completed' ? 'text-yellow-400' : ''}
                          ${item.status === 'backlog' ? 'text-blue-400' : ''}
                        `}>
                          {getStatusLabel(item.status, activeTab)}
                        </span>
                      </div>

                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} 
                        alt={item.title} 
                        className="game-art w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20 text-xs font-mono uppercase tracking-wider">
                          Cover
                        </div>
                      )}
                    </div>
                    
                    <div className="game-info-box">
                      <h3 className="game-title">{item.title}</h3>
                      {item.creator && (
                        <p className="text-xs font-mono text-white/40 mb-1">
                          {activeTab === 'games' ? 'by ' : 'by '} {item.creator}
                        </p>
                      )}
                      
                      {item.rating && (
                        <p className="text-xs text-yellow-400/80 my-1">{item.rating}</p>
                      )}

                      {item.review && (
                        <div className="mt-2 transition-all duration-300">
                          <p className={`text-xs text-white/60 leading-relaxed italic px-1 transition-all
                            ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1 truncate'}
                          `}>
                            "{item.review}"
                          </p>
                          
                          <span className="text-[9px] font-mono text-pink-400/60 uppercase tracking-widest mt-2 block hover:text-pink-400">
                            {isExpanded ? "Close Review ↑" : "Read Review ↗"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* --- MOVED OUTSIDE OF content-wrapper SO IT CAN FULLY OVERLAY THE SCREEN --- */}
      <TetrisModal 
        isOpen={isTetrisOpen} 
        onClose={() => setIsTetrisOpen(false)} 
      />
    </>
  );
}