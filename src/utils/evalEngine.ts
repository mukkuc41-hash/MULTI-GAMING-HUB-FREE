import { Chess } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3.25,
  r: 5,
  q: 9,
  k: 0,
};

// Simple positional piece-square bonuses
const PAWN_BONUS = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_BONUS = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

export interface EvalResult {
  score: number; // positive = White advantage, negative = Black advantage
  label: string; // e.g. "+1.5", "-0.8", "0.0", "M2"
  whitePercentage: number; // 0 to 100 for height bar
}

export function evaluateBoard(chess: Chess): EvalResult {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return {
      score: winner === 'w' ? 99 : -99,
      label: winner === 'w' ? 'M1' : '-M1',
      whitePercentage: winner === 'w' ? 100 : 0,
    };
  }

  if (chess.isDraw() || chess.isStalemate()) {
    return { score: 0, label: '0.0', whitePercentage: 50 };
  }

  const board = chess.board();
  let whiteScore = 0;
  let blackScore = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type] || 0;
      let posBonus = 0;

      if (piece.type === 'p') {
        posBonus = (piece.color === 'w' ? PAWN_BONUS[r][c] : PAWN_BONUS[7 - r][c]) / 100;
      } else if (piece.type === 'n') {
        posBonus = (piece.color === 'w' ? KNIGHT_BONUS[r][c] : KNIGHT_BONUS[7 - r][c]) / 100;
      }

      const totalVal = baseVal + posBonus;

      if (piece.color === 'w') {
        whiteScore += totalVal;
      } else {
        blackScore += totalVal;
      }
    }
  }

  const diff = Math.round((whiteScore - blackScore) * 10) / 10;
  const label = diff > 0 ? `+${diff.toFixed(1)}` : diff === 0 ? '0.0' : `${diff.toFixed(1)}`;

  // Convert evaluation score to percentage using sigmoid curve for smooth visual bar
  // 0 -> 50%, +5 -> ~85%, -5 -> ~15%
  const winProbability = 1 / (1 + Math.pow(10, -diff / 4));
  const whitePercentage = Math.min(95, Math.max(5, Math.round(winProbability * 100)));

  return {
    score: diff,
    label,
    whitePercentage,
  };
}
