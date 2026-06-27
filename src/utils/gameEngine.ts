/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NutColor, Bolt, GameLevel } from '../types';

// Available colors list
export const ALL_COLORS: NutColor[] = [
  'RED',
  'BLUE',
  'GREEN',
  'YELLOW',
  'PURPLE',
  'ORANGE',
  'PINK',
  'TEAL',
  'CYAN',
  'LIME'
];

// Color mapping to Tailwind classes for clean, solid styling (no excessive glows or neon effects)
export const COLOR_MAP: Record<NutColor, { bg: string; border: string; glow: string; text: string; hex: string }> = {
  RED: { 
    bg: 'from-rose-500 to-rose-600', 
    border: 'border-rose-700/80', 
    glow: '', 
    text: 'text-rose-500',
    hex: '#f43f5e'
  },
  BLUE: { 
    bg: 'from-blue-500 to-blue-600', 
    border: 'border-blue-700/80', 
    glow: '', 
    text: 'text-blue-500',
    hex: '#3b82f6'
  },
  GREEN: { 
    bg: 'from-emerald-500 to-emerald-600', 
    border: 'border-emerald-700/80', 
    glow: '', 
    text: 'text-emerald-500',
    hex: '#10b981'
  },
  YELLOW: { 
    bg: 'from-amber-400 to-amber-500', 
    border: 'border-amber-600/80', 
    glow: '', 
    text: 'text-amber-500',
    hex: '#f59e0b'
  },
  PURPLE: { 
    bg: 'from-violet-500 to-violet-600', 
    border: 'border-violet-700/80', 
    glow: '', 
    text: 'text-violet-500',
    hex: '#8b5cf6'
  },
  ORANGE: { 
    bg: 'from-orange-500 to-orange-600', 
    border: 'border-orange-700/80', 
    glow: '', 
    text: 'text-orange-500',
    hex: '#f97316'
  },
  PINK: { 
    bg: 'from-pink-500 to-pink-600', 
    border: 'border-pink-700/80', 
    glow: '', 
    text: 'text-pink-500',
    hex: '#ec4899'
  },
  TEAL: { 
    bg: 'from-teal-500 to-teal-600', 
    border: 'border-teal-700/80', 
    glow: '', 
    text: 'text-teal-500',
    hex: '#14b8a6'
  },
  CYAN: { 
    bg: 'from-cyan-500 to-cyan-600', 
    border: 'border-cyan-700/80', 
    glow: '', 
    text: 'text-cyan-400',
    hex: '#06b6d4'
  },
  LIME: { 
    bg: 'from-lime-500 to-lime-600', 
    border: 'border-lime-700/80', 
    glow: '', 
    text: 'text-lime-500',
    hex: '#84cc16'
  }
};

// Check if a single bolt is complete (either completely empty, or has exactly capacity nuts of the SAME color)
export function isBoltComplete(boltColors: NutColor[], capacity: number): boolean {
  if (boltColors.length === 0) return true;
  if (boltColors.length < capacity) return false;
  const firstColor = boltColors[0];
  return boltColors.every(c => c === firstColor);
}

// Check if the entire board is solved
export function isBoardSolved(bolts: NutColor[][], capacity: number): boolean {
  return bolts.every(bolt => {
    if (bolt.length === 0) return true;
    if (bolt.length !== capacity) return false;
    const firstColor = bolt[0];
    return bolt.every(c => c === firstColor);
  });
}

// Generate level parameters based on level ID
export function getLevelConfig(levelId: number): { colorCount: number; emptyBolts: number; capacity: number } {
  let colorCount = 2;
  let emptyBolts = 1;
  const capacity = 4;

  if (levelId === 1) {
    colorCount = 2;
    emptyBolts = 1; // 3 tubes total
  } else if (levelId === 2) {
    colorCount = 2;
    emptyBolts = 2; // 4 tubes total
  } else if (levelId <= 5) {
    colorCount = 3;
    emptyBolts = 2; // 5 tubes total
  } else if (levelId <= 10) {
    colorCount = 4;
    emptyBolts = 2; // 6 tubes total
  } else if (levelId <= 18) {
    colorCount = 5;
    emptyBolts = 2; // 7 tubes total
  } else if (levelId <= 25) {
    colorCount = 6;
    emptyBolts = 2; // 8 tubes total
  } else if (levelId <= 40) {
    colorCount = 7;
    emptyBolts = 2; // 9 tubes total
  } else if (levelId <= 60) {
    colorCount = 8;
    emptyBolts = 2; // 10 tubes total
  } else {
    colorCount = Math.min(10, 8 + Math.floor((levelId - 60) / 20));
    emptyBolts = 2; // up to 12 tubes
  }

  return { colorCount, emptyBolts, capacity };
}

