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

function convertToSpotifyEmbed(url: string | undefined): string | null {
  if (!url) return null;
  try {
    if (url.includes('/embed/')) return url;
    if (url.includes('open.spotify.com/track/')) {
      return url.replace('open.spotify.com/track/', 'open.spotify.com/embed/track/');
    }
    if (url.includes('open.spotify.com/playlist/')) {
      return url.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');
    }
    return url;
  } catch (e) {
    return null;
  }
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
            TOP tracks SECTION
        ========================================= */}
        {activeSongs.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="text-3xl font-bold font-serif text-white/90">My Top Tracks</h2>
            
            <div className="flex flex-col gap-4">
              {activeSongs.map((song, index) => {
                const embedSrc = convertToSpotifyEmbed(song.spotifyTrackUrl);
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
                        height="152" 
                        frameBorder="0" 
                        allow="encrypted-media" 
                        className="rounded-lg"
                        loading="lazy"
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
            <section key={topicIdx} className="flex flex-col gap-8 mt-16">
              
              {/* Header Context for each unique topic */}
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold font-serif text-white/90 border-b border-white/10 pb-2">
                  {topic.topicName}
                </h2>
                {topic.topicDescription && (
                  <p className="text-white/60 text-sm mb-6">{topic.topicDescription}</p>
                )}
              </div>

              {/* Your native CSS .playlist-grid will now map unique items side-by-side */}
              <div className="playlist-grid">
                {activeUrls.map((url, urlIdx) => {
                  const embedSrc = convertToSpotifyEmbed(url);
                  if (!embedSrc) return null;

                  return (
                    <iframe 
                      key={urlIdx}
                      src={embedSrc} 
                      frameBorder="0" 
                      allowFullScreen 
                      loading="lazy" 
                      className="spotify-embed"
                    ></iframe>
                  );
                })}
              </div>

            </section>
          );
        })}

        {/* Fallback layout if everything is unconfigured */}
        {activeSongs.length === 0 && topics.length === 0 && (
          <div className="text-center mt-12">
            <h2 className="text-white/40 text-lg font-mono">No music sections published yet.</h2>
          </div>
        )}

      </main>
    </div>
  );
}