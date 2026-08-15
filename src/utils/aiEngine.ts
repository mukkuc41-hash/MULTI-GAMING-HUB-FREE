import { Chess, Square } from 'chess.js';
import { AIDifficulty } from '../types';
import { shouldInjectError, getSearchDepth } from './masterAIEngine';

// Piece value table for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000,
};

// Simple positional bonuses
const PAWN_CENTER_BONUS: Record<string, number> = {
  e4: 3,
  d4: 3,
  e5: 3,
  d5: 3,
  c4: 2,
  f4: 2,
  c5: 2,
  f5: 2,
};

function evaluateBoard(chess: Chess, aiColor: 'w' | 'b'): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        const centerBonus = PAWN_CENTER_BONUS[piece.square as Square] || 0;
        const total = val + centerBonus;

        if (piece.color === aiColor) {
          score += total;
        } else {
          score -= total;
        }
      }
    }
  }

  // Check and checkmate modifiers
  if (chess.isCheckmate()) {
    if (chess.turn() === aiColor) {
      score -= 9999;
    } else {
      score += 9999;
    }
  } else if (chess.isCheck()) {
    if (chess.turn() === aiColor) {
      score -= 5;
    } else {
      score += 5;
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: 'w' | 'b'
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, aiColor);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, aiColor);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, aiColor);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getNumericalDifficulty(difficulty: AIDifficulty = 'medium'): number {
  if (typeof difficulty === 'number') {
    return Math.max(1, Math.min(8, difficulty));
  }
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 4;
    case 'hard':
      return 6;
    case 'master':
      return 8;
    default:
      return 4;
  }
}

export function getAIMove(
  chess: Chess,
  difficulty: AIDifficulty = 'medium'
): { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } | null {
  const possibleMoves = chess.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  const aiColor = chess.turn();
  const level = getNumericalDifficulty(difficulty);

  // 1. Calculate Error Injection Rate using Master Architecture v3.0.0
  if (shouldInjectError('chess', level)) {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const randomMove = possibleMoves[randomIndex];
    return {
      from: randomMove.from as Square,
      to: randomMove.to as Square,
      promotion: (randomMove.promotion as any) || 'q',
    };
  }

  // 2. Search depth scaling based on 8 tiers (Client thread optimized max depth)
  const masterDepth = getSearchDepth('chess', level);
  const searchDepth = Math.min(masterDepth, 4);

  let bestMove = possibleMoves[0];
  let bestScore = -Infinity;

  // Shuffle moves slightly to introduce variance among equal moves
  const shuffledMoves = [...possibleMoves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    chess.move(move);
    const score = minimax(chess, searchDepth - 1, -Infinity, Infinity, false, aiColor);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    from: bestMove.from as Square,
    to: bestMove.to as Square,
    promotion: (bestMove.promotion as any) || 'q',
  };
}
