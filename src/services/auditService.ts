import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '../types';
import { handleFirestoreError, OperationType, isOfflineError, isPermissionError } from './firestoreErrors';

export async function logAuditEvent(
  action: string,
  category: AuditLog['category'],
  performedBy: string,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  const collectionPath = 'auditLogs';
  const newLog: AuditLog = {
    id: 'log_' + Date.now(),
    action,
    category,
    performedBy,
    details,
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  try {
    const local = localStorage.getItem('nususa_audit_logs');
    const list: AuditLog[] = local ? JSON.parse(local) : [];
    list.unshift(newLog);
    localStorage.setItem('nususa_audit_logs', JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignore
  }

  try {
    await addDoc(collection(db, collectionPath), {
      action,
      category,
      performedBy,
      details,
      metadata: metadata || {},
      timestamp: newLog.timestamp
    });
  } catch (error) {
    console.warn('[logAuditEvent] Non-blocking audit log note:', error);
  }
}

export async function getRecentAuditLogs(maxLogs: number = 50): Promise<AuditLog[]> {
  const collectionPath = 'auditLogs';
  try {
    const q = query(collection(db, collectionPath), orderBy('timestamp', 'desc'), limit(maxLogs));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as AuditLog[];
    return results;
  } catch (error) {
    if (isOfflineError(error)) {
      try {
        const local = localStorage.getItem('nususa_audit_logs');
        if (local) {
          const list = JSON.parse(local);
          if (Array.isArray(list)) return list.slice(0, maxLogs);
        }
      } catch {}
      return [];
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
    return [];
  }
}
