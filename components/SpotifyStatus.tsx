import React from 'react';

export default function SpotifyStatus() {
  return (
    <div className="spotify-widget-container h-full w-full min-h-[180px]">
      {/* Right now this is a static placeholder iframe. 
        Later, we will replace this exact block with your live fetch() hook 
        to capture your Lanyard or Spotify Web API states!
      */}
      <iframe 
        title="Spotify Track Embed"
        src="https://open.spotify.com/embed/track/5yW5kRh4vEFucLL3kbaVSU?si=dc0d7f78a9e34bf2" // Clean fallback link
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allowFullScreen 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
        className="spotify-iframe rounded-xl"
      ></iframe>
    </div>
  );
}