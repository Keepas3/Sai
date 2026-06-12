import React from 'react';
import { SiGithub, SiSpotify, SiOsu } from 'react-icons/si';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        
        {/* Left Side: Copyright & Basics */}
        <div className="footer-basics">
          <p className="footer-name">© {currentYear} Sai. All rights reserved.</p>
          <p className="footer-tagline"></p>
        </div>

        {/* Right Side: Social Links */}
        <div className="footer-socials">
          <a href="https://open.spotify.com/user/yvsulwdwvnaultx0yh5ek7pjc" target="_blank" rel="noreferrer" className="social-link" aria-label="Spotify">
            <SiSpotify />
          </a>
          <a href="https://ch.tetr.io/u/enseia" target="_blank" rel="noreferrer" className="social-link" aria-label="Tetr.io">
            <span className="font-bold text-sm tracking-tighter">TETR.IO</span>
            </a>
          <a href="https://osu.ppy.sh/users/10128871" target="_blank" rel="noreferrer" className="social-link" aria-label="Osu!">
            <SiOsu />
          </a>
        </div>

      </div>
    </footer>
  );
}