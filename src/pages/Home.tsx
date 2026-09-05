import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllElections, getCandidatesByElection, getPositionsByElection } from '../services/electionService';
import { Election, Candidate, Position } from '../types';
import { CandidateCard } from '../components/CandidateCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  Vote,
  ShieldCheck,
  CheckCircle,
  Users,
  Award,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const Home: React.FC = () => {
  const { currentUser, isApproved, isAdmin } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const allElec = await getAllElections();
        setElections(allElec || []);
        if (allElec && allElec.length > 0) {
          const mainElec = allElec[0];
          const [cands, pos] = await Promise.all([
            getCandidatesByElection(mainElec.id),
            getPositionsByElection(mainElec.id)
          ]);
          setCandidates(cands || []);
          setPositions(pos || []);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeElection = elections.find(e => e.status === 'open') || elections[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white py-20 lg:py-32">
        {/* Subtle grid and decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Official Association Logo & Institutional Badge */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-2 shadow-2xl ring-4 ring-emerald-400/30 flex items-center justify-center mx-auto transition-transform hover:scale-105">
                <img
                  src="/nususa-logo.jpg"
                  alt="Official NUSUSA Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="px-3 py-0.5 bg-slate-900 border border-emerald-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                  Unity in Diversity
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Official Electoral Commission Platform • @sun.ac.ug</span>
            </div>
          </div>

          {/* Main Hero Typography */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              NUSUSA ONLINE VOTING
            </h1>
            <p className="text-xl sm:text-2xl font-light text-emerald-300/90 tracking-widest uppercase">
              Secure. Simple. Transparent.
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed pt-2">
              The official, authenticated digital ballot portal of the Northern Uganda Soroti University
              Students Association (NUSUSA). Exercise your democratic right with cryptographic integrity.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/voter/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
                >
                  <Vote className="w-5 h-5" />
                  <span>Go to Voter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="w-full sm:w-auto px-6 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <span>Admin Control Center</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  to="/auth/login"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
                >
                  <Vote className="w-5 h-5" />
                  <span>Login to Vote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/auth/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-amber-400 font-bold text-lg">100% Audit</p>
              <p className="text-xs text-slate-400">Verifiable Ballot Trail</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-emerald-400 font-bold text-lg">Strict @sun.ac.ug</p>
              <p className="text-xs text-slate-400">Verified Student Registry</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-cyan-400 font-bold text-lg">One Vote Rule</p>
              <p className="text-xs text-slate-400">Enforced via Cloud Firestore</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <p className="text-rose-400 font-bold text-lg">Real-Time</p>
              <p className="text-xs text-slate-400">Official Results Tallies</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ELECTION INFORMATION BANNER */}
      {activeElection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <StatusBadge status={activeElection.status} size="md" />
                <span className="text-xs text-slate-500 font-medium">
                  Academic Year {activeElection.academicYear}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeElection.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                {activeElection.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="text-right hidden lg:block pr-3 border-r border-slate-200">
                <p className="text-xs font-medium text-slate-400">Voting Window</p>
                <p className="text-xs font-semibold text-slate-700">
                  {new Date(activeElection.startDate).toLocaleDateString()} – {new Date(activeElection.endDate).toLocaleDateString()}
                </p>
              </div>

              {activeElection.status === 'open' ? (
                <Link
                  to={`/voter/election/${activeElection.id}`}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  <Vote className="w-4 h-4" />
                  <span>Vote Now</span>
                </Link>
              ) : (
                <Link
                  to="/admin/results"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  <span>View Election Records</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. HOW VOTING WORKS */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Step-by-Step Procedure
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Voting Works
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Participating in the NUSUSA election is straightforward, transparent, and completely secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-lg mb-4">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Register & Institutional Auth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign up using your university student email (<span className="font-semibold text-emerald-800">@sun.ac.ug</span>). Our system verifies student enrollment automatically.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-xs flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Institutional Verification</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-lg mb-4">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">EC Admin Approval</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Electoral Commission audits voter registers and confirms your identity, transitioning your status to Approved.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Fraud Prevention</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-lg mb-4">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Review Manifestos & Pick</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore candidate profiles, visions, academic backgrounds, and policies. Select your preferred representatives position by position.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Informed Decision</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-black text-lg mb-4">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Confirm & Digital Receipt</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Double-check your ballot, confirm submission, and immediately receive your cryptographic receipt verification code.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Permanent & Immutable</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CANDIDATE PREVIEW */}
      <section id="candidate-preview" className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                NUSUSA ELECTIONS 2026/2027
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Nominated Candidates & Positions
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl">
                Official Electoral Commission list of student leaders contesting across the 22 executive and guild offices.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/candidates"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
              >
                <span>View Full Official Gazette (22 Offices)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              {currentUser && (
                <Link
                  to="/voter/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Go to Voter Ballot</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              Loading verified candidate dossiers...
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm space-y-3">
              <p>No candidates have been announced yet.</p>
              <Link to="/candidates" className="text-emerald-700 font-semibold underline text-xs">
                Check the Official Electoral Gazette
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.slice(0, 6).map(candidate => {
                  const pos = positions.find(p => p.id === candidate.positionId);
                  return (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      position={pos}
                      canVote={false}
                    />
                  );
                })}
              </div>

              <div className="text-center pt-4">
                <Link
                  to="/candidates"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 shadow-xs transition-colors"
                >
                  <span>View All 22 Positions & Candidates in Official Gazette</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. ABOUT NUSUSA & WHY VOTE */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-emerald-700 font-bold uppercase tracking-wider text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Student Democracy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              About NUSUSA & The Electoral Commission
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              The Northern Uganda Soroti University Students Association (NUSUSA) serves as the supreme representative body
              for students at Soroti University. Through the independent NUSUSA Electoral Commission, we ensure
              that every election reflects the genuine voice and mandate of the student community.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Our digital platform eliminates manual voter roll tampering, permits transparent real-time
              tallying, guarantees student anonymity while casting ballots, and strictly enforces the
              foundational constitutional rule: <strong>One student, one vote.</strong>
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border-l-2 border-emerald-600 pl-4 space-y-1">
                <p className="text-2xl font-black text-slate-900">100%</p>
                <p className="text-xs text-slate-500">Encrypted Cloud Storage</p>
              </div>
              <div className="border-l-2 border-emerald-600 pl-4 space-y-1">
                <p className="text-2xl font-black text-slate-900">0%</p>
                <p className="text-xs text-slate-500">Toleration for Vote Duplication</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-8 sm:p-10 rounded-3xl text-white shadow-xl space-y-6 border border-emerald-800/40">
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Why Your Vote Matters</span>
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Tuition & Exam Policy Advocacy:</strong> Your Guild leaders negotiate payment installments, grace periods, and exam permissions directly with university management.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Campus Infrastructure & Wi-Fi:</strong> Guild governments appropriate student activity funds toward library resources, sports amenities, lighting, and internet.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Hostel Security & Welfare:</strong> The Welfare ministry champions off-campus housing guidelines, fair tariffs, and campus clinic medication availability.
                </span>
              </li>
            </ul>

            <div className="pt-4 border-t border-white/10">
              <Link
                to="/auth/register"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center block transition-all shadow-md text-sm"
              >
                Register Your Student Credentials Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECURE VOTING CALLOUT */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/40">
                <Lock className="w-3.5 h-3.5" />
                <span>Cryptographic Cloud Security</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Protected by Cloud Firestore & Security Rules
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Our server-side security architecture prevents duplicate submissions, unauthorized role elevation,
                and post-election tampering. Rest assured, your ballot is anonymous and unalterable.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <Link
                to="/auth/login"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg"
              >
                Login with @sun.ac.ug
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
