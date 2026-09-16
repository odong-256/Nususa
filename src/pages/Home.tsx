import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllElections, getCandidatesByElection, getPositionsByElection } from '../services/electionService';
import { Election, Candidate, Position } from '../types';
import { CandidateCard } from '../components/CandidateCard';
import { StatusBadge } from '../components/StatusBadge';
import { FrequentlyAskedQuestions } from '../components/FrequentlyAskedQuestions';
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
      {/* 1. SUES INSPIRED INSTITUTIONAL HERO SECTION */}
      <section className="bg-white border-b border-slate-200 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          {/* Institutional Emblem & Overline */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <Link to="/" className="group inline-block">
              <img
                src="/nususa-logo.jpg"
                alt="NUSUSA Logo"
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-md border border-slate-200 bg-white p-1.5 shadow-xs group-hover:border-[#102a43] transition-colors"
              />
            </Link>
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Soroti University • Northern Uganda Soroti University Students Association
            </h2>
          </div>

          {/* Main Title */}
          <div className="space-y-2 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102a43] tracking-tight">
              Elections Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              The official digital ballot and election results platform for NUSUSA student leadership.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {currentUser ? (
              <>
                <Link
                  to="/voter/dashboard"
                  className="px-6 py-2.5 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Vote className="w-4 h-4" />
                  <span>Go to Voter Ballot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold rounded-md transition-colors flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <span>Administration Console</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-6 py-2.5 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Vote className="w-4 h-4" />
                  <span>Sign In to Vote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/auth/register"
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-300 shadow-2xs transition-colors flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span>Register as Voter</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. SUES SIGNATURE ELECTION INFORMATION CARD */}
      {activeElection && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs uppercase tracking-wider rounded-sm">
                  {activeElection.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Academic Year {activeElection.academicYear}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#102a43]">
                {activeElection.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                {activeElection.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="text-right hidden lg:block pr-4 border-r border-slate-200">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Voting Window</p>
                <p className="text-xs font-semibold text-slate-700">
                  {new Date(activeElection.startDate).toLocaleDateString()} – {new Date(activeElection.endDate).toLocaleDateString()}
                </p>
              </div>

              {activeElection.status === 'open' ? (
                <Link
                  to={`/voter/election/${activeElection.id}`}
                  className="px-5 py-2.5 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Vote className="w-4 h-4" />
                  <span>Cast Your Ballot</span>
                </Link>
              ) : (
                <Link
                  to="/admin/results"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span>View Election Records</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. HOW VOTING WORKS */}
      <section id="how-it-works" className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Voting Procedure
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#102a43] tracking-tight">
            How Voting Works
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-xs sm:text-sm">
            Participating in the NUSUSA elections is straightforward, transparent, and verified.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 01</p>
              <h3 className="font-bold text-[#102a43] text-sm mb-1.5">Sign In</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authenticate using your registered <span className="font-semibold text-slate-800">@sun.ac.ug</span> university Google account.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-[11px] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Identity Verified</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 02</p>
              <h3 className="font-bold text-[#102a43] text-sm mb-1.5">Roster Clearance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Electoral Commission confirms your student enrollment on the active voter roster.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#102a43]" />
              <span>Voter Roster</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 03</p>
              <h3 className="font-bold text-[#102a43] text-sm mb-1.5">Review & Select</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Examine candidate manifestos and mark your choice for each contested office.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-[11px] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-600" />
              <span>Informed Decision</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Step 04</p>
              <h3 className="font-bold text-[#102a43] text-sm mb-1.5">Digital Receipt</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit your encrypted ballot and receive an immutable audit confirmation code.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-slate-400 text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>One Student, One Vote</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CANDIDATE PREVIEW */}
      <section id="candidate-preview" className="py-12 bg-slate-100/60 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Official Candidates
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#102a43] tracking-tight">
                Nominated Candidates
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
                Official Electoral Commission list of student leaders contesting across the executive and guild offices.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/candidates"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <span>View Candidates Gazette</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Loading verified candidate list...
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-slate-500 text-xs space-y-2">
              <p>No candidates have been announced yet.</p>
              <Link to="/candidates" className="text-[#102a43] font-semibold underline text-xs">
                Check the Official Electoral Gazette
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              <div className="text-center pt-2">
                <Link
                  to="/candidates"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-md border border-slate-300 shadow-2xs transition-colors"
                >
                  <span>View All 22 Positions & Candidates in Gazette</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. ABOUT NUSUSA ELECTORAL COMMISSION */}
      <section id="about" className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#102a43] rounded-lg p-8 shadow-xs space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              Electoral Commission
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#102a43] tracking-tight">
              About NUSUSA & The Electoral Commission
            </h2>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            The Northern Uganda Soroti University Students Association (NUSUSA) serves as the supreme representative body
            for students at Soroti University. Through the independent NUSUSA Electoral Commission, we ensure
            that every election reflects the genuine voice and mandate of the student community.
          </p>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Our digital platform eliminates manual voter roll tampering, permits transparent real-time
            tallying, guarantees student anonymity while casting ballots, and strictly enforces the
            foundational constitutional rule: <strong>One student, one vote.</strong>
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2 max-w-md">
            <div className="border-l-2 border-[#102a43] pl-4 space-y-1">
              <p className="text-xl font-bold text-[#102a43]">100%</p>
              <p className="text-xs text-slate-500">Encrypted Cloud Storage</p>
            </div>
            <div className="border-l-2 border-[#102a43] pl-4 space-y-1">
              <p className="text-xl font-bold text-[#102a43]">0%</p>
              <p className="text-xs text-slate-500">Toleration for Vote Duplication</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <FrequentlyAskedQuestions />
    </div>
  );
};
