'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

interface Game {
  title: string;
  developer?: string;
  coverImageUrl?: string;
  status: 'playing' | 'completed' | 'backlog';
  rating?: string;
  review?: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [pageTitle, setPageTitle] = useState("Games");
  const [isLoading, setIsLoading] = useState(true);
  
  // FIXED: Changed from tracking a string ID to tracking the array item number index
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // FIXED: Now queries your master all-in-one parent document layout settings 
        const data = await client.fetch(`
          *[_type == "game" && defined(gamesList)] | order(_updatedAt desc)[0] {
            pageTitle,
            gamesList[] {
              title,
              developer,
              "coverImageUrl": coverImage.asset->url,
              status,
              rating,
              review
            }
          }
        `);
        
        if (data) {
          setPageTitle(data.pageTitle || "Games");
          setGames(data.gamesList || []);
        }
      } catch (err) {
        console.error("Failed fetching games:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const getStatusLabel = (status: string) => {
    if (status === 'playing') return '🎮 Playing';
    if (status === 'completed') return '🏆 Clear';
    return '⏳ Backlog';
  };

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <Navbar />
        <main className="page-container flex items-center justify-center min-h-[50vh]">
          <h2 className="text-white/60 font-mono text-lg">Loading Logs...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="content-wrapper min-h-screen text-white relative">
      <Navbar />

      <main className="page-container px-4 py-12">
        {/* Dynamic header tracking from Sanity */}
        <h1 className="page-title text-center text-4xl font-bold mb-12">{pageTitle}</h1>
        
        {games.length === 0 ? (
          <div className="text-center mt-12">
            <h2 className="text-white/60 text-xl font-serif">No games published yet. Add some in Sanity Studio!</h2>
          </div>
        ) : (
          <div className="games-grid">
            {games.map((game, index) => {
              // FIXED: Evaluates expanded state via array index index checks
              const isExpanded = expandedCardIndex === index;

              return (
                <div 
                  key={index} 
                  onClick={() => setExpandedCardIndex(isExpanded ? null : index)}
                  className={`game-card ${game.status === 'playing' ? 'is-playing' : ''}`}
                  style={{ height: 'auto', transition: 'all 0.3s ease' }}
                >
                  {/* Image Frame */}
                  <div className="game-art-wrapper" style={{ position: 'relative' }}>
                    
                    {/* Clean, Floating, Borderless Status Tag */}
                    <div className="absolute top-3 left-3 z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider
                        ${game.status === 'playing' ? 'text-green-400' : ''}
                        ${game.status === 'completed' ? 'text-yellow-400' : ''}
                        ${game.status === 'backlog' ? 'text-blue-400' : ''}
                      `}>
                        {getStatusLabel(game.status)}
                      </span>
                    </div>

                    {game.coverImageUrl ? (
                      <img src={game.coverImageUrl} alt={game.title} className="game-art" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20 text-xs font-mono uppercase tracking-wider">No Cover</div>
                    )}
                  </div>
                  
                  {/* Bottom Metadata Panel */}
                  <div className="game-info-box">
                    <h3 className="game-title">{game.title}</h3>
                    {game.developer && (
                      <p className="text-xs font-mono text-white/40 mb-1">by {game.developer}</p>
                    )}
                    
                    {/* Show star rating inline underneath title if available */}
                    {game.rating && (
                      <p className="text-xs text-yellow-400/80 my-1">{game.rating}</p>
                    )}

                    {/* Dynamic Review Block: Expands inline when clicked */}
                    {game.review && (
                      <div className="mt-2 transition-all duration-300">
                        <p className={`text-xs text-white/60 leading-relaxed italic px-1 transition-all
                          ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1 truncate'}
                        `}>
                          "{game.review}"
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