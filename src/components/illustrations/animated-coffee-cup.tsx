'use client';

import { motion } from 'motion/react';

interface AnimatedCoffeeCupProps {
  className?: string;
}

export function AnimatedCoffeeCup({ className = 'w-64 h-64' }: AnimatedCoffeeCupProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle background ambient warm glow */}
      <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-3xl scale-75 animate-pulse" />

      {/* Floating cup & steam container with perpetual micro-motion */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          rotate: [-0.5, 0.5, -0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Defs for Gradients and Filters */}
          <defs>
            <linearGradient id="cupGradient" x1="80" y1="130" x2="240" y2="250" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="0.5" stopColor="#D97706" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>

            <linearGradient id="saucerGradient" x1="60" y1="250" x2="260" y2="265" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E7E5E4" />
              <stop offset="0.5" stopColor="#D6D3D1" />
              <stop offset="1" stopColor="#A8A29E" />
            </linearGradient>

            <linearGradient id="coffeeGradient" x1="100" y1="130" x2="220" y2="155" gradientUnits="userSpaceOnUse">
              <stop stopColor="#451A03" />
              <stop offset="1" stopColor="#78350F" />
            </linearGradient>

            <linearGradient id="steamGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#FBBF24" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Saucer / Piring Tatakan */}
          <ellipse cx="160" cy="254" rx="90" ry="12" fill="url(#saucerGradient)" className="dark:opacity-80" />
          <ellipse cx="160" cy="252" rx="76" ry="8" fill="#F5F5F4" className="dark:fill-zinc-800" />
          <ellipse cx="160" cy="258" rx="60" ry="4" fill="#000000" opacity="0.12" />

          {/* Cup Shadow */}
          <ellipse cx="160" cy="242" rx="52" ry="6" fill="#78350F" opacity="0.25" />

          {/* Cup Handle (Gagang Cangkir) */}
          <path
            d="M210 155 C248 155, 256 215, 206 220"
            stroke="url(#cupGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M210 155 C248 155, 256 215, 206 220"
            stroke="#FEF3C7"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />

          {/* Cup Body (Badan Cangkir) */}
          <path
            d="M100 140 H220 C220 140, 218 238, 160 238 C102 238, 100 140, 100 140 Z"
            fill="url(#cupGradient)"
          />

          {/* Cup Highlight / Specular Reflection */}
          <path
            d="M112 148 C112 148, 114 220, 150 230"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.35"
            fill="none"
          />

          {/* Coffee Surface (Permukaan Kopi Panas) */}
          <ellipse cx="160" cy="140" rx="60" ry="13" fill="url(#coffeeGradient)" />
          <ellipse cx="160" cy="140" rx="52" ry="9" fill="#291305" />
          <ellipse cx="156" cy="139" rx="36" ry="5" fill="#78350F" opacity="0.4" />

          {/* Crema / Foam Swirl in Coffee */}
          <path
            d="M142 139 C150 137, 168 137, 178 141"
            stroke="#FDE68A"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Interactive "404" Badge on Cup Body */}
          <g transform="translate(132, 174)">
            <rect
              x="0"
              y="0"
              width="56"
              height="26"
              rx="13"
              fill="#FFFFFF"
              className="dark:fill-zinc-900"
              opacity="0.95"
            />
            <text
              x="28"
              y="18"
              textAnchor="middle"
              className="text-[13px] font-black tracking-widest fill-amber-600 dark:fill-amber-400 font-mono"
            >
              404
            </text>
          </g>

          {/* Animated Steam 1 (Left Stream) */}
          <motion.path
            d="M135 125 C125 105, 145 80, 130 55 C120 38, 138 20, 128 5"
            stroke="url(#steamGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.85, 0.85, 0],
              y: [0, -12, -24, -36],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0,
            }}
          />

          {/* Animated Steam 2 (Center Stream - Taller) */}
          <motion.path
            d="M160 120 C150 95, 175 70, 155 45 C145 28, 168 10, 160 0"
            stroke="url(#steamGradient)"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.95, 0.95, 0],
              y: [0, -15, -30, -45],
            }}
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.7,
            }}
          />

          {/* Animated Steam 3 (Right Stream) */}
          <motion.path
            d="M185 125 C195 105, 175 80, 190 55 C200 38, 182 20, 192 5"
            stroke="url(#steamGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.8, 0.8, 0],
              y: [0, -12, -24, -36],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.4,
            }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
