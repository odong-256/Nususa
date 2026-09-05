import React from 'react';
import { Candidate, Position } from '../types';
import { Modal } from './Modal';
import { GraduationCap, Briefcase, Eye, Target, FileText, Quote, Award } from 'lucide-react';

interface CandidateProfileModalProps {
  candidate: Candidate | null;
  position?: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (candidate: Candidate) => void;
  isSelected?: boolean;
  canVote?: boolean;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  position,
  isOpen,
  onClose,
  onSelect,
  isSelected,
  canVote
}) => {
  if (!candidate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <div className="space-y-6">
        {/* Candidate Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          <div className="relative shrink-0">
            {candidate.photoUrl && candidate.photoUrl.trim() ? (
              <img
                src={candidate.photoUrl}
                alt={candidate.fullName}
                referrerPolicy="no-referrer"
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover object-top border-4 border-emerald-600/20 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-900 text-amber-300 font-extrabold flex flex-col items-center justify-center border-4 border-emerald-600/20 shadow-md">
                <span className="text-3xl sm:text-4xl tracking-wider">
                  {candidate.fullName
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono tracking-widest mt-2 uppercase">
                  NUSUSA 2026/2027
                </span>
              </div>
            )}
            <span className="absolute bottom-2 right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow">
              <Award className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              {position?.title || 'Electoral Candidate'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {candidate.fullName}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 italic text-sm">
              <Quote className="w-4 h-4 text-emerald-600 shrink-0 inline" />
              <span>
                {candidate.slogan ? `"${candidate.slogan}"` : 'Candidate information has not yet been provided.'}
              </span>
            </div>
          </div>
        </div>

        {/* Manifesto & Dossier Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Biography */}
          <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              Candidate Biography
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.biography ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.biography || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Academic Qualifications */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Academic Qualifications
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.qualifications ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.qualifications || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              Leadership & Campus Experience
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.experience ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.experience || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              Vision Statement
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.vision ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.vision || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-100 bg-white shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-600" />
              Mission Statement
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.mission ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.mission || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Key Objectives */}
          <div className="space-y-2 md:col-span-2 p-4 rounded-xl border border-slate-100 bg-emerald-50/50">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              Key Electoral Objectives
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.objectives ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.objectives || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Full Manifesto */}
          <div className="space-y-2 md:col-span-2 p-5 rounded-xl border border-slate-200 bg-slate-900 text-white">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider text-xs">
              <FileText className="w-4 h-4 text-emerald-400" />
              Official Student Manifesto
            </h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${candidate.manifesto ? 'text-slate-200 font-mono text-xs sm:text-sm' : 'text-slate-400 italic'}`}>
              {candidate.manifesto || 'Candidate information has not yet been provided.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {canVote && onSelect && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isSelected ? 'Currently selected for this position' : 'Ready to select this candidate?'}
            </span>
            <button
              id={`select-cand-modal-${candidate.id}`}
              type="button"
              onClick={() => {
                onSelect(candidate);
                onClose();
              }}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isSelected ? 'Candidate Selected ✓' : 'Select Candidate for Ballot'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
