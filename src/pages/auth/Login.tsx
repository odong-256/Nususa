import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Vote, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, KeyRound, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInvalidCredential, setIsInvalidCredential] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [freshResetNotice, setFreshResetNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const currentHostname = window.location.hostname;
  const consoleAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const copyCurrentDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  const handleStartAfresh = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.clear();
    sessionStorage.clear();
    setFreshResetNotice(true);
    setError(null);
    setUnauthorizedDomain(false);
    setOperationNotAllowed(false);
    setIsInvalidCredential(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsInvalidCredential(false);
    setResetSuccessMessage(null);
    setOperationNotAllowed(false);
    setUnauthorizedDomain(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@sun.ac.ug')) {
      setError('Only institutional emails ending in "@sun.ac.ug" are authorized to access NUSUSA Online Voting.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(trimmedEmail, password);
      setTimeout(() => {
        if (trimmedEmail === '2301600199@sun.ac.ug') {
          navigate('/admin/overview');
        } else {
          navigate('/voter/dashboard');
        }
      }, 400);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        console.warn('Firebase login notice: Email/Password provider is disabled in Firebase Console.');
        setOperationNotAllowed(true);
        setError('Email/Password sign-in is currently disabled in your Firebase project. Please use "Sign in with Google" or enable Email/Password in Firebase Console.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        console.warn('Login credentials notice: Invalid credentials.');
        setIsInvalidCredential(true);
        setError('Invalid credentials. The password entered does not match this student account, or this account was registered via Google Sign-In.');
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
    setIsInvalidCredential(false);
    setResetSuccessMessage(null);
    setOperationNotAllowed(false);
    setUnauthorizedDomain(false);
    setLoading(true);
    try {
      await loginWithGoogle();
      setTimeout(() => {
        const currentEmail = email.trim().toLowerCase();
        if (currentEmail === '2301600199@sun.ac.ug' || auth.currentUser?.email?.toLowerCase() === '2301600199@sun.ac.ug') {
          navigate('/admin/overview');
        } else {
          navigate('/voter/dashboard');
        }
      }, 400);
    } catch (err: any) {
      console.warn('Google auth notice:', err.message || err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(true);
        setError('Firebase: Error (auth/unauthorized-domain). This application domain must be added to Authorized Domains in Firebase Console.');
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.endsWith('@sun.ac.ug')) {
      setError('Please enter your valid university email address (@sun.ac.ug) above first.');
      return;
    }

    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSuccessMessage(
        `Password reset email sent to ${trimmedEmail}! Please check your university inbox or spam folder to set your password, or use Google Sign-In below.`
      );
      setIsInvalidCredential(false);
    } catch (err: any) {
      console.warn('Password reset notice:', err);
      setError(err.message || 'Failed to dispatch password reset email. Please try Google Sign-In.');
    } finally {
      setResetLoading(false);
    }
  };

  // Helper function to fill university email
  const fillTestCredentials = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setEmail('2301600199@sun.ac.ug');
    } else {
      setEmail('student.voter@sun.ac.ug');
    }
    setError(null);
    setIsInvalidCredential(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-md">
        {/* SUES Inspired Portal Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="group inline-block">
            <img
              src="/nususa-logo.jpg"
              alt="NUSUSA Logo"
              referrerPolicy="no-referrer"
              className="w-20 h-20 object-contain mb-4 rounded-md border border-slate-200 bg-white p-1.5 shadow-xs group-hover:border-[#102a43] transition-colors"
            />
          </Link>
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1.5">
            Northern Uganda Soroti University Students Association
          </h2>
          <h1 className="text-3xl font-extrabold text-[#102a43] tracking-tight">
            Elections Portal
          </h1>
        </div>

        {/* SUES Signature Card with Top Accent Border */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#102a43] p-8 flex flex-col gap-5 shadow-xs rounded-lg">
          {/* Fresh Reset Confirmation Notice */}
          {freshResetNotice && (
            <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">App Reset Initiated</p>
                <p className="mt-0.5 text-emerald-800">Local cache and sessions have been cleared. Reloading application...</p>
              </div>
            </div>
          )}

          {/* Unauthorized Domain Diagnostic Card */}
          {unauthorizedDomain && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950 text-sm">Authorized Domain Configuration Required</p>
                  <p className="text-amber-900 leading-relaxed">
                    Firebase Authentication rejected Google OAuth popup because this preview hostname is not yet in your Firebase project&apos;s <strong>Authorized Domains</strong>.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-amber-200 rounded-md space-y-2">
                <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                  Hostname to authorize:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2.5 py-1.5 bg-slate-100 text-slate-800 font-mono text-xs rounded border border-slate-200 select-all break-all">
                    {currentHostname}
                  </code>
                  <button
                    type="button"
                    onClick={copyCurrentDomain}
                    className="px-2.5 py-1.5 bg-[#102a43] hover:bg-[#243b53] text-white text-xs font-semibold rounded flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-amber-900 text-[11px] pt-1 border-t border-amber-200">
                <p className="font-bold text-amber-950">How to fix in 1 minute:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>
                    Open{' '}
                    <a
                      href={consoleAuthSettingsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#102a43] font-bold underline inline-flex items-center gap-1"
                    >
                      <span>Firebase Console Settings</span>
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>Under <strong>Authorized domains</strong>, click <strong>Add domain</strong></li>
                  <li>Paste the hostname copied above and click <strong>Save</strong></li>
                  <li>Return here and click <strong>Sign in with Google</strong></li>
                </ol>
              </div>
            </div>
          )}

          {/* Operation Not Allowed Notification */}
          {operationNotAllowed && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Authentication Provider Setup</p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Email/Password provider is currently not toggled on in this Firebase project. You can sign in with <strong>Google (@sun.ac.ug)</strong> or enable Email/Password in{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-[#102a43]"
                    >
                      Firebase Console Sign-in method
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Email Sent Confirmation */}
          {resetSuccessMessage && (
            <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Reset Email Dispatched</p>
                <p className="mt-0.5 text-emerald-800">{resetSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Invalid Credential Alert with Actionable Recovery */}
          {isInvalidCredential && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">Invalid Student Credentials</p>
                  <p className="mt-0.5 text-rose-800 leading-relaxed">
                    The password entered does not match your student account (<strong>{email || 'your account'}</strong>). If this account was registered via Google Sign-In, please use Google Authentication.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 bg-[#102a43] hover:bg-[#243b53] text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Sign in with Google</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-rose-600 inline mr-1" />
                  <span>{resetLoading ? 'Sending...' : 'Reset Password'}</span>
                </button>
              </div>
            </div>
          )}

          {error && !operationNotAllowed && !isInvalidCredential && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Primary SUES Action: Google Sign-In */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs flex items-center justify-center gap-3 transition-colors text-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
            <span>Sign in with Google (@sun.ac.ug)</span>
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or sign in with password</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                University Email
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="2301600199@sun.ac.ug"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Institutional domain: <code className="text-[#102a43] font-semibold">@sun.ac.ug</code>
              </p>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-[11px] font-semibold text-[#102a43] hover:text-[#243b53] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Vote className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Pre-fill helpers */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Quick fill:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fillTestCredentials('admin')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('student')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Student
                </button>
              </div>
            </div>
          </div>

          {/* SUES Signature "Who can sign in?" Accordion */}
          <details className="text-xs text-slate-600 border-t border-slate-200 pt-3">
            <summary className="cursor-pointer font-semibold text-slate-700 select-none hover:text-[#102a43]">
              Who can sign in?
            </summary>
            <ul className="mt-2.5 space-y-2 text-slate-600 leading-relaxed">
              <li>
                <span className="font-semibold text-[#102a43]">Chairperson, Secretary & Assistant</span> — university staff and commissioners listed on the election register. Sign in with your registered <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">@sun.ac.ug</code> Google account.
              </li>
              <li>
                <span className="font-semibold text-[#102a43]">Voters</span> — students registered on the voter roster. Sign in with the exact institutional email on that roster.
              </li>
              <li className="text-slate-400 text-[11px]">
                Only emails found on the institutional registry are authorized to participate.
              </li>
            </ul>
          </details>

          {/* Registration Link & Fresh Reset Action */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Not registered on the voter roll?{' '}
              <Link to="/auth/register" className="font-semibold text-[#102a43] hover:underline">
                Register as a Voter
              </Link>
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleStartAfresh}
                className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear local browser session and reload"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Start everything afresh (clear local session)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
