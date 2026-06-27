/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  fadeSpeed: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
}

interface ConfettiProps {
  active: boolean; // Continuous falling confetti
  burstTrigger?: { x: number; y: number; count: number; colors?: string[] } | null; // One-time explosion
}

const CONFETTI_COLORS = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#9b59b6', '#22d3ee', '#a3e635', '#ec4899'];

export default function Confetti({ active, burstTrigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const createParticle = (x: number, y: number, isBurst: boolean, customColors?: string[]): Particle => {
    const colors = customColors || CONFETTI_COLORS;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shapes: Particle['shape'][] = ['circle', 'square', 'triangle', 'star'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    if (isBurst) {
      // Exploding outward from a point
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 3), // slight upward bias
        size: 4 + Math.random() * 6,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1.0,
        fadeSpeed: 0.01 + Math.random() * 0.015,
        shape
      };
    } else {
      // Falling from the top
      return {
        x: Math.random() * window.innerWidth,
        y: -10 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 3.5,
        size: 5 + Math.random() * 7,
        color,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        opacity: 1.0,
        fadeSpeed: 0.002 + Math.random() * 0.003,
        shape
      };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      // Handle continuous falling confetti
      if (active && particles.length < 120 && Math.random() < 0.3) {
        particles.push(createParticle(0, 0, false));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotationSpeed;
        p.opacity -= p.fadeSpeed;

        if (p.opacity <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'triangle') {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          // Draw a simple 5-point star
          const rot = (Math.PI / 2) * 3;
          let rx = 0;
          let ry = 0;
          const step = Math.PI / 5;
          const outerRadius = p.size / 2;
          const innerRadius = p.size / 4;

          ctx.moveTo(0, -outerRadius);
          for (let k = 0; k < 5; k++) {
            rx = Math.cos(rot + k * step * 2) * outerRadius;
            ry = Math.sin(rot + k * step * 2) * outerRadius;
            ctx.lineTo(rx, ry);
            rx = Math.cos(rot + (k * step * 2 + step)) * innerRadius;
            ry = Math.sin(rot + (k * step * 2 + step)) * innerRadius;
            ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [active]);

  // Handle sudden explosion burst triggers
  useEffect(() => {
    if (burstTrigger) {
      const { x, y, count, colors } = burstTrigger;
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        newParticles.push(createParticle(x, y, true, colors));
      }
      particlesRef.current.push(...newParticles);
    }
  }, [burstTrigger]);

  return (
    <canvas
      id="particles-canvas"
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 block h-full w-full"
    />
  );
}
