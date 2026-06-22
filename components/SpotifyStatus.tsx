'use client';

import { useEffect, useState } from 'react';

interface SpotifyTrack {
  songUrl?: string;
  recentSongUrl?: string;
  // Updated type string to safely allow 'offline' or other backend configurations without breaking compiler checks
  statusType?: 'playing' | 'recent' | 'offline' | 'recommendation';
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

  // State Context Parsers
  const isNowPlaying = track?.statusType === 'playing';
  const isOfflineHistoryStacked = track?.statusType === 'offline';
  
  // Decide if we should render the top block card framework 
  // True if actively listening OR if the backend dropped down into dual history slot allocation
  const showTopCard = isNowPlaying || isOfflineHistoryStacked || track?.statusType === 'recent';

  // Parse Track ID Targets out safely from string URLs
  const currentTrackId = track?.songUrl?.split('/track/')?.[1]?.split('?')?.[0] || null;
  
  // Secondary fallback router selection logic:
  // If playing, look for recentSongUrl. If offline stacked, use recentSongUrl (History Item #2). 
  // Otherwise default back to your original fallback asset string.
  const secondaryUrl = isNowPlaying || isOfflineHistoryStacked ? track?.recentSongUrl : track?.songUrl;
  const historyTrackId = secondaryUrl?.split('/track/')?.[1]?.split('?')?.[0] || '06DHZv4ahSwp30plm1kbgM';

  console.log('=== FRONTEND IFRAME RENDERING STATE ===');
  console.log('Status Mode Type:', track?.statusType);
  console.log('isNowPlaying Condition:', isNowPlaying);
  console.log('Parsed Top Layout Track ID:', currentTrackId);
  console.log('Parsed Bottom Layout Track ID:', historyTrackId);

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      
      {/* 1. TOP CARD: Dynamic Live Feed / Main History Placement */}
      {showTopCard && currentTrackId && (
        <div className="flex flex-col gap-1.5">
          <span 
            className="text-[10px] font-mono uppercase tracking-wider pl-1 transition-colors duration-300"
            style={{ color: isNowPlaying ? '#1DB954' : '#a1a1aa' }}
          >
            {isNowPlaying ? '• Now Playing' : 'Recently Played'}
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

      {/* 2. BOTTOM CARD: Dynamic History Layout / Secondary Downstream Sequence */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-1">
          {isNowPlaying ? 'On Rotation' : 'Previously Listened'}
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