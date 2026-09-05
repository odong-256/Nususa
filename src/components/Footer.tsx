import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, ShieldCheck, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/nususa-logo.jpg"
                alt="NUSUSA Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-contain bg-white border border-emerald-500/40 p-0.5 shadow-md shrink-0"
              />
              <div>
                <span className="text-xl font-black text-white tracking-tight block">NUSUSA</span>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Unity in Diversity</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Northern Uganda Soroti University Students Association (NUSUSA) Electoral Commission. Empowering student
              democracy through a secure, transparent, and audited digital voting infrastructure.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Institutional Cloud Encryption Enabled</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Electoral Portal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/candidates" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                  Official Candidate Gazette (2026/2027)
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
                  Voting Guidelines
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-emerald-400 transition-colors">
                  About NUSUSA
                </a>
              </li>
              <li>
                <Link to="/auth/login" className="hover:text-emerald-400 transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/auth/register" className="hover:text-emerald-400 transition-colors">
                  Voter Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Electoral Commission Code */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Integrity & Standards
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>One Student, One Ballot Rule</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Strict @sun.ac.ug Domain Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Electoral Commission Identity Approval</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Immutable Ballot Recording</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Cryptographic Ballot Receipt</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Electoral Office
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>NUSUSA Secretariat, Soroti University Main Campus, Soroti, Uganda</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ec@sun.ac.ug</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+256 (0) 454 448 830</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Northern Uganda Soroti University Students Association (NUSUSA). All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Powered by NUSUSA Electoral Cloud System</span>
            <span>•</span>
            <span className="text-emerald-400">Node.js 26 Ready</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
