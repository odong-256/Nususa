import React from 'react';
import { NavLink, Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Vote,
  LayoutDashboard,
  Calendar,
  Layers,
  Users,
  UserCheck,
  BarChart3,
  FileSpreadsheet,
  Shield,
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, userProfile, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#102a43] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Authenticating EC Officer...</p>
        </div>
      </div>
    );
  }

  // Strict restriction: Admin dashboard must be seen by only authorized admin officers
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Restricted Administration Access</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The NUSUSA Electoral Commission dashboard is strictly restricted to appointed Commission Officers.
            You must be granted administrative access by an administrator to view this area.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/voter/dashboard"
              className="w-full py-2.5 px-4 bg-[#102a43] text-white rounded-xl text-xs font-semibold hover:bg-[#243b53] transition-colors"
            >
              Return to Voter Dashboard
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/elections', label: 'Elections', icon: Calendar },
    { to: '/admin/positions', label: 'Positions', icon: Layers },
    { to: '/admin/candidates', label: 'Candidates', icon: Users },
    { to: '/admin/voters', label: 'Voters & Approvals', icon: UserCheck },
    { to: '/admin/results', label: 'Results & Tallies', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileSpreadsheet }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Admin Sidebar - SUES Style */}
      <aside className="w-full md:w-64 bg-white text-slate-800 shrink-0 border-r border-slate-200 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/nususa-logo.jpg"
                alt="NUSUSA Logo"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-md bg-white p-0.5 border border-slate-200 object-contain shrink-0"
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#102a43] block">
                  NUSUSA EC
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Administration
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-[#102a43] font-bold border-l-3 border-[#102a43]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Switch to Voter / Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50">
          <div className="px-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Officer Authenticated</p>
            <p className="text-xs font-bold text-slate-800 truncate">{userProfile?.fullName || currentUser?.email}</p>
            <span className="inline-block mt-1 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#102a43] bg-slate-200 rounded border border-slate-300">
              EC Admin
            </span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200">
            <Link
              to="/voter/dashboard"
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#102a43] hover:bg-white rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voter Ballot View</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
