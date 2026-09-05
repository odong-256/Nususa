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
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2 ${
              isSuspended
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-rose-50 border-rose-300 text-rose-600'
            }`}
          >
            {isSuspended ? (
              <ShieldAlert className="w-10 h-10" />
            ) : (
              <AlertOctagon className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                isSuspended ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              Account Status: {status.toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isSuspended ? 'Voter Account Suspended' : 'Voter Registration Rejected'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {isSuspended
                ? userProfile?.suspensionReason ||
                  'Your voter account has been temporarily suspended by the Electoral Commission due to pending identity verification or disciplinary review.'
                : userProfile?.rejectionReason ||
                  'Your student credentials could not be validated against the active university enrollment roll. You are ineligible to vote in this election.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <p className="font-semibold text-slate-800">Electoral Commission Appeals Notice:</p>
            <p className="text-slate-600 leading-relaxed">
              If you believe this status determination is in error, submit a formal appeal along with your student ID card, registration receipt, and semester admission letter to the NUSUSA Electoral Tribunal.
            </p>
            <div className="pt-2 flex items-center gap-2 text-emerald-800 font-mono text-[11px]">
              <Mail className="w-3.5 h-3.5" />
              <span>tribunal@sun.ac.ug | ec@sun.ac.ug</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
