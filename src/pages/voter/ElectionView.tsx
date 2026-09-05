import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getElectionById,
  getPositionsByElection,
  getCandidatesByElection,
  checkHasVoted,
  getVoterBallot,
  submitBallot
} from '../../services/electionService';
import { Election, Position, Candidate, Ballot } from '../../types';
import { CandidateCard } from '../../components/CandidateCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  Calendar,
  Award,
  Sparkles
} from 'lucide-react';

export const ElectionView: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const { currentUser, userProfile, isApproved, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [election, setElection] = useState<Election | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [existingBallot, setExistingBallot] = useState<Ballot | null>(null);

  // Workflow state: 'voting' | 'review' | 'success'
  const [workflowStep, setWorkflowStep] = useState<'voting' | 'review'>('voting');
  // Selections: { [positionId]: candidateId }
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadElectionDetails() {
      if (!electionId) return;
      try {
        const [elec, pos, cands] = await Promise.all([
          getElectionById(electionId),
          getPositionsByElection(electionId),
          getCandidatesByElection(electionId)
        ]);

        setElection(elec);
        setPositions(pos || []);
        setCandidates(cands || []);

        if (currentUser) {
          const voted = await checkHasVoted(electionId, currentUser.uid);
          setHasVoted(voted);
          if (voted) {
            const b = await getVoterBallot(electionId, currentUser.uid);
            setExistingBallot(b);
          }
        }
      } catch (err) {
        console.error('Error fetching election details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadElectionDetails();
  }, [electionId, currentUser]);

  const handleSelectCandidate = (positionId: string, candidateId: string) => {
    if (hasVoted || election?.status !== 'open') return;
    setSelections(prev => {
      // Toggle or set
      if (prev[positionId] === candidateId) {
        const copy = { ...prev };
        delete copy[positionId];
        return copy;
      }
      return {
        ...prev,
        [positionId]: candidateId
      };
    });
  };

  const handleProceedToReview = () => {
    setErrorMessage(null);
    if (Object.keys(selections).length === 0) {
      setErrorMessage('Please select at least one candidate before reviewing your ballot.');
      return;
    }
    setWorkflowStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitBallot = async () => {
    if (!election || !currentUser) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const ballotResult = await submitBallot(
        election.id,
        currentUser.uid,
        currentUser.email || '',
        selections
      );

      setConfirmModalOpen(false);
      navigate(`/voter/election/${election.id}/success`, {
        state: { ballot: ballotResult }
      });
    } catch (err: any) {
      console.error('Vote submission error:', err);
      if (err.message && err.message.includes('already voted')) {
        setErrorMessage('You have already voted in this election.');
        setHasVoted(true);
      } else {
        setErrorMessage(err.message || 'Failed to submit ballot to cloud database.');
      }
      setConfirmModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Retrieving official electoral ballot...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Election Not Found</h2>
        <p className="text-sm text-slate-600">
          The requested election does not exist or has been retired.
        </p>
        <Link
          to="/voter/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isOpen = election.status === 'open';

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            to="/voter/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Voter Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <StatusBadge status={election.status} size="md" />
            <span className="text-xs font-mono text-slate-500">
              Academic Year {election.academicYear}
            </span>
          </div>
        </div>

        {/* Election Identity Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Vote className="w-4 h-4 text-emerald-600" />
            <span>Official Ballot Paper</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {election.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {election.description}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Closes: {new Date(election.endDate).toLocaleString()}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>{positions.length} Elective Offices</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>One Ballot Rule Active</span>
            </span>
          </div>
        </div>

        {/* Notice: If user has already voted */}
        {hasVoted && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">You have already voted in this election.</h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed pl-8.5">
              Your ballot has been officially signed and recorded in Cloud Firestore. Under NUSUSA electoral regulations,
              a voter can vote only once in each election to prevent electoral fraud and guarantee integrity.
            </p>
            {existingBallot && (
              <div className="mt-3 pl-8.5 text-xs text-slate-600 font-mono">
                Verification Receipt: <span className="font-bold text-slate-900">{existingBallot.receiptCode}</span> (Timestamp: {new Date(existingBallot.submittedAt).toLocaleString()})
              </div>
            )}
          </div>
        )}

        {/* Notice: If election is closed or not open */}
        {!isOpen && !hasVoted && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-bold">Voting is Currently Inactive</h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              This election is currently in <strong>{election.status.toUpperCase()}</strong> status. Ballots can only be cast when the Electoral Commission has officially opened the polling period.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* WORKFLOW STEP 1: SELECT CANDIDATES */}
        {workflowStep === 'voting' && (
          <div className="space-y-12">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Contested Positions & Nominated Candidates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review the candidates below. Tap <strong>Select Candidate</strong> to designate your vote for each office.
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-slate-600">
                  Selected: {Object.keys(selections).length} of {positions.length}
                </span>
              </div>
            </div>

            {positions.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
                No electoral positions have been registered for this election yet.
              </div>
            ) : (
              positions.map(position => {
                const positionCandidates = candidates.filter(c => c.positionId === position.id);
                const selectedCandidateId = selections[position.id];

                return (
                  <section
                    key={position.id}
                    id={`position-section-${position.id}`}
                    className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6"
                  >
                    {/* Position Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {position.order}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {position.title}
                          </h3>
                        </div>
                        {position.description && (
                          <p className="text-xs text-slate-500 mt-1 pl-8">
                            {position.description}
                          </p>
                        )}
                      </div>

                      <div className="pl-8 sm:pl-0">
                        {selectedCandidateId ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Candidate Chosen</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            <span>Pending Choice</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Candidates in Position */}
                    {positionCandidates.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No candidates are nominated for this office yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {positionCandidates.map(candidate => {
                          const isSelected = selectedCandidateId === candidate.id;
                          return (
                            <CandidateCard
                              key={candidate.id}
                              candidate={candidate}
                              position={position}
                              isSelected={isSelected}
                              onSelect={() => handleSelectCandidate(position.id, candidate.id)}
                              canVote={isOpen && !hasVoted}
                              disabled={hasVoted || !isOpen}
                            />
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })
            )}

            {/* Bottom Review Action Bar */}
            {isOpen && !hasVoted && (
              <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Vote className="w-4 h-4 text-emerald-400" />
                    <span>Ballot Status: {Object.keys(selections).length} of {positions.length} Selected</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    You may review all selections before final submission.
                  </p>
                </div>

                <button
                  id="proceed-to-review-btn"
                  type="button"
                  onClick={handleProceedToReview}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <span>Review Vote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* WORKFLOW STEP 2: REVIEW VOTE */}
        {workflowStep === 'review' && (
          <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Step 2 of 2: Ballot Verification
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  Review Your Vote
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Please inspect your selected candidates for each contested position. Once submitted, your vote is permanent and cannot be modified.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWorkflowStep('voting')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Selections</span>
              </button>
            </div>

            {/* Selected Summary List */}
            <div className="space-y-4">
              {positions.map(pos => {
                const chosenCandId = selections[pos.id];
                const chosenCand = candidates.find(c => c.id === chosenCandId);

                return (
                  <div
                    key={pos.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {pos.title}
                      </span>
                      {chosenCand ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={chosenCand.photoUrl}
                            alt={chosenCand.fullName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-base">{chosenCand.fullName}</h4>
                            {chosenCand.slogan && (
                              <p className="text-xs text-slate-500 italic">"{chosenCand.slogan}"</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          (No candidate chosen for this position)
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {chosenCand ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed Choice</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Abstained</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>One-Vote Cryptographic Guarantee</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                By submitting this ballot, you certify that you are the verified student owner of account{' '}
                <span className="font-semibold text-slate-900">{currentUser?.email}</span>. Your ballot will be sealed and unalterable.
              </p>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWorkflowStep('voting')}
                className="w-full sm:w-auto px-6 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Ballot
              </button>
              <button
                id="confirm-vote-modal-trigger"
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Vote className="w-4 h-4" />
                <span>Confirm & Submit Vote</span>
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL */}
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => !submitting && setConfirmModalOpen(false)}
          title="Confirm Ballot Submission"
          subtitle="Final Verification of Student Vote"
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-200">
              <Vote className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Are you sure you want to submit your ballot?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This action is permanent and cannot be undone. You will not be able to change your choices or vote again in this election.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
              Positions Contested: {positions.length} | Selected: {Object.keys(selections).length}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="submit-final-ballot-btn"
                type="button"
                disabled={submitting}
                onClick={handleSubmitBallot}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Yes, Submit Ballot</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
