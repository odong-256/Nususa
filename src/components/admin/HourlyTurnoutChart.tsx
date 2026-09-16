import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getHourlyTurnoutData, HourlyTurnoutPoint } from '../../services/electionService';
import { Election } from '../../types';
import { Clock, TrendingUp, Users, Activity, RefreshCw, BarChart2 } from 'lucide-react';

interface HourlyTurnoutChartProps {
  elections: Election[];
  totalApprovedVoters: number;
}

export const HourlyTurnoutChart: React.FC<HourlyTurnoutChartProps> = ({
  elections,
  totalApprovedVoters
}) => {
  const activeOrRecent = elections.find(e => e.status === 'open') || elections[0];
  const [selectedElectionId, setSelectedElectionId] = useState<string>(activeOrRecent?.id || '');
  const [data, setData] = useState<HourlyTurnoutPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState<'both' | 'rate' | 'votes'>('both');

  useEffect(() => {
    if (activeOrRecent && !selectedElectionId) {
      setSelectedElectionId(activeOrRecent.id);
    }
  }, [activeOrRecent]);

  const loadChartData = async (elecId: string) => {
    if (!elecId) return;
    setLoading(true);
    try {
      const points = await getHourlyTurnoutData(elecId, totalApprovedVoters);
      setData(points);
    } catch (err) {
      console.error('Error fetching turnout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      loadChartData(selectedElectionId);
    }
  }, [selectedElectionId, totalApprovedVoters]);

  const currentElection = elections.find(e => e.id === selectedElectionId);

  // Derive key turnout metrics
  const totalVotesRecorded = data.length > 0 ? data[data.length - 1].cumulativeVotes : 0;
  const currentTurnoutRate = totalApprovedVoters > 0
    ? Math.round((totalVotesRecorded / totalApprovedVoters) * 1000) / 10
    : 0;

  let peakHour = 'N/A';
  let maxVotesInHour = 0;
  data.forEach(d => {
    if (d.votesCount > maxVotesInHour) {
      maxVotesInHour = d.votesCount;
      peakHour = d.hourLabel;
    }
  });

  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200 border-t-4 border-t-[#102a43] shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-slate-100 text-[#102a43]">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#102a43] tracking-tight">
              Hourly Voter Turnout Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time hourly ballot pacing and cumulative turnout velocity during official polling hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Election Picker */}
          {elections.length > 1 && (
            <select
              value={selectedElectionId}
              onChange={e => setSelectedElectionId(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#102a43]"
            >
              {elections.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.status.toUpperCase()})
                </option>
              ))}
            </select>
          )}

          {/* Chart display filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium border border-slate-200">
            <button
              type="button"
              onClick={() => setChartMode('both')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                chartMode === 'both' ? 'bg-white text-[#102a43] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setChartMode('rate')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                chartMode === 'rate' ? 'bg-white text-[#102a43] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Turnout %
            </button>
            <button
              type="button"
              onClick={() => setChartMode('votes')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                chartMode === 'votes' ? 'bg-white text-[#102a43] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hourly Votes
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadChartData(selectedElectionId)}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Refresh Turnout Chart"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Turnout Rate</span>
          </div>
          <div className="text-xl font-bold text-[#102a43]">
            {currentTurnoutRate}%
          </div>
          <p className="text-[10px] text-slate-500">Of approved voter register</p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Votes Processed</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {totalVotesRecorded} <span className="text-xs text-slate-500 font-normal">/ {totalApprovedVoters}</span>
          </div>
          <p className="text-[10px] text-slate-500">Sealed ballots recorded</p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Peak Activity Hour</span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {maxVotesInHour > 0 ? peakHour : 'Polling Open'}
          </div>
          <p className="text-[10px] text-slate-500">
            {maxVotesInHour > 0 ? `${maxVotesInHour} ballots logged` : 'Tracking hourly influx'}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Active Status</span>
          </div>
          <div className="text-sm font-bold text-slate-800 capitalize mt-1">
            {currentElection?.status || 'Active'}
          </div>
          <p className="text-[10px] text-[#102a43] font-medium">
            {currentElection?.status === 'open' ? 'Live voting window open' : 'Election period record'}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="turnoutRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#102a43" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#102a43" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis
              dataKey="hourLabel"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#102a43', fontSize: 11 }}
              unit="%"
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#486581', fontSize: 11 }}
              allowDecimals={false}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as HourlyTurnoutPoint;
                  return (
                    <div className="bg-[#102a43] text-white p-3 rounded-md shadow-md border border-slate-700 text-xs space-y-1.5">
                      <p className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Hour: {label}</span>
                      </p>
                      <div className="space-y-1 pt-1 border-t border-slate-600">
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Ballots in this hour:</span>
                          <span className="font-bold text-white font-mono">
                            {point.votesCount}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Cumulative ballots:</span>
                          <span className="font-bold text-white font-mono">
                            {point.cumulativeVotes}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-300">
                          <span>Turnout Rate:</span>
                          <span className="font-bold text-white font-mono">
                            {point.turnoutRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
            />

            {(chartMode === 'both' || chartMode === 'votes') && (
              <Bar
                yAxisId="right"
                dataKey="votesCount"
                name="Hourly Votes"
                fill="#486581"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            )}

            {(chartMode === 'both' || chartMode === 'rate') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="turnoutRate"
                name="Cumulative Turnout Rate (%)"
                stroke="#102a43"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#turnoutRateGradient)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyTurnoutChart;
