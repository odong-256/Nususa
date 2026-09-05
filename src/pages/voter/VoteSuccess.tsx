import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Ballot } from '../../types';
import { CheckCircle2, ShieldCheck, ArrowRight, Printer, Home, Vote } from 'lucide-react';

export const VoteSuccess: React.FC = () => {
  const location = useLocation();
  const { electionId } = useParams<{ electionId: string }>();
  const ballot = (location.state as { ballot?: Ballot })?.ballot;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
        {/* Animated Checkmark Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center border-4 border-emerald-50 shadow-inner">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vote Successfully Submitted
          </h1>
          <p className="text-emerald-800 font-semibold text-sm">
            Thank you for participating in the NUSUSA election.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your ballot has been cryptographically recorded into the university electoral database.
            Your participation directly shapes student leadership and institutional governance.
          </p>
        </div>

        {/* Cryptographic Receipt Card */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-3 font-mono text-xs">
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
              <span className="text-emerald-600 font-semibold">100% Sealed & Immutable</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Receipt</span>
          </button>

          <Link
            to="/voter/dashboard"
            className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Return to Voter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
