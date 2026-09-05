import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Election,
  ElectionStatus,
  Position,
  Candidate,
  Ballot,
  ResultsSummary,
  UserProfile
} from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { logAuditEvent } from './auditService';
import { getAllVoters } from './voterService';

// --- ELECTIONS ---

export async function getAllElections(): Promise<Election[]> {
  const path = 'elections';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Election[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getElectionById(id: string): Promise<Election | null> {
  const path = `elections/${id}`;
  try {
    const d = await getDoc(doc(db, 'elections', id));
    if (d.exists()) {
      return { id: d.id, ...d.data() } as Election;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createElection(
  data: Omit<Election, 'id' | 'createdAt' | 'totalVotesCount'>,
  adminId?: string,
  adminEmail?: string
): Promise<Election> {
  const electionId = 'elec_' + Date.now();
  const path = `elections/${electionId}`;
  const newElection: Election = {
    ...data,
    id: electionId,
    totalVotesCount: 0,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'elections', electionId), newElection);
    await logAuditEvent(
      'Election Created',
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `New election created: "${newElection.title}" (${newElection.academicYear}) with status: ${newElection.status}`
    );
    return newElection;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateElection(
  id: string,
  updates: Partial<Election>,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `elections/${id}`;
  try {
    await updateDoc(doc(db, 'elections', id), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await logAuditEvent(
      'Election Updated',
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `Election ${id} updated`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setElectionStatus(
  id: string,
  newStatus: ElectionStatus,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `elections/${id}`;
  try {
    await updateDoc(doc(db, 'elections', id), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    await logAuditEvent(
      `Election ${newStatus.toUpperCase()}`,
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `Election status modified to ${newStatus}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateElectionStatus(
  id: string,
  newStatus: ElectionStatus,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  return setElectionStatus(id, newStatus, adminId, adminEmail);
}

export async function deleteElection(
  id: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `elections/${id}`;
  try {
    await deleteDoc(doc(db, 'elections', id));
    await logAuditEvent(
      'Election Deleted',
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `Election ${id} deleted`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- POSITIONS ---

export async function getPositionsByElection(electionId: string): Promise<Position[]> {
  const path = 'positions';
  try {
    const q = query(collection(db, path), where('electionId', '==', electionId));
    const snapshot = await getDocs(q);
    const positions = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Position[];
    return positions.sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createPosition(
  data: Omit<Position, 'id' | 'createdAt'>,
  adminId?: string,
  adminEmail?: string
): Promise<Position> {
  const posId = 'pos_' + Date.now();
  const path = `positions/${posId}`;
  const newPos: Position = {
    ...data,
    id: posId,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'positions', posId), newPos);
    await logAuditEvent(
      'Position Created',
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `Position added: "${newPos.title}" for election ${newPos.electionId}`
    );
    return newPos;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePosition(
  id: string,
  updates: Partial<Position>,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `positions/${id}`;
  try {
    await updateDoc(doc(db, 'positions', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePosition(
  id: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `positions/${id}`;
  try {
    await deleteDoc(doc(db, 'positions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- CANDIDATES ---

export async function getAllCandidates(electionId?: string): Promise<Candidate[]> {
  const path = 'candidates';
  try {
    const q = electionId
      ? query(collection(db, path), where('electionId', '==', electionId))
      : collection(db, path);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      votesCount: d.data().votesCount ?? d.data().voteCount ?? 0
    })) as Candidate[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getCandidatesByElection(electionId: string): Promise<Candidate[]> {
  return getAllCandidates(electionId);
}

export async function createCandidate(
  data: Omit<Candidate, 'id' | 'createdAt' | 'voteCount' | 'votesCount'>,
  adminId?: string,
  adminEmail?: string
): Promise<Candidate> {
  const candId = 'cand_' + Date.now();
  const path = `candidates/${candId}`;
  const newCandidate: Candidate = {
    ...data,
    id: candId,
    voteCount: 0,
    votesCount: 0,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'candidates', candId), newCandidate);
    await logAuditEvent(
      'Candidate Registered',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate created: "${newCandidate.fullName}" running for position ${newCandidate.positionId}`
    );
    return newCandidate;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCandidate(
  id: string,
  updates: Partial<Candidate>,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `candidates/${id}`;
  try {
    await updateDoc(doc(db, 'candidates', id), updates);
    await logAuditEvent(
      'Candidate Updated',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate ${id} updated`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCandidate(
  id: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  const path = `candidates/${id}`;
  try {
    await deleteDoc(doc(db, 'candidates', id));
    await logAuditEvent(
      'Candidate Deleted',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate ${id} removed`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- BALLOTS & VOTING WORKFLOW ---

export async function checkHasVoted(electionId: string, voterId: string): Promise<boolean> {
  const ballotDocId = `${electionId}_${voterId}`;
  const path = `ballots/${ballotDocId}`;
  try {
    const d = await getDoc(doc(db, 'ballots', ballotDocId));
    return d.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getVoterBallot(electionId: string, voterId: string): Promise<Ballot | null> {
  const ballotDocId = `${electionId}_${voterId}`;
  const path = `ballots/${ballotDocId}`;
  try {
    const d = await getDoc(doc(db, 'ballots', ballotDocId));
    if (d.exists()) {
      return { id: d.id, ...d.data() } as Ballot;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitBallot(
  electionId: string,
  voterId: string,
  voterEmail: string,
  selections: Record<string, string> // positionId -> candidateId
): Promise<Ballot> {
  const ballotDocId = `${electionId}_${voterId}`;
  const ballotRef = doc(db, 'ballots', ballotDocId);
  const electionRef = doc(db, 'elections', electionId);

  // Generate cryptographic-style verification receipt
  const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
  const receiptCode = `NUSUSA-ELEC-${Date.now().toString().slice(-4)}-${randomPart}`;

  const ballotData: Ballot = {
    id: ballotDocId,
    electionId,
    voterId,
    voterEmail,
    selections,
    submittedAt: new Date().toISOString(),
    receiptCode
  };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check if voter already cast ballot
      const existingBallot = await transaction.get(ballotRef);
      if (existingBallot.exists()) {
        throw new Error('You have already voted in this election.');
      }

      // 2. Check if election is open
      const electionDoc = await transaction.get(electionRef);
      if (!electionDoc.exists()) {
        throw new Error('Election record does not exist.');
      }
      const electionData = electionDoc.data() as Election;
      if (electionData.status !== 'open') {
        throw new Error(`Voting is not active. This election is currently ${electionData.status}.`);
      }

      // 3. Write the ballot
      transaction.set(ballotRef, ballotData);

      // 4. Increment election total votes count
      transaction.update(electionRef, {
        totalVotesCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      // 5. Increment each chosen candidate's voteCount
      for (const candidateId of Object.values(selections)) {
        if (candidateId) {
          const candRef = doc(db, 'candidates', candidateId);
          transaction.update(candRef, {
            voteCount: increment(1)
          });
        }
      }
    });

    await logAuditEvent(
      'Vote Submitted',
      'ballot',
      voterEmail,
      `Ballot cast for election ${electionId}. Receipt: ${receiptCode}`,
      { electionId, receiptCode }
    );

    return ballotData;
  } catch (error: any) {
    if (error.message && error.message.includes('already voted')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `ballots/${ballotDocId}`);
  }
}

// --- RESULTS & ANALYTICS ---

export async function getElectionResults(electionId: string): Promise<ResultsSummary> {
  const election = await getElectionById(electionId);
  if (!election) throw new Error('Election not found');

  const positions = await getPositionsByElection(electionId);
  const candidates = await getCandidatesByElection(electionId);

  // Fetch all ballots for this election (fallback to election.totalVotesCount if caller is non-admin)
  let totalBallots = election.totalVotesCount || 0;
  try {
    const ballotsSnapshot = await getDocs(
      query(collection(db, 'ballots'), where('electionId', '==', electionId))
    );
    totalBallots = ballotsSnapshot.size;
  } catch {
    totalBallots = election.totalVotesCount || 0;
  }

  // Fetch voter counts
  let allVoters: UserProfile[] = [];
  try {
    allVoters = await getAllVoters();
  } catch {
    allVoters = [];
  }

  const approvedVoters = allVoters.filter(v => v.status === 'approved').length;
  const totalRegisteredVoters = allVoters.length;
  const votersVoted = totalBallots;
  const votersNotVoted = Math.max(0, approvedVoters - votersVoted);
  const turnoutPercentage = approvedVoters > 0
    ? Math.round((votersVoted / approvedVoters) * 100 * 10) / 10
    : 0;

  // Group candidates by position and compute percentages
  const positionsResults = positions.map(pos => {
    const posCandidates = candidates.filter(c => c.positionId === pos.id);
    const totalVotesInPos = posCandidates.reduce((acc, c) => acc + (c.voteCount || 0), 0);

    const candidateStats = posCandidates.map(c => {
      const votes = c.voteCount || 0;
      const percentage = totalVotesInPos > 0
        ? Math.round((votes / totalVotesInPos) * 100 * 10) / 10
        : 0;
      return {
        candidate: c,
        votes,
        percentage
      };
    }).sort((a, b) => b.votes - a.votes);

    return {
      position: pos,
      totalVotesInPosition: totalVotesInPos,
      candidates: candidateStats
    };
  });

  return {
    election,
    totalRegisteredVoters,
    approvedVoters,
    votersVoted,
    votersNotVoted,
    turnoutPercentage,
    totalBallots,
    positions,
    candidates,
    positionsResults
  };
}

// --- DEFAULT SEEDING IF DB EMPTY ---

// --- OFFICIAL 22 POSITIONS FOR NUSUSA ELECTIONS 2026/2027 ---
export const OFFICIAL_NUSUSA_2026_POSITIONS: {
  order: number;
  title: string;
  candidateName: string | null;
}[] = [
  { order: 1, title: 'President', candidateName: 'Rwoth-Omiyo Franklyn' },
  { order: 2, title: 'Vice President', candidateName: 'Okemo Olwoch Constant' },
  { order: 3, title: 'Speaker', candidateName: 'Adot Pa Olal Emmy Odoc' },
  { order: 4, title: 'Deputy Speaker', candidateName: null },
  { order: 5, title: 'General Secretary', candidateName: 'Bua Howard' },
  { order: 6, title: 'Deputy General Secretary', candidateName: 'Okello Brahams' },
  { order: 7, title: 'Treasurer', candidateName: 'Akello Flavia Nancy' },
  { order: 8, title: 'Vice Treasurer', candidateName: null },
  { order: 9, title: 'Sec. Internal and External Affairs', candidateName: null },
  { order: 10, title: 'Deputy Sec. Internal and External Affairs', candidateName: null },
  { order: 11, title: 'Chief Whip / Chairperson Disciplinary', candidateName: null },
  { order: 12, title: 'Chief Mobiliser', candidateName: 'Ogaba Francis' },
  { order: 13, title: 'Deputy Mobiliser', candidateName: 'Lamwaka Faith Alam' },
  { order: 14, title: 'Welfare Director', candidateName: null },
  { order: 15, title: 'Deputy Welfare Director', candidateName: null },
  { order: 16, title: 'Sec. Publicity', candidateName: 'Obenyo Abraham' },
  { order: 17, title: 'Deputy Sec. Publicity', candidateName: null },
  { order: 18, title: 'Sec. Education and Sports', candidateName: null },
  { order: 19, title: 'Deputy Sec. Education and Sports', candidateName: null },
  { order: 20, title: 'Sec. Culture', candidateName: null },
  { order: 21, title: 'Deputy Sec. Culture', candidateName: null },
  { order: 22, title: 'Project Manager', candidateName: 'Akona Festus' },
];

export async function seedInitialNUSUSADataIfNeeded(isAdminUser?: boolean, force?: boolean): Promise<void> {
  try {
    const elections = await getAllElections();
    const hasExistingElections = elections && elections.length > 0;

    // Check if an election already has the official title and positions
    const existingNUSUSA = elections?.find(e =>
      e.title.includes('NUSUSA ELECTIONS 2026/2027') ||
      e.title.includes('Northern Uganda Soroti University')
    );

    // If already seeded and not forcing, check if it has the 22 positions
    if (hasExistingElections && existingNUSUSA && !force) {
      const positions = await getPositionsByElection(existingNUSUSA.id);
      if (positions && positions.length >= 20) {
        return; // Already properly seeded with official 22 positions
      }
    }

    // Guard: Only administrators can create elections in Cloud Firestore
    const isRoot = auth.currentUser?.email?.toLowerCase() === '2301600199@sun.ac.ug';
    if (!isAdminUser && !isRoot) {
      console.log('No official NUSUSA elections found in database. Initial seeding will occur once administrator signs in.');
      return;
    }

    console.log('Seeding official NUSUSA 2026/2027 Election with all 22 positions...');

    // 1. Create or use existing official NUSUSA 2026/2027 Election
    let electionId = existingNUSUSA?.id;
    if (!electionId) {
      const election = await createElection({
        title: 'NUSUSA ELECTIONS 2026/2027',
        description: 'Official Leadership Elections for the Northern Uganda Soroti University Students Association (NUSUSA).',
        academicYear: '2026/2027',
        status: 'open',
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        isPublicResults: true
      });
      electionId = election.id;
    } else {
      // Update title and description to ensure no legacy text remains
      await updateElection(electionId, {
        title: 'NUSUSA ELECTIONS 2026/2027',
        description: 'Official Leadership Elections for the Northern Uganda Soroti University Students Association (NUSUSA).',
        academicYear: '2026/2027',
        status: 'open'
      });
    }

    // 2. Fetch existing positions to avoid duplicates
    const currentPositions = await getPositionsByElection(electionId);
    const existingPosMap = new Map<string, Position>();
    currentPositions.forEach(p => {
      existingPosMap.set(p.title.trim().toLowerCase(), p);
    });

    // 3. Seed all 22 official positions in exact order
    for (const item of OFFICIAL_NUSUSA_2026_POSITIONS) {
      let position = existingPosMap.get(item.title.trim().toLowerCase());
      if (!position) {
        position = await createPosition({
          electionId,
          title: item.title,
          order: item.order,
          description: `NUSUSA Official Leadership Office #${item.order}: ${item.title}`,
          maxChoices: 1
        });
      }

      // 4. Seed candidate if listed in official document and not already created
      if (item.candidateName && position) {
        const existingCandidates = await getCandidatesByElection(electionId);
        const alreadyExists = existingCandidates.some(
          c => c.fullName.trim().toLowerCase() === item.candidateName!.trim().toLowerCase()
        );

        if (!alreadyExists) {
          await createCandidate({
            electionId,
            positionId: position.id,
            fullName: item.candidateName,
            // Per instructions: Do NOT invent photos, manifestos, qualifications, or bios.
            // These will be filled by the admin or candidate via the Admin Dashboard.
            photoUrl: '',
            slogan: '',
            biography: '',
            qualifications: '',
            experience: '',
            vision: '',
            mission: '',
            objectives: '',
            manifesto: ''
          });
        }
      }
    }

    console.log('Official NUSUSA 2026/2027 election seeded successfully with 22 positions!');
  } catch (error) {
    console.warn('Seeding note:', error);
  }
}
