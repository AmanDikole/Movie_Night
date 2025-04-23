import { WebSocketMessage } from "@shared/schema";

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = () => void;

let socket: WebSocket | null = null;
const messageHandlers: MessageHandler[] = [];
const connectHandlers: ConnectionHandler[] = [];
const disconnectHandlers: ConnectionHandler[] = [];

export const connectToSocket = () => {
  if (socket) {
    return socket;
  }
  
  // For Replit, we need to use the current hostname rather than localhost
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;
  
  console.log(`Connecting to WebSocket at: ${wsUrl}`);
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established successfully");
    connectHandlers.forEach(handler => handler());
  };
  
  socket.onmessage = (event) => {
    try {
      console.log("WebSocket message received:", event.data);
      const message = JSON.parse(event.data) as WebSocketMessage;
      messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.onclose = (event) => {
    console.log("WebSocket connection closed with code:", event.code, "reason:", event.reason);
    socket = null;
    disconnectHandlers.forEach(handler => handler());
    
    // Attempt to reconnect after a delay unless it was a normal closure
    if (event.code !== 1000) {
      console.log("Attempting to reconnect in 3 seconds...");
      setTimeout(() => {
        connectToSocket();
      }, 3000);
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  return socket;
};

export const disconnectFromSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const sendMessage = (message: WebSocketMessage) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not connected");
  }
};

export const addMessageHandler = (handler: MessageHandler) => {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index !== -1) {
      messageHandlers.splice(index, 1);
    }
  };
};

export const addConnectHandler = (handler: ConnectionHandler) => {
  connectHandlers.push(handler);
  return () => {
    const index = connectHandlers.indexOf(handler);
    if (index !== -1) {
      connectHandlers.splice(index, 1);
    }
  };
};

export const addDisconnectHandler = (handler: ConnectionHandler) => {
  disconnectHandlers.push(handler);
  return () => {
    const index = disconnectHandlers.indexOf(handler);
    if (index !== -1) {
      disconnectHandlers.splice(index, 1);
    }
  };
};
