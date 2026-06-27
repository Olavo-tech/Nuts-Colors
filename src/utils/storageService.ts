/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProfile, GameSettings, LeaderboardEntry, LevelProgress } from '../types';

const PROFILE_KEY = 'nut_bolt_color_sort_profile_v1';
const SETTINGS_KEY = 'nut_bolt_color_sort_settings_v1';
const LEADERBOARD_KEY = 'nut_bolt_color_sort_leaderboard_v1';

// Calculate Level based on XP
// Level 1: 0 - 500 XP
// Level 2: 500 - 1500 XP (needs 1000)
// Level 3: 1500 - 3000 XP (needs 1500)
// Level 4: 3000 - 5000 XP (needs 2000)
// Each level requires Level * 500 XP more
export function calculateLevelFromXp(xp: number): { level: number; xpForCurrentLevel: number; xpForNextLevel: number; progressPercentage: number } {
  let level = 1;
  let accumulatedXp = 0;
  
  while (true) {
    const requiredForNext = level * 500;
    if (xp < accumulatedXp + requiredForNext) {
      const xpInCurrent = xp - accumulatedXp;
      return {
        level,
        xpForCurrentLevel: xpInCurrent,
        xpForNextLevel: requiredForNext,
        progressPercentage: Math.min(100, Math.floor((xpInCurrent / requiredForNext) * 100))
      };
    }
    accumulatedXp += requiredForNext;
    level++;
  }
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.4,
  sfxVolume: 0.6,
  vibration: true,
  theme: 'dark',
  language: 'pt-BR'
};

const INITIAL_PROFILE: PlayerProfile = {
  name: '',
  xp: 0,
  level: 1,
  totalStars: 0,
  playTime: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  movesCount: 0,
  bestStreak: 0,
  currentStreak: 0,
  levelProgress: {},
  lastPlayedLevel: 1,
  mpRankPoints: 1000,
  mpLeague: 'Bronze',
  mpWins: 0,
  mpLosses: 0,
  coins: 200,
  unlockedThemes: ['classic'],
  selectedTheme: 'classic'
};

