import React from 'react';
import { Candidate, Position } from '../types';
import { Modal } from './Modal';
import { GraduationCap, Briefcase, Eye, Target, FileText, Quote, Award, Phone } from 'lucide-react';

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
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-200">
          <div className="relative shrink-0">
            {candidate.photoUrl && candidate.photoUrl.trim() ? (
              <img
                src={candidate.photoUrl}
                alt={candidate.fullName}
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-md object-cover object-top border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-md bg-[#102a43] text-white font-bold flex flex-col items-center justify-center border border-slate-300 shadow-xs">
                <span className="text-2xl sm:text-3xl tracking-wider">
                  {candidate.fullName
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-300 font-mono tracking-widest mt-1 uppercase">
                  NUSUSA
                </span>
              </div>
            )}
            <span className="absolute bottom-1.5 right-1.5 bg-[#102a43] text-white p-1 rounded-full shadow-xs">
              <Award className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-[#102a43] text-xs font-bold rounded-md border border-slate-200">
                {position?.title || 'Electoral Candidate'}
              </span>
              {candidate.phoneNumber && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                  <Phone className="w-3 h-3 text-[#102a43]" />
                  <span>{candidate.phoneNumber}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102a43] tracking-tight">
              {candidate.fullName}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 italic text-xs sm:text-sm">
              <Quote className="w-3.5 h-3.5 text-[#102a43] shrink-0 inline" />
              <span>
                {candidate.slogan ? `"${candidate.slogan}"` : 'Candidate information has not yet been provided.'}
              </span>
            </div>
          </div>
        </div>

        {/* Manifesto & Dossier Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Biography */}
          <div className="space-y-1.5 md:col-span-2 bg-slate-50 p-4 rounded-md border border-slate-200">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-[#102a43]" />
              Candidate Biography
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.biography ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.biography || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Academic Qualifications */}
          <div className="space-y-1.5 p-4 rounded-md border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-[#102a43]" />
              Academic Qualifications
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.qualifications ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.qualifications || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-1.5 p-4 rounded-md border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-[#102a43]" />
              Leadership & Campus Experience
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.experience ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.experience || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-1.5 p-4 rounded-md border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-[#102a43]" />
              Vision Statement
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.vision ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.vision || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-1.5 p-4 rounded-md border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-[#102a43]" />
              Mission Statement
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.mission ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.mission || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Key Objectives */}
          <div className="space-y-1.5 md:col-span-2 p-4 rounded-md border border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#102a43]" />
              Key Electoral Objectives
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.objectives ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.objectives || 'Candidate information has not yet been provided.'}
            </p>
          </div>

          {/* Full Manifesto */}
          <div className="space-y-1.5 md:col-span-2 p-4 rounded-md border border-slate-200 bg-white">
            <h4 className="text-xs font-bold text-[#102a43] flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-[#102a43]" />
              Official Student Manifesto
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${candidate.manifesto ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {candidate.manifesto || 'Candidate information has not yet been provided.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {canVote && onSelect && (
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
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
              className={`px-5 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-100 text-[#102a43] border border-[#102a43]'
                  : 'bg-[#102a43] hover:bg-[#243b53] text-white shadow-xs'
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
