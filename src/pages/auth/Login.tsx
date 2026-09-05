import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Vote, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle, userProfile, isAdmin, isApproved } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOperationNotAllowed(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@sun.ac.ug')) {
      setError('Only institutional emails ending in "@sun.ac.ug" are authorized to access NUSUSA Online Voting.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(trimmedEmail, password);
      // Determine redirection based on role/status
      // We will check in a microtask or redirect to router dispatcher
      setTimeout(() => {
        navigate('/voter/dashboard');
      }, 500);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        console.warn('Firebase login notice: Email/Password provider is disabled in Firebase Console.');
        setOperationNotAllowed(true);
        setError('Email/Password sign-in is currently disabled in your Firebase project. Please use "Sign in with Google" below.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        console.warn('Login credentials notice: Invalid credentials.');
        setError('Invalid credentials. Please verify your student email and password.');
      } else {
        console.warn('Login notice:', err.message || err);
        setError(err.message || 'Failed to authenticate with Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setOperationNotAllowed(false);
    setLoading(true);
    try {
      await loginWithGoogle();
      setTimeout(() => {
        navigate('/voter/dashboard');
      }, 500);
    } catch (err: any) {
      console.warn('Google auth notice:', err.message || err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fill test university accounts
  const fillTestCredentials = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setEmail('2301600199@sun.ac.ug');
      setPassword('Admin@123456');
    } else {
      setEmail('student.voter@sun.ac.ug');
      setPassword('Student@123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md border border-emerald-600/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/nususa-logo.jpg"
              alt="NUSUSA Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Voter & Officer Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your institutional university credentials (<span className="font-semibold text-emerald-700">@sun.ac.ug</span>)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 space-y-6">
          {operationNotAllowed && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Email/Password Provider Disabled in Firebase</p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    By default, this Firebase project has <strong>Google Authentication (@sun.ac.ug)</strong> enabled. To log in immediately with your university Google account:
                  </p>
                </div>
              </div>

              <div className="pl-7">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <span>Sign In with Google (@sun.ac.ug)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <details className="pl-7 text-[11px] text-amber-800 pt-1 cursor-pointer">
                <summary className="font-semibold hover:underline">
                  How to enable Email/Password sign-in in Firebase Console
                </summary>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-slate-700">
                  <li>Go to your Firebase project: <code>nususa-online-voting</code></li>
                  <li>Click <strong>Authentication</strong> &gt; <strong>Sign-in method</strong></li>
                  <li>Select <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
                  <li>Click <strong>Save</strong> and return here to sign in with password</li>
                </ol>
              </details>
            </div>
          )}

          {error && !operationNotAllowed && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student / Staff Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="e.g. 2301600199@sun.ac.ug"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition-all bg-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Must end with <code className="text-emerald-700 font-mono font-bold">@sun.ac.ug</code>
              </p>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition-all bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Vote className="w-4 h-4" />
                  <span>Sign In to Vote</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill helpers */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium mb-2 text-center">
              Quick test fill (or use your own @sun.ac.ug email):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillTestCredentials('admin')}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold transition-colors text-center"
              >
                Fill Admin Email
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('student')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors text-center"
              >
                Fill Student Email
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google (@sun.ac.ug only)</span>
          </button>

          {/* New Registration CTA */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Not yet registered for the 2026/2027 elections?{' '}
              <Link to="/auth/register" className="font-bold text-emerald-700 hover:text-emerald-800">
                Register as a Voter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
