import React, { useState, useId } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  CheckCircle2,
  Shield,
  FileCheck,
  UserCheck,
  PhoneCall,
  Phone,
  Mail,
  Lock,
  Vote,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface FAQItem {
  id: string;
  category: 'process' | 'eligibility' | 'security' | 'support';
  question: string;
  answer: string;
  keyPoints?: string[];
}

const FAQ_DATA: FAQItem[] = [
  // VOTING PROCESS
  {
    id: 'faq-process-1',
    category: 'process',
    question: 'How do I cast my ballot on election day?',
    answer:
      'Once the election status moves to "OPEN", sign in using your verified student email and password. Click "Go to Voter Ballot" or navigate to the election page. Review each contested position, pick your preferred candidate or abstain, and click "Submit Ballot". You will instantly receive a tamper-proof digital cryptographic receipt code.',
    keyPoints: [
      'Ballot submission requires an active open election window.',
      'You can select candidates position-by-position at your own pace before final submission.',
      'A digital receipt confirms your vote has been securely recorded in the ledger.'
    ]
  },
  {
    id: 'faq-process-2',
    category: 'process',
    question: 'Can I change or cancel my vote after submitting?',
    answer:
      'No. To guarantee the absolute integrity and finality of NUSUSA elections, ballot submissions are immediate and irreversible. Once you review your selections and confirm submission, your vote is permanently recorded and your student ID is marked as having voted.',
    keyPoints: [
      'Take your time to review candidates before clicking the final confirmation button.',
      'The system will prompt you with a verification modal before final submission.'
    ]
  },
  {
    id: 'faq-process-3',
    category: 'process',
    question: 'What is the digital vote receipt code and what should I do with it?',
    answer:
      'Upon successful submission, the portal generates an encrypted hash receipt (e.g. NUSUSA-2026-XXXX). This code serves as mathematical proof that your ballot was accepted into the tally without revealing which candidates you voted for. You should screenshot or write down this receipt for your records.',
    keyPoints: [
      'Receipts can be verified during public auditing without breaking voter confidentiality.',
      'Save your receipt code if you wish to cross-reference with official audit logs.'
    ]
  },

  // ELIGIBILITY & REGISTRATION
  {
    id: 'faq-eligibility-1',
    category: 'eligibility',
    question: 'Who is eligible to register and vote in NUSUSA elections?',
    answer:
      'All fully registered students of Soroti University hailing from Northern Uganda or affiliated as active members of NUSUSA with a valid university registration number (e.g., 2301600199@sun.ac.ug or sun.ac.ug domain) are eligible to register. Registrations are reviewed and approved by the NUSUSA Electoral Commission.',
    keyPoints: [
      'Must possess an active Soroti University student registration number.',
      'Must be approved on the verified voter roll by the Electoral Commission.'
    ]
  },
  {
    id: 'faq-eligibility-2',
    category: 'eligibility',
    question: 'Why does my account say "Pending Approval" after registration?',
    answer:
      'To prevent fraudulent voter roll inflation and duplicate registrations, all new voter accounts are placed in a verification queue. Electoral Commission administrators cross-reference your student number and faculty credentials with university enrollment lists. Once verified, your status turns "Approved" and you will be notified.',
    keyPoints: [
      'Verification typically takes between 2 to 12 hours during active election weeks.',
      'You can check your status anytime at /auth/status or /auth/pending-approval.'
    ]
  },
  {
    id: 'faq-eligibility-3',
    category: 'eligibility',
    question: 'What details are required to complete student voter registration?',
    answer:
      'You will need your official Soroti University student email, student ID number, full name as it appears on university records, faculty/programme, and current year of study. Uploading a clear photo or copy of your valid university student ID card expedites approval.',
    keyPoints: [
      'Provide your accurate university student number.',
      'Ensure the email entered matches your active student inbox.'
    ]
  },

  // SECURITY & ANONYMITY
  {
    id: 'faq-security-1',
    category: 'security',
    question: 'Is my vote secret? Can administrators or candidates see who I voted for?',
    answer:
      'Yes, your ballot choices are 100% anonymous. The system strictly separates voter identity from candidate choices. While the database securely records that your student ID has cast its single allowed ballot (to prevent duplicate voting), your specific ballot choices are decoupled from your identity.',
    keyPoints: [
      'Neither system administrators nor candidates can link candidate selections back to your student profile.',
      'Only aggregate vote totals and anonymous receipt hashes are published in results.'
    ]
  },
  {
    id: 'faq-security-2',
    category: 'security',
    question: 'How does the platform prevent duplicate voting or ballot stuffing?',
    answer:
      'Every voter account is bound to a verified Soroti University registration number. When a vote is cast, atomic database transaction guards enforce a single vote rule. If any duplicate attempt is made under the same voter account, the database rejects the transaction immediately.',
    keyPoints: [
      'Strict database-level ACID transactions lock duplicate entries.',
      'Comprehensive audit trails log timestamped events for every critical administrative action.'
    ]
  },

  // TECHNICAL SUPPORT & HELP
  {
    id: 'faq-support-1',
    category: 'support',
    question: 'What should I do if I cannot sign in or forgot my password?',
    answer:
      'If you forgot your password, utilize the password recovery link on the Sign In page or contact the Electoral Commission technical desk at the university ICT center. If your email is unverified, make sure you check your student inbox (including spam/junk folder) for activation instructions.',
    keyPoints: [
      'Use your official student email when requesting password resets.',
      'Visit the ICT building Helpdesk during polling hours for in-person identity assistance.'
    ]
  },
  {
    id: 'faq-support-2',
    category: 'support',
    question: 'How can I report an election issue or dispute to the Commission?',
    answer:
      'The NUSUSA Electoral Commission operates a transparent dispute resolution desk. You can submit petitions, report technical anomalies, or contact 0760073338 for help directly to the Returning Officer or via the official email helpdesk: 2301600199@sun.ac.ug. All formal petitions are recorded in the official audit registry.',
    keyPoints: [
      'Direct email: 2301600199@sun.ac.ug',
      'Telephone helpline: 0760073338',
      'Physical location: Soroti University Guild Offices, Main Campus',
      'Disputes must include your digital receipt hash if related to cast ballots.'
    ]
  }
];

