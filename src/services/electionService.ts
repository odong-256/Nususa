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
  increment,
  onSnapshot
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
import { handleFirestoreError, OperationType, isOfflineError, isPermissionError } from './firestoreErrors';
import { logAuditEvent } from './auditService';
import { getAllVoters } from './voterService';

// --- OFFICIAL 13 NOMINATED POSITIONS FOR NUSUSA ELECTIONS 2026/2027 ---
export const OFFICIAL_NUSUSA_2026_POSITIONS: {
  order: number;
  title: string;
  candidateName: string;
  department?: string;
  yearOfStudy?: string;
  phoneNumber?: string;
  slogan?: string;
  biography?: string;
}[] = [
  { order: 1, title: 'President', candidateName: 'Rwoth-Omiyo Franklyn', department: 'Medicine & Surgery', yearOfStudy: 'Year 4' },
  { order: 2, title: 'Vice President', candidateName: 'Okemo Olwoch Constant', department: 'Computer Engineering', yearOfStudy: 'Year 3' },
  { order: 3, title: 'Speaker', candidateName: 'Adot Pa Olal Emmy Odoc', department: 'Biomedical Sciences', yearOfStudy: 'Year 3' },
  { order: 4, title: 'Deputy Speaker', candidateName: 'Ocepa Ivan', department: 'Computer Science & Engineering', yearOfStudy: 'Year 2' },
  { order: 5, title: 'General Secretary', candidateName: 'Bua Howard', department: 'Nursing Sciences', yearOfStudy: 'Year 2' },
  { order: 6, title: 'Deputy General Secretary', candidateName: 'Okello Brahams', department: 'Computer Engineering', yearOfStudy: 'Year 2' },
  { order: 7, title: 'Treasurer', candidateName: 'Akello Flavia Nancy', department: 'Accounting & Finance', yearOfStudy: 'Year 3' },
  {
    order: 8,
    title: 'Secretary/Treasurer',
    candidateName: 'Jonathan Sworo Mogga Gonda',
    department: 'BMLS (Medical Laboratory Science)',
    yearOfStudy: 'BMLS Student',
    phoneNumber: '0764792499',
    slogan: 'Prudence, Accountability & Dedicated Treasury Administration',
    biography: 'BMLS student contesting for Secretary/Treasurer in the NUSUSA 2026/2027 leadership elections. Dedicated to diligent secretarial management, financial integrity, and prudent treasury oversight.'
  },
  { order: 9, title: 'Chief Mobiliser', candidateName: 'Ogaba Francis', department: 'Electrical Engineering', yearOfStudy: 'Year 3' },
  { order: 10, title: 'Deputy Mobiliser', candidateName: 'Lamwaka Faith Alam', department: 'Nursing Sciences', yearOfStudy: 'Year 2' },
  { order: 11, title: 'Welfare Director', candidateName: 'Alaroker Prisca', department: 'Nursing Sciences', yearOfStudy: 'Year 3' },
  { order: 12, title: 'Sec. Publicity', candidateName: 'Obenyo Abraham', department: 'Public Administration', yearOfStudy: 'Year 2' },
  { order: 13, title: 'Project Manager', candidateName: 'Akona Festus', department: 'Computer Engineering', yearOfStudy: 'Year 4' },
];

export const DEFAULT_OFFICIAL_ELECTION: Election = {
  id: 'elec_nususa_2026',
  title: 'NUSUSA ELECTIONS 2026/2027',
  description: 'Official Leadership Elections for the Northern Uganda Soroti University Students Association (NUSUSA).',
  academicYear: '2026/2027',
  status: 'open',
  startDate: new Date(Date.now() - 3600000 * 24).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  totalVotesCount: 0,
  isPublicResults: true,
  createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
};

export function getOfflinePositions(electionId: string): Position[] {
  return OFFICIAL_NUSUSA_2026_POSITIONS.map(p => ({
    id: `pos_${p.order}`,
    electionId,
    title: p.title,
    order: p.order,
    description: `NUSUSA Official Leadership Office #${p.order}: ${p.title}`,
    maxChoices: 1,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }));
}

