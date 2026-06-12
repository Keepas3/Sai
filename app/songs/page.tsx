import Navbar from "@/components/Navbar";

export default function PlaylistPage() {
    return (
        <div className="content-wrapper">
            <Navbar />

            <main className="page-container">
                
                {/* --- Page Header --- */}
                <header className="flex flex-col gap-4 text-left">
                    <h1 className="page-title">Songs</h1>
                </header>

                <hr className="border-t border-white/10 mb-8" />

                {/* =========================================
                    TOP 3 SONGS SECTION
                ========================================= */}
                <section className="flex flex-col gap-8">
                    <h2 className="text-3xl font-bold font-serif text-white/90">My Top 3 Songs</h2>
                    
                    <div className="flex flex-col gap-4">
                        
                        {/* #1 - GOLD */}
                        <div className="podium-row podium-gold">
                            <div className="podium-number text-gold">1</div>
                            <div className="flex-1">
                                <iframe src="https://open.spotify.com/embed/track/3Ld9NGGKYwOyZvd1bPF0ZE?si=a0e60b2c743f4b2e" width="100%" height="152" frameBorder="0" allow="encrypted-media" className="rounded-lg"></iframe>
                            </div>
                        </div>

                        {/* #2 - SILVER */}
                        <div className="podium-row podium-silver">
                            <div className="podium-number text-silver">2</div>
                            <div className="flex-1">
                                <iframe src="https://open.spotify.com/embed/track/06DHZv4ahSwp30plm1kbgM?si=f0e0b5733f7b4e64" width="100%" height="152" frameBorder="0" allow="encrypted-media" className="rounded-lg"></iframe>
                            </div>
                        </div>

                        {/* #3 - BRONZE */}
                        <div className="podium-row podium-bronze">
                            <div className="podium-number text-bronze">3</div>
                            <div className="flex-1">
                                <iframe src="https://open.spotify.com/embed/track/50X6x4TgZPPX135DjCPIJW?si=6d9c3c01f78a4d26" width="100%" height="152" frameBorder="0" allow="encrypted-media" className="rounded-lg"></iframe>
                            </div>
                        </div>

                    </div>
                </section>

                {/* =========================================
                    MOOD 1: Architecture
                ========================================= */}
                <section className="flex flex-col gap-8 mt-16">
                    
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold font-serif text-white/90 border-b border-white/10 pb-2">Playlist for Architecture</h2>
                        <p className="text-white/60 text-sm mb-6">Oriental-inspired or lofi tracks.</p>
                    </div>

                    {/* Replaced Tailwind grid with .playlist-grid */}
                    <div className="playlist-grid">
                        {/* Replaced Tailwind classes with .spotify-embed */}
                        <iframe src="https://open.spotify.com/embed/playlist/6f3PZbS8F2Uy8t5rObDRvI?si=PZspFO-6RYaPw2f5EyYAtQ" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                        <iframe src="https://open.spotify.com/embed/playlist/6f3PZbS8F2Uy8t5rObDRvI?si=PZspFO-6RYaPw2f5EyYAtQ" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                        <iframe src="https://open.spotify.com/embed/playlist/6f3PZbS8F2Uy8t5rObDRvI?si=PZspFO-6RYaPw2f5EyYAtQ" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                    </div>

                </section>

                {/* =========================================
                    MOOD 2: High Energy & Tactics
                ========================================= */}
                <section className="flex flex-col gap-8 mt-16">
                    
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold font-serif text-white/90 border-b border-white/10 pb-2">Video Game Soundtracks / Anime Style</h2>
                        <p className="text-white/60 text-sm mb-6">Music from games or anime-style compositions.</p>
                    </div>

                    <div className="playlist-grid">
                        {/* */}
                        <iframe src="https://open.spotify.com/embed/playlist/2mIgGNvWhF6f45XIBWNWx7" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                        <iframe src="https://open.spotify.com/embed/playlist/2mIgGNvWhF6f45XIBWNWx7" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                        <iframe src="https://open.spotify.com/embed/playlist/2mIgGNvWhF6f45XIBWNWx7" frameBorder="0" allowFullScreen loading="lazy" className="spotify-embed"></iframe>
                    </div>

                </section>

            </main>
        </div>
    );
}