import { useEffect, useState, useRef } from "react";
import { Participant } from "@shared/schema";

interface VideoStreamInfo {
  stream: MediaStream;
  username: string;
  isLocal: boolean;
}

interface VideoCallSectionProps {
  localStream: MediaStream | null;
  remoteStreams: Record<string, { stream: MediaStream; username: string }>;
  participants: Participant[];
  username: string;
  isCameraOn: boolean;
  isMicOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onLeaveCall: () => void;
}

const VideoCallSection = ({
  localStream,
  remoteStreams,
  participants,
  username,
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  onLeaveCall,
}: VideoCallSectionProps) => {
  const [streams, setStreams] = useState<VideoStreamInfo[]>([]);
  
  // Combine local and remote streams
  useEffect(() => {
    const allStreams: VideoStreamInfo[] = [];
    
    // Add local stream if available
    if (localStream) {
      allStreams.push({
        stream: localStream,
        username: `${username} (You)`,
        isLocal: true,
      });
    }
    
    // Add remote streams
    Object.values(remoteStreams).forEach(({ stream, username }) => {
      allStreams.push({
        stream,
        username,
        isLocal: false,
      });
    });
    
    setStreams(allStreams);
  }, [localStream, remoteStreams, username]);
  
  return (
    <div className="absolute bottom-24 right-4 z-30 max-w-[240px] rounded-lg shadow-lg bg-darkgray overflow-hidden">
      {/* Video streams grid */}
      <div className="overflow-hidden">
        <div className="flex flex-wrap video-call-grid p-1">
          {streams.map((stream, index) => (
            <div key={index} className="w-full relative mb-1">
              <div className="aspect-video bg-lightgray rounded-lg overflow-hidden relative">
                <VideoStream 
                  stream={stream.stream} 
                  muted={stream.isLocal} 
                  isLocal={stream.isLocal}
                />
                <div className="absolute bottom-1 left-1 text-xs bg-black/50 px-1.5 py-0.5 rounded text-white">
                  {stream.username}
                </div>
              </div>
            </div>
          ))}
          
          {/* For participants without video streams, show placeholder */}
          {participants.filter(p => 
            p.username !== username && 
            !Object.values(remoteStreams).some(s => s.username === p.username)
          ).map((participant, index) => (
            <div key={`placeholder-${index}`} className="w-full relative mb-1">
              <div className="aspect-video bg-lightgray rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <i className="fas fa-video-slash text-gray-400"></i>
                </div>
                <div className="absolute bottom-1 left-1 text-xs bg-black/50 px-1.5 py-0.5 rounded text-white">
                  {participant.username}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Video controls */}
      <div className="flex items-center justify-center p-1 space-x-2 border-t border-gray-800">
        <button 
          className={`w-8 h-8 rounded-full ${isMicOn ? 'bg-lightgray' : 'bg-error'} flex items-center justify-center text-white hover:bg-gray-600 transition`} 
          title="Toggle Microphone"
          onClick={onToggleMic}
        >
          <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xs`}></i>
        </button>
        <button 
          className={`w-8 h-8 rounded-full ${isCameraOn ? 'bg-lightgray' : 'bg-error'} flex items-center justify-center text-white hover:bg-gray-600 transition`}
          title="Toggle Camera"
          onClick={onToggleCamera}
        >
          <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} text-xs`}></i>
        </button>
        <button 
          className="w-8 h-8 rounded-full bg-error flex items-center justify-center text-white hover:opacity-80 transition" 
          title="Leave Call"
          onClick={onLeaveCall}
        >
          <i className="fas fa-phone-slash text-xs"></i>
        </button>
        <button 
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white" 
          title="Invite"
          onClick={() => {
            // Copy current URL to clipboard
            navigator.clipboard.writeText(window.location.href);
            // Show toast or notification
            alert("Room link copied to clipboard!");
          }}
        >
          <i className="fas fa-plus text-xs"></i>
        </button>
      </div>
    </div>
  );
};

interface VideoStreamProps {
  stream: MediaStream;
  muted: boolean;
  isLocal: boolean;
}

const VideoStream = ({ stream, muted, isLocal }: VideoStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`}
    />
  );
};

export default VideoCallSection;
