import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return (error as any)?.message || String(error);
}

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = getErrorMessage(error).toLowerCase();
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('the client is offline') ||
    msg.includes('client is offline') ||
    msg.includes('offline') ||
    msg.includes('backend') ||
    msg.includes('service_disabled') ||
    msg.includes('api has not been used') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('transport errored')
  );
}

export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  // Offline, connection failures, or disabled API responses are never security rules violations
  if (isOfflineError(error)) return false;

  const msg = getErrorMessage(error).toLowerCase();
  const code = (error as any)?.code;
  return (
    code === 'permission-denied' ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('insufficient permissions') ||
    msg.includes('permission_denied') ||
    msg.includes('permission-denied')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMsg = getErrorMessage(error);
  
  // If it is an offline, network, or disabled API error, do NOT log as security rules assertion
  if (isOfflineError(error)) {
    console.warn(`[Firestore Offline/Unavailable] operation=${operationType} path=${path}: ${errMsg}`);
    throw new Error(`Firestore is currently offline or unreachable (${operationType} at ${path}): ${errMsg}`);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

