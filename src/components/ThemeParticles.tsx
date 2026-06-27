/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export type VisualTheme = 'classic' | 'cyber' | 'wood' | 'stone' | 'solar' | 'lava' | 'frost' | 'toxic' | 'ocean';

interface ThemeParticlesProps {
  theme: VisualTheme;
}

interface Particle {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
  speed: number; // s
  delay: number; // s
  opacity: number;
  symbol?: string;
  glow?: boolean;
}

export function getThemeForLevel(levelId: number): VisualTheme {
  return 'classic';
}

export function getThemeDetails(theme: string, isPt: boolean) {
  switch (theme) {
    case 'cyber':
      return {
        name: isPt ? 'Sombra Cyberpunk' : 'Cyberpunk Shadow',
        desc: isPt ? 'Estilo futurista fúcsia e ciano' : 'Futuristic fuchsia and cyan style',
        gradient: 'from-[#080314] via-[#05020a] to-[#010103]',
        accentText: 'text-fuchsia-400',
        cardBg: 'bg-[#05020a]/80 border-fuchsia-950',
        badgeColor: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
      };
    case 'wood':
      return {
        name: isPt ? 'Madeira Nórdica' : 'Nordic Wood',
        desc: isPt ? 'Estilo aconchegante de cedro' : 'Cozy cedar style',
        gradient: 'from-[#231710] via-[#1a100a] to-[#0f0a06]',
        accentText: 'text-amber-500',
        cardBg: 'bg-[#1a100a]/80 border-amber-950',
        badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      };
    case 'stone':
      return {
        name: isPt ? 'Pedra Rúnica' : 'Ancient Stone',
        desc: isPt ? 'Estilo rúnico de granito escuro' : 'Runic dark granite style',
        gradient: 'from-[#1c1e20] via-[#141517] to-[#0b0c0d]',
        accentText: 'text-zinc-400',
        cardBg: 'bg-[#141517]/80 border-zinc-800',
        badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      };
    case 'solar':
      return {
        name: isPt ? 'Solar Imperial' : 'Imperial Solar',
        desc: isPt ? 'Estilo celestial com ouro imperial' : 'Celestial style with imperial gold',
        gradient: 'from-[#0b121e] via-[#070b13] to-[#020407]',
        accentText: 'text-amber-400',
        cardBg: 'bg-[#070b13]/80 border-amber-500/20',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      };
    case 'lava':
      return {
        name: isPt ? 'Lava Vulcânica' : 'Volcanic Lava',
        desc: isPt ? 'Obsidiana escura com rios de lava pulsantes e brasas' : 'Dark obsidian with pulsing lava rivers and embers',
        gradient: 'from-[#1a0604] via-[#0f0302] to-[#050100]',
        accentText: 'text-orange-500',
        cardBg: 'bg-[#0f0302]/80 border-orange-950',
        badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      };
    case 'frost':
      return {
        name: isPt ? 'Gelo Nórdico' : 'Frost Glacier',
        desc: isPt ? 'Estilo glacial prateado com cristais de neve e ventos frios' : 'Glacial silver style with snow crystals and cold winds',
        gradient: 'from-[#0b1724] via-[#060c14] to-[#020407]',
        accentText: 'text-sky-300',
        cardBg: 'bg-[#060c14]/80 border-sky-950',
        badgeColor: 'bg-sky-300/10 text-sky-300 border-sky-300/20'
      };
    case 'toxic':
      return {
        name: isPt ? 'Zona Tóxica' : 'Toxic Wasteland',
        desc: isPt ? 'Perigo radioativo verde neon, bolhas de ácido e listras' : 'Neon green radioactive hazard and acid bubbles',
        gradient: 'from-[#041208] via-[#020a04] to-[#010401]',
        accentText: 'text-lime-400',
        cardBg: 'bg-[#020a04]/80 border-lime-950',
        badgeColor: 'bg-lime-500/10 text-lime-400 border-lime-500/20'
      };
    case 'ocean':
      return {
        name: isPt ? 'Abismo Submarino' : 'Deep Ocean',
        desc: isPt ? 'Mar profundo com bolhas e luzes azul-turquesa' : 'Deep sea with bubbles and teal highlights',
        gradient: 'from-[#02131a] via-[#010a0e] to-[#000406]',
        accentText: 'text-cyan-400',
        cardBg: 'bg-[#010a0e]/80 border-cyan-950',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      };
    case 'classic':
    default:
      return {
        name: isPt ? 'Minimalista Neutro' : 'Neutral Minimalist',
        desc: isPt ? 'Visual padrão cinza e preto focado' : 'Standard gray and black focused look',
        gradient: 'from-zinc-950 via-zinc-900 to-zinc-950',
        accentText: 'text-zinc-300',
        cardBg: 'bg-zinc-900/80 border-zinc-800',
        badgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20'
      };
  }
}

