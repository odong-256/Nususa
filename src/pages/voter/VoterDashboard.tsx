import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllElections, checkHasVoted } from '../../services/electionService';
import { getAllVoters } from '../../services/voterService';
import { Election } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ElectionCountdown } from '../../components/ElectionCountdown';
import { HowToVoteModal } from '../../components/voter/HowToVoteModal';
import { ElectionProgressBar } from '../../components/voter/ElectionProgressBar';
import {
  Vote,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  User,
  ExternalLink,
  Award,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export const VoterDashboard: React.FC = () => {
  const { currentUser, userProfile, isApproved, isAdmin } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [votedStatusMap, setVotedStatusMap] = useState<Record<string, boolean>>({});
  const [totalEligibleVoters, setTotalEligibleVoters] = useState<number>(0);
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    if (!currentUser) return;
    try {
      const [allElec, allVoters] = await Promise.all([
        getAllElections(),
        getAllVoters().catch(() => [])
      ]);
      setElections(allElec || []);

      const approvedCount = (allVoters || []).filter(v => v.status === 'approved').length;
      setTotalEligibleVoters(approvedCount > 0 ? approvedCount : (allVoters || []).length);

      // Check voting status for each election for this user in parallel
      const statusPairs = await Promise.all(
        (allElec || []).map(async elec => {
          try {
            const hasVoted = await checkHasVoted(elec.id, currentUser.uid);
            return [elec.id, hasVoted] as const;
          } catch {
            return [elec.id, false] as const;
          }
        })
      );
      setVotedStatusMap(Object.fromEntries(statusPairs));
    } catch (err) {
      console.error('Error fetching elections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser]);

  // Check approval routing
  if (!isApproved && !isAdmin && userProfile?.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <Clock className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Voter Account Pending Approval</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your registration is currently under review by the Electoral Commission. You will be able to cast votes as soon as an administrator approves your student account.
          </p>
          <Link
            to="/auth/pending-approval"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all"
          >
            <span>View Verification Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const activeElections = elections
    .filter(e => e.status === 'open')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const upcomingElections = elections.filter(e => e.status === 'scheduled' || e.status === 'draft');
  const completedElections = elections.filter(e => e.status === 'closed' || e.status === 'archived');
  const featuredActiveElection = activeElections[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header - SUES Style */}
        <div className="bg-white rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/nususa-logo.jpg"
              alt="NUSUSA Logo"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-md object-contain bg-white border border-slate-200 p-1 shrink-0 hidden sm:block"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#102a43]" />
                <span>NUSUSA Elections • Voter Ballot Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#102a43] tracking-tight">
                Welcome, {userProfile?.fullName || 'Voter'}
              </h1>
              <p className="text-xs text-slate-600">
                Student ID: <span className="font-semibold text-slate-900">{userProfile?.studentId || 'N/A'}</span> • Email: <span className="font-semibold text-slate-900">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status:</span>
              {userProfile?.status && <StatusBadge status={userProfile.status} size="sm" />}
            </div>
            
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>How to Vote</span>
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-1.5 bg-[#102a43] hover:bg-[#243b53] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>Administration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Live Election Countdown Banner */}
        {!loading && featuredActiveElection && (
          <ElectionCountdown
            election={featuredActiveElection}
            variant="banner"
            hasVoted={votedStatusMap[featuredActiveElection.id] || false}
            onTimerExpired={loadDashboard}
          />
        )}

        {/* Dynamic Election Completion & Participation Progress Bar */}
        {!loading && featuredActiveElection && (
          <ElectionProgressBar
            election={featuredActiveElection}
            totalEligibleVoters={totalEligibleVoters}
            hasVoted={votedStatusMap[featuredActiveElection.id] || false}
          />
        )}

        {/* Section: Available Elections (Open) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Available Elections (Voting Active)
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {activeElections.length} Active
            </span>
          </div>

          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Checking election schedules...
            </div>
          ) : activeElections.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800">No active voting sessions at this moment</h3>
              <p className="text-xs text-slate-500">
                Elections will appear here once officially opened by the Electoral Commission.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeElections.map(election => {
                const hasVoted = votedStatusMap[election.id] || false;
                return (
                  <div
                    key={election.id}
                    id={`election-card-${election.id}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={election.status} size="sm" />
                        {hasVoted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Voted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                            <Vote className="w-4 h-4 text-amber-700" />
                            <span>Eligible to Vote</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {election.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                        {election.description}
                      </p>

                      <div className="pt-2 text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Closing: {new Date(election.endDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Vote className="w-3.5 h-3.5 text-slate-400" />
                          <span>Total Votes Recorded: {election.totalVotesCount || 0}</span>
                        </div>
                      </div>

                      {/* Live Dynamic Countdown Tile */}
                      <div className="pt-2">
                        <ElectionCountdown
                          election={election}
                          variant="card"
                          hasVoted={hasVoted}
                          onTimerExpired={loadDashboard}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      {hasVoted ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-500">
                            Your ballot has been securely submitted & tallied.
                          </span>
                          <Link
                            to={`/voter/election/${election.id}`}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            View Candidate Dossiers
                          </Link>
                        </div>
                      ) : (
                        <Link
                          id={`vote-now-${election.id}`}
                          to={`/voter/election/${election.id}`}
                          className="w-full py-2.5 px-4 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-center shadow-xs transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                        >
                          <Vote className="w-4 h-4" />
                          <span>Cast Ballot</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section: Upcoming Elections */}
        {upcomingElections.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span>Upcoming Elections</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingElections.map(election => (
                <div
                  key={election.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={election.status} size="sm" />
                    <span className="text-xs text-slate-400">Scheduled</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{election.title}</h3>
                  <p className="text-xs text-slate-600">{election.description}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Scheduled for: {new Date(election.startDate).toLocaleDateString()}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Completed Elections */}
        {completedElections.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-600" />
              <span>Completed Elections</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedElections.map(election => (
                <div
                  key={election.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={election.status} size="sm" />
                      <span className="text-xs font-semibold text-slate-500">
                        {election.totalVotesCount || 0} Total Votes
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{election.title}</h3>
                    <p className="text-xs text-slate-600">{election.description}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Link
                      to="/admin/results"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>View Final Certified Results</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 'How to Vote' Step-by-Step Tutorial Modal */}
      <HowToVoteModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onStartVoting={() => {
          if (featuredActiveElection) {
            navigate(`/voter/election/${featuredActiveElection.id}`);
          }
        }}
      />
    </div>
  );
};
