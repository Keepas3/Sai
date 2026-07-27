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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // Default to 50% volume

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
      audioRef.current = null;
    };
  }, [track]); // Only recreate audio if track changes

  // Sync volume state with the actual audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current || !track) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.currentTime < (track.loopStart || 0)) {
        audioRef.current.currentTime = track.loopStart || 0;
      }
      
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Autoplay blocked:', err));
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