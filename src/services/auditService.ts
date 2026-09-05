import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';

export async function logAuditEvent(
  action: string,
  category: AuditLog['category'],
  performedBy: string,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  const collectionPath = 'auditLogs';
  try {
    await addDoc(collection(db, collectionPath), {
      action,
      category,
      performedBy,
      details,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Non-blocking for UI, but captured
    console.warn('Audit logging error:', error);
  }
}

export async function getRecentAuditLogs(maxLogs: number = 50): Promise<AuditLog[]> {
  const collectionPath = 'auditLogs';
  try {
    const q = query(collection(db, collectionPath), orderBy('timestamp', 'desc'), limit(maxLogs));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as AuditLog[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}
