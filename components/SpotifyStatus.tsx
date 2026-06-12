import React from 'react';

export default function SpotifyStatus() {
  return (
    <section id="activity" className="portfolio-section">
      <h2 className="section-header">Current Status</h2>
      <hr className="section-divider" />
      
      <div className="status-rows-container">
        
        {/* --- ROW 1: Music & Games (Side-by-Side) --- */}
        <div className="top-activity-row">
          
          {/* Left Column: Spotify */}
          <div className="spotify-widget-container">
            <iframe 
              title="Spotify Playlist Embed"
              src="https://open.spotify.com/embed/track/5yW5kRh4vEFucLL3kbaVSU?si=3445ae1428104408" 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allowFullScreen 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="spotify-iframe"
            ></iframe>
          </div>

          {/* Right Column: Currently Playing */}
          <div className="status-box">
            <h3>🎮 Currently Playing</h3>
            <div className="games-list">
              
              <div className="game-item">
                <img src="/riskofrain.png" alt="Risk of Rain 2" className="game-image" />
                <div className="game-info">
                  <h4>Risk of Rain 2</h4>
                  <p>Hardcore Gaming.</p>
                </div>
              </div>

              <div className="game-item">
                <img src="/osu.png" alt="osu!" className="game-image" />
                <div className="game-info">
                  <h4>osu!</h4>
                  <p>Practicing new beatmaps and improving accuracy.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- ROW 2: Active Projects (Full Width) --- */}
        <div className="projects-row">
          <div className="status-box">
            <h3>💻 Active Projects</h3>
            
            <div className="project-list">
              
              {/* Project 1 */}
              <div className="project-item">
                {/* Added placeholder art from Work page */}
                <img 
                  src="https://picsum.photos/id/3/800/450" 
                  alt="Tempo C++" 
                  className="w-full aspect-video object-cover rounded-md border border-white/10 mb-2" 
                />
                <h4>Cool Stuff</h4>
                <p className="status-text">
                  Developing something cool.
                </p>
              </div>
              

            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}