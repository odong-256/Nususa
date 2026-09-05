import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  getCandidatesByElection,
  getElectionResults
} from '../../services/electionService';
import { Election, Position, Candidate, ResultsSummary } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { downloadResultsCsv } from '../../utils/exportResultsCsv';
import {
  BarChart3,
  Award,
  Printer,
  Download,
  RefreshCw,
  Vote,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Users,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

export const AdminResults: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>(
    searchParams.get('electionId') || ''
  );
  const [resultsSummary, setResultsSummary] = useState<ResultsSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const loadData = async (elecId?: string) => {
    setLoading(true);
    try {
      const allElec = await getAllElections();
      setElections(allElec || []);

      const activeId = elecId || selectedElectionId || (allElec.length > 0 ? allElec[0].id : '');
      if (activeId) {
        setSelectedElectionId(activeId);
        const results = await getElectionResults(activeId);
        setResultsSummary(results);
        setPositions(results.positions || []);
        setCandidates(results.candidates || []);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleElectionChange = (newId: string) => {
    setSelectedElectionId(newId);
    loadData(newId);
  };

  const currentElection = elections.find(e => e.id === selectedElectionId);

  // Download results into an auditable CSV
  const handleDownloadResults = async () => {
    if (!currentElection) return;
    setDownloading(true);
    try {
      let summary = resultsSummary;
      if (!summary || summary.election.id !== currentElection.id) {
        summary = await getElectionResults(currentElection.id);
        setResultsSummary(summary);
      }

      const filename = await downloadResultsCsv(summary, {
        performedBy: currentUser?.email || 'EC Administrator',
        notes: 'Audited results export'
      });

      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 9000);
    } catch (err: any) {
      console.error('Download results error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Certification Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Certified Election Results & Tallies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time vote aggregation, statistical percentages, and official winner declarations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedElectionId}
            onChange={e => handleElectionChange(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-emerald-600 outline-hidden cursor-pointer"
          >
            {elections.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadData(selectedElectionId)}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh Live Tallies"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="print-results-btn"
            type="button"
            onClick={() => window.print()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Print Official Gazette"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Primary Download Results Feature */}
          <button
            id="download-results-btn"
            type="button"
            onClick={handleDownloadResults}
            disabled={downloading || !currentElection}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Download Audited Results CSV for Record-Keeping"
          >
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Preparing CSV...' : 'Download Results'}</span>
          </button>

          {/* Secondary Alias for Export CSV */}
          <button
            id="export-results-csv-btn"
            type="button"
            onClick={handleDownloadResults}
            disabled={downloading || !currentElection}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Export CSV Tally Sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV File</span>
          </button>
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Results Export Complete:</strong> Exported <code>{downloadSuccess}</code> into an audited CSV spreadsheet. An administrative audit log entry has been registered for record-keeping.
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

      {/* Summary KPI Banner */}
      {currentElection && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <StatusBadge status={currentElection.status} size="sm" />
              <span className="text-xs font-mono text-slate-500">
                AY {currentElection.academicYear}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentElection.title}
            </h2>
            <p className="text-xs text-slate-500">
              {currentElection.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 divide-x divide-slate-100">
            <div className="text-center px-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Ballots Recorded
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {currentElection.totalVotesCount || 0}
              </span>
            </div>
            {resultsSummary && (
              <div className="text-center pl-6 pr-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Voter Turnout Rate
                </span>
                <span className="text-2xl sm:text-3xl font-black text-purple-700">
                  {resultsSummary.turnoutPercentage}%
                </span>
              </div>
            )}
            <div className="text-center pl-6">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Contested Offices
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {positions.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Position Breakdown & Graphs */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Compiling results tallies from secure storage...
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No positions registered for this election.
        </div>
      ) : (
        <div className="space-y-8">
          {positions.map(position => {
            const positionCandidates = candidates.filter(c => c.positionId === position.id);
            const totalPositionVotes = positionCandidates.reduce(
              (sum, c) => sum + (c.votesCount || 0),
              0
            );
            // Sort by votes descending
            const sortedCandidates = [...positionCandidates].sort(
              (a, b) => (b.votesCount || 0) - (a.votesCount || 0)
            );
            const topWinnerId = sortedCandidates.length > 0 && sortedCandidates[0].votesCount > 0
              ? sortedCandidates[0].id
              : null;

            return (
              <div
                key={position.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
              >
                {/* Position Title & Winner Declaration */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {position.order}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {position.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-8">
                      Total Votes in this race: <strong>{totalPositionVotes}</strong> • Available Seats: <strong>{position.maxWinners || 1}</strong>
                    </p>
                  </div>

                  {topWinnerId && (
                    <div className="pl-8 sm:pl-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full text-xs font-bold shadow-xs">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Projected Winner: {sortedCandidates[0].fullName}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Candidates List with Percentages & Progress Bars */}
                {sortedCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No candidates nominated.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedCandidates.map((cand, idx) => {
                      const votes = cand.votesCount || 0;
                      const percentage =
                        totalPositionVotes > 0
                          ? ((votes / totalPositionVotes) * 100).toFixed(1)
                          : '0.0';
                      const isElected = idx < (position.maxWinners || 1) && votes > 0;

                      return (
                        <div
                          key={cand.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isElected
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : 'bg-slate-50/60 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                              {cand.photoUrl && cand.photoUrl.trim() ? (
                                <img
                                  src={cand.photoUrl}
                                  alt={cand.fullName}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-900 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs border border-emerald-700/50">
                                  {cand.fullName
                                    .split(' ')
                                    .map(n => n[0])
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-sm">{cand.fullName}</h4>
                                  {isElected && (
                                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                      WINNER / ELECTED
                                    </span>
                                  )}
                                </div>
                                {cand.slogan && (
                                  <p className="text-[11px] text-slate-500 italic">"{cand.slogan}"</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-slate-900">
                                {votes} votes
                              </span>
                              <span className="text-xs font-semibold text-slate-500 ml-2">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isElected ? 'bg-emerald-600' : 'bg-slate-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
