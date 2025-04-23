import { useRef } from "react";

interface VideoControlsProps {
  isVisible: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isHost: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onFullScreen: () => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
};

const VideoControls = ({
  isVisible,
  isPlaying,
  duration,
  currentTime,
  volume,
  isMuted,
  isHost,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onFullScreen
}: VideoControlsProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost) return;
    
    const progressBar = progressRef.current;
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentClicked = clickX / rect.width;
      const seekTime = duration * percentClicked;
      onSeek(seekTime);
    }
  };
  
  const handleSeekBackward = () => {
    if (!isHost) return;
    onSeek(Math.max(0, currentTime - 10));
  };
  
  const handleSeekForward = () => {
    if (!isHost) return;
    onSeek(Math.min(duration, currentTime + 10));
  };

  return (
    <div 
      className={`video-overlay absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity
        ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="space-y-3 mb-2">
        <div 
          ref={progressRef}
          className="progress-bar h-2 w-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="progress-filled h-full rounded-md"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              className={`text-white hover:text-primary focus:outline-none transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
              onClick={onPlayPause}
              disabled={!isHost}
            >
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
            </button>
            <button 
              className={`text-white hover:text-primary focus:outline-none transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
              onClick={handleSeekBackward}
              disabled={!isHost}
            >
              <i className="fas fa-backward text-lg"></i>
            </button>
            <button 
              className={`text-white hover:text-primary focus:outline-none transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
              onClick={handleSeekForward}
              disabled={!isHost}
            >
              <i className="fas fa-forward text-lg"></i>
            </button>
            <div className="text-sm text-gray-200 hidden sm:block">
              <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <button 
                className="text-white hover:text-primary focus:outline-none transition"
                onClick={onToggleMute}
              >
                <i className={`fas ${isMuted ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-lg`}></i>
              </button>
              <div className="w-16 h-1 bg-gray-600 rounded-full hidden sm:block">
                <div 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${volume * 100}%` }}
                ></div>
              </div>
            </div>
            <button 
              className="text-white hover:text-primary focus:outline-none transition"
              onClick={onFullScreen}
            >
              <i className="fas fa-expand text-lg"></i>
            </button>
          </div>
        </div>
        
        {!isHost && (
          <div className="text-center text-xs text-gray-400 mt-1">
            <span>Only the host can control playback</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoControls;
