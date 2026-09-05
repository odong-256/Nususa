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
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 text-center space-y-6">
          {/* Animated Waiting Icon */}
          <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 text-amber-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
              Status: Pending Approval
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Voter Account Under Review
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your registration has been successfully received by the NUSUSA Electoral Commission.
              Under university electoral guidelines, student credentials must be verified before ballot
              access is activated.
            </p>
          </div>

          {/* Voter Info Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Credential Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
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
          <div className="space-y-3 pt-2">
            <button
              id="check-approval-btn"
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking Status with Server...' : 'Check Approval Status'}</span>
            </button>

            {userProfile?.status === 'approved' && (
              <Link
                to="/voter/dashboard"
                className="w-full py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>You are approved! Proceed to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Help Info & Sign out */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-emerald-700" />
              <span>Questions? Email ec@sun.ac.ug</span>
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
