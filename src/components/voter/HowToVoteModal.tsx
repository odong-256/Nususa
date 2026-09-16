import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Vote,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Award,
  Lock,
  Sparkles
} from 'lucide-react';

interface HowToVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVoting?: () => void;
}

interface TutorialStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  bullets: string[];
  tip: string;
}

export const HowToVoteModal: React.FC<HowToVoteModalProps> = ({
  isOpen,
  onClose,
  onStartVoting
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      title: 'Institutional Verification & Approval',
      subtitle: 'Ensure your Soroti University student credentials are authenticated',
      icon: <ShieldCheck className="w-7 h-7 text-[#102a43]" />,
      badge: 'Step 1 of 5',
      badgeColor: 'bg-slate-100 text-[#102a43] border-slate-200',
      bullets: [
        'Only officially enrolled Soroti University students with registered @sun.ac.ug emails can participate.',
        'Check your header badge: your status must show "Approved" by the Electoral Commission.',
        'Verify or update your faculty, course, and contact number in the "My Profile" tab.'
      ],
      tip: 'Pending accounts cannot submit ballots until approved by an EC administrator.'
    },
    {
      title: 'Review Candidate Manifestos & Credentials',
      subtitle: 'Make informed democratic decisions for the 2026/2027 NUSUSA leadership',
      icon: <BookOpen className="w-7 h-7 text-[#102a43]" />,
      badge: 'Step 2 of 5',
      badgeColor: 'bg-slate-100 text-[#102a43] border-slate-200',
      bullets: [
        'Visit the Candidates Gazette to inspect all 22 official NUSUSA leadership offices.',
        'Use the Side-by-Side Comparison tool to contrast candidate academic qualifications, leadership experience, and manifestos.',
        'Read policy agendas for President, Speaker, General Secretary, and faculty representatives.'
      ],
      tip: 'You can bookmark candidates or compare their vision before opening the ballot.'
    },
    {
      title: 'Access Your Authenticated Ballot',
      subtitle: 'Enter the secure polling room during active election hours',
      icon: <Vote className="w-7 h-7 text-[#102a43]" />,
      badge: 'Step 3 of 5',
      badgeColor: 'bg-slate-100 text-[#102a43] border-slate-200',
      bullets: [
        'On your Voter Dashboard, find active elections under "Available Elections".',
        'Check the live countdown clock for remaining polling time.',
        'Click "Vote Now" to load your single-use, cryptographically tracked ballot form.'
      ],
      tip: 'Each voter receives exactly one ballot per election. Re-voting is cryptographically prohibited.'
    },
    {
      title: 'Mark Your Preferred Candidates',
      subtitle: 'Carefully cast your vote for each contested student office',
      icon: <CheckCircle2 className="w-7 h-7 text-[#102a43]" />,
      badge: 'Step 4 of 5',
      badgeColor: 'bg-slate-100 text-[#102a43] border-slate-200',
      bullets: [
        'Go through the list of positions in order (Guild President, Speaker, General Secretary, etc.).',
        'Click on the candidate card of your choice to select them.',
        'Review your selected card to confirm the highlight matches your intent before proceeding.'
      ],
      tip: 'Take your time. You can change any selection before reaching the final confirmation step.'
    },
    {
      title: 'Final Confirmation & Sealed Receipt',
      subtitle: 'Submit your immutable ballot and save your tamper-proof verification receipt',
      icon: <Receipt className="w-7 h-7 text-[#102a43]" />,
      badge: 'Step 5 of 5',
      badgeColor: 'bg-slate-100 text-[#102a43] border-slate-200',
      bullets: [
        'Review the complete ballot summary to verify every candidate selected.',
        'Click "Confirm & Submit Sealed Ballot" to execute the write transaction to the secure database.',
        'Save or screenshot your unique cryptographic receipt code (e.g., NUSUSA-ELEC-...).',
        'Verify your ballot is tallied anonymously in the live public audit trail.'
      ],
      tip: 'Your individual voting selections remain strictly secret while your participation is verifiable!'
    }
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg max-w-2xl w-full shadow-xl border border-slate-200 border-t-4 border-t-[#102a43] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
      >
        {/* Header */}
        <div className="bg-[#102a43] px-6 py-4 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tutorial-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
                  How to Cast Your Ballot
                </h2>
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-[#102a43] px-2 py-0.5 rounded-sm">
                  Voter Guide
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Step-by-step guide for the NUSUSA 2026/2027 General Elections
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar / Step Dots */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-[#102a43]'
                    : idx < currentStep
                    ? 'w-2 bg-slate-400'
                    : 'w-2 bg-slate-200'
                }`}
                title={`Jump to Step ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-600 font-mono">
            {step.badge}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
              {step.icon}
            </div>
            <div className="space-y-0.5">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm border ${step.badgeColor}`}>
                {step.badge}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#102a43] tracking-tight">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Bullet points */}
          <div className="space-y-2.5 pt-1">
            {step.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-[#102a43] border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                  {idx + 1}
                </div>
                <p className="leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>

          {/* Pro-tip callout */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#102a43] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#102a43]">Electoral Commission Tip: </span>
              <span className="text-slate-600">{step.tip}</span>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3.5 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 rounded-md bg-[#102a43] hover:bg-[#243b53] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartVoting) onStartVoting();
                }}
                className="px-5 py-2 rounded-md bg-[#102a43] hover:bg-[#243b53] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Ready to Vote</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToVoteModal;
