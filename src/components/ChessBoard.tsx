import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { BoardTheme } from '../types';
import { ChessPiece } from '../utils/chessPieces';
import { soundFx } from '../utils/audio';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Trash2,
  Palette,
  Crosshair,
  Flame,
  Zap,
  Sliders,
  X,
  Play,
  CheckCircle2,
} from 'lucide-react';
import {
  loadVfxSettings,
  saveVfxSettings,
  playCinematicSound,
  getThemeColors,
  VfxSettings,
  VfxParticle,
  VARIATIONS_96_MATRIX,
  PieceElementCode,
} from '../utils/cinematicVfx';

interface ChessBoardProps {
  chess: Chess;
  orientation: 'w' | 'b';
  boardTheme: BoardTheme;
  onMove: (from: Square, to: Square) => void;
  showLegalMoves?: boolean;
  showLastMove?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  kingInCheckSquare?: Square | null;
  readOnly?: boolean;
  onFlipOrientation?: () => void;
  onChangeTheme?: (theme: BoardTheme) => void;
}

interface TacticalArrow {
  from: Square;
  to: Square;
  color: 'green' | 'red' | 'amber' | 'blue';
}

interface ShockwaveRing {
  id: number;
  x: number;
  y: number;
  color: string;
  glowColor: string;
  size: number;
}

interface FloatingMoveBadge {
  id: number;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  bg: string;
  border: string;
}

const themeConfigs: Record<
  BoardTheme,
  {
    name: string;
    light: string;
    dark: string;
    lightText: string;
    darkText: string;
    border: string;
    outerRing: string;
    glow: string;
  }
> = {
  terracotta: {
    name: 'Terracotta Sienna (Cinema)',
    light: 'bg-[#eed7b5]',
    dark: 'bg-[#be5b3c]',
    lightText: 'text-[#be5b3c]',
    darkText: 'text-[#eed7b5]',
    border: 'border-[#913d24]',
    outerRing: 'from-[#9e4328] via-[#662816] to-[#301208]',
    glow: 'rgba(190, 91, 60, 0.45)',
  },
  emerald: {
    name: 'Classic Tournament',
    light: 'bg-[#eeeed2]',
    dark: 'bg-[#769656]',
    lightText: 'text-[#769656]',
    darkText: 'text-[#eeeed2]',
    border: 'border-[#4e6b36]',
    outerRing: 'from-[#4e6b36] via-[#2d401f] to-[#1b2713]',
    glow: 'rgba(118, 150, 86, 0.3)',
  },
  wood: {
    name: 'Walnut & Maple',
    light: 'bg-[#f0d9b5]',
    dark: 'bg-[#b58863]',
    lightText: 'text-[#b58863]',
    darkText: 'text-[#f0d9b5]',
    border: 'border-[#8c6243]',
    outerRing: 'from-[#6e462c] via-[#482c1b] to-[#2c1a0e]',
    glow: 'rgba(181, 136, 99, 0.35)',
  },
  slate: {
    name: 'Modern Slate',
    light: 'bg-[#e2e8f0]',
    dark: 'bg-[#475569]',
    lightText: 'text-[#475569]',
    darkText: 'text-[#e2e8f0]',
    border: 'border-slate-700',
    outerRing: 'from-slate-700 via-slate-800 to-slate-950',
    glow: 'rgba(71, 85, 105, 0.35)',
  },
  stone: {
    name: 'Obsidian Marble',
    light: 'bg-[#e7e5e4]',
    dark: 'bg-[#57534e]',
    lightText: 'text-[#57534e]',
    darkText: 'text-[#e7e5e4]',
    border: 'border-stone-700',
    outerRing: 'from-stone-700 via-stone-800 to-stone-950',
    glow: 'rgba(87, 83, 78, 0.35)',
  },
  neon: {
    name: 'Cyberpunk Neon',
    light: 'bg-[#ede9fe]',
    dark: 'bg-[#312e81]',
    lightText: 'text-[#312e81]',
    darkText: 'text-[#ede9fe]',
    border: 'border-indigo-800',
    outerRing: 'from-indigo-600 via-purple-900 to-slate-950',
    glow: 'rgba(99, 102, 241, 0.45)',
  },
  ocean: {
    name: 'Pacific Azure',
    light: 'bg-[#e0f2fe]',
    dark: 'bg-[#0284c7]',
    lightText: 'text-[#0284c7]',
    darkText: 'text-[#e0f2fe]',
    border: 'border-sky-800',
    outerRing: 'from-sky-600 via-blue-900 to-slate-950',
    glow: 'rgba(2, 132, 199, 0.4)',
  },
  crimson: {
    name: 'Royal Velvet',
    light: 'bg-[#fef2f2]',
    dark: 'bg-[#991b1b]',
    lightText: 'text-[#991b1b]',
    darkText: 'text-[#fef2f2]',
    border: 'border-rose-900',
    outerRing: 'from-rose-700 via-red-950 to-stone-950',
    glow: 'rgba(153, 27, 27, 0.4)',
  },
  glass: {
    name: 'Nordic Crystal',
    light: 'bg-[#f8fafc]',
    dark: 'bg-[#334155]',
    lightText: 'text-[#334155]',
    darkText: 'text-[#f8fafc]',
    border: 'border-slate-600',
    outerRing: 'from-slate-600 via-slate-800 to-slate-950',
    glow: 'rgba(148, 163, 184, 0.3)',
  },
  cyber: {
    name: 'Cyber Neon (Cinematic Image Match)',
    light: 'bg-[#28384f]',
    dark: 'bg-[#121c2a]',
    lightText: 'text-[#38bdf8]',
    darkText: 'text-[#00f2fe]',
    border: 'border-cyan-400 shadow-[0_0_25px_rgba(0,242,254,0.4)]',
    outerRing: 'from-cyan-500 via-slate-900 to-[#070e1b]',
    glow: 'rgba(0, 242, 254, 0.65)',
  },
};

