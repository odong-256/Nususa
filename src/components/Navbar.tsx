import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from './StatusBadge';
import {
  Vote,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/nususa-logo.jpg"
              alt="NUSUSA Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-contain bg-white border border-emerald-800/30 p-0.5 shadow-xs group-hover:scale-105 transition-transform shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  NUSUSA
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded tracking-wider uppercase">
                  VOTING
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Northern Uganda Soroti University Students Association
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              Home
            </Link>
            <Link to="/candidates" className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
              Candidates Gazette
            </Link>
            <a href="/#how-it-works" className="hover:text-emerald-700 transition-colors">
              How Voting Works
            </a>
            <a href="/#about" className="hover:text-emerald-700 transition-colors">
              About NUSUSA
            </a>
            {currentUser && (
              <Link to="/voter/dashboard" className="text-emerald-700 font-semibold flex items-center gap-1">
                Voter Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                Admin Console
              </Link>
            )}
          </nav>

          {/* User Auth Buttons / Profile Menu */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 justify-end">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{userProfile?.fullName || currentUser.email}</span>
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    {userProfile?.status && (
                      <StatusBadge status={userProfile.status} size="sm" />
                    )}
                  </div>
                </div>

                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Login to Vote
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && userProfile?.status && (
              <StatusBadge status={userProfile.status} size="sm" />
            )}
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/candidates"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
            >
              Candidates Gazette (2026/2027)
            </Link>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-slate-50"
            >
              How Voting Works
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-slate-50"
            >
              About NUSUSA
            </a>
            {currentUser && (
              <Link
                to="/voter/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold"
              >
                Voter Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-amber-50 text-amber-900 font-bold flex items-center justify-between"
              >
                <span>Admin Console</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-3">
                <div className="px-2 text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800">{currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Login to Vote
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-semibold text-white bg-emerald-700 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
