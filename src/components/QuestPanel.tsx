import React, { useState } from 'react';
import { Award, Flame, CheckCircle2, ShieldAlert, Sparkles, Gift, Star, Medal, ChevronRight } from 'lucide-react';

interface QuestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userXp?: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
}

const SAMPLE_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Voice Communicator',
    description: 'Use voice chat or voice dictation in a multiplayer room',
    rewardXp: 250,
    progress: 1,
    maxProgress: 1,
    completed: true,
    claimed: false,
  },
  {
    id: 'q2',
    title: 'Board Champion',
    description: 'Win 3 games across Chess, Connect Four, or Checkers',
    rewardXp: 500,
    progress: 2,
    maxProgress: 3,
    completed: false,
    claimed: false,
  },
  {
    id: 'q3',
    title: 'Social Sharer',
    description: 'Share your progress card or match result with a friend',
    rewardXp: 300,
    progress: 1,
    maxProgress: 1,
    completed: true,
    claimed: true,
  },
  {
    id: 'q4',
    title: 'Tactical Mind',
    description: 'Request a hint from GM Mikhail AI Coach',
    rewardXp: 200,
    progress: 0,
    maxProgress: 1,
    completed: false,
    claimed: false,
  },
];

export const QuestPanel: React.FC<QuestPanelProps> = ({
  isOpen,
  onClose,
  userXp = 1450,
}) => {
  const [quests, setQuests] = useState<Quest[]>(SAMPLE_QUESTS);
  const [xp, setXp] = useState<number>(userXp);

  if (!isOpen) return null;

  const currentLevel = Math.floor(xp / 1000) + 1;
  const xpInCurrentLevel = xp % 1000;

  const claimReward = (questId: string, rewardAmount: number) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );
    setXp((prev) => prev + rewardAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Daily Quests &amp; Rank Progression</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                  Season 4
                </span>
              </h2>
              <p className="text-xs text-indigo-200/60">Complete daily objectives to level up &amp; unlock titles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="p-5 bg-white/5 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>Level {currentLevel} Grandmaster Candidate</span>
            </span>
            <span className="text-indigo-200/70">{xpInCurrentLevel} / 1000 XP</span>
          </div>

          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${(xpInCurrentLevel / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* Quests List */}
        <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                quest.completed
                  ? 'bg-emerald-950/20 border-emerald-400/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{quest.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                    +{quest.rewardXp} XP
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70">{quest.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-indigo-300/60 pt-1">
                  <span>Progress: {quest.progress}/{quest.maxProgress}</span>
                </div>
              </div>

              <div>
                {quest.claimed ? (
                  <span className="px-3 py-1.5 rounded-xl bg-gray-500/20 border border-gray-400/30 text-gray-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>Claimed</span>
                  </span>
                ) : quest.completed ? (
                  <button
                    onClick={() => claimReward(quest.id, quest.rewardXp)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 border border-emerald-400/40 animate-bounce"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Claim Reward</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-semibold">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
