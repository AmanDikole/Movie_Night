import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Room as RoomType, Participant, Message, PlaybackState, WebSocketMessage } from "@shared/schema";
import { connectToSocket, disconnectFromSocket, sendMessage, addMessageHandler, addConnectHandler } from "@/lib/socket";

const useRoom = (roomId: string, username: string) => {
  const [room, setRoom] = useState<RoomType | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  
  // Function to update state when room data is received
  const updateRoomData = useCallback((data: any) => {
    console.log("Room data received:", data);
    setRoom(data.room);
    setParticipants(data.participants);
    setMessages(data.messages);
    setPlaybackState(data.playbackState);
  }, []);
  
  // Fetch initial room data
  const { isLoading, error } = useQuery({
    queryKey: [`/api/rooms/${roomId}`],
    enabled: !!roomId && !!username,
    staleTime: Infinity,
    select: (data: any) => data,
    placeholderData: null,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });
  
  // Connect to WebSocket and join room
  useEffect(() => {
    if (!roomId || !username) return;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const joinRoomHandler = () => {
      console.log(`Joining room: ${roomId} as ${username}`);
      sendMessage({
        type: "join_room",
        payload: { roomId, username },
      });
    };
    
    const setupConnection = () => {
      // Connect to WebSocket
      console.log("Setting up WebSocket connection...");
      const socket = connectToSocket();
      
      // Join room when WebSocket is open
      if (socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket already open, joining room immediately");
        joinRoomHandler();
      } else {
        console.log("WebSocket connecting, will join room when open");
        socket.addEventListener("open", joinRoomHandler);
      }
    };
    
    // Connection success handler
    const handleConnectionSuccess = () => {
      console.log("WebSocket connection successful");
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };
    
    // Connection error/close handler
    const handleConnectionFailure = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with max 30s
        console.log(`WebSocket connection failed. Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = setTimeout(() => {
          setupConnection();
        }, delay);
      } else {
        console.error(`Failed to connect after ${maxReconnectAttempts} attempts.`);
      }
    };
    
    // Initial connection setup
    setupConnection();
    
    // Add connection success handler
    const removeConnectHandler = addConnectHandler(() => {
      handleConnectionSuccess();
    });
    
    // Set up message handler
    const removeMessageHandler = addMessageHandler((message: WebSocketMessage) => {
      console.log("WebSocket message received:", message.type);
      
      switch (message.type) {
        case "join_room_success":
          const { room, participants, messages } = message.payload;
          setRoom(room);
          setParticipants(participants);
          setMessages(messages);
          break;
          
        case "chat_message":
          setMessages((prev) => [...prev, message.payload]);
          break;
          
        case "video_state":
          setPlaybackState(message.payload);
          break;
          
        case "new_peer":
          // Handle in useVideoCall hook
          break;
          
        case "peer_left":
          const { username } = message.payload;
          setParticipants((prev) => 
            prev.filter((p) => p.username !== username)
          );
          break;
          
        case "error":
          console.error("WebSocket error:", message.payload.message);
          break;
      }
    });
    
    // Clean up on unmount
    return () => {
      console.log("Cleaning up room connection...");
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      removeConnectHandler();
      removeMessageHandler();
      
      // Attempt to send leave message before disconnecting
      if (roomId && username) {
        sendMessage({
          type: "leave_room",
          payload: { roomId, username },
        });
      }
      
      disconnectFromSocket();
    };
  }, [roomId, username]);
  
  // Add message to chat
  const addMessage = (content: string) => {
    sendMessage({
      type: "chat_message",
      payload: { roomId, username, content },
    });
  };
  
  // Update video playback state
  const updateVideoState = (state: { isPlaying: boolean; currentTime: number }) => {
    sendMessage({
      type: "video_state",
      payload: { roomId, ...state },
    });
  };
  
  return {
    room,
    participants,
    messages,
    playbackState,
    isLoading,
    error,
    addMessage,
    updateVideoState,
  };
};

export default useRoom;
