import React from 'react';

export default function Interests() {
  return (
    <section id="now" className="section alternate-bg">
      <div className="interests-container">
        
        {/* Left Side: The Living Room Vibe */}
        <div className="interests-block">
          <h2 className="interests-title">Current Obsessions</h2>
          <p className="interests-subtitle">What's occupying my screen and speakers right now.</p>
          
          <div className="now-card">
            <div className="card-icon">🎧</div>
            <div className="card-info">
              <h4>On Repeat</h4>
              <p>Lo-Fi Jazz Hop & Ambient Beats</p>
              <span className="card-subtext">Perfect for deep focus sessions.</span>
            </div>
          </div>

          <div className="now-card">
            <div className="card-icon">📚</div>
            <div className="card-info">
              <h4>On the Desk</h4>
              <p>Designing High-Concurrency Architectures</p>
              <span className="card-subtext">Exploring how distributed data paths handle massive streams.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Mind Games & Logic */}
        <div className="interests-block">
          <h2 className="interests-title">Tactical Play</h2>
          <p className="interests-subtitle">Where I spend my computational energy offline.</p>
          
          <div className="now-card">
            <div className="card-icon">♟️</div>
            <div className="card-info">
              <h4>The Arena</h4>
              <p>Competitive Chess & Spatial Tactics</p>
              <span className="card-subtext">Currently analyzing classic tactical puzzles and calculation trees.</span>
            </div>
          </div>

          <div className="now-card">
            <div className="card-icon">💻</div>
            <div className="card-info">
              <h4>Side Quest</h4>
              <p>Building a Custom C++ Engine</p>
              <span className="card-subtext">Using bitboards to translate rapid spatial coordinates instantly.</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}