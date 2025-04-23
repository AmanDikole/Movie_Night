import { useState, useEffect } from "react";
import { Message } from "@shared/schema";

interface UseChatProps {
  roomId: string;
  username: string;
  initialMessages: Message[];
  onSendMessage: (content: string) => void;
}

const useChat = ({
  roomId,
  username,
  initialMessages,
  onSendMessage,
}: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState("");
  
  // Update messages when initialMessages change
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  
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
  
  return {
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
  };
};

export default useChat;
