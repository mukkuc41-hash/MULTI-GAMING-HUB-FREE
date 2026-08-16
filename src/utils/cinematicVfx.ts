/**
 * Cinematic VFX & Animation Engine for Main Chess and Showcase
 * Handles piece-specific physics, particle explosions, shockwaves,
 * screen shake, evaluation badges, and synthesized Web Audio sound fx.
 */

export type MoveQuality = 'brilliant' | 'great' | 'best' | 'blunder' | 'checkmate' | 'check' | 'capture' | 'standard';

export interface VfxSettings {
  enabled: boolean;
  animSpeed: number; // 0.5, 1, 1.5, 2
  particleDensity: number; // 12 to 72
  screenShake: boolean;
  soundEnabled: boolean;
  vfxTheme: 'cyber' | 'royal' | 'inferno' | 'emerald';
  floatingBadges: boolean;
  piecePhysics: boolean;
  animStyleMode: 'dynamic' | 1 | 2 | 3 | 4;
}

const DEFAULT_VFX_SETTINGS: VfxSettings = {
  enabled: false,
  animSpeed: 1,
  particleDensity: 36,
  screenShake: false,
  soundEnabled: true,
  vfxTheme: 'cyber',
  floatingBadges: false,
  piecePhysics: false,
  animStyleMode: 'dynamic',
};

const STORAGE_KEY = 'chess_cinematic_vfx_settings';

export function loadVfxSettings(): VfxSettings {
  if (typeof window === 'undefined') return DEFAULT_VFX_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VFX_SETTINGS;
    return { ...DEFAULT_VFX_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VFX_SETTINGS;
  }
}

export function saveVfxSettings(settings: Partial<VfxSettings>): VfxSettings {
  const current = loadVfxSettings();
  const next = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('chess_vfx_settings_updated', { detail: next }));
    } catch {}
  }
  return next;
}

// Web Audio Synthesizer for high-energy cinematic sound fx
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playCinematicSound(type: 'move' | 'capture' | 'brilliant' | 'blunder' | 'checkmate' | 'check' | 'leap' | 'whoosh') {
  const settings = loadVfxSettings();
  if (!settings.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'leap') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'capture') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'brilliant') {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.55);
      osc2.stop(now + 0.65);
    } else if (type === 'checkmate') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, now); // C3
      osc.frequency.setValueAtTime(196.0, now + 0.15); // G3
      osc.frequency.setValueAtTime(261.63, now + 0.3); // C4
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (type === 'check') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'blunder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {}
}

export interface VfxParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'diamond';
}

export function getThemeColors(theme: 'cyber' | 'royal' | 'inferno' | 'emerald'): string[] {
  switch (theme) {
    case 'royal':
      return ['#ffd700', '#f59e0b', '#fbbf24', '#ffffff', '#eab308'];
    case 'inferno':
      return ['#ff4b1f', '#ff9068', '#ef4444', '#f97316', '#ffedd5'];
    case 'emerald':
      return ['#00ffd5', '#10b981', '#34d399', '#059669', '#a7f3d0'];
    case 'cyber':
    default:
      return ['#00f2fe', '#4facfe', '#00ffd5', '#38ef7d', '#ffffff'];
  }
}

export type PieceElementCode = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type PieceActionType = 'capturing' | 'occupying';

export interface VariationSpec {
  id: string;
  piece: PieceElementCode;
  pieceName: string;
  action: PieceActionType;
  styleIndex: 1 | 2 | 3 | 4;
  animationName: string;
  effectFilter: string;
  speed: string;
  description: string;
  colorAccent: string;
}

// 96 Unique Variations Matrix (48 Capturing + 48 Occupying across 6 Pieces)
export const VARIATIONS_96_MATRIX: VariationSpec[] = [
  // --- PAWN (P) ---
  {
    id: 'P_cap_1',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-dissolve',
    effectFilter: 'drop-shadow(0 0 2px #888)',
    speed: '0.5s',
    description: 'Pawn Dissolve Void Capture with soft perimeter shadow',
    colorAccent: '#94a3b8',
  },
  {
    id: 'P_occ_1',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-emerge',
    effectFilter: 'drop-shadow(0 0 2px #888)',
    speed: '0.5s',
    description: 'Pawn Core Emerge with steady foothold baseline',
    colorAccent: '#94a3b8',
  },
  {
    id: 'P_cap_2',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-spin-out',
    effectFilter: 'hue-rotate(45deg)',
    speed: '0.5s',
    description: 'Pawn 720° Spin Vortex Dissipation with chromatic shift',
    colorAccent: '#38bdf8',
  },
  {
    id: 'P_occ_2',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-spin-in',
    effectFilter: 'hue-rotate(45deg)',
    speed: '0.5s',
    description: 'Pawn Reverse 720° Gyroscopic Drop-in',
    colorAccent: '#38bdf8',
  },
  {
    id: 'P_cap_3',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-shatter',
    effectFilter: 'saturate(2)',
    speed: '0.5s',
    description: 'Pawn Hyper-Saturated Shatter Strike',
    colorAccent: '#f59e0b',
  },
  {
    id: 'P_occ_3',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-assemble',
    effectFilter: 'saturate(2)',
    speed: '0.5s',
    description: 'Pawn High-Impact Kinetic Reassembly',
    colorAccent: '#f59e0b',
  },
  {
    id: 'P_cap_4',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: #ccc (Portal Beam)',
    speed: '0.5s',
    description: 'Pawn Silver Warp Singularity Collapse',
    colorAccent: '#e2e8f0',
  },
  {
    id: 'P_occ_4',
    piece: 'P',
    pieceName: 'Pawn',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: #ccc (Portal Beam)',
    speed: '0.5s',
    description: 'Pawn Dimensional Flare Manifestation',
    colorAccent: '#e2e8f0',
  },

  // --- KNIGHT (N) ---
  {
    id: 'N_cap_1',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-spin-out',
    effectFilter: 'drop-shadow(0 0 6px #ff4444)',
    speed: '0.5s',
    description: 'Knight Crimson Spin-Cleave Annihilation',
    colorAccent: '#ef4444',
  },
  {
    id: 'N_occ_1',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-spin-in',
    effectFilter: 'drop-shadow(0 0 6px #44ff44)',
    speed: '0.5s',
    description: 'Knight Emerald Gyro Landing with radiant bounce',
    colorAccent: '#22c55e',
  },
  {
    id: 'N_cap_2',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-shatter',
    effectFilter: 'contrast(150%)',
    speed: '0.5s',
    description: 'Knight High-Contrast Kinetic Shock Shatter',
    colorAccent: '#a855f7',
  },
  {
    id: 'N_occ_2',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-assemble',
    effectFilter: 'contrast(150%)',
    speed: '0.5s',
    description: 'Knight 3D Parabolic Leap Descend & Assembly',
    colorAccent: '#a855f7',
  },
  {
    id: 'N_cap_3',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: #ff9933',
    speed: '0.5s',
    description: 'Knight Solar Flame Warp Discharge',
    colorAccent: '#f97316',
  },
  {
    id: 'N_occ_3',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: #ff9933',
    speed: '0.5s',
    description: 'Knight Amber Rift Touchdown',
    colorAccent: '#f97316',
  },
  {
    id: 'N_cap_4',
    piece: 'N',
    pieceName: 'Knight',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-dissolve',
    effectFilter: 'transform-origin: top left',
    speed: '0.5s',
    description: 'Knight Flank Sweep Diagonal Dissolve',
    colorAccent: '#06b6d4',
  },
  {
    id: 'N_occ_4',
    piece: 'N',
    pieceName: 'Knight',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-emerge',
    effectFilter: 'transform-origin: top left',
    speed: '0.5s',
    description: 'Knight Angular Corner Emergence',
    colorAccent: '#06b6d4',
  },

  // --- BISHOP (B) ---
  {
    id: 'B_cap_1',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: #33b5e5',
    speed: '0.5s',
    description: 'Bishop Cerulean Celestial Gate Disintegration',
    colorAccent: '#0284c7',
  },
  {
    id: 'B_occ_1',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: #33b5e5',
    speed: '0.5s',
    description: 'Bishop Azure Prism Diagonal Teleportation',
    colorAccent: '#0284c7',
  },
  {
    id: 'B_cap_2',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-shatter',
    effectFilter: 'brightness(1.2) sepia(0.5)',
    speed: '0.5s',
    description: 'Bishop Ancient Sanctum Glinting Shatter',
    colorAccent: '#d97706',
  },
  {
    id: 'B_occ_2',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-assemble',
    effectFilter: 'brightness(1.2) sepia(0.5)',
    speed: '0.5s',
    description: 'Bishop Golden Relic Drop Reconstitution',
    colorAccent: '#d97706',
  },
  {
    id: 'B_cap_3',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-dissolve',
    effectFilter: 'filter: blur(1px)',
    speed: '0.5s',
    description: 'Bishop Phantom Mirage Dissolution',
    colorAccent: '#8b5cf6',
  },
  {
    id: 'B_occ_3',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-emerge',
    effectFilter: 'filter: blur(1px)',
    speed: '0.5s',
    description: 'Bishop Ether Focus Condensation',
    colorAccent: '#8b5cf6',
  },
  {
    id: 'B_cap_4',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-spin-out',
    effectFilter: 'transform: skew(10deg)',
    speed: '0.5s',
    description: 'Bishop Skewed Angular Razor Vortex',
    colorAccent: '#ec4899',
  },
  {
    id: 'B_occ_4',
    piece: 'B',
    pieceName: 'Bishop',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-spin-in',
    effectFilter: 'transform: skew(10deg)',
    speed: '0.5s',
    description: 'Bishop Precision Diagonal Laser Lock',
    colorAccent: '#ec4899',
  },

  // --- ROOK (R) ---
  {
    id: 'R_cap_1',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-shatter',
    effectFilter: 'drop-shadow(0 0 8px #ff0000)',
    speed: '0.5s',
    description: 'Rook Fortress Siege Heavy Tremor Shatter',
    colorAccent: '#dc2626',
  },
  {
    id: 'R_occ_1',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-assemble',
    effectFilter: 'drop-shadow(0 0 8px #00ffff)',
    speed: '0.5s',
    description: 'Rook Cyan Fortress Bastion Solidification',
    colorAccent: '#06b6d4',
  },
  {
    id: 'R_cap_2',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-dissolve',
    effectFilter: 'invert(0.2)',
    speed: '0.5s',
    description: 'Rook Heavy Obsidian Phase Dissolve',
    colorAccent: '#64748b',
  },
  {
    id: 'R_occ_2',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-emerge',
    effectFilter: 'invert(0.2)',
    speed: '0.5s',
    description: 'Rook Monolithic Heavy Inversion Lock',
    colorAccent: '#64748b',
  },
  {
    id: 'R_cap_3',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-spin-out',
    effectFilter: '--cap-speed: 0.4s',
    speed: '0.4s',
    description: 'Rook High-Torque Battering Spin Overdrive',
    colorAccent: '#e11d48',
  },
  {
    id: 'R_occ_3',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-spin-in',
    effectFilter: '--occ-speed: 0.4s',
    speed: '0.4s',
    description: 'Rook Rapid Torque Kinetic Impact Anchor',
    colorAccent: '#e11d48',
  },
  {
    id: 'R_cap_4',
    piece: 'R',
    pieceName: 'Rook',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: #aa66cc',
    speed: '0.5s',
    description: 'Rook Royal Amethyst Dimensional Breach',
    colorAccent: '#9333ea',
  },
  {
    id: 'R_occ_4',
    piece: 'R',
    pieceName: 'Rook',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: #aa66cc',
    speed: '0.5s',
    description: 'Rook Purple Star Fortress Manifestation',
    colorAccent: '#9333ea',
  },

  // --- QUEEN (Q) ---
  {
    id: 'Q_cap_1',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: #ff00ff; --cap-speed: 0.7s',
    speed: '0.7s',
    description: 'Queen Imperial Magenta Supernova Annihilation',
    colorAccent: '#d946ef',
  },
  {
    id: 'Q_occ_1',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: #ff00ff; --occ-speed: 0.7s',
    speed: '0.7s',
    description: 'Queen Monarch Warp Rift Sovereign Entrance',
    colorAccent: '#d946ef',
  },
  {
    id: 'Q_cap_2',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-spin-out',
    effectFilter: 'drop-shadow(0 0 12px gold)',
    speed: '0.5s',
    description: 'Queen Golden Astral Cyclone Destruction',
    colorAccent: '#eab308',
  },
  {
    id: 'Q_occ_2',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-spin-in',
    effectFilter: 'drop-shadow(0 0 12px gold)',
    speed: '0.5s',
    description: 'Queen Radiance Halo Crown Descent',
    colorAccent: '#eab308',
  },
  {
    id: 'Q_cap_3',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-shatter',
    effectFilter: 'brightness(1.5)',
    speed: '0.5s',
    description: 'Queen Hyper-Luminescent Diamond Shatter Blast',
    colorAccent: '#38bdf8',
  },
  {
    id: 'Q_occ_3',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-assemble',
    effectFilter: 'brightness(1.5)',
    speed: '0.5s',
    description: 'Queen Prismatic Sovereign Reconstitution',
    colorAccent: '#38bdf8',
  },
  {
    id: 'Q_cap_4',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-dissolve',
    effectFilter: 'transform: scale(1.2)',
    speed: '0.5s',
    description: 'Queen Oversized Astral Eclipse Dissolution',
    colorAccent: '#a855f7',
  },
  {
    id: 'Q_occ_4',
    piece: 'Q',
    pieceName: 'Queen',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-emerge',
    effectFilter: 'transform: scale(1.2)',
    speed: '0.5s',
    description: 'Queen Dominant Throne Imperial Ascension',
    colorAccent: '#a855f7',
  },

  // --- KING (K) ---
  {
    id: 'K_cap_1',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 1,
    animationName: 'anim-core-shatter',
    effectFilter: 'drop-shadow(0 0 15px #ffD700); --cap-speed: 0.8s',
    speed: '0.8s',
    description: 'King Royal Gold Checkmate Seismic Cleave',
    colorAccent: '#ffd700',
  },
  {
    id: 'K_occ_1',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 1,
    animationName: 'anim-core-assemble',
    effectFilter: 'drop-shadow(0 0 15px #ffD700); --occ-speed: 0.8s',
    speed: '0.8s',
    description: 'King Holy Crown Coronation Solidification',
    colorAccent: '#ffd700',
  },
  {
    id: 'K_cap_2',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 2,
    animationName: 'anim-core-portal-out',
    effectFilter: '--fx-primary: gold',
    speed: '0.5s',
    description: 'King Solar Gold Dynasty Warp Erasure',
    colorAccent: '#f59e0b',
  },
  {
    id: 'K_occ_2',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 2,
    animationName: 'anim-core-portal-in',
    effectFilter: '--fx-primary: gold',
    speed: '0.5s',
    description: 'King Sovereign Gate Gold Portal Entrance',
    colorAccent: '#f59e0b',
  },
  {
    id: 'K_cap_3',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 3,
    animationName: 'anim-core-spin-out',
    effectFilter: 'contrast(200%)',
    speed: '0.5s',
    description: 'King High-Contrast Cosmic Spin Collapse',
    colorAccent: '#ef4444',
  },
  {
    id: 'K_occ_3',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 3,
    animationName: 'anim-core-spin-in',
    effectFilter: 'contrast(200%)',
    speed: '0.5s',
    description: 'King Divine Throne Polar Gyro Descent',
    colorAccent: '#ef4444',
  },
  {
    id: 'K_cap_4',
    piece: 'K',
    pieceName: 'King',
    action: 'capturing',
    styleIndex: 4,
    animationName: 'anim-core-dissolve',
    effectFilter: 'filter: sepia(1)',
    speed: '0.5s',
    description: 'King Historical Parchment Sepia Fade',
    colorAccent: '#b45309',
  },
  {
    id: 'K_occ_4',
    piece: 'K',
    pieceName: 'King',
    action: 'occupying',
    styleIndex: 4,
    animationName: 'anim-core-emerge',
    effectFilter: 'filter: sepia(1)',
    speed: '0.5s',
    description: 'King Ancient Sovereign Emergence',
    colorAccent: '#b45309',
  },
];

/**
 * Resolves the CSS classes and attributes to trigger any variation dynamically
 */
export function getVariationCSS(
  piece: string,
  action: 'capturing' | 'occupying',
  styleIndex: 1 | 2 | 3 | 4
): { dataPiece: string; className: string } {
  const pCode = piece.toUpperCase() as PieceElementCode;
  return {
    dataPiece: pCode,
    className: `piece-${action} style-${styleIndex}`,
  };
}

