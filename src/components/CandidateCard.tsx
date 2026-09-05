import React, { useState } from 'react';
import { Candidate, Position } from '../types';
import { CandidateProfileModal } from './CandidateProfileModal';
import { UserCheck, Eye, CheckCircle2 } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  position?: Position | null;
  isSelected?: boolean;
  onSelect?: (candidate: Candidate) => void;
  canVote?: boolean;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  position,
  isSelected,
  onSelect,
  canVote = false,
  disabled = false
}) => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div
        id={`candidate-card-${candidate.id}`}
        className={`group relative rounded-2xl transition-all duration-200 border overflow-hidden flex flex-col justify-between ${
          isSelected
            ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {/* Top visual accent for selected state */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10 bg-emerald-600 text-white rounded-full p-1 shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}

        <div className="p-5">
          {/* Candidate Image & Basic Info */}
          <div className="flex gap-4 items-start">
            {candidate.photoUrl && candidate.photoUrl.trim() ? (
              <img
                src={candidate.photoUrl}
                alt={candidate.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top border border-slate-200 shrink-0 shadow-xs group-hover:scale-102 transition-transform duration-200"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-900 text-amber-300 font-extrabold flex flex-col items-center justify-center shrink-0 border border-emerald-700/40 shadow-xs">
                <span className="text-xl sm:text-2xl tracking-wider">
                  {candidate.fullName
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="text-[9px] text-emerald-200/80 font-mono tracking-widest mt-1 uppercase">
                  NUSUSA
                </span>
              </div>
            )}
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block">
                {position?.title || 'Candidate'}
              </span>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate tracking-tight">
                {candidate.fullName}
              </h3>
              {candidate.slogan ? (
                <p className="text-xs text-slate-500 italic line-clamp-1">
                  "{candidate.slogan}"
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium">
                  Official NUSUSA Candidate
                </p>
              )}
            </div>
          </div>

          {/* Short Bio snippet */}
          <div className="mt-4">
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {candidate.biography || 'Candidate information has not yet been provided.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2.5">
          <button
            id={`view-profile-${candidate.id}`}
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            View Profile
          </button>

          {canVote && onSelect && (
            <button
              id={`select-candidate-${candidate.id}`}
              type="button"
              onClick={() => onSelect(candidate)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isSelected ? 'Selected' : 'Select Candidate'}
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
