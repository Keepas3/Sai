'use client';

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';
import GalleryDriftWall, { type FlatPhoto } from "@/components/GalleryDriftWall";
import GalleryLightbox from "@/components/GalleryLightbox";
import { FiLayers, FiGrid } from "react-icons/fi";

interface GalleryItem {
  title: string;
  description?: string;
  url: string;
  overlayVideoUrl?: string;
  overlayStyle?: 'fullscreen' | 'container'; // ◄ Added to interface
}

interface Topic {
  _id: string;
  title: string;
  description: string;
  items: GalleryItem[];
}

// Raw shape of the second GROQ projection used to build the "All Photos"
// detailed view — includes _key so each image can be flattened into a
// stable, addressable FlatPhoto below, and the overlay fields so a photo's
// cinematic overlay also plays when it's opened in the lightbox.
interface AlbumForWall {
  _id: string;
  title: string;
  images: {
    _key: string;
    title: string;
    description?: string;
    url: string;
    overlayVideoUrl?: string;
    overlayStyle?: 'fullscreen' | 'container';
  }[];
}

// A single shared empty list for "no album open". A fresh `[]` every render
// would change the overlay effect's dependencies on every render and keep
// resetting its 1-second trigger timer.
const NO_SLIDES: GalleryItem[] = [];

