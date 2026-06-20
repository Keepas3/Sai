import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

export const revalidate = 0;

interface SanitySong {
  title: string;
  artist: string;
  spotifyTrackUrl?: string;
}

interface PlaylistTopic {
  topicName: string;
  topicDescription?: string;
  urls?: string[];
}

interface MusicPageData {
  pageTitle: string;
  topSongs?: SanitySong[];
  playlistTopics?: PlaylistTopic[];
}

function resolveEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (cleanUrl.includes('spotify.com')) {
    if (cleanUrl.includes('/embed/')) return cleanUrl;
    const spotifyMatches = cleanUrl.match(/spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
    if (spotifyMatches) {
      return `https://open.spotify.com/embed/${spotifyMatches[1]}/${spotifyMatches[2]}`;
    }
  }

  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    if (cleanUrl.includes('/embed/')) return cleanUrl;
    if (cleanUrl.includes('list=')) {
      const playlistMatches = cleanUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (playlistMatches) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistMatches[1]}`;
      }
    }
    let videoId = '';
    if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
    } else {
      const videoMatches = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      videoId = videoMatches ? videoMatches[1] : '';
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  return cleanUrl;
}

export default async function PlaylistPage() {
  const musicData: MusicPageData | null = await client.fetch(`
    *[_type == "musicPage"][0] {
      pageTitle,
      topSongs,
      playlistTopics
    }
  `);

  const pageTitle = musicData?.pageTitle || "Songs";
  const activeSongs = musicData?.topSongs?.filter(song => song.spotifyTrackUrl) || [];
  const topics = musicData?.playlistTopics || [];

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        
        {/* --- Page Header --- */}
        <header className="flex flex-col gap-4 text-left">
          <h1 className="page-title">{pageTitle}</h1>
        </header>

        <hr className="border-t border-white/10 mb-8" />

        {/* =========================================
            TOP TRACKS SECTION
        ========================================= */}
        {activeSongs.length > 0 && (
          // Inline style forces a clean 80px space between top tracks and playlist topics
          <section className="flex flex-col gap-6" style={{ marginBottom: '80px' }}>
            <h2 className="text-3xl font-bold font-serif text-white/90">My Top Tracks</h2>
            
            <div className="flex flex-col gap-4">
              {activeSongs.map((song, index) => {
                const embedSrc = resolveEmbedUrl(song.spotifyTrackUrl);
                if (!embedSrc) return null;

                const podiumClasses = ["podium-gold", "podium-silver", "podium-bronze"];
                const numberClasses = ["text-gold", "text-silver", "text-bronze"];

                return (
                  <div key={index} className={`podium-row ${podiumClasses[index] || ""}`}>
                    <div className={`podium-number ${numberClasses[index] || ""}`}>{index + 1}</div>
                    <div className="flex-1">
                      <iframe 
                        src={embedSrc}
                        width="100%" 
                        // FIXED: All tracks locked back to 152 to match sizes perfectly
                        height="152" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        className="rounded-lg shadow-md"
                        loading="lazy"
                        allowFullScreen
                        title={`Top Song ${index + 1}`}
                      ></iframe>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================
            DYNAMIC MULTI-TOPIC PLAYLISTS
        ========================================= */}
        {topics.map((topic, topicIdx) => {
          const activeUrls = topic.urls?.filter(Boolean) || [];
          if (activeUrls.length === 0) return null;

          return (
            // FIXED: Reduced margin-top down to 40px to lessen the spacing between sequential topics
            <section key={topicIdx} className="flex flex-col" style={{ marginTop: '20px' }}>
              
              {/* Header Context */}
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold font-serif text-white/90 border-b border-white/10 pb-2">
                  {topic.topicName}
                </h2>
                {topic.topicDescription && (
                  <p className="text-white/60 text-sm mt-2">{topic.topicDescription}</p>
                )}
              </div>

              {/* FIXED: Forces an exact clean text space gap directly underneath the description lines */}
              <div className="playlist-grid" style={{ marginTop: '10px' }}>
                {activeUrls.map((url, urlIdx) => {
                  const embedSrc = resolveEmbedUrl(url);
                  if (!embedSrc) return null;

                  const isYouTubePlaylist = embedSrc.includes('videoseries');

                  return (
                    <iframe 
                      key={urlIdx}
                      src={embedSrc} 
                      frameBorder="0" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      allowFullScreen 
                      loading="lazy" 
                      className="spotify-embed"
                      style={{ height: isYouTubePlaylist ? '360px' : '255px' }}
                      title={`Embed Stream ${topicIdx}-${urlIdx}`}
                    ></iframe>
                  );
                })}
              </div>

            </section>
          );
        })}

        {/* Fallback layout */}
        {activeSongs.length === 0 && topics.length === 0 && (
          <div className="text-center mt-12">
            <h2 className="text-white/40 text-lg font-mono">No music sections published yet.</h2>
          </div>
        )}

      </main>
    </div>
  );
}