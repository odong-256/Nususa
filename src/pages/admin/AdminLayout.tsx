import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

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
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/nususa-logo.jpg"
                  alt="NUSUSA Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  NUSUSA Admin
                </span>
                <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase font-semibold block">
                  Electoral Commission
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Switch to Voter / Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/50">
          <div className="px-2">
            <p className="text-[11px] text-slate-400">Authenticated EC Officer:</p>
            <p className="text-xs font-bold text-white truncate">{userProfile?.fullName || currentUser?.email}</p>
            <p className="text-[10px] text-amber-400 font-mono">Commission Admin</p>
          </div>

          <div className="space-y-1 pt-1">
            <Link
              to="/voter/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switch to Voter View</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
