import React, { useState } from 'react';
import { Candidate, Position } from '../types';
import { CandidateProfileModal } from './CandidateProfileModal';
import { UserCheck, Eye, CheckCircle2, Phone } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  position?: Position | null;
  isSelected?: boolean;
  onSelect?: (candidate: Candidate) => void;
  canVote?: boolean;
  disabled?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (candidate: Candidate) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  position,
  isSelected,
  onSelect,
  canVote = false,
  disabled = false,
  isCompared = false,
  onToggleCompare
}) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div
        id={`candidate-card-${candidate.id}`}
        className={`group relative rounded-lg transition-all duration-200 border overflow-hidden flex flex-col justify-between ${
          isSelected
            ? 'bg-slate-50 border-[#102a43] shadow-sm ring-1 ring-[#102a43]'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {/* Top visual accent for selected state */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 z-10 bg-[#102a43] text-white rounded-full p-1 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* Candidate Image & Basic Info */}
          <div className="flex gap-3.5 items-start">
            {candidate.photoUrl && candidate.photoUrl.trim() ? (
              <img
                src={candidate.photoUrl}
                alt={candidate.fullName}
                referrerPolicy="no-referrer"
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-md object-cover object-top border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-md bg-[#102a43] text-white font-bold flex flex-col items-center justify-center shrink-0 border border-slate-300">
                <span className="text-lg tracking-wider">
                  {candidate.fullName
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="text-[8px] text-slate-300 font-mono tracking-widest mt-0.5 uppercase">
                  NUSUSA
                </span>
              </div>
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#102a43] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                  {position?.title || 'Candidate'}
                </span>
              </div>
              <h3 className="font-bold text-[#102a43] text-base truncate tracking-tight">
                {candidate.fullName}
              </h3>
              {candidate.phoneNumber && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 truncate">
                  <Phone className="w-3 h-3 text-[#102a43] shrink-0" />
                  <span className="truncate">{candidate.phoneNumber}</span>
                </div>
              )}
              {candidate.slogan ? (
                <p className="text-xs text-slate-500 italic line-clamp-1">
                  "{candidate.slogan}"
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium">
                  Official NUSUSA Nominee
                </p>
              )}
            </div>
          </div>

          {/* Short Bio snippet */}
          <div className="mt-3">
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {candidate.biography || 'Candidate information has not yet been provided.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <button
            id={`view-profile-${candidate.id}`}
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex-1 py-1.5 px-3 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Profile
          </button>

          {canVote && onSelect && (
            <button
              id={`select-candidate-${candidate.id}`}
              type="button"
              onClick={() => onSelect(candidate)}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                  : 'bg-[#102a43] text-white hover:bg-[#243b53]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isSelected ? 'Selected' : 'Select'}
            </button>
          )}
        </div>
      </div>

      <CandidateProfileModal
        candidate={candidate}
        position={position}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onSelect={onSelect}
        isSelected={isSelected}
        canVote={canVote}
      />
    </>
  );
};
