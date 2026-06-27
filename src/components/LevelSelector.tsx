/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProfile, GameSettings } from '../types';
import { Star, Lock, ArrowLeft, Award, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import audio from '../utils/audioEngine';
import ThemeParticles, { getThemeDetails } from './ThemeParticles';

interface LevelSelectorProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export default function LevelSelector({ profile, settings, onSelectLevel, onClose }: LevelSelectorProps) {
  const isPt = settings.language === 'pt-BR';
  const currentTheme = profile.selectedTheme || 'classic';
  const themeDetails = getThemeDetails(currentTheme, isPt);
  
  // Display 50 procedural levels
  const TOTAL_LEVELS = 50;
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine unlocked levels
  // A level is unlocked if it is Level 1, OR if the previous level was completed.
  const isUnlocked = (levelId: number) => {
    if (levelId === 1) return true;
    const prevProgress = profile.levelProgress[levelId - 1];
    return prevProgress && prevProgress.completed;
  };

  const getDifficultyColor = (levelId: number) => {
    if (currentTheme === 'classic') {
      if (levelId <= 3) return 'text-zinc-400 bg-zinc-800/40 border-zinc-700/50';
      if (levelId <= 10) return 'text-zinc-300 bg-zinc-700/40 border-zinc-600/50';
      if (levelId <= 20) return 'text-zinc-200 bg-zinc-600/40 border-zinc-500/50';
      if (levelId <= 35) return 'text-zinc-100 bg-zinc-500/40 border-zinc-400/50';
      return 'text-white bg-zinc-100/10 border-zinc-100/30';
    }

    if (levelId <= 3) return 'text-green-500 bg-green-500/10 border-green-500/20'; // Fácil
    if (levelId <= 10) return 'text-sky-500 bg-sky-500/10 border-sky-500/20'; // Médio
    if (levelId <= 20) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'; // Difícil
    if (levelId <= 35) return 'text-purple-500 bg-purple-500/10 border-purple-500/20'; // Perito
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20'; // Mestre
  };

  const getDifficultyLabel = (levelId: number) => {
    if (levelId <= 3) return isPt ? 'Fácil' : 'Easy';
    if (levelId <= 10) return isPt ? 'Médio' : 'Medium';
    if (levelId <= 20) return isPt ? 'Difícil' : 'Hard';
    if (levelId <= 35) return isPt ? 'Insano' : 'Insane';
    return isPt ? 'Mestre' : 'Master';
  };

  // Container variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } }
  };

  const isClassicTheme = currentTheme === 'classic';

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto relative text-white">
      {/* Dynamic Theme Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeDetails.gradient} transition-all duration-1000 z-0`} />
      <ThemeParticles theme={currentTheme as any} />

      {/* Header */}
      <header className={`h-20 w-full flex items-center justify-between px-6 border-b backdrop-blur-md z-10 shrink-0 ${
        isClassicTheme ? 'border-zinc-800 bg-zinc-950/40' : 'border-white/10 bg-black/40'
      }`}>
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isClassicTheme
              ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100'
              : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
          }`}
          title="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold tracking-tight uppercase text-white font-display flex items-center gap-2">
          <Zap size={16} className={isClassicTheme ? 'text-zinc-100' : 'text-amber-400 fill-amber-400'} />
          {isPt ? 'Seleção de Níveis' : 'Select Level'}
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Sub-Header stats summary */}
      <div className={`mx-6 mt-4 flex items-center justify-around p-3.5 z-10 ${
        isClassicTheme
          ? 'bg-zinc-900 border border-zinc-800 rounded-[24px]'
          : 'bg-black/30 border border-white/15 rounded-[24px]'
      }`}>
        <div className="text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            {isPt ? 'Estrelas' : 'Stars'}
          </span>
          <span className="text-sm font-mono font-bold text-white flex items-center gap-1 justify-center mt-0.5">
            <Star size={14} className={isClassicTheme ? 'text-zinc-300 fill-zinc-300' : 'text-amber-400 fill-amber-400'} />
            {profile.totalStars}
          </span>
        </div>
        <div className={`h-6 w-[1px] ${isClassicTheme ? 'bg-zinc-800' : 'bg-white/10'}`} />
        <div className="text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            {isPt ? 'Concluídos' : 'Cleared'}
          </span>
          <span className="text-sm font-mono font-bold text-white block mt-0.5">
            {Object.values(profile.levelProgress).filter(p => p.completed).length} / {TOTAL_LEVELS}
          </span>
        </div>
      </div>

      {/* Levels Scrollable Grid */}
      <div className="my-6 flex-1 overflow-y-auto px-6 pr-4 z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {levels.map((levelId) => {
            const unlocked = isUnlocked(levelId);
            const progress = profile.levelProgress[levelId];
            const stars = progress?.stars || 0;
            const completed = progress?.completed || false;
            const bestTime = progress?.bestTime || 0;
            const minMoves = progress?.minMoves || 0;

            const diffColor = getDifficultyColor(levelId);
            const diffLabel = getDifficultyLabel(levelId);

            if (!unlocked) {
              return (
                <motion.div
                  key={levelId}
                  variants={itemVariants}
                  className={`relative flex flex-col justify-between border p-4 h-32 text-zinc-500 rounded-[24px] ${
                    isClassicTheme
                      ? 'bg-zinc-950/40 border-zinc-900'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-xs font-mono font-bold">Nível {levelId}</span>
                    <Lock size={14} />
                  </div>
                  <div className="flex flex-col items-center justify-center my-1 text-[11px] font-bold text-zinc-500 uppercase tracking-widest opacity-30">
                    {diffLabel}
                  </div>
                  <div className="text-center text-[10px] text-zinc-600 mt-1 font-mono uppercase tracking-widest">
                    {isPt ? 'Bloqueado' : 'Locked'}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.button
                key={levelId}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  audio.playClick();
                  onSelectLevel(levelId);
                }}
                className={`flex flex-col justify-between h-32 cursor-pointer text-left rounded-[24px] border p-4 transition-all ${
                  completed
                    ? isClassicTheme
                      ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-400'
                      : 'bg-black/50 border-white/10 hover:border-white/30'
                    : isClassicTheme
                      ? 'bg-zinc-800 border-zinc-100 hover:border-zinc-300 animate-pulse'
                      : 'bg-white/10 border-white/50 hover:border-white animate-pulse'
                }`}
              >
                {/* Level Title & Difficulty */}
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white font-display uppercase tracking-tight">
                      {isPt ? 'Nível' : 'Level'} {levelId}
                    </span>
                    <span className={`text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded-full mt-1.5 border ${diffColor}`}>
                      {diffLabel}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  {completed ? (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isClassicTheme
                        ? 'text-zinc-200 bg-zinc-800'
                        : 'text-emerald-400 bg-emerald-500/15'
                    }`}>
                      {isPt ? 'Fim' : 'Done'}
                    </span>
                  ) : (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isClassicTheme
                        ? 'text-zinc-950 bg-zinc-100'
                        : 'text-white bg-white/20'
                    }`}>
                      {isPt ? 'Jogar' : 'Play'}
                    </span>
                  )}
                </div>

                {/* Stars container */}
                <div className={`flex items-center gap-0.5 my-1 ${isClassicTheme ? 'text-zinc-200' : 'text-amber-500'}`}>
                  {Array.from({ length: 3 }).map((_, sIdx) => (
                    <Star
                      key={sIdx}
                      size={13}
                      className={sIdx < stars ? (isClassicTheme ? 'text-zinc-100 fill-zinc-100' : 'text-amber-400 fill-amber-400') : 'text-zinc-800'}
                    />
                  ))}
                </div>

                {/* Star statistics details */}
                <div className="flex justify-between items-center w-full text-[9px] text-zinc-500 font-mono font-semibold">
                  <span>{completed && bestTime ? formatTime(bestTime) : '--:--'}</span>
                  <span>{completed && minMoves ? `${minMoves}m` : '-- movs'}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
