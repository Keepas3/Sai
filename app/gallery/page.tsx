'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function GalleryPage() {
  const slides = [
    { url: "https://picsum.photos/id/10/1200/600", title: "Artwork Log 01", desc: "Forest is cool" },
    { url: "https://picsum.photos/id/29/1200/600", title: "Artwork Log 02", desc: "Me with the Boys." },
    { url: "https://picsum.photos/id/48/1200/600", title: "Artwork Log 03", desc: "Imagine Studying Computer Science." },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // --- Mobile Swipe State Tracking ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

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
  }, [currentIndex]); 

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

    if (distance > minSwipeDistance) {
      nextSlide();
    }
    
    if (distance < -minSwipeDistance) {
      prevSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

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
            {slides[currentIndex].title}
          </h2>
          <p className="text-white/60 text-sm mt-2">
            {slides[currentIndex].desc}
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