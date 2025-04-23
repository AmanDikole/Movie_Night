import { useRef, useState, useEffect } from "react";

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

interface ToolTipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom';
}

// A reusable tooltip component for buttons
const Tooltip = ({ children, text, position = 'top' }: ToolTipProps) => {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
        {text}
      </div>
    </div>
  );
};

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
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Handle clicking on progress bar
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
  
  // Handle hovering over progress bar
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const hoverX = e.clientX - rect.left;
      const percentHovered = hoverX / rect.width;
      const hoverTimeValue = duration * percentHovered;
      
      setHoverTime(hoverTimeValue);
      setHoverPosition(hoverX);
    }
  };
  
  // Handle mouse leaving progress bar
  const handleProgressLeave = () => {
    setHoverTime(null);
  };
  
  // Handle seeking backward and forward
  const handleSeekBackward = () => {
    if (!isHost) return;
    onSeek(Math.max(0, currentTime - 10));
  };
  
  const handleSeekForward = () => {
    if (!isHost) return;
    onSeek(Math.min(duration, currentTime + 10));
  };
  
  // Handle volume slider
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const volumeBar = volumeBarRef.current;
    if (volumeBar) {
      const rect = volumeBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
      onVolumeChange(newVolume);
    }
  };
  
  // Handle mouse down on progress bar for dragging
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost) return;
    setIsDragging(true);
    handleProgressClick(e);
    
    // Add document-wide event listeners for dragging
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };
  
  // Handle document mouse move for dragging
  const handleDocumentMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentMoved = Math.max(0, Math.min(1, moveX / rect.width));
    const seekTime = duration * percentMoved;
    
    // Update hover time for preview
    setHoverTime(seekTime);
    setHoverPosition(moveX);
    
    // Do not update player position constantly during drag to avoid jank
    // We'll do the final seek on mouse up
  };
  
  // Handle document mouse up to end dragging
  const handleDocumentMouseUp = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const releaseX = e.clientX - rect.left;
    const percentReleased = Math.max(0, Math.min(1, releaseX / rect.width));
    const seekTime = duration * percentReleased;
    
    // Seek to the final position
    onSeek(seekTime);
    
    // End dragging
    setIsDragging(false);
    
    // Remove document-wide event listeners
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className={`video-overlay absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="space-y-4 mb-2">
        {/* Progress bar with hover preview */}
        <div className="relative">
          {/* Hover time preview */}
          {hoverTime !== null && (
            <div 
              className="absolute -top-8 px-2 py-1 bg-black/80 text-white text-xs rounded transform -translate-x-1/2 pointer-events-none"
              style={{ left: hoverPosition }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          
          {/* Progress bar container */}
          <div 
            ref={progressRef}
            className="relative h-3 w-full cursor-pointer group rounded-full overflow-hidden bg-gray-700/60"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            onMouseDown={handleProgressMouseDown}
          >
            {/* Buffered part */}
            <div 
              className="absolute top-0 left-0 h-full bg-gray-500/60"
              style={{ width: `${100}%` }} // Replace with actual buffered percentage when available
            ></div>
            
            {/* Played part */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            ></div>
            
            {/* Hover effect - shows on hover */}
            <div 
              className="absolute top-0 left-0 h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ width: hoverTime !== null ? `${(hoverTime / duration) * 100}%` : '0%' }}
            ></div>
            
            {/* Seek handle */}
            <div 
              className={`absolute top-1/2 h-5 w-5 bg-primary rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-md transition-opacity duration-200 ${isDragging || isVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ left: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Controls bar */}
        <div className="flex items-center justify-between">
          {/* Left side controls */}
          <div className="flex items-center space-x-4">
            {/* Play/Pause button */}
            <Tooltip text={isPlaying ? "Pause" : "Play"}>
              <button 
                className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-primary transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                onClick={onPlayPause}
                disabled={!isHost}
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-white`}></i>
              </button>
            </Tooltip>
            
            {/* Seek backward */}
            <Tooltip text="Seek -10s">
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                onClick={handleSeekBackward}
                disabled={!isHost}
              >
                <i className="fas fa-backward text-white text-sm"></i>
              </button>
            </Tooltip>
            
            {/* Seek forward */}
            <Tooltip text="Seek +10s">
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 transition ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                onClick={handleSeekForward}
                disabled={!isHost}
              >
                <i className="fas fa-forward text-white text-sm"></i>
              </button>
            </Tooltip>
            
            {/* Time display */}
            <div className="text-sm text-white hidden sm:block font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/60 mx-1">/</span>
              <span className="text-white/60">{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Volume control */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Tooltip text={isMuted ? "Unmute" : "Mute"}>
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 transition"
                  onClick={onToggleMute}
                >
                  <i className={`fas ${isMuted ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-white text-sm`}></i>
                </button>
              </Tooltip>
              
              {/* Volume slider - shown on hover */}
              <div 
                className={`absolute -left-12 bottom-full mb-2 p-2 bg-black/70 rounded transition-opacity duration-200 ${showVolumeSlider ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ width: '100px' }}
              >
                <div 
                  ref={volumeBarRef}
                  className="h-1.5 bg-gray-600 rounded-full cursor-pointer"
                  onClick={handleVolumeClick}
                >
                  <div 
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fullscreen button */}
            <Tooltip text="Fullscreen">
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 transition"
                onClick={onFullScreen}
              >
                <i className="fas fa-expand text-white text-sm"></i>
              </button>
            </Tooltip>
          </div>
        </div>
        
        {/* Host-only message */}
        {!isHost && (
          <div className="text-center text-xs text-gray-400 mt-1 py-1.5 bg-black/30 rounded">
            <span><i className="fas fa-info-circle mr-1"></i> Only the host can control playback</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoControls;
