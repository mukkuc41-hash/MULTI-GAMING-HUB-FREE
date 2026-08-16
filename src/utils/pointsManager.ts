// Centralized Points, Daily Wheel, Hatrick & Random Quest Progression Engine

export interface RandomQuest {
  id: string;
  title: string;
  description: string;
  category: 'capture' | 'check' | 'castle' | 'promote' | 'win' | 'puzzle' | 'moves';
  target: number;
  current: number;
  rewardPts: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface HatrickState {
  currentCaptureStreak: number;
  targetStreak: number;
  hatricksCompletedInSession: number;
  lastHatrickTimestamp: number | null;
  recentHistory: string[];
}

const STORAGE_KEYS = {
  POINTS: 'chess_master_hub_points',
  LAST_WHEEL_SPIN: 'daily_wheel_last_spin_ts',
  RANDOM_QUESTS: 'chess_active_random_quests',
  QUESTS_DATE: 'chess_random_quests_date',
  HATRICK_STATE: 'chess_hatrick_session_state',
};

const QUEST_POOL: Omit<RandomQuest, 'id' | 'current' | 'completed' | 'claimed'>[] = [
  {
    title: 'Knight Tactician',
    description: 'Capture 2 enemy pieces using your Knights in live play',
    category: 'capture',
    target: 2,
    rewardPts: 1200,
    iconName: 'Swords',
    difficulty: 'Medium',
  },
  {
    title: 'Castling Citadel',
    description: 'Successfully execute Kingside or Queenside Castling',
    category: 'castle',
    target: 1,
    rewardPts: 800,
    iconName: 'Shield',
    difficulty: 'Easy',
  },
  {
    title: 'Royal Inquisitor',
    description: 'Deliver 3 tactical checks to the opponent king',
    category: 'check',
    target: 3,
    rewardPts: 1500,
    iconName: 'Zap',
    difficulty: 'Medium',
  },
  {
    title: 'Grandmaster Checkmate',
    description: 'Win a match by delivering checkmate against AI or player',
    category: 'win',
    target: 1,
    rewardPts: 2500,
    iconName: 'Crown',
    difficulty: 'Hard',
  },
  {
    title: 'Pawn Transformation',
    description: 'Advance and promote a pawn to Queen or Knight',
    category: 'promote',
    target: 1,
    rewardPts: 2000,
    iconName: 'Sparkles',
    difficulty: 'Hard',
  },
  {
    title: 'Endurance Tactician',
    description: 'Play 15 solid chess moves in a single match session',
    category: 'moves',
    target: 15,
    rewardPts: 1000,
    iconName: 'Flame',
    difficulty: 'Easy',
  },
  {
    title: 'Tactical Puzzle Solver',
    description: 'Complete 2 daily chess puzzles or study positions',
    category: 'puzzle',
    target: 2,
    rewardPts: 1400,
    iconName: 'BookOpen',
    difficulty: 'Medium',
  },
  {
    title: 'Rook Vanguard',
    description: 'Capture 2 pieces with your Rooks across files',
    category: 'capture',
    target: 2,
    rewardPts: 1300,
    iconName: 'Layers',
    difficulty: 'Medium',
  },
];

// Event Dispatcher for Live UI Synchronization
export function notifyPointsUpdated(newPoints: number, reason?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_points_updated', {
        detail: { points: newPoints, reason },
      })
    );
  }
}

export function notifyHatrickAchieved(rewardPts: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('chess_hatrick_achieved', {
        detail: { rewardPts, timestamp: Date.now() },
      })
    );
  }
}

export function notifyQuestUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chess_quests_updated'));
  }
}

// Points Core
export function getUserPoints(): number {
  if (typeof window === 'undefined') return 10000;
  const val = localStorage.getItem(STORAGE_KEYS.POINTS);
  if (!val) {
    localStorage.setItem(STORAGE_KEYS.POINTS, '10000');
    return 10000;
  }
  return parseInt(val, 10) || 0;
}

export function setUserPoints(pts: number, reason = 'Direct update'): void {
  if (typeof window === 'undefined') return;
  const sanitized = Math.max(0, pts);
  localStorage.setItem(STORAGE_KEYS.POINTS, sanitized.toString());
  notifyPointsUpdated(sanitized, reason);
}

export function addPoints(amount: number, reason: string): number {
  const current = getUserPoints();
  const updated = current + amount;
  setUserPoints(updated, reason);
  return updated;
}

export function spendPoints(amount: number, reason: string): boolean {
  const current = getUserPoints();
  if (current < amount) return false;
  const updated = current - amount;
  setUserPoints(updated, reason);
  return true;
}

// Daily Wheel Logic (Once every 24h, or cooldown countdown)
const DAILY_WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function checkDailyWheelStatus(): {
  canSpin: boolean;
  remainingSeconds: number;
  lastSpinTimestamp: number | null;
} {
  if (typeof window === 'undefined') return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: null };
  const raw = localStorage.getItem(STORAGE_KEYS.LAST_WHEEL_SPIN);
  if (!raw) return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: null };

  const lastSpin = parseInt(raw, 10);
  const now = Date.now();
  const elapsed = now - lastSpin;

  if (elapsed >= DAILY_WHEEL_COOLDOWN_MS) {
    return { canSpin: true, remainingSeconds: 0, lastSpinTimestamp: lastSpin };
  }

  const remainingMs = DAILY_WHEEL_COOLDOWN_MS - elapsed;
  return {
    canSpin: false,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    lastSpinTimestamp: lastSpin,
  };
}

