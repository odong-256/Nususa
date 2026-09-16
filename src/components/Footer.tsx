import React from 'react';
import { Link } from 'react-router-dom';
import { Vote, ShieldCheck, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/nususa-logo.jpg"
                alt="NUSUSA Logo"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-md object-contain bg-white border border-slate-200 p-0.5 shrink-0"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#102a43] tracking-widest uppercase block">
                  NUSUSA Elections
                </span>
                <span className="text-[10px] text-slate-500 block">Electoral Commission</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official digital voting and results portal for Soroti University Students Association elections.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#102a43] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Identity Infrastructure</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43]">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link to="/" className="hover:text-[#102a43] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/candidates" className="hover:text-[#102a43] transition-colors">
                  Candidates Gazette
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-[#102a43] transition-colors">
                  How Voting Works
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-[#102a43] transition-colors">
                  About NUSUSA
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-[#102a43] transition-colors">
                  Frequently Asked Questions (FAQ)
                </a>
              </li>
              <li>
                <Link to="/auth/login" className="hover:text-[#102a43] transition-colors">
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Secretariat */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102a43]">
              Electoral Office
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>NUSUSA Secretariat, Soroti University Main Campus, Soroti, Uganda</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="mailto:2301600199@sun.ac.ug" className="hover:text-[#102a43] transition-colors">
                  2301600199@sun.ac.ug
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href="tel:0760073338" className="hover:text-[#102a43] transition-colors">
                  0760073338
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Northern Uganda Soroti University Students Association. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Official NUSUSA Electoral Portal</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
