import { useState, useEffect, useRef } from "react";
import { PlaybackState } from "@shared/schema";

interface UseVideoProps {
  url: string;
  initialPlaybackState?: PlaybackState | null;
  onPlaybackChange: (state: { isPlaying: boolean; currentTime: number }) => void;
  isHost: boolean;
}

const useVideo = ({
  url,
  initialPlaybackState,
  onPlaybackChange,
  isHost,
}: UseVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const playerRef = useRef<any>(null);
  
  // Sync with initial playback state from server
  useEffect(() => {
    if (initialPlaybackState) {
      setIsPlaying(initialPlaybackState.isPlaying);
      
      // Seek to the current time if we have a player reference
      if (playerRef.current && initialPlaybackState.currentTime > 0) {
        playerRef.current.seekTo(initialPlaybackState.currentTime / 1000);
      }
    }
  }, [initialPlaybackState, playerRef.current]);
  
  // Control handlers
  const handlePlayPause = () => {
    if (!isHost) return;
    
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    onPlaybackChange({
      isPlaying: newIsPlaying,
      currentTime: Math.floor(currentTime * 1000),
    });
  };
  
  const handleSeek = (seconds: number) => {
    if (!isHost) return;
    
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      
      onPlaybackChange({
        isPlaying,
        currentTime: Math.floor(seconds * 1000),
      });
    }
  };
  
  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  return {
    playerRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    isBuffering,
    setIsBuffering,
    handlePlayPause,
    handleSeek,
    handleProgress,
    handleDuration,
    handleVolumeChange,
    handleToggleMute,
  };
};

export default useVideo;