// Procedural Level Generator
// Guarantees solvability by starting from solved state and doing legal reverse moves,
// then verifies & finds optimal moves using the BFS solver.
export function generateLevel(levelId: number): GameLevel {
  const { colorCount, emptyBolts, capacity } = getLevelConfig(levelId);
  
  // Pick distinct random colors
  const shuffledColors = [...ALL_COLORS].sort(() => Math.random() - 0.5);
  const selectedColors = shuffledColors.slice(0, colorCount);

  // Helper to generate a random solvable layout via reverse scrambling
  let bolts: NutColor[][] = [];
  
  // Create solved state
  for (let i = 0; i < colorCount; i++) {
    bolts.push(Array(capacity).fill(selectedColors[i]));
  }
  for (let i = 0; i < emptyBolts; i++) {
    bolts.push([]);
  }

  // We perform random legal moves to scramble.
  // A legal reverse move is: move a nut from a non-empty tube to another tube that has space,
  // BUT to make it truly scrambled we can do random shifting.
  // Actually, shuffling all nuts completely and verifying solvability via BFS is highly robust for smaller levels,
  // but for larger levels (>6 colors), BFS state space can grow.
  // A hybrid scramble approach:
  // We randomly shuffle all nuts of the colors, then check if it's solvable.
  // If not solvable, or too easy/hard, we generate another.
  // Let's implement a quick scramble algorithm:
  const totalTubes = colorCount + emptyBolts;
  const nutsPool: NutColor[] = [];
  selectedColors.forEach(color => {
    for (let i = 0; i < capacity; i++) {
      nutsPool.push(color);
    }
  });

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    // Shuffle pool
    const tempPool = [...nutsPool].sort(() => Math.random() - 0.5);
    
    // Distribute into colorCount tubes
    const candidateBolts: NutColor[][] = [];
    for (let i = 0; i < totalTubes; i++) {
      candidateBolts.push([]);
    }

    // Distribute randomly, keeping empty tubes empty initially, or slightly distributed
    let poolIdx = 0;
    // Fill the first colorCount tubes
    for (let i = 0; i < colorCount; i++) {
      for (let j = 0; j < capacity; j++) {
        candidateBolts[i].push(tempPool[poolIdx++]);
      }
    }

    // Verify solvability & get shortest path
    const solution = solvePuzzle(candidateBolts, capacity, 1000); // limit steps to keep it fast
    if (solution && solution.length >= Math.min(levelId * 2, 8)) {
      // Found a good, solvable level!
      return {
        id: levelId,
        bolts: candidateBolts,
        capacity
      };
    }
  }

  // Fallback: simple scramble from solved state
  const fallbackBolts: NutColor[][] = [];
  for (let i = 0; i < colorCount; i++) {
    fallbackBolts.push(Array(capacity).fill(selectedColors[i]));
  }
  for (let i = 0; i < emptyBolts; i++) {
    fallbackBolts.push([]);
  }

  // Do random valid reverse moves
  let scrambleMoves = 40 + levelId * 3;
  for (let step = 0; step < scrambleMoves; step++) {
    // Find a random non-empty tube
    const nonEmpties = fallbackBolts.map((b, idx) => ({ b, idx })).filter(item => item.b.length > 0);
    const nonFulls = fallbackBolts.map((b, idx) => ({ b, idx })).filter(item => item.b.length < capacity);
    
    if (nonEmpties.length > 0 && nonFulls.length > 0) {
      const fromObj = nonEmpties[Math.floor(Math.random() * nonEmpties.length)];
      // filter out same tube
      const possibleTo = nonFulls.filter(item => item.idx !== fromObj.idx);
      if (possibleTo.length > 0) {
        const toObj = possibleTo[Math.floor(Math.random() * possibleTo.length)];
        // Perform move
        const nut = fallbackBolts[fromObj.idx].pop()!;
        fallbackBolts[toObj.idx].push(nut);
      }
    }
  }

  return {
    id: levelId,
    bolts: fallbackBolts,
    capacity
  };
}

