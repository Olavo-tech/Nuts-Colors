/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerProfile, GameSettings, LeaderboardEntry, LevelProgress } from './types';
import { storageService, calculateLevelFromXp } from './utils/storageService';
import MainMenu from './components/MainMenu';
import LevelSelector from './components/LevelSelector';
import RankingView from './components/RankingView';
import StatsView from './components/StatsView';
import ConfigView from './components/ConfigView';
import GameBoard from './components/GameBoard';
import audio from './utils/audioEngine';
import { motion, AnimatePresence } from 'motion/react';

type GameView = 'menu' | 'game' | 'levels' | 'ranking' | 'stats' | 'config';

export default function App() {
  // Load initial configurations
  const [profile, setProfile] = useState<PlayerProfile>(() => storageService.loadProfile());
  const [settings, setSettings] = useState<GameSettings>(() => storageService.loadSettings());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => storageService.loadLeaderboard());
  
  // Navigation
  const [currentView, setCurrentView] = useState<GameView>('menu');
  const [activeLevelId, setActiveLevelId] = useState<number>(1);

  // Play Time Tracker
  const [sessionStartTime] = useState<number>(() => Date.now());

  // Handle active class list updates for dark mode toggling
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageService.saveSettings(settings);
  }, [settings]);

  // Unlock and start music upon first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      audio.setMusicVolume(settings.musicVolume);
      audio.setSfxVolume(settings.sfxVolume);
      if (settings.musicVolume > 0) {
        audio.startMusic();
      }
      
      // Remove listeners once unlocked
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [settings.musicVolume, settings.sfxVolume]);

  // Periodic play time update
  useEffect(() => {
    const interval = setInterval(() => {
      setProfile(prev => {
        const updated = {
          ...prev,
          playTime: prev.playTime + 10
        };
        storageService.saveProfile(updated);
        return updated;
      });
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Update Player Profile Name (first startup)
  const handleUpdateProfileName = (name: string) => {
    const updated = {
      ...profile,
      name
    };
    setProfile(updated);
    storageService.saveProfile(updated);
    setLeaderboard(storageService.loadLeaderboard()); // Reload
  };

  // Select level to play
  const handleSelectLevel = (levelId: number) => {
    setActiveLevelId(levelId);
    setCurrentView('game');
  };

  // Handle level successfully solved!
  const handleLevelCompleted = (
    levelId: number,
    stats: LevelProgress,
    xpGained: number,
    playTimeSeconds: number
  ) => {
    const updatedProgress = { ...profile.levelProgress };
    
    // Check if player has already completed this level
    const prevRecord = updatedProgress[levelId];
    const isFirstTime = !prevRecord || !prevRecord.completed;

    // Track best stars & best stats
    const finalStars = Math.max(prevRecord?.stars || 0, stats.stars);
    const finalBestTime = prevRecord?.completed 
      ? Math.min(prevRecord.bestTime, playTimeSeconds) 
      : playTimeSeconds;
    const finalMinMoves = prevRecord?.completed 
      ? Math.min(prevRecord.minMoves, stats.minMoves) 
      : stats.minMoves;

    updatedProgress[levelId] = {
      levelId,
      completed: true,
      stars: finalStars,
      bestTime: finalBestTime,
      minMoves: finalMinMoves
    };

    // Calculate new total stars
    const totalStars = Object.values(updatedProgress).reduce<number>((acc, curr) => acc + (curr as LevelProgress).stars, 0);

    // Calculate current win streak
    const newStreak = profile.currentStreak + 1;
    const newBestStreak = Math.max(profile.bestStreak, newStreak);
    const coinReward = 50 + stats.stars * 20;

    const updatedProfile: PlayerProfile = {
      ...profile,
      xp: profile.xp + xpGained,
      gamesPlayed: profile.gamesPlayed + 1,
      wins: profile.wins + 1,
      movesCount: profile.movesCount + stats.minMoves,
      playTime: profile.playTime + playTimeSeconds,
      totalStars,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      levelProgress: updatedProgress,
      lastPlayedLevel: levelId + 1, // Advance last played level pointer
      coins: (profile.coins ?? 200) + coinReward
    };

    setProfile(updatedProfile);
    storageService.saveProfile(updatedProfile);
    setLeaderboard(storageService.loadLeaderboard()); // Reload scoreboard
  };

  // Track surrenders or restarts
  const handleIncrementLosses = () => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      losses: profile.losses + 1,
      gamesPlayed: profile.gamesPlayed + 1,
      currentStreak: 0 // Reset current win streak
    };
    setProfile(updatedProfile);
    storageService.saveProfile(updatedProfile);
  };

  // Hard reset progress
  const handleResetProgress = () => {
    storageService.resetProgress();
    setProfile({
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
      lastPlayedLevel: 1
    });
    setLeaderboard(storageService.loadLeaderboard());
    setCurrentView('menu');
  };

  // Save Settings wrapper
  const handleChangeSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    // Audio engine volume updates
    audio.setMusicVolume(newSettings.musicVolume);
    audio.setSfxVolume(newSettings.sfxVolume);
    if (newSettings.musicVolume > 0) {
      audio.startMusic();
    } else {
      audio.stopMusic();
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-0 sm:p-6 transition-colors duration-300">
      
      {/* Desktop Device Frame Wrap */}
      <div 
        id="app-container"
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden pro-bg text-white shadow-none sm:h-[840px] sm:rounded-[36px] sm:border-[8px] border-slate-800 sm:shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-all"
      >
        {/* Device Notch decoration for premium aesthetic */}
        <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 rounded-t-lg hidden sm:block z-50">
          <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-slate-800" />
        </div>

        {/* Dynamic Views wrapper */}
        <div className="flex-1 mt-0 sm:mt-2 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {currentView === 'menu' && (
                <MainMenu
                  profile={profile}
                  settings={settings}
                  onUpdateProfileName={handleUpdateProfileName}
                  onNavigate={(view) => {
                    audio.playClick();
                    setCurrentView(view as any);
                  }}
                  onResetProgress={handleResetProgress}
                  onSwitchProfile={(newProf) => {
                    setProfile(newProf);
                    setLeaderboard(storageService.loadLeaderboard());
                  }}
                />
              )}

              {currentView === 'levels' && (
                <LevelSelector
                  profile={profile}
                  settings={settings}
                  onSelectLevel={handleSelectLevel}
                  onClose={() => setCurrentView('menu')}
                />
              )}

              {currentView === 'ranking' && (
                <RankingView
                  leaderboard={leaderboard}
                  playerName={profile.name}
                  settings={settings}
                  profile={profile}
                  onClose={() => setCurrentView('menu')}
                />
              )}

              {currentView === 'stats' && (
                <StatsView
                  profile={profile}
                  settings={settings}
                  onClose={() => setCurrentView('menu')}
                />
              )}

              {currentView === 'config' && (
                <ConfigView
                  settings={settings}
                  profile={profile}
                  onChangeSettings={handleChangeSettings}
                  onClose={() => setCurrentView('menu')}
                  onResetProgress={handleResetProgress}
                />
              )}

              {currentView === 'game' && (
                <GameBoard
                  levelId={activeLevelId}
                  profile={profile}
                  settings={settings}
                  onLevelCompleted={handleLevelCompleted}
                  onNavigateHome={() => setCurrentView('menu')}
                  onNavigateLevels={() => setCurrentView('levels')}
                  onIncrementLosses={handleIncrementLosses}
                  onSelectLevel={(id) => {
                    setActiveLevelId(id);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
