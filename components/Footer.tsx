'use client';

import React, { useEffect, useState } from 'react';
import { client } from '@/sanity/lib/client';

interface ZenQuote {
  text: string;
  author?: string;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const [quotes, setQuotes] = useState<ZenQuote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleSeconds, setCycleSeconds] = useState(10); 
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await client.fetch(`*[_type == "footerSettings"][0] { cycleInterval, zenQuotes }`);
        
        if (data?.zenQuotes && data.zenQuotes.length > 0) {
          setQuotes(data.zenQuotes);
          if (data.cycleInterval) setCycleSeconds(data.cycleInterval);
          
          setCurrentIndex(Math.floor(Math.random() * data.zenQuotes.length));
          setTimeout(() => setIsVisible(true), 150);
        }
      } catch (error) {
        console.error("Failed to fetch zen quotes:", error);
      }
    };

    fetchFooterData();
  }, []);

  // 2. The Random Cycling Timer Engine
  useEffect(() => {
    if (quotes.length <= 1) return;

    const intervalId = setInterval(() => {
      // Step A: Fade Out
      setIsVisible(false);
      
      // Step B: Wait for fade, then pick a random quote
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          let nextIndex = Math.floor(Math.random() * quotes.length);
          
          // Safeguard: Ensure the new random quote isn't the exact same as the last one
          while (nextIndex === prevIndex) {
            nextIndex = Math.floor(Math.random() * quotes.length);
          }
          
          return nextIndex;
        });
        
        // Step C: Fade In
        setIsVisible(true);
      }, 700); 

    }, cycleSeconds * 1000);

    return () => clearInterval(intervalId);
  }, [quotes, cycleSeconds]);

  const activeQuote = quotes[currentIndex];

  return (
    <footer className="site-footer">
      
      <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-6">
        
        {/* --- The Ambient Zen Quote --- */}
        <div 
          className={`transition-opacity duration-700 ease-in-out flex flex-col items-center justify-center min-h-[80px] w-full ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeQuote ? (
            <>
              <p className="font-serif text-lg md:text-xl text-[#f2e6e9] italic leading-relaxed tracking-wide drop-shadow-md m-0">
                "{activeQuote.text}"
              </p>
              {activeQuote.author && (
                <span 
                  
                  className="block text-[11px] uppercase tracking-[0.1em] text-[#e5729f] mt-8 not-italic"
                  style={{ fontFamily: '"Bahnschrift", sans-serif' }}
                >
                  — {activeQuote.author}
                </span>
              )}
            </>
          ) : (
            <div className="w-1 h-1 bg-transparent" />
          )}
        </div>

        {/* --- Copyright --- */}
        <div className="w-full flex justify-center mt-2">
          <p className="text-[11px] font-mono tracking-widest text-[#b3a1a6] uppercase m-0">
            © {currentYear} Sai. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}