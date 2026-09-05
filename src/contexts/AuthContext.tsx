import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, UserStatus } from '../types';
import { createUserProfile, getUserProfile } from '../services/voterService';
import { seedInitialNUSUSADataIfNeeded } from '../services/electionService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, studentId: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: (metadata?: { fullName?: string; studentId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  grantAdminPrivileges: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// University administrative email recognized by default
const ROOT_ADMIN_EMAIL = '2301600199@sun.ac.ug';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isRootAdmin = currentUser?.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isRootAdmin || userProfile?.role === 'admin';
  const isApproved = isAdmin || userProfile?.status === 'approved';

  // Automatically seed initial elections and candidates when administrator is authenticated
  useEffect(() => {
    if (isAdmin) {
      seedInitialNUSUSADataIfNeeded(true).catch(console.error);
    }
  }, [isAdmin]);

  const fetchProfile = async (user: User) => {
    const isRootAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
    let profile: UserProfile | null = null;

    try {
      profile = await getUserProfile(user.uid);
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
    }

    // Check if user document exists in admins collection
    let adminDocExists = false;
    try {
      const admSnap = await getDoc(doc(db, 'admins', user.uid));
      adminDocExists = admSnap.exists();
    } catch {
      adminDocExists = false;
    }

    const defaultRole = isRootAdmin || adminDocExists ? 'admin' : 'voter';
    const defaultStatus: UserStatus = isRootAdmin || adminDocExists ? 'approved' : 'pending';

    if (!profile) {
      const newProfile: UserProfile = {
        id: user.uid,
        fullName: user.displayName || user.email?.split('@')[0] || 'NUSUSA Student',
        email: user.email || '',
        studentId: user.email?.split('@')[0] || 'STD-' + user.uid.slice(0, 6),
        status: defaultStatus,
        role: defaultRole,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (err) {
        console.warn('Could not persist new user profile to Firestore:', err);
      }
      profile = newProfile;
    } else if (isRootAdmin && (profile.role !== 'admin' || profile.status !== 'approved')) {
      // Ensure root admin always holds admin privileges
      profile = { ...profile, role: 'admin', status: 'approved' };
      try {
        await updateDoc(doc(db, 'users', user.uid), { role: 'admin', status: 'approved' });
      } catch (err) {
        console.warn('Could not update root admin status in users collection:', err);
      }
    }

    // If user is designated root admin, ensure admin doc exists
    if (isRootAdmin && !adminDocExists) {
      try {
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          name: profile?.fullName || 'Chief Electoral Commissioner',
          role: 'Chief Administrator',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Could not auto-write admin doc:', e);
      }
    }

    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@sun.ac.ug')) {
      throw new Error('Access Restricted: Only institutional emails ending in "@sun.ac.ug" are eligible to log in.');
    }
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, pass);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        const customErr = new Error(
          'Email/Password login is not enabled in this Firebase project. Please use "Sign in with Google" or enable the Email/Password provider in the Firebase Console.'
        );
        (customErr as any).code = 'auth/operation-not-allowed';
        throw customErr;
      }
      throw err;
    }
  };

  const registerWithEmail = async (
    fullName: string,
    email: string,
    pass: string,
    studentId: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@sun.ac.ug')) {
      throw new Error('Registration Error: Only institutional student emails ending in "@sun.ac.ug" are accepted.');
    }

    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        const customErr = new Error(
          'Email/Password registration is not enabled in this Firebase project. Please use "Register with Google" or enable the Email/Password provider in the Firebase Console (Authentication > Sign-in method).'
        );
        (customErr as any).code = 'auth/operation-not-allowed';
        throw customErr;
      }
      throw err;
    }

    const isRoot = normalizedEmail === ROOT_ADMIN_EMAIL.toLowerCase();

    // Create the voter profile in Firestore
    const profile = await createUserProfile(cred.user.uid, fullName, normalizedEmail, studentId);
    if (isRoot) {
      // Set admin record
      await setDoc(doc(db, 'admins', cred.user.uid), {
        email: normalizedEmail,
        name: fullName,
        role: 'Chief Administrator',
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...profile,
        role: 'admin',
        status: 'approved'
      });
    }
    await fetchProfile(cred.user);
  };

  const registerWithGoogle = async (metadata?: { fullName?: string; studentId?: string }) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email?.toLowerCase() || '';

    if (!email.endsWith('@sun.ac.ug')) {
      await signOut(auth);
      throw new Error(
        `Institutional Authentication Failed: ${email} is not a valid "@sun.ac.ug" student address.`
      );
    }

    // If metadata was provided in the form, create or update user profile with full name and student ID
    if (metadata?.fullName || metadata?.studentId) {
      try {
        const userDocRef = doc(db, 'users', result.user.uid);
        const existingDoc = await getDoc(userDocRef);
        const isRoot = email === ROOT_ADMIN_EMAIL.toLowerCase();
        if (!existingDoc.exists()) {
          const newProfile: UserProfile = {
            id: result.user.uid,
            fullName: metadata.fullName || result.user.displayName || 'NUSUSA Student',
            email: result.user.email || email,
            studentId: metadata.studentId || email.split('@')[0],
            status: isRoot ? 'approved' : 'pending',
            role: isRoot ? 'admin' : 'voter',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
        }
      } catch (err) {
        console.warn('Could not store metadata for Google user:', err);
      }
    }

    await fetchProfile(result.user);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email?.toLowerCase() || '';

    if (!email.endsWith('@sun.ac.ug')) {
      await signOut(auth);
      throw new Error(
        `Institutional Authentication Failed: ${email} is not a valid "@sun.ac.ug" student address.`
      );
    }
    await fetchProfile(result.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const grantAdminPrivileges = async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'admins', currentUser.uid), {
        email: currentUser.email,
        name: userProfile?.fullName || 'Administrator',
        role: 'Electoral Commissioner',
        createdAt: new Date().toISOString()
      });
      if (userProfile) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...userProfile,
          role: 'admin',
          status: 'approved',
          updatedAt: new Date().toISOString()
        });
      }
      await refreshProfile();
    } catch (e) {
      console.error('Failed to grant admin privilege:', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isApproved,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshProfile,
        grantAdminPrivileges
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
