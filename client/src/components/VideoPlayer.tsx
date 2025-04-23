import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import ReactPlayerYoutube from "react-player/youtube";
import { PlaybackState } from "@shared/schema";
import VideoControls from "./VideoControls";
import { toast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  url: string;
  initialPlaybackState?: PlaybackState | null;
  onPlaybackChange: (state: { isPlaying: boolean; currentTime: number }) => void;
  isHost: boolean;
}

// Helper function to ensure we have a valid YouTube embed URL
const getProperYoutubeUrl = (url: string): string => {
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Extract video ID from watch URL
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Extract video ID from shortened URL
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // If we couldn't parse it, return the original URL
  return url;
};

const VideoPlayer = ({
  url,
  initialPlaybackState,
  onPlaybackChange,
  isHost,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoUrl, setVideoUrl] = useState(url);
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Show/hide controls on mouse movement
  useEffect(() => {
    let timeoutId: number | null = null;
    
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      
      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      };
    }
  }, [isPlaying]);
  
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
  
  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  
  // Process and update video URL when it changes
  useEffect(() => {
    try {
      if (url) {
        const processedUrl = getProperYoutubeUrl(url);
        console.log("Original URL:", url);
        console.log("Processed URL:", processedUrl);
        setVideoUrl(processedUrl);
      }
      // Reset buffering state when URL changes
      setIsBuffering(true);
    } catch (error) {
      console.error("Error processing video URL:", error);
      // Keep the original URL if there's an error
      setVideoUrl(url);
    }
  }, [url]);
  
  // Handle player errors
  const handlePlayerError = (error: any) => {
    console.error("Video player error:", error);
    setIsBuffering(false);
    toast({
      title: "Video Error",
      description: "There was a problem loading the video. Please check the URL and try again.",
      variant: "destructive",
    });
  };
  
  // Handle player ready state
  const handlePlayerReady = () => {
    console.log("Video player is ready");
    setIsBuffering(false);
    
    // Start playing if we're supposed to be playing
    if (isPlaying && playerRef.current) {
      playerRef.current.getInternalPlayer()?.playVideo?.();
    }
  };
  
  return (
    <div
      ref={containerRef}
      className="video-container relative flex-1 flex items-center justify-center bg-black"
    >
      {videoUrl && (
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          onDuration={handleDuration}
          onProgress={handleProgress}
          onBuffer={() => setIsBuffering(true)}
          onBufferEnd={() => setIsBuffering(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReady={handlePlayerReady}
          onError={handlePlayerError}
          style={{ position: "absolute", top: 0, left: 0 }}
          controls={false}
          playsinline={true}
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-black">
              <p className="text-white">Unable to load video player</p>
            </div>
          }
          config={{
            youtube: {
              playerVars: { 
                modestbranding: 1,
                origin: window.location.origin,
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 0
              }
            },
            file: {
              attributes: {
                style: {
                  objectFit: "contain",
                }
              },
              forceVideo: true,
            },
          }}
        />
      )}
      
      {/* Loading overlay */}
      {isBuffering && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}></div>
          <div className="text-center z-10">
            <div className="loader w-12 h-12 border-4 border-gray-600 rounded-full border-t-primary mx-auto mb-4"></div>
            <p className="text-gray-300">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Video Controls */}
      <VideoControls
        isVisible={showControls || !isPlaying}
        isPlaying={isPlaying}
        duration={duration}
        currentTime={currentTime}
        volume={volume}
        isMuted={isMuted}
        isHost={isHost}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onFullScreen={handleFullScreen}
      />
    </div>
  );
};

export default VideoPlayer;
