import Navbar from "@/components/Navbar";
import SpotifyStatus from "@/components/SpotifyStatus"; 
import { client } from '@/sanity/lib/client';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfileData {
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
}

interface DashboardProject {
  _id: string;
  title: string;
  description: string;
  projectLink?: string;
  imageUrl?: string; 
}

interface DashboardGame {
  _id: string;
  title: string;
  imageUrl?: string;
}

export default async function Home() {
  // FIXED FOR LIVE DEPLOYMENT: Added { cache: 'no-store' } as the third parameter.
  // This blocks Next.js from intercepting the request and forces a clean network fetch.
  const data = await client.fetch(`{
    "profile": *[_type == "profile"] | order(_updatedAt desc)[0] {
      name,
      bio,
      "avatarUrl": avatar.asset->url,
      "bannerUrl": banner.asset->url
    },
    // 1. Follows your custom homepage project drag-and-drop list order
    "projects": *[_type == "profile"] | order(_updatedAt desc)[0].featuredProjects[]-> {
      _id,
      title,
      description,
      projectLink,
      "imageUrl": image.asset->url
    },
    // 2. Follows your custom homepage games drag-and-drop list order
    "games": *[_type == "profile"] | order(_updatedAt desc)[0].featuredGames[]-> {
      _id,
      title,
      "imageUrl": coverImage.asset->url
    },
    
  }`, {}, { cache: 'no-store' });

  const profile: ProfileData | null = data.profile;
  const projects: DashboardProject[] = data.projects || [];
  const games: DashboardGame[] = data.games || [];
  
  const activeProject = projects[0];

  return (
    <div className="content-wrapper">
      <Navbar />

      {/* --- BACKGROUND BANNER --- */}
      <div className="banner-container">
        <img 
          src={profile?.bannerUrl || "/banner.png"} 
          alt="Profile Background Art" 
          className="banner-image" 
        />
        <div className="banner-fade-overlay"></div>
      </div>

      <main className="portfolio-main">
        
        {/* --- PROFILE HEADER --- */}
        <div className="profile-header">
          <div className="profile-title-row">
            <div className="avatar-container">
              <img 
                src={profile?.avatarUrl || "/profile.jpg"} 
                alt="My Avatar" 
                className="avatar-image" 
              /> 
            </div>
            <h1 className="profile-name">{profile?.name || "Sai"}</h1>
          </div>
          
          <div className="profile-bio-wrapper">
            <p className="profile-bio">
              {profile?.bio || "愛がなければ視えない。Without love, it cannot be seen."}
            </p>
          </div>
        </div>

        {/* --- DASHBOARD STYLED ELEMENT GRIDS --- */}
        <div className="status-rows-container mt-16">
          
          {/* ROW 1: Spotify & Games Collection */}
          <div className="top-activity-row">
            
            {/* Spotify Column */}
            <div className="status-box flex flex-col justify-between">
              <div>
                <h3>🎵 Currently Listening</h3>
                <p className="text-xs text-white/40 font-mono tracking-wide mt-1 mb-4 uppercase">
                  {/* Heavy Rotation / Live Status */}
                </p>
              </div>
              
              <div className="flex-1 flex items-center justify-center w-full min-h-[152px]">
                <SpotifyStatus />
              </div>
            </div>

            {/* Currently Playing Column */}
            <div className="status-box">
              <h3>🎮 Currently Playing</h3>
              <div className="games-list">
                {games.length === 0 ? (
                  <p className="status-text italic">No games logged.</p>
                ) : (
                  games.map((game) => (
                    <div key={game._id} className="game-item">
                      <div className="w-[55px] h-[55px] rounded-md overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
                        {game.imageUrl ? (
                          <img 
                            src={game.imageUrl} 
                            alt={game.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-[9px] font-mono text-white/20">GAME</span>
                        )}
                      </div>
                      <div className="game-info">
                        <h4>{game.title}</h4>
                        <p>Status: Playing</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* ROW 2: Featured Active Project */}
          <div className="projects-row">
            <div className="status-box w-100">
              <h3>💻 Active Projects</h3>
              
              {!activeProject ? (
                <p className="status-text italic">No active projects linked.</p>
              ) : (
                <div className="project-list">
                  <div className="project-item">
                    {activeProject.imageUrl && (
                      <div className="w-full overflow-hidden rounded-xl border border-white/10 mb-4 bg-black/20">
                        <img 
                          src={activeProject.imageUrl} 
                          alt={activeProject.title}
                          className="w-full object-cover max-h-[500px]"
                        />
                      </div>
                    )}
                    
                    <h4>
                      {activeProject.projectLink ? (
                        <a 
                          href={activeProject.projectLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#e5729f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {activeProject.title} <span className="text-xs opacity-60">↗</span>
                        </a>
                      ) : (
                        activeProject.title
                      )}
                    </h4>
                    <p className="status-text mt-1">
                      {activeProject.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}