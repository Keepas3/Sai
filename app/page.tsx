import Navbar from "@/components/Navbar";
import SpotifyStatus from "@/components/SpotifyStatus"; 
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

// 1. UPDATED: Unified Media Item interface for the smart tracker block
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
    "projectsData": *[_type == "project" && defined(projectList)] | order(_updatedAt desc)[0] {
      projectList[] {
        title,
        description,
        projectLink,
        "imageUrl": image.asset->url
      }
    },
    
    // SMART SORTED GAMES DECK (SLICES TOP 2)
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

    // SMART SORTED BOOKS DECK (SLICES TOP 2)
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
    
    "categories": *[_type == "category" && defined(slug.current)][0..2] {
      title,
      description,
      "slug": slug.current
    }
  }`, {}, { cache: 'no-store' });

  const profile: ProfileData | null = data.profile;
  const projects: DashboardProject[] = data.projectsData?.projectList || [];
  
  // 2. UPDATED: Extraction layers matching your new smart GROQ query arrays
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
          
          {/* ROW 1: Spotify & Consolidated Activity Tracker */}
          <div className="top-activity-row">
            {/* Spotify Column */}
            <div className="status-box flex flex-col justify-between">
              <div>
                <h3>🎵 Currently Listening</h3>
                <p className="text-xs text-white/40 font-mono tracking-wide mt-1 mb-4 uppercase"></p>
              </div>
              <div className="w-full">
                <SpotifyStatus />
              </div>
            </div>

            {/* 3. UPDATED: New Consolidated Smart Activity Tracker Column */}
            <div className="status-box">
              <h3>🎮 Activity Tracker</h3>
             
              
              <div className="flex flex-col gap-5">
                
                {/* Sub-Section A: Video Games */}
                <div className="games-list flex flex-col gap-3">
                  {games.length === 0 ? (
                    <p className="status-text italic text-white/30 text-xs">No gaming updates logs recorded.</p>
                  ) : (
                    games.map((game, index) => (
                      <div key={`game-${index}`} className="game-item">
                        <div className="w-[55px] h-[55px] rounded-md overflow-hidden flex items-center justify-center bg-white/5 shrink-0 border border-white/10">
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

                {/* Micro Visual Divider Split Line */}
                <div className="h-[1px] w-full bg-white/5" />

                {/* Sub-Section B: Books Library */}
                <div className="books-list flex flex-col gap-3">
                  {books.length === 0 ? (
                    <p className="status-text italic text-white/30 text-xs">No reading updates logs recorded.</p>
                  ) : (
                    books.map((book, index) => (
                      <div key={`book-${index}`} className="game-item">
                        <div className="w-[55px] h-[55px] rounded-md overflow-hidden flex items-center justify-center bg-white/5 shrink-0 border border-white/10">
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
              <h3>💻 Active Projects</h3>
              {!activeProject ? (
                <p className="status-text italic">No active projects linked.</p>
              ) : (
                <div className="project-list">
                  <div className="project-item">
                    {activeProject.imageUrl && (
                      <div className="w-full overflow-hidden rounded-xl border border-white/10 mb-4 bg-black/20">
                        <img src={activeProject.imageUrl} alt={activeProject.title} className="w-full object-cover max-h-[500px]" />
                      </div>
                    )}
                    <h4>
                      {activeProject.projectLink ? (
                        <a href={activeProject.projectLink} target="_blank" rel="noopener noreferrer" className="text-[#e5729f] hover:underline inline-flex items-center gap-1 cursor-pointer">
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