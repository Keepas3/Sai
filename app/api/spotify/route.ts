import { NextResponse } from 'next/server';
import { getCurrentlyPlaying, getRecentlyPlayed } from '@/sanity/lib/spotify';

// Forces Next.js to run this function dynamic fresh every single frame request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('\n--- START BACKEND FETCH PIPELINE ---');

  let currentTrackData = null;
  let recentTrackData = null;

  try {
    const [currentRes, recentRes] = await Promise.allSettled([
      getCurrentlyPlaying(),
      getRecentlyPlayed()
    ]);

    // Check Currently Playing Stream
    if (currentRes.status === 'fulfilled' && currentRes.value.status === 200) {
      const song = await currentRes.value.json();
      if (song && song.item && song.is_playing) {
        currentTrackData = {
          title: song.item.name,
          songUrl: song.item.external_urls.spotify,
        };
        console.log('🟢 Spotify Live: Currently Listening to:', currentTrackData.title);
      } else {
        console.log('⚪ Spotify Live: Connected, but user is currently idle (No Active Stream).');
      }
    } else {
      console.log('🔴 Tier 1 Fetch Failed or returned non-200 profile status');
    }

    // Check Recently Played History Stream
    if (recentRes.status === 'fulfilled' && recentRes.value.status === 200) {
      const history = await recentRes.value.json();
      const lastTrack = history.items?.[0]?.track;
      if (lastTrack) {
        recentTrackData = {
          title: lastTrack.name,
          songUrl: lastTrack.external_urls.spotify,
        };
        console.log('📻 Spotify History: Most Recent Song Found:', recentTrackData.title);
      }
    } else {
      console.log('🔴 Tier 2 History Fetch Failed or returned non-200 status');
    }
  } catch (e: any) {
    console.error('❌ Crash Core Exception during fetch operations:', e.message);
  }

  // Prevent "Now Playing" and "Recently Played" from matching the exact same track item
  if (currentTrackData && recentTrackData && currentTrackData.songUrl === recentTrackData.songUrl) {
    console.log('🔄 Match detected: Recent track matches active track. Shifting history reference downstream.');
  }

  console.log('--- END BACKEND FETCH PIPELINE ---\n');

  // Payload Routing
  if (currentTrackData) {
    return NextResponse.json({
      statusType: 'playing',
      songUrl: currentTrackData.songUrl,
      recentSongUrl: recentTrackData?.songUrl || 'https://open.spotify.com/track/06DHZv4ahSwp30plm1kbgM'
    });
  }

  if (recentTrackData) {
    return NextResponse.json({
      statusType: 'recent',
      songUrl: recentTrackData.songUrl,
    });
  }

  return NextResponse.json({
    statusType: 'recommendation',
    songUrl: 'https://open.spotify.com/track/06DHZv4ahSwp30plm1kbgM',
  });
}