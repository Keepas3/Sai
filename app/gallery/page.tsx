'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

// 1. Define what a slide looks like for TypeScript
interface Slide {
  title: string;
  description: string;
  url: string;
}

export default function GalleryPage() {
  // 2. Set up state for your Sanity data and a loading screen
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // --- Mobile Swipe State Tracking ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // 3. Fetch data from Sanity when the page loads
  // 3. Fetch data from Sanity matching your custom drag-and-drop panel sequence
 useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        // Fetches your single layout page container document, grabbing its slides array
        const data = await client.fetch(`
          *[_type == "galleryPageContent"] | order(_updatedAt desc)[0].slides[] {
            title,
            description,
            "url": image.asset->url
          }
        `);
        
        setSlides(data || []);
      } catch (error) {
        console.error("Failed to fetch gallery data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  // --- Keyboard Navigation (Desktop) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, slides.length]); // Added slides.length as a dependency

  // --- Mobile Swipe Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null); 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50; 

    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();

    setTouchStartX(null);
    setTouchEndX(null);
  };

  // 4. Show a loading state while fetching from Sanity
  if (isLoading) {
    return (
      <div className="content-wrapper">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <h2 className="text-white text-2xl font-serif">Loading Artwork...</h2>
        </main>
      </div>
    );
  }

  // 5. If no slides exist in the database, show a friendly message
  if (slides.length === 0) {
    return (
      <div className="content-wrapper">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <h2 className="text-white text-2xl font-serif">No pictures found. Add some in Sanity Studio!</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Gallery</h1>

        <div className="gallery-wrapper">
          
          {/* --- LEFT BUTTON --- */}
          <button 
            onClick={prevSlide}
            className="gallery-control-btn left" 
            aria-label="Previous Slide"
          >
            &#10094;
          </button>

          {/* --- THE IMAGE WINDOW --- */}
          <div 
            className="gallery-slide-window"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="gallery-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="gallery-slide">
                  <img src={slide.url} alt={slide.title} className="gallery-image" />
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT BUTTON --- */}
          <button 
            onClick={nextSlide}
            className="gallery-control-btn right" 
            aria-label="Next Slide"
          >
            &#10095;
          </button>
        </div>

        <div className="gallery-meta text-center mt-6">
          <h2 className="text-2xl font-bold font-serif text-white/90">
            {slides[currentIndex]?.title}
          </h2>
          <p className="text-white/60 text-sm mt-2">
            {/* Note: Changed this from slide.desc to slide.description to match your Sanity schema! */}
            {slides[currentIndex]?.description} 
          </p>
          
          <div className="gallery-dots mt-4">
            {slides.map((_, index) => (
              <span 
                key={index} 
                onClick={() => setCurrentIndex(index)}
                className={`dot ${currentIndex === index ? 'active' : ''} cursor-pointer hover:bg-white/50 transition-all`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}