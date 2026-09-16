import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllElections,
  createElection,
  updateElection,
  deleteElection,
  updateElectionStatus,
  seedInitialNUSUSADataIfNeeded
} from '../../services/electionService';
import { Election, ElectionStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Calendar,
  Plus,
  Play,
  Square,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  FileText,
  Sparkles
} from 'lucide-react';

export const AdminElections: React.FC = () => {
  const { currentUser } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ElectionStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getAllElections();
      setElections(all || []);
    } catch (err) {
      console.error('Error fetching elections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingElection(null);
    setTitle('');
    setDescription('');
    setAcademicYear('2026/2027');
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setStartDate(now.toISOString().slice(0, 16));
    setEndDate(nextWeek.toISOString().slice(0, 16));
    setStatus('draft');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (elec: Election) => {
    setEditingElection(elec);
    setTitle(elec.title);
    setDescription(elec.description);
    setAcademicYear(elec.academicYear);
    setStartDate(elec.startDate.slice(0, 16));
    setEndDate(elec.endDate.slice(0, 16));
    setStatus(elec.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setSaving(true);

    try {
      if (editingElection) {
        await updateElection(
          editingElection.id,
          {
            title,
            description,
            academicYear,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            status
          },
          currentUser.uid,
          currentUser.email || ''
        );
      } else {
        await createElection(
          {
            title,
            description,
            academicYear,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            status
          },
          currentUser.uid,
          currentUser.email || ''
        );
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Save election error:', err);
      setError(err.message || 'Failed to save election configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (elec: Election, newStatus: ElectionStatus) => {
    if (!currentUser) return;
    try {
      await updateElectionStatus(elec.id, newStatus, currentUser.uid, currentUser.email || '');
      await loadData();
    } catch (err) {
      console.error('Error changing election status:', err);
    }
  };

  const handleDelete = async (elec: Election) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to delete the election "${elec.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteElection(elec.id, currentUser.uid, currentUser.email || '');
      await loadData();
    } catch (err: any) {
      console.error('Error deleting election:', err);
      alert(err.message || 'Failed to delete election.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
            Elections Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure electoral cycles, start/stop polling windows, and adjust statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Populate/update the official NUSUSA 2026/2027 election with all 22 positions and candidates from the gazette?')) return;
              setLoading(true);
              try {
                await seedInitialNUSUSADataIfNeeded(true, true);
                await loadData();
                alert('Official NUSUSA 2026/2027 Election with 22 positions synced successfully!');
              } catch (e: any) {
                alert('Error syncing: ' + e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#102a43] font-semibold rounded-md text-xs border border-slate-300 shadow-xs transition-all cursor-pointer"
            title="Populate/Update Official NUSUSA 22-position election"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Sync Official 22 Offices</span>
          </button>

          <button
            id="create-election-btn"
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Election</span>
          </button>
        </div>
      </div>

      {/* Elections List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 text-xs">
          Loading elections...
        </div>
      ) : elections.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 space-y-4">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-[#102a43] text-base">No Elections Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first student union election or populate standard university elections.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-xs shadow-xs"
            >
              Create New Election
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await seedInitialNUSUSADataIfNeeded(true);
                  await loadData();
                } catch (e: any) {
                  alert('Error initializing sample data: ' + e.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#102a43] font-semibold rounded-md text-xs border border-slate-300 shadow-xs"
            >
              Load Sample 2026/2027 Election
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {elections.map(elec => (
            <div
              key={elec.id}
              className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={elec.status} size="md" />
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    AY {elec.academicYear}
                  </span>
                  <span className="text-xs font-semibold text-[#102a43] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {elec.totalVotesCount || 0} Total Ballots
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#102a43] tracking-tight">
                  {elec.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {elec.description}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>
                    <strong className="text-slate-700">Polling Starts:</strong> {new Date(elec.startDate).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-700">Polling Closes:</strong> {new Date(elec.endDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status & Lifecycle Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                {elec.status !== 'open' && (
                  <button
                    id={`start-election-${elec.id}`}
                    type="button"
                    onClick={() => handleStatusChange(elec, 'open')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Start Election (Open Polling)"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Start Polling</span>
                  </button>
                )}

                {elec.status === 'open' && (
                  <button
                    id={`end-election-${elec.id}`}
                    type="button"
                    onClick={() => handleStatusChange(elec, 'closed')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="End Election (Close Polling)"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>End Election</span>
                  </button>
                )}

                {elec.status === 'closed' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(elec, 'archived')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Archive Election"
                  >
                    <Archive className="w-3 h-3" />
                    <span>Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openEditModal(elec)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(elec)}
                  className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Election"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingElection ? 'Edit Election' : 'Create New Election'}
        subtitle="Manage academic dates, titles, and electoral statuses"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Election Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NUSUSA General Guild & Faculty Elections"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <input
                type="text"
                required
                placeholder="2026/2027"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ElectionStatus)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white cursor-pointer"
              >
                <option value="draft">Draft (Planning)</option>
                <option value="scheduled">Scheduled</option>
                <option value="open">Open (Voting Active)</option>
                <option value="closed">Closed (Voting Ended)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Scope
            </label>
            <textarea
              rows={3}
              required
              placeholder="Official details regarding voting eligibility and contest scopes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-election-submit-btn"
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white rounded-md text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingElection ? 'Update Election' : 'Create Election'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
