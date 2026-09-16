import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, RefreshCw, ShieldCheck, Mail, LogOut, ArrowRight, UserCheck } from 'lucide-react';

export const PendingApproval: React.FC = () => {
  const { currentUser, userProfile, refreshProfile, logout, isApproved, isAdmin } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshProfile();
      if (isApproved || isAdmin || userProfile?.status === 'approved') {
        navigate('/voter/dashboard');
      }
    } catch (e) {
      console.error('Refresh check error:', e);
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] text-center space-y-6">
          {/* Waiting Icon */}
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-[#102a43] rounded-full mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 text-[#102a43]" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded uppercase tracking-wider">
              Status: Pending Approval
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
              Voter Account Under Review
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your registration has been successfully received by the NUSUSA Electoral Commission.
              Under university electoral guidelines, student credentials must be verified before ballot
              access is activated.
            </p>
          </div>

          {/* Voter Info Card */}
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200 text-left space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Registered Credential Summary
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <p className="text-slate-500">Student Name</p>
                <p className="font-semibold text-slate-900">{userProfile?.fullName || 'Enrolled Student'}</p>
              </div>
              <div>
                <p className="text-slate-500">Institutional Email</p>
                <p className="font-semibold text-slate-900">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Student ID</p>
                <p className="font-semibold text-slate-900">{userProfile?.studentId || 'Under Verification'}</p>
              </div>
              <div>
                <p className="text-slate-500">Submitted On</p>
                <p className="font-semibold text-slate-900">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Today'}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <div className="space-y-2.5 pt-1">
            <button
              id="check-approval-btn"
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full py-2.5 px-4 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking Status with Server...' : 'Check Approval Status'}</span>
            </button>

            {userProfile?.status === 'approved' && (
              <Link
                to="/voter/dashboard"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold rounded-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>You are approved! Proceed to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Help Info & Sign out */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-600">
              <a href="mailto:2301600199@sun.ac.ug" className="flex items-center gap-1.5 hover:text-[#102a43] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#102a43]" />
                <span>2301600199@sun.ac.ug</span>
              </a>
              <span className="hidden sm:inline text-slate-300">•</span>
              <a href="tel:0760073338" className="hover:text-[#102a43] transition-colors font-medium">
                Help: 0760073338
              </a>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
