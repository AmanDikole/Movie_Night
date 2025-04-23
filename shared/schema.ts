import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for room participants
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Room schema for movie rooms
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  videoUrl: text("video_url").notNull(),
  hostId: text("host_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Participant schema for users in rooms
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  username: text("username").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Message schema for chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("user"), // user, system
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Playback state schema
export const playbackStates = pgTable("playback_states", {
  roomId: text("room_id").primaryKey(),
  isPlaying: boolean("is_playing").notNull().default(false),
  currentTime: integer("current_time").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  id: true,
  videoUrl: true,
  hostId: true,
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  roomId: true,
  username: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  username: true,
  content: true,
  type: true,
});

export const insertPlaybackStateSchema = createInsertSchema(playbackStates).pick({
  roomId: true,
  isPlaying: true,
  currentTime: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertPlaybackState = z.infer<typeof insertPlaybackStateSchema>;
export type PlaybackState = typeof playbackStates.$inferSelect;

// WebSocket message types
export type VideoPlayerState = {
  isPlaying: boolean;
  currentTime: number;
  roomId: string;
};

export type ChatMessage = {
  roomId: string;
  username: string;
  content: string;
  type: 'user' | 'system';
  timestamp: Date;
};

export type PeerInfo = {
  peerId: string;
  username: string;
};

export type WebSocketMessage = {
  type: 'join_room' | 'leave_room' | 'chat_message' | 'video_state' | 'new_peer' | 'peer_left';
  payload: any;
};
