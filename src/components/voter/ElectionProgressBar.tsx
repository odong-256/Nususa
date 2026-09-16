import React from 'react';
import { Election } from '../../types';
import { CheckCircle2, TrendingUp, Users, Vote, ShieldCheck, Flag } from 'lucide-react';

interface ElectionProgressBarProps {
  election: Election;
  totalEligibleVoters: number;
  hasVoted?: boolean;
}

export const ElectionProgressBar: React.FC<ElectionProgressBarProps> = ({
  election,
  totalEligibleVoters,
  hasVoted = false
}) => {
  const votesCast = election.totalVotesCount || 0;
  const eligibleCount = Math.max(totalEligibleVoters, votesCast, 1);
  const percentage = Math.min(100, Math.round((votesCast / eligibleCount) * 1000) / 10);
  const remaining = Math.max(0, eligibleCount - votesCast);
  const quorumTarget = Math.ceil(eligibleCount * 0.5);
  const quorumReached = votesCast >= quorumTarget;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Official Election Completion & Turnout
            </h3>
            {quorumReached && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Quorum Reached
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Real-time aggregate tally of cast ballots against approved Soroti University student voter rolls.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {percentage}%
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2">
        <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          {/* Quorum Marker at 50% */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 opacity-70"
            style={{ left: '50%' }}
            title="50% Constitutional Quorum Mark"
          />

          {/* Animated Fill Bar */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-1000 ease-out shadow-xs relative"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Marker labels */}
        <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
          <span>0%</span>
          <span className="text-slate-500 font-bold flex items-center gap-0.5">
            <Flag className="w-3 h-3 text-amber-500" /> 50% Quorum Target ({quorumTarget} votes)
          </span>
          <span>100% Full Roll ({eligibleCount})</span>
        </div>
      </div>

      {/* Numerical Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Ballots Cast
          </span>
          <span className="text-lg font-black text-slate-900 font-mono">
            {votesCast}
          </span>
          <span className="text-[10px] text-slate-500 block">Verified entries</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Eligible Roll
          </span>
          <span className="text-lg font-black text-slate-900 font-mono">
            {eligibleCount}
          </span>
          <span className="text-[10px] text-slate-500 block">Approved students</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Remaining To Cast
          </span>
          <span className="text-lg font-black text-amber-700 font-mono">
            {remaining}
          </span>
          <span className="text-[10px] text-slate-500 block">Pending voters</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Your Status
          </span>
          <div className="mt-0.5">
            {hasVoted ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Voted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Vote className="w-3 h-3 text-amber-700" />
                Not Voted Yet
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {hasVoted ? 'Ballot tallied' : 'Vote before deadline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ElectionProgressBar;
