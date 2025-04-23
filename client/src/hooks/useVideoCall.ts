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
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupPeer = async () => {
      try {
        console.log("Setting up peer connection...");
        
        // Initialize WebRTC peer connection
        const { peer, peerId, localStream: stream } = await initializePeer(username);
        setPeerId(peerId);
        console.log(`Peer initialized successfully with ID: ${peerId}`);
        
        // Setup local media stream
        if (!stream) {
          try {
            console.log("Getting local media stream...");
            const newStream = await getLocalStream();
            setLocalStream(newStream);
            setIsCameraOn(true);
            setIsMicOn(true);
            console.log("Local media stream obtained successfully");
          } catch (mediaError) {
            console.error("Failed to get media stream:", mediaError);
            // Fallback to audio-only if camera fails
            try {
              console.log("Attempting audio-only fallback...");
              const audioOnlyStream = await getLocalStream(true); // audio only
              setLocalStream(audioOnlyStream);
              setIsCameraOn(false);
              setIsMicOn(true);
              console.log("Audio-only stream obtained successfully");
            } catch (audioError) {
              console.error("Failed to get audio-only stream:", audioError);
            }
          }
        } else {
          setLocalStream(stream);
          setIsCameraOn(stream.getVideoTracks().length > 0);
          setIsMicOn(stream.getAudioTracks().length > 0);
        }
        
        // Handle remote streams
        const unsubscribeRemoteStream = onRemoteStream((remotePeerId, stream, metadata) => {
          console.log(`Received remote stream from peer: ${remotePeerId}`, metadata);
          const { username } = metadata || {};
          setRemoteStreams(prev => ({
            ...prev,
            [remotePeerId]: { stream, username: username || 'Unknown User' }
          }));
        });
        
        // Handle peer disconnection
        const unsubscribePeerDisconnect = onPeerDisconnected((remotePeerId) => {
          console.log(`Peer disconnected: ${remotePeerId}`);
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[remotePeerId];
            return newStreams;
          });
        });
        
        // Listen for new peers from WebSocket
        const unsubscribeMessageHandler = addMessageHandler((message) => {
          if (message.type === "new_peer") {
            const { peerId: remotePeerId, username: remoteUsername } = message.payload;
            console.log(`New peer notification: ${remotePeerId} (${remoteUsername})`);
            
            if (remotePeerId && remoteUsername && remotePeerId !== peerId) {
              console.log(`Initiating call to peer: ${remotePeerId}`);
              callPeer(remotePeerId, { username });
            }
          }
        });
        
        // Reset retry count on successful connection
        retryCount = 0;
        
        cleanup = () => {
          console.log("Cleaning up video call resources...");
          unsubscribeRemoteStream();
          unsubscribePeerDisconnect();
          unsubscribeMessageHandler();
          disconnectFromPeers();
        };
      } catch (error) {
        console.error("Error setting up video call:", error);
        
        // Retry logic for connection failures
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = 2000 * retryCount; // Exponential backoff
          console.log(`Retrying peer connection in ${delay/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
          
          setTimeout(() => {
            setupPeer();
          }, delay);
        }
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
