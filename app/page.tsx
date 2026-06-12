import Navbar from "@/components/Navbar";
import SpotifyStatus from "@/components/SpotifyStatus"; 
// Make sure SakuraCanvas is imported and running in your global layout or here!

export default function Home() {
  return (
    <div className="content-wrapper">
      <Navbar />

      {/* --- NEW: The Background Banner Art --- */}
      <div className="banner-container">
        <img src="/johto.png" alt="Profile Background Art" className="banner-image" />
      </div>

      {/* The rest of your site sits on top of the banner */}
      <main className="portfolio-main">
        
        {/* Your Profile Header */}
        <div className="profile-header">
          <div className="profile-title-row">
            <div className="avatar-container">
              <img src="/profile.jpg" alt="My Avatar" /> 
            </div>
            <h1 className="profile-name">Saiushi</h1>
          </div>
          <p className="profile-bio">
            愛がなければ視えない. Without love, it cannot be seen.
          </p>
        </div>

        {/* The 3-Column Status Dashboard */}
        <SpotifyStatus />

      </main>
    </div>
  );
}