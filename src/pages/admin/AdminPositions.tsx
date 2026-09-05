import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  createPosition,
  updatePosition,
  deletePosition
} from '../../services/electionService';
import { Election, Position } from '../../types';
import { Modal } from '../../components/Modal';
import { Layers, Plus, Edit2, Trash2, ArrowUpDown, Award, AlertCircle } from 'lucide-react';

export const AdminPositions: React.FC = () => {
  const { currentUser } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [maxWinners, setMaxWinners] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadElections = async () => {
    try {
      const allElec = await getAllElections();
      setElections(allElec || []);
      if (allElec && allElec.length > 0 && !selectedElectionId) {
        setSelectedElectionId(allElec[0].id);
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
    }
  };

  const loadPositions = async (elecId: string) => {
    if (!elecId) return;
    setLoading(true);
    try {
      const pos = await getPositionsByElection(elecId);
      setPositions(pos || []);
    } catch (err) {
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadPositions(selectedElectionId);
    }
  }, [selectedElectionId]);

  const openCreateModal = () => {
    setEditingPosition(null);
    setTitle('');
    setDescription('');
    setOrder((positions.length || 0) + 1);
    setMaxWinners(1);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (pos: Position) => {
    setEditingPosition(pos);
    setTitle(pos.title);
    setDescription(pos.description || '');
    setOrder(pos.order);
    setMaxWinners(pos.maxWinners || 1);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedElectionId) return;
    setError(null);
    setSaving(true);

    try {
      if (editingPosition) {
        await updatePosition(
          editingPosition.id,
          {
            title,
            description,
            order: Number(order),
            maxWinners: Number(maxWinners)
          },
          currentUser.uid,
          currentUser.email || ''
        );
      } else {
        await createPosition(
          {
            electionId: selectedElectionId,
            title,
            description,
            order: Number(order),
            maxWinners: Number(maxWinners)
          },
          currentUser.uid,
          currentUser.email || ''
        );
      }
      setModalOpen(false);
      await loadPositions(selectedElectionId);
    } catch (err: any) {
      console.error('Save position error:', err);
      setError(err.message || 'Failed to save position.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pos: Position) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to delete the elective position "${pos.title}"?`)) {
      return;
    }
    try {
      await deletePosition(pos.id, currentUser.uid, currentUser.email || '');
      await loadPositions(selectedElectionId);
    } catch (err: any) {
      console.error('Error deleting position:', err);
      alert(err.message || 'Failed to delete position.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Election Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Position Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize elective offices, display ordering, and seats available.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedElectionId}
            onChange={e => setSelectedElectionId(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-emerald-600 outline-hidden cursor-pointer"
          >
            {elections.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>

          <button
            id="add-position-btn"
            type="button"
            onClick={openCreateModal}
            disabled={!selectedElectionId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {/* Positions List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Loading positions...
        </div>
      ) : positions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Positions Added Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Position" to establish the elective posts for this election (e.g. Guild President, Vice President).
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-6 w-20">Order</th>
                <th className="py-4 px-6">Position Title</th>
                <th className="py-4 px-6">Scope & Description</th>
                <th className="py-4 px-6 text-center">Number of Winners</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map(pos => (
                <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {pos.order}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{pos.title}</td>
                  <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                    {pos.description || 'Standard executive role'}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-xs">
                      <Award className="w-3 h-3 text-amber-600" />
                      <span>{pos.maxWinners || 1} Seat</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(pos)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Position"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pos)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPosition ? 'Edit Position' : 'Add Elective Position'}
        subtitle="Specify office title, priority order, and winner allocation"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Position Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Guild President"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Responsibilities
            </label>
            <textarea
              rows={2}
              placeholder="Brief overview of duties..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                required
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Number of Winners
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxWinners}
                onChange={e => setMaxWinners(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-position-submit-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingPosition ? 'Update Position' : 'Add Position'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
