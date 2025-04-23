import Peer from "peerjs";

let peer: Peer | null = null;
let localStream: MediaStream | null = null;
const remoteStreams: Record<string, MediaStream> = {};

type PeerCallbackFn = (peerId: string, stream: MediaStream, metadata?: any) => void;
let onRemoteStreamCallbacks: PeerCallbackFn[] = [];
let onPeerDisconnectedCallbacks: ((peerId: string) => void)[] = [];

export const initializePeer = async (username: string): Promise<{
  peer: Peer;
  peerId: string;
  localStream: MediaStream | null;
}> => {
  // Create new peer with random ID
  peer = new Peer({
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    },
    debug: 3,
  });
  
  return new Promise((resolve, reject) => {
    peer!.on("open", (id) => {
      console.log("PeerJS connection established with ID:", id);
      
      // Handle incoming calls
      peer!.on("call", (call) => {
        call.answer(localStream || undefined);
        
        call.on("stream", (remoteStream) => {
          const peerId = call.peer;
          remoteStreams[peerId] = remoteStream;
          
          // Notify callbacks
          onRemoteStreamCallbacks.forEach((callback) => 
            callback(peerId, remoteStream, call.metadata)
          );
        });
        
        call.on("close", () => {
          const peerId = call.peer;
          delete remoteStreams[peerId];
          
          // Notify callbacks
          onPeerDisconnectedCallbacks.forEach((callback) => callback(peerId));
        });
        
        call.on("error", (err) => {
          console.error("Call error:", err);
        });
      });
      
      resolve({
        peer: peer!,
        peerId: id,
        localStream,
      });
    });
    
    peer!.on("error", (err) => {
      console.error("PeerJS error:", err);
      reject(err);
    });
  });
};

export const getLocalStream = async (audioOnly = false): Promise<MediaStream> => {
  try {
    const constraints = {
      video: audioOnly ? false : {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: "user",
      },
      audio: true,
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream = stream;
    return stream;
  } catch (error) {
    console.error("Error getting local stream:", error);
    throw error;
  }
};

export const callPeer = (peerId: string, metadata?: any): void => {
  if (!peer || !localStream) {
    console.error("Peer or local stream not initialized");
    return;
  }
  
  try {
    const call = peer.call(peerId, localStream, { metadata });
    
    call.on("stream", (remoteStream) => {
      remoteStreams[peerId] = remoteStream;
      
      // Notify callbacks
      onRemoteStreamCallbacks.forEach((callback) => 
        callback(peerId, remoteStream, metadata)
      );
    });
    
    call.on("close", () => {
      delete remoteStreams[peerId];
      
      // Notify callbacks
      onPeerDisconnectedCallbacks.forEach((callback) => callback(peerId));
    });
    
    call.on("error", (err) => {
      console.error("Call error:", err);
    });
  } catch (error) {
    console.error("Error calling peer:", error);
  }
};

export const disconnectFromPeers = (): void => {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  
  // Clear local stream tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
};

export const onRemoteStream = (callback: PeerCallbackFn): () => void => {
  onRemoteStreamCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    onRemoteStreamCallbacks = onRemoteStreamCallbacks.filter((cb) => cb !== callback);
  };
};

export const onPeerDisconnected = (callback: (peerId: string) => void): () => void => {
  onPeerDisconnectedCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    onPeerDisconnectedCallbacks = onPeerDisconnectedCallbacks.filter((cb) => cb !== callback);
  };
};

export const toggleAudio = (enabled: boolean): void => {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
};

export const toggleVideo = (enabled: boolean): void => {
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
};
