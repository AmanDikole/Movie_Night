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
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    connectHandlers.forEach(handler => handler());
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.onclose = () => {
    console.log("WebSocket connection closed");
    socket = null;
    disconnectHandlers.forEach(handler => handler());
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
