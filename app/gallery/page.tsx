'use client'; // Required for tracking the active slide state

import React, { useState } from "react";
import Navbar from "@/components/Navbar";

export default function GalleryPage() {
  // 1. Array of placeholder images and captions
  const slides = [
    { url: "https://picsum.photos/id/10/1200/600", title: "Artwork Log 01", desc: "Forest Wow" },
    { url: "https://picsum.photos/id/29/1200/600", title: "Artwork Log 02", desc: "Me with the Boys." },
    { url: "https://picsum.photos/id/48/1200/600", title: "Artwork Log 03", desc: "Imagine Studying Computer Science." },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // 2. Navigation handlers
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Gallery</h1>

        {/* --- Main Gallery Display Component --- */}
        <div className="gallery-wrapper">
          
          {/* Left Arrow Control */}
          <button onClick={prevSlide} className="gallery-control-btn left">
            &#10094;
          </button>

          {/* Slide Window */}
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

          {/* Right Arrow Control */}
          <button onClick={nextSlide} className="gallery-control-btn right">
            &#10095;
          </button>

        </div>

        {/* --- Dynamic Text Content --- */}
        <div className="gallery-meta text-center mt-6">
          <h2 className="text-2xl font-bold font-serif text-white/90">
            {slides[currentIndex].title}
          </h2>
          <p className="text-white/60 text-sm mt-2">
            {slides[currentIndex].desc}
          </p>
          
          {/* Indicator Dots */}
          <div className="gallery-dots mt-4">
            {slides.map((_, index) => (
              <span 
                key={index} 
                onClick={() => setCurrentIndex(index)}
                className={`dot ${currentIndex === index ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}