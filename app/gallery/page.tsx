'use client';

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function GalleryPage() {
  const slides = [
    { url: "https://picsum.photos/id/10/1200/600", title: "Artwork Log 01", desc: "Forest Wow" },
    { url: "https://picsum.photos/id/29/1200/600", title: "Artwork Log 02", desc: "Me with the Boys." },
    { url: "https://picsum.photos/id/48/1200/600", title: "Artwork Log 03", desc: "Imagine Studying Computer Science." },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  // --- NEW: Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]); // Dependency ensures the latest index is used

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Gallery</h1>

        <div className="gallery-wrapper">
          <button onClick={prevSlide} className="gallery-control-btn left" aria-label="Previous Slide">
            &#10094;
          </button>

          <div className="gallery-slide-window">
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

          <button onClick={nextSlide} className="gallery-control-btn right" aria-label="Next Slide">
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
                // Added a cursor-pointer class for better UI feedback
                className={`dot ${currentIndex === index ? 'active' : ''} cursor-pointer hover:bg-white/50 transition-all`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}