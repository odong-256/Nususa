import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { getDailyTurnoutTrends, DailyTurnoutTrendPoint } from '../../services/electionService';
import { Election, VoterProfile } from '../../types';
import {
  TrendingUp,
  Users,
  Vote,
  UserCheck,
  Calendar,
  RefreshCw,
  Table as TableIcon,
  Download,
  Filter,
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface VoterTurnoutLineChartProps {
  elections: Election[];
  voters: VoterProfile[];
}

type ViewMode = 'all' | 'daily' | 'cumulative' | 'rate';

export const VoterTurnoutLineChart: React.FC<VoterTurnoutLineChartProps> = ({
  elections,
  voters
}) => {
  const activeOrRecent = elections.find(e => e.status === 'open') || elections[0];
  const [selectedElectionId, setSelectedElectionId] = useState<string>('all');
  const [daysCount, setDaysCount] = useState<number>(14);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [data, setData] = useState<DailyTurnoutTrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const points = await getDailyTurnoutTrends(selectedElectionId, daysCount, voters);
      setData(points);
    } catch (err) {
      console.error('Error loading daily turnout trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedElectionId, daysCount, voters]);

  // Derived metrics for summary stat callouts
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalPeriodRegistrations: 0,
        totalPeriodVotes: 0,
        currentCumulativeRegistrations: voters.length,
        currentCumulativeVotes: 0,
        peakRegistrationDay: 'N/A',
        peakRegistrationCount: 0,
        peakVotingDay: 'N/A',
        peakVotingCount: 0,
        currentTurnoutRate: 0
      };
    }

    let totalReg = 0;
    let totalVotes = 0;
    let maxRegDay = data[0].formattedDate;
    let maxRegCount = 0;
    let maxVoteDay = data[0].formattedDate;
    let maxVoteCount = 0;

    data.forEach(d => {
      totalReg += d.newRegistrations;
      totalVotes += d.dailyVotes;

      if (d.newRegistrations > maxRegCount) {
        maxRegCount = d.newRegistrations;
        maxRegDay = `${d.dayName}, ${d.formattedDate}`;
      }
      if (d.dailyVotes > maxVoteCount) {
        maxVoteCount = d.dailyVotes;
        maxVoteDay = `${d.dayName}, ${d.formattedDate}`;
      }
    });

    const latest = data[data.length - 1];

    return {
      totalPeriodRegistrations: totalReg,
      totalPeriodVotes: totalVotes,
      currentCumulativeRegistrations: latest?.cumulativeRegistrations ?? voters.length,
      currentCumulativeVotes: latest?.cumulativeVotes ?? 0,
      peakRegistrationDay: maxRegCount > 0 ? maxRegDay : 'Steady',
      peakRegistrationCount: maxRegCount,
      peakVotingDay: maxVoteCount > 0 ? maxVoteDay : 'Polling Window',
      peakVotingCount: maxVoteCount,
      currentTurnoutRate: latest?.turnoutRate ?? 0
    };
  }, [data, voters]);

  // Export Daily Trend CSV
  const handleExportCsv = () => {
    if (!data || data.length === 0) return;
    const headers = [
      'Date',
      'Day',
      'New Registrations',
      'Approved Registrations',
      'Cumulative Registrations',
      'Cumulative Approved',
      'Daily Ballots Cast',
      'Cumulative Ballots Cast',
      'Turnout Rate (%)'
    ];

    const rows = data.map(d => [
      d.dateKey,
      d.dayName,
      d.newRegistrations,
      d.approvedRegistrations,
      d.cumulativeRegistrations,
      d.cumulativeApproved,
      d.dailyVotes,
      d.cumulativeVotes,
      `${d.turnoutRate}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NUSUSA_Daily_Voter_Turnout_${selectedElectionId}_${daysCount}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="voter-turnout-section"
      className="bg-white rounded-lg p-6 border border-slate-200 border-t-4 border-t-[#102a43] shadow-xs space-y-6"
    >
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-slate-100 text-[#102a43]">
              <TrendingUp className="w-4 h-4 text-[#102a43]" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#102a43] tracking-tight">
              Voter Turnout & Registration Trends
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual analysis tracking daily voter enrollment velocity, approval milestones, and ballot participation rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Election Filter Dropdown */}
          <select
            id="voter-turnout-election-select"
            value={selectedElectionId}
            onChange={e => setSelectedElectionId(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#102a43]"
          >
            <option value="all">All Electoral Cycles</option>
            {elections.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium border border-slate-200">
            {[
              { days: 7, label: '7D' },
              { days: 14, label: '14D' },
              { days: 30, label: '30D' }
            ].map(range => (
              <button
                key={range.days}
                id={`voter-turnout-range-${range.days}d`}
                type="button"
                onClick={() => setDaysCount(range.days)}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  daysCount === range.days
                    ? 'bg-white text-[#102a43] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium border border-slate-200">
            {[
              { mode: 'all', label: 'All Trends' },
              { mode: 'daily', label: 'Daily Activity' },
              { mode: 'cumulative', label: 'Cumulative' },
              { mode: 'rate', label: 'Turnout %' }
            ].map(m => (
              <button
                key={m.mode}
                id={`voter-turnout-mode-${m.mode}`}
                type="button"
                onClick={() => setViewMode(m.mode as ViewMode)}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  viewMode === m.mode
                    ? 'bg-white text-[#102a43] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Toggle Table */}
          <button
            id="voter-turnout-toggle-table-btn"
            type="button"
            onClick={() => setShowTable(prev => !prev)}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
              showTable
                ? 'bg-[#102a43] text-white border-[#102a43]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Detailed Data Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {/* Export CSV */}
          <button
            id="voter-turnout-export-csv-btn"
            type="button"
            onClick={handleExportCsv}
            className="p-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            title="Download Daily Trends CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            id="voter-turnout-refresh-btn"
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Refresh Trends"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Callout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
        {/* Metric 1: Registration Momentum */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#102a43]" />
            <span>New Registrations</span>
          </div>
          <div className="text-xl font-bold text-[#102a43]">
            +{stats.totalPeriodRegistrations}{' '}
            <span className="text-xs text-slate-500 font-normal">in {daysCount}d</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Total on register: {stats.currentCumulativeRegistrations}
          </p>
        </div>

        {/* Metric 2: Ballot Participation */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Vote className="w-3.5 h-3.5 text-amber-600" />
            <span>Ballots Cast</span>
          </div>
          <div className="text-xl font-bold text-amber-700">
            {stats.totalPeriodVotes}{' '}
            <span className="text-xs text-slate-500 font-normal">period</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Cumulative: {stats.currentCumulativeVotes} ballots
          </p>
        </div>

        {/* Metric 3: Overall Turnout Rate */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>Electoral Turnout</span>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {stats.currentTurnoutRate}%
          </div>
          <p className="text-[10px] text-slate-500">
            Of verified approved student roll
          </p>
        </div>

        {/* Metric 4: Peak Activity Day */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Peak Engagement</span>
          </div>
          <div className="text-sm font-bold text-slate-800 truncate mt-1">
            {stats.peakRegistrationCount > 0 ? stats.peakRegistrationDay : 'Continuous Polling'}
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.peakRegistrationCount > 0
              ? `${stats.peakRegistrationCount} registrations on peak day`
              : 'Tracking daily voter influx'}
          </p>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700">
            Timeline: Last {daysCount} Days ({data[0]?.formattedDate || ''} - {data[data.length - 1]?.formattedDate || ''})
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            {(viewMode === 'all' || viewMode === 'daily') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#102a43] inline-block" />
                <span>New Registrations</span>
              </span>
            )}
            {(viewMode === 'all' || viewMode === 'daily') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" />
                <span>Approved Voters</span>
              </span>
            )}
            {(viewMode === 'all' || viewMode === 'daily') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block" />
                <span>Daily Votes</span>
              </span>
            )}
            {(viewMode === 'all' || viewMode === 'cumulative') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block" />
                <span>Cumulative Reg</span>
              </span>
            )}
            {(viewMode === 'all' || viewMode === 'rate') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] inline-block" />
                <span>Turnout Rate (%)</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-80 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 25, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

              <XAxis
                dataKey="formattedDate"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                dy={6}
              />

              {/* Left Y Axis: Headcounts (Registrations & Votes) */}
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                allowDecimals={false}
              />

              {/* Right Y Axis: Turnout Percentage (0 - 100%) */}
              {(viewMode === 'all' || viewMode === 'rate') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7c3aed', fontSize: 11 }}
                  unit="%"
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as DailyTurnoutTrendPoint;
                    return (
                      <div className="bg-white p-3.5 rounded-lg shadow-md border border-slate-200 text-xs space-y-2 min-w-[200px]">
                        <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
                          <span className="font-bold text-[#102a43]">
                            {point.dayName}, {point.formattedDate}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {point.dateKey}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600 text-[11px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-[#102a43]" />
                              New Registrations:
                            </span>
                            <span className="font-bold text-[#102a43]">
                              {point.newRegistrations}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-[#059669]" />
                              Approved Today:
                            </span>
                            <span className="font-bold text-emerald-700">
                              {point.approvedRegistrations}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                              Ballots Cast Today:
                            </span>
                            <span className="font-bold text-amber-700">
                              {point.dailyVotes}
                            </span>
                          </div>

                          <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              Cumulative Voter Roll:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {point.cumulativeRegistrations} ({point.cumulativeApproved} approved)
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              Cumulative Ballots:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {point.cumulativeVotes}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1 text-purple-700 font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                              Cumulative Turnout Rate:
                            </span>
                            <span>{point.turnoutRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
              />

              {/* 1. Daily Registrations Line */}
              {(viewMode === 'all' || viewMode === 'daily') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="newRegistrations"
                  name="New Registrations"
                  stroke="#102a43"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1, fill: '#102a43' }}
                  activeDot={{ r: 6, stroke: '#102a43', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* 2. Daily Approved Line */}
              {(viewMode === 'all' || viewMode === 'daily') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="approvedRegistrations"
                  name="Approved Voters"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#059669' }}
                  activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* 3. Daily Ballots Line */}
              {(viewMode === 'all' || viewMode === 'daily') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="dailyVotes"
                  name="Daily Ballots Cast"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#d97706' }}
                  activeDot={{ r: 6, stroke: '#d97706', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* 4. Cumulative Registrations Line */}
              {(viewMode === 'cumulative') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulativeRegistrations"
                  name="Total Registered"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* 5. Cumulative Ballots Line */}
              {(viewMode === 'cumulative') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulativeVotes"
                  name="Total Ballots Cast"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#d97706' }}
                  activeDot={{ r: 6, stroke: '#d97706', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* 6. Turnout Percentage Line (Right Y Axis) */}
              {(viewMode === 'all' || viewMode === 'rate') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="turnoutRate"
                  name="Turnout Rate (%)"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7c3aed' }}
                  activeDot={{ r: 6, stroke: '#7c3aed', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collapsible Daily Breakdown Table for EC Audit */}
      {showTable && (
        <div className="pt-4 border-t border-slate-200 animate-in fade-in duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#102a43]">
              Daily Participation & Registration Ledger ({daysCount} Days)
            </h3>
            <span className="text-[11px] text-slate-500">
              Showing official daily metrics from system transaction logs
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Day</th>
                  <th className="px-3 py-2.5 text-center">New Reg</th>
                  <th className="px-3 py-2.5 text-center">Approved</th>
                  <th className="px-3 py-2.5 text-center">Cum. Registered</th>
                  <th className="px-3 py-2.5 text-center">Daily Votes</th>
                  <th className="px-3 py-2.5 text-center">Cum. Votes</th>
                  <th className="px-3 py-2.5 text-right">Turnout Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={row.dateKey} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 font-mono text-slate-700">{row.dateKey}</td>
                    <td className="px-3 py-2 text-slate-600 font-medium">{row.dayName}</td>
                    <td className="px-3 py-2 text-center font-bold text-[#102a43]">
                      {row.newRegistrations > 0 ? `+${row.newRegistrations}` : '0'}
                    </td>
                    <td className="px-3 py-2 text-center text-emerald-700 font-semibold">
                      {row.approvedRegistrations > 0 ? `+${row.approvedRegistrations}` : '0'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700">
                      {row.cumulativeRegistrations}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-700">
                      {row.dailyVotes > 0 ? `+${row.dailyVotes}` : '0'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700">
                      {row.cumulativeVotes}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-purple-700">
                      {row.turnoutRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
