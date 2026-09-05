import React, { useEffect, useState } from 'react';
import { getRecentAuditLogs } from '../../services/auditService';
import { AuditLog } from '../../types';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  ShieldCheck,
  Filter,
  Clock,
  User,
  Activity
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getRecentAuditLogs(100);
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesCategory = selectedCategory === 'all' || log.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      log.action.toLowerCase().includes(query) ||
      log.performedByEmail.toLowerCase().includes(query) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (action.includes('REJECTED')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (action.includes('SUSPENDED')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (action.includes('STARTED') || action.includes('OPEN')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (action.includes('ENDED') || action.includes('CLOSED')) return 'bg-slate-100 text-slate-800 border-slate-300';
    return 'bg-purple-50 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable log of administrative operations, identity approvals, and status transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action name, admin email, or detail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden bg-slate-50/60"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['all', 'voter', 'election', 'position', 'candidate', 'ballot', 'security'].map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Fetching cryptographic audit logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2 text-xs">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Audit Logs Found</h3>
          <p className="text-slate-400">All recorded administrative operations will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Action Triggered</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Admin Officer</th>
                  <th className="py-4 px-6">Action Payload & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{log.performedByEmail}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-sm">
                      <pre className="text-[11px] overflow-x-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {JSON.stringify(log.details || {}, null, 2)}
                      </pre>
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
