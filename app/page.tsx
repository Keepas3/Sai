import Navbar from "@/components/Navbar";
import SpotifyStatus from "@/components/SpotifyStatus"; 
import FortuneSlip from "@/components/FortuneSlip";
import { client } from '@/sanity/lib/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfileData {
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
}

interface DashboardProject {
  title: string;
  description: string;
  projectLink?: string;
  imageUrl?: string; 
}

interface HomeMediaItem {
  title: string;
  status: string;
  imageUrl?: string;
}

interface DashboardCategory {
  title: string;
  description?: string;
  slug: string;
}

export default async function Home() {
  const data = await client.fetch(`{
    "profile": *[_type == "profile"] | order(_updatedAt desc)[0] {
      name,
      bio,
      "avatarUrl": avatar.asset->url,
      "bannerUrl": banner.asset->url
    },
    "fortuneSlip": *[_type == "fortuneSlip"][0]{
      fortuneSlips
    },
    "projectsData": *[_type == "project" && defined(projectList)] | order(_updatedAt desc)[0] {
      projectList[] {
        title,
        description,
        projectLink,
        "imageUrl": image.asset->url
      }
    },
    
    "gamesData": *[_type == "game" && defined(gamesList)][0] {
      "gamesList": (
        gamesList[] {
          title,
          status,
          "imageUrl": coverImage.asset->url,
          "weight": select(
            status == "playing" => 1,
            status == "backlog" => 2,
            status == "completed" => 3,
            4
          )
        }
      ) | order(weight asc)[0..1]
    },

    "booksData": *[_type == "book" && defined(booksList)][0] {
      "booksList": (
        booksList[] {
          title,
          status,
          "imageUrl": coverImage.asset->url,
          "weight": select(
            status == "reading" => 1,
            status == "backlog" => 2,
            status == "completed" => 3,
            4
          )
        }
      ) | order(weight asc)[0..1]
    },
    
    "categories": *[_type == "category" && defined(slug.current)][0..3] {
      title,
      description,
      "slug": slug.current
    }
  }`, {}, { cache: 'no-store' });

  const profile: ProfileData | null = data.profile;
  const fortuneSlip = data.fortuneSlip;
  const projects: DashboardProject[] = data.projectsData?.projectList || [];
  
  const games: HomeMediaItem[] = data.gamesData?.gamesList || [];
  const books: HomeMediaItem[] = data.booksData?.booksList || [];
  const categories: DashboardCategory[] = data.categories || []; 
  
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
            <div className="flex items-center gap-3">
              <h1 className="profile-name">{profile?.name || "Sai"}</h1>
              <FortuneSlip
                slips={fortuneSlip?.fortuneSlips || []}
                inline
              />
            </div>
          </div>
          
          <div className="profile-bio-wrapper">
            <p className="profile-bio">
              {profile?.bio || "愛がなければ視えない。Without love, it cannot be seen."}
            </p>
          </div>
        </div>

        {/* --- DASHBOARD STYLED ELEMENT GRIDS --- */}
        <div className="status-rows-container mt-16">
          
          {/* ROW 1: Spotify & Consolidated Activity Tracker */}
          <div className="top-activity-row">
            
            {/* Spotify Column */}
            <div className="status-box flex flex-col justify-between">
              <div>
                {/* FIXED: Gap adjusted to 8px; custom top margin removed to lift icon up */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                  <svg 
                    className="text-[#e5729f] shrink-0" 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    style={{ width: '20px', height: '20px', marginTop: '-4px' }} 
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white m-0 leading-none">Currently Listening</h3>
                </div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4"></p>
              </div>
              
              <div className="w-full">
                <SpotifyStatus />
              </div>
            </div>

            {/* --- CONSOLIDATED CURRENT ACTIVITY COLUMN --- */}
            <div className="status-box">
              {/* FIXED: Unified gap to 8px; icon alignment shifted upwards via negative margin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                <svg 
                  className="text-[#e5729f] shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="2" 
                  stroke="currentColor"
                  style={{ width: '20px', height: '20px', marginTop: '-2px' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <h3 className="text-lg font-bold text-white m-0 leading-none">Activity Tracker</h3>
              </div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4"></p>
              
              <div className="flex flex-col gap-5">
                
                {/* Sub-Section A: Video Games */}
                <div className="games-list flex flex-col gap-3">
                  {games.length === 0 ? (
                    <p className="status-text italic text-white/30 text-xs">No gaming updates logs recorded.</p>
                  ) : (
                    games.map((game, index) => (
                      <div key={`game-${index}`} className="game-item">
                        <div className="w-[55px] h-[55px] rounded-md overflow-hidden flex items-center justify-center bg-white/5 shrink-0 shadow-lg">
                          {game.imageUrl ? (
                            <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-mono text-white/20">GAME</span>
                          )}
                        </div>
                        <div className="game-info">
                          <h4>{game.title}</h4>
                          <p className={`text-[10px] font-mono font-bold uppercase tracking-wide mt-0.5 ${
                            game.status === 'playing' ? 'text-green-400' : game.status === 'backlog' ? 'text-blue-400' : 'text-yellow-400/80'
                          }`}>
                            {game.status === 'playing' ? '🎮 Playing' : game.status === 'backlog' ? '⏳ Backlog' : '🏆 Cleared'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Visual Separator Divider Line */}
                <div className="h-[1px] w-full bg-white/5" />

                {/* Sub-Section B: Books Library */}
                <div className="books-list flex flex-col gap-3">
                  {books.length === 0 ? (
                    <p className="status-text italic text-white/30 text-xs">No reading updates logs recorded.</p>
                  ) : (
                    books.map((book, index) => (
                      <div key={`book-${index}`} className="game-item">
                        <div className="w-[55px] h-[55px] rounded-md overflow-hidden flex items-center justify-center bg-white/5 shrink-0 shadow-lg">
                          {book.imageUrl ? (
                            <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-mono text-white/20">BOOK</span>
                          )}
                        </div>
                        <div className="game-info">
                          <h4>{book.title}</h4>
                          <p className={`text-[10px] font-mono font-bold uppercase tracking-wide mt-0.5 ${
                            book.status === 'reading' ? 'text-green-400' : book.status === 'backlog' ? 'text-blue-400' : 'text-yellow-400/80'
                          }`}>
                            {book.status === 'reading' ? '📖 Reading' : book.status === 'backlog' ? '⏳ Backlog' : '🏆 Completed'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ROW 2: Featured Active Project */}
          <div className="projects-row">
            <div className="status-box w-100">
              
              {/* FIXED: Standardized row spacing structure to match top row layouts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <svg 
                  className="text-[#e5729f] shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="2" 
                  stroke="currentColor"
                  style={{ width: '20px', height: '20px', marginTop: '-1px' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.8 4.4l2.8 2.8" />
                </svg>
                <h3 className="text-lg font-bold text-white m-0 leading-none">Active Projects</h3>
              </div>
          

              {!activeProject ? (
              <p className="status-text italic">No active projects linked.</p>
            ) : (
              <div className="project-list">
                <div className="project-item">
                  {activeProject.imageUrl && (
              /* OVERRIDE: Dropped border classes for direct inline styles to force-kill the white outline */
              <div 
                className="w-full overflow-hidden rounded-xl mb-4 bg-black/20"
                style={{ 
                  border: '1px solid rgba(255, 255, 255, 0.02)', // ◄ Forcefully makes the border dark/invisible
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'    // ◄ Uses a rich shadow for edge separation instead
                }}
              >
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
                  <p className="status-text mt-1">{activeProject.description}</p>
                </div>
              </div>
            )}
                        </div>
                      </div>

          {/* ROW 3: Blog Exploration Grid Layout */}
          <div className="blog-topics-row mt-8">
            <div className="status-box w-100">
              <h3>Blogs</h3>
              <p className="status-text mb-4 text-white/60">Some interesting things that come up in my life.</p>
              
              <div className="categories-grid">
                {categories.length === 0 ? (
                  <p className="status-text italic">No topics created yet.</p>
                ) : (
                  categories.map((category) => (
                    <Link 
                      key={category.slug} 
                      href="/blog"  
                      className="category-card-item"
                    >
                      <h4>{category.title} <span className="arrow-transition">→</span></h4>
                      <p>{category.description || `Browse articles and logging notes regarding ${category.title}.`}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}