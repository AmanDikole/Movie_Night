import { useEffect, useRef, useState } from "react";
import { Message, Participant } from "@shared/schema";

interface ChatSectionProps {
  messages: Message[];
  participants: Participant[];
  username: string;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

const ChatSection = ({
  messages,
  participants,
  username,
  onSendMessage,
  onClose,
}: ChatSectionProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <>
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-medium">Live Chat</h3>
        <button 
          className="md:hidden text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message, index) => {
          const isCurrentUser = message.username === username;
          
          // System message (join/leave, playback control)
          if (message.type === "system") {
            return (
              <div key={index} className="chat-message flex justify-center">
                <div className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
                  {message.content}
                </div>
              </div>
            );
          }
          
          // User messages
          return isCurrentUser ? (
            <div key={index} className="chat-message flex justify-end">
              <div className="mr-2 flex-1 text-right">
                <div className="flex items-baseline justify-end">
                  <span className="ml-2 text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
                  <span className="font-medium text-sm text-secondary ml-2">You</span>
                </div>
                <p className="text-sm text-gray-200 mt-1 bg-gray-700 inline-block px-3 py-2 rounded-lg">
                  {message.content}
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-secondary text-white text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          ) : (
            <div key={index} className="chat-message flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
                  {message.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-2 flex-1">
                <div className="flex items-baseline">
                  <span className="font-medium text-sm text-primary">{message.username}</span>
                  <span className="ml-2 text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-200 mt-1">{message.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-end">
          <div className="flex-1 relative">
            <textarea 
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-lightgray border-0 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-primary outline-none resize-none"
              placeholder="Type a message..."
            />
          </div>
          <button 
            className="ml-2 bg-primary h-10 w-10 rounded-full flex items-center justify-center text-white"
            onClick={handleSendMessage}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatSection;
