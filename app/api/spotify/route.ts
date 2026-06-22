import { NextResponse } from 'next/server';
import { getCurrentlyPlaying, getRecentlyPlayed } from '@/sanity/lib/spotify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('\n--- START BACKEND FETCH PIPELINE ---');

  let currentTrackData = null;
  let recentTrackData = null;
  let secondRecentTrackData = null;

  try {
    const [currentRes, recentRes] = await Promise.allSettled([
      getCurrentlyPlaying(),
      getRecentlyPlayed()
    ]);

    // 1. Check Currently Playing Stream
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
    }

    // 2. Check Recently Played History Stream (Extracting 1st and 2nd items)
    if (recentRes.status === 'fulfilled' && recentRes.value.status === 200) {
      const history = await recentRes.value.json();
      
      // Most recent song
      const lastTrack = history.items?.[0]?.track;
      if (lastTrack) {
        recentTrackData = {
          title: lastTrack.name,
          songUrl: lastTrack.external_urls.spotify,
        };
        console.log('📻 Spotify History 1:', recentTrackData.title);
      }

      // Second most recent song
      const secondLastTrack = history.items?.[1]?.track;
      if (secondLastTrack) {
        secondRecentTrackData = {
          title: secondLastTrack.name,
          songUrl: secondLastTrack.external_urls.spotify,
        };
        console.log('📻 Spotify History 2:', secondRecentTrackData.title);
      }
    }
  } catch (e: any) {
    console.error('❌ Crash Core Exception during fetch operations:', e.message);
  }

  console.log('--- END BACKEND FETCH PIPELINE ---\n');

  // === PAYLOAD ROUTING LOGIC ===

  // Scenario A: Friend is online -> Show live track + most recent history item
  if (currentTrackData) {
    return NextResponse.json({
      statusType: 'playing',
      songUrl: currentTrackData.songUrl,
      recentSongUrl: recentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM'
    });
  }

  // Scenario B: Friend is offline -> Show most recent history item + second most recent history item
  if (recentTrackData) {
    console.log('💤 Friend offline. Shifting history items up into the slots.');
    return NextResponse.json({
      // We label it 'offline' so the frontend component knows to alter the text headers while keeping both cards rendered
      statusType: 'offline', 
      songUrl: recentTrackData.songUrl,
      recentSongUrl: secondRecentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM'
    });
  }

  // Scenario C: Absolute Fallback if APIs fail completely
  return NextResponse.json({
    statusType: 'recommendation',
    songUrl: '06DHZv4ahSwp30plm1kbgM',
    recentSongUrl: '06DHZv4ahSwp30plm1kbgM'
  });
}