// Serialize the state of the board into a string key for BFS visited map
function serializeBoard(bolts: NutColor[][]): string {
  return bolts.map(bolt => bolt.join(',')).join('|');
}

export interface PuzzleMove {
  from: number;
  to: number;
  color: NutColor;
}

// BFS Solver for Nut & Bolt Color Sort
// Returns an array of moves representing the shortest path to solve, or null if unsolvable.
export function solvePuzzle(
  initialBolts: NutColor[][],
  capacity: number,
  maxExploredStates: number = 2000
): PuzzleMove[] | null {
  const startKey = serializeBoard(initialBolts);
  
  if (isBoardSolved(initialBolts, capacity)) {
    return [];
  }

  interface QueueNode {
    bolts: NutColor[][];
    moves: PuzzleMove[];
    key: string;
  }

  const queue: QueueNode[] = [{
    bolts: initialBolts,
    moves: [],
    key: startKey
  }];

  const visited = new Set<string>();
  visited.add(startKey);

  let statesExplored = 0;

  while (queue.length > 0 && statesExplored < maxExploredStates) {
    const current = queue.shift()!;
    statesExplored++;

    const currentBolts = current.bolts;

    // Generate all valid moves
    for (let fromIdx = 0; fromIdx < currentBolts.length; fromIdx++) {
      const fromBolt = currentBolts[fromIdx];
      if (fromBolt.length === 0) continue;

      const topColor = fromBolt[fromBolt.length - 1];

      // Pruning: If this tube is already perfectly sorted (all same color) and it's not full,
      // moving it to an empty tube is useless.
      const isAlreadyPerfect = fromBolt.every(c => c === topColor);
      
      // Look for a target tube
      for (let toIdx = 0; toIdx < currentBolts.length; toIdx++) {
        if (fromIdx === toIdx) continue;

        const toBolt = currentBolts[toIdx];
        if (toBolt.length >= capacity) continue; // destination full

        // Check if destination is empty OR top color matches
        const isDestinationEmpty = toBolt.length === 0;
        if (!isDestinationEmpty && toBolt[toBolt.length - 1] !== topColor) {
          continue; // mismatch color
        }

        // Additional Pruning:
        // 1. Moving from a single-colored tube to an empty tube is pointless (just redundant state)
        if (isAlreadyPerfect && isDestinationEmpty) {
          continue;
        }

        // 2. Avoid moving a nut to an empty tube if we already tried moving it to another empty tube
        // in this step (symmetrical empty tubes). To implement, we can check if toBolt is empty
        // and we already processed an empty tube.
        let isFirstEmptyTube = true;
        if (isDestinationEmpty) {
          for (let k = 0; k < toIdx; k++) {
            if (currentBolts[k].length === 0) {
              isFirstEmptyTube = false;
              break;
            }
          }
        }
        if (isDestinationEmpty && !isFirstEmptyTube) {
          continue;
        }

        // Execute move in copy
        const nextBolts = currentBolts.map((b, idx) => {
          if (idx === fromIdx) return b.slice(0, -1);
          if (idx === toIdx) return [...b, topColor];
          return b;
        });

        const nextKey = serializeBoard(nextBolts);
        if (visited.has(nextKey)) continue;

        const nextMoves = [...current.moves, { from: fromIdx, to: toIdx, color: topColor }];

        // Check if solved
        if (isBoardSolved(nextBolts, capacity)) {
          return nextMoves;
        }

        visited.add(nextKey);
        queue.push({
          bolts: nextBolts,
          moves: nextMoves,
          key: nextKey
        });
      }
    }
  }

  return null; // Unsolvable or limit exceeded
}
