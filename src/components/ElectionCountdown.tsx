import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, CheckCircle2, Vote, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface ElectionCountdownProps {
  startDate?: string;
  endDate?: string;
  electionTitle?: string;
  electionId?: string;
  status?: string;
}

interface TimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUpcoming: boolean;
  isOpen: boolean;
  isEnded: boolean;
  progressPercent: number;
  formattedTargetDate: string;
}

export const ElectionCountdown: React.FC<ElectionCountdownProps> = ({
  startDate,
  endDate,
  electionTitle = 'NUSUSA General Guild Elections 2026/2027',
  electionId,
  status
}) => {
  // Target start and end dates with reliable defaults
  const targetStart = useMemo(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) return d;
    }
    // Default official election start date
    return new Date('2026-09-20T08:00:00+03:00');
  }, [startDate]);

  const targetEnd = useMemo(() => {
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) return d;
    }
    // Default official election end date
    return new Date('2026-09-27T18:00:00+03:00');
  }, [endDate]);

  const calculateTime = (): TimeBreakdown => {
    const now = Date.now();
    const startMs = targetStart.getTime();
    const endMs = targetEnd.getTime();
    const totalDuration = Math.max(endMs - startMs, 1000 * 60 * 60);

    // If explicit status is 'closed'
    if (status === 'closed' || now >= endMs) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isUpcoming: false,
        isOpen: false,
        isEnded: true,
        progressPercent: 100,
        formattedTargetDate: targetEnd.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }

    // Upcoming: Before Start
    if (now < startMs && status !== 'open') {
      const diff = startMs - now;
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isUpcoming: true,
        isOpen: false,
        isEnded: false,
        progressPercent: 0,
        formattedTargetDate: targetStart.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }

    // Active / Open: Between Start and End (or explicit status === 'open')
    const diff = Math.max(0, endMs - now);
    const elapsed = Math.max(0, now - startMs);
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isUpcoming: false,
      isOpen: true,
      isEnded: false,
      progressPercent: progress,
      formattedTargetDate: targetEnd.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const [time, setTime] = useState<TimeBreakdown>(calculateTime);

  useEffect(() => {
    // Initial evaluation
    setTime(calculateTime());

    // 1-second interval for real-time live tick
    const timer = setInterval(() => {
      setTime(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetStart, targetEnd, status]);

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div
      id="dynamic-election-countdown"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden my-6 transition-all duration-300"
    >
      {/* Top Banner with Real-time Status Badge and Live Indicator */}
      <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Official Electoral Timeline
              </span>

              {time.isUpcoming && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Scheduled • Upcoming Polls
                </span>
              )}

              {time.isOpen && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Polls Open • Active Voting
                </span>
              )}

              {time.isEnded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-rose-300" />
                  Voting Concluded
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 line-clamp-1">
              {time.isUpcoming
                ? `Countdown Until Polls Open`
                : time.isOpen
                ? `Polls Active — Time Remaining to Vote`
                : `Official Polling Period Concluded`}
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-300 shrink-0">
          <div className="flex items-center sm:justify-end gap-1.5 font-medium text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {time.isUpcoming
                ? `Opens: ${time.formattedTargetDate}`
                : time.isOpen
                ? `Closes: ${time.formattedTargetDate}`
                : `Closed: ${time.formattedTargetDate}`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">East Africa Time (EAT • UTC+3)</span>
        </div>
      </div>

      {/* Main Countdown Timer Display */}
      <div className="p-5 sm:p-6 bg-slate-50/50">
        {!time.isEnded ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {/* Days Block */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200 shadow-2xs group hover:border-[#102a43] transition-colors">
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#102a43] tabular-nums tracking-tight">
                {pad(time.days)}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Days
              </span>
            </div>

            {/* Hours Block */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200 shadow-2xs group hover:border-[#102a43] transition-colors">
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#102a43] tabular-nums tracking-tight">
                {pad(time.hours)}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Hours
              </span>
            </div>

            {/* Minutes Block */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200 shadow-2xs group hover:border-[#102a43] transition-colors">
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#102a43] tabular-nums tracking-tight">
                {pad(time.minutes)}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Minutes
              </span>
            </div>

            {/* Seconds Block */}
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200 shadow-2xs group hover:border-[#102a43] transition-colors bg-gradient-to-b from-white to-amber-50/30">
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-amber-700 tabular-nums tracking-tight animate-pulse">
                {pad(time.seconds)}
              </span>
              <span className="block text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-widest mt-1">
                Seconds
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#102a43]" />
            </div>
            <h4 className="text-base font-bold text-[#102a43]">
              Voting for this election has officially closed.
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              The Electoral Commission is auditing and certifying the ballot tallies. Certified election certificates and statistics are published in the Results section.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/results"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <span>View Certified Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Voting Window Progress Bar (Visible when polls are active) */}
        {time.isOpen && (
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Election Progress</span>
              <span className="font-bold text-[#102a43]">{time.progressPercent}% Elapsed</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#102a43] transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(5, time.progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Prompt / Information Strip */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {time.isOpen
                ? 'Accredited NUSUSA voters can submit encrypted ballots now.'
                : time.isUpcoming
                ? 'Students are advised to verify their registration status before voting commences.'
                : 'All digital audit records securely preserved.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {time.isOpen && electionId && (
              <Link
                to={`/voter/election/${electionId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs shadow-xs transition-colors"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>Cast Ballot Now</span>
              </Link>
            )}

            {time.isUpcoming && (
              <Link
                to="/candidates"
                className="inline-flex items-center gap-1 text-[#102a43] hover:underline font-semibold"
              >
                <span>Browse Nominated Candidates</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
