import { useState, useEffect } from "react";
import { 
  initializePeer, 
  getLocalStream, 
  callPeer, 
  onRemoteStream, 
  onPeerDisconnected, 
  disconnectFromPeers,
  toggleAudio,
  toggleVideo
} from "@/lib/peer";
import { addMessageHandler } from "@/lib/socket";

const useVideoCall = (roomId: string, username: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream; username: string }>>({});
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  
  // Initialize peer connection and setup media stream
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    const setupPeer = async () => {
      try {
        // Initialize WebRTC peer connection
        const { peer, peerId, localStream: stream } = await initializePeer(username);
        setPeerId(peerId);
        
        // Setup local media stream
        if (!stream) {
          const newStream = await getLocalStream(); 
          setLocalStream(newStream);
          setIsCameraOn(true);
          setIsMicOn(true);
        } else {
          setLocalStream(stream);
        }
        
        // Handle remote streams
        const unsubscribeRemoteStream = onRemoteStream((remotePeerId, stream, metadata) => {
          const { username } = metadata || {};
          setRemoteStreams(prev => ({
            ...prev,
            [remotePeerId]: { stream, username }
          }));
        });
        
        // Handle peer disconnection
        const unsubscribePeerDisconnect = onPeerDisconnected((remotePeerId) => {
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[remotePeerId];
            return newStreams;
          });
        });
        
        // Listen for new peers from WebSocket
        const unsubscribeMessageHandler = addMessageHandler((message) => {
          if (message.type === "new_peer") {
            const { peerId: remotePeerId, username } = message.payload;
            if (remotePeerId && username && remotePeerId !== peerId) {
              callPeer(remotePeerId, { username });
            }
          }
        });
        
        cleanup = () => {
          unsubscribeRemoteStream();
          unsubscribePeerDisconnect();
          unsubscribeMessageHandler();
          disconnectFromPeers();
        };
      } catch (error) {
        console.error("Error setting up video call:", error);
      }
    };
    
    setupPeer();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [roomId, username]);
  
  // Toggle camera
  const toggleCamera = () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    toggleVideo(newState);
  };
  
  // Toggle microphone
  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    toggleAudio(newState);
  };
  
  // Leave video call
  const leaveCall = () => {
    disconnectFromPeers();
    setLocalStream(null);
    setRemoteStreams({});
    setIsCameraOn(false);
    setIsMicOn(false);
  };
  
  return {
    localStream,
    remoteStreams,
    isCameraOn,
    isMicOn,
    peerId,
    toggleCamera,
    toggleMic,
    leaveCall
  };
};

export default useVideoCall;
