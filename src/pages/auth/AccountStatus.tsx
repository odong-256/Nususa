import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertOctagon, ShieldAlert, LogOut, Mail } from 'lucide-react';

export const AccountStatus: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const status = userProfile?.status || 'rejected';
  const isSuspended = status === 'suspended';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border ${
              isSuspended
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-rose-50 border-rose-300 text-rose-600'
            }`}
          >
            {isSuspended ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <AlertOctagon className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2">
            <span
              className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${
                isSuspended ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              Account Status: {status.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
              {isSuspended ? 'Voter Account Suspended' : 'Voter Registration Rejected'}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {isSuspended
                ? userProfile?.suspensionReason ||
                  'Your voter account has been temporarily suspended by the Electoral Commission due to pending identity verification or disciplinary review.'
                : userProfile?.rejectionReason ||
                  'Your student credentials could not be validated against the active university enrollment roll. You are ineligible to vote in this election.'}
            </p>
          </div>

          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <p className="font-semibold text-[#102a43]">Electoral Commission Appeals Notice:</p>
            <p className="text-slate-600 leading-relaxed">
              If you believe this status determination is in error, submit a formal appeal along with your student ID card, registration receipt, and semester admission letter to the NUSUSA Electoral Tribunal.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-[#102a43] text-xs">
              <a href="mailto:2301600199@sun.ac.ug" className="flex items-center gap-1.5 hover:underline font-mono">
                <Mail className="w-3.5 h-3.5" />
                <span>2301600199@sun.ac.ug</span>
              </a>
              <span className="hidden sm:inline text-slate-300">•</span>
              <a href="tel:0760073338" className="hover:underline font-medium">
                Helpline: 0760073338
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
