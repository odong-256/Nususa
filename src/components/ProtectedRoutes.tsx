import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedVoterRoute: React.FC = () => {
  const { currentUser, userProfile, isApproved, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Verifying student credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  // If user is rejected or suspended, redirect to account status page
  if (userProfile?.status === 'rejected' || userProfile?.status === 'suspended') {
    return <Navigate to="/auth/status" replace />;
  }

  return <Outlet />;
};

export const ProtectedAdminRoute: React.FC = () => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Authorizing Commission Officer...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/voter/dashboard" replace />;
  }

  return <Outlet />;
};
