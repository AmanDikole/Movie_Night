import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Room as RoomType, Participant, Message, PlaybackState } from "@shared/schema";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCallSection from "@/components/VideoCallSection";
import ChatSection from "@/components/ChatSection";
import NotificationToast from "@/components/NotificationToast";
import { connectToSocket, disconnectFromSocket } from "@/lib/socket";
import { initializePeer } from "@/lib/peer";
import useRoom from "@/hooks/useRoom";
import useVideoCall from "@/hooks/useVideoCall";

const Room = () => {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  // Get username from session storage
  const username = sessionStorage.getItem("username");
  
  // Redirect if no roomId or username
  useEffect(() => {
    if (!roomId || !username) {
      setLocation("/");
    }
  }, [roomId, username, setLocation]);
  
  // Initialize room state and socket connection
  const { 
    room, 
    participants, 
    messages,
    playbackState,
    isLoading, 
    error,
    addMessage,
    updateVideoState
  } = useRoom(roomId!, username!);
  
  // Initialize video call with PeerJS
  const {
    localStream,
    remoteStreams,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    leaveCall
  } = useVideoCall(roomId!, username!);
  
  // Show notification toast when room ID is copied
  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setNotificationMessage("Room ID copied to clipboard!");
      setShowNotification(true);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };
  
  // Toggle mobile chat visibility
  const toggleMobileChat = () => {
    setIsMobileChatOpen(!isMobileChatOpen);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="loader w-12 h-12 border-4 border-gray-600 rounded-full border-t-primary"></div>
      </div>
    );
  }
  
  if (error || !room) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="max-w-md w-full bg-darkgray rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-gray-300 mb-4">The room you're trying to join doesn't exist or has expired.</p>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
            onClick={() => setLocation("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Video Section */}
        <div className="flex-1 flex flex-col relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-3 bg-darkgray">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <span className="text-primary">Room:</span>
                <span className="ml-2 text-gray-200">{roomId}</span>
                <button 
                  className="ml-2 text-gray-400 hover:text-white" 
                  onClick={handleCopyRoomId} 
                  title="Copy Room ID"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-success text-white text-xs">
                  <i className="fas fa-circle text-[8px] mr-1"></i> {participants.length} Online
                </div>
              </div>
            </div>
          </div>

          {/* Main Video Container */}
          <div className="flex-1 bg-black flex flex-col relative">
            {/* Video Player */}
            <VideoPlayer
              url={room.videoUrl}
              initialPlaybackState={playbackState}
              onPlaybackChange={updateVideoState}
              isHost={username === room.hostId}
            />

            {/* Video Call Section */}
            <VideoCallSection 
              localStream={localStream}
              remoteStreams={remoteStreams}
              participants={participants}
              username={username}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
              onLeaveCall={leaveCall}
            />
          </div>
        </div>

        {/* Chat Section - Desktop: always visible, Mobile: toggleable */}
        <div 
          className={`md:w-80 bg-darkgray border-l border-gray-800 flex flex-col h-[400px] md:h-auto
            ${isMobileChatOpen ? 'fixed inset-0 z-40' : 'hidden md:flex'}`}
        >
          <ChatSection 
            messages={messages} 
            participants={participants}
            username={username}
            onSendMessage={(content) => addMessage(content)}
            onClose={() => setIsMobileChatOpen(false)}
          />
        </div>
      </div>
      
      {/* Mobile Chat Toggle Button */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-30 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        onClick={toggleMobileChat}
      >
        <i className="fas fa-comments"></i>
      </button>
      
      {/* Notification Toast */}
      <NotificationToast 
        message={notificationMessage} 
        show={showNotification} 
        icon="copy"
      />
    </div>
  );
};

export default Room;