export function getOfflineCandidates(electionId: string): Candidate[] {
  return OFFICIAL_NUSUSA_2026_POSITIONS.map(p => ({
    id: `cand_${p.order}`,
    electionId,
    positionId: `pos_${p.order}`,
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
    voteCount: 0,
    votesCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }));
}

// --- IN-MEMORY CACHE FOR HIGH-SPEED PAGE LOADS ---
interface CacheItem<T> {
  data: T;
  cachedAt: number;
}

const memoryCache = new Map<string, CacheItem<any>>();
const CACHE_TTL_MS = 30_000; // 30 seconds default TTL for instant page-to-page navigation

export function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.cachedAt > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, cachedAt: Date.now() });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k);
    }
  }
}

// --- ELECTIONS ---

export async function getAllElections(forceRefresh = false): Promise<Election[]> {
  const cacheKey = 'elections:all';
  if (!forceRefresh) {
    const cached = getCached<Election[]>(cacheKey);
    if (cached) return cached;
  }
  const path = 'elections';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Election[];
    if (results.length > 0) {
      setCached(cacheKey, results);
      try {
        localStorage.setItem('nususa_cached_elections', JSON.stringify(results));
      } catch {}
      return results;
    }
    setCached(cacheKey, [DEFAULT_OFFICIAL_ELECTION]);
    return [DEFAULT_OFFICIAL_ELECTION];
  } catch (error) {
    if (isOfflineError(error)) {
      try {
        const raw = localStorage.getItem('nususa_cached_elections');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return [DEFAULT_OFFICIAL_ELECTION];
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    console.warn(`[getAllElections] Error:`, error);
    return [DEFAULT_OFFICIAL_ELECTION];
  }
}

export async function getElectionById(id: string, forceRefresh = false): Promise<Election | null> {
  const cacheKey = `election:${id}`;
  if (!forceRefresh) {
    const cached = getCached<Election | null>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;
  }
  const path = `elections/${id}`;
  try {
    const d = await getDoc(doc(db, 'elections', id));
    if (d.exists()) {
      const data = { id: d.id, ...d.data() } as Election;
      setCached(cacheKey, data);
      return data;
    }
    if (id === DEFAULT_OFFICIAL_ELECTION.id || id.includes('nususa') || id.includes('2026')) {
      return DEFAULT_OFFICIAL_ELECTION;
    }
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      return DEFAULT_OFFICIAL_ELECTION;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return DEFAULT_OFFICIAL_ELECTION;
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
    invalidateCache('election');
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
    invalidateCache('election');
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
    invalidateCache('election');
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
    invalidateCache('election');
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

export async function getPositionsByElection(electionId: string, forceRefresh = false): Promise<Position[]> {
  const cacheKey = `positions:${electionId}`;
  if (!forceRefresh) {
    const cached = getCached<Position[]>(cacheKey);
    if (cached) return cached;
  }
  const path = 'positions';
  try {
    const q = query(collection(db, path), where('electionId', '==', electionId));
    const snapshot = await getDocs(q);
    const positions = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Position[];
    const sorted = positions.sort((a, b) => a.order - b.order);
    if (sorted.length > 0) {
      setCached(cacheKey, sorted);
      return sorted;
    }
    const offlinePos = getOfflinePositions(electionId);
    setCached(cacheKey, offlinePos);
    return offlinePos;
  } catch (error) {
    if (isOfflineError(error)) {
      const offlinePos = getOfflinePositions(electionId);
      setCached(cacheKey, offlinePos);
      return offlinePos;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return getOfflinePositions(electionId);
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
    invalidateCache('positions');
    await logAuditEvent(
      'Position Created',
      'election',
      adminEmail || auth.currentUser?.email || 'admin',
      `Position added: "${newPos.title}" for election ${newPos.electionId}`
    );
    return newPos;
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('positions');
      return newPos;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return newPos;
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
    invalidateCache('positions');
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('positions');
      return;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
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
    invalidateCache('positions');
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('positions');
      return;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

// --- CANDIDATES ---

export async function getAllCandidates(electionId?: string, forceRefresh = false): Promise<Candidate[]> {
  const cacheKey = `candidates:${electionId || 'all'}`;
  if (!forceRefresh) {
    const cached = getCached<Candidate[]>(cacheKey);
    if (cached) return cached;
  }
  const path = 'candidates';
  try {
    const q = electionId
      ? query(collection(db, path), where('electionId', '==', electionId))
      : collection(db, path);
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(d => {
      const data = d.data();
      const officialMatch = OFFICIAL_NUSUSA_2026_POSITIONS.find(
        p => p.candidateName && data.fullName && (
          p.candidateName.trim().toLowerCase() === data.fullName.trim().toLowerCase() ||
          (p.candidateName.toLowerCase().includes('jonathan') && data.fullName.toLowerCase().includes('jonathan'))
        )
      );
      return {
        id: d.id,
        ...data,
        department: data.department || officialMatch?.department || '',
        yearOfStudy: data.yearOfStudy || officialMatch?.yearOfStudy || '',
        phoneNumber: data.phoneNumber || officialMatch?.phoneNumber || '',
        votesCount: data.votesCount ?? data.voteCount ?? 0
      };
    }) as Candidate[];
    if (list.length > 0) {
      setCached(cacheKey, list);
      return list;
    }
    const offlineCands = getOfflineCandidates(electionId || DEFAULT_OFFICIAL_ELECTION.id);
    setCached(cacheKey, offlineCands);
    return offlineCands;
  } catch (error) {
    if (isOfflineError(error)) {
      const offlineCands = getOfflineCandidates(electionId || DEFAULT_OFFICIAL_ELECTION.id);
      setCached(cacheKey, offlineCands);
      return offlineCands;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return getOfflineCandidates(electionId || DEFAULT_OFFICIAL_ELECTION.id);
  }
}

export async function getCandidatesByElection(electionId: string, forceRefresh = false): Promise<Candidate[]> {
  return getAllCandidates(electionId, forceRefresh);
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
    invalidateCache('candidates');
    await logAuditEvent(
      'Candidate Registered',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate created: "${newCandidate.fullName}" running for position ${newCandidate.positionId}`
    );
    return newCandidate;
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('candidates');
      return newCandidate;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return newCandidate;
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
    invalidateCache('candidates');
    await logAuditEvent(
      'Candidate Updated',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate ${id} updated`
    );
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('candidates');
      return;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
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
    invalidateCache('candidates');
    await logAuditEvent(
      'Candidate Deleted',
      'candidate',
      adminEmail || auth.currentUser?.email || 'admin',
      `Candidate ${id} removed`
    );
  } catch (error) {
    if (isOfflineError(error)) {
      invalidateCache('candidates');
      return;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

// --- BALLOTS & VOTING WORKFLOW ---

export async function checkHasVoted(electionId: string, voterId: string, forceRefresh = false): Promise<boolean> {
  const cacheKey = `hasVoted:${electionId}:${voterId}`;
  if (!forceRefresh) {
    const cached = getCached<boolean>(cacheKey);
    if (typeof cached === 'boolean') return cached;
  }

  const localVoted = localStorage.getItem(`voted_${electionId}_${voterId}`);
  if (localVoted === 'true') {
    setCached(cacheKey, true);
    return true;
  }

  const ballotDocId = `${electionId}_${voterId}`;
  const path = `ballots/${ballotDocId}`;
  try {
    const d = await getDoc(doc(db, 'ballots', ballotDocId));
    const exists = d.exists();
    setCached(cacheKey, exists);
    if (exists) {
      try {
        localStorage.setItem(`voted_${electionId}_${voterId}`, 'true');
      } catch {}
    }
    return exists;
  } catch (error) {
    if (isOfflineError(error)) {
      return localVoted === 'true';
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return localVoted === 'true';
  }
}

export async function getVoterBallot(electionId: string, voterId: string, forceRefresh = false): Promise<Ballot | null> {
  const cacheKey = `ballot:${electionId}:${voterId}`;
  if (!forceRefresh) {
    const cached = getCached<Ballot | null>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;
  }

  // Check local offline storage
  try {
    const localRaw = localStorage.getItem(`ballot_${electionId}_${voterId}`);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      setCached(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  const ballotDocId = `${electionId}_${voterId}`;
  const path = `ballots/${ballotDocId}`;
  try {
    const d = await getDoc(doc(db, 'ballots', ballotDocId));
    if (d.exists()) {
      const b = { id: d.id, ...d.data() } as Ballot;
      setCached(cacheKey, b);
      return b;
    }
    return null;
  } catch (error) {
    if (isOfflineError(error)) {
      return null;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return null;
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

    invalidateCache('election');
    invalidateCache('candidates');
    invalidateCache('hasVoted');
    invalidateCache('ballot');
    try {
      localStorage.setItem(`voted_${electionId}_${voterId}`, 'true');
      localStorage.setItem(`ballot_${electionId}_${voterId}`, JSON.stringify(ballotData));
    } catch {}

    return ballotData;
  } catch (error: any) {
    if (error.message && error.message.includes('already voted')) {
      throw error;
    }
    if (isOfflineError(error)) {
      // Record ballot locally so voter is not blocked
      try {
        localStorage.setItem(`voted_${electionId}_${voterId}`, 'true');
        localStorage.setItem(`ballot_${electionId}_${voterId}`, JSON.stringify(ballotData));
      } catch {}
      invalidateCache('election');
      invalidateCache('candidates');
      invalidateCache('hasVoted');
      invalidateCache('ballot');
      await logAuditEvent(
        'Vote Submitted (Offline Cached)',
        'ballot',
        voterEmail,
        `Ballot cast for election ${electionId}. Receipt: ${receiptCode}`,
        { electionId, receiptCode }
      );
      return ballotData;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `ballots/${ballotDocId}`);
    }
    throw error;
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

/**
 * Real-time listener that monitors an active election and its candidates for newly cast ballots.
 * Automatically notifies when new votes are cast without requiring a full page refresh.
 */
export function subscribeToElectionLiveUpdates(
  electionId: string,
  onVoteCast: (newTotalVotes: number, previousTotalVotes: number) => void,
  onError?: (error: any) => void
): () => void {
  if (!electionId) return () => {};

  let previousVotes: number | null = null;
  let previousCandidateVotesTotal: number | null = null;
  let hasInitialized = false;

  const electionDocRef = doc(db, 'elections', electionId);
  const candidatesQuery = query(collection(db, 'candidates'), where('electionId', '==', electionId));

  const checkAndNotify = (currentVotes: number) => {
    if (previousVotes !== null && currentVotes > previousVotes) {
      const prev = previousVotes;
      previousVotes = currentVotes;
      onVoteCast(currentVotes, prev);
    } else {
      previousVotes = currentVotes;
    }
  };

  const unsubElection = onSnapshot(
    electionDocRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const currentVotes = Number(data.totalVotesCount || 0);

      if (!hasInitialized) {
        previousVotes = currentVotes;
        hasInitialized = true;
      } else if (previousVotes !== null && currentVotes > previousVotes) {
        checkAndNotify(currentVotes);
      } else {
        previousVotes = Math.max(previousVotes ?? 0, currentVotes);
      }
    },
    (err) => {
      console.warn('Live election subscription error:', err);
      if (onError) onError(err);
    }
  );

  const unsubCandidates = onSnapshot(
    candidatesQuery,
    (snapshot) => {
      let candidateVotesTotal = 0;
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        candidateVotesTotal += Number(d.voteCount || d.votesCount || 0);
      });

      if (previousCandidateVotesTotal === null) {
        previousCandidateVotesTotal = candidateVotesTotal;
      } else if (candidateVotesTotal > previousCandidateVotesTotal) {
        const diff = candidateVotesTotal - previousCandidateVotesTotal;
        previousCandidateVotesTotal = candidateVotesTotal;
        const currentTotal = (previousVotes ?? 0) + diff;
        checkAndNotify(currentTotal);
      }
    },
    (err) => {
      console.warn('Live candidates subscription error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubElection();
    unsubCandidates();
  };
}

// --- DEFAULT SEEDING IF DB EMPTY ---

export async function seedInitialNUSUSADataIfNeeded(isAdminUser?: boolean, force?: boolean): Promise<void> {
  try {
    const elections = await getAllElections();
    const hasExistingElections = elections && elections.length > 0;

    // Check if an election already has the official title and positions
    const existingNUSUSA = elections?.find(e =>
      e.title.includes('NUSUSA ELECTIONS 2026/2027') ||
      e.title.includes('Northern Uganda Soroti University')
    );

    // If already seeded and not forcing, check if it has the 13 nominated positions and Jonathan
    if (hasExistingElections && existingNUSUSA && !force) {
      const candidates = await getCandidatesByElection(existingNUSUSA.id);
      const hasJonathan = candidates.some(c => c.fullName.toLowerCase().includes('jonathan'));
      if (hasJonathan && candidates.length >= 13) {
        return; // Already properly synced
      }
    }

    // Guard: Only administrators can create elections in Cloud Firestore
    const isRoot = auth.currentUser?.email?.toLowerCase() === '2301600199@sun.ac.ug';
    if (!isAdminUser && !isRoot) {
      console.log('No official NUSUSA elections found in database. Initial seeding will occur once administrator signs in.');
      return;
    }

    console.log('Seeding official NUSUSA 2026/2027 Election with the 13 nominated candidates and pruning vacant positions...');

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
      await updateElection(electionId, {
        title: 'NUSUSA ELECTIONS 2026/2027',
        description: 'Official Leadership Elections for the Northern Uganda Soroti University Students Association (NUSUSA).',
        academicYear: '2026/2027',
        status: 'open'
      });
    }

    // 2. Fetch existing positions and candidates
    const currentPositions = await getPositionsByElection(electionId);
    const existingCandidates = await getCandidatesByElection(electionId);

    // 3. Remove vacant positions or positions without candidates (e.g. from obsolete 22-position list)
    const officialTitlesLower = OFFICIAL_NUSUSA_2026_POSITIONS.map(p => p.title.trim().toLowerCase());
    for (const pos of currentPositions) {
      const posTitleLower = pos.title.trim().toLowerCase();
      const isOfficial = officialTitlesLower.includes(posTitleLower) ||
        posTitleLower.includes('secretary/treasurer') ||
        posTitleLower.includes('secretary to treasury');
      const posCands = existingCandidates.filter(c => c.positionId === pos.id);

      // If position is not in official list and has no candidates, prune it
      if (!isOfficial && posCands.length === 0) {
        console.log(`Pruning vacant position: ${pos.title}`);
        await deletePosition(pos.id);
      }
    }

    // Refetch positions after pruning
    const refreshedPositions = await getPositionsByElection(electionId);
    const existingPosMap = new Map<string, Position>();
    refreshedPositions.forEach(p => {
      existingPosMap.set(p.title.trim().toLowerCase(), p);
    });

    // 4. Seed all 13 official positions in exact order
    for (const item of OFFICIAL_NUSUSA_2026_POSITIONS) {
      let position = existingPosMap.get(item.title.trim().toLowerCase());
      if (!position && item.title.includes('Secretary/Treasurer')) {
        position = existingPosMap.get('secretary to treasury') || existingPosMap.get('secretary to the treasury');
      }

      if (!position) {
        position = await createPosition({
          electionId,
          title: item.title,
          order: item.order,
          description: `NUSUSA Official Leadership Office #${item.order}: ${item.title}`,
          maxChoices: 1
        });
      } else if (position.order !== item.order || position.title !== item.title) {
        await updatePosition(position.id, {
          order: item.order,
          title: item.title,
          description: `NUSUSA Official Leadership Office #${item.order}: ${item.title}`
        });
      }

      // 5. Seed or update candidate
      if (item.candidateName && position) {
        const matchingCand = existingCandidates.find(
          c => c.fullName.trim().toLowerCase() === item.candidateName.trim().toLowerCase() ||
               (item.candidateName.toLowerCase().includes('jonathan') && c.fullName.toLowerCase().includes('jonathan'))
        );

        if (!matchingCand) {
          await createCandidate({
            electionId,
            positionId: position.id,
            fullName: item.candidateName,
            department: item.department || '',
            yearOfStudy: item.yearOfStudy || '',
            phoneNumber: item.phoneNumber || '',
            photoUrl: '',
            slogan: item.slogan || '',
            biography: item.biography || '',
            qualifications: '',
            experience: '',
            vision: '',
            mission: '',
            objectives: '',
            manifesto: ''
          });
        } else {
          // Update candidate details if needed
          const updates: Partial<Candidate> = {};
          if (item.phoneNumber && (!matchingCand.phoneNumber || matchingCand.phoneNumber !== item.phoneNumber)) {
            updates.phoneNumber = item.phoneNumber;
          }
          if (item.department && (!matchingCand.department || matchingCand.department !== item.department)) {
            updates.department = item.department;
          }
          if (item.yearOfStudy && (!matchingCand.yearOfStudy || matchingCand.yearOfStudy !== item.yearOfStudy)) {
            updates.yearOfStudy = item.yearOfStudy;
          }
          if (item.slogan && (!matchingCand.slogan || matchingCand.slogan !== item.slogan)) {
            updates.slogan = item.slogan;
          }
          if (item.biography && (!matchingCand.biography || matchingCand.biography !== item.biography)) {
            updates.biography = item.biography;
          }
          if (matchingCand.positionId !== position.id) {
            updates.positionId = position.id;
          }
          if (Object.keys(updates).length > 0) {
            await updateCandidate(matchingCand.id, updates);
          }
        }
      }
    }

    console.log('Official NUSUSA 2026/2027 election seeded successfully with 13 nominated candidates!');
  } catch (error) {
    console.warn('Seeding note:', error);
  }
}

// --- HOURLY TURNOUT ANALYTICS ---

export interface HourlyTurnoutPoint {
  hourLabel: string;
  votesCount: number;
  cumulativeVotes: number;
  turnoutRate: number; // percentage of approved voters
}

export async function getHourlyTurnoutData(
  electionId: string,
  totalApprovedVoters: number = 0
): Promise<HourlyTurnoutPoint[]> {
  try {
    const ballotsQuery = query(
      collection(db, 'ballots'),
      where('electionId', '==', electionId)
    );
    const snapshot = await getDocs(ballotsQuery);
    const ballots = snapshot.docs.map(d => d.data() as Ballot);

    // Standard university polling window: 08:00 to 18:00
    const standardHours = [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    const hourlyCounts: Record<string, number> = {};
    standardHours.forEach(h => {
      hourlyCounts[h] = 0;
    });

    ballots.forEach(b => {
      if (b.submittedAt) {
        const date = new Date(b.submittedAt);
        const hour = date.getHours().toString().padStart(2, '0') + ':00';
        if (hourlyCounts[hour] !== undefined) {
          hourlyCounts[hour] += 1;
        } else {
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        }
      }
    });

    const sortedHours = Object.keys(hourlyCounts).sort();
    let cumulative = 0;
    const baseDenom = totalApprovedVoters > 0 ? totalApprovedVoters : Math.max(ballots.length, 1);

    return sortedHours.map(hourLabel => {
      const votes = hourlyCounts[hourLabel] || 0;
      cumulative += votes;
      const rate = Math.round((cumulative / baseDenom) * 1000) / 10;
      return {
        hourLabel,
        votesCount: votes,
        cumulativeVotes: cumulative,
        turnoutRate: rate
      };
    });
  } catch (error) {
    console.error('Failed to calculate hourly turnout:', error);
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    return hours.map(h => ({
      hourLabel: h,
      votesCount: 0,
      cumulativeVotes: 0,
      turnoutRate: 0
    }));
  }
}

// --- DAILY TURNOUT & PARTICIPATION TRENDS ---

export interface DailyTurnoutTrendPoint {
  dateKey: string; // e.g. "2026-09-10"
  formattedDate: string; // e.g. "Sep 10"
  dayName: string; // e.g. "Thu"
  newRegistrations: number;
  approvedRegistrations: number;
  cumulativeRegistrations: number;
  cumulativeApproved: number;
  dailyVotes: number;
  cumulativeVotes: number;
  turnoutRate: number; // percentage (0 - 100)
}

export async function getDailyTurnoutTrends(
  electionId?: string,
  daysCount: number = 14,
  providedVoters?: UserProfile[]
): Promise<DailyTurnoutTrendPoint[]> {
  try {
    // 1. Fetch voters if not provided
    let voters = providedVoters;
    if (!voters || voters.length === 0) {
      try {
        voters = await getAllVoters();
      } catch {
        voters = [];
      }
    }

    // 2. Fetch ballots for the election or all ballots
    let ballots: Ballot[] = [];
    try {
      if (electionId && electionId !== 'all') {
        const ballotsQuery = query(
          collection(db, 'ballots'),
          where('electionId', '==', electionId)
        );
        const snapshot = await getDocs(ballotsQuery);
        ballots = snapshot.docs.map(d => d.data() as Ballot);
      } else {
        const snapshot = await getDocs(collection(db, 'ballots'));
        ballots = snapshot.docs.map(d => d.data() as Ballot);
      }
    } catch {
      ballots = [];
    }

    // 3. Generate continuous date keys for the requested range (ending at today)
    const now = new Date();
    const dateKeys: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      dateKeys.push(iso);
    }

    const startDateKey = dateKeys[0];

    // 4. Group registrations by day and count registrations prior to window
    let preWindowRegistrations = 0;
    let preWindowApproved = 0;
    const dailyRegistrationsMap: Record<string, number> = {};
    const dailyApprovedMap: Record<string, number> = {};

    dateKeys.forEach(k => {
      dailyRegistrationsMap[k] = 0;
      dailyApprovedMap[k] = 0;
    });

    (voters || []).forEach(v => {
      const regDate = v.createdAt ? v.createdAt.split('T')[0] : '';
      if (regDate) {
        if (regDate < startDateKey) {
          preWindowRegistrations += 1;
        } else if (dailyRegistrationsMap[regDate] !== undefined) {
          dailyRegistrationsMap[regDate] += 1;
        }
      }

      if (v.status === 'approved') {
        const appDate = v.approvedAt ? v.approvedAt.split('T')[0] : regDate;
        if (appDate) {
          if (appDate < startDateKey) {
            preWindowApproved += 1;
          } else if (dailyApprovedMap[appDate] !== undefined) {
            dailyApprovedMap[appDate] += 1;
          }
        }
      }
    });

    // 5. Group ballots by day and count ballots prior to window
    let preWindowVotes = 0;
    const dailyVotesMap: Record<string, number> = {};
    dateKeys.forEach(k => {
      dailyVotesMap[k] = 0;
    });

    ballots.forEach(b => {
      const voteDate = b.submittedAt ? b.submittedAt.split('T')[0] : '';
      if (voteDate) {
        if (voteDate < startDateKey) {
          preWindowVotes += 1;
        } else if (dailyVotesMap[voteDate] !== undefined) {
          dailyVotesMap[voteDate] += 1;
        }
      }
    });

    // 6. Build the continuous timeline with cumulative sums
    let cumReg = preWindowRegistrations;
    let cumApp = preWindowApproved;
    let cumVotes = preWindowVotes;

    const points: DailyTurnoutTrendPoint[] = dateKeys.map(dateKey => {
      const newReg = dailyRegistrationsMap[dateKey] || 0;
      const newApp = dailyApprovedMap[dateKey] || 0;
      const votesToday = dailyVotesMap[dateKey] || 0;

      cumReg += newReg;
      cumApp += newApp;
      cumVotes += votesToday;

      // Calculate turnout rate against approved voters
      const baseApproved = Math.max(cumApp, 1);
      const rate = cumApp > 0 ? Math.min(100, Math.round((cumVotes / baseApproved) * 1000) / 10) : 0;

      const dateObj = new Date(`${dateKey}T12:00:00Z`);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        dateKey,
        formattedDate,
        dayName,
        newRegistrations: newReg,
        approvedRegistrations: newApp,
        cumulativeRegistrations: cumReg,
        cumulativeApproved: cumApp,
        dailyVotes: votesToday,
        cumulativeVotes: cumVotes,
        turnoutRate: rate
      };
    });

    return points;
  } catch (error) {
    console.error('Failed to get daily turnout trends:', error);
    return [];
  }
}

