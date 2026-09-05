import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  getCandidatesByElection,
  createCandidate,
  updateCandidate,
  deleteCandidate
} from '../../services/electionService';
import { uploadCandidatePhoto } from '../../services/storageService';
import { Election, Position, Candidate } from '../../types';
import { Modal } from '../../components/Modal';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Image,
  AlertCircle,
  Eye,
  CheckCircle2,
  Award
} from 'lucide-react';

export const AdminCandidates: React.FC = () => {
  const { currentUser } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Form states matching prompt specifications:
  // Name, Position, Bio, Manifesto, Academic qualifications, Experience, Vision, Mission, Objectives, Slogan, Photo
  const [fullName, setFullName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [biography, setBiography] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [objectives, setObjectives] = useState('');
  const [manifesto, setManifesto] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadElections = async () => {
    try {
      const allElec = await getAllElections();
      setElections(allElec || []);
      if (allElec && allElec.length > 0 && !selectedElectionId) {
        setSelectedElectionId(allElec[0].id);
      }
    } catch (err) {
      console.error('Error loading elections:', err);
    }
  };

  const loadData = async (elecId: string) => {
    if (!elecId) return;
    setLoading(true);
    try {
      const [pos, cands] = await Promise.all([
        getPositionsByElection(elecId),
        getCandidatesByElection(elecId)
      ]);
      setPositions(pos || []);
      setCandidates(cands || []);
    } catch (err) {
      console.error('Error loading candidates/positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadData(selectedElectionId);
    }
  }, [selectedElectionId]);

  const openCreateModal = () => {
    setEditingCandidate(null);
    setFullName('');
    setPositionId(positions.length > 0 ? positions[0].id : '');
    setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
    setSlogan('');
    setBiography('');
    setQualifications('');
    setExperience('');
    setVision('');
    setMission('');
    setObjectives('');
    setManifesto('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cand: Candidate) => {
    setEditingCandidate(cand);
    setFullName(cand.fullName);
    setPositionId(cand.positionId);
    setPhotoUrl(cand.photoUrl || '');
    setSlogan(cand.slogan || '');
    setBiography(cand.biography || '');
    setQualifications(cand.qualifications || '');
    setExperience(cand.experience || '');
    setVision(cand.vision || '');
    setMission(cand.mission || '');
    setObjectives(cand.objectives || '');
    setManifesto(cand.manifesto || '');
    setError(null);
    setModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const downloadUrl = await uploadCandidatePhoto(file, selectedElectionId);
      setPhotoUrl(downloadUrl);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo: ' + (err.message || 'Unknown error.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedElectionId || !positionId) return;
    setError(null);
    setSaving(true);

    try {
      const candidatePayload = {
        electionId: selectedElectionId,
        positionId,
        fullName: fullName.trim(),
        photoUrl: photoUrl.trim(),
        slogan: slogan.trim(),
        biography: biography.trim(),
        qualifications: qualifications.trim(),
        experience: experience.trim(),
        vision: vision.trim(),
        mission: mission.trim(),
        objectives: objectives.trim(),
        manifesto: manifesto.trim()
      };

      if (editingCandidate) {
        await updateCandidate(
          editingCandidate.id,
          candidatePayload,
          currentUser.uid,
          currentUser.email || ''
        );
      } else {
        await createCandidate(
          candidatePayload,
          currentUser.uid,
          currentUser.email || ''
        );
      }

      setModalOpen(false);
      await loadData(selectedElectionId);
    } catch (err: any) {
      console.error('Save candidate error:', err);
      setError(err.message || 'Failed to save candidate dossier.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cand: Candidate) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to delete candidate "${cand.fullName}"?`)) {
      return;
    }
    try {
      await deleteCandidate(cand.id, currentUser.uid, currentUser.email || '');
      await loadData(selectedElectionId);
    } catch (err: any) {
      console.error('Delete candidate error:', err);
      alert(err.message || 'Failed to delete candidate.');
    }
  };

  const filteredCandidates = selectedPositionFilter === 'all'
    ? candidates
    : candidates.filter(c => c.positionId === selectedPositionFilter);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register certified candidates, upload portraits, and publish manifestos.
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
                {e.title}
              </option>
            ))}
          </select>

          <button
            id="add-candidate-btn"
            type="button"
            onClick={openCreateModal}
            disabled={!selectedElectionId || positions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Position Filter Pills */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedPositionFilter('all')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
              selectedPositionFilter === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Offices ({candidates.length})
          </button>
          {positions.map(pos => {
            const count = candidates.filter(c => c.positionId === pos.id).length;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => setSelectedPositionFilter(pos.id)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedPositionFilter === pos.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pos.title} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Candidates Cards Grid */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Loading candidates...
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Candidates in this Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Candidate" to register certified contestants and their manifestos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map(cand => {
            const pos = positions.find(p => p.id === cand.positionId);
            return (
              <div
                key={cand.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="p-6 space-y-4">
                  <div className="flex gap-4 items-start">
                    {cand.photoUrl && cand.photoUrl.trim() ? (
                      <img
                        src={cand.photoUrl}
                        alt={cand.fullName}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-900 text-amber-300 font-extrabold flex flex-col items-center justify-center shrink-0 border border-emerald-700/40 shadow-xs">
                        <span className="text-xl tracking-wider">
                          {cand.fullName
                            .split(' ')
                            .map(n => n[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 inline-block truncate max-w-full">
                        {pos?.title || 'Contested Office'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {cand.fullName}
                      </h3>
                      {cand.slogan && (
                        <p className="text-xs text-slate-500 italic line-clamp-1">
                          "{cand.slogan}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <p className="line-clamp-2">
                      <strong>Bio:</strong> {cand.biography || 'Profile on record.'}
                    </p>
                    <p className="line-clamp-1 text-slate-500">
                      <strong>Vision:</strong> {cand.vision || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                    {cand.votesCount || 0} Votes
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(cand)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cand)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CANDIDATE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCandidate ? 'Edit Candidate Dossier' : 'Nominate New Candidate'}
        subtitle="Complete student profile, photo, and official manifesto"
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo & Basic Details */}
          <div className="flex flex-col sm:flex-row gap-6 items-start pb-4 border-b border-slate-100">
            {/* Photo Avatar & Upload */}
            <div className="space-y-2 shrink-0">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Candidate Photo
              </label>
              <div className="relative">
                {photoUrl && photoUrl.trim() ? (
                  <img
                    src={photoUrl}
                    alt="Candidate preview"
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <Users className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center text-white text-xs">
                    Uploading...
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Basic Info Fields */}
            <div className="space-y-4 flex-1 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ssekandi Emmanuel"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Elective Position
                  </label>
                  <select
                    required
                    value={positionId}
                    onChange={e => setPositionId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white cursor-pointer"
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Campaign Slogan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Integrity, Service & Transformative Leadership"
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Photo URL (optional direct link)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Dossier Tabs / Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Candidate Biography
              </label>
              <textarea
                rows={2}
                placeholder="Background, faculty, and academic discipline..."
                value={biography}
                onChange={e => setBiography(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Qualifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Degrees, diploma, certification..."
                  value={qualifications}
                  onChange={e => setQualifications(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Leadership Experience
                </label>
                <textarea
                  rows={2}
                  placeholder="Prior clubs, societies, associations..."
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Vision Statement
                </label>
                <textarea
                  rows={2}
                  placeholder="Long-term vision for NUSUSA..."
                  value={vision}
                  onChange={e => setVision(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mission Statement
                </label>
                <textarea
                  rows={2}
                  placeholder="Direct actionable pledge..."
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Key Objectives
              </label>
              <textarea
                rows={2}
                placeholder="1. Tuition deadline grace period 2. Campus Wi-Fi upgrade..."
                value={objectives}
                onChange={e => setObjectives(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Electoral Manifesto
              </label>
              <textarea
                rows={4}
                placeholder="Detailed manifesto document for the student body..."
                value={manifesto}
                onChange={e => setManifesto(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white font-mono text-xs"
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
              id="save-candidate-submit-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingCandidate ? 'Update Candidate' : 'Nominate Candidate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