export const FrequentlyAskedQuestions: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'process' | 'eligibility' | 'security' | 'support'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-process-1');

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.keyPoints?.some(kp => kp.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-[#102a43] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#102a43]" />
            <span>Help Center & Guidelines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102a43] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Essential information regarding voter eligibility, ballot casting security, verification
            timelines, and Electoral Commission assistance for Soroti University students.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 shadow-2xs space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="faq-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. 'receipt', 'eligibility', 'anonymous', 'pending')..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#102a43] focus:border-[#102a43] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { key: 'all', label: 'All Questions', count: FAQ_DATA.length },
              { key: 'process', label: 'Voting Process', count: FAQ_DATA.filter(f => f.category === 'process').length },
              { key: 'eligibility', label: 'Voter Eligibility', count: FAQ_DATA.filter(f => f.category === 'eligibility').length },
              { key: 'security', label: 'Security & Secret Ballot', count: FAQ_DATA.filter(f => f.category === 'security').length },
              { key: 'support', label: 'Commission Support', count: FAQ_DATA.filter(f => f.category === 'support').length }
            ].map(tab => (
              <button
                key={tab.key}
                id={`faq-tab-${tab.key}`}
                type="button"
                onClick={() => setActiveCategory(tab.key as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === tab.key
                    ? 'bg-[#102a43] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeCategory === tab.key
                      ? 'bg-[#243b53] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 p-8 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No matching questions found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any questions matching "{searchQuery}". Try a different search term or reset filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-1.5 bg-[#102a43] text-white text-xs font-semibold rounded-md hover:bg-[#243b53] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map(item => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-[#102a43]/40 bg-slate-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    id={`faq-btn-${item.id}`}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                            item.category === 'process'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.category === 'eligibility'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.category === 'security'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {item.category === 'process'
                            ? 'Voting Process'
                            : item.category === 'eligibility'
                            ? 'Eligibility'
                            : item.category === 'security'
                            ? 'Security'
                            : 'Support'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#102a43] tracking-tight">
                        {item.question}
                      </h3>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isExpanded
                          ? 'border-[#102a43] bg-[#102a43] text-white rotate-180'
                          : 'border-slate-300 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-200/70 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-3">
                      <p>{item.answer}</p>

                      {item.keyPoints && item.keyPoints.length > 0 && (
                        <div className="bg-white rounded-md p-3 border border-slate-200 space-y-1.5 mt-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Key Highlights:
                          </p>
                          <ul className="space-y-1">
                            {item.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Assistance Callout Box */}
        <div className="mt-12 bg-slate-100/70 border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-[#102a43] text-white flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-[#102a43] text-sm sm:text-base">
                Still have unanswered questions?
              </h4>
              <p className="text-xs text-slate-600">
                The NUSUSA Electoral Commission Helpdesk is active 24/7 during official election periods.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              id="faq-contact-phone-btn"
              href="tel:0760073338"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-md shadow-2xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Helpline: 0760073338</span>
            </a>
            <a
              id="faq-contact-email-btn"
              href="mailto:2301600199@sun.ac.ug"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-md shadow-2xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>2301600199@sun.ac.ug</span>
            </a>
            <Link
              id="faq-register-action-btn"
              to="/auth/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102a43] hover:bg-[#243b53] text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Register as Voter</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
