import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ElectionCountdownProps {
  startDate?: string;
  endDate?: string;
  electionTitle?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
  isEnded: boolean;
  totalMs: number;
}

export const ElectionCountdown: React.FC<ElectionCountdownProps> = ({
  startDate,
  endDate,
  electionTitle = 'NUSUSA Elections 2026/2027'
}) => {
  // Default target: Official election start date
  const targetStart = startDate ? new Date(startDate) : new Date('2026-09-20T08:00:00+03:00');
  const targetEnd = endDate ? new Date(endDate) : new Date('2026-09-27T18:00:00+03:00');

  const calculateTime = (): TimeRemaining => {
    const now = Date.now();
    const startMs = targetStart.getTime();
    const endMs = targetEnd.getTime();

    if (now < startMs) {
      const diff = startMs - now;
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isStarted: false,
        isEnded: false,
        totalMs: diff
      };
    } else if (now >= startMs && now < endMs) {
      const diff = endMs - now;
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isStarted: true,
        isEnded: false,
        totalMs: diff
      };
    } else {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isStarted: true,
        isEnded: true,
        totalMs: 0
      };
    }
  };

  const [time, setTime] = useState<TimeRemaining>(calculateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div
      id="election-countdown-timer"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 my-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#102a43]/5 border border-[#102a43]/15 flex items-center justify-center text-[#102a43]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Election Countdown
              </span>
              {!time.isStarted && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Upcoming Polls
                </span>
              )}
              {time.isStarted && !time.isEnded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Voting In Progress
                </span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-[#102a43]">
              {!time.isStarted
                ? `Time Remaining Until Election Start`
                : !time.isEnded
                ? `Polls Active — Time Remaining Until Close`
                : `Official Voting Concluded`}
            </h4>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 hidden md:block">
          <div className="flex items-center gap-1.5 justify-end font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#102a43]" />
            <span>
              {!time.isStarted
                ? `Starts: ${targetStart.toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                : `Ends: ${targetEnd.toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">East Africa Time (EAT)</span>
        </div>
      </div>

      {/* Numerical Counter Blocks: Days, Hours, Minutes, Seconds */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-5">
        {/* Days */}
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-2xl sm:text-4xl font-extrabold text-[#102a43] tabular-nums">
            {pad(time.days)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-2xl sm:text-4xl font-extrabold text-[#102a43] tabular-nums">
            {pad(time.hours)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-2xl sm:text-4xl font-extrabold text-[#102a43] tabular-nums">
            {pad(time.minutes)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
            Minutes
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-2xl sm:text-4xl font-extrabold text-[#102a43] tabular-nums">
            {pad(time.seconds)}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
            Seconds
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Certified Electoral Commission Schedule
        </span>
        <span className="text-[11px] text-slate-400">
          Official Help Contact: <strong className="text-slate-700">0760073338</strong>
        </span>
      </div>
    </div>
  );
};
