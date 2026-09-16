import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Vote, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, Copy, ExternalLink } from 'lucide-react';
import { firebaseConfig } from '../../services/firebaseConfig';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [loading, setLoading] = useState(false);
  const { registerWithEmail, registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  const currentHostname = window.location.hostname;
  const consoleAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const copyCurrentDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOperationNotAllowed(false);

    const trimmedEmail = email.trim().toLowerCase();

    // Strict Institutional Domain Check
    if (!trimmedEmail.endsWith('@sun.ac.ug')) {
      setError('Registration is strictly restricted to university email accounts ending in "@sun.ac.ug" (e.g. 2301600199@sun.ac.ug or student@sun.ac.ug).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);
    try {
      const derivedStudentId = studentId.trim() || trimmedEmail.split('@')[0];
      await registerWithEmail(fullName.trim(), trimmedEmail, password, derivedStudentId);
      // After registration, status is "pending" -> navigate to Pending Approval page
      navigate('/auth/pending-approval');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        console.warn('Firebase registration notice: Email/Password provider is disabled in Firebase Console.');
        setOperationNotAllowed(true);
        setError('Email/Password registration is currently disabled in your Firebase project. Please register using Google Sign-In below.');
      } else if (err.code === 'auth/email-already-in-use') {
        console.warn('Registration notice: Email already in use.');
        setError('This institutional email is already registered. Please go to the login page.');
      } else {
        console.warn('Registration notice:', err.message || err);
        setError(err.message || 'Failed to complete voter registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setOperationNotAllowed(false);
    setUnauthorizedDomain(false);
    setLoading(true);
    try {
      await registerWithGoogle({
        fullName: fullName.trim() || undefined,
        studentId: studentId.trim() || undefined
      });
      navigate('/auth/pending-approval');
    } catch (err: any) {
      console.warn('Google registration notice:', err.message || err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(true);
        setError('Firebase: Error (auth/unauthorized-domain). This domain must be added to Authorized Domains in Firebase Console.');
      } else {
        setError(err.message || 'Google registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <img
            src="/nususa-logo.jpg"
            alt="NUSUSA Logo"
            referrerPolicy="no-referrer"
            className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs"
          />
        </Link>
        <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          Northern Uganda Soroti University Students Association
        </h2>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#102a43] tracking-tight">
          Voter Registration
        </h1>
        <p className="text-xs text-slate-500">
          Create your verified NUSUSA voting account with your student email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs rounded-lg border border-slate-200 border-t-4 border-t-[#102a43] space-y-6">
          {/* Institutional Note */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldAlert className="w-4 h-4 text-[#102a43] shrink-0 mt-0.5" />
            <span>
              <strong>Institutional Domain Requirement:</strong> You must use your assigned university email ending in <code className="bg-slate-200 text-[#102a43] px-1 py-0.5 rounded font-mono font-bold">@sun.ac.ug</code>.
            </span>
          </div>

          {/* Primary Recommended: Register with Google */}
          <div className="space-y-2.5">
            <button
              id="google-register-btn"
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-[#102a43] font-semibold rounded-md text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs"
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
              <span>Register with Google (@sun.ac.ug only)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Instant registration using your verified university Google Workspace account
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              Or register with student credentials
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

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
                  <li>Return here and click <strong>Register with Google</strong></li>
                </ol>
              </div>
            </div>
          )}

          {/* Operation Not Allowed Notice */}
          {operationNotAllowed && (
            <div className="p-3.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Email/Password Registration Disabled in Firebase</p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Firebase currently allows <strong>Google Authentication (@sun.ac.ug)</strong> by default. To register instantly without password setup:
                  </p>
                </div>
              </div>

              <div className="pl-7">
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  className="px-3.5 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold text-xs rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <span>Continue with Google Sign-Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <details className="pl-7 text-[11px] text-amber-800 pt-1 cursor-pointer">
                <summary className="font-semibold hover:underline">
                  How to enable Email/Password in Firebase Console (for Administrators)
                </summary>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-slate-700">
                  <li>Go to your Firebase project: <code>nususa-online-voting</code></li>
                  <li>Click <strong>Authentication</strong> &gt; <strong>Sign-in method</strong></li>
                  <li>Select <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
                  <li>Click <strong>Save</strong> and retry this registration form</li>
                </ol>
              </details>
            </div>
          )}

          {error && !operationNotAllowed && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Legal Name (as on University Records)
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  placeholder="e.g. Namusoke Brenda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email (@sun.ac.ug)
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="e.g. 2301600199@sun.ac.ug"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Any valid username preceding <code className="text-[#102a43] font-mono font-bold">@sun.ac.ug</code> is accepted.
              </p>
            </div>

            {/* Student Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student ID / Registration Number
              </label>
              <input
                id="reg-student-id"
                type="text"
                placeholder="e.g. 23/U/14295/PS"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="block w-full px-3 py-2 sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 sm:text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] outline-hidden transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Pending Notice Reminder */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Approval Policy:</strong> After registration, your status will be <em>Pending Approval</em>. An Electoral Commission administrator will review your enrollment before voting permissions are granted.
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Voter Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Existing Account CTA */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/auth/login" className="font-semibold text-[#102a43] hover:underline">
                Log into Your Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