export const storageService = {
  // Load Settings
  loadSettings(): GameSettings {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  // Save Settings
  saveSettings(settings: GameSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Load All Profiles
  loadAllProfiles(): PlayerProfile[] {
    const data = localStorage.getItem('nut_bolt_color_sort_all_profiles_v1');
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(p => ({
        ...INITIAL_PROFILE,
        coins: 200,
        unlockedThemes: ['classic'],
        selectedTheme: 'classic',
        ...p
      }));
    } catch {
      return [];
    }
  },

  // Load Profile
  loadProfile(): PlayerProfile {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return INITIAL_PROFILE;
    try {
      const parsed = JSON.parse(data);
      // Ensure recalculation of level based on XP is consistent
      const calculated = calculateLevelFromXp(parsed.xp || 0);
      return {
        ...INITIAL_PROFILE,
        coins: 200,
        unlockedThemes: ['classic'],
        selectedTheme: 'classic',
        ...parsed,
        level: calculated.level
      };
    } catch {
      return INITIAL_PROFILE;
    }
  },

  // Save Profile
  saveProfile(profile: PlayerProfile) {
    const calculated = calculateLevelFromXp(profile.xp);
    const updatedProfile = {
      ...profile,
      level: calculated.level
    };
    
    // Save active profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    
    // Save/update in all profiles list
    if (updatedProfile.name) {
      let allProfiles = this.loadAllProfiles();
      const idx = allProfiles.findIndex(p => p.name.toLowerCase() === updatedProfile.name.toLowerCase());
      if (idx >= 0) {
        allProfiles[idx] = updatedProfile;
      } else {
        allProfiles.push(updatedProfile);
      }
      localStorage.setItem('nut_bolt_color_sort_all_profiles_v1', JSON.stringify(allProfiles));
      
      // Proactively update leaderboard with player stats
      this.updatePlayerInLeaderboard(updatedProfile);
    }
  },

  // Switch active profile
  switchProfile(name: string): PlayerProfile | null {
    const allProfiles = this.loadAllProfiles();
    const target = allProfiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (target) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(target));
      return target;
    }
    return null;
  },

  // Create new profile
  createNewProfile(name: string): PlayerProfile {
    const cleaned = name.trim();
    const allProfiles = this.loadAllProfiles();
    const exists = allProfiles.some(p => p.name.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      throw new Error('NOME_DUPLICADO');
    }
    const newProfile: PlayerProfile = {
      ...INITIAL_PROFILE,
      name: cleaned,
      coins: 200,
      unlockedThemes: ['classic'],
      selectedTheme: 'classic'
    };
    this.saveProfile(newProfile);
    return newProfile;
  },

  // Delete a profile
  deleteProfile(name: string) {
    let allProfiles = this.loadAllProfiles();
    allProfiles = allProfiles.filter(p => p.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem('nut_bolt_color_sort_all_profiles_v1', JSON.stringify(allProfiles));
    
    // Also remove from leaderboard
    let leaderboard = this.loadLeaderboard();
    leaderboard = leaderboard.filter(item => item.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  },

  // Automated behavioral anti-bot validator
  validateHumanPlayer(profile: PlayerProfile): { isVerified: boolean; reason?: string } {
    const progresses = Object.values(profile.levelProgress || {});
    
    // Check 1: Robotic speed check
    const hasUnrealisticSpeed = progresses.some(p => p.completed && p.bestTime < 1.5 && p.levelId > 1);
    if (hasUnrealisticSpeed) {
      return {
        isVerified: false,
        reason: 'Cliques ultra-rápidos ou resolução instantânea (<1.5s)'
      };
    }
    
    // Check 2: Impossible moves per second (e.g. over 6 moves/sec is humanly impossible)
    const hasImpossibleMoveRate = progresses.some(p => {
      if (!p.completed || p.minMoves <= 2) return false;
      const movesPerSec = p.minMoves / p.bestTime;
      return movesPerSec > 6;
    });
    if (hasImpossibleMoveRate) {
      return {
        isVerified: false,
        reason: 'Frequência de jogadas sobre-humana (Script detectado)'
      };
    }

    // Check 3: Playtime vs Level Completion consistency
    const completedLevelsCount = progresses.filter(p => p.completed).length;
    if (completedLevelsCount >= 5 && profile.playTime < 10) {
      return {
        isVerified: false,
        reason: 'Sincronização impossível de níveis (Tempo de jogo nulo)'
      };
    }

    // Check 4: XP inconsistent manipulation
    if (profile.xp > 5000 && profile.gamesPlayed < 2) {
      return {
        isVerified: false,
        reason: 'Manipulação local de memória (Valores de XP alterados)'
      };
    }

    return { isVerified: true };
  },

  // Return list of flagged profiles for display/audit
  loadFlaggedProfiles(): { name: string; reason: string }[] {
    const allProfiles = this.loadAllProfiles();
    const flagged: { name: string; reason: string }[] = [];
    allProfiles.forEach(p => {
      if (!p.name) return;
      const check = this.validateHumanPlayer(p);
      if (!check.isVerified) {
        flagged.push({ name: p.name, reason: check.reason || 'Atividade atípica' });
      }
    });
    return flagged;
  },

  // Load Leaderboard (strictly filters real profiles only and checks for human validity)
  loadLeaderboard(): LeaderboardEntry[] {
    const allProfiles = this.loadAllProfiles();
    const leaderboard: LeaderboardEntry[] = [];
    
    allProfiles.forEach(p => {
      if (!p.name) return;
      
      // Perform strict anti-bot human validation
      const check = this.validateHumanPlayer(p);
      if (!check.isVerified) {
        return; // Exclude from ranking
      }
      
      const completedCount = Object.values(p.levelProgress || {}).filter((item: any) => item.completed).length;
      
      let maxLevelCompleted = 0;
      const bestTimePerLevel: Record<number, number> = {};
      
      Object.entries(p.levelProgress || {}).forEach(([lvlIdStr, progress]: [string, any]) => {
        const lvlId = parseInt(lvlIdStr, 10);
        if (progress.completed) {
          if (lvlId > maxLevelCompleted) {
            maxLevelCompleted = lvlId;
          }
          bestTimePerLevel[lvlId] = progress.bestTime;
        }
      });
      
      leaderboard.push({
        name: p.name,
        level: p.level,
        xp: p.xp,
        stars: p.totalStars,
        completedCount,
        totalTime: p.playTime,
        bestTimePerLevel,
        maxLevelCompleted
      });
    });

    // Default sorting of leaderboard is by XP descending
    leaderboard.sort((a, b) => b.xp - a.xp);

    // Limit to top 100
    const finalLeaderboard = leaderboard.slice(0, 100);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(finalLeaderboard));
    return finalLeaderboard;
  },

  // Update Player's Rank inside Leaderboard
  updatePlayerInLeaderboard(profile: PlayerProfile) {
    if (!profile.name) return;
    
    const check = this.validateHumanPlayer(profile);
    if (!check.isVerified) {
      // If suspicious, make sure they are removed from rankings completely
      let leaderboard = this.loadLeaderboard();
      leaderboard = leaderboard.filter(item => item.name.toLowerCase() !== profile.name.toLowerCase());
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
      return;
    }
    
    // Otherwise trigger a refresh of leaderboard
    this.loadLeaderboard();
  },

  // Full reset
  resetProgress() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem('nut_bolt_color_sort_all_profiles_v1');
    // keep settings but reset stats
  }
};
