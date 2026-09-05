import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Election } from '../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Calendar,
  Vote,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ElectionCountdownProps {
  election: Election;
  variant?: 'banner' | 'card' | 'compact';
  hasVoted?: boolean;
  onTimerExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isUrgent: boolean; // < 24 hours
  isCritical: boolean; // < 2 hours
  percentElapsed: number;
}

function calculateTimeRemaining(startDateStr: string, endDateStr: string): TimeRemaining {
  const now = Date.now();
  const end = new Date(endDateStr).getTime();
  const start = new Date(startDateStr).getTime();

  if (isNaN(end)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
      isCritical: false,
      percentElapsed: 100
    };
  }

  const totalMs = end - now;

  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isUrgent: false,
      isCritical: false,
      percentElapsed: 100
    };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  const isUrgent = totalMs < 24 * 60 * 60 * 1000;
  const isCritical = totalMs < 2 * 60 * 60 * 1000;

  let percentElapsed = 0;
  if (!isNaN(start) && end > start) {
    const totalDuration = end - start;
    const elapsedDuration = now - start;
    percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isExpired: false,
    isUrgent,
    isCritical,
    percentElapsed
  };
}

export const ElectionCountdown: React.FC<ElectionCountdownProps> = ({
  election,
  variant = 'banner',
  hasVoted = false,
  onTimerExpired
}) => {
  const [time, setTime] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(election.startDate, election.endDate)
  );

  useEffect(() => {
    // Initial evaluation
    const initial = calculateTimeRemaining(election.startDate, election.endDate);
    setTime(initial);

    if (initial.isExpired) {
      if (onTimerExpired) onTimerExpired();
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextTime = calculateTimeRemaining(election.startDate, election.endDate);
      setTime(nextTime);

      if (nextTime.isExpired) {
        window.clearInterval(intervalId);
        if (onTimerExpired) onTimerExpired();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [election.startDate, election.endDate, onTimerExpired]);

  const pad = (n: number) => String(n).padStart(2, '0');

  // 1. COMPACT VARIANT (for small badge or card summary)
  if (variant === 'compact') {
    if (time.isExpired) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Polls Closed</span>
        </div>
      );
    }

    const colorClass = time.isCritical
      ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
      : time.isUrgent
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${colorClass}`}
        title={`Ends ${new Date(election.endDate).toLocaleString()}`}
      >
        <Hourglass className="w-3.5 h-3.5 shrink-0" />
        <span>
          {time.days > 0 ? `${time.days}d ` : ''}
          {pad(time.hours)}h {pad(time.minutes)}m {pad(time.seconds)}s left
        </span>
      </div>
    );
  }

  // 2. CARD VARIANT (inside election grid cards)
  if (variant === 'card') {
    if (time.isExpired) {
      return (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Voting Window Concluded</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Polls Closed</span>
        </div>
      );
    }

    return (
      <div className={`p-3.5 rounded-xl border transition-colors ${
        time.isCritical
          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
          : time.isUrgent
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className={`w-2 h-2 rounded-full ${
              time.isCritical ? 'bg-rose-500 animate-ping' : time.isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span>Time Remaining to Vote</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            Closes {new Date(election.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* 4 Digit Boxes */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-white rounded-lg py-1.5 border border-slate-200/80 shadow-2xs">
            <div className="text-base font-black font-mono tracking-tight text-slate-900 leading-tight">
              {pad(time.days)}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Days</div>
          </div>
          <div className="bg-white rounded-lg py-1.5 border border-slate-200/80 shadow-2xs">
            <div className="text-base font-black font-mono tracking-tight text-slate-900 leading-tight">
              {pad(time.hours)}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Hours</div>
          </div>
          <div className="bg-white rounded-lg py-1.5 border border-slate-200/80 shadow-2xs">
            <div className="text-base font-black font-mono tracking-tight text-slate-900 leading-tight">
              {pad(time.minutes)}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Mins</div>
          </div>
          <div className="bg-white rounded-lg py-1.5 border border-slate-200/80 shadow-2xs">
            <div className="text-base font-black font-mono tracking-tight text-emerald-600 leading-tight">
              {pad(time.seconds)}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Secs</div>
          </div>
        </div>
      </div>
    );
  }

  // 3. FULL FEATURED BANNER VARIANT (Primary Dashboard Display)
  return (
    <div
      id={`election-countdown-banner-${election.id}`}
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all border ${
        time.isCritical
          ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-rose-500/40 shadow-rose-900/20'
          : time.isUrgent
          ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-emerald-950 border-amber-500/40 shadow-amber-900/20'
          : 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-600/40 shadow-emerald-900/20'
      }`}
    >
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
        {/* Left Column: Context & Titles */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              time.isExpired
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : time.isCritical
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse'
                : time.isUrgent
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                time.isExpired ? 'bg-slate-400' : time.isCritical ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
              }`} />
              <span>
                {time.isExpired
                  ? 'Voting Closed'
                  : time.isCritical
                  ? 'Critical: Final Hours!'
                  : time.isUrgent
                  ? 'Closing Today'
                  : 'Live Voting In Progress'}
              </span>
            </div>

            <span className="text-xs text-slate-300 font-mono">
              Academic Year: <strong className="text-white">{election.academicYear}</strong>
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {election.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2">
              {election.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Closes: <strong className="text-white">{new Date(election.endDate).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Soroti University Independent EC</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Countdown Digits & Action CTA */}
        <div className="w-full lg:w-auto flex flex-col items-center sm:items-end gap-4">
          {time.isExpired ? (
            <div className="w-full sm:w-auto bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 text-center sm:text-right">
              <div className="text-lg font-bold text-slate-200">The polls have officially closed</div>
              <p className="text-xs text-slate-400 mt-1">
                Ballot counting and results verification are underway by the Electoral Commission.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
                Time Remaining Until Polls Close:
              </span>

              {/* Countdown Digits Grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Days */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shadow-inner text-center min-w-[64px] sm:min-w-[80px]">
                  <span className="block text-2xl sm:text-4xl font-black font-mono text-white tracking-tight leading-none">
                    {pad(time.days)}
                  </span>
                  <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
                    Days
                  </span>
                </div>

                {/* Hours */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shadow-inner text-center min-w-[64px] sm:min-w-[80px]">
                  <span className="block text-2xl sm:text-4xl font-black font-mono text-white tracking-tight leading-none">
                    {pad(time.hours)}
                  </span>
                  <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
                    Hours
                  </span>
                </div>

                {/* Minutes */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shadow-inner text-center min-w-[64px] sm:min-w-[80px]">
                  <span className="block text-2xl sm:text-4xl font-black font-mono text-white tracking-tight leading-none">
                    {pad(time.minutes)}
                  </span>
                  <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
                    Mins
                  </span>
                </div>

                {/* Seconds */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-500/30 shadow-inner text-center min-w-[64px] sm:min-w-[80px]">
                  <span className="block text-2xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight leading-none">
                    {pad(time.seconds)}
                  </span>
                  <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400/80 mt-1.5">
                    Secs
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Link / Status */}
          <div className="w-full sm:w-auto flex items-center justify-end gap-3 pt-1">
            {hasVoted ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Your ballot has been cast and recorded</span>
              </div>
            ) : !time.isExpired ? (
              <Link
                id="countdown-vote-now-btn"
                to={`/voter/election/${election.id}`}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
              >
                <Vote className="w-4 h-4" />
                <span>Cast Your Vote Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <Link
                to={`/voter/election/${election.id}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                View Candidates & Manifestos
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Elapsed Election Window Progress Bar */}
      {!time.isExpired && time.percentElapsed > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Polling Window Progress</span>
            <span className="font-mono text-emerald-300 font-semibold">{time.percentElapsed}% Elapsed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                time.isCritical ? 'bg-rose-500' : time.isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${time.percentElapsed}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
