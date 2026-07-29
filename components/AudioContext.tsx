'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface TrackData {
  title: string;
  artist?: string;
  audioUrl: string;
  loopStart: number; 
  loopEnd: number;   
}

interface AudioContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  track: TrackData | null;
  volume: number;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({
  children,
  track,
}: {
  children: React.ReactNode;
  track: TrackData | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const fadeTokenRef = useRef(0);
  const volumeRef = useRef(0.5);
  const isFadingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // Default to 50% volume

  const cancelCurrentFade = () => {
    fadeTokenRef.current += 1;
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
    isFadingRef.current = false;
  };

  const fadeToVolume = (toVolume: number, duration = 500) => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();

    const localToken = fadeTokenRef.current + 1;
    fadeTokenRef.current = localToken;

    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }

    const fromVolume = audio.volume;
    const start = performance.now();
    isFadingRef.current = true;

    return new Promise<void>((resolve) => {
      const step = (timestamp: number) => {
        if (fadeTokenRef.current !== localToken) {
          isFadingRef.current = false;
          resolve();
          return;
        }

        const progress = Math.min((timestamp - start) / duration, 1);
        audio.volume = fromVolume + (toVolume - fromVolume) * progress;

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
          return;
        }

        fadeFrameRef.current = null;
        isFadingRef.current = false;
        resolve();
      };

      fadeFrameRef.current = requestAnimationFrame(step);
    });
  };

  const fadeIn = async (duration = 500) => {
    const audio = audioRef.current;
    if (!audio) return;

    cancelCurrentFade();
    audio.volume = 0;
    await audio.play();
    await fadeToVolume(volumeRef.current, duration);
  };

  const fadeOut = async (duration = 500) => {
    const audio = audioRef.current;
    if (!audio) return;

    cancelCurrentFade();
    await fadeToVolume(0, duration);
    audio.pause();
    audio.volume = volumeRef.current;
  };
  useEffect(() => {
    if (!track?.audioUrl) return;

    const audio = new Audio(track.audioUrl);
    audio.volume = volume; // Set initial volume
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !track) return;
      
      const currentTime = audioRef.current.currentTime;
      if (track.loopEnd > 0 && currentTime >= track.loopEnd) {
        audioRef.current.currentTime = track.loopStart || 0;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      cancelCurrentFade();
      audioRef.current = null;
    };
  }, [track]); // Only recreate audio if track changes

  // Sync volume state with the actual audio element
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current && !isFadingRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current || !track) return;

    const audio = audioRef.current;
    if (isPlaying) {
      await fadeOut(500);
      setIsPlaying(false);
    } else {
      if (audio.currentTime < (track.loopStart || 0)) {
        audio.currentTime = track.loopStart || 0;
      }

      try {
        await fadeIn(500);
        setIsPlaying(true);
      } catch (err) {
        console.warn('Autoplay blocked:', err);
      }
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, togglePlay, track, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};