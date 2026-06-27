/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameLevel, PlayerProfile, GameSettings, NutColor, LevelProgress, GameHistoryState } from '../types';
import { isBoltComplete, isBoardSolved, solvePuzzle, COLOR_MAP, ALL_COLORS, generateLevel } from '../utils/gameEngine';
import { Play, RotateCcw, Undo2, Redo2, HelpCircle, Star, Pause, ArrowRight, Home, List, ChevronRight, Trophy, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import audio from '../utils/audioEngine';
import Confetti from './Confetti';
import { calculateLevelFromXp } from '../utils/storageService';
import ThemeParticles, { getThemeForLevel, getThemeDetails } from './ThemeParticles';

interface GameBoardProps {
  levelId: number;
  profile: PlayerProfile;
  settings: GameSettings;
  onLevelCompleted: (levelId: number, stats: LevelProgress, xpGained: number, playTimeSeconds: number) => void;
  onNavigateHome: () => void;
  onNavigateLevels: () => void;
  onIncrementLosses: () => void;
  onSelectLevel: (levelId: number) => void;
  multiplayerMode?: {
    opponentName: string;
    opponentRankPoints: number;
    onMatchEnd: (userWon: boolean, userMoves: number, userTime: number) => void;
  };
}

export default function GameBoard({
  levelId,
  profile,
  settings,
  onLevelCompleted,
  onNavigateHome,
  onNavigateLevels,
  onIncrementLosses,
  onSelectLevel,
  multiplayerMode
}: GameBoardProps) {
  const isPt = settings.language === 'pt-BR';

  // State
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [bolts, setBolts] = useState<NutColor[][]>([]);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [history, setHistory] = useState<GameHistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<GameHistoryState[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [optimalMoves, setOptimalMoves] = useState(10);
  
  // Timer
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Overlay states
  const [isPaused, setIsPaused] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [xpProgress, setXpProgress] = useState({ initial: 0, current: 0, nextLevelXp: 500, previousLevel: 1, currentLevel: 1 });
  const [starsAwarded, setStarsAwarded] = useState(0);
  const [shakingPeg, setShakingPeg] = useState<number | null>(null);

  // Sparkles and Particles
  const [particleBurst, setParticleBurst] = useState<{ x: number; y: number; count: number; colors?: string[] } | null>(null);
  
  // Hint State
  const [hintMove, setHintMove] = useState<{ from: number; to: number } | null>(null);

  // Completed pegs cache (to trigger sparkle burst exactly ONCE when a peg becomes completed)
  const completedPegsRef = useRef<Record<number, boolean>>({});

  // Multiplayer simulation states
  const [opponentMovesCount, setOpponentMovesCount] = useState(0);
  const [opponentCompletedPegs, setOpponentCompletedPegs] = useState(0);
  const [opponentStatus, setOpponentStatus] = useState<'solving' | 'thinking' | 'idle'>('solving');

  const totalTargetPegs = level ? level.bolts.filter(b => b.length > 0).length : 2;

  // Simulated opponent speedrun logic for multiplayer match
  useEffect(() => {
    if (!multiplayerMode || !level || isWon || isPaused) return;

    // Determine speed based on opponent ranking
    let moveDelay = 1800; // default 1.8s
    const points = multiplayerMode.opponentRankPoints;
    if (points >= 2000) moveDelay = 1200; // Master/Legend is super fast!
    else if (points >= 1600) moveDelay = 1450; // Plat/Diamond
    else if (points >= 1400) moveDelay = 1700; // Gold
    else if (points >= 1200) moveDelay = 2000; // Silver
    else moveDelay = 2400; // Bronze is relaxed

    const interval = setInterval(() => {
      // Simulate state updates
      setOpponentMovesCount(prev => {
        const nextMoves = prev + 1;
        
        // Randomly simulate thinking / idle states
        const rand = Math.random();
        if (rand < 0.15) {
          setOpponentStatus('thinking');
        } else if (rand < 0.3) {
          setOpponentStatus('idle');
        } else {
          setOpponentStatus('solving');
        }

        // Calculate progress matching completed pegs count
        const oppCompleted = Math.min(totalTargetPegs, Math.floor((nextMoves / optimalMoves) * totalTargetPegs));
        setOpponentCompletedPegs(oppCompleted);

        // Check if opponent solved it first
        if (nextMoves >= optimalMoves) {
          clearInterval(interval);
          multiplayerMode.onMatchEnd(false, movesCount, seconds);
        }

        return nextMoves;
      });
    }, moveDelay);

    return () => clearInterval(interval);
  }, [multiplayerMode, level, isWon, isPaused, optimalMoves, totalTargetPegs, movesCount, seconds]);

  // Setup level
  useEffect(() => {
    // Generate level
    const levelData = generateLevel(levelId);
    
    setLevel(levelData);
    setBolts(levelData.bolts);
    setSelectedPeg(null);
    setHistory([]);
    setRedoStack([]);
    setMovesCount(0);
    setSeconds(0);
    setTimerActive(true);
    setIsPaused(false);
    setIsWon(false);
    setHintMove(null);
    completedPegsRef.current = {};
    setOpponentMovesCount(0);
    setOpponentCompletedPegs(0);
    setOpponentStatus('solving');

    // Run BFS solver at start to calculate optimal moves
    const optimalPath = solvePuzzle(levelData.bolts, levelData.capacity, 2500);
    if (optimalPath) {
      setOptimalMoves(optimalPath.length);
    } else {
      setOptimalMoves(Math.max(8, levelId * 2));
    }

    // Initialize completed pegs ref
    levelData.bolts.forEach((bolt, idx) => {
      completedPegsRef.current[idx] = isBoltComplete(bolt, levelData.capacity) && bolt.length > 0;
    });
  }, [levelId]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (timerActive && !isPaused && !isWon) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isPaused, isWon]);

  // Handle Peg selection / move
  const handlePegClick = (pegIdx: number, event?: React.MouseEvent) => {
    if (isWon || isPaused || !level) return;

    // Reset hint highlight on action
    setHintMove(null);

    const currentBolt = bolts[pegIdx];

    // Case 1: No peg selected yet
    if (selectedPeg === null) {
      if (currentBolt.length === 0) {
        audio.playError();
        triggerPegShake(pegIdx);
        return; // Empty peg, cannot select
      }
      
      // Select top nut
      setSelectedPeg(pegIdx);
      audio.playMove(true);
    } 
    // Case 2: A peg is already selected
    else {
      // Tap selected peg again -> deselect
      if (selectedPeg === pegIdx) {
        setSelectedPeg(null);
        audio.playMove(false);
        return;
      }

      // Perform Move
      const sourceBolt = bolts[selectedPeg];
      const nutColor = sourceBolt[sourceBolt.length - 1];
      
      const isTargetEmpty = currentBolt.length === 0;
      const isTargetFull = currentBolt.length >= level.capacity;
      const isTargetSameColor = !isTargetEmpty && currentBolt[currentBolt.length - 1] === nutColor;

      // Validate legality
      if (isTargetFull || (!isTargetEmpty && !isTargetSameColor)) {
        // Illegal move!
        audio.playError();
        triggerPegShake(pegIdx);
        // Deselect or keep selected? Let's drop back to source peg
        setSelectedPeg(null);
        return;
      }

      // Valid move! Save history state
      const beforeMoveState: GameHistoryState = {
        bolts: bolts.map(b => [...b])
      };
      setHistory(prev => [...prev, beforeMoveState]);
      setRedoStack([]); // Clear redo stack on new action

      // Apply move
      const nextBolts = bolts.map((bolt, idx) => {
        if (idx === selectedPeg) {
          return bolt.slice(0, -1);
        }
        if (idx === pegIdx) {
          return [...bolt, nutColor];
        }
        return bolt;
      });

      setBolts(nextBolts);
      setSelectedPeg(null);
      setMovesCount(prev => prev + 1);
      audio.playMove(false);

      // Check if this bolt just got completed
      const wasComplete = completedPegsRef.current[pegIdx];
      const isNowComplete = isBoltComplete(nextBolts[pegIdx], level.capacity) && nextBolts[pegIdx].length > 0;
      if (isNowComplete && !wasComplete) {
        completedPegsRef.current[pegIdx] = true;
        // Trigger localized sparkle effects!
        audio.playSuccess();
        
        // Find coordinates of peg for explosion
        if (event) {
          const rect = event.currentTarget.getBoundingClientRect();
          setParticleBurst({
            x: rect.left + rect.width / 2,
            y: rect.top,
            count: 35,
            colors: [COLOR_MAP[nutColor].hex, '#ffffff', '#fbbf24']
          });
          setTimeout(() => setParticleBurst(null), 100);
        }
      }

      // Check victory
      if (isBoardSolved(nextBolts, level.capacity)) {
        if (multiplayerMode) {
          multiplayerMode.onMatchEnd(true, movesCount + 1, seconds);
        } else {
          handleVictory(nextBolts);
        }
      }
    }
  };

  const triggerPegShake = (idx: number) => {
    setShakingPeg(idx);
    setTimeout(() => setShakingPeg(null), 500);
  };

  // Undo previous move
  const handleUndo = () => {
    if (history.length === 0 || isWon || isPaused) return;
    audio.playClick();
    setHintMove(null);

    const prevHistory = [...history];
    const previousState = prevHistory.pop()!;
    
    const currentState: GameHistoryState = {
      bolts: bolts.map(b => [...b])
    };

    setHistory(prevHistory);
    setRedoStack(prev => [currentState, ...prev]);
    setBolts(previousState.bolts);
    setSelectedPeg(null);
    setMovesCount(prev => Math.max(0, prev - 1));
  };

  // Redo undone move
  const handleRedo = () => {
    if (redoStack.length === 0 || isWon || isPaused) return;
    audio.playClick();
    setHintMove(null);

    const nextRedo = [...redoStack];
    const nextState = nextRedo.shift()!;

    const currentState: GameHistoryState = {
      bolts: bolts.map(b => [...b])
    };

    setHistory(prev => [...prev, currentState]);
    setRedoStack(nextRedo);
    setBolts(nextState.bolts);
    setSelectedPeg(null);
    setMovesCount(prev => prev + 1);
  };

  // Reset the level to original
  const handleRestart = () => {
    if (!level) return;
    audio.playClick();
    onIncrementLosses(); // record as restart/loss
    setBolts(level.bolts);
    setSelectedPeg(null);
    setHistory([]);
    setRedoStack([]);
    setMovesCount(0);
    setSeconds(0);
    setHintMove(null);
    completedPegsRef.current = {};
    setOpponentMovesCount(0);
    setOpponentCompletedPegs(0);
    setOpponentStatus('solving');
    level.bolts.forEach((bolt, idx) => {
      completedPegsRef.current[idx] = isBoltComplete(bolt, level.capacity) && bolt.length > 0;
    });
  };

  // Activate hint
  const handleShowHint = () => {
    if (!level || isWon || isPaused) return;
    audio.playClick();

    // Run BFS solver on current state
    const moves = solvePuzzle(bolts, level.capacity, 2500);
    if (moves && moves.length > 0) {
      const nextMove = moves[0];
      setHintMove({ from: nextMove.from, to: nextMove.to });
      // Remove hint after 4 seconds
      setTimeout(() => {
        setHintMove(prev => {
          if (prev?.from === nextMove.from && prev?.to === nextMove.to) {
            return null;
          }
          return prev;
        });
      }, 4000);
    } else {
      // No solution or unsolvable state from current layout
      audio.playError();
      alert(isPt ? 'Layout atual sem solução! Recomendamos reiniciar o nível.' : 'No solution from current layout! Recommend restarting the level.');
    }
  };

  // Calculate Stars & complete level
  const handleVictory = (finalBolts: NutColor[][]) => {
    setTimerActive(false);
    setIsWon(true);
    audio.playWin();

    // Stars Calculation
    // optimalMoves is baseline.
    let stars = 1;
    if (movesCount <= optimalMoves + 1) {
      stars = 3;
    } else if (movesCount <= optimalMoves + 5) {
      stars = 2;
    }

    setStarsAwarded(stars);

    // XP calculation
    // 3 Stars = 500 XP, 2 Stars = 250 XP, 1 Star = 100 XP
    const xpAwards = [100, 250, 500];
    const xpGained = xpAwards[stars - 1] || 100;

    // Calculate XP stats before saving to show progression
    const beforeProg = calculateLevelFromXp(profile.xp);
    const afterProg = calculateLevelFromXp(profile.xp + xpGained);

    setXpProgress({
      initial: beforeProg.xpForCurrentLevel,
      current: afterProg.xpForCurrentLevel,
      nextLevelXp: afterProg.xpForNextLevel,
      previousLevel: beforeProg.level,
      currentLevel: afterProg.level
    });

    // Save progress callback
    const levelStats: LevelProgress = {
      levelId,
      completed: true,
      stars,
      bestTime: seconds,
      minMoves: movesCount
    };

    onLevelCompleted(levelId, levelStats, xpGained, seconds);

    // If level-up occurred, play level-up SFX slightly later
    if (afterProg.level > beforeProg.level) {
      setTimeout(() => {
        audio.playLevelUp();
      }, 1400);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Star Indicators on Gameboard Header
  const renderHeaderStars = () => {
    let projectedStars = 1;
    if (movesCount <= optimalMoves + 1) projectedStars = 3;
    else if (movesCount <= optimalMoves + 5) projectedStars = 2;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < projectedStars ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-800'}
          />
        ))}
      </div>
    );
  };

  const currentTheme = getThemeForLevel(levelId);
  const themeDetails = getThemeDetails(currentTheme, isPt);
  const selectedTheme = profile.selectedTheme || 'classic';
  
  let activeGradient = "from-zinc-950 via-zinc-900 to-zinc-950";
  let pegClass = "absolute top-4 w-4 h-28 rounded-md shadow-inner z-0 border transition-all duration-500 ";
  let grooveClass = "h-[2px] w-full transition-colors duration-500 ";
  let nutClassAddon = "rounded ";

  switch (selectedTheme) {
    case 'cyber':
      activeGradient = "from-[#080314] via-[#05020a] to-[#010103]";
      pegClass += "bg-[#1a0b2d] border-[#2b174a]";
      grooveClass += "bg-[#0c0416]";
      nutClassAddon = "rounded-lg border border-fuchsia-950 ";
      break;
    case 'wood':
      activeGradient = "from-[#231710] via-[#1a100a] to-[#0f0a06]";
      pegClass += "bg-[#382014] border-amber-950";
      grooveClass += "bg-amber-950";
      nutClassAddon = "rounded-md border border-amber-950 ";
      break;
    case 'lava':
      activeGradient = "from-[#1a0604] via-[#0d0302] to-black";
      pegClass += "bg-red-900 border-red-950";
      grooveClass += "bg-red-950";
      nutClassAddon = "rounded-md border border-red-950 ";
      break;
    case 'toxic':
      activeGradient = "from-[#041208] via-[#020904] to-black";
      pegClass += "bg-lime-800 border-lime-950";
      grooveClass += "bg-lime-950";
      nutClassAddon = "rounded-lg border border-lime-950 ";
      break;
    case 'stone':
      activeGradient = "from-[#1c1e20] via-[#141517] to-[#0b0c0d]";
      pegClass += "bg-stone-700 border-stone-850";
      grooveClass += "bg-stone-900";
      nutClassAddon = "rounded-sm border border-stone-800 ";
      break;
    case 'frost':
      activeGradient = "from-[#0b1724] via-[#050b12] to-black";
      pegClass += "bg-sky-700 border-sky-950";
      grooveClass += "bg-sky-950";
      nutClassAddon = "rounded-md border border-sky-850 ";
      break;
    case 'ocean':
      activeGradient = "from-[#02131a] via-[#01090d] to-black";
      pegClass += "bg-cyan-800 border-cyan-950";
      grooveClass += "bg-cyan-950";
      nutClassAddon = "rounded-md border border-cyan-950 ";
      break;
    case 'solar':
      activeGradient = "from-[#080d1a] via-[#040710] to-[#010204]";
      pegClass += "bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 border-amber-400/40";
      grooveClass += "bg-[#02050b]";
      nutClassAddon = "rounded-md border border-amber-400/40 ring-1 ring-amber-400/10 ";
      break;
    case 'classic':
    default:
      activeGradient = "from-zinc-950 via-zinc-900 to-zinc-950";
      pegClass += "bg-zinc-800 border-zinc-700";
      grooveClass += "bg-zinc-900";
      nutClassAddon = "rounded border border-zinc-800 ";
      break;
  }

  const userCompletedPegs = bolts.filter((boltColors, idx) => isBoltComplete(boltColors, level?.capacity || 4) && boltColors.length > 0).length;

  return (
    <div className="flex min-h-full flex-col justify-between p-5 relative overflow-x-hidden text-white">
      {/* Dynamic Themed Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${activeGradient} transition-all duration-1000 z-0`} />
      <ThemeParticles theme={selectedTheme as any} />

      {/* High-Performance Confetti Canvas */}
      <Confetti active={isWon} burstTrigger={particleBurst} />

      {/* HEADER BAR (PRO COMPRESSED HUD or MULTIPLAYER) */}
      {multiplayerMode ? (
        <div className="flex flex-col bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 p-3 rounded-2xl shadow-xl z-10 space-y-2 relative">
          {/* Main info row */}
          <div className="flex items-center justify-between">
            {/* Player Side */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 font-mono">
                VS
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-black uppercase text-indigo-300 truncate max-w-[80px]">
                  {profile.name || (isPt ? 'Você' : 'You')}
                </h4>
                <p className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                  {isPt ? 'Porcas' : 'Bolts'}: {userCompletedPegs}/{totalTargetPegs}
                </p>
              </div>
            </div>

            {/* Middle Stats */}
            <div className="text-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 block leading-none">
                {isPt ? 'Tempo' : 'Time'}
              </span>
              <span className="text-xs font-mono font-black text-white">{formatTime(seconds)}</span>
            </div>

            {/* Opponent Side */}
            <div className="flex items-center gap-2 text-right">
              <div className="text-right">
                <h4 className="text-[10px] font-black uppercase text-rose-300 truncate max-w-[80px]">
                  {multiplayerMode.opponentName}
                </h4>
                <p className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                  {isPt ? 'Porcas' : 'Bolts'}: {opponentCompletedPegs}/{totalTargetPegs}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-400">
                {opponentStatus === 'thinking' ? '🧠' : opponentStatus === 'idle' ? '💤' : '⚙️'}
              </div>
            </div>
          </div>

          {/* Progress bar comparisons */}
          <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-800">
            {/* Player Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono font-bold text-indigo-400 leading-none">
                <span>{isPt ? 'VOCÊ' : 'YOU'}</span>
                <span>{Math.round((userCompletedPegs / totalTargetPegs) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
                  style={{ width: `${(userCompletedPegs / totalTargetPegs) * 100}%` }}
                />
              </div>
            </div>

            {/* Opponent Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono font-bold text-rose-400 leading-none">
                <span>{multiplayerMode.opponentName.toUpperCase()}</span>
                <span>{Math.round((opponentCompletedPegs / totalTargetPegs) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
                  style={{ width: `${(opponentCompletedPegs / totalTargetPegs) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-2xl shadow-xl shadow-indigo-950/20 z-10 relative">
          <button
            onClick={() => { audio.playClick(); setIsPaused(true); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-100 transition-all active:scale-[0.98]"
          >
            <Pause size={18} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-display">
              {isPt ? 'Nível' : 'Level'} {levelId}
            </span>
            <div className="mt-0.5">{renderHeaderStars()}</div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-300">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-slate-500 font-bold leading-none tracking-widest mb-0.5">
                {isPt ? 'Tempo' : 'Time'}
              </span>
              <span className="text-white">{formatTime(seconds)}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-700/50" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-slate-500 font-bold leading-none tracking-widest mb-0.5">
                {isPt ? 'Movimentos' : 'Moves'}
              </span>
              <span className="text-white">{movesCount} <span className="text-slate-500 font-normal">/ {optimalMoves}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* GAME BOARD CANVAS STAGE (PSEUDO-3D PEGS & HEXAGON NUTS) */}
      <div className="my-8 flex-1 flex items-center justify-center z-10 relative">
        {level && (
          <div className="grid grid-cols-3 gap-x-6 gap-y-12 sm:grid-cols-4 max-w-md w-full px-2 justify-items-center">
            {bolts.map((boltColors, idx) => {
              const isSelected = selectedPeg === idx;
              const isShaking = shakingPeg === idx;
              const isHintFrom = hintMove?.from === idx;
              const isHintTo = hintMove?.to === idx;
              const isComplete = isBoltComplete(boltColors, level.capacity) && boltColors.length > 0;

              // Generate peg shake animation classes
              const shakeClass = isShaking ? 'animate-[shake_0.4s_ease-in-out]' : '';
              
              // Select indicator or optimal move indicator
              let borderGlow = "border-transparent";
              if (isSelected) {
                borderGlow = "shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500 bg-indigo-500/5";
              } else if (isHintFrom) {
                borderGlow = "shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-500 animate-pulse";
              } else if (isHintTo) {
                borderGlow = "shadow-lg shadow-amber-500/50 ring-2 ring-amber-500 animate-pulse";
              }

              return (
                <div
                  key={idx}
                  onClick={(e) => handlePegClick(idx, e)}
                  className={`relative flex flex-col items-center p-2 rounded-2xl border transition-all duration-300 select-none cursor-pointer ${borderGlow} ${shakeClass}`}
                  style={{ width: '85px', height: '175px' }}
                >
                  {/* Visual completed icon above peg */}
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1.1, rotate: 0 }}
                      className="absolute -top-6 text-yellow-500 filter drop-shadow z-20"
                    >
                      <Star size={18} className="fill-amber-400 stroke-amber-700 stroke-[1.5]" />
                    </motion.div>
                  )}

                  {/* Hint indicator arrows */}
                  {isHintFrom && (
                    <div className="absolute -top-7 text-emerald-500 font-extrabold text-xs tracking-wider uppercase animate-bounce bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 z-10">
                      {isPt ? 'Mover' : 'Move'}
                    </div>
                  )}
                  {isHintTo && (
                    <div className="absolute -top-7 text-amber-500 font-extrabold text-xs tracking-wider uppercase animate-bounce bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 z-10">
                      {isPt ? 'Soltar' : 'Drop'}
                    </div>
                  )}

                  {/* 1. THREADED ROD/peg extending down */}
                  <div className={pegClass}>
                    {/* Metal threads grooves */}
                    <div className="w-full h-full opacity-20 flex flex-col justify-around">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={grooveClass} />
                      ))}
                    </div>
                  </div>

                  {/* 2. STACKED HEXAGON NUTS */}
                  <div className="absolute bottom-5 flex flex-col-reverse items-center justify-end w-full h-28 z-10">
                    {boltColors.map((color, nutIdx) => {
                      const isTopNut = nutIdx === boltColors.length - 1;
                      const doLift = isSelected && isTopNut;
                      const map = COLOR_MAP[color] || COLOR_MAP.RED;

                      return (
                        <motion.div
                          key={nutIdx}
                          layoutId={isSelected && isTopNut ? `nut-lifted-${idx}` : undefined}
                          animate={doLift ? { y: -45, scale: 1.05 } : { y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                          className={`relative w-14 h-[24px] border flex items-center justify-center filter drop-shadow-md bg-gradient-to-br ${nutClassAddon} ${map.bg} ${map.border} ${map.glow} hover:brightness-105 active:brightness-95 select-none`}
                        >
                          {/* Left-right volumetric ridges to look hexagonal/3D */}
                          <div className="absolute left-1 w-[4px] h-4/5 rounded bg-white/20 z-10" />
                          <div className="absolute right-1 w-[4px] h-4/5 rounded bg-black/20 z-10" />

                          {/* Center Hole revealing the metal peg */}
                          <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-950 flex items-center justify-center z-20">
                            {/* Inner peg visible */}
                            <div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-700" />
                          </div>

                          {/* Top shining bevel highlight */}
                          <div className="absolute top-[1.5px] inset-x-2 h-[2px] bg-white/35 rounded-full z-0" />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 3. SOLID HEX/PEGBOARD NUT CAP AT BOTTOM */}
                  <div className="absolute bottom-1 w-16 h-[15px] bg-gradient-to-r from-slate-600 via-slate-400 to-slate-800 rounded-b-md rounded-t-sm z-0 border-b border-slate-700 shadow-md flex items-center justify-center">
                    <div className="w-8 h-[2px] bg-white/10" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM UTILITY PANELS (Desfazer, Refazer, Dica, Reiniciar) */}
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto w-full p-2 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl shadow-indigo-950/20 z-10">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
            history.length > 0
              ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-100 active:scale-95'
              : 'text-slate-600 border border-transparent cursor-not-allowed opacity-40'
          }`}
          title={isPt ? 'Desfazer Movimento' : 'Undo Move'}
        >
          <Undo2 size={18} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{isPt ? 'Voltar' : 'Undo'}</span>
        </button>

        {/* Redo */}
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
            redoStack.length > 0
              ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-100 active:scale-95'
              : 'text-slate-600 border border-transparent cursor-not-allowed opacity-40'
          }`}
          title={isPt ? 'Refazer Movimento' : 'Redo Move'}
        >
          <Redo2 size={18} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{isPt ? 'Refazer' : 'Redo'}</span>
        </button>

        {/* Smart Hint Button */}
        <button
          onClick={handleShowHint}
          className="flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 transition-all active:scale-95 shadow-md shadow-indigo-500/10"
          title={isPt ? 'Pedir Dica' : 'Get Hint'}
        >
          <HelpCircle size={18} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{isPt ? 'Dica' : 'Hint'}</span>
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 transition-all active:scale-95 shadow-md shadow-rose-500/5"
          title={isPt ? 'Reiniciar Nível' : 'Restart Level'}
        >
          <RotateCcw size={18} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">{isPt ? 'Reset' : 'Reset'}</span>
        </button>
      </div>

      {/* OVERLAY: PAUSE SCREEN */}
      <AnimatePresence>
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-5">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs pro-card p-6 text-center space-y-4"
            >
              <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-tight">
                {isPt ? 'Jogo Pausado' : 'Game Paused'}
              </h3>
              
              <button
                onClick={() => { audio.playClick(); setIsPaused(false); }}
                className="w-full py-3.5 pro-button-primary text-xs flex items-center justify-center gap-2"
              >
                <Play size={15} fill="currentColor" />
                {isPt ? 'Continuar' : 'Resume'}
              </button>

              <button
                onClick={() => { handleRestart(); setIsPaused(false); }}
                className="w-full py-3.5 pro-button-secondary text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                {isPt ? 'Reiniciar Nível' : 'Restart Level'}
              </button>

              <button
                onClick={() => { audio.playClick(); onNavigateLevels(); }}
                className="w-full py-3.5 pro-button-secondary text-xs flex items-center justify-center gap-2"
              >
                <List size={15} />
                {isPt ? 'Selecionar Fase' : 'Level Selection'}
              </button>

              <button
                onClick={() => { audio.playClick(); onNavigateHome(); }}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest pt-1 transition-colors"
              >
                {isPt ? 'Voltar para o Menu' : 'Quit to Menu'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY: VICTORY POPUP */}
      <AnimatePresence>
        {isWon && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm pro-card p-8 text-center relative"
            >
              {/* Confetti / Star Sparkles explosion in modal background */}
              <div className="absolute -top-12 inset-x-0 flex justify-center z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
                  className="h-20 w-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-700/50"
                >
                  <Trophy size={36} className="text-white animate-bounce" />
                </motion.div>
              </div>

              <div className="pt-10 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">
                  {isPt ? 'Excelente Trabalho!' : 'Excellent Work!'}
                </span>
                
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                  {isPt ? 'Nível Concluído!' : 'Level Completed!'}
                </h3>

                {/* Stars Sequential POP Animation */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const active = i < starsAwarded;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={active ? { scale: 1.15, rotate: 0 } : { scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.5 + i * 0.2 }}
                        onAnimationComplete={() => {
                          if (active) {
                            audio.playStar(i);
                          }
                        }}
                        className={`h-12 w-12 rounded-xl border flex items-center justify-center ${
                          active 
                            ? 'bg-amber-400/10 border-amber-400 text-amber-400 shadow-lg shadow-amber-400/10' 
                            : 'bg-slate-900 border-slate-800 text-slate-700'
                        }`}
                      >
                        <Star size={24} className={active ? 'fill-amber-400 stroke-amber-600 stroke-[1.5]' : ''} />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Game stats display */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-xs font-mono font-bold text-slate-400">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider font-semibold mb-0.5">
                      {isPt ? 'Tempo' : 'Time'}
                    </span>
                    <span className="text-sm font-black text-white">
                      {formatTime(seconds)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider font-semibold mb-0.5">
                      {isPt ? 'Movimentos' : 'Moves'}
                    </span>
                    <span className="text-sm font-black text-white">
                      {movesCount}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase text-slate-500 tracking-wider font-semibold mb-0.5">
                      {isPt ? 'Moedas' : 'Coins'}
                    </span>
                    <span className="text-sm font-black text-amber-400 flex items-center gap-0.5">
                      +{50 + starsAwarded * 20} 🪙
                    </span>
                  </div>
                </div>

                {/* XP Progression Bar with Level Up effects */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400 flex items-center gap-1 uppercase font-mono">
                      {isPt ? 'Nível' : 'Level'} {xpProgress.previousLevel}
                    </span>
                    <span className="text-indigo-400 font-mono">
                      +{starsAwarded === 3 ? '500' : starsAwarded === 2 ? '250' : '100'} XP
                    </span>
                    <span className="text-slate-400 uppercase font-mono">
                      {isPt ? 'Nível' : 'Level'} {xpProgress.currentLevel}
                    </span>
                  </div>
                  
                  {/* Outer XP Bar */}
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    {/* Animated inner XP progress */}
                    <motion.div
                      initial={{ width: `${(xpProgress.initial / xpProgress.nextLevelXp) * 100}%` }}
                      animate={{ width: `${(xpProgress.current / xpProgress.nextLevelXp) * 100}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 1.2 }}
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    />
                  </div>

                  {/* Level Up Flash Message */}
                  {xpProgress.currentLevel > xpProgress.previousLevel && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 2.2 }}
                      className="text-center py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase rounded-lg tracking-wider shadow animate-pulse mt-2"
                    >
                      🎉 {isPt ? 'Subiu de Nível!' : 'Level Up!'} 🎉
                    </motion.div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      audio.playClick();
                      onSelectLevel(levelId + 1);
                    }}
                    className="w-full py-3.5 pro-button-primary text-xs flex items-center justify-center gap-1.5"
                  >
                    {isPt ? 'Próximo Nível' : 'Next Level'}
                    <ArrowRight size={15} />
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        audio.playClick();
                        onSelectLevel(levelId);
                      }}
                      className="py-2.5 pro-button-secondary text-xs"
                    >
                      {isPt ? 'Rejogar' : 'Replay'}
                    </button>

                    <button
                      onClick={() => {
                        audio.playClick();
                        onNavigateLevels();
                      }}
                      className="py-2.5 pro-button-secondary text-xs"
                    >
                      {isPt ? 'Níveis' : 'Levels'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      audio.playClick();
                      onNavigateHome();
                    }}
                    className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest pt-2 transition-colors"
                  >
                    {isPt ? 'Voltar para o Menu' : 'Back to Home'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
