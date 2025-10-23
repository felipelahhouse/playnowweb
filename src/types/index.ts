export type Platform = 'snes' | 'nes' | 'gba' | 'gbc' | 'gb' | 'genesis' | 'n64' | 'ps1' | 'sms' | 'gg';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  is_online: boolean;
  last_seen: string;
  isVip?: boolean;
  level?: number;
}

export interface Game {
  id: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  coverUrl?: string | null;
  playCount?: number | null;
  multiplayerSupport?: boolean | null;
  romUrl: string;
  platform: Platform;
  genre?: string | null;
  year?: number | null;
  players?: number | null;
  rating?: number | null;
  publisher?: string | null;
  createdAt?: string;
}

export interface GameSession {
  id: string;
  game_id: string;
  host_user_id: string;
  players: string[];
  max_players: number;
  is_private: boolean;
  created_at: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
  room: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked_at?: string;
}