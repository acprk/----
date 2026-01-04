import React, { createContext, useContext, useState } from 'react';

const MusicContext = createContext();

export const useMusic = () => {
  return useContext(MusicContext);
};

export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (song) => {
    // If it's the same song, just toggle play status
    if (currentSong?.id === song.id) {
        setIsPlaying(!isPlaying);
    } else {
        // New song
        setCurrentSong(song);
        setIsPlaying(true);
    }
  };

  const pauseSong = () => {
    setIsPlaying(false);
  };

  const resumeSong = () => {
    if (currentSong) setIsPlaying(true);
  };

  const closePlayer = () => {
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const value = {
    currentSong,
    isPlaying,
    playSong,
    pauseSong,
    resumeSong,
    closePlayer,
    setIsPlaying // Expose setter for finer control if needed
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
