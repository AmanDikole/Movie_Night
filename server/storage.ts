import { nanoid } from 'nanoid';
import { 
  User, InsertUser, Room, InsertRoom, 
  Participant, InsertParticipant, 
  Message, InsertMessage, 
  PlaybackState, InsertPlaybackState, 
  VideoPlayerState, ChatMessage, PeerInfo
} from '@shared/schema';

// Interfaces for storage objects
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createRoom(room: Omit<InsertRoom, 'id'>): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipants(roomId: string): Promise<Participant[]>;
  removeParticipant(roomId: string, username: string): Promise<void>;
  
  addMessage(message: InsertMessage): Promise<Message>;
  getMessages(roomId: string): Promise<Message[]>;
  
  updatePlaybackState(playbackState: InsertPlaybackState): Promise<PlaybackState>;
  getPlaybackState(roomId: string): Promise<PlaybackState | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<string, Room>;
  private participants: Map<string, Participant[]>;
  private messages: Map<string, Message[]>;
  private playbackStates: Map<string, PlaybackState>;
  
  private userId: number;
  private participantId: number;
  private messageId: number;
  
  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.participants = new Map();
    this.messages = new Map();
    this.playbackStates = new Map();
    
    this.userId = 1;
    this.participantId = 1;
    this.messageId = 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Room methods
  async createRoom(room: Omit<InsertRoom, 'id'>): Promise<Room> {
    const id = nanoid(6);
    const timestamp = new Date();
    const newRoom: Room = { id, ...room, createdAt: timestamp };
    this.rooms.set(id, newRoom);
    
    // Initialize empty participants list and messages list for this room
    this.participants.set(id, []);
    this.messages.set(id, []);
    
    // Initialize playback state
    this.playbackStates.set(id, {
      roomId: id,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: timestamp
    });
    
    return newRoom;
  }
  
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }
  
  // Participant methods
  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.participantId++;
    const newParticipant: Participant = { ...participant, id, joinedAt: new Date() };
    
    const roomParticipants = this.participants.get(participant.roomId) || [];
    roomParticipants.push(newParticipant);
    this.participants.set(participant.roomId, roomParticipants);
    
    return newParticipant;
  }
  
  async getParticipants(roomId: string): Promise<Participant[]> {
    return this.participants.get(roomId) || [];
  }
  
  async removeParticipant(roomId: string, username: string): Promise<void> {
    const roomParticipants = this.participants.get(roomId) || [];
    const updatedParticipants = roomParticipants.filter(p => p.username !== username);
    this.participants.set(roomId, updatedParticipants);
  }
  
  // Message methods
  async addMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { ...message, id, timestamp: new Date() };
    
    const roomMessages = this.messages.get(message.roomId) || [];
    roomMessages.push(newMessage);
    this.messages.set(message.roomId, roomMessages);
    
    return newMessage;
  }
  
  async getMessages(roomId: string): Promise<Message[]> {
    return this.messages.get(roomId) || [];
  }
  
  // Playback state methods
  async updatePlaybackState(playbackState: InsertPlaybackState): Promise<PlaybackState> {
    const updatedState: PlaybackState = { 
      ...playbackState, 
      lastUpdated: new Date() 
    };
    
    this.playbackStates.set(playbackState.roomId, updatedState);
    return updatedState;
  }
  
  async getPlaybackState(roomId: string): Promise<PlaybackState | undefined> {
    return this.playbackStates.get(roomId);
  }
}

export const storage = new MemStorage();
