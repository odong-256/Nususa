import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Award,
  Search,
  Filter,
  X,
  RotateCcw,
  Building2,
  GraduationCap,
  Calendar,
  BookOpen,
  Phone
} from 'lucide-react';

const STANDARD_DEPARTMENTS = [
  'Medicine & Surgery',
  'Nursing Sciences',
  'Biomedical Sciences',
  'Computer Engineering',
  'Electrical Engineering',
  'Accounting & Finance',
  'Public Administration',
  'Agriculture & Biosystems',
  'Education'
];

const STANDARD_YEARS = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Postgraduate'
];

export const AdminCandidates: React.FC = () => {
  const { currentUser } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Form states matching specifications:
  const [fullName, setFullName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    setDepartment('');
    setYearOfStudy('Year 3');
    setPhoneNumber('');
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
    setDepartment(cand.department || '');
    setYearOfStudy(cand.yearOfStudy || '');
    setPhoneNumber(cand.phoneNumber || '');
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
        department: department.trim(),
        yearOfStudy: yearOfStudy.trim(),
        phoneNumber: phoneNumber.trim(),
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

  // Derive unique departments and years for the filter dropdowns
  const availableDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    candidates.forEach(c => {
      if (c.department && c.department.trim()) {
        deptSet.add(c.department.trim());
      }
    });
    STANDARD_DEPARTMENTS.forEach(d => deptSet.add(d));
    return Array.from(deptSet).sort();
  }, [candidates]);

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    candidates.forEach(c => {
      if (c.yearOfStudy && c.yearOfStudy.trim()) {
        yearSet.add(c.yearOfStudy.trim());
      }
    });
    STANDARD_YEARS.forEach(y => yearSet.add(y));
    return Array.from(yearSet);
  }, [candidates]);

  // Comprehensive candidate filtering
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // 1. Position filter
      if (selectedPositionFilter !== 'all' && cand.positionId !== selectedPositionFilter) {
        return false;
      }

      // 2. Department filter
      if (selectedDepartmentFilter !== 'all') {
        const targetDept = selectedDepartmentFilter.toLowerCase().trim();
        const candDept = (cand.department || '').toLowerCase().trim();
        const bioText = (cand.biography || '').toLowerCase();
        const qualText = (cand.qualifications || '').toLowerCase();
        if (
          candDept !== targetDept &&
          !candDept.includes(targetDept) &&
          !bioText.includes(targetDept) &&
          !qualText.includes(targetDept)
        ) {
          return false;
        }
      }

      // 3. Year of study filter
      if (selectedYearFilter !== 'all') {
        const targetYear = selectedYearFilter.toLowerCase().trim();
        const candYear = (cand.yearOfStudy || '').toLowerCase().trim();
        const bioText = (cand.biography || '').toLowerCase();
        const qualText = (cand.qualifications || '').toLowerCase();
        if (
          candYear !== targetYear &&
          !candYear.includes(targetYear) &&
          !bioText.includes(targetYear) &&
          !qualText.includes(targetYear)
        ) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const posTitle = positions.find(p => p.id === cand.positionId)?.title.toLowerCase() || '';
        const name = cand.fullName.toLowerCase();
        const candDept = (cand.department || '').toLowerCase();
        const candYear = (cand.yearOfStudy || '').toLowerCase();
        const slogan = (cand.slogan || '').toLowerCase();
        const bio = (cand.biography || '').toLowerCase();
        const qual = (cand.qualifications || '').toLowerCase();
        const exp = (cand.experience || '').toLowerCase();

        const matches =
          name.includes(q) ||
          candDept.includes(q) ||
          candYear.includes(q) ||
          posTitle.includes(q) ||
          slogan.includes(q) ||
          bio.includes(q) ||
          qual.includes(q) ||
          exp.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    candidates,
    positions,
    selectedPositionFilter,
    selectedDepartmentFilter,
    selectedYearFilter,
    searchQuery
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedPositionFilter !== 'all' ||
    selectedDepartmentFilter !== 'all' ||
    selectedYearFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPositionFilter('all');
    setSelectedDepartmentFilter('all');
    setSelectedYearFilter('all');
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
            Candidate Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register certified candidates, upload portraits, and publish manifestos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedElectionId}
            onChange={e => setSelectedElectionId(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-md bg-white shadow-xs focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden cursor-pointer"
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs space-y-3">
        {/* Top row: Search input + Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="candidate-search-input"
              type="text"
              placeholder="Search by candidate name, department, year, slogan, or bio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Position dropdown */}
          <div className="lg:col-span-3">
            <select
              id="candidate-position-filter"
              value={selectedPositionFilter}
              onChange={e => setSelectedPositionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden cursor-pointer font-medium text-slate-800 truncate"
            >
              <option value="all">All Positions ({candidates.length})</option>
              {positions.map(p => {
                const count = candidates.filter(c => c.positionId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Department dropdown */}
          <div className="lg:col-span-2">
            <select
              id="candidate-department-filter"
              value={selectedDepartmentFilter}
              onChange={e => setSelectedDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden cursor-pointer font-medium text-slate-800 truncate"
            >
              <option value="all">All Departments</option>
              {availableDepartments.map(dept => {
                const count = candidates.filter(c => {
                  const candDept = (c.department || '').toLowerCase();
                  const target = dept.toLowerCase();
                  return (
                    candDept === target ||
                    candDept.includes(target) ||
                    (c.biography || '').toLowerCase().includes(target) ||
                    (c.qualifications || '').toLowerCase().includes(target)
                  );
                }).length;
                return (
                  <option key={dept} value={dept}>
                    {dept} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Year of Study dropdown */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <select
              id="candidate-year-filter"
              value={selectedYearFilter}
              onChange={e => setSelectedYearFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden cursor-pointer font-medium text-slate-800"
            >
              <option value="all">All Years</option>
              {availableYears.map(y => {
                const count = candidates.filter(c => {
                  const candYear = (c.yearOfStudy || '').toLowerCase();
                  const target = y.toLowerCase();
                  return (
                    candYear === target ||
                    candYear.includes(target) ||
                    (c.biography || '').toLowerCase().includes(target) ||
                    (c.qualifications || '').toLowerCase().includes(target)
                  );
                }).length;
                return (
                  <option key={y} value={y}>
                    {y} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Reset All Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results summary & Active filter tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-900">
              Showing {filteredCandidates.length} of {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <span className="text-[11px] bg-slate-100 text-[#102a43] font-semibold px-2 py-0.5 rounded border border-slate-200">
                Filtered
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  Search: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedPositionFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[#102a43] text-[11px] font-medium border border-slate-200">
                  Office: {positions.find(p => p.id === selectedPositionFilter)?.title || 'Selected'}
                  <button
                    type="button"
                    onClick={() => setSelectedPositionFilter('all')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDepartmentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                  Dept: {selectedDepartmentFilter}
                  <button
                    type="button"
                    onClick={() => setSelectedDepartmentFilter('all')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedYearFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                  Year: {selectedYearFilter}
                  <button
                    type="button"
                    onClick={() => setSelectedYearFilter('all')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline px-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Position Filter Quick Pills */}
      {positions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedPositionFilter('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedPositionFilter === 'all'
                ? 'bg-[#102a43] text-white shadow-xs'
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
                className={`px-3 py-1 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedPositionFilter === pos.id
                    ? 'bg-[#102a43] text-white shadow-xs'
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
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 text-xs">
          Loading candidates...
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#102a43] text-base">
              {hasActiveFilters ? 'No Candidates Match Your Filters' : 'No Candidates Registered Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search query, or clear the department, year of study, or position filters to view all candidates.'
                : 'Click "Add Candidate" to register certified contestants and publish their manifestos.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white text-xs font-semibold rounded-md transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map(cand => {
            const pos = positions.find(p => p.id === cand.positionId);
            return (
              <div
                key={cand.id}
                className="bg-white rounded-lg border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="p-5 space-y-3">
                  <div className="flex gap-3.5 items-start">
                    {cand.photoUrl && cand.photoUrl.trim() ? (
                      <img
                        src={cand.photoUrl}
                        alt={cand.fullName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-md object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-[#102a43] text-white font-bold flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-lg tracking-wider">
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
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#102a43] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block truncate max-w-full">
                          {pos?.title || 'Contested Office'}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#102a43] text-sm truncate">
                        {cand.fullName}
                      </h3>

                      {cand.phoneNumber && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#102a43] truncate">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{cand.phoneNumber}</span>
                        </div>
                      )}

                      {cand.slogan && (
                        <p className="text-xs text-slate-500 italic line-clamp-1">
                          "{cand.slogan}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <p className="line-clamp-2">
                      <strong className="text-slate-800">Bio:</strong> {cand.biography || 'Profile on record.'}
                    </p>
                    <p className="line-clamp-1 text-slate-500">
                      <strong className="text-slate-700">Vision:</strong> {cand.vision || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#102a43] bg-white px-2.5 py-1 rounded border border-slate-200">
                    {cand.votesCount || 0} Votes
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(cand)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cand)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white cursor-pointer"
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
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Department & Year of Study Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Department
                  </label>
                  <input
                    type="text"
                    list="sun-departments-list"
                    placeholder="e.g. Medicine & Surgery, Computer Engineering..."
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
                  />
                  <datalist id="sun-departments-list">
                    {availableDepartments.map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Year of Study
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={e => setYearOfStudy(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white cursor-pointer"
                  >
                    <option value="">Select Year of Study (optional)</option>
                    {STANDARD_YEARS.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact / Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0764792499"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Photo URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
                  />
                </div>
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
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white"
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
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden bg-white font-mono"
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
              id="save-candidate-submit-btn"
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white rounded-md text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingCandidate ? 'Update Candidate' : 'Nominate Candidate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
