import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Trophy, CheckCircle2, PartyPopper, X } from 'lucide-react';
import { cn } from '../utils/cn';

// Pre-defined vibrant celebration color palette
const VIBRANT_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#F59E0B', // Gold / Amber
  '#EC4899', // Pink
  '#EF4444', // Red
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];

// Reusable SVG Balloon Component
const Balloon = ({ color, size = 56, style, className }) => {
  return (
    <div className={cn("absolute pointer-events-none select-none", className)} style={style}>
      <svg
        width={size}
        height={size * 1.35}
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-md"
      >
        <defs>
          <radialGradient id={`balloon-grad-${color.replace('#', '')}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="25%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
        </defs>
        {/* Balloon Body */}
        <path
          d="M30 4 C14 4 2 18 2 34 C2 48 16 62 28 66 L27 69 L33 69 L32 66 C44 62 58 48 58 34 C58 18 46 4 30 4 Z"
          fill={`url(#balloon-grad-${color.replace('#', '')})`}
        />
        {/* Balloon knot */}
        <polygon points="26,69 34,69 32,72 28,72" fill={color} />
        {/* Balloon String */}
        <path
          d="M30 72 Q24 77 34 82 Q24 87 32 94"
          stroke="#94A3B8"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// Reusable SVG Party Popper Icon with Burst particles
const PartyPopperBurst = ({ side = 'left' }) => {
  const isLeft = side === 'left';
  return (
    <div
      className={cn(
        "absolute bottom-6 sm:bottom-12 pointer-events-none select-none z-20 flex flex-col items-center",
        isLeft ? "left-4 sm:left-12 origin-bottom-left" : "right-4 sm:right-12 origin-bottom-right"
      )}
    >
      <div
        className={cn(
          "relative transition-transform",
          isLeft ? "rotate-[32deg] animate-popper-bounce-left" : "-rotate-[32deg] animate-popper-bounce-right"
        )}
      >
        {/* Popper Cone */}
        <svg width="68" height="68" viewBox="0 0 64 64" fill="none" className="filter drop-shadow-lg">
          {/* Confetti Cone Body */}
          <path
            d="M8 56 L38 20 C42 24 48 30 52 34 L16 64 Z"
            fill="url(#popper-stripes)"
          />
          <path
            d="M8 56 L16 64 L10 64 Z"
            fill="#D97706"
          />
          {/* Rim of Cone */}
          <ellipse
            cx="45"
            cy="27"
            rx="12"
            ry="7"
            transform="rotate(-45 45 27)"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="popper-stripes" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="25%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bursting Streamers & Stars from nozzle */}
        <div className="absolute -top-10 -left-6 w-32 h-32 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-popper-blast">
            <line x1="45" y1="55" x2="20" y2="20" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="55" x2="85" y2="25" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
            <circle cx="28" cy="22" r="3" fill="#8B5CF6" />
            <circle cx="75" cy="20" r="3.5" fill="#10B981" />
            <polygon points="50,15 52,21 58,21 53,25 55,31 50,27 45,31 47,25 42,21 48,21" fill="#F59E0B" />
            <polygon points="78,38 79,42 83,42 80,45 81,49 78,46 75,49 76,45 73,42 77,42" fill="#EC4899" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Reusable SVG Streamer Ribbon
const Streamer = ({ color, style, className }) => {
  return (
    <div className={cn("absolute pointer-events-none select-none", className)} style={style}>
      <svg width="24" height="120" viewBox="0 0 24 120" fill="none" className="filter drop-shadow-xs">
        <path
          d="M12 0 C18 15 6 30 14 45 C22 60 8 75 16 90 C24 105 10 115 12 120"
          stroke={color}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 2"
        />
      </svg>
    </div>
  );
};

const TaskCelebration = ({
  isOpen = false,
  isFirstTask = false,
  onClose,
  duration = 4600 // 4.6 seconds auto-fadeout
}) => {
  const [isExiting, setIsExiting] = useState(false);

  // Generate randomized confetti elements once on mount
  const confettiCount = isFirstTask ? 55 : 30;
  const confettiList = useMemo(() => {
    return Array.from({ length: confettiCount }).map((_, i) => {
      const color = VIBRANT_COLORS[i % VIBRANT_COLORS.length];
      const left = Math.random() * 96 + 2; // 2% to 98%
      const delay = Math.random() * 1.5; // 0 to 1.5s
      const animDuration = 2.4 + Math.random() * 2.2; // 2.4 to 4.6s
      const size = 6 + Math.random() * 8; // 6px to 14px
      const isCircle = i % 3 === 0;
      const isSquiggle = i % 5 === 0;
      const isStar = i % 7 === 0;
      const drift = (Math.random() - 0.5) * 160; // -80px to +80px

      return {
        id: i,
        color,
        left: `${left}%`,
        delay: `${delay}s`,
        animDuration: `${animDuration}s`,
        size,
        isCircle,
        isSquiggle,
        isStar,
        drift: `${drift}px`
      };
    });
  }, [confettiCount]);

  // Balloons for first-task celebration
  const balloonList = useMemo(() => {
    if (!isFirstTask) return [];
    return [
      { id: 1, color: '#8B5CF6', size: 68, left: '8%', delay: '0.1s', speed: '4.2s', sway: '18px' },
      { id: 2, color: '#EC4899', size: 58, left: '22%', delay: '0.4s', speed: '4.8s', sway: '-24px' },
      { id: 3, color: '#3B82F6', size: 64, left: '34%', delay: '0.2s', speed: '4.4s', sway: '20px' },
      { id: 4, color: '#F59E0B', size: 72, left: '62%', delay: '0.3s', speed: '4.6s', sway: '-22px' },
      { id: 5, color: '#10B981', size: 60, left: '76%', delay: '0.15s', speed: '4.3s', sway: '26px' },
      { id: 6, color: '#EF4444', size: 66, left: '88%', delay: '0.5s', speed: '5.0s', sway: '-18px' },
    ];
  }, [isFirstTask]);

  // Streamers for extra festive depth
  const streamerList = useMemo(() => {
    if (!isFirstTask) return [];
    return [
      { id: 1, color: '#F59E0B', left: '14%', delay: '0.2s', speed: '3.8s' },
      { id: 2, color: '#8B5CF6', left: '28%', delay: '0.6s', speed: '4.2s' },
      { id: 3, color: '#EC4899', left: '72%', delay: '0.3s', speed: '4.0s' },
      { id: 4, color: '#06B6D4', left: '84%', delay: '0.5s', speed: '3.6s' }
    ];
  }, [isFirstTask]);

  // Handle lifecycle and auto-dismiss
  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      return;
    }

    // Start graceful fade out
    const fadeTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(duration - 600, 2000));

    // Complete cleanup and trigger onClose
    const closeTimer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4 overflow-hidden select-none transition-opacity duration-500",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Dynamic Scoped Keyframe Styles */}
      <style>{`
        @keyframes balloonFloat {
          0% {
            transform: translateY(110vh) scale(0.85);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-20vh) scale(1.05);
            opacity: 0;
          }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-30px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
            opacity: 1;
          }
          75% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(105vh) translateX(var(--drift, 40px)) rotateX(720deg) rotateY(360deg) rotateZ(540deg);
            opacity: 0;
          }
        }

        @keyframes ribbonSway {
          0% {
            transform: translateY(-120px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(35deg);
            opacity: 0;
          }
        }

        @keyframes popperBounceLeft {
          0%, 100% { transform: rotate(32deg) translateY(0); }
          50% { transform: rotate(36deg) translateY(-8px); }
        }

        @keyframes popperBounceRight {
          0%, 100% { transform: rotate(-32deg) translateY(0); }
          50% { transform: rotate(-36deg) translateY(-8px); }
        }

        @keyframes popperBlast {
          0% { transform: scale(0.6) rotate(0deg); opacity: 0; }
          30% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          70% { transform: scale(1) rotate(-5deg); opacity: 0.8; }
          100% { transform: scale(1.1) rotate(5deg); opacity: 0; }
        }

        @keyframes celebrationCardPop {
          0% {
            transform: scale(0.8) translateY(24px);
            opacity: 0;
          }
          60% {
            transform: scale(1.03) translateY(-4px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .animate-balloon-float {
          animation: balloonFloat var(--speed, 4.5s) ease-in-out infinite;
        }

        .animate-confetti-fall {
          animation: confettiFall var(--speed, 3.5s) linear forwards;
        }

        .animate-ribbon-sway {
          animation: ribbonSway var(--speed, 4s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .animate-popper-bounce-left {
          animation: popperBounceLeft 1.4s ease-in-out infinite;
        }

        .animate-popper-bounce-right {
          animation: popperBounceRight 1.4s ease-in-out infinite;
        }

        .animate-popper-blast {
          animation: popperBlast 2s ease-out infinite;
        }

        .animate-celebration-card {
          animation: celebrationCardPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-balloon-float,
          .animate-confetti-fall,
          .animate-ribbon-sway,
          .animate-popper-bounce-left,
          .animate-popper-bounce-right,
          .animate-popper-blast,
          .animate-celebration-card {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. PARTY POPPERS (Left and Right corners) */}
      <PartyPopperBurst side="left" />
      <PartyPopperBurst side="right" />

      {/* 2. BALLOONS (Animated Floating Upward with Subtle Sway) */}
      {balloonList.map((b) => (
        <Balloon
          key={b.id}
          color={b.color}
          size={b.size}
          className="animate-balloon-float"
          style={{
            left: b.left,
            '--speed': b.speed,
            animationDelay: b.delay
          }}
        />
      ))}

      {/* 3. STREAMERS & RIBBONS */}
      {streamerList.map((s) => (
        <Streamer
          key={s.id}
          color={s.color}
          className="animate-ribbon-sway"
          style={{
            left: s.left,
            '--speed': s.speed,
            animationDelay: s.delay
          }}
        />
      ))}

      {/* 4. CONFETTI SHOWER */}
      {confettiList.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 animate-confetti-fall pointer-events-none"
          style={{
            left: c.left,
            '--speed': c.animDuration,
            '--drift': c.drift,
            animationDelay: c.delay
          }}
        >
          {c.isStar ? (
            <svg width={c.size * 1.3} height={c.size * 1.3} viewBox="0 0 24 24" fill={c.color}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          ) : c.isCircle ? (
            <div
              className="rounded-full shadow-2xs"
              style={{
                width: `${c.size}px`,
                height: `${c.size}px`,
                backgroundColor: c.color
              }}
            />
          ) : c.isSquiggle ? (
            <div
              className="rounded-xs shadow-2xs transform rotate-45"
              style={{
                width: `${c.size * 1.4}px`,
                height: `${c.size * 0.55}px`,
                backgroundColor: c.color
              }}
            />
          ) : (
            <div
              className="rounded-[1.5px] shadow-2xs"
              style={{
                width: `${c.size * 1.2}px`,
                height: `${c.size * 0.75}px`,
                backgroundColor: c.color
              }}
            />
          )}
        </div>
      ))}

      {/* 5. CENTER CELEBRATION CARD */}
      <div className="relative pointer-events-auto max-w-md w-full animate-celebration-card mx-auto z-30">
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_20px_60px_-15px_rgba(30,41,59,0.35),0_0_0_1px_rgba(255,255,255,0.7)] p-6 sm:p-7 text-center">
          
          {/* Subtle colorful top gradient sheen */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 via-amber-400 to-blue-500" />
          
          {/* Ambient colorful glow circles behind icon */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-gradient-to-br from-amber-200/40 via-pink-200/40 to-purple-200/40 rounded-full blur-2xl pointer-events-none" />

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors cursor-pointer"
            title="Dismiss celebration"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon with Layered Glow */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-pink-50 border border-amber-200/70 shadow-sm flex items-center justify-center transform hover:scale-105 transition-transform duration-200">
              {isFirstTask ? (
                <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
              ) : (
                <PartyPopper className="w-8 h-8 text-purple-600" />
              )}
            </div>
            {/* Sparkle Badges around Icon */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Milestone / Status Badge */}
          <div className="mb-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border",
                isFirstTask
                  ? "bg-gradient-to-r from-amber-50 to-purple-50 text-purple-700 border-purple-200/80"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              )}
            >
              <Sparkles className="w-3 h-3" />
              <span>{isFirstTask ? "First Milestone Unlocked" : "Progress Recorded"}</span>
            </span>
          </div>

          {/* Celebration Message */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {isFirstTask ? (
              <span>Your First Task is Created! 🎉</span>
            ) : (
              <span>Task Added Successfully! 🎊</span>
            )}
          </h2>

          <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
            {isFirstTask ? (
              "Great start! Every achievement begins with a single step."
            ) : (
              "Another step forward. Keep up the great work!"
            )}
          </p>

          {/* Bottom Confirmation Pill */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ready in your personal pipeline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCelebration;

