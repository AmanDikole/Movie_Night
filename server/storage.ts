import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { 
  User, InsertUser, Room, InsertRoom, 
  Participant, InsertParticipant, 
  Message, InsertMessage, 
  PlaybackState, InsertPlaybackState, 
  VideoPlayerState, ChatMessage, PeerInfo,
  users, rooms, participants, messages, playbackStates
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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Room methods
  async createRoom(room: Omit<InsertRoom, 'id'>): Promise<Room> {
    const id = nanoid(6);

    // Create the room
    const [newRoom] = await db
      .insert(rooms)
      .values({ id, ...room })
      .returning();

    // Initialize playback state
    await db
      .insert(playbackStates)
      .values({
        roomId: id,
        isPlaying: false,
        currentTime: 0
      })
      .onConflictDoNothing();

    return newRoom;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  // Participant methods
  async addParticipant(participant: InsertParticipant): Promise<Participant> {
    const [newParticipant] = await db
      .insert(participants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async getParticipants(roomId: string): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.roomId, roomId));
  }

  async removeParticipant(roomId: string, username: string): Promise<void> {
    await db
      .delete(participants)
      .where(
        and(
          eq(participants.roomId, roomId),
          eq(participants.username, username)
        )
      );
  }

  // Message methods
  async addMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessages(roomId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(messages.timestamp);
  }

  // Playback state methods
  async updatePlaybackState(playbackState: InsertPlaybackState): Promise<PlaybackState> {
    // First check if a record exists
    const [existingState] = await db
      .select()
      .from(playbackStates)
      .where(eq(playbackStates.roomId, playbackState.roomId));

    if (existingState) {
      // Update existing record
      const [updatedState] = await db
        .update(playbackStates)
        .set({
          isPlaying: playbackState.isPlaying,
          currentTime: playbackState.currentTime,
          lastUpdated: new Date()
        })
        .where(eq(playbackStates.roomId, playbackState.roomId))
        .returning();
      return updatedState;
    } else {
      // Insert new record
      const [newState] = await db
        .insert(playbackStates)
        .values({
          ...playbackState,
          lastUpdated: new Date()
        })
        .returning();
      return newState;
    }
  }

  async getPlaybackState(roomId: string): Promise<PlaybackState | undefined> {
    const [state] = await db
      .select()
      .from(playbackStates)
      .where(eq(playbackStates.roomId, roomId));
    return state || undefined;
  }
}

export const storage = new DatabaseStorage();