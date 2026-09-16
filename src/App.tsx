import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedVoterRoute, ProtectedAdminRoute } from './components/ProtectedRoutes';

// Lazy-loaded routes for code-splitting and rapid initial page load
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const CandidatesGazette = lazy(() => import('./pages/CandidatesGazette').then(m => ({ default: m.CandidatesGazette })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const PendingApproval = lazy(() => import('./pages/auth/PendingApproval').then(m => ({ default: m.PendingApproval })));
const AccountStatus = lazy(() => import('./pages/auth/AccountStatus').then(m => ({ default: m.AccountStatus })));
const VoterDashboard = lazy(() => import('./pages/voter/VoterDashboard').then(m => ({ default: m.VoterDashboard })));
const ElectionView = lazy(() => import('./pages/voter/ElectionView').then(m => ({ default: m.ElectionView })));
const VoteSuccess = lazy(() => import('./pages/voter/VoteSuccess').then(m => ({ default: m.VoteSuccess })));
const MyProfile = lazy(() => import('./pages/voter/MyProfile').then(m => ({ default: m.MyProfile })));

// Admin Pages (Lazy loaded so non-admin users don't download admin bundles)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminElections = lazy(() => import('./pages/admin/AdminElections').then(m => ({ default: m.AdminElections })));
const AdminPositions = lazy(() => import('./pages/admin/AdminPositions').then(m => ({ default: m.AdminPositions })));
const AdminCandidates = lazy(() => import('./pages/admin/AdminCandidates').then(m => ({ default: m.AdminCandidates })));
const AdminVoters = lazy(() => import('./pages/admin/AdminVoters').then(m => ({ default: m.AdminVoters })));
const AdminResults = lazy(() => import('./pages/admin/AdminResults').then(m => ({ default: m.AdminResults })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));

const PageLoadingFallback: React.FC = () => (
  <div className="w-full flex items-center justify-center min-h-[45vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-slate-200 border-t-[#102a43] rounded-full animate-spin" />
      <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        Loading...
      </span>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/candidates" element={<CandidatesGazette />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/pending-approval" element={<PendingApproval />} />
                <Route path="/auth/status" element={<AccountStatus />} />

                {/* Protected Voter Routes */}
                <Route element={<ProtectedVoterRoute />}>
                  <Route path="/voter/dashboard" element={<VoterDashboard />} />
                  <Route path="/voter/profile" element={<MyProfile />} />
                  <Route path="/profile" element={<Navigate to="/voter/profile" replace />} />
                  <Route path="/voter/election/:electionId" element={<ElectionView />} />
                  <Route path="/voter/election/:electionId/success" element={<VoteSuccess />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedAdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="elections" element={<AdminElections />} />
                    <Route path="positions" element={<AdminPositions />} />
                    <Route path="candidates" element={<AdminCandidates />} />
                    <Route path="voters" element={<AdminVoters />} />
                    <Route path="results" element={<AdminResults />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                  </Route>
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