export default function ThemeParticles({ theme }: ThemeParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const count = theme === 'classic' ? 12 : 25;
    const items: Particle[] = [];
    const symbols: Record<string, string[]> = {
      classic: ['•'],
      cyber: ['0', '1', '■', '▫'],
      wood: ['🍃', '🍂'],
      stone: ['🔸', '▫', '•'],
      solar: ['✦', '★', '✧', '•'],
      lava: ['•', '🔸', '▲'],
      frost: ['❄', '✧', '•'],
      toxic: ['⚠', '▫', '☣'],
      ocean: ['•', '✧', '◦']
    };

    const currentSymbols = symbols[theme] || ['•'];

    for (let i = 0; i < count; i++) {
      const size = theme === 'solar' || theme === 'frost' ? Math.random() * 10 + 6 : Math.random() * 8 + 4;
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        speed: Math.random() * 15 + 10, // 10s to 25s
        delay: Math.random() * -20,
        opacity: theme === 'classic' ? Math.random() * 0.1 + 0.05 : Math.random() * 0.35 + 0.1,
        symbol: currentSymbols[Math.floor(Math.random() * currentSymbols.length)],
        glow: Math.random() > 0.5
      });
    }
    setParticles(items);
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Subtle lines for Cyber */}
      {theme === 'cyber' && (
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,150,250,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,150,250,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      )}

      {/* Render Particles */}
      {particles.map((p) => {
        let animationClass = 'animate-space-twinkle';
        let style: React.CSSProperties = {
          left: `${p.x}%`,
          top: `${p.y}%`,
          fontSize: `${p.size}px`,
          opacity: p.opacity,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.speed}s`,
        };

        if (theme === 'cyber') {
          animationClass = 'animate-cyber-stream';
          style.top = '-20px';
          style.color = p.glow ? '#f43f5e' : '#06b6d4';
          style.fontFamily = 'monospace';
          style.fontWeight = 'bold';
        } else if (theme === 'wood') {
          animationClass = 'animate-leaf-fall';
          style.top = '-20px';
          style.color = '#15803d'; // Forest green
        } else if (theme === 'solar') {
          style.color = p.glow ? '#f59e0b' : '#38bdf8'; // Gold and sky blue
        } else if (theme === 'stone') {
          style.color = '#71717a';
        } else if (theme === 'lava') {
          animationClass = 'animate-ember-rise';
          style.top = '100%';
          style.color = p.glow ? '#ef4444' : '#f97316'; // Red and orange embers
        } else if (theme === 'frost') {
          animationClass = 'animate-leaf-fall'; // Fall from top
          style.top = '-20px';
          style.color = p.glow ? '#e2e8f0' : '#bae6fd'; // Light gray and light blue
        } else if (theme === 'toxic') {
          animationClass = 'animate-bubble-rise';
          style.top = '100%';
          style.color = '#84cc16'; // Lime green
        } else if (theme === 'ocean') {
          animationClass = 'animate-bubble-rise';
          style.top = '100%';
          style.color = '#22d3ee'; // Cyan bubble
        } else {
          // Classic
          style.color = '#3f3f46';
        }

        return (
          <div
            key={p.id}
            className={`absolute pointer-events-none transition-transform duration-1000 ${animationClass}`}
            style={style}
          >
            {p.symbol}
          </div>
        );
      })}

      <style>{`
        @keyframes leafFall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(110vh) rotate(360deg) translateX(-30px);
            opacity: 0;
          }
        }
        @keyframes spaceTwinkle {
          0%, 100% {
            transform: scale(0.9) translate(0, 0);
            opacity: 0.05;
          }
          50% {
            transform: scale(1.1) translate(3px, -3px);
            opacity: 0.4;
          }
        }
        @keyframes cyberStream {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(110vh);
            opacity: 0;
          }
        }
        @keyframes emberRise {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-110vh) rotate(180deg) translateX(15px);
            opacity: 0;
          }
        }
        @keyframes bubbleRise {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-110vh) translateX(-10px);
            opacity: 0;
          }
        }

        .animate-leaf-fall {
          animation-name: leafFall;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .animate-space-twinkle {
          animation-name: spaceTwinkle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .animate-cyber-stream {
          animation-name: cyberStream;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
        .animate-ember-rise {
          animation-name: emberRise;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .animate-bubble-rise {
          animation-name: bubbleRise;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
}
