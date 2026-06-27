/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerProfile, GameSettings } from '../types';
import { BarChart3, Clock, Flame, Star, Percent, Award, ArrowLeft, TrendingUp } from 'lucide-react';
import audio from '../utils/audioEngine';
import ThemeParticles, { getThemeDetails } from './ThemeParticles';

interface StatsViewProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onClose: () => void;
}

export default function StatsView({ profile, settings, onClose }: StatsViewProps) {
  const isPt = settings.language === 'pt-BR';

  const selectedTheme = profile.selectedTheme || 'classic';

  const isClassicTheme = selectedTheme === 'classic';
  const themeDetails = getThemeDetails(selectedTheme, isPt);

  const completedLevels = Object.values(profile.levelProgress).filter(p => p.completed);
  const totalCompleted = completedLevels.length;

  const totalPossibleStars = totalCompleted * 3;
  const currentStars = profile.totalStars;
  const starPercentage = totalPossibleStars > 0 ? Math.round((currentStars / totalPossibleStars) * 100) : 0;

  // Victory Rate
  const totalGames = profile.gamesPlayed || 0;
  const wins = profile.wins || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Format Total Time
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Average time per completed level
  const totalTimeSpent = profile.playTime || 0;
  const avgTimePerLevel = totalCompleted > 0 ? Math.round(totalTimeSpent / totalCompleted) : 0;
  const formatAvgTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Prepare simple dynamic SVG chart data (last 6 levels)
  const lastLevels = Object.values(profile.levelProgress)
    .filter(p => p.completed)
    .sort((a, b) => a.levelId - b.levelId)
    .slice(-6);

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto relative text-white">
      {/* Dynamic Theme Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeDetails.gradient} transition-all duration-1000 z-0`} />
      <ThemeParticles theme={selectedTheme as any} />

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
          <BarChart3 size={16} className={isClassicTheme ? 'text-zinc-100' : 'text-amber-400'} />
          {isPt ? 'Suas Estatísticas' : 'Your Stats'}
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Grid Content */}
      <div className="my-6 flex-1 overflow-y-auto px-6 pr-4 space-y-4 z-10">
        
        {/* Top Highlight Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* XP & Player level */}
          <div className={`rounded-[24px] p-4 border text-white shadow-lg flex flex-col justify-between ${
            isClassicTheme
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-gradient-to-br from-indigo-600/30 to-black/50 border-indigo-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isClassicTheme ? 'text-zinc-400' : 'text-indigo-200/80'}`}>
                {isPt ? 'Nível do Jogador' : 'Player Level'}
              </span>
              <Award size={16} className={isClassicTheme ? 'text-zinc-100' : 'text-indigo-400 animate-pulse'} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black font-display tracking-tight text-white">{profile.level}</span>
              <p className={`text-[9px] font-mono font-bold uppercase tracking-wider mt-1 ${isClassicTheme ? 'text-zinc-400' : 'text-indigo-300'}`}>
                {profile.xp} XP {isPt ? 'TOTAIS' : 'TOTAL'}
              </p>
            </div>
          </div>

          {/* Stars Card */}
          <div className={`rounded-[24px] p-4 border text-white shadow-lg flex flex-col justify-between ${
            isClassicTheme
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-gradient-to-br from-amber-500/20 to-black/50 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isClassicTheme ? 'text-zinc-400' : 'text-amber-200/80'}`}>
                {isPt ? 'Estrelas' : 'Stars Earned'}
              </span>
              <Star size={16} className={isClassicTheme ? 'text-zinc-100 fill-zinc-100' : 'text-amber-400 fill-amber-400'} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black font-display tracking-tight text-white">{profile.totalStars}</span>
              <p className={`text-[9px] font-mono font-bold uppercase tracking-wider mt-1 ${isClassicTheme ? 'text-zinc-400' : 'text-amber-300'}`}>
                {starPercentage}% {isPt ? 'EFICIÊNCIA' : 'EFFICIENCY'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Play Time */}
          <div className={`p-3 flex gap-3 items-center rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isClassicTheme ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}>
              <Clock size={15} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {isPt ? 'Tempo Total' : 'Total Time'}
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1 truncate">
                {formatTime(totalTimeSpent)}
              </span>
            </div>
          </div>

          {/* Average Time */}
          <div className={`p-3 flex gap-3 items-center rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isClassicTheme ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            }`}>
              <Clock size={15} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {isPt ? 'Tempo Médio' : 'Avg Time'}
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1 truncate">
                {formatAvgTime(avgTimePerLevel)}
              </span>
            </div>
          </div>

          {/* Success Rate */}
          <div className={`p-3 flex gap-3 items-center rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isClassicTheme ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Percent size={15} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {isPt ? 'Taxa Vitórias' : 'Win Rate'}
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1">
                {winRate}%
              </span>
            </div>
          </div>

          {/* Current Streak */}
          <div className={`p-3 flex gap-3 items-center rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isClassicTheme ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Flame size={15} className={isClassicTheme ? '' : 'animate-pulse'} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {isPt ? 'Sequência' : 'Best Streak'}
              </span>
              <span className="text-xs font-mono font-bold text-white mt-1">
                {profile.bestStreak} {isPt ? 'vit.' : 'wins'}
              </span>
            </div>
          </div>

          {/* Completed levels */}
          <div className={`p-3 flex flex-col justify-between rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">
              {isPt ? 'Fases Feitas' : 'Levels Cleared'}
            </span>
            <span className="text-lg font-mono font-extrabold text-white">
              {totalCompleted}
            </span>
          </div>

          {/* Total moves */}
          <div className={`p-3 flex flex-col justify-between rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">
              {isPt ? 'Total de Movs' : 'Total Moves'}
            </span>
            <span className="text-lg font-mono font-extrabold text-white">
              {profile.movesCount}
            </span>
          </div>

          {/* Wins detail */}
          <div className={`p-3 flex flex-col justify-between rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">
              {isPt ? 'Vitórias' : 'Wins'}
            </span>
            <span className={`text-lg font-mono font-extrabold ${isClassicTheme ? 'text-zinc-100' : 'text-emerald-400'}`}>
              {wins}
            </span>
          </div>

          {/* Losses detail */}
          <div className={`p-3 flex flex-col justify-between rounded-[24px] border ${
            isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'
          }`}>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">
              {isPt ? 'Desist./Reset' : 'Losses/Restarts'}
            </span>
            <span className={`text-lg font-mono font-extrabold ${isClassicTheme ? 'text-zinc-300' : 'text-rose-400'}`}>
              {profile.losses}
            </span>
          </div>
        </div>

        {/* Level Performance Chart (SVG Based) */}
        <div className={`p-4 rounded-[24px] border ${isClassicTheme ? 'bg-zinc-900 border-zinc-850' : 'bg-black/30 border-white/5'}`}>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <TrendingUp size={14} className={isClassicTheme ? 'text-zinc-300' : 'text-indigo-400'} />
            {isPt ? 'Desempenho (Últimos 6 Níveis)' : 'Performance (Last 6 Levels)'}
          </span>

          {lastLevels.length === 0 ? (
            <div className="flex h-28 items-center justify-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider italic">
              {isPt ? 'Conclua fases para gerar o gráfico!' : 'Clear levels to populate the graph!'}
            </div>
          ) : (
            <div className="flex flex-col items-stretch">
              <div className={`flex h-32 items-end justify-between px-2 pb-1 border-b ${isClassicTheme ? 'border-zinc-800' : 'border-white/10'}`}>
                {lastLevels.map((p, i) => {
                  const heightPercentage = Math.max(20, (p.stars / 3) * 100);
                  
                  let starColor = "";
                  if (isClassicTheme) {
                    const colors = ['bg-zinc-700 border-zinc-600', 'bg-zinc-500 border-zinc-400', 'bg-zinc-200 border-zinc-100'];
                    starColor = colors[p.stars - 1] || 'bg-zinc-800 border-zinc-700';
                  } else {
                    const colors = ['bg-amber-500/60 border-amber-500', 'bg-amber-500/80 border-amber-400', 'bg-amber-400 border-amber-300'];
                    starColor = colors[p.stars - 1] || 'bg-slate-800 border-slate-700';
                  }
                  
                  return (
                    <div key={p.levelId} className="flex flex-col items-center flex-1 mx-1.5 h-full justify-end">
                      {/* Hover stats label */}
                      <span className="text-[9px] font-mono font-semibold text-zinc-400 mb-1 leading-none text-center">
                        {p.stars} ⭐<br/>
                        <span className="text-[7px] text-zinc-500">{p.minMoves}m</span>
                      </span>

                      {/* Bar */}
                      <div 
                        className={`w-full rounded-t border transition-all duration-500 ${starColor} hover:brightness-110 shadow-sm`}
                        style={{ height: `${heightPercentage * 0.6}%` }}
                      />

                      {/* Level Num */}
                      <span className="text-[9px] font-mono font-black text-zinc-500 mt-1.5">
                        N{p.levelId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer text */}
      <footer className="p-6 border-t border-zinc-850 text-center">
        <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest">
          {isPt 
            ? 'Continue completando fases de forma rápida' 
            : 'Continue completing levels quickly'}
        </span>
      </footer>
    </div>
  );
}
