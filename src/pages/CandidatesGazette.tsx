import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllElections,
  getPositionsByElection,
  getCandidatesByElection,
  OFFICIAL_NUSUSA_2026_POSITIONS
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
  Printer,
  Phone
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
          .map(p => ({
            id: `gazette-cand-${p.order}`,
            electionId: 'nususa-2026-official',
            positionId: `gazette-pos-${p.order}`,
            fullName: p.candidateName,
            department: p.department || '',
            yearOfStudy: p.yearOfStudy || '',
            phoneNumber: p.phoneNumber || '',
            photoUrl: '',
            slogan: p.slogan || '',
            biography: p.biography || '',
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

    // Per user instruction: remove vacant candidates / offices
    if (!hasCandidate) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchPos = pos.title.toLowerCase().includes(query);
      const matchCand = posCandidates.some(c =>
        c.fullName.toLowerCase().includes(query) ||
        (c.phoneNumber && c.phoneNumber.includes(query)) ||
        (c.department && c.department.toLowerCase().includes(query))
      );
      return matchPos || matchCand;
    }

    return true;
  });

  const totalPositionsCount = filteredPositions.length;
  const nominatedCount = filteredPositions.length;
  const vacantCount = 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* OFFICIAL INSTITUTIONAL HEADER / GAZETTE LETTERHEAD - SUES Style */}
        <div className="bg-white rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] shadow-xs p-6 text-center space-y-5 relative">
          {/* Header Identity */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src="/nususa-logo.jpg"
                alt="NUSUSA Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-md object-contain bg-white border border-slate-200 p-0.5 shrink-0"
              />
              <div className="text-left">
                <span className="text-xs font-bold text-[#102a43] tracking-wider uppercase block">
                  Soroti University
                </span>
                <span className="text-[11px] text-slate-500 font-medium">NUSUSA Electoral Commission</span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs font-bold text-[#102a43] uppercase tracking-wider block">
                Official Candidate Gazette
              </span>
              <span className="text-xs text-slate-500">Academic Year 2026/2027</span>
            </div>
          </div>

          <div className="text-left space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
              NUSUSA Elections 2026/2027 Nominees
            </h1>
            <p className="text-xs text-slate-600">
              Verified official list of contested leadership portfolios and nominated candidates certified by the Electoral Commission. Vacant positions have been pruned.
            </p>
          </div>

          {/* Sub-notice */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#102a43]" />
              <span>Official Leadership Positions & Nominated Candidates.</span>
            </div>
            <div className="flex items-center gap-3 font-medium text-slate-700">
              <span>Contested Portfolios: <strong className="text-[#102a43]">{totalPositionsCount}</strong></span>
              <span>•</span>
              <span>Nominees: <strong className="text-emerald-700">{nominatedCount}</strong></span>
              <span>•</span>
              <span>Vacant: <strong className="text-slate-400">None (Removed)</strong></span>
            </div>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH, FILTERS & VIEW MODE */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or position..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] focus:bg-white transition-all"
            />
          </div>

          {/* Nominees Badge */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#102a43] text-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nominated Candidates ({totalPositionsCount})</span>
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-white text-[#102a43] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Official Gazette Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-[#102a43] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT DISPLAY */}
        {loading ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#102a43] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading official NUSUSA candidate gazette...</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">No Matching Positions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No leadership offices match your current query or filter criteria.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* OFFICIAL GAZETTE TABLE VIEW (Replicating document structure cleanly) */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#102a43] text-white text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="py-3 px-5 w-14 text-center">No.</th>
                    <th className="py-3 px-5 min-w-[200px]">Leadership Position</th>
                    <th className="py-3 px-5 min-w-[220px]">Nominated Candidate</th>
                    <th className="py-3 px-5 min-w-[130px]">Status</th>
                    <th className="py-3 px-5 text-right min-w-[150px]">Action</th>
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
                                    <div className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                                      <span>{cand.fullName}</span>
                                      {cand.phoneNumber && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102a43] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                          <Phone className="w-2.5 h-2.5 text-[#102a43]" />
                                          <span>{cand.phoneNumber}</span>
                                        </span>
                                      )}
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
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#102a43] hover:bg-[#243b53] text-white font-medium text-xs rounded-md transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-200" />
                                  <span>Profile</span>
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
          <div className="space-y-6">
            {filteredPositions.map(pos => {
              const posCandidates = candidates.filter(c => c.positionId === pos.id);
              const hasCandidate = posCandidates.length > 0;

              return (
                <div
                  key={pos.id}
                  className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 border-t-2 border-t-[#102a43] shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-slate-100 text-[#102a43] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {pos.order}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-[#102a43] tracking-tight">
                          {pos.title}
                        </h3>
                        {pos.description && (
                          <p className="text-xs text-slate-500">{pos.description}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {hasCandidate ? (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-[#102a43] text-xs font-bold rounded border border-slate-200">
                          {posCandidates.length} Candidate{posCandidates.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded">
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
