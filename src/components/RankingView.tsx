/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeaderboardEntry, GameSettings, PlayerProfile } from '../types';
import { Trophy, Clock, Star, ArrowLeft, Award, ChevronDown } from 'lucide-react';
import audio from '../utils/audioEngine';
import ThemeParticles, { getThemeDetails } from './ThemeParticles';

interface RankingViewProps {
  leaderboard: LeaderboardEntry[];
  playerName: string;
  settings: GameSettings;
  profile: PlayerProfile;
  onClose: () => void;
}

type SortCriterion = 'xp' | 'level' | 'time';

export default function RankingView({ leaderboard, playerName, settings, profile, onClose }: RankingViewProps) {
  const isPt = settings.language === 'pt-BR';
  const [sortBy, setSortBy] = useState<SortCriterion>('xp');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const currentTheme = settings.theme === 'dark' ? 'classic' : 'classic'; // Default/active theme
  
  const selectedTheme = profile.selectedTheme || 'classic';

  const isClassicTheme = selectedTheme === 'classic';
  const themeDetails = getThemeDetails(selectedTheme, isPt);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimeMs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Get list of all completed levels
  const defaultLevels = [1, 2, 3, 4, 5];
  const availableLevels = Array.from(new Set([
    ...defaultLevels,
    ...leaderboard.flatMap(entry => Object.keys(entry.bestTimePerLevel || {}).map(Number))
  ])).sort((a, b) => a - b);

  // Dynamic sorting and filtering based on selected criterion
  const getSortedData = (): LeaderboardEntry[] => {
    let result = [...leaderboard];

    if (sortBy === 'xp') {
      result.sort((a, b) => b.xp - a.xp || b.completedCount - a.completedCount);
    } else if (sortBy === 'level') {
      result.sort((a, b) => {
        const maxA = a.maxLevelCompleted || a.level;
        const maxB = b.maxLevelCompleted || b.level;
        return maxB - maxA || b.xp - a.xp;
      });
    } else if (sortBy === 'time') {
      result = result.filter(entry => entry.bestTimePerLevel && entry.bestTimePerLevel[selectedLevel] !== undefined);
      result.sort((a, b) => {
        const timeA = a.bestTimePerLevel![selectedLevel];
        const timeB = b.bestTimePerLevel![selectedLevel];
        return timeA - timeB || b.xp - a.xp;
      });
    }

    return result.slice(0, 100);
  };

  const sortedLeaderboard = getSortedData();

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
          <Trophy size={16} className={isClassicTheme ? 'text-zinc-100' : 'text-amber-400 fill-amber-400'} />
          {isPt ? 'Classificação Global' : 'Leaderboard'}
        </h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Selector Tabs for Sorting */}
      <div className="px-6 mt-4 shrink-0 z-10">
        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
          isClassicTheme ? 'bg-zinc-900 border-zinc-800' : 'bg-black/30 border-white/10'
        }`}>
          <button
            onClick={() => { audio.playClick(); setSortBy('xp'); }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              sortBy === 'xp'
                ? isClassicTheme
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'bg-white/15 text-white font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Star size={12} className={`mb-0.5 ${sortBy === 'xp' ? '' : 'text-zinc-400'}`} fill={sortBy === 'xp' ? 'currentColor' : 'none'} />
            <span>XP</span>
          </button>

          <button
            onClick={() => { audio.playClick(); setSortBy('level'); }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              sortBy === 'level'
                ? isClassicTheme
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'bg-white/15 text-white font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Award size={12} className="mb-0.5" />
            <span>{isPt ? 'Nível Máx' : 'Max Level'}</span>
          </button>

          <button
            onClick={() => { audio.playClick(); setSortBy('time'); }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              sortBy === 'time'
                ? isClassicTheme
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'bg-white/15 text-white font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={12} className="mb-0.5" />
            <span>{isPt ? 'Tempo' : 'Time'}</span>
          </button>
        </div>

        {/* Level Selector Dropdown */}
        {sortBy === 'time' && (
          <div className={`mt-3 flex items-center justify-between p-2.5 rounded-xl text-xs border ${
            isClassicTheme ? 'bg-zinc-900/40 border-zinc-800' : 'bg-black/30 border-white/5'
          }`}>
            <span className="font-bold text-zinc-300 uppercase tracking-tight">
              {isPt ? 'Selecione o Nível:' : 'Select Level:'}
            </span>
            <div className="relative flex items-center">
              <select
                value={selectedLevel}
                onChange={(e) => {
                  audio.playClick();
                  setSelectedLevel(Number(e.target.value));
                }}
                className={`appearance-none rounded-lg py-1 pl-3 pr-8 font-mono font-bold outline-none cursor-pointer border ${
                  isClassicTheme
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                    : 'bg-white/10 border-white/10 text-white focus:border-white/30'
                }`}
              >
                {availableLevels.map(lvl => (
                  <option key={lvl} value={lvl} className="bg-zinc-950 text-white">
                    {isPt ? `Nível ${lvl}` : `Level ${lvl}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Description / Subtext */}
      <p className="mt-3 px-6 text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center z-10">
        {isPt 
          ? `Top 100 classificados por ${
              sortBy === 'xp' ? 'XP Total' : sortBy === 'level' ? 'Nível Máximo Concluído' : `Tempo no Nível ${selectedLevel}`
            }`
          : `Top 100 ranked by ${
              sortBy === 'xp' ? 'Total XP' : sortBy === 'level' ? 'Maximum Completed Level' : `Time on Level ${selectedLevel}`
            }`}
      </p>

      {/* Leaderboard Table */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 px-6 pr-4 z-10">
        {sortedLeaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 space-y-3">
            <Clock size={32} className="text-zinc-600 stroke-1" />
            <p className="text-xs uppercase font-bold tracking-wider">
              {isPt 
                ? `Ninguém completou o Nível ${selectedLevel} ainda` 
                : `No one has completed Level ${selectedLevel} yet`}
            </p>
            <p className="text-[10px] max-w-[240px] text-zinc-500">
              {isPt
                ? 'Seja o primeiro a vencer este nível para registrar o seu recorde!'
                : 'Be the first to solve this level and secure your high score record!'}
            </p>
          </div>
        ) : (
          sortedLeaderboard.map((player, idx) => {
            const rank = idx + 1;
            const isPlayer = player.name.toLowerCase() === playerName.toLowerCase();
            
            let medalColor = "";
            let bgStyle = isClassicTheme ? "bg-zinc-900 border border-zinc-850 rounded-[24px]" : "bg-black/40 border border-white/5 rounded-[24px]";
            let textStyle = "text-white";

            if (rank === 1) medalColor = isClassicTheme ? "text-zinc-100" : "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]";
            else if (rank === 2) medalColor = isClassicTheme ? "text-zinc-300" : "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]";
            else if (rank === 3) medalColor = isClassicTheme ? "text-zinc-400" : "text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]";

            if (isPlayer) {
              bgStyle = isClassicTheme
                ? "bg-zinc-800 border-zinc-100 rounded-[24px] shadow-lg ring-1 ring-zinc-500/10"
                : `bg-white/10 border-white rounded-[24px] shadow-lg ring-1 ring-white/10`;
              textStyle = "font-black text-white";
            }

            // Metric display logic depending on active sort criteria
            let mainMetricValue = "";
            let mainMetricLabel = "";
            let secondaryMetricValue = "";

            if (sortBy === 'xp') {
              mainMetricValue = `${player.xp} XP`;
              mainMetricLabel = `Nív. ${player.level}`;
              secondaryMetricValue = isPt ? `${player.completedCount} Níveis` : `${player.completedCount} Levels`;
            } else if (sortBy === 'level') {
              const maxLvl = player.maxLevelCompleted || player.level;
              mainMetricValue = isPt ? `Nível ${maxLvl}` : `Level ${maxLvl}`;
              mainMetricLabel = `${player.xp} XP`;
              secondaryMetricValue = isPt ? `${player.stars} Estrelas` : `${player.stars} Stars`;
            } else if (sortBy === 'time') {
              const levelTime = player.bestTimePerLevel?.[selectedLevel] || 0;
              mainMetricValue = formatTimeMs(levelTime);
              mainMetricLabel = `${player.xp} XP`;
              secondaryMetricValue = isPt ? `Nível ${player.maxLevelCompleted || player.level}` : `Level ${player.maxLevelCompleted || player.level}`;
            }

            return (
              <div
                key={player.name + '-' + idx}
                className={`flex items-center justify-between p-3.5 transition-all hover:scale-[1.01] ${bgStyle}`}
              >
                {/* Left Rank & Name */}
                <div className="flex items-center gap-3">
                  {/* Rank indicator */}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm shrink-0 border ${
                    isClassicTheme ? 'bg-zinc-950 border-zinc-900' : 'bg-black/50 border-white/5'
                  }`}>
                    {rank <= 3 ? (
                      <Trophy size={16} className={medalColor} />
                    ) : (
                      <span className="text-zinc-500 font-mono text-xs">#{rank}</span>
                    )}
                  </div>

                  {/* Name & Player level indicator */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs uppercase tracking-tight font-bold truncate max-w-[110px] ${textStyle}`}>
                        {player.name}
                      </span>
                      {isPlayer && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isClassicTheme ? 'bg-zinc-100 text-zinc-950' : 'bg-white text-black'
                        }`}>
                          {isPt ? 'Você' : 'You'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider font-mono">
                      <span>{mainMetricLabel}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{secondaryMetricValue}</span>
                    </div>
                  </div>
                </div>

                {/* Right Metric display */}
                <div className="flex flex-col items-end text-right">
                  {sortBy === 'time' ? (
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-1 rounded-lg border ${
                        isClassicTheme
                          ? 'text-zinc-100 bg-zinc-800 border-zinc-700'
                          : 'text-sky-300 bg-sky-500/10 border-sky-500/20'
                      }`}>
                        <Clock size={11} />
                        <span>{mainMetricValue}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                        isClassicTheme
                          ? 'text-zinc-100 bg-zinc-800 border-zinc-800'
                          : 'text-white bg-white/5 border-white/10'
                      }`}>
                        {mainMetricValue}
                      </span>
                      <div className="flex items-center gap-0.5 mt-1 text-zinc-500 text-[9px] font-mono">
                        <Clock size={8} />
                        <span>{formatTime(player.totalTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer message */}
      <footer className="p-6 border-t border-zinc-800 text-center shrink-0 z-10">
        <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-widest">
          {isPt 
            ? 'Banco de dados sincronizado localmente' 
            : 'Database synchronized locally'}
        </span>
      </footer>
    </div>
  );
}
