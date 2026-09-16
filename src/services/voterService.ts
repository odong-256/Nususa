import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserProfile, UserStatus, VoterProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { logAuditEvent } from './auditService';
import { OFFICIAL_QUALIFIED_STUDENTS, findAutoQualifiedStudent } from '../data/officialQualifiedStudents';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { id: userDoc.id, uid: userDoc.id, ...data } as UserProfile;
    }
    return null;
  } catch (error: any) {
    if (error?.message && error.message.includes('the client is offline')) {
      try {
        await new Promise(res => setTimeout(res, 500));
        const retryDoc = await getDoc(doc(db, 'users', userId));
        if (retryDoc.exists()) {
          const data = retryDoc.data();
          return { id: retryDoc.id, uid: retryDoc.id, ...data } as UserProfile;
        }
        return null;
      } catch (retryError) {
        handleFirestoreError(retryError, OperationType.GET, path);
      }
    }
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
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedStudentId = studentId.trim();

  // Check if student is in the certified official automatic qualifications register
  const autoMatch = findAutoQualifiedStudent(normalizedEmail) || findAutoQualifiedStudent(normalizedStudentId);
  const isAutoApproved = !!autoMatch;

  const profile: Omit<UserProfile, 'id'> = {
    fullName: autoMatch?.fullName || fullName,
    email: normalizedEmail,
    studentId: autoMatch?.registrationNumber || normalizedStudentId,
    status: isAutoApproved ? 'approved' : 'pending',
    role: 'voter',
    createdAt: new Date().toISOString(),
    ...(isAutoApproved ? {
      approvedAt: new Date().toISOString(),
      approvedBy: 'System (Certified University Register)',
      course: autoMatch.course,
      yearOfStudy: autoMatch.yearOfStudy,
      phoneNumber: autoMatch.phoneNumber
    } : {})
  };

  try {
    await setDoc(doc(db, 'users', userId), profile);
    await logAuditEvent(
      isAutoApproved ? 'Voter Auto-Qualified' : 'Voter Registered',
      'auth',
      email,
      isAutoApproved
        ? `Voter ${fullName} (${email}) automatically qualified via certified institutional register.`
        : `New voter registered: ${fullName} (${email}), awaiting EC manual approval.`
    );
    return { id: userId, uid: userId, ...profile };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Cache for voters list to speed up page loads and admin views
let cachedVoters: { data: UserProfile[]; cachedAt: number } | null = null;
const VOTERS_CACHE_TTL = 30_000;

export function invalidateVotersCache() {
  cachedVoters = null;
}

export async function getAllVoters(forceRefresh = false): Promise<UserProfile[]> {
  if (!forceRefresh && cachedVoters && Date.now() - cachedVoters.cachedAt < VOTERS_CACHE_TTL) {
    return cachedVoters.data;
  }
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(d => ({
      id: d.id,
      uid: d.id,
      ...d.data()
    })) as UserProfile[];
    cachedVoters = { data: results, cachedAt: Date.now() };
    return results;
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
    invalidateVotersCache();
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

/**
 * Atomically approves a batch of voter profiles using Firestore writeBatch.
 * Records a single comprehensive audit event for official EC record-keeping.
 */
export async function bulkApproveVoters(
  voterList: { uid: string; email: string }[],
  adminId?: string,
  adminEmail?: string
): Promise<{ successCount: number }> {
  if (voterList.length === 0) return { successCount: 0 };

  const now = new Date().toISOString();
  const actualAdminEmail = adminEmail || auth.currentUser?.email || 'admin';
  const actualAdminId = adminId || auth.currentUser?.uid || 'admin';

  // Process in batches (Firestore allows up to 500 operations per writeBatch)
  const chunkSize = 400;
  let successCount = 0;

  for (let i = 0; i < voterList.length; i += chunkSize) {
    const chunk = voterList.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const v of chunk) {
      const userRef = doc(db, 'users', v.uid);
      batch.update(userRef, {
        status: 'approved',
        approvedAt: now,
        approvedBy: actualAdminId,
        updatedAt: now
      });
    }

    await batch.commit();
    invalidateVotersCache();
    successCount += chunk.length;
  }

  await logAuditEvent(
    'Bulk Voters Approved',
    'voter',
    actualAdminEmail,
    `Bulk approved ${successCount} student voter(s) for electoral eligibility.`,
    {
      count: successCount,
      voterEmails: voterList.map(v => v.email)
    }
  );

  return { successCount };
}

/**
 * Updates a user's role between 'voter' and 'admin'.
 * Restricted to Electoral Commission administrators only.
 */
export async function updateUserRole(
  userId: string,
  targetEmail: string,
  newRole: 'admin' | 'voter'
): Promise<void> {
  const adminEmail = auth.currentUser?.email || 'admin';
  const path = `users/${userId}`;

  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    if (newRole === 'admin') {
      await setDoc(doc(db, 'admins', userId), {
        email: targetEmail,
        role: 'EC Administrator',
        grantedBy: adminEmail,
        grantedAt: new Date().toISOString()
      }, { merge: true });
    }

    invalidateVotersCache();

    await logAuditEvent(
      `Role Changed to ${newRole.toUpperCase()}`,
      'admin',
      adminEmail,
      `Administrator ${adminEmail} changed role of ${targetEmail} to ${newRole}.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Seeds or synchronizes the official certified list of 43 qualified students into Firestore
 * with status 'approved'. Missing students are left to be added or approved by the admin.
 */
export async function seedOfficialQualifiedVoters(): Promise<{ added: number; updated: number }> {
  const adminEmail = auth.currentUser?.email || 'admin';
  let added = 0;
  let updated = 0;

  for (const student of OFFICIAL_QUALIFIED_STUDENTS) {
    // Generate a predictable or registration-based document ID for pre-registration
    const docId = `sun_reg_${student.registrationNumber}`;
    const userRef = doc(db, 'users', docId);

    try {
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          fullName: student.fullName,
          email: student.email.toLowerCase(),
          studentId: student.registrationNumber,
          course: student.course,
          yearOfStudy: student.yearOfStudy,
          phoneNumber: student.phoneNumber,
          status: 'approved',
          role: 'voter',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Certified University Register (2026/2027)',
          createdAt: new Date().toISOString()
        });
        added++;
      } else {
        await updateDoc(userRef, {
          fullName: student.fullName,
          email: student.email.toLowerCase(),
          status: 'approved',
          course: student.course,
          yearOfStudy: student.yearOfStudy,
          phoneNumber: student.phoneNumber
        });
        updated++;
      }
    } catch (e) {
      console.warn(`Could not seed student ${student.fullName}:`, e);
    }
  }

  invalidateVotersCache();

  await logAuditEvent(
    'Official Roster Synchronized',
    'voter',
    adminEmail,
    `Admin synchronized 43 certified university qualified voters into the database.`
  );

  return { added, updated };
}
