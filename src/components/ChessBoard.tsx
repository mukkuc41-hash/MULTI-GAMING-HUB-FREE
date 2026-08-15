import React, { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

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

  const boardRef = useRef<HTMLDivElement>(null);

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
        if (soundEnabled) {
          if (piece) soundFx.playCapture();
          else soundFx.playMove();
        }
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled) soundFx.playMove();
        return;
      }

      setSelectedSquare(null);
    } else {
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        if (soundEnabled) soundFx.playMove();
      }
    }
  };

  // Right-Click Annotation Handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      // Right-click pressed
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
        // Toggle square circle highlight
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
        // Toggle arrow
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
        const destPiece = chess.get(targetSquare);
        if (soundEnabled) {
          if (destPiece) soundFx.playCapture();
          else soundFx.playMove();
        }
        onMove(sourceSquare, targetSquare);
      }
    }
    setSelectedSquare(null);
    setDraggedSquare(null);
  };

  const theme = themeConfigs[boardTheme] || themeConfigs.emerald;
  const currentTurn = chess.turn();
  const hasAnnotations = arrows.length > 0 || Object.keys(highlightedSquares).length > 0;

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center select-none group/board">
      {/* Floating Micro-Toolbar for Board Enhancement */}
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

        {/* Board Controls */}
        <div className="flex items-center gap-1">
          {hasAnnotations && (
            <button
              onClick={clearAnnotations}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1 transition"
              title="Clear Tactical Annotations & Arrows"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear Markings</span>
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
            onClick={() => setSoundEnabled(!soundEnabled)}
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

      {/* Main Luxury Board Frame */}
      <div
        ref={boardRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{ boxShadow: `0 20px 50px -10px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.1)` }}
        className={`w-full aspect-square relative select-none p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br ${theme.outerRing} border-2 ${theme.border} transition-all duration-300`}
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

                  {/* Chess Piece Vector Render with Spring Animations */}
                  {piece && (
                    <motion.div
                      layoutId={pieceIds[square] || `${piece.color}_${piece.type}_${square}`}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                        mass: 0.7,
                      }}
                      draggable={!readOnly && piece.color === chess.turn()}
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, square)}
                      className={`relative w-full h-full z-20 p-0.5 sm:p-1 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                        isSelected ? 'scale-110 -translate-y-1 drop-shadow-2xl' : 'hover:scale-105'
                      }`}
                    >
                      <ChessPiece
                        type={piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'}
                        color={piece.color as 'w' | 'b'}
                      />
                    </motion.div>
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

          {/* SVG Tactical Arrows Overlay (Right-Click Annotations & Last Move Trail) */}
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
      <div className="w-full text-center mt-2">
        <p className="text-[10px] text-white/40 font-medium">
          💡 <span className="text-white/60">Tip:</span> Right-click &amp; drag to draw tactical arrows • Right-click square to highlight • Click to move or clear markings
        </p>
      </div>
    </div>
  );
};
