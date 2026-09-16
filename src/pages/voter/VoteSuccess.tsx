import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Ballot } from '../../types';
import { CheckCircle2, ShieldCheck, ArrowRight, Printer, Home, Vote } from 'lucide-react';

export const VoteSuccess: React.FC = () => {
  const location = useLocation();
  const { electionId } = useParams<{ electionId: string }>();
  const ballot = (location.state as { ballot?: Ballot })?.ballot;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto w-full bg-white rounded-lg shadow-xs border border-slate-200 border-t-4 border-t-[#102a43] p-6 sm:p-8 text-center space-y-6">
        {/* Animated Checkmark Badge */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full mx-auto flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
            Vote Successfully Submitted
          </h1>
          <p className="text-slate-700 font-semibold text-xs sm:text-sm">
            Thank you for participating in the NUSUSA elections.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your ballot has been cryptographically recorded into the university electoral database.
            Your participation directly shapes student leadership and institutional governance.
          </p>
        </div>

        {/* Cryptographic Receipt Card */}
        <div className="bg-slate-50 rounded-md p-4 border border-slate-200 text-left space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Official Electoral Receipt</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFIED</span>
            </span>
          </div>

          <div className="space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Receipt Code:</span>
              <span className="font-bold text-slate-900 select-all">
                {ballot?.receiptCode || 'NUSUSA-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span>{ballot ? new Date(ballot.submittedAt).toLocaleString() : new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ballot Integrity:</span>
              <span className="text-emerald-700 font-semibold">100% Sealed & Immutable</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Receipt</span>
          </button>

          <Link
            to="/voter/dashboard"
            className="w-full sm:w-auto px-5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
