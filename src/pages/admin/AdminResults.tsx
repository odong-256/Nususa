import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  getCandidatesByElection,
  getElectionResults,
  subscribeToElectionLiveUpdates
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
  ShieldCheck,
  AlertCircle,
  FileText,
  Radio,
  Sparkles
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
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Subtle Live synchronization & new vote highlight states
  const [hasNewVotesHighlight, setHasNewVotesHighlight] = useState(false);
  const [newVotesDelta, setNewVotesDelta] = useState(0);
  const [lastLiveUpdateAt, setLastLiveUpdateAt] = useState<string>('');
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const highlightTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const loadData = async (elecId?: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time listener for incoming votes on the active election
  useEffect(() => {
    if (!selectedElectionId) return;

    setIsLiveConnected(true);
    const unsubscribe = subscribeToElectionLiveUpdates(
      selectedElectionId,
      (newTotalVotes, prevTotalVotes) => {
        const delta = Math.max(1, newTotalVotes - prevTotalVotes);
        setNewVotesDelta(delta);
        setHasNewVotesHighlight(true);
        setLastLiveUpdateAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );

        // Silently reload tallies without triggering a full-screen loading spinner
        loadData(selectedElectionId, true);

        // Keep highlight visible for 5 seconds
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = setTimeout(() => {
          setHasNewVotesHighlight(false);
        }, 5000);
      },
      (err) => {
        console.warn('Real-time election subscription warning:', err);
        setIsLiveConnected(false);
      }
    );

    return () => {
      unsubscribe();
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [selectedElectionId]);

  const handleElectionChange = (newId: string) => {
    setSelectedElectionId(newId);
    loadData(newId);
  };

  const currentElection = elections.find(e => e.id === selectedElectionId);

  // Download results into an auditable CSV
  const handleDownloadResults = async () => {
    if (!currentElection) return;
    setDownloading(true);
    setDownloadError(null);
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
      setDownloadError(err?.message || 'Failed to export election results CSV. Please try again.');
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Certified Election Results & Tallies
            </h1>

            {/* Subtle 'Live' Status Indicator */}
            <div
              id="live-status-indicator"
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 select-none ${
                hasNewVotesHighlight
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105 ring-2 ring-emerald-400'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
              }`}
              title={
                hasNewVotesHighlight
                  ? `New vote recorded just now! Tallies updated automatically in real time.`
                  : isLiveConnected
                  ? `Live tally synchronization active. Real-time updates without full page refresh.`
                  : `Connecting to real-time tally stream...`
              }
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    hasNewVotesHighlight
                      ? 'bg-white opacity-90'
                      : isLiveConnected
                      ? 'bg-emerald-400 opacity-75'
                      : 'bg-amber-400 opacity-50'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    hasNewVotesHighlight
                      ? 'bg-white'
                      : isLiveConnected
                      ? 'bg-emerald-600'
                      : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="tracking-wide text-[11px] font-extrabold uppercase flex items-center gap-1.5">
                {hasNewVotesHighlight ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-100 animate-spin" />
                    <span>+{newVotesDelta} New Vote{newVotesDelta > 1 ? 's' : ''} Received!</span>
                  </>
                ) : (
                  <>
                    <span>Live</span>
                    <span className="text-[10px] text-emerald-600/90 font-medium normal-case hidden sm:inline">
                      • {isLiveConnected ? 'Auto-sync active' : 'Connecting'}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
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
            title="Refresh Live Tallies (Syncing automatically in real time)"
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

          {/* Primary Download CSV Button for Official Record-Keeping */}
          <button
            id="download-csv-btn"
            data-testid="download-csv-btn"
            type="button"
            onClick={handleDownloadResults}
            disabled={downloading || !currentElection}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Download Audited Election Tallies CSV for Official Record-Keeping"
          >
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Preparing CSV...' : 'Download CSV'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Live Vote Notification Banner */}
      {hasNewVotesHighlight && (
        <div
          id="live-vote-alert-banner"
          className="p-3.5 bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-teal-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-700"></span>
            </span>
            <span>
              <strong>Live Update:</strong> {newVotesDelta > 1 ? `${newVotesDelta} new votes have been` : 'A new vote has been'} cast and verified. Candidate standings, vote shares, and turnout updated in real time without refreshing.
            </span>
          </div>
          {lastLiveUpdateAt && (
            <span className="text-[11px] font-mono font-bold text-emerald-800 shrink-0 ml-3 bg-white/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {lastLiveUpdateAt}
            </span>
          )}
        </div>
      )}

      {/* Download Error Banner */}
      {downloadError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Export Failed:</strong> {downloadError}
            </span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-4 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Official CSV Export Complete:</strong> Generated and downloaded <code>{downloadSuccess}</code>. Certified tallies with candidate vote shares, departments, year of study, and EC audit credentials have been archived and logged for record-keeping.
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
            <div
              className={`text-center px-4 transition-all duration-500 rounded-2xl py-1 ${
                hasNewVotesHighlight
                  ? 'bg-emerald-50 ring-2 ring-emerald-500 shadow-xs scale-105'
                  : ''
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Ballots Recorded
                </span>
                {hasNewVotesHighlight && (
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/90 px-1.5 py-0.2 rounded-full animate-bounce">
                    +{newVotesDelta}
                  </span>
                )}
              </div>
              <span
                className={`text-2xl sm:text-3xl font-black transition-colors duration-300 ${
                  hasNewVotesHighlight ? 'text-emerald-700' : 'text-emerald-600'
                }`}
              >
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

      {/* Official Record-Keeping & Archival Card */}
      {currentElection && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-700 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Official Record-Keeping & Institutional Gazette</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Export Official Election Tallies (.CSV)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Export an authenticated tally sheet adhering to RFC 4180 with UTF-8 BOM encoding for Microsoft Excel and Google Sheets. The export includes institutional metadata, voter turnout ratios, candidate academic departments, year of study, vote counts, percentage shares, margins of victory, and Electoral Commission verification hashes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Immutable Audit Trail
              </span>
              <span>•</span>
              <span>Format: Standard CSV (UTF-8 with BOM)</span>
              <span>•</span>
              <span>Offices: {positions.length}</span>
              <span>•</span>
              <span>Candidates: {candidates.length}</span>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <button
              id="download-csv-card-btn"
              type="button"
              onClick={handleDownloadResults}
              disabled={downloading || !currentElection}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-slate-950 rounded-2xl text-sm font-extrabold shadow-lg transition-all cursor-pointer"
              title="Download Certified Election Tallies as CSV"
            >
              <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Generating CSV...' : 'Download CSV'}</span>
            </button>
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
