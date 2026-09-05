export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type UserRole = 'voter' | 'admin';

export interface UserProfile {
  id: string;
  uid?: string;
  fullName: string;
  email: string;
  studentId: string;
  phoneNumber?: string;
  department?: string;
  faculty?: string;
  bio?: string;
  photoURL?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  suspensionReason?: string;
}

export type VoterProfile = UserProfile;

export type ElectionStatus = 'draft' | 'scheduled' | 'open' | 'closed' | 'archived';

export interface Election {
  id: string;
  title: string;
  description: string;
  academicYear: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  isPublicResults?: boolean;
  totalVotesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  electionId: string;
  title: string;
  order: number;
  description: string;
  maxChoices?: number;
  maxWinners?: number;
  createdAt: string;
}

export interface Candidate {
  id: string;
  electionId: string;
  positionId: string;
  fullName: string;
  photoUrl: string;
  slogan: string;
  biography: string;
  qualifications: string;
  experience: string;
  vision: string;
  mission: string;
  manifesto: string;
  objectives: string;
  voteCount?: number;
  votesCount?: number;
  createdAt: string;
}

export interface Ballot {
  id: string;
  electionId: string;
  voterId: string;
  voterEmail: string;
  selections: Record<string, string>; // positionId -> candidateId
  submittedAt: string;
  receiptCode: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'auth' | 'election' | 'ballot' | 'admin' | 'candidate' | 'voter' | string;
  performedBy: string;
  performedByEmail?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ResultsSummary {
  election: Election;
  totalRegisteredVoters: number;
  approvedVoters: number;
  votersVoted: number;
  votersNotVoted: number;
  turnoutPercentage: number;
  totalBallots: number;
  positions?: Position[];
  candidates?: Candidate[];
  positionsResults: {
    position: Position;
    totalVotesInPosition: number;
    candidates: {
      candidate: Candidate;
      votes: number;
      percentage: number;
    }[];
  }[];
}
