import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Room, Participant, Message, PlaybackState, WebSocketMessage } from "@shared/schema";
import { connectToSocket, disconnectFromSocket, sendMessage, addMessageHandler } from "@/lib/socket";

const useRoom = (roomId: string, username: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  
  // Fetch initial room data
  const { isLoading, error } = useQuery({
    queryKey: [`/api/rooms/${roomId}`],
    onSuccess: (data) => {
      setRoom(data.room);
      setParticipants(data.participants);
      setMessages(data.messages);
      setPlaybackState(data.playbackState);
    },
    enabled: !!roomId && !!username,
  });
  
  // Connect to WebSocket and join room
  useEffect(() => {
    if (!roomId || !username) return;
    
    // Connect to WebSocket
    const socket = connectToSocket();
    
    // Join room when WebSocket is open
    const joinRoom = () => {
      sendMessage({
        type: "join_room",
        payload: { roomId, username },
      });
    };
    
    if (socket.readyState === WebSocket.OPEN) {
      joinRoom();
    } else {
      socket.addEventListener("open", joinRoom);
    }
    
    // Set up message handler
    const removeMessageHandler = addMessageHandler((message: WebSocketMessage) => {
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
      removeMessageHandler();
      
      sendMessage({
        type: "leave_room",
        payload: { roomId, username },
      });
      
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
