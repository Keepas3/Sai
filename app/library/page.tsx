'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

// Generic item format that both media types share for rendering
interface MediaItem {
  title: string;
  creator?: string; // Maps to Developer or Author
  coverImageUrl?: string;
  status: 'playing' | 'completed' | 'backlog' | 'reading'; // handles mixed status types safely
  rating?: string;
  review?: string;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'games' | 'books'>('games');
  const [games, setGames] = useState<MediaItem[]>([]);
  const [books, setBooks] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        // Fetches both collections in a single network round-trip to keep things blazing fast
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
          
          // ─── UPDATED: Matches the new array structure ───
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

  // Reset the read review accordion index expander whenever switching dashboard tabs
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

  // Swap out pointer targets completely depending on which contextual tab view toggle state is active
  const currentItems = activeTab === 'games' ? games : books;

  return (
    <div className="content-wrapper min-h-screen text-white relative">
      <Navbar />

      <main className="page-container px-4 py-12">
        
        {/* --- STRUCTURED RECTANGULAR DASHBOARD TABS --- */}
{/* --- STRUCTURED RECTANGULAR DASHBOARD TABS (INLINE STYLED) --- */}
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            padding: '4px',
            position: 'relative' /* 👈 NEW: Anchors the absolute Tetris button to this box */
          }}>
            
            {/* --- NEW: TETRIS EASTER EGG BUTTON --- */}
           {/* --- REFINED TETRIS EASTER EGG (TINY & BLENDED) --- */}
            <button
            onClick={() => console.log("Tetris route coming soon!")}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 cursor-pointer group transition-all duration-500 outline-none border-none bg-transparent p-0"
            title="Play Tetris (Coming Soon!)"
          >
            <img
              src="/Tetrist.png"
              alt="Tetris Easter Egg"
              // We add !important to the class just in case, but the inline style below is the real fix
              className="opacity-10 group-hover:opacity-60 transition-all duration-500 drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(229,114,159,0.8)]"
              style={{ 
                width: '30px',     // Forces it to be exactly 12px wide
                height: '30px',    // Forces it to be exactly 12px tall
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
      {/* High-Clarity Minimalist Gaming Mouse SVG */}
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
        {/* Main Mouse Body */}
        <rect x="5" y="3" width="14" height="18" rx="7" />
        {/* Clicker Center Split Line */}
        <path d="M12 3v9" />
        {/* Scroll Wheel Node */}
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
                  {/* Visual Cover Art Canvas Frame */}
                  <div className="game-art-wrapper w-full aspect-[3/4]" style={{ position: 'relative' }}>
                    
                    {/* Badge Floating Node */}
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
                  
                  {/* Metadata Text Details Box Area */}
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

                    {/* Dynamic Review Block Wrapper Dropdown Expanders */}
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
  );
}