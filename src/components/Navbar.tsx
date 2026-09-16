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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name - SUES inspired */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/nususa-logo.jpg"
              alt="NUSUSA Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-md object-contain bg-white border border-slate-200 p-0.5 shrink-0 group-hover:border-[#102a43] transition-colors"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#102a43] uppercase">
                  NUSUSA Elections
                </span>
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold rounded border border-slate-200 tracking-wider uppercase">
                  Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Soroti University Students Association
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Link
              to="/"
              className="hover:text-[#102a43] transition-colors"
              onMouseEnter={() => import('../pages/Home')}
              onFocus={() => import('../pages/Home')}
            >
              Home
            </Link>
            <Link
              to="/candidates"
              className="hover:text-[#102a43] transition-colors"
              onMouseEnter={() => import('../pages/CandidatesGazette')}
              onFocus={() => import('../pages/CandidatesGazette')}
            >
              Candidates Gazette
            </Link>
            <a href="/#how-it-works" className="hover:text-[#102a43] transition-colors">
              How Voting Works
            </a>
            <a href="/#about" className="hover:text-[#102a43] transition-colors">
              About
            </a>
            <a href="/#faq" className="hover:text-[#102a43] transition-colors">
              FAQ
            </a>
            {currentUser && (
              <>
                <Link
                  to="/voter/dashboard"
                  className="text-[#102a43] font-bold flex items-center gap-1 hover:underline"
                  onMouseEnter={() => import('../pages/voter/VoterDashboard')}
                  onFocus={() => import('../pages/voter/VoterDashboard')}
                >
                  Voter Ballot
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors"
                onMouseEnter={() => {
                  import('../pages/admin/AdminLayout');
                  import('../pages/admin/AdminOverview');
                }}
                onFocus={() => {
                  import('../pages/admin/AdminLayout');
                  import('../pages/admin/AdminOverview');
                }}
              >
                <Shield className="w-3.5 h-3.5 text-[#102a43]" />
                Administration
              </Link>
            )}
          </nav>

          {/* User Auth Buttons / Profile Menu */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link to="/voter/profile" className="text-right hover:opacity-80 transition-opacity">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 justify-end">
                    <User className="w-3 h-3 text-[#102a43]" />
                    <span>{userProfile?.fullName || currentUser.email}</span>
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    {userProfile?.status && (
                      <StatusBadge status={userProfile.status} size="sm" />
                    )}
                  </div>
                </Link>

                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#102a43] bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#102a43] hover:bg-[#243b53] rounded-md transition-colors"
                >
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
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-slate-50"
            >
              Frequently Asked Questions (FAQ)
            </a>
            {currentUser && (
              <>
                <Link
                  to="/voter/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold"
                >
                  Voter Dashboard
                </Link>
                <Link
                  to="/voter/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  My Profile
                </Link>
              </>
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
