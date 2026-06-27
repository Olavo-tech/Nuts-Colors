/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NutColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'PURPLE' | 'ORANGE' | 'PINK' | 'TEAL' | 'CYAN' | 'LIME';

export interface Bolt {
  id: string;
  colors: NutColor[]; // Bottom-to-top colors. e.g. colors[0] is bottom, colors[3] is top
  capacity: number;
}

export interface GameLevel {
  id: number;
  bolts: NutColor[][]; // Initial bolts (each bolt has a list of colors, empty is empty array)
  capacity: number;
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number;
  bestTime: number; // in seconds
  minMoves: number;
}

export interface PlayerProfile {
  name: string;
  xp: number;
  level: number;
  totalStars: number;
  playTime: number; // in seconds
  gamesPlayed: number;
  wins: number;
  losses: number; // restarts or surrenders
  movesCount: number;
  bestStreak: number;
  currentStreak: number;
  levelProgress: Record<number, LevelProgress>;
  lastPlayedLevel: number;
  // Multiplayer stats
  mpRankPoints?: number;
  mpLeague?: string;
  mpWins?: number;
  mpLosses?: number;
  // Shop & Daily Rewards
  coins?: number;
  unlockedThemes?: string[];
  selectedTheme?: string;
  lastDailyRewardClaimed?: string;
}

export interface LeaderboardEntry {
  rank?: number;
  name: string;
  level: number;
  xp: number;
  stars: number;
  completedCount: number;
  totalTime: number;
  bestTimePerLevel?: Record<number, number>; // levelId -> bestTime in seconds
  maxLevelCompleted?: number; // highest level ID completed
}

export interface GameSettings {
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  vibration: boolean;
  theme: 'dark' | 'light';
  language: 'pt-BR' | 'en-US';
}

export interface GameHistoryState {
  bolts: NutColor[][];
}
