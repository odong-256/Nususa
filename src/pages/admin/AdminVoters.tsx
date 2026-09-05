import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllVoters,
  approveVoter,
  rejectVoter,
  suspendVoter
} from '../../services/voterService';
import { VoterProfile, UserStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  ShieldCheck,
  Filter,
  CheckCheck
} from 'lucide-react';

export const AdminVoters: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [voters, setVoters] = useState<VoterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') || 'all');

  // Rejection / Suspension Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetVoter, setTargetVoter] = useState<VoterProfile | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'suspend'>('reject');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadVoters = async () => {
    setLoading(true);
    try {
      const all = await getAllVoters();
      setVoters(all || []);
    } catch (err) {
      console.error('Error fetching voters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoters();
  }, []);

  const handleApprove = async (voter: VoterProfile) => {
    if (!currentUser) return;
    try {
      await approveVoter(voter.uid, currentUser.uid, currentUser.email || '');
      await loadVoters();
    } catch (err: any) {
      console.error('Approval error:', err);
      alert('Failed to approve voter: ' + (err.message || 'Unknown error'));
    }
  };

  const handleBatchApprovePending = async () => {
    if (!currentUser) return;
    const pendingList = voters.filter(v => v.status === 'pending');
    if (pendingList.length === 0) {
      alert('No pending voters found to approve.');
      return;
    }
    if (!window.confirm(`Approve all ${pendingList.length} pending student registrations at once?`)) {
      return;
    }

    setLoading(true);
    try {
      for (const v of pendingList) {
        await approveVoter(v.uid, currentUser.uid, currentUser.email || '');
      }
      await loadVoters();
    } catch (err: any) {
      console.error('Batch approval error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (voter: VoterProfile, type: 'reject' | 'suspend') => {
    setTargetVoter(voter);
    setActionType(type);
    setActionReason('');
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !targetVoter) return;
    setSubmittingAction(true);

    try {
      if (actionType === 'reject') {
        await rejectVoter(
          targetVoter.uid,
          actionReason || 'Institutional records mismatch',
          currentUser.uid,
          currentUser.email || ''
        );
      } else {
        await suspendVoter(
          targetVoter.uid,
          actionReason || 'Pending disciplinary review',
          currentUser.uid,
          currentUser.email || ''
        );
      }
      setActionModalOpen(false);
      await loadVoters();
    } catch (err: any) {
      console.error('Status action error:', err);
      alert(err.message || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredVoters = voters.filter(voter => {
    const matchesStatus = statusFilter === 'all' || voter.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      voter.fullName.toLowerCase().includes(query) ||
      voter.email.toLowerCase().includes(query) ||
      (voter.studentId && voter.studentId.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  const pendingCount = voters.filter(v => v.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Voter Registry & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit student identities, verify enrollment statuses, and approve voting privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleBatchApprovePending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Pending ({pendingCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadVoters}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="voter-search-input"
            type="text"
            placeholder="Search by student name, @sun.ac.ug email, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-slate-50/60"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map(st => {
            const count = st === 'all' ? voters.length : voters.filter(v => v.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Voters Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Loading voter registry records...
        </div>
      ) : filteredVoters.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2 text-xs">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Voter Records Match</h3>
          <p className="text-slate-400">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-6">Student Details</th>
                  <th className="py-4 px-6">Institutional Email</th>
                  <th className="py-4 px-6">Student ID</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Registered On</th>
                  <th className="py-4 px-6 text-right">Electoral Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVoters.map(voter => (
                  <tr key={voter.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{voter.fullName}</div>
                      {voter.rejectionReason && (
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Reason: {voter.rejectionReason}
                        </p>
                      )}
                      {voter.suspensionReason && (
                        <p className="text-[11px] text-amber-600 mt-0.5">
                          Suspended: {voter.suspensionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {voter.email}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700">
                      {voter.studentId || 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={voter.status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                      {voter.createdAt ? new Date(voter.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {voter.status !== 'approved' && (
                          <button
                            id={`approve-voter-${voter.uid}`}
                            type="button"
                            onClick={() => handleApprove(voter)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Approve Voter"
                          >
                            Approve
                          </button>
                        )}

                        {voter.status !== 'rejected' && (
                          <button
                            id={`reject-voter-${voter.uid}`}
                            type="button"
                            onClick={() => openActionModal(voter, 'reject')}
                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Reject Voter"
                          >
                            Reject
                          </button>
                        )}

                        {voter.status !== 'suspended' && (
                          <button
                            id={`suspend-voter-${voter.uid}`}
                            type="button"
                            onClick={() => openActionModal(voter, 'suspend')}
                            className="px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Suspend Voter"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECT / SUSPEND MODAL */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === 'reject' ? 'Reject Student Voter Account' : 'Suspend Voter Privileges'}
        subtitle={`Voter: ${targetVoter?.fullName} (${targetVoter?.email})`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
            This action will update the voter's status and generate an immutable entry in the system audit log.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Official Justification / Reason
            </label>
            <textarea
              rows={3}
              required
              placeholder={
                actionType === 'reject'
                  ? 'e.g. Student ID does not match the active semester enrollment register.'
                  : 'e.g. Investigation underway into credential duplication.'
              }
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 outline-hidden bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer ${
                actionType === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submittingAction ? 'Processing...' : `Confirm ${actionType === 'reject' ? 'Rejection' : 'Suspension'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
