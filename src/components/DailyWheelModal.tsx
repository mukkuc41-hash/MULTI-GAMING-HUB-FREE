import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  Coins,
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Gift,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  checkDailyWheelStatus,
  recordDailyWheelSpin,
  getUserPoints,
} from '../utils/pointsManager';
import { playCinematicSound } from '../utils/cinematicVfx';
import { soundFx } from '../utils/audio';

interface DailyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuestsOrHatrick?: () => void;
}

interface WheelSlice {
  label: string;
  points: number;
  color: string;
  textColor: string;
  isJackpot?: boolean;
}

const WHEEL_SLICES: WheelSlice[] = [
  { label: '500 PTS', points: 500, color: '#f59e0b', textColor: '#1a1a1a' },
  { label: '1,000 PTS', points: 1000, color: '#3b82f6', textColor: '#ffffff' },
  { label: '250 PTS', points: 250, color: '#10b981', textColor: '#ffffff' },
  { label: '1,500 PTS', points: 1500, color: '#8b5cf6', textColor: '#ffffff' },
  { label: '750 PTS', points: 750, color: '#ec4899', textColor: '#ffffff' },
  { label: '2,000 PTS', points: 2000, color: '#06b6d4', textColor: '#1a1a1a' },
  { label: '2,500 PTS', points: 2500, color: '#f97316', textColor: '#ffffff' },
  { label: '5,000 JACKPOT', points: 5000, color: '#eab308', textColor: '#1a1a1a', isJackpot: true },
];

export const DailyWheelModal: React.FC<DailyWheelModalProps> = ({
  isOpen,
  onClose,
  onOpenQuestsOrHatrick,
}) => {
  const [wheelStatus, setWheelStatus] = useState(() => checkDailyWheelStatus());
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonSlice, setWonSlice] = useState<WheelSlice | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userPoints, setUserPoints] = useState(getUserPoints());
  const [countdownText, setCountdownText] = useState('');

  const wheelRef = useRef<SVGSVGElement | null>(null);

  // Sync points and status on open
  useEffect(() => {
    if (isOpen) {
      setWheelStatus(checkDailyWheelStatus());
      setUserPoints(getUserPoints());
      setShowCelebration(false);
      setWonSlice(null);
    }
  }, [isOpen]);

  // Countdown timer update
  useEffect(() => {
    if (wheelStatus.canSpin) {
      setCountdownText('');
      return;
    }

    const interval = setInterval(() => {
      const status = checkDailyWheelStatus();
      setWheelStatus(status);

      if (status.canSpin) {
        setCountdownText('');
      } else {
        const totalSec = status.remainingSeconds;
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        setCountdownText(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [wheelStatus.canSpin]);

  if (!isOpen) return null;

  const numSlices = WHEEL_SLICES.length;
  const sliceAngle = 360 / numSlices;

  const handleSpin = () => {
    if (isSpinning) return;
    if (!wheelStatus.canSpin) return;

    setIsSpinning(true);
    setShowCelebration(false);
    setWonSlice(null);
    playCinematicSound('whoosh');

    // Pick winning slice (weighted towards fun rewards)
    const rand = Math.random();
    let winningIndex = 0;
    if (rand < 0.05) {
      winningIndex = 7; // Jackpot 5000 (5%)
    } else if (rand < 0.20) {
      winningIndex = 6; // 2500 (15%)
    } else if (rand < 0.35) {
      winningIndex = 5; // 2000 (15%)
    } else if (rand < 0.55) {
      winningIndex = 3; // 1500 (20%)
    } else if (rand < 0.75) {
      winningIndex = 1; // 1000 (20%)
    } else if (rand < 0.90) {
      winningIndex = 4; // 750 (15%)
    } else {
      winningIndex = 0; // 500 (10%)
    }

    const targetSlice = WHEEL_SLICES[winningIndex];

    // Pointer is at the TOP (270 degrees in standard SVG or 0 at top)
    // Extra full spins (5 to 7 full revolutions)
    const extraRounds = 5 + Math.floor(Math.random() * 2);
    // Slice center angle offset so pointer lands cleanly in the middle of target slice
    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;
    // To land on top: rotation = (360 - sliceCenterAngle)
    const finalRotation = rotationDegrees + (extraRounds * 360) + (360 - (rotationDegrees % 360)) + (360 - sliceCenterAngle);

    setRotationDegrees(finalRotation);

    // Audio ticker ticks during spin
    const totalDurationMs = 4500;
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      if (tickCount % 3 === 0) {
        soundFx.playMove();
      }
      if (tickCount > 25) {
        clearInterval(tickInterval);
      }
    }, 150);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWonSlice(targetSlice);
      setShowCelebration(true);

      // Record in Points engine
      const updatedPts = recordDailyWheelSpin(targetSlice.points);
      setUserPoints(updatedPts);
      setWheelStatus(checkDailyWheelStatus());

      playCinematicSound('checkmate');
      soundFx.playGameOver(true);
    }, totalDurationMs);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xl bg-black/85">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-xl bg-[#14161f] border-2 border-amber-500/40 rounded-3xl shadow-[0_20px_70px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-950/50 via-slate-900/80 to-purple-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Gift className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-tight flex items-center gap-2">
                  <span>Daily Lucky Spin Wheel</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    Free Daily Spin
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Spin once every 24 hours to earn up to 5,000 Points for loadouts &amp; animations!
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Points Bar */}
          <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Current Balance:</span>
              <span className="font-extrabold text-amber-300 font-mono text-sm">
                {userPoints.toLocaleString()} PTS
              </span>
            </div>

            {wheelStatus.canSpin ? (
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SPIN READY!</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400/90 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                <Clock className="w-3 h-3" />
                <span>Next in: {countdownText}</span>
              </span>
            )}
          </div>

          {/* Wheel Stage Arena */}
          <div className="p-6 flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0d0f14] to-black min-h-[380px]">
            {/* Background Glow Ring */}
            <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            {/* Top Pointer Needle */}
            <div className="relative z-30 mb-[-14px] flex flex-col items-center">
              <div className="w-6 h-8 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 clip-triangle shadow-[0_0_15px_#f59e0b] border-x-2 border-white/80" />
              <div className="w-3 h-3 rounded-full bg-amber-200 shadow-md mt-[-6px] border border-black/40" />
            </div>

            {/* Rotating SVG Wheel */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center p-1.5 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.4)] border-4 border-yellow-300/40">
              {/* Outer rim lights */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 pointer-events-none animate-spin-slow" />

              <svg
                ref={wheelRef}
                viewBox="0 0 300 300"
                className="w-full h-full rounded-full select-none"
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transition: isSpinning
                    ? 'transform 4.5s cubic-bezier(0.15, 0.95, 0.25, 1)'
                    : 'none',
                }}
              >
                <defs>
                  <filter id="sliceShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.5" />
                  </filter>
                </defs>

                {WHEEL_SLICES.map((slice, index) => {
                  const startAngle = index * sliceAngle;
                  const endAngle = (index + 1) * sliceAngle;
                  const startRad = ((startAngle - 90) * Math.PI) / 180;
                  const endRad = ((endAngle - 90) * Math.PI) / 180;

                  const x1 = 150 + 150 * Math.cos(startRad);
                  const y1 = 150 + 150 * Math.sin(startRad);
                  const x2 = 150 + 150 * Math.cos(endRad);
                  const y2 = 150 + 150 * Math.sin(endRad);

                  const pathData = `M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`;

                  // Text rotation angle
                  const midAngle = startAngle + sliceAngle / 2;
                  const textRad = ((midAngle - 90) * Math.PI) / 180;
                  const textX = 150 + 95 * Math.cos(textRad);
                  const textY = 150 + 95 * Math.sin(textRad);

                  return (
                    <g key={slice.label}>
                      <path
                        d={pathData}
                        fill={slice.color}
                        stroke="#1a1c23"
                        strokeWidth="2"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill={slice.textColor}
                        fontSize={slice.isJackpot ? '11' : '12'}
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                        filter="url(#sliceShadow)"
                      >
                        {slice.label}
                      </text>
                    </g>
                  );
                })}

                {/* Inner Gold Hub */}
                <circle cx="150" cy="150" r="30" fill="url(#hubGrad)" stroke="#fff" strokeWidth="2" />
                <defs>
                  <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Center Decorative Crown */}
              <div className="absolute z-20 pointer-events-none w-10 h-10 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-200">
                <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              </div>
            </div>

            {/* Celebration Popup Alert */}
            {showCelebration && wonSlice && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-cyan-500/25 border-2 border-amber-400 text-center shadow-2xl backdrop-blur-md max-w-sm w-full"
              >
                <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>CONGRATULATIONS!</span>
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  You won <span className="text-emerald-400 font-mono">+{wonSlice.points.toLocaleString()} PTS</span>!
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Credited to your loadout wallet. Spend on custom 96-state piece styles!
                </p>
              </motion.div>
            )}

            {/* Action Spin Button */}
            <div className="mt-5 flex flex-col items-center gap-2 w-full max-w-xs">
              <button
                disabled={isSpinning || !wheelStatus.canSpin}
                onClick={handleSpin}
                className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 ${
                  wheelStatus.canSpin && !isSpinning
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinning
                    ? 'SPINNING WHEEL...'
                    : wheelStatus.canSpin
                    ? 'SPIN LUCKY WHEEL FREE!'
                    : `ON COOLDOWN (${countdownText})`}
                </span>
              </button>

              {/* Ways to earn more points notice */}
              <div className="text-[11px] text-slate-400 text-center mt-1 flex items-center gap-1">
                <span>Other points sources:</span>
                <span className="text-emerald-400 font-bold">Simultaneous Hatrick</span>
                <span>&amp;</span>
                <span className="text-cyan-400 font-bold">Random Quests</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts to other point tasks */}
          <div className="p-4 bg-[#0e1017] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Points Rule: Earned strictly via Wheel, Hatrick &amp; Quests.</span>
            </div>

            {onOpenQuestsOrHatrick && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQuestsOrHatrick();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/30 transition flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>View Quests &amp; Hatrick</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
