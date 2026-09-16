import React from 'react';
import { Candidate, Position } from '../types';
import {
  X,
  Award,
  BookOpen,
  GraduationCap,
  FileText,
  Briefcase,
  Target,
  Quote,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  Vote,
  Sparkles,
  ExternalLink,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CandidateCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidates: Candidate[];
  positions: Position[];
  allCandidates: Candidate[];
  onRemoveCandidate: (candidateId: string) => void;
  onAddCandidate: (candidateId: string) => void;
  onOpenProfile: (candidate: Candidate, position: Position) => void;
}

export const CandidateCompareModal: React.FC<CandidateCompareModalProps> = ({
  isOpen,
  onClose,
  selectedCandidates,
  positions,
  allCandidates,
  onRemoveCandidate,
  onAddCandidate,
  onOpenProfile
}) => {
  if (!isOpen) return null;

  const getPositionForCandidate = (posId: string) => {
    return positions.find(p => p.id === posId);
  };

  const remainingCandidates = allCandidates.filter(
    c => !selectedCandidates.some(sc => sc.id === c.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg w-full max-w-6xl shadow-xl border border-slate-200 border-t-4 border-t-[#102a43] overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
      >
        {/* Header */}
        <div className="bg-[#102a43] px-6 py-4 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="compare-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Candidate Side-by-Side Comparison
                </h2>
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-[#102a43] px-2 py-0.5 rounded-sm">
                  Gazette Tool
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Compare academic credentials, manifestos, and student leadership experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {remainingCandidates.length > 0 && selectedCandidates.length < 4 && (
              <div className="hidden sm:block">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddCandidate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md cursor-pointer focus:outline-none"
                >
                  <option value="" disabled className="text-slate-900">
                    + Add Candidate to Compare...
                  </option>
                  {remainingCandidates.map(c => {
                    const pos = getPositionForCandidate(c.positionId);
                    return (
                      <option key={c.id} value={c.id} className="text-slate-900">
                        {c.fullName} ({pos ? pos.title : 'Candidate'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              aria-label="Close comparison view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Content Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {selectedCandidates.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Candidates Selected for Comparison</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Check the "Compare" box next to candidates in the Gazette table or dossier cards to contrast their manifestos side-by-side.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Candidates Header Cards Row */}
              <div className={`grid gap-4 ${
                selectedCandidates.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                selectedCandidates.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}>
                {selectedCandidates.map(c => {
                  const pos = getPositionForCandidate(c.positionId);
                  return (
                    <div
                      key={c.id}
                      className="bg-white p-4 rounded-lg border border-slate-200 border-t-2 border-t-[#102a43] relative flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onRemoveCandidate(c.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 pr-6">
                        {c.photoUrl && c.photoUrl.trim() ? (
                          <img
                            src={c.photoUrl}
                            alt={c.fullName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-md object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-[#102a43] text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs">
                            {c.fullName
                              .split(' ')
                              .map(n => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-[#102a43] text-sm truncate">
                            {c.fullName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="inline-block text-[10px] font-bold text-[#102a43] bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200 truncate max-w-full">
                              {pos ? pos.title : 'Candidate'}
                            </span>
                            {c.yearOfStudy && (
                              <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-200">
                                {c.yearOfStudy}
                              </span>
                            )}
                          </div>
                          {c.department && (
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {c.department}
                            </p>
                          )}
                          {c.phoneNumber && (
                            <p className="text-[10px] text-slate-600 font-medium truncate flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-[#102a43]" />
                              <span>{c.phoneNumber}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {c.slogan && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{c.slogan}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        {pos && (
                          <button
                            type="button"
                            onClick={() => onOpenProfile(c, pos)}
                            className="text-[11px] font-semibold text-[#102a43] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Full Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* COMPARISON SECTIONS */}

              {/* 1. Academic Credentials & Qualifications */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-[#102a43] text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-slate-300" />
                  <span>Academic Credentials & Qualifications</span>
                </div>
                <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-4 gap-4 ${
                  selectedCandidates.length === 1 ? 'grid-cols-1' :
                  selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  selectedCandidates.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {selectedCandidates.map(c => (
                    <div key={c.id} className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">
                        {c.fullName}
                      </span>
                      {c.qualifications && c.qualifications.trim() ? (
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {c.qualifications}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Official academic credentials on file with Soroti University EC.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Manifesto & Policy Agenda */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-[#102a43] text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span>Campaign Manifesto & Student Agenda</span>
                </div>
                <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-4 gap-4 ${
                  selectedCandidates.length === 1 ? 'grid-cols-1' :
                  selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  selectedCandidates.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {selectedCandidates.map(c => (
                    <div key={c.id} className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">
                        {c.fullName}
                      </span>
                      {c.manifesto && c.manifesto.trim() ? (
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {c.manifesto}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Official manifesto published under the NUSUSA 2026/2027 Election Gazette.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Leadership Track Record & Experience */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-[#102a43] text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-slate-300" />
                  <span>Leadership Experience & Campus Service</span>
                </div>
                <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-4 gap-4 ${
                  selectedCandidates.length === 1 ? 'grid-cols-1' :
                  selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  selectedCandidates.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {selectedCandidates.map(c => (
                    <div key={c.id} className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">
                        {c.fullName}
                      </span>
                      {c.experience && c.experience.trim() ? (
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {c.experience}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Documented experience and extracurricular service in Soroti University student bodies.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Strategic Vision & Core Objectives */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-[#102a43] text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <Target className="w-4 h-4 text-slate-300" />
                  <span>Strategic Vision & Core Objectives</span>
                </div>
                <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-4 gap-4 ${
                  selectedCandidates.length === 1 ? 'grid-cols-1' :
                  selectedCandidates.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  selectedCandidates.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {selectedCandidates.map(c => (
                    <div key={c.id} className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">
                        {c.fullName}
                      </span>
                      {c.vision ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-900 block">Vision:</span>
                          <p className="text-xs sm:text-sm text-slate-600">{c.vision}</p>
                        </div>
                      ) : null}
                      {c.mission ? (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-slate-900 block">Mission:</span>
                          <p className="text-xs sm:text-sm text-slate-600">{c.mission}</p>
                        </div>
                      ) : null}
                      {!c.vision && !c.mission && (
                        <p className="text-xs text-slate-400 italic">
                          Vision and mission aligned with NUSUSA 2026/2027 constitutional mandates.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-[#102a43]" />
            <span>Comparing {selectedCandidates.length} candidate(s) for the NUSUSA 2026/2027 General Elections.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer"
            >
              Close Comparison
            </button>
            <Link
              to="/voter/dashboard"
              className="px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Proceed to Cast Ballot</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCompareModal;
