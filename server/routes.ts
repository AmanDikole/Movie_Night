import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { WebSocketMessage, insertRoomSchema, insertParticipantSchema, insertMessageSchema, insertPlaybackStateSchema } from "@shared/schema";
import { log } from "./vite";
import { nanoid } from "nanoid";

// Connection storage
const clients = new Map<string, { ws: WebSocket, roomId: string, username: string }>();

// Send message to all clients in a room
function broadcastToRoom(roomId: string, message: WebSocketMessage, excludeClient?: WebSocket) {
  for (const [id, client] of clients.entries()) {
    if (client.roomId === roomId && client.ws !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.post('/api/rooms', async (req, res) => {
    try {
      const { username, videoUrl } = req.body;
      
      if (!username || !videoUrl) {
        return res.status(400).json({ message: 'Username and video URL are required' });
      }
      
      const room = await storage.createRoom({
        videoUrl,
        hostId: username, // Using username as hostId for simplicity
      });
      
      // Add host as first participant
      await storage.addParticipant({
        roomId: room.id,
        username
      });
      
      // Add system message
      await storage.addMessage({
        roomId: room.id,
        username: 'System',
        content: `${username} created the room`,
        type: 'system'
      });
      
      res.status(201).json({ roomId: room.id });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ message: 'Failed to create room' });
    }
  });
  
  app.get('/api/rooms/:roomId', async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      const participants = await storage.getParticipants(roomId);
      const messages = await storage.getMessages(roomId);
      const playbackState = await storage.getPlaybackState(roomId);
      
      res.json({ 
        room, 
        participants, 
        messages,
        playbackState
      });
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ message: 'Failed to fetch room' });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = nanoid();
    
    // Handle messages from clients
    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room': {
            const { roomId, username, peerId } = message.payload;
            
            // Store client connection info
            clients.set(clientId, { ws, roomId, username });
            
            // Check if room exists
            const room = await storage.getRoom(roomId);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' }
              }));
              return;
            }
            
            // Add participant
            try {
              await storage.addParticipant({
                roomId,
                username
              });
              
              // Add system message
              const systemMessage = await storage.addMessage({
                roomId,
                username: 'System',
                content: `${username} joined the room`,
                type: 'system'
              });
              
              // Get current playback state
              const playbackState = await storage.getPlaybackState(roomId);
              
              // Get existing participants to share peer information
              const participants = await storage.getParticipants(roomId);
              
              // Send playback state to the new client
              ws.send(JSON.stringify({
                type: 'video_state', 
                payload: playbackState
              }));
              
              // Broadcast new system message to all clients in room
              broadcastToRoom(roomId, {
                type: 'chat_message',
                payload: systemMessage
              });
              
              // Broadcast new peer to all other clients in room
              broadcastToRoom(roomId, {
                type: 'new_peer',
                payload: { peerId, username }
              }, ws);
              
              // Success response to client
              ws.send(JSON.stringify({
                type: 'join_room_success',
                payload: {
                  room,
                  participants,
                  messages: await storage.getMessages(roomId)
                }
              }));
              
              log(`User ${username} joined room ${roomId}`);
            } catch (error) {
              console.error('Error adding participant:', error);
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Failed to join room' }
              }));
            }
            break;
          }
          
          case 'leave_room': {
            const client = clients.get(clientId);
            if (client) {
              const { roomId, username } = client;
              
              // Remove participant
              await storage.removeParticipant(roomId, username);
              
              // Add system message
              const systemMessage = await storage.addMessage({
                roomId,
                username: 'System',
                content: `${username} left the room`,
                type: 'system'
              });
              
              // Broadcast to all clients in room
              broadcastToRoom(roomId, {
                type: 'chat_message',
                payload: systemMessage
              });
              
              // Broadcast peer left to all clients in room
              broadcastToRoom(roomId, {
                type: 'peer_left',
                payload: { username }
              });
              
              // Remove client
              clients.delete(clientId);
              log(`User ${username} left room ${roomId}`);
            }
            break;
          }
          
          case 'chat_message': {
            const { roomId, username, content } = message.payload;
            
            // Add message to storage
            const newMessage = await storage.addMessage({
              roomId,
              username,
              content,
              type: 'user'
            });
            
            // Broadcast to all clients in room
            broadcastToRoom(roomId, {
              type: 'chat_message',
              payload: newMessage
            });
            
            break;
          }
          
          case 'video_state': {
            const { roomId, isPlaying, currentTime } = message.payload;
            
            // Update playback state
            const updatedState = await storage.updatePlaybackState({
              roomId,
              isPlaying,
              currentTime
            });
            
            // Broadcast to all clients in room
            broadcastToRoom(roomId, {
              type: 'video_state',
              payload: updatedState
            }, ws); // Don't send back to sender
            
            break;
          }
          
          default:
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      const client = clients.get(clientId);
      if (client) {
        const { roomId, username } = client;
        
        // Remove participant
        await storage.removeParticipant(roomId, username);
        
        // Add system message
        const systemMessage = await storage.addMessage({
          roomId,
          username: 'System',
          content: `${username} left the room`,
          type: 'system'
        });
        
        // Broadcast to all clients in room
        broadcastToRoom(roomId, {
          type: 'chat_message',
          payload: systemMessage
        });
        
        // Broadcast peer left to all clients in room
        broadcastToRoom(roomId, {
          type: 'peer_left',
          payload: { username }
        });
        
        // Remove client
        clients.delete(clientId);
        log(`User ${username} disconnected from room ${roomId}`);
      }
    });
  });
  
  return httpServer;
}
