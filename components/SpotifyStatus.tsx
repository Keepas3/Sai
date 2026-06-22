'use client';

import { useEffect, useState } from 'react';

interface SpotifyTrack {
  songUrl?: string;
  recentSongUrl?: string;
  statusType?: 'playing' | 'recent' | 'recommendation';
}

export default function SpotifyStatus() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/spotify');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      
      console.log('=== FRONTEND RECEIVED SPOTIFY DATA ===');
      console.log('Full JSON Payload:', data);
      
      setTrack(data);
    } catch (err) {
      console.error('Bypassing to native player fallback:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-xs font-mono text-white/20 animate-pulse">Syncing player state...</div>;
  }

  const isNowPlaying = track?.statusType === 'playing';
  
  // Parse IDs safely
  const currentTrackId = isNowPlaying ? track?.songUrl?.split('/track/')?.[1]?.split('?')?.[0] : null;
  const secondaryUrl = isNowPlaying ? track?.recentSongUrl : track?.songUrl;
  const historyTrackId = secondaryUrl?.split('/track/')?.[1]?.split('?')?.[0] || '06DHZv4ahSwp30plm1kbgM';

  console.log('=== FRONTEND IFRAME RENDERING STATE ===');
  console.log('isNowPlaying Status:', isNowPlaying);
  console.log('Parsed Now Playing Track ID:', currentTrackId);
  console.log('Parsed History Track ID:', historyTrackId);

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      
      {/* 1. TOP CARD: Live Feed */}
      {currentTrackId && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#1DB954] pl-1">
            • Now Playing
          </span>
          <div className="w-full rounded-xl overflow-hidden h-[152px]">
            <iframe
              src={`https://open.spotify.com/embed/track/${currentTrackId}?utm_source=generator`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0 bg-transparent"
              title="Spotify Live Feed"
            />
          </div>
        </div>
      )}

      {/* 2. BOTTOM CARD: Dynamic History Layout */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-1">
          {currentTrackId ? 'Recently Played' : 'On Rotation'}
        </span>
        <div className="w-full rounded-xl overflow-hidden h-[152px]">
          <iframe
            src={`https://open.spotify.com/embed/track/${historyTrackId}?utm_source=generator`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0 bg-transparent"
            title="Spotify History Feed"
          />
        </div>
      </div>

    </div>
  );
}