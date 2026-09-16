import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllVoters,
  approveVoter,
  rejectVoter,
  suspendVoter,
  bulkApproveVoters,
  updateUserRole,
  seedOfficialQualifiedVoters,
  createUserProfile
} from '../../services/voterService';
import { VoterProfile, UserStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  UserCheck,
  Search,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  ShieldCheck,
  Filter,
  CheckCheck,
  Check,
  X,
  Sparkles,
  AlertCircle,
  UserPlus,
  Shield,
  Database
} from 'lucide-react';

export const AdminVoters: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [voters, setVoters] = useState<VoterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') || 'all');

  // Checkbox-based Bulk Action States
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);
  const [bulkErrorMessage, setBulkErrorMessage] = useState<string | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Rejection / Suspension Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetVoter, setTargetVoter] = useState<VoterProfile | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'suspend'>('reject');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Add Missing Student Modal
  const [addMissingModalOpen, setAddMissingModalOpen] = useState(false);
  const [missingFullName, setMissingFullName] = useState('');
  const [missingEmail, setMissingEmail] = useState('');
  const [missingStudentId, setMissingStudentId] = useState('');
  const [missingMakeAdmin, setMissingMakeAdmin] = useState(false);
  const [submittingMissing, setSubmittingMissing] = useState(false);

  // Sync Official Certified Register
  const [syncingOfficial, setSyncingOfficial] = useState(false);

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

  const handleSyncOfficial = async () => {
    setSyncingOfficial(true);
    setBulkErrorMessage(null);
    try {
      const { added, updated } = await seedOfficialQualifiedVoters();
      setBulkSuccessMessage(
        `Certified Register Synchronized: ${added} new students qualified, ${updated} verified.`
      );
      await loadVoters();
    } catch (err: any) {
      console.error('Sync error:', err);
      setBulkErrorMessage('Failed to sync official roster: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncingOfficial(false);
    }
  };

  const handleCreateMissingVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = missingEmail.trim().toLowerCase();
    const cleanName = missingFullName.trim();
    const cleanId = missingStudentId.trim();

    if (!cleanEmail.endsWith('@sun.ac.ug')) {
      alert('Only institutional emails ending in "@sun.ac.ug" are authorized.');
      return;
    }

    setSubmittingMissing(true);
    try {
      const syntheticUid = `manual_${Date.now()}_${cleanId.replace(/[^a-zA-Z0-9]/g, '')}`;
      await createUserProfile(syntheticUid, cleanName, cleanEmail, cleanId);
      if (missingMakeAdmin) {
        await updateUserRole(syntheticUid, cleanEmail, 'admin');
      }
      setBulkSuccessMessage(
        `Added and approved student: ${cleanName} (${cleanEmail}) as ${missingMakeAdmin ? 'Admin' : 'Qualified Voter'}.`
      );
      setAddMissingModalOpen(false);
      setMissingFullName('');
      setMissingEmail('');
      setMissingStudentId('');
      setMissingMakeAdmin(false);
      await loadVoters();
    } catch (err: any) {
      console.error('Failed to create missing student:', err);
      alert('Error creating student: ' + (err.message || 'Check database permissions'));
    } finally {
      setSubmittingMissing(false);
    }
  };

  const handleToggleRole = async (voter: VoterProfile) => {
    if (!currentUser) return;
    const newRole = voter.role === 'admin' ? 'voter' : 'admin';
    const confirmMsg =
      newRole === 'admin'
        ? `Grant Administrator privileges to ${voter.fullName} (${voter.email})? They will be able to manage elections and view the admin dashboard.`
        : `Revoke Administrator privileges from ${voter.fullName}? They will be demoted to standard voter access.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateUserRole(voter.uid, voter.email, newRole);
      setBulkSuccessMessage(`Role of ${voter.email} successfully changed to ${newRole}.`);
      await loadVoters();
    } catch (err: any) {
      console.error('Role change error:', err);
      setBulkErrorMessage('Failed to update role: ' + (err.message || 'Check permissions'));
    }
  };

  const handleApprove = async (voter: VoterProfile) => {
    if (!currentUser) return;
    try {
      await approveVoter(voter.uid, currentUser.uid, currentUser.email || '');
      setSelectedVoterIds(prev => prev.filter(id => id !== voter.uid));
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

    setBulkProcessing(true);
    setBulkErrorMessage(null);
    try {
      const payload = pendingList.map(v => ({ uid: v.uid, email: v.email }));
      const result = await bulkApproveVoters(payload, currentUser.uid, currentUser.email || '');
      setBulkSuccessMessage(
        `Successfully approved all ${result.successCount} pending student(s) at once.`
      );
      setTimeout(() => setBulkSuccessMessage(null), 7000);
      setSelectedVoterIds([]);
      await loadVoters();
    } catch (err: any) {
      console.error('Batch approval error:', err);
      setBulkErrorMessage(err?.message || 'Failed to approve all pending voters.');
    } finally {
      setBulkProcessing(false);
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
      setSelectedVoterIds(prev => prev.filter(id => id !== targetVoter.uid));
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

  // Checkbox-based Selection Calculations
  const visiblePendingVoters = filteredVoters.filter(v => v.status === 'pending');
  const selectedPendingVoters = voters.filter(
    v => selectedVoterIds.includes(v.uid) && v.status === 'pending'
  );

  const isAllVisiblePendingSelected =
    visiblePendingVoters.length > 0 &&
    visiblePendingVoters.every(v => selectedVoterIds.includes(v.uid));

  const isSomeVisiblePendingSelected =
    visiblePendingVoters.some(v => selectedVoterIds.includes(v.uid)) &&
    !isAllVisiblePendingSelected;

  // Keep master checkbox indeterminate state in sync
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeVisiblePendingSelected;
    }
  }, [isSomeVisiblePendingSelected]);

  const handleToggleSelectVoter = (voterId: string) => {
    setSelectedVoterIds(prev =>
      prev.includes(voterId) ? prev.filter(id => id !== voterId) : [...prev, voterId]
    );
  };

  const handleToggleSelectAllVisiblePending = () => {
    if (isAllVisiblePendingSelected) {
      // Uncheck all visible pending
      const visibleIds = new Set(visiblePendingVoters.map(v => v.uid));
      setSelectedVoterIds(prev => prev.filter(id => !visibleIds.has(id)));
    } else {
      // Check all visible pending
      const newSelected = new Set(selectedVoterIds);
      visiblePendingVoters.forEach(v => newSelected.add(v.uid));
      setSelectedVoterIds(Array.from(newSelected));
    }
  };

  const handleSelectAllPendingInRegistry = () => {
    const allPending = voters.filter(v => v.status === 'pending');
    setSelectedVoterIds(allPending.map(v => v.uid));
  };

  const handleClearSelection = () => {
    setSelectedVoterIds([]);
  };

  const handleBulkApproveSelected = async () => {
    if (!currentUser) return;
    if (selectedPendingVoters.length === 0) {
      setBulkErrorMessage('No pending students selected to approve.');
      setTimeout(() => setBulkErrorMessage(null), 5000);
      return;
    }

    setBulkProcessing(true);
    setBulkErrorMessage(null);
    try {
      const payload = selectedPendingVoters.map(v => ({ uid: v.uid, email: v.email }));
      const result = await bulkApproveVoters(payload, currentUser.uid, currentUser.email || '');

      setBulkSuccessMessage(
        `Successfully approved ${result.successCount} selected student(s) at once. Their voting accounts are now active.`
      );
      setTimeout(() => setBulkSuccessMessage(null), 7000);

      // Remove approved voters from selection
      const approvedIds = new Set(selectedPendingVoters.map(v => v.uid));
      setSelectedVoterIds(prev => prev.filter(id => !approvedIds.has(id)));
      await loadVoters();
    } catch (err: any) {
      console.error('Bulk approve error:', err);
      setBulkErrorMessage(err?.message || 'Failed to approve selected voters. Please try again.');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
            Voter Registry & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit student identities, verify enrollment statuses, and approve voting privileges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncOfficial}
            disabled={syncingOfficial}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-md text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Populate or update certified 43 qualified voters"
          >
            <Database className={`w-3.5 h-3.5 text-[#102a43] ${syncingOfficial ? 'animate-spin' : ''}`} />
            <span>{syncingOfficial ? 'Syncing...' : 'Sync 43 Certified Voters'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAddMissingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Missing Student</span>
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleBatchApprovePending}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Pending ({pendingCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadVoters}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Download / Bulk Error Banner */}
      {bulkErrorMessage && (
        <div
          id="bulk-error-alert"
          className="p-3.5 bg-rose-50 border border-rose-300 rounded-md flex items-center justify-between text-xs text-rose-900 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Bulk Action Error:</strong> {bulkErrorMessage}
            </span>
          </div>
          <button
            onClick={() => setBulkErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-4 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bulk Success Banner */}
      {bulkSuccessMessage && (
        <div
          id="bulk-success-alert"
          className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md flex items-center justify-between text-xs text-emerald-900 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Success:</strong> {bulkSuccessMessage}
            </span>
          </div>
          <button
            onClick={() => setBulkSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="voter-search-input"
            type="text"
            placeholder="Search by student name, @sun.ac.ug email, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                className={`px-3 py-1 rounded-md font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#102a43] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkbox-based Bulk Action Toolbar */}
      {selectedVoterIds.length > 0 && (
        <div
          id="bulk-actions-toolbar"
          className="bg-[#102a43] text-white p-4 rounded-lg shadow-xs border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/20">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {selectedVoterIds.length} Student{selectedVoterIds.length !== 1 ? 's' : ''} Selected
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  {selectedPendingVoters.length} Pending Approval
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedPendingVoters.length > 0
                  ? `Grant certified electoral voting privileges to the ${selectedPendingVoters.length} selected pending student${selectedPendingVoters.length !== 1 ? 's' : ''}.`
                  : 'Selected students are already approved or have non-pending status.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingCount > selectedPendingVoters.length && (
              <button
                type="button"
                id="select-all-pending-btn"
                onClick={handleSelectAllPendingInRegistry}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                Select All Pending ({pendingCount})
              </button>
            )}

            <button
              type="button"
              id="clear-selection-btn"
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
            >
              Clear Selection
            </button>

            <button
              type="button"
              id="bulk-approve-selected-btn"
              data-testid="bulk-approve-selected-btn"
              onClick={handleBulkApproveSelected}
              disabled={bulkProcessing || selectedPendingVoters.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-[#102a43] font-bold rounded-md text-xs shadow-xs transition-all cursor-pointer"
              title={
                selectedPendingVoters.length === 0
                  ? 'No pending students among the selected records'
                  : `Approve ${selectedPendingVoters.length} pending student(s) at once`
              }
            >
              <CheckCircle className={`w-3.5 h-3.5 ${bulkProcessing ? 'animate-spin' : ''}`} />
              <span>
                {bulkProcessing
                  ? 'Approving Students...'
                  : `Approve Selected (${selectedPendingVoters.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Voters Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 text-xs">
          Loading voter registry records...
        </div>
      ) : filteredVoters.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 space-y-2 text-xs">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-[#102a43] text-sm">No Voter Records Match</h3>
          <p className="text-slate-400">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-[#102a43] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="w-12 py-3.5 pl-4 pr-2">
                    <div className="flex items-center justify-center">
                      <input
                        ref={headerCheckboxRef}
                        id="select-all-voters-checkbox"
                        type="checkbox"
                        checked={isAllVisiblePendingSelected}
                        onChange={handleToggleSelectAllVisiblePending}
                        disabled={visiblePendingVoters.length === 0}
                        title={
                          visiblePendingVoters.length === 0
                            ? 'No pending students in this view'
                            : isAllVisiblePendingSelected
                            ? 'Deselect all visible pending students'
                            : 'Select all visible pending students'
                        }
                        className="w-4 h-4 rounded text-[#102a43] focus:ring-[#102a43] border-slate-300 disabled:opacity-40 cursor-pointer"
                      />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Institutional Email</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered On</th>
                  <th className="py-3.5 px-4 text-right">Electoral Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVoters.map(voter => {
                  const isChecked = selectedVoterIds.includes(voter.uid);
                  const isRootAdminUser = voter.email?.toLowerCase() === '2301600199@sun.ac.ug';
                  return (
                    <tr
                      key={voter.uid}
                      className={`transition-colors ${
                        isChecked
                          ? 'bg-slate-50 hover:bg-slate-100'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="w-12 py-3 pl-4 pr-2">
                        <div className="flex items-center justify-center">
                          <input
                            id={`select-voter-${voter.uid}`}
                            data-testid={`select-voter-${voter.uid}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectVoter(voter.uid)}
                            aria-label={`Select student ${voter.fullName}`}
                            className="w-4 h-4 rounded text-[#102a43] focus:ring-[#102a43] border-slate-300 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="font-bold text-[#102a43]">{voter.fullName}</div>
                          {voter.role === 'admin' && (
                            <span className="text-[10px] bg-slate-800 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" />
                              {isRootAdminUser ? 'Chief Admin' : 'Admin'}
                            </span>
                          )}
                          {voter.status === 'pending' && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                        </div>
                        {voter.course && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {voter.course} {voter.yearOfStudy ? `• Year ${voter.yearOfStudy}` : ''}
                          </p>
                        )}
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
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {voter.email}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {voter.studentId || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          voter.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {voter.role === 'admin' ? 'Admin Officer' : 'Voter'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={voter.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {voter.createdAt ? new Date(voter.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Role Toggle Button */}
                          {!isRootAdminUser && (
                            <button
                              id={`toggle-role-${voter.uid}`}
                              type="button"
                              onClick={() => handleToggleRole(voter)}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                voter.role === 'admin'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              }`}
                              title={voter.role === 'admin' ? 'Revoke Admin' : 'Grant Admin Privileges'}
                            >
                              {voter.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                          )}

                          {voter.status !== 'approved' && (
                            <button
                              id={`approve-voter-${voter.uid}`}
                              type="button"
                              onClick={() => handleApprove(voter)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
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
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
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
                              className="px-2.5 py-1 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
                              title="Suspend Voter"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bottom Bulk Action Pill (Visible when scrolled) */}
      {selectedVoterIds.length > 0 && (
        <div
          id="floating-bulk-actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-auto max-w-xl bg-[#102a43] text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center justify-between sm:justify-start gap-4"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
              {selectedVoterIds.length} selected ({selectedPendingVoters.length} pending)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="floating-clear-selection-btn"
              onClick={handleClearSelection}
              className="text-xs text-slate-300 hover:text-white px-2 py-1 cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              id="floating-bulk-approve-btn"
              onClick={handleBulkApproveSelected}
              disabled={bulkProcessing || selectedPendingVoters.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-[#102a43] font-bold rounded-md text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle className={`w-3.5 h-3.5 ${bulkProcessing ? 'animate-spin' : ''}`} />
              <span>
                {bulkProcessing
                  ? 'Approving...'
                  : `Approve (${selectedPendingVoters.length})`}
              </span>
            </button>
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
          <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-900 text-xs">
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
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className={`px-4 py-2 text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer ${
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

      {/* ADD MISSING STUDENT / ADMIN MODAL */}
      <Modal
        isOpen={addMissingModalOpen}
        onClose={() => setAddMissingModalOpen(false)}
        title="Add Missing Student to Qualified Database"
        subtitle="Manually enroll and qualify a student omitted from the automatic register"
        maxWidth="md"
      >
        <form onSubmit={handleCreateMissingVoter} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 text-emerald-900 text-xs">
            Students added here will be automatically approved with immediate voter eligibility. You can also optionally designate them as an Electoral Commission Administrator.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OKOT EMMANUEL"
              value={missingFullName}
              onChange={e => setMissingFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email (@sun.ac.ug) *
              </label>
              <input
                type="email"
                required
                placeholder="2301600... @sun.ac.ug"
                value={missingEmail}
                onChange={e => setMissingEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registration / Student ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2301600199"
                value={missingStudentId}
                onChange={e => setMissingStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <input
                type="checkbox"
                checked={missingMakeAdmin}
                onChange={e => setMissingMakeAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-[#102a43] focus:ring-[#102a43] border-slate-300"
              />
              <span>Grant Administrator access (allow viewing and managing Admin Dashboard)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddMissingModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingMissing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingMissing ? 'Adding...' : 'Add & Qualify Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
