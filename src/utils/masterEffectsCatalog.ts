import { getUserPoints, spendPoints } from './pointsManager';
import { playCinematicSound } from './cinematicVfx';

export type MasterPieceType = 'Pawn' | 'Knight' | 'Bishop' | 'Rook' | 'Queen' | 'King';
export type MasterCategoryType =
  | 'Capture Animation'
  | 'Occupying Animation'
  | 'Capture Effect'
  | 'Occupying Effect';

export interface CatalogItem {
  id: string;
  piece: MasterPieceType;
  pieceCode: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
  category: MasterCategoryType;
  variantIndex: number;
  name: string;
  desc: string;
  glowColor: string;
  secondaryColor: string;
  badgeType: 'red' | 'blue' | 'gold' | 'purple' | 'green' | 'cyan';
  animClass: string;
  price: number;
}

export const PIECES: { name: MasterPieceType; code: 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'; symbol: string }[] = [
  { name: 'Pawn', code: 'P', symbol: '♟' },
  { name: 'Knight', code: 'N', symbol: '♞' },
  { name: 'Bishop', code: 'B', symbol: '♝' },
  { name: 'Rook', code: 'R', symbol: '♜' },
  { name: 'Queen', code: 'Q', symbol: '♛' },
  { name: 'King', code: 'K', symbol: '♚' },
];

export const CATEGORIES: { cat: MasterCategoryType; prefix: string; type: 'anim' | 'fx' }[] = [
  { cat: 'Capture Animation', prefix: 'cap-anim', type: 'anim' },
  { cat: 'Occupying Animation', prefix: 'occ-anim', type: 'anim' },
  { cat: 'Capture Effect', prefix: 'cap-fx', type: 'fx' },
  { cat: 'Occupying Effect', prefix: 'occ-fx', type: 'fx' },
];

const COLOR_MAPPING: Record<string, { primary: string; secondary: string; badge: 'red' | 'blue' | 'gold' | 'purple' | 'green' | 'cyan' }> = {
  'Pawn-1': { primary: '#ef4444', secondary: '#f97316', badge: 'red' },
  'Pawn-2': { primary: '#06b6d4', secondary: '#3b82f6', badge: 'cyan' },
  'Pawn-3': { primary: '#eab308', secondary: '#f59e0b', badge: 'gold' },
  'Pawn-4': { primary: '#10b981', secondary: '#059669', badge: 'green' },

  'Knight-1': { primary: '#f59e0b', secondary: '#d97706', badge: 'gold' },
  'Knight-2': { primary: '#00d2ff', secondary: '#3b82f6', badge: 'blue' },
  'Knight-3': { primary: '#a855f7', secondary: '#9333ea', badge: 'purple' },
  'Knight-4': { primary: '#ec4899', secondary: '#f43f5e', badge: 'red' },

  'Bishop-1': { primary: '#a855f7', secondary: '#6366f1', badge: 'purple' },
  'Bishop-2': { primary: '#06b6d4', secondary: '#0284c7', badge: 'cyan' },
  'Bishop-3': { primary: '#f1c40f', secondary: '#e67e22', badge: 'gold' },
  'Bishop-4': { primary: '#10b981', secondary: '#14b8a6', badge: 'green' },

  'Rook-1': { primary: '#3b82f6', secondary: '#1d4ed8', badge: 'blue' },
  'Rook-2': { primary: '#ef4444', secondary: '#dc2626', badge: 'red' },
  'Rook-3': { primary: '#f97316', secondary: '#ea580c', badge: 'gold' },
  'Rook-4': { primary: '#c084fc', secondary: '#9333ea', badge: 'purple' },

  'Queen-1': { primary: '#f43f5e', secondary: '#e11d48', badge: 'red' },
  'Queen-2': { primary: '#38bdf8', secondary: '#0284c7', badge: 'cyan' },
  'Queen-3': { primary: '#facc15', secondary: '#eab308', badge: 'gold' },
  'Queen-4': { primary: '#d946ef', secondary: '#a21caf', badge: 'purple' },

  'King-1': { primary: '#38bdf8', secondary: '#0369a1', badge: 'cyan' },
  'King-2': { primary: '#00d2ff', secondary: '#2563eb', badge: 'blue' },
  'King-3': { primary: '#fbbf24', secondary: '#d97706', badge: 'gold' },
  'King-4': { primary: '#c084fc', secondary: '#7e22ce', badge: 'purple' },
};

// Master 96 Catalog
export const MASTER_96_CATALOG: CatalogItem[] = (() => {
  const catalog: CatalogItem[] = [];
  let counter = 1;

  PIECES.forEach((p) => {
    CATEGORIES.forEach((t) => {
      for (let i = 1; i <= 4; i++) {
        const key = `${p.name}-${i}`;
        const theme = COLOR_MAPPING[key] || { primary: '#38bdf8', secondary: '#6366f1', badge: 'blue' };

        let animClass = '';
        if (t.cat === 'Capture Animation') {
          animClass = ['anim-core-dissolve', 'anim-core-spin-out', 'anim-core-shatter', 'anim-core-portal-out'][i - 1];
        } else if (t.cat === 'Occupying Animation') {
          animClass = ['anim-core-emerge', 'anim-core-spin-in', 'anim-core-assemble', 'anim-core-portal-in'][i - 1];
        } else {
          animClass = `style-${i}`;
        }

        const descriptions = [
          `Level 1 kinetic sequence featuring high-precision motion curves and soft perimeter resonance for ${p.name}.`,
          `Level 2 high-torque vortex burst with chromatic prism filtration tailored for the ${p.name} element.`,
          `Level 3 hyper-saturated kinetic strike with shattered particle impulse physics for ${p.name}.`,
          `Level 4 sovereign stellar gate singularity with luminescent aura beam projection for ${p.name}.`,
        ];

        catalog.push({
          id: `item-${counter++}`,
          piece: p.name,
          pieceCode: p.code,
          category: t.cat,
          variantIndex: i,
          name: `${p.name} ${t.cat.includes('Capture') ? 'Capture' : 'Occupy'} #${i}`,
          desc: descriptions[i - 1],
          glowColor: theme.primary,
          secondaryColor: theme.secondary,
          badgeType: theme.badge,
          animClass: animClass,
          price: 1000,
        });
      }
    });
  });

  return catalog;
})();

const STORAGE_INVENTORY_KEY = 'chess_master_hub_inventory';
const STORAGE_EQUIPPED_KEY = 'chess_master_hub_equipped';

export function getMasterInventory(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getEquippedMasterEffects(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_EQUIPPED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Convert chess piece type (p, n, b, r, q, k or P, N, B, R, Q, K) to MasterPieceType
export function normalizePieceName(pieceTypeOrCode: string): MasterPieceType {
  const code = pieceTypeOrCode.toLowerCase();
  switch (code) {
    case 'p': return 'Pawn';
    case 'n': return 'Knight';
    case 'b': return 'Bishop';
    case 'r': return 'Rook';
    case 'q': return 'Queen';
    case 'k': return 'King';
    default: return 'Pawn';
  }
}

/**
 * ONLY return a CatalogItem if:
 * 1. An item is assigned in the equipped slot for this piece
 * 2. AND the item is purchased / owned in user inventory
 * Otherwise returns null (no animation/effect applies).
 */
export function getEquippedItemForPiece(pieceTypeOrCode: string): CatalogItem | null {
  const pieceName = normalizePieceName(pieceTypeOrCode);
  const equipped = getEquippedMasterEffects();
  const itemId = equipped[pieceName];
  if (!itemId) return null;

  const inventory = getMasterInventory();
  if (!inventory[itemId]) {
    // Not purchased/owned - cannot be applied
    return null;
  }

  const found = MASTER_96_CATALOG.find((item) => item.id === itemId);
  return found || null;
}

export function notifyEquippedEffectsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chess_equipped_effects_updated'));
  }
}
