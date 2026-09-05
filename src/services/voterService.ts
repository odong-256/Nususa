import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserProfile, UserStatus, VoterProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { logAuditEvent } from './auditService';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { id: userDoc.id, uid: userDoc.id, ...data } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(
  userId: string,
  fullName: string,
  email: string,
  studentId: string
): Promise<UserProfile> {
  const path = `users/${userId}`;
  const profile: Omit<UserProfile, 'id'> = {
    fullName,
    email: email.trim().toLowerCase(),
    studentId: studentId.trim(),
    status: 'pending',
    role: 'voter',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', userId), profile);
    await logAuditEvent(
      'Voter Registered',
      'auth',
      email,
      `New voter registered: ${fullName} (${email}), awaiting EC approval.`
    );
    return { id: userId, uid: userId, ...profile };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getAllVoters(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      uid: d.id,
      ...d.data()
    })) as UserProfile[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateVoterStatus(
  voterId: string,
  voterEmail: string,
  status: UserStatus,
  reason?: string
): Promise<void> {
  const path = `users/${voterId}`;
  const adminEmail = auth.currentUser?.email || 'admin';
  const updates: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString()
  };

  if (status === 'approved') {
    updates.approvedAt = new Date().toISOString();
    updates.approvedBy = auth.currentUser?.uid || 'admin';
  } else if (status === 'rejected') {
    updates.rejectionReason = reason || 'Verification documents could not be validated.';
  } else if (status === 'suspended') {
    updates.suspensionReason = reason || 'Account temporarily suspended by the Electoral Commission.';
  }

  try {
    await updateDoc(doc(db, 'users', voterId), updates);
    await logAuditEvent(
      `Voter ${status.toUpperCase()}`,
      'voter',
      adminEmail,
      `Voter ${voterEmail} was ${status} by ${adminEmail}.${reason ? ` Reason: ${reason}` : ''}`,
      { voterId, newStatus: status, reason }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function approveVoter(
  voterId: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  return updateVoterStatus(voterId, adminEmail || 'voter', 'approved');
}

export async function rejectVoter(
  voterId: string,
  reason: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  return updateVoterStatus(voterId, adminEmail || 'voter', 'rejected', reason);
}

export async function suspendVoter(
  voterId: string,
  reason: string,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  return updateVoterStatus(voterId, adminEmail || 'voter', 'suspended', reason);
}
