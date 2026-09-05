import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedVoterRoute, ProtectedAdminRoute } from './components/ProtectedRoutes';

// Public & Voter Pages
import { Home } from './pages/Home';
import { CandidatesGazette } from './pages/CandidatesGazette';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PendingApproval } from './pages/auth/PendingApproval';
import { AccountStatus } from './pages/auth/AccountStatus';
import { VoterDashboard } from './pages/voter/VoterDashboard';
import { ElectionView } from './pages/voter/ElectionView';
import { VoteSuccess } from './pages/voter/VoteSuccess';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminElections } from './pages/admin/AdminElections';
import { AdminPositions } from './pages/admin/AdminPositions';
import { AdminCandidates } from './pages/admin/AdminCandidates';
import { AdminVoters } from './pages/admin/AdminVoters';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
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
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