const ARROW_COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation,
  boardTheme,
  onMove,
  showLegalMoves = true,
  showLastMove = true,
  lastMove = null,
  kingInCheckSquare = null,
  readOnly = false,
  onFlipOrientation,
  onChangeTheme,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  // Right-Click Drawing & Tactical Annotations Engine
  const [arrows, setArrows] = useState<TacticalArrow[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Record<Square, 'green' | 'red' | 'amber' | 'blue'>>({} as any);
  const rightClickStartSquareRef = useRef<Square | null>(null);
  const isRightMouseDownRef = useRef<boolean>(false);

  // Board Coordinates & UI preferences
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const [showVfxPanel, setShowVfxPanel] = useState<boolean>(false);

  // Cinematic VFX Settings (Active by Default)
  const [vfxSettings, setVfxSettings] = useState<VfxSettings>(() => loadVfxSettings());

  // Listen for VFX settings updates (e.g. from Showcase modal or settings)
  useEffect(() => {
    const handleVfxUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VfxSettings>;
      if (customEvent.detail) {
        setVfxSettings(customEvent.detail);
      }
    };
    window.addEventListener('chess_vfx_settings_updated', handleVfxUpdate);
    return () => window.removeEventListener('chess_vfx_settings_updated', handleVfxUpdate);
  }, []);

  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VfxParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // VFX States
  const [shockwaves, setShockwaves] = useState<ShockwaveRing[]>([]);
  const [floatingBadges, setFloatingBadges] = useState<FloatingMoveBadge[]>([]);
  const [isBoardShaking, setIsBoardShaking] = useState<boolean>(false);

  // 96-State Capture Ghosts & Occupation Active States
  const [captureGhosts, setCaptureGhosts] = useState<{
    id: number;
    square: Square;
    pieceType: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    pieceColor: 'w' | 'b';
    styleIndex: 1 | 2 | 3 | 4;
  }[]>([]);

  const [occupyingSquare, setOccupyingSquare] = useState<{
    square: Square;
    styleIndex: 1 | 2 | 3 | 4;
  } | null>(null);

  // Real-time 96-Variation Tester State
  const [simulationTarget, setSimulationTarget] = useState<{
    id: string;
    square: Square;
    piece: PieceElementCode;
    color: 'w' | 'b';
    action: 'capturing' | 'occupying';
    styleIndex: 1 | 2 | 3 | 4;
  } | null>(null);

  const [testerPieceFilter, setTesterPieceFilter] = useState<PieceElementCode>('N');
  const [testerActionFilter, setTesterActionFilter] = useState<'capturing' | 'occupying'>('capturing');

  // Piece ID Tracking for smooth Motion layoutId slide animations
  const [pieceIds, setPieceIds] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    const board = chess.board();
    const filesList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const sq = `${filesList[c]}${8 - r}`;
          initialMap[sq] = `${p.color}_${p.type}_${sq}`;
        }
      }
    }
    return initialMap;
  });

  useEffect(() => {
    setPieceIds((prevIds) => {
      const nextIds: Record<string, string> = {};
      const board = chess.board();
      const filesList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      // Build list of active pieces on board
      const activePieces: { sq: Square; color: string; type: string }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p) {
            const sq = `${filesList[c]}${8 - r}` as Square;
            activePieces.push({ sq, color: p.color, type: p.type });
          }
        }
      }

      // If lastMove exists, transfer the ID from lastMove.from to lastMove.to
      if (lastMove && prevIds[lastMove.from]) {
        nextIds[lastMove.to] = prevIds[lastMove.from];

        // Castling checks for rooks
        if (lastMove.from === 'e1' && lastMove.to === 'g1' && prevIds['h1']) nextIds['f1'] = prevIds['h1'];
        if (lastMove.from === 'e1' && lastMove.to === 'c1' && prevIds['a1']) nextIds['d1'] = prevIds['a1'];
        if (lastMove.from === 'e8' && lastMove.to === 'g8' && prevIds['h8']) nextIds['f8'] = prevIds['h8'];
        if (lastMove.from === 'e8' && lastMove.to === 'c8' && prevIds['a8']) nextIds['d8'] = prevIds['a8'];
      }

      // Map remaining active pieces
      for (const pItem of activePieces) {
        if (nextIds[pItem.sq]) continue;

        const existingId = prevIds[pItem.sq];
        if (existingId && existingId.startsWith(`${pItem.color}_`)) {
          nextIds[pItem.sq] = existingId;
        } else {
          nextIds[pItem.sq] = `${pItem.color}_${pItem.type}_${pItem.sq}_${Math.random().toString(36).slice(2, 6)}`;
        }
      }

      return nextIds;
    });
  }, [chess.fen(), lastMove]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedRanks = orientation === 'w' ? ranks : [...ranks].reverse();
  const displayedFiles = orientation === 'w' ? files : [...files].reverse();

  // Helper to get pixel center coordinates of a square on the board
  const getSquareCoords = useCallback(
    (square: Square): { x: number; y: number; size: number } => {
      if (!boardRef.current) return { x: 0, y: 0, size: 60 };
      const rect = boardRef.current.getBoundingClientRect();
      const squareSize = rect.width / 8;
      const fIdx = displayedFiles.indexOf(square[0]);
      const rIdx = displayedRanks.indexOf(square[1]);
      return {
        x: fIdx * squareSize + squareSize / 2,
        y: rIdx * squareSize + squareSize / 2,
        size: squareSize,
      };
    },
    [displayedFiles, displayedRanks]
  );

  // Spark Particles Emitter
  const triggerParticleBurst = useCallback(
    (centerX: number, centerY: number, colorScheme: string[], count = vfxSettings.particleDensity) => {
      if (!vfxSettings.enabled) return;
      const shapes: ('circle' | 'star' | 'diamond')[] = ['circle', 'star', 'diamond'];
      const newParticles: VfxParticle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 8 + 3) * (vfxSettings.animSpeed || 1);
        newParticles.push({
          id: Math.random(),
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 2 + 1),
          size: Math.random() * 4.5 + 2,
          color: colorScheme[Math.floor(Math.random() * colorScheme.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 26 + 22,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    [vfxSettings]
  );

  // Main Canvas Render Loop for Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const active: VfxParticle[] = [];

      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // subtle gravity
        p.vx *= 0.96; // air resistance
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.alpha > 0.01 && p.life < p.maxLife) {
          active.push(p);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size * 1.3);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.lineTo(p.x, p.y + p.size * 1.3);
            ctx.lineTo(p.x - p.size, p.y);
            ctx.closePath();
            ctx.fill();
          } else {
            // Star
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              ctx.lineTo(
                Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size + p.x,
                -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size + p.y
              );
              ctx.lineTo(
                Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2) + p.x,
                -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2) + p.y
              );
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }

      particlesRef.current = active;
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Update canvas size on resize
  const syncCanvasSize = useCallback(() => {
    if (!boardRef.current || !canvasRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    canvasRef.current.width = rect.width;
    canvasRef.current.height = rect.height;
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [syncCanvasSize]);

  // Master Reaction Trigger on every move in Main Chess
  const prevLastMoveRef = useRef<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    if (!lastMove) {
      prevLastMoveRef.current = null;
      return;
    }

    // Check if this is a newly arrived move
    const isNewMove =
      !prevLastMoveRef.current ||
      prevLastMoveRef.current.from !== lastMove.from ||
      prevLastMoveRef.current.to !== lastMove.to;

    if (!isNewMove) return;
    prevLastMoveRef.current = lastMove;

    if (!vfxSettings.enabled) return;

    const coords = getSquareCoords(lastMove.to);
    const pieceOnTo = chess.get(lastMove.to);
    const pType = pieceOnTo?.type || 'p';
    const isCheck = !!kingInCheckSquare || chess.inCheck();
    const isCheckmate = chess.isGameOver() && isCheck;
    const isCapture = !!chess.history({ verbose: true }).slice(-1)[0]?.captured;

    const themeColors = getThemeColors(vfxSettings.vfxTheme);

    // 1. Play Synthesized Sound
    if (vfxSettings.soundEnabled) {
      if (isCheckmate) {
        playCinematicSound('checkmate');
      } else if (isCheck) {
        playCinematicSound('check');
      } else if (isCapture) {
        playCinematicSound('capture');
      } else if (pType === 'n') {
        playCinematicSound('leap');
      } else if (pType === 'q') {
        playCinematicSound('whoosh');
      } else {
        playCinematicSound('move');
      }
    }

    // Determine 96-State Variation Style Index (1-4)
    const activeStyle: 1 | 2 | 3 | 4 =
      vfxSettings.animStyleMode === 'dynamic' || !vfxSettings.animStyleMode
        ? (((chess.history().length % 4) + 1) as 1 | 2 | 3 | 4)
        : (vfxSettings.animStyleMode as 1 | 2 | 3 | 4);

    // Trigger Occupying Arrival Animation
    setOccupyingSquare({
      square: lastMove.to,
      styleIndex: activeStyle,
    });
    setTimeout(() => {
      setOccupyingSquare((curr) => (curr?.square === lastMove.to ? null : curr));
    }, 600);

    // If a capture occurred, spawn the Capture Ghost with corresponding piece type & style
    if (isCapture) {
      const historyVerbose = chess.history({ verbose: true });
      const lastVerbose = historyVerbose[historyVerbose.length - 1];
      const capturedType = (lastVerbose?.captured || 'p') as 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
      const capturedColor = pieceOnTo?.color === 'w' ? 'b' : 'w';

      const ghostId = Date.now() + Math.random();
      setCaptureGhosts((prev) => [
        ...prev,
        {
          id: ghostId,
          square: lastMove.to,
          pieceType: capturedType,
          pieceColor: capturedColor,
          styleIndex: activeStyle,
        },
      ]);

      setTimeout(() => {
        setCaptureGhosts((prev) => prev.filter((g) => g.id !== ghostId));
      }, 700);
    }

    // 2. Trigger Particles
    let particleColors = themeColors;
    if (isCheckmate) particleColors = ['#ffd700', '#fbbf24', '#ffffff', '#eab308'];
    else if (isCapture) particleColors = ['#ef4444', '#f97316', '#ffedd5', '#f87171'];
    else if (isCheck) particleColors = ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'];

    triggerParticleBurst(coords.x, coords.y, particleColors, isCheckmate ? 50 : isCapture ? 36 : 24);

    // 3. Trigger Shockwave Ring
    const shockwaveId = Date.now() + Math.random();
    const shockColor = isCheckmate
      ? 'rgba(250, 204, 21, 0.9)'
      : isCapture
      ? 'rgba(239, 68, 68, 0.85)'
      : isCheck
      ? 'rgba(245, 158, 11, 0.9)'
      : 'rgba(0, 242, 254, 0.85)';

    setShockwaves((prev) => [
      ...prev,
      {
        id: shockwaveId,
        x: coords.x,
        y: coords.y,
        color: shockColor,
        glowColor: shockColor,
        size: coords.size,
      },
    ]);

    setTimeout(() => {
      setShockwaves((prev) => prev.filter((s) => s.id !== shockwaveId));
    }, 850);

    // 4. Trigger Board Jolt Shake
    if (vfxSettings.screenShake && (isCapture || isCheck || isCheckmate)) {
      setIsBoardShaking(true);
      setTimeout(() => setIsBoardShaking(false), 420);
    }

    // 5. Trigger Floating Evaluation Badge
    if (vfxSettings.floatingBadges) {
      let badgeText = '';
      let badgeColor = 'text-cyan-300';
      let badgeBg = 'bg-cyan-950/80';
      let badgeBorder = 'border-cyan-400/50';

      if (isCheckmate) {
        badgeText = '# MATE';
        badgeColor = 'text-amber-300';
        badgeBg = 'bg-amber-950/90';
        badgeBorder = 'border-amber-400/80';
      } else if (isCheck) {
        badgeText = '+ CHECK';
        badgeColor = 'text-red-300';
        badgeBg = 'bg-red-950/90';
        badgeBorder = 'border-red-400/80';
      } else if (isCapture) {
        badgeText = '💥 CAPTURE';
        badgeColor = 'text-rose-300';
        badgeBg = 'bg-rose-950/80';
        badgeBorder = 'border-rose-400/60';
      } else if (pType === 'n') {
        badgeText = '♞ LEAP';
        badgeColor = 'text-sky-300';
        badgeBg = 'bg-sky-950/80';
        badgeBorder = 'border-sky-400/60';
      } else if (pType === 'q') {
        badgeText = '♛ GLIDE';
        badgeColor = 'text-purple-300';
        badgeBg = 'bg-purple-950/80';
        badgeBorder = 'border-purple-400/60';
      }

      if (badgeText) {
        const badgeId = Date.now() + Math.random();
        setFloatingBadges((prev) => [
          ...prev,
          {
            id: badgeId,
            x: coords.x,
            y: coords.y,
            text: badgeText,
            color: badgeColor,
            bg: badgeBg,
            border: badgeBorder,
          },
        ]);

        setTimeout(() => {
          setFloatingBadges((prev) => prev.filter((b) => b.id !== badgeId));
        }, 1100);
      }
    }
  }, [lastMove, chess, kingInCheckSquare, vfxSettings, getSquareCoords, triggerParticleBurst]);

  // Trigger signature physics test effect right onto the main board
  const triggerSignaturePhysicsPreset = (presetName: string) => {
    const centerCoords = {
      x: (boardRef.current?.clientWidth || 400) / 2,
      y: (boardRef.current?.clientHeight || 400) / 2,
      size: 50,
    };

    if (presetName === 'knight_leap') {
      playCinematicSound('leap');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('cyber'), 40);
    } else if (presetName === 'king_mate') {
      playCinematicSound('checkmate');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('royal'), 60);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 450);
      }
    } else if (presetName === 'queen_ghost') {
      playCinematicSound('whoosh');
      triggerParticleBurst(centerCoords.x, centerCoords.y, ['#c084fc', '#e879f9', '#a855f7', '#ffffff'], 45);
    } else if (presetName === 'rook_smash') {
      playCinematicSound('capture');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('inferno'), 45);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 450);
      }
    } else {
      playCinematicSound('brilliant');
      triggerParticleBurst(centerCoords.x, centerCoords.y, getThemeColors('emerald'), 40);
    }

    const shockId = Date.now();
    setShockwaves((prev) => [
      ...prev,
      {
        id: shockId,
        x: centerCoords.x,
        y: centerCoords.y,
        color: 'rgba(0, 242, 254, 0.9)',
        glowColor: 'rgba(0, 242, 254, 0.9)',
        size: 50,
      },
    ]);
    setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 850);
  };

  // Trigger any of the 96 exact piece variations in real-time on board square e4
  const triggerSimulationVariation = (
    piece: PieceElementCode,
    action: 'capturing' | 'occupying',
    styleIndex: 1 | 2 | 3 | 4,
    color: 'w' | 'b' = 'w'
  ) => {
    const targetSq: Square = 'e4';
    const coords = getSquareCoords(targetSq);
    const simId = `${piece}_${action}_${styleIndex}_${Date.now()}`;

    if (action === 'capturing') {
      playCinematicSound('capture');
      triggerParticleBurst(coords.x, coords.y, ['#ef4444', '#f97316', '#ffedd5', '#f87171'], 38);
      if (vfxSettings.screenShake) {
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 380);
      }
    } else {
      if (piece === 'N') playCinematicSound('leap');
      else if (piece === 'Q') playCinematicSound('whoosh');
      else if (piece === 'K') playCinematicSound('checkmate');
      else playCinematicSound('move');
      triggerParticleBurst(coords.x, coords.y, getThemeColors(vfxSettings.vfxTheme), 30);
    }

    const shockId = Date.now();
    setShockwaves((prev) => [
      ...prev,
      {
        id: shockId,
        x: coords.x,
        y: coords.y,
        color: action === 'capturing' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 242, 254, 0.85)',
        glowColor: action === 'capturing' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 242, 254, 0.85)',
        size: coords.size,
      },
    ]);
    setTimeout(() => setShockwaves((prev) => prev.filter((s) => s.id !== shockId)), 800);

    setSimulationTarget({
      id: simId,
      square: targetSq,
      piece,
      color,
      action,
      styleIndex,
    });

    setTimeout(() => {
      setSimulationTarget((curr) => (curr?.id === simId ? null : curr));
    }, 850);
  };

  // Get legal move target squares for currently selected square
  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare || readOnly) return [];
    try {
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      return moves.map((m) => m.to as Square);
    } catch {
      return [];
    }
  }, [chess, selectedSquare, readOnly]);

  const clearAnnotations = () => {
    setArrows([]);
    setHighlightedSquares({} as any);
  };

  const handleSquareClick = (square: Square) => {
    // Clear user annotations on board interaction
    if (arrows.length > 0 || Object.keys(highlightedSquares).length > 0) {
      clearAnnotations();
    }

    if (readOnly) return;

    const piece = chess.get(square);
    const turn = chess.turn();

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (legalMovesForSelected.includes(square)) {
        if (soundEnabled && !vfxSettings.enabled) {
          if (piece) soundFx.playCapture();
          else soundFx.playMove();
        }
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled && !vfxSettings.enabled) soundFx.playMove();
        return;
      }

      setSelectedSquare(null);
    } else {
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled && !vfxSettings.enabled) soundFx.playMove();
      }
    }
  };

  // Right-Click Annotation Handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      e.preventDefault();
      rightClickStartSquareRef.current = square;
      isRightMouseDownRef.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2 && rightClickStartSquareRef.current) {
      e.preventDefault();
      const startSq = rightClickStartSquareRef.current;
      const endSq = square;

      let color: 'green' | 'red' | 'amber' | 'blue' = 'green';
      if (e.shiftKey) color = 'red';
      else if (e.altKey) color = 'amber';
      else if (e.ctrlKey || e.metaKey) color = 'blue';

      if (startSq === endSq) {
        setHighlightedSquares((prev) => {
          const next = { ...prev };
          if (next[startSq] === color) {
            delete next[startSq];
          } else {
            next[startSq] = color;
          }
          return next;
        });
      } else {
        setArrows((prev) => {
          const existingIdx = prev.findIndex((a) => a.from === startSq && a.to === endSq);
          if (existingIdx >= 0) {
            return prev.filter((_, idx) => idx !== existingIdx);
          } else {
            return [...prev, { from: startSq, to: endSq, color }];
          }
        });
      }

      rightClickStartSquareRef.current = null;
      isRightMouseDownRef.current = false;
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(square);
    setDraggedSquare(square);
    clearAnnotations();
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = (e.dataTransfer.getData('text/plain') || draggedSquare) as Square;
    if (sourceSquare && sourceSquare !== targetSquare) {
      const moves = chess.moves({ square: sourceSquare, verbose: true });
      const isValid = moves.some((m) => m.to === targetSquare);
      if (isValid) {
        onMove(sourceSquare, targetSquare);
      }
    }
    setSelectedSquare(null);
    setDraggedSquare(null);
  };

  const updateVfxSetting = <K extends keyof VfxSettings>(key: K, value: VfxSettings[K]) => {
    const next = saveVfxSettings({ [key]: value });
    setVfxSettings(next);
  };

  const theme = themeConfigs[boardTheme] || themeConfigs.emerald;
  const currentTurn = chess.turn();
  const hasAnnotations = arrows.length > 0 || Object.keys(highlightedSquares).length > 0;

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center select-none group/board relative">
      {/* Floating Micro-Toolbar for Board Enhancement & VFX */}
      <div className="w-full flex items-center justify-between px-2 py-1 mb-1.5 text-xs text-white/70">
        <div className="flex items-center gap-1.5">
          {/* Turn Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
            <div
              className={`w-2.5 h-2.5 rounded-full border border-white/30 ${
                currentTurn === 'w' ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-slate-900 border-white/40 shadow-[0_0_8px_#475569]'
              }`}
            />
            <span className="text-[11px] font-bold tracking-tight text-white/90">
              {currentTurn === 'w' ? 'White to Move' : 'Black to Move'}
            </span>
          </div>

          {/* King in Danger Badge */}
          {kingInCheckSquare && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 animate-pulse font-bold text-[10px]">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Check!</span>
            </div>
          )}
        </div>

        {/* Board Controls & VFX Action Button */}
        <div className="flex items-center gap-1">
          {/* CINEMATIC VFX & ANIMATION QUICK-CONTROL BUTTON */}
          <button
            onClick={() => setShowVfxPanel(!showVfxPanel)}
            className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition border ${
              vfxSettings.enabled
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-amber-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Cinematic VFX & Signature Physics Settings (Off by Default)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">VFX</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-200">
              {vfxSettings.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {hasAnnotations && (
            <button
              onClick={clearAnnotations}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1 transition"
              title="Clear Tactical Annotations & Arrows"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {onChangeTheme && (
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition flex items-center gap-1"
                title="Change Board Theme"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              {showThemePicker && (
                <div className="absolute right-0 top-8 z-50 bg-slate-900/95 border border-white/15 backdrop-blur-xl rounded-xl p-2 shadow-2xl w-48 space-y-1 animate-fadeIn">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1 mb-1">
                    Board Themes
                  </span>
                  {(Object.keys(themeConfigs) as BoardTheme[]).map((tKey) => (
                    <button
                      key={tKey}
                      onClick={() => {
                        onChangeTheme(tKey);
                        setShowThemePicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition ${
                        boardTheme === tKey
                          ? 'bg-indigo-500/30 border border-indigo-400 text-white'
                          : 'hover:bg-white/10 text-white/70'
                      }`}
                    >
                      <span>{themeConfigs[tKey].name}</span>
                      <div className={`w-3 h-3 rounded-full border border-white/30 ${themeConfigs[tKey].dark}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowCoordinates(!showCoordinates)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
            title={showCoordinates ? 'Hide Algebraic Coordinates' : 'Show Algebraic Coordinates'}
          >
            {showCoordinates ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              updateVfxSetting('soundEnabled', next);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
            title={soundEnabled ? 'Mute Board Sound FX' : 'Enable Board Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {onFlipOrientation && (
            <button
              onClick={onFlipOrientation}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition"
              title="Flip Board View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive VFX Controls Drawer / Panel */}
      <AnimatePresence>
        {showVfxPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="w-full mb-2 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Cinematic VFX & Physics (Active in Main Game)
                </span>
              </div>
              <button
                onClick={() => setShowVfxPanel(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {/* Master Toggle */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">VFX Status</span>
                <button
                  onClick={() => updateVfxSetting('enabled', !vfxSettings.enabled)}
                  className={`py-1 px-2 rounded-lg font-black text-[11px] transition ${
                    vfxSettings.enabled
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {vfxSettings.enabled ? 'ACTIVE (ON)' : 'DISABLED'}
                </button>
              </div>

              {/* Animation Speed */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Speed: {vfxSettings.animSpeed}x</span>
                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateVfxSetting('animSpeed', s)}
                      className={`flex-1 py-1 rounded text-[10px] font-black transition ${
                        vfxSettings.animSpeed === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Particle Sparks Density */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Sparks: {vfxSettings.particleDensity}</span>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="6"
                  value={vfxSettings.particleDensity}
                  onChange={(e) => updateVfxSetting('particleDensity', Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Screen / Board Shake */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold">Board Shake</span>
                <button
                  onClick={() => updateVfxSetting('screenShake', !vfxSettings.screenShake)}
                  className={`py-1 px-2 rounded-lg font-black text-[11px] transition ${
                    vfxSettings.screenShake
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {vfxSettings.screenShake ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              {/* 96-State Style Mode Selector */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/60 border border-cyan-500/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-cyan-300 font-black">96-State Mode</span>
                <select
                  value={vfxSettings.animStyleMode || 'dynamic'}
                  onChange={(e) =>
                    updateVfxSetting(
                      'animStyleMode',
                      e.target.value === 'dynamic' ? 'dynamic' : (Number(e.target.value) as 1 | 2 | 3 | 4)
                    )
                  }
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1 text-[10px] font-bold text-white focus:outline-none"
                >
                  <option value="dynamic">✨ Auto-Cycle (1-4)</option>
                  <option value="1">Style 1 (Dissolve / Gate)</option>
                  <option value="2">Style 2 (Spin Vortex / Gold)</option>
                  <option value="3">Style 3 (Shatter / Solar)</option>
                  <option value="4">Style 4 (Singularity / Sweep)</option>
                </select>
              </div>
            </div>

            {/* 96-State Variation Matrix Live Trigger Toolbar */}
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wide">
                    96 Variations Matrix:
                  </span>
                  {/* Piece Filter Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                    {(['P', 'N', 'B', 'R', 'Q', 'K'] as PieceElementCode[]).map((pCode) => (
                      <button
                        key={pCode}
                        onClick={() => setTesterPieceFilter(pCode)}
                        className={`w-6 h-6 rounded font-black text-[11px] transition ${
                          testerPieceFilter === pCode
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#00f2fe]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {pCode}
                      </button>
                    ))}
                  </div>

                  {/* Action Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setTesterActionFilter('capturing')}
                      className={`px-2 py-1 rounded text-[10px] font-black transition ${
                        testerActionFilter === 'capturing'
                          ? 'bg-rose-500 text-white shadow-[0_0_8px_#ef4444]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚔️ Capture
                    </button>
                    <button
                      onClick={() => setTesterActionFilter('occupying')}
                      className={`px-2 py-1 rounded text-[10px] font-black transition ${
                        testerActionFilter === 'occupying'
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛡️ Occupy
                    </button>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 italic">
                  Click below to trigger live on e4:
                </span>
              </div>

              {/* 4 Styles Trigger Buttons for selected Piece & Action */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((sIndex) => {
                  const matchingSpec = VARIATIONS_96_MATRIX.find(
                    (v) =>
                      v.piece === testerPieceFilter &&
                      v.action === testerActionFilter &&
                      v.styleIndex === sIndex
                  );
                  return (
                    <button
                      key={sIndex}
                      onClick={() =>
                        triggerSimulationVariation(
                          testerPieceFilter,
                          testerActionFilter,
                          sIndex as 1 | 2 | 3 | 4
                        )
                      }
                      style={{ borderColor: matchingSpec?.colorAccent }}
                      className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/15 text-left transition transform hover:-translate-y-0.5 active:scale-95 group flex flex-col justify-between gap-1 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white group-hover:text-cyan-300">
                          Style {sIndex}
                        </span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
                          style={{
                            backgroundColor: `${matchingSpec?.colorAccent || '#fff'}25`,
                            color: matchingSpec?.colorAccent || '#fff',
                          }}
                        >
                          {matchingSpec?.animationName.replace('anim-core-', '')}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                        {matchingSpec?.description || 'Custom piece state'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Luxury Board Frame with Jolt Shake */}
      <div
        ref={boardRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{ boxShadow: `0 20px 50px -10px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.1)` }}
        className={`w-full aspect-square relative select-none p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br ${theme.outerRing} border-2 ${theme.border} transition-all duration-300 ${
          isBoardShaking ? 'shake-active' : ''
        }`}
      >
        {/* Subtle Inner Bevel Container */}
        <div className="relative w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden shadow-2xl border border-white/15">
          {displayedRanks.map((rank, rIdx) =>
            displayedFiles.map((file, fIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (rIdx + fIdx) % 2 === 0;
              const piece = chess.get(square);

              const isSelected = selectedSquare === square;
              const isLegalTarget = showLegalMoves && legalMovesForSelected.includes(square);
              const isLastMoveSquare =
                showLastMove &&
                lastMove &&
                (lastMove.from === square || lastMove.to === square);
              const isKingInCheck = kingInCheckSquare === square;
              const isHovered = hoveredSquare === square;
              const squareCircleHighlight = highlightedSquares[square];

              return (
                <div
                  key={square}
                  data-square={square}
                  onClick={() => handleSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onMouseUp={(e) => handleMouseUp(e, square)}
                  onMouseEnter={() => setHoveredSquare(square)}
                  onMouseLeave={() => setHoveredSquare(null)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                    isLight ? theme.light : theme.dark
                  }`}
                >
                  {/* Subtle Square Hover Highlight */}
                  {isHovered && !isSelected && (
                    <div className="absolute inset-0 bg-white/10 z-5 pointer-events-none transition" />
                  )}

                  {/* Last Move Aura */}
                  {isLastMoveSquare && (
                    <div className="absolute inset-0 bg-[#baca44]/75 z-0 animate-fadeIn" />
                  )}

                  {/* Selected Square Golden Glow Plate */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#f7f769]/85 border-2 border-amber-400 shadow-[inset_0_0_12px_rgba(245,158,11,0.6)] z-10" />
                  )}

                  {/* King Danger Zone / Check Shockwave */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-600/75 animate-pulse border-2 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.95),inset_0_0_15px_rgba(239,68,68,0.8)] z-10">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <Crosshair className="w-full h-full text-red-200 animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                    </div>
                  )}

                  {/* Right-Click Circular Tactical Ring */}
                  {squareCircleHighlight && (
                    <div
                      className="absolute inset-1 rounded-full border-4 pointer-events-none z-15 animate-scaleIn"
                      style={{
                        borderColor: ARROW_COLORS[squareCircleHighlight],
                        boxShadow: `0 0 12px ${ARROW_COLORS[squareCircleHighlight]}`,
                        backgroundColor: `${ARROW_COLORS[squareCircleHighlight]}25`,
                      }}
                    />
                  )}

                  {/* Algebraic Rank Coordinate */}
                  {showCoordinates && fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-black font-mono select-none pointer-events-none z-15 ${
                        isLight ? theme.lightText : theme.darkText
                      }`}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Algebraic File Coordinate */}
                  {showCoordinates && rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-black font-mono select-none pointer-events-none z-15 ${
                        isLight ? theme.lightText : theme.darkText
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Chess Piece Vector Render with Spring Animations & 96-State Occupying Classes */}
                  {piece && (
                    <motion.div
                      layoutId={pieceIds[square] || `${piece.color}_${piece.type}_${square}`}
                      data-piece={piece.type.toUpperCase()}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                        mass: 0.7,
                      }}
                      draggable={!readOnly && piece.color === chess.turn()}
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, square)}
                      className={`relative w-full h-full z-20 p-0.5 sm:p-1 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                        occupyingSquare?.square === square
                          ? `piece-occupying style-${occupyingSquare.styleIndex}`
                          : ''
                      } ${
                        isSelected ? 'scale-110 -translate-y-1 drop-shadow-2xl' : 'hover:scale-105'
                      }`}
                    >
                      <ChessPiece
                        type={piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                        color={piece.color as 'w' | 'b'}
                      />
                    </motion.div>
                  )}

                  {/* 96-State Captured Piece Dissolution / Shatter / Warp Ghosts */}
                  {captureGhosts
                    .filter((g) => g.square === square)
                    .map((ghost) => (
                      <div
                        key={ghost.id}
                        data-piece={ghost.pieceType.toUpperCase()}
                        className={`piece-capturing style-${ghost.styleIndex} absolute inset-0 z-30 pointer-events-none p-0.5 sm:p-1 flex items-center justify-center`}
                      >
                        <ChessPiece
                          type={ghost.pieceType}
                          color={ghost.pieceColor}
                        />
                      </div>
                    ))}

                  {/* 96-State Real-Time Simulation Showcase Target */}
                  {simulationTarget && simulationTarget.square === square && (
                    <div
                      key={simulationTarget.id}
                      data-piece={simulationTarget.piece}
                      className={`piece-${simulationTarget.action} style-${simulationTarget.styleIndex} absolute inset-0 z-35 pointer-events-none p-0.5 sm:p-1 flex items-center justify-center`}
                    >
                      <ChessPiece
                        type={simulationTarget.piece.toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                        color={simulationTarget.color}
                      />
                    </div>
                  )}

                  {/* High-Precision Legal Move Indicators */}
                  {isLegalTarget && (
                    <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
                      {piece ? (
                        /* Capture Target Lock Ring */
                        <div className="absolute inset-1 rounded-xl border-4 border-red-500 bg-red-500/25 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.9)] flex items-center justify-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_10px_#f87171] border border-white/60" />
                        </div>
                      ) : (
                        /* Empty Square Destination Dot with Glowing Halo */
                        <div className="relative flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500/40 animate-ping absolute" />
                          <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 bg-indigo-400 rounded-full shadow-[0_0_14px_#818cf8] border-2 border-white/80" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Shockwave Rings Layer */}
          {shockwaves.map((sw) => (
            <div
              key={sw.id}
              className="absolute rounded-full pointer-events-none z-30"
              style={{
                left: `${sw.x}px`,
                top: `${sw.y}px`,
                border: `3px solid ${sw.color}`,
                color: sw.color,
                animation: `shockwaveExpand ${0.75 / (vfxSettings.animSpeed || 1)}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
              }}
            />
          ))}

          {/* Floating Evaluation Badges */}
          {floatingBadges.map((badge) => (
            <div
              key={badge.id}
              className={`absolute z-40 px-2 py-0.5 rounded-full border text-[11px] font-black pointer-events-none backdrop-blur-md shadow-2xl flex items-center gap-1 ${badge.color} ${badge.bg} ${badge.border}`}
              style={{
                left: `${badge.x}px`,
                top: `${badge.y}px`,
                animation: `badgeFloatUp ${1.0 / (vfxSettings.animSpeed || 1)}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
              }}
            >
              <span>{badge.text}</span>
            </div>
          ))}

          {/* Canvas Particles Layer */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-35"
          />

          {/* SVG Tactical Arrows Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
              <marker id="arrowhead-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#ef4444" />
              </marker>
              <marker id="arrowhead-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#f59e0b" />
              </marker>
              <marker id="arrowhead-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#3b82f6" />
              </marker>
              <marker id="arrowhead-lastmove" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill="#818cf8" />
              </marker>
            </defs>

            {/* Last Move Trajectory Line */}
            {showLastMove && lastMove && (
              <line
                x1={`${(displayedFiles.indexOf(lastMove.from[0]) + 0.5) * 12.5}%`}
                y1={`${(displayedRanks.indexOf(lastMove.from[1]) + 0.5) * 12.5}%`}
                x2={`${(displayedFiles.indexOf(lastMove.to[0]) + 0.5) * 12.5}%`}
                y2={`${(displayedRanks.indexOf(lastMove.to[1]) + 0.5) * 12.5}%`}
                stroke="#818cf8"
                strokeWidth="4"
                strokeDasharray="6 3"
                strokeOpacity="0.85"
                markerEnd="url(#arrowhead-lastmove)"
              />
            )}

            {/* User Tactical Annotation Arrows */}
            {arrows.map((arrow, idx) => {
              const x1 = (displayedFiles.indexOf(arrow.from[0]) + 0.5) * 12.5;
              const y1 = (displayedRanks.indexOf(arrow.from[1]) + 0.5) * 12.5;
              const x2 = (displayedFiles.indexOf(arrow.to[0]) + 0.5) * 12.5;
              const y2 = (displayedRanks.indexOf(arrow.to[1]) + 0.5) * 12.5;

              return (
                <line
                  key={`arrow-${idx}-${arrow.from}-${arrow.to}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={ARROW_COLORS[arrow.color]}
                  strokeWidth="5"
                  strokeOpacity="0.9"
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${arrow.color})`}
                  style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.6))` }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Helper Hint */}
      <div className="w-full text-center mt-2 flex items-center justify-center gap-2">
        <p className="text-[10px] text-white/40 font-medium">
          💡 <span className="text-white/60">Tip:</span> Cinematic VFX is <span className="text-cyan-400 font-bold">Enabled by Default</span> • Click ⚡ VFX for quick-tuning
        </p>
      </div>
    </div>
  );
};
