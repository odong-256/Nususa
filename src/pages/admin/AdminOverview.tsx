import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllElections, getAllCandidates, getElectionResults } from '../../services/electionService';
import { getAllVoters } from '../../services/voterService';
import { getRecentAuditLogs } from '../../services/auditService';
import { Election, VoterProfile, AuditLog, Candidate } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { downloadResultsCsv } from '../../utils/exportResultsCsv';
import {
  Users,
  UserCheck,
  Clock,
  Vote,
  Calendar,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Download,
  CheckCircle2
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [voters, setVoters] = useState<VoterProfile[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [allElec, allVoters, allLogs] = await Promise.all([
          getAllElections(),
          getAllVoters(),
          getRecentAuditLogs(6)
        ]);
        setElections(allElec || []);
        setVoters(allVoters || []);
        setAuditLogs(allLogs || []);

        if (allElec && allElec.length > 0) {
          const cands = await getAllCandidates(allElec[0].id);
          setCandidates(cands || []);
        }
      } catch (err) {
        console.error('Error loading overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const handleDownloadElectionResults = async (electionId: string) => {
    setDownloadingId(electionId);
    try {
      const summary = await getElectionResults(electionId);
      const filename = await downloadResultsCsv(summary, {
        performedBy: currentUser?.email || 'EC Administrator',
        notes: 'Audited results export from overview'
      });
      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 8000);
    } catch (err: any) {
      console.error('Failed to download results:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingVoters = voters.filter(v => v.status === 'pending');
  const approvedVoters = voters.filter(v => v.status === 'approved');
  const activeElections = elections.filter(e => e.status === 'open');
  const totalVotesCast = elections.reduce((sum, e) => sum + (e.totalVotesCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Electoral Commission Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of voters, ballots, candidates, and immutable audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {elections.length > 0 && (
            <button
              id="header-download-results-btn"
              type="button"
              onClick={() => {
                const target = activeElections[0] || elections[0];
                if (target) handleDownloadElectionResults(target.id);
              }}
              disabled={Boolean(downloadingId)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download Audited Results CSV for Record-Keeping"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingId ? 'animate-bounce' : ''}`} />
              <span>{downloadingId ? 'Exporting...' : 'Download Results'}</span>
            </button>
          )}

          {pendingVoters.length > 0 && (
            <Link
              to="/admin/voters?filter=pending"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>{pendingVoters.length} Pending Voter Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Results Exported:</strong> Successfully downloaded <code>{downloadSuccess}</code> into a certified CSV file. Audit record saved.
            </span>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Registered Voters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {voters.length}
          </div>
          <p className="text-xs text-slate-500">
            Verified institutional student accounts
          </p>
        </div>

        {/* Card 2: Approved Voters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Voters</span>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {approvedVoters.length}
          </div>
          <p className="text-xs text-slate-500">
            {voters.length > 0 ? Math.round((approvedVoters.length / voters.length) * 100) : 0}% of voter roll approved
          </p>
        </div>

        {/* Card 3: Active Elections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Polling</span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeElections.length}
          </div>
          <p className="text-xs text-slate-500">
            {elections.length} total elections scheduled/configured
          </p>
        </div>

        {/* Card 4: Total Ballots Cast */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ballots Cast</span>
            <Vote className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">
            {totalVotesCast}
          </div>
          <p className="text-xs text-slate-500">
            Immutable transaction records
          </p>
        </div>
      </div>

      {/* Main Section: Elections Snapshot & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Elections list */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <span>Electoral Cycles</span>
            </h2>
            <Link
              to="/admin/elections"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {elections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No elections found. Create your first election.
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map(election => (
                <div
                  key={election.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={election.status} size="sm" />
                      <span className="text-xs text-slate-500 font-mono">
                        AY {election.academicYear}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {election.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total Votes: {election.totalVotesCount || 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id={`download-results-btn-${election.id}`}
                      type="button"
                      onClick={() => handleDownloadElectionResults(election.id)}
                      disabled={downloadingId === election.id}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Download Audited Results CSV for Record-Keeping"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === election.id ? 'animate-bounce' : ''}`} />
                      <span>{downloadingId === election.id ? 'Exporting...' : 'Download Results'}</span>
                    </button>
                    <Link
                      to={`/admin/results?electionId=${election.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Live Tallies</span>
                    </Link>
                    <Link
                      to="/admin/elections"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Configure
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations panel */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Quick Dispatch</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard operating procedures for managing the NUSUSA electoral lifecycle.
            </p>

            <div className="space-y-2 pt-2">
              <button
                id="quick-download-results-btn"
                type="button"
                onClick={() => {
                  const target = activeElections[0] || elections[0];
                  if (target) handleDownloadElectionResults(target.id);
                }}
                disabled={!elections.length || Boolean(downloadingId)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{downloadingId ? 'Exporting Results...' : 'Download Results (CSV)'}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <Link
                to="/admin/voters"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit & Approve Voters</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/admin/candidates"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Nominate New Candidate</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/admin/results"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Certified Result Declaration</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/admin/audit-logs"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>View System Audit Trail</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-emerald-400">Security Rule Active:</span> Direct client manipulation of vote tallies or status elevations is strictly blocked.
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Snapshot */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-700" />
              <span>Recent Immutable Audit Entries</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cryptographically timestamped actions performed by Electoral Commission administrators.
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No system audit logs logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{log.performedByEmail}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