export default function GalleryPage() {
  const OVERLAY_TRIGGER_CHANCE = 0.30;  

  const [topics, setTopics] = useState<Topic[]>([]);
  const [allPhotos, setAllPhotos] = useState<FlatPhoto[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'albums' | 'detailed'>('albums');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [albumIndex, setAlbumIndex] = useState(0);

  // The album coverflow below is built from fixed-px offsets (630px-wide
  // cards, 340/60px translateX steps) tuned for desktop — on a phone
  // viewport that made the front card wider than the screen itself (getting
  // cropped on both edges) while the peeking side cards landed entirely
  // off-screen. Scaling every one of those px values down together via a
  // single `coverflowScale` factor keeps the exact same layout formula (and
  // desktop is unaffected, since the scale is 1 there) while shrinking the
  // whole carousel to fit a narrow viewport instead of redesigning it.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const coverflowScale = isMobile ? 0.44 : 1;

  const [overlayState, setOverlayState] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  const [activeOverlayVideo, setActiveOverlayVideo] = useState<string | null>(null);
  
  // ◄ NEW: Tracks the style choice from Sanity
  const [activeOverlayStyle, setActiveOverlayStyle] = useState<'fullscreen' | 'container'>('fullscreen'); 

  // --- The Silent Memory Bank ---
  const playedVideosRef = useRef<Set<string>>(new Set());
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);

  const playFullscreenWithAudio = async () => {
    const video = fullscreenVideoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
    } catch (error) {
      console.warn('Fullscreen video audio play was blocked until user interaction:', error);
    }
  };

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const data = await client.fetch(`
          {
            "topics": *[_type == "galleryTopic"] | order(_createdAt asc) {
              _id,
              title,
              description,
              "items": coalesce(images[] {
                title,
                description,
                "url": image.asset->url,
                "overlayVideoUrl": overlayVideo.asset->url,
                "overlayStyle": overlayStyle // ◄ Added to fetch query
              }, [])
            },
            "albumsForWall": *[_type == "galleryTopic"] | order(_createdAt asc) {
              _id,
              title,
              "images": coalesce(images[] {
                _key,
                title,
                description,
                "url": image.asset->url,
                "overlayVideoUrl": overlayVideo.asset->url,
                overlayStyle
              }, [])
            }
          }
        `);
        setTopics(data?.topics || []);

        // Flatten every album's images into one addressable list for the
        // "All Photos" detailed view — index is assigned here (not in GROQ)
        // since the drift wall/lightbox need a stable position within the
        // flattened list, not within any one album, for prev/next nav.
        const albumsForWall: AlbumForWall[] = data?.albumsForWall || [];
        let runningIndex = 0;
        const flattened: FlatPhoto[] = [];
        for (const album of albumsForWall) {
          for (const image of album.images) {
            flattened.push({
              key: `${album._id}-${image._key}`,
              index: runningIndex++,
              url: image.url,
              title: image.title,
              description: image.description,
              albumId: album._id,
              albumTitle: album.title,
              overlayVideoUrl: image.overlayVideoUrl,
              overlayStyle: image.overlayStyle,
            });
          }
        }
        setAllPhotos(flattened);
      } catch (error) {
        console.error("Failed to fetch gallery data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGalleryData();
  }, []);

  const getTopicCover = (topic: Topic) => {
    return topic.items && topic.items.length > 0 ? topic.items[0].url : null;
  };

  const numTopics = topics.length;

  const nextAlbum = () => setAlbumIndex(prev => (prev + 1) % numTopics);
  const prevAlbum = () => setAlbumIndex(prev => (prev - 1 + numTopics) % numTopics);

  const getOffset = (index: number) => {
    let offset = index - albumIndex;
    if (numTopics > 2) {
      if (offset > Math.floor(numTopics / 2)) offset -= numTopics;
      if (offset < -Math.floor(numTopics / 2)) offset += numTopics;
    }
    return offset;
  };

  const activeTopic = topics.find(t => t._id === activeTopicId);
  const filteredSlides = activeTopic && activeTopic.items ? activeTopic.items : NO_SLIDES;

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? filteredSlides.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === filteredSlides.length - 1 ? 0 : prev + 1));

  const openTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setCurrentIndex(0); 
  };
  const closeTopic = () => {
    setActiveTopicId(null);
    setOverlayState('hidden'); 
  };

  // The photo whose overlay is currently eligible to play: the photo open in
  // the lightbox (the "All Photos" wall), otherwise the current album slide.
  // Both feed the same trigger below, so they share the same rules and the
  // same played-videos memory — a video that already played in one view stays
  // used in the other.
  const overlaySource = lightboxIndex !== null ? allPhotos[lightboxIndex] : filteredSlides[currentIndex];
  const overlaySourceKey = lightboxIndex !== null ? `wall-${lightboxIndex}` : `album-${activeTopicId}-${currentIndex}`;
  const sourceVideoUrl = overlaySource?.overlayVideoUrl;
  const sourceStyle = overlaySource?.overlayStyle;

  // Ends the current overlay: fade out, then clear it.
  const finishOverlay = () => {
    setOverlayState('fading');
    setTimeout(() => {
      setOverlayState('hidden');
      setActiveOverlayVideo(null);
    }, 1000);
  };

  // --- Smart Video Trigger Logic with Memory ---
  useEffect(() => {
    let triggerTimer: NodeJS.Timeout;

    setOverlayState('hidden');
    setActiveOverlayVideo(null);

    if (sourceVideoUrl && !playedVideosRef.current.has(sourceVideoUrl)) {
      triggerTimer = setTimeout(() => {
        const shouldTriggerOverlay = Math.random() < OVERLAY_TRIGGER_CHANCE;
        if (!shouldTriggerOverlay) {
          return;
        }

        // ◄ Read the specific style for this picture (default to fullscreen if empty)
        setActiveOverlayStyle(sourceStyle || 'fullscreen');
        setActiveOverlayVideo(sourceVideoUrl);
        setOverlayState('visible');

        playedVideosRef.current.add(sourceVideoUrl);
      }, 1000);
    }

    return () => {
      clearTimeout(triggerTimer);
    };
  }, [overlaySourceKey, sourceVideoUrl, sourceStyle, OVERLAY_TRIGGER_CHANCE]);

  useEffect(() => {
    if (overlayState === 'visible' && activeOverlayVideo && activeOverlayStyle === 'fullscreen') {
      void playFullscreenWithAudio();
    }
  }, [overlayState, activeOverlayVideo, activeOverlayStyle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // GalleryLightbox installs its own Escape/ArrowLeft/ArrowRight
      // listener while open — bail out here so the two don't double-fire
      // on the same keypress.
      if (lightboxIndex !== null) return;

      if (!activeTopicId && viewMode === 'albums') {
        if (e.key === "ArrowLeft") prevAlbum();
        if (e.key === "ArrowRight") nextAlbum();
        if (e.key === "Enter" && topics.length > 0) openTopic(topics[albumIndex]._id);
      } else if (activeTopicId && filteredSlides.length > 0) {
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "ArrowRight") nextSlide();
        if (e.key === "Escape") closeTopic();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTopicId, filteredSlides.length, albumIndex, topics, viewMode, lightboxIndex]);

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <Navbar />
        <main className="page-container flex items-center justify-center min-h-[60vh]">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-widest animate-pulse">Loading Archives...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="content-wrapper" style={{ overflow: 'visible' }}>
      <Navbar />

      <main className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', overflow: 'visible' }}>
        
        <h1 className="page-title text-center mb-4">Gallery</h1>

        {!activeTopicId ? (
          <div className="albums-view animate-fade-in mt-2 flex flex-col items-center select-none w-full" style={{ overflow: 'visible' }}>
            <div
              className="flex mx-auto mb-6"
              style={{
                maxWidth: 'fit-content',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              }}
            >
              <button
                onClick={() => setViewMode('albums')}
                aria-label="Albums view"
                aria-pressed={viewMode === 'albums'}
                title="Albums"
                style={{
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: viewMode === 'albums' ? 'rgba(229, 114, 159, 0.15)' : 'transparent',
                  color: viewMode === 'albums' ? '#e5729f' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                <FiLayers size={14} />
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                aria-label="All photos view"
                aria-pressed={viewMode === 'detailed'}
                title="All Photos"
                style={{
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  background: viewMode === 'detailed' ? 'rgba(229, 114, 159, 0.15)' : 'transparent',
                  color: viewMode === 'detailed' ? '#e5729f' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                <FiGrid size={14} />
              </button>
            </div>

            {viewMode === 'detailed' ? (
              <div className="w-full" style={{ maxWidth: '1200px', marginTop: '1rem' }}>
                <GalleryDriftWall items={allPhotos} onSelect={setLightboxIndex} isPaused={lightboxIndex !== null} />
              </div>
            ) : (
              <>
            <p className="text-center text-white/50 text-sm font-mono tracking-widest mb-10">Select an Album to Explore</p>

            {topics.length === 0 ? (
              <p className="text-center text-white/30 italic">No albums created yet.</p>
            ) : (
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '1200px',
                height: isMobile ? '360px' : '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1rem',
                overflow: 'visible'
              }}>
                
                <button
                  onClick={prevAlbum}
                  style={{
                    position: 'absolute',
                    left: isMobile ? '2px' : '10px',
                    zIndex: 9999,
                    width: isMobile ? '40px' : '64px',
                    height: isMobile ? '40px' : '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5729f'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: isMobile ? '20px' : '32px', height: isMobile ? '20px' : '32px', transform: 'translateX(-2px)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <button
                  onClick={nextAlbum}
                  style={{
                    position: 'absolute',
                    right: isMobile ? '2px' : '10px',
                    zIndex: 9999,
                    width: isMobile ? '40px' : '64px',
                    height: isMobile ? '40px' : '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5729f'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: isMobile ? '20px' : '32px', height: isMobile ? '20px' : '32px', transform: 'translateX(2px)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {topics.map((topic, i) => {
                  const offset = getOffset(i);
                  const absOffset = Math.abs(offset);
                  const isFront = absOffset === 0;
                  
                  const sign = Math.sign(offset);
                  const translateX = (sign * 340 + (sign * absOffset * 60)) * coverflowScale;
                  const translateZ = -absOffset * 300 * coverflowScale;
                  const rotateY = sign * -25;

                  const coverUrl = getTopicCover(topic);

                  return (
                    <div
                      key={topic._id}
                      onClick={() => isFront ? openTopic(topic._id) : setAlbumIndex(i)}
                      style={{
                        position: 'absolute',
                        top: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        width: isMobile ? '278px' : '630px',
                        transition: 'all 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
                        transform: `perspective(1200px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                        zIndex: 50 - absOffset,
                        opacity: isFront ? 1 : Math.max(0.6 - (absOffset * 0.2), 0),
                        visibility: absOffset > 2 ? 'hidden' : 'visible'
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: 'black',
                        boxShadow: isFront ? '0 25px 60px rgba(229,114,159,0.3)' : '0 15px 50px rgba(0,0,0,0.9)',
                        transform: isFront ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.5s ease-out'
                      }}>
                        {coverUrl ? (
                          <>
                            <img 
                              src={coverUrl} 
                              alt={topic.title} 
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent, transparent)', opacity: 0.7, zIndex: 10, pointerEvents: 'none' }} />
                          </>
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'monospace' }}>NO DATA</span>
                          </div>
                        )}
                      </div>

                      <div style={{
                        textAlign: 'center',
                        width: '100%',
                        padding: '0 8px',
                        marginTop: isMobile ? '14px' : '24px',
                        opacity: isFront ? 1 : 0,
                        transition: 'opacity 0.5s ease-out'
                      }}>
                        <h3 style={{ color: '#e5729f', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: isMobile ? '15px' : '24px', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                          {topic.title}
                        </h3>
                        {topic.description && (
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '11px' : '14px', fontFamily: 'monospace', marginTop: isMobile ? '6px' : '12px', lineHeight: 1.5 }}>
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>

        ) : (

          <div className="viewer-view animate-fade-in mt-4">
            
          <div className="flex items-center justify-between mb-8 px-4 w-full">
            <div className="flex-1 flex justify-start">
              <button 
                onClick={closeTopic}
                className="group inline-flex items-center text-[#9ca3af] hover:text-white transition-colors duration-200 uppercase tracking-[2px] font-bold text-[11px] bg-transparent border-none cursor-pointer outline-none p-0"
              >
                <span className="text-[16px] mr-3 leading-none group-hover:-translate-x-1 transition-transform duration-200">
                  ←
                </span> 
                Back To Gallery
              </button>
            </div>

            <div className="flex-1 flex justify-center">
              <h2 className="text-xl md:text-3xl font-serif font-bold text-white tracking-wide drop-shadow-lg text-center m-0">
                {activeTopic?.title}
              </h2>
            </div>
            <div className="flex-1"></div> 
          </div>

            {filteredSlides.length === 0 ? (
              <div className="status-box p-12 flex flex-col items-center justify-center text-center">
                <p className="text-white/40 italic font-serif text-lg">This album is empty.</p>
              </div>
            ) : (
              <>
                <div className="gallery-wrapper">
                  <button onClick={prevSlide} className="gallery-control-btn left">&#10094;</button>

                  <div className="gallery-slide-window-dynamic">
                    <div 
                      className="gallery-track"
                      style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                      {filteredSlides.map((slide, index) => (
                        <div key={index} className="gallery-slide" style={{ display: 'flex', justifyContent: 'center' }}>
                          
                          {/* ◄ NEW: Container for the localized overlay */}
                          <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <img src={slide.url} alt={slide.title} className="gallery-image" />
                            
                            {/* STYLE 1: THE IN-BOX CONTAINER OVERLAY */}
                            {lightboxIndex === null && currentIndex === index && overlayState !== 'hidden' && activeOverlayVideo && activeOverlayStyle === 'container' && (
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0, left: 0, right: 0, bottom: 0,
                                  zIndex: 50,
                                  pointerEvents: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: overlayState === 'visible' ? 1 : 0,
                                  transition: 'opacity 1s ease-in-out',
                                  backgroundColor: overlayState === 'visible' ? 'rgba(0,0,0,0.5)' : 'transparent',
                                  borderRadius: '16px', // Should match your CSS .gallery-image borders
                                  overflow: 'hidden'
                                }}
                              >
                                <video 
                                  key={`container-vid-${currentIndex}`}
                                  src={activeOverlayVideo} 
                                  autoPlay
                                  playsInline
                                  
                                  onEnded={finishOverlay}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: 0.85
                                  }}
                                />
                              </div>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={nextSlide} className="gallery-control-btn right">&#10095;</button>
                </div>

                <div className="gallery-meta text-center mt-6">
                <h3 className="text-lg font-bold text-white/90">
                  {filteredSlides[currentIndex]?.title}
                </h3>
                
                {filteredSlides[currentIndex]?.description && (
                  <p className="text-white/50 text-xs font-mono mt-2 max-w-md mx-auto leading-relaxed">
                    {filteredSlides[currentIndex].description}
                  </p>
                )}

                <div className="gallery-dots mt-4">
                  {filteredSlides.map((_, index) => (
                    <span 
                      key={index} 
                      onClick={() => setCurrentIndex(index)}
                      className={`dot ${currentIndex === index ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </main>

      <GalleryLightbox
        photos={allPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        // STYLE 1 for the lightbox: plays inside the lightbox's picture box.
        containerOverlay={
          lightboxIndex !== null && overlayState !== 'hidden' && activeOverlayVideo && activeOverlayStyle === 'container'
            ? { videoUrl: activeOverlayVideo, visible: overlayState === 'visible', onEnded: finishOverlay }
            : null
        }
      />

      {/* =========================================
          STYLE 2: THE GLOBAL FULL-SCREEN OVERLAY
          ========================================= */}
      {overlayState !== 'hidden' && activeOverlayVideo && activeOverlayStyle === 'fullscreen' && (() => {
        const overlay = (
        <div
          onClick={() => {
            void playFullscreenWithAudio();
          }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            // One above GalleryLightbox (999999), which is mounted later in
            // the DOM and would otherwise cover this when it's open.
            zIndex: 1000000,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: overlayState === 'visible' ? 1 : 0,
            transition: 'opacity 1s ease-in-out', 
            backgroundColor: overlayState === 'visible' ? 'rgba(0,0,0,0.5)' : 'transparent', 
          }}
        >
          <video 
            ref={fullscreenVideoRef}
            key={`global-vid-${overlaySourceKey}`}
            src={activeOverlayVideo} 
            autoPlay
            playsInline
            onLoadedData={() => {
              void playFullscreenWithAudio();
            }}
            
            onEnded={finishOverlay}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.85
            }}
          />
        </div>
        );
        // This page's wrapper (.content-wrapper, z-index 1) is its own
        // stacking context, so no z-index in here can rise above the
        // lightbox, which is a portal on <body>. While the lightbox is open,
        // render the overlay on <body> too so it actually covers it; in the
        // album view it stays exactly where it always was.
        return lightboxIndex !== null ? createPortal(overlay, document.body) : overlay;
      })()}

    </div>
  );
}