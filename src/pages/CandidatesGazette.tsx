import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  getCandidatesByElection,
  OFFICIAL_NUSUSA_2026_POSITIONS,
  seedInitialNUSUSADataIfNeeded
} from '../services/electionService';
import { Election, Position, Candidate } from '../types';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateProfileModal } from '../components/CandidateProfileModal';
import {
  Vote,
  Award,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Eye,
  ShieldCheck,
  Building2,
  Printer
} from 'lucide-react';

export const CandidatesGazette: React.FC = () => {
  const { currentUser, isApproved, isAdmin } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and display
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nominated' | 'vacant'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal profile
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidatePosition, setSelectedCandidatePosition] = useState<Position | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allElec = await getAllElections();
        setElections(allElec || []);

        if (allElec && allElec.length > 0) {
          const active = allElec.find(e => e.status === 'open') || allElec[0];
          setSelectedElection(active);

          const [pos, cands] = await Promise.all([
            getPositionsByElection(active.id),
            getCandidatesByElection(active.id)
          ]);

          // Sort positions by order
          const sortedPositions = (pos || []).sort((a, b) => a.order - b.order);
          if (sortedPositions.length > 0) {
            setPositions(sortedPositions);
            setCandidates(cands || []);
            setLoading(false);
            return;
          }
        }

        // Fallback: Populate with official gazette data from the user reference
        const fallbackPositions: Position[] = OFFICIAL_NUSUSA_2026_POSITIONS.map(p => ({
          id: `gazette-pos-${p.order}`,
          electionId: 'nususa-2026-official',
          title: p.title,
          order: p.order,
          description: `Official NUSUSA Leadership Office #${p.order}`,
          maxChoices: 1,
          createdAt: new Date().toISOString()
        }));

        const fallbackCandidates: Candidate[] = OFFICIAL_NUSUSA_2026_POSITIONS
          .filter(p => p.candidateName !== null)
          .map(p => ({
            id: `gazette-cand-${p.order}`,
            electionId: 'nususa-2026-official',
            positionId: `gazette-pos-${p.order}`,
            fullName: p.candidateName!,
            photoUrl: '',
            slogan: '',
            biography: '',
            qualifications: '',
            experience: '',
            vision: '',
            mission: '',
            objectives: '',
            manifesto: '',
            createdAt: new Date().toISOString()
          }));

        setPositions(fallbackPositions);
        setCandidates(fallbackCandidates);
      } catch (err) {
        console.error('Error loading gazette data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSelectElection = async (elecId: string) => {
    const chosen = elections.find(e => e.id === elecId);
    if (!chosen) return;
    setSelectedElection(chosen);
    setLoading(true);
    try {
      const [pos, cands] = await Promise.all([
        getPositionsByElection(chosen.id),
        getCandidatesByElection(chosen.id)
      ]);
      setPositions((pos || []).sort((a, b) => a.order - b.order));
      setCandidates(cands || []);
    } catch (err) {
      console.error('Error switching election:', err);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (cand: Candidate, pos: Position) => {
    setSelectedCandidate(cand);
    setSelectedCandidatePosition(pos);
    setProfileModalOpen(true);
  };

  // Filter positions and candidates
  const filteredPositions = positions.filter(pos => {
    const posCandidates = candidates.filter(c => c.positionId === pos.id);
    const hasCandidate = posCandidates.length > 0;

    if (statusFilter === 'nominated' && !hasCandidate) return false;
    if (statusFilter === 'vacant' && hasCandidate) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchPos = pos.title.toLowerCase().includes(query);
      const matchCand = posCandidates.some(c => c.fullName.toLowerCase().includes(query));
      return matchPos || matchCand;
    }

    return true;
  });

  const totalPositionsCount = positions.length;
  const nominatedCount = positions.filter(p => candidates.some(c => c.positionId === p.id)).length;
  const vacantCount = totalPositionsCount - nominatedCount;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* OFFICIAL INSTITUTIONAL HEADER / GAZETTE LETTERHEAD */}
        <div className="bg-white rounded-3xl border-2 border-emerald-800/20 shadow-md p-6 sm:p-10 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-900" />

          {/* Crests and Title Block */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
            {/* NUSUSA Crest */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950 text-amber-300 flex flex-col items-center justify-center border-2 border-amber-400 shadow-md shrink-0">
                <Vote className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                <span className="text-[9px] font-black tracking-widest uppercase">NUSUSA</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Students' Association</p>
                <p className="text-[11px] text-slate-500 font-semibold">Soroti University Main Campus</p>
              </div>
            </div>

            {/* Central Official Typography */}
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs sm:text-sm font-black text-emerald-900 tracking-widest uppercase">
                Northern Uganda Soroti University Students Association
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                NUSUSA ELECTIONS 2026/2027
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider">
                Official Electoral Commission Candidate Gazette
              </p>
            </div>

            {/* Official NUSUSA Association Emblem */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Soroti University</p>
                <p className="text-[11px] text-emerald-700 font-bold">NUSUSA Electoral Commission</p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 border-2 border-emerald-600 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src="/nususa-logo.jpg"
                  alt="Official NUSUSA Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Sub-notice */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Official Leadership Positions & Nominated Candidates as verified by the Electoral Commission.</span>
            </div>
            <div className="flex items-center gap-4 font-mono font-bold text-slate-700">
              <span>Total Offices: {totalPositionsCount}</span>
              <span>•</span>
              <span className="text-emerald-700">Nominated: {nominatedCount}</span>
              <span>•</span>
              <span className="text-amber-700">Open/Vacant: {vacantCount}</span>
            </div>
          </div>
        </div>

        {/* ADMIN SYNC BANNER */}
        {isAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                <strong>Administrator Quick Action:</strong> Sync the official 22 NUSUSA 2026/2027 offices and candidates into live Cloud Firestore.
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await seedInitialNUSUSADataIfNeeded(true, true);
                  alert('Cloud Firestore successfully updated with the official 22 NUSUSA offices!');
                  window.location.reload();
                } catch (e: any) {
                  alert('Sync failed: ' + e.message);
                }
              }}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors"
            >
              Sync 22 Offices to Firestore
            </button>
          </div>
        )}

        {/* CONTROLS BAR: SEARCH, FILTERS & VIEW MODE */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or position..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Offices ({totalPositionsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('nominated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'nominated'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Nominated ({nominatedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('vacant')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'vacant'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Vacant / No Candidate ({vacantCount})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Official Gazette Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Gazette Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dossier Cards</span>
            </button>
          </div>
        </div>

        {/* CONTENT DISPLAY */}
        {loading ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading official NUSUSA candidate gazette...</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No Matching Positions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No leadership offices match your current query or filter criteria.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* OFFICIAL GAZETTE TABLE VIEW (Replicating document structure cleanly) */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="py-4 px-6 w-16 text-center">No.</th>
                    <th className="py-4 px-6 min-w-[220px]">Leadership Position</th>
                    <th className="py-4 px-6 min-w-[240px]">Nominated Candidate</th>
                    <th className="py-4 px-6 min-w-[140px]">Status</th>
                    <th className="py-4 px-6 text-right min-w-[160px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredPositions.map(pos => {
                    const posCandidates = candidates.filter(c => c.positionId === pos.id);
                    const hasCandidate = posCandidates.length > 0;

                    return (
                      <tr
                        key={pos.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          hasCandidate ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        {/* Order Number */}
                        <td className="py-4 px-6 text-center font-bold text-slate-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-mono text-xs">
                            {pos.order}
                          </span>
                        </td>

                        {/* Position Name */}
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {pos.title}
                          </div>
                          {pos.description && (
                            <div className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">
                              {pos.description}
                            </div>
                          )}
                        </td>

                        {/* Nominated Candidate */}
                        <td className="py-4 px-6">
                          {hasCandidate ? (
                            <div className="space-y-3">
                              {posCandidates.map(cand => (
                                <div key={cand.id} className="flex items-center gap-3">
                                  {cand.photoUrl && cand.photoUrl.trim() ? (
                                    <img
                                      src={cand.photoUrl}
                                      alt={cand.fullName}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
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
                                    <div className="font-bold text-slate-900">
                                      {cand.fullName}
                                    </div>
                                    <div className="text-xs text-slate-500 italic line-clamp-1">
                                      {cand.slogan ? `"${cand.slogan}"` : 'Official Candidate'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 italic">
                              No candidate listed
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {hasCandidate ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Candidate Nominated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                              <span>No candidate listed</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {hasCandidate ? (
                            <div className="flex items-center justify-end gap-2">
                              {posCandidates.map(cand => (
                                <button
                                  key={cand.id}
                                  type="button"
                                  onClick={() => openProfile(cand, pos)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View Profile</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Open for Nomination
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW WITH FULL CARDS */
          <div className="space-y-8">
            {filteredPositions.map(pos => {
              const posCandidates = candidates.filter(c => c.positionId === pos.id);
              const hasCandidate = posCandidates.length > 0;

              return (
                <div
                  key={pos.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {pos.order}
                      </span>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          {pos.title}
                        </h3>
                        {pos.description && (
                          <p className="text-xs text-slate-500">{pos.description}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {hasCandidate ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                          {posCandidates.length} Candidate{posCandidates.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                          No candidate listed
                        </span>
                      )}
                    </div>
                  </div>

                  {hasCandidate ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {posCandidates.map(cand => (
                        <CandidateCard
                          key={cand.id}
                          candidate={cand}
                          position={pos}
                          canVote={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs sm:text-sm">
                      No candidate listed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM CTA FOR VOTING */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-8 sm:p-10 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-700/50">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Ready to Cast Your Ballot for NUSUSA?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl">
              Exercise your democratic right as an enrolled student of Soroti University. Log in with your institutional @sun.ac.ug email to vote.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            {currentUser ? (
              <Link
                to="/voter/dashboard"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Go to Voter Ballot</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Login to Vote</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        position={selectedCandidatePosition}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedCandidate(null);
          setSelectedCandidatePosition(null);
        }}
        canVote={false}
      />
    </div>
  );
};
