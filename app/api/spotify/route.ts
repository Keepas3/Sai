import { NextResponse } from 'next/server';
import { getCurrentlyPlaying, getRecentlyPlayed } from '@/sanity/lib/spotify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('\n--- START BACKEND FETCH PIPELINE ---');

  let currentTrackData = null;
  let recentTrackData = null;
  let secondRecentTrackData = null;
  let thirdRecentTrackData = null; // NEW: Added to catch the 3rd history item

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

    // 2. Check Recently Played History Stream (WITH DEDUPLICATION)
    if (recentRes.status === 'fulfilled' && recentRes.value.status === 200) {
      const history = await recentRes.value.json();
      
      // Clean the array: Remove consecutive duplicates caused by pause/play glitches
      const uniqueItems = [];
      let lastId = null;

      for (const item of history.items || []) {
        if (item.track.id !== lastId) {
          uniqueItems.push(item);
          lastId = item.track.id;
        }
      }

      // Now assign slots from our cleaned unique list
      if (uniqueItems[0]?.track) {
        recentTrackData = {
          title: uniqueItems[0].track.name,
          songUrl: uniqueItems[0].track.external_urls.spotify,
        };
        console.log('📻 Spotify History 1:', recentTrackData.title);
      }

      if (uniqueItems[1]?.track) {
        secondRecentTrackData = {
          title: uniqueItems[1].track.name,
          songUrl: uniqueItems[1].track.external_urls.spotify,
        };
        console.log('📻 Spotify History 2:', secondRecentTrackData.title);
      }

      if (uniqueItems[2]?.track) {
        thirdRecentTrackData = {
          title: uniqueItems[2].track.name,
          songUrl: uniqueItems[2].track.external_urls.spotify,
        };
        console.log('📻 Spotify History 3:', thirdRecentTrackData.title);
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
      recentSongUrl: recentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM',
      // NEW: If they are playing a song on repeat, this provides the 2nd history item as a backup
      thirdSongUrl: secondRecentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM' 
    });
  }

  // Scenario B: Friend is offline -> Show most recent history item + second most recent history item
  if (recentTrackData) {
    console.log('💤 Friend offline. Shifting history items up into the slots.');
    return NextResponse.json({
      statusType: 'offline', 
      songUrl: recentTrackData.songUrl,
      recentSongUrl: secondRecentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM',
      // NEW: If their top two history items are identical, this provides the 3rd history item as a backup
      thirdSongUrl: thirdRecentTrackData?.songUrl || '06DHZv4ahSwp30plm1kbgM'
    });
  }

  // Scenario C: Absolute Fallback if APIs fail completely
  return NextResponse.json({
    statusType: 'recommendation',
    songUrl: '06DHZv4ahSwp30plm1kbgM',
    recentSongUrl: '06DHZv4ahSwp30plm1kbgM',
    thirdSongUrl: '06DHZv4ahSwp30plm1kbgM' // Fallback for the third slot
  });
}