export function recordDailyWheelSpin(rewardAmount: number): number {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_WHEEL_SPIN, Date.now().toString());
  }
  return addPoints(rewardAmount, `Daily Wheel Spin (+${rewardAmount} PTS)`);
}

// Hatrick System (3 consecutive captures/tactics in a match)
export function getHatrickState(): HatrickState {
  if (typeof window === 'undefined') {
    return {
      currentCaptureStreak: 0,
      targetStreak: 3,
      hatricksCompletedInSession: 0,
      lastHatrickTimestamp: null,
      recentHistory: [],
    };
  }

  const raw = localStorage.getItem(STORAGE_KEYS.HATRICK_STATE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const defaultState: HatrickState = {
    currentCaptureStreak: 0,
    targetStreak: 3,
    hatricksCompletedInSession: 0,
    lastHatrickTimestamp: null,
    recentHistory: [],
  };
  return defaultState;
}

export function saveHatrickState(state: HatrickState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HATRICK_STATE, JSON.stringify(state));
  }
}

export function resetHatrickStreak() {
  const current = getHatrickState();
  current.currentCaptureStreak = 0;
  saveHatrickState(current);
  notifyQuestUpdated();
}

export function recordPlayerCaptureForHatrick(pieceName: string): {
  hatrickAchieved: boolean;
  currentStreak: number;
  rewardPts: number;
} {
  const state = getHatrickState();
  state.currentCaptureStreak += 1;
  state.recentHistory.push(`${pieceName} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);

  if (state.recentHistory.length > 10) state.recentHistory.shift();

  let hatrickAchieved = false;
  const rewardPts = 2000;

  if (state.currentCaptureStreak >= state.targetStreak) {
    hatrickAchieved = true;
    state.currentCaptureStreak = 0; // reset for next hatrick
    state.hatricksCompletedInSession += 1;
    state.lastHatrickTimestamp = Date.now();
    saveHatrickState(state);

    // Award +2,000 PTS
    addPoints(rewardPts, 'Simultaneous Hatrick in Match (+2,000 PTS)');
    notifyHatrickAchieved(rewardPts);
    return { hatrickAchieved: true, currentStreak: 3, rewardPts };
  }

  saveHatrickState(state);
  notifyQuestUpdated();
  return { hatrickAchieved: false, currentStreak: state.currentCaptureStreak, rewardPts: 0 };
}

// Random Quests Generator & Manager
export function getActiveRandomQuests(): RandomQuest[] {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(STORAGE_KEYS.RANDOM_QUESTS);
  const todayStr = new Date().toISOString().split('T')[0];
  const storedDate = localStorage.getItem(STORAGE_KEYS.QUESTS_DATE);

  if (raw && storedDate === todayStr) {
    try {
      return JSON.parse(raw);
    } catch {
      // re-generate
    }
  }

  // Generate 3 fresh random quests
  return generateRandomQuests();
}

export function generateRandomQuests(): RandomQuest[] {
  // Pick 3 unique random quests from the pool
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map((template, idx) => ({
    ...template,
    id: `quest_${Date.now()}_${idx}`,
    current: 0,
    completed: false,
    claimed: false,
  }));

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(selected));
    localStorage.setItem(STORAGE_KEYS.QUESTS_DATE, new Date().toISOString().split('T')[0]);
  }

  notifyQuestUpdated();
  return selected;
}

export function updateQuestProgress(
  category: RandomQuest['category'],
  amount = 1
): { questCompleted: boolean; completedQuestTitle?: string } {
  const quests = getActiveRandomQuests();
  let anyCompleted = false;
  let completedTitle = '';

  const updated = quests.map((q) => {
    if (q.category === category && !q.completed) {
      const nextVal = Math.min(q.target, q.current + amount);
      const isNowDone = nextVal >= q.target;
      if (isNowDone) {
        anyCompleted = true;
        completedTitle = q.title;
      }
      return {
        ...q,
        current: nextVal,
        completed: isNowDone,
      };
    }
    return q;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(updated));
  }

  notifyQuestUpdated();
  return { questCompleted: anyCompleted, completedQuestTitle: completedTitle };
}

export function claimQuestReward(questId: string): number {
  const quests = getActiveRandomQuests();
  let reward = 0;

  const updated = quests.map((q) => {
    if (q.id === questId && q.completed && !q.claimed) {
      reward = q.rewardPts;
      return { ...q, claimed: true };
    }
    return q;
  });

  if (reward > 0) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.RANDOM_QUESTS, JSON.stringify(updated));
    }
    addPoints(reward, `Completed Quest Reward (+${reward} PTS)`);
    notifyQuestUpdated();
  }

  return reward;
}
