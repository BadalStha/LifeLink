import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Lock, Eye, Database, Share2, UserCheck, Mail,
  CheckCircle, ArrowLeft, Droplets, FileText, Key, Globe, AlertTriangle
} from 'lucide-react';

const sections = [
  {
    id: 'who-we-are',
    icon: <Globe size={22} />,
    title: 'Who We Are',
    color: 'bg-blue-50 text-blue-600',
    content: (
      <p className="text-slate-600 leading-relaxed">
        LifeLink is a non-commercial platform operated in Nepal that connects blood and organ donors
        with people seeking urgent medical assistance. We are committed to handling your personal
        information with the highest standards of care, transparency, and respect. This Privacy
        Statement explains our practices in clear, plain language.
      </p>
    ),
  },
  {
    id: 'information-collected',
    icon: <Database size={22} />,
    title: 'Information We Collect',
    color: 'bg-purple-50 text-purple-600',
    content: (
      <div className="space-y-3">
        {[
          { label: 'Identity Details', desc: 'Full name, date of birth, and gender' },
          { label: 'Contact Information', desc: 'Email address, phone number, and physical address' },
          { label: 'Medical Information', desc: 'Blood group, organ donation preferences, and health history relevant to donation eligibility' },
          { label: 'Request Details', desc: 'Urgency level, hospital name, required organ or blood type, and medical context provided' },
          { label: 'Usage Data', desc: 'Pages visited, features used, and interaction data to improve platform experience' },
        ].map((item) => (
          <div key={item.label} className="flex gap-3 items-start">
            <CheckCircle size={18} className="text-purple-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">{item.label}:{' '}</span>
              <span className="text-slate-500">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'how-we-use',
    icon: <Eye size={22} />,
    title: 'How We Use Your Information',
    color: 'bg-green-50 text-green-600',
    content: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { title: 'Donor Matching', desc: 'Connect you with compatible donors or recipients based on blood group or organ type.' },
          { title: 'Notifications', desc: 'Inform you of matching requests, urgent needs, or updates relevant to your profile.' },
          { title: 'Service Improvement', desc: 'Analyze anonymized usage patterns to improve the platform and its features.' },
          { title: 'Safety & Compliance', desc: 'Verify eligibility and ensure compliance with Nepali health and donation regulations.' },
        ].map((item) => (
          <div key={item.title} className="bg-green-50 rounded-xl p-4 border border-green-100">
            <h4 className="font-bold text-green-800 mb-1">{item.title}</h4>
            <p className="text-green-700 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'sharing',
    icon: <Share2 size={22} />,
    title: 'How We Share Information',
    color: 'bg-orange-50 text-orange-600',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          We share the minimum necessary information and only for the purposes described above.
          We do not sell, rent, or trade your personal information to third parties.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          {[
            'With matched donors or recipients — limited contact details only when a match is confirmed',
            'With authorized medical coordination staff involved in verification and support',
            'With government or regulatory bodies if legally required under Nepali law',
          ].map((item) => (
            <div key={item} className="flex gap-2 items-start">
              <CheckCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <span className="text-slate-600 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'data-security',
    icon: <Lock size={22} />,
    title: 'Data Security',
    color: 'bg-red-50 text-red-600',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 leading-relaxed">
          We implement industry-standard security practices to protect your data from unauthorized
          access, loss, or misuse. Our infrastructure is reviewed regularly for vulnerabilities.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: <Key size={18} />, label: 'Encrypted Storage', desc: 'Sensitive data is stored with encryption at rest' },
            { icon: <Shield size={18} />, label: 'Secure Transmission', desc: 'All data is transmitted over HTTPS/TLS' },
            { icon: <Lock size={18} />, label: 'Access Controls', desc: 'Strict role-based access limits who can view data' },
          ].map((measure) => (
            <div key={measure.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mx-auto mb-3">
                {measure.icon}
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">{measure.label}</p>
              <p className="text-slate-500 text-xs">{measure.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'your-rights',
    icon: <UserCheck size={22} />,
    title: 'Your Rights',
    color: 'bg-teal-50 text-teal-600',
    content: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { right: 'Right to Access', desc: 'Request a copy of all personal data we hold about you.' },
          { right: 'Right to Correction', desc: 'Request correction of inaccurate or incomplete information.' },
          { right: 'Right to Deletion', desc: 'Request removal of your account and associated data.' },
          { right: 'Right to Portability', desc: 'Receive your data in a portable, machine-readable format.' },
          { right: 'Right to Withdraw', desc: 'Withdraw consent for data processing at any time.' },
          { right: 'Right to Object', desc: 'Object to the use of your data for any non-essential purpose.' },
        ].map((item) => (
          <div key={item.right} className="flex gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
            <CheckCircle size={18} className="text-teal-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-800 text-sm">{item.right}</p>
              <p className="text-teal-700 text-xs mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Droplets size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-slate-900">LifeLink</span>
        </div>
        <span className="text-slate-400 text-sm font-medium hidden md:block">Privacy &amp; Data Protection</span>
        <button
          onClick={() => navigate(isAuthenticated ? '/' : '/login')}
          className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          {isAuthenticated ? 'Back to Home' : 'Login'}
        </button>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-red-700 to-red-900 text-white px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Shield size={16} className="text-red-200" /> Privacy &amp; Data Protection
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
            Your Privacy Is<br />
            <span className="text-red-200">Our Responsibility.</span>
          </h1>
          <p className="text-red-100 text-lg leading-relaxed max-w-2xl mx-auto">
            We handle your health and personal data with the utmost care.
            Here is everything you need to know about how LifeLink protects your information.
          </p>
          <p className="text-red-300 text-sm mt-5 font-medium">Last updated: March 8, 2026</p>
        </div>
      </header>

      {/* Split image + intro */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-stretch">
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold mb-5 w-fit">
              <FileText size={13} /> Privacy Statement
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              Built on Trust,<br />Protected by Design
            </h2>
            <p className="text-slate-500 leading-relaxed mb-4">
              LifeLink operates at the intersection of healthcare and technology. The information
              you share — your blood type, organ donation preferences, and contact details — is
              deeply personal. We design our systems and policies to honor that trust.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Our privacy practices comply with Nepal's Electronic Transactions Act (2008) and
              relevant health data guidelines. We collect only what is necessary and retain it only
              for as long as it is needed.
            </p>
          </div>
          <div className="hidden md:block overflow-hidden max-h-96">
            <img
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
              alt="Digital security and data privacy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Jump navigation */}
      <section className="bg-slate-50 py-7 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4 text-center">Jump to Section</p>
          <div className="flex flex-wrap justify-center gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 transition-all"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Section cards */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 scroll-mt-20"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${section.color}`}>
                {section.icon}
              </div>
              <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
            </div>
            {section.content}
          </section>
        ))}

        {/* Compliance note */}
        <div className="flex gap-4 items-start bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-bold text-amber-800 mb-1">Legal Compliance</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              LifeLink operates under the Human Body Organ Transplantation (Regulation and Prohibition)
              Act 2055 (1998) and Nepal's Electronic Transactions Act (2008). All data collection and
              processing activities are conducted in accordance with applicable Nepali law.
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        <section className="bg-gradient-to-br from-red-700 to-red-900 text-white rounded-3xl p-8 md:p-10 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black mb-3">Privacy Questions or Requests?</h2>
          <p className="text-red-200 mb-6 max-w-md mx-auto">
            To exercise any of your rights or for privacy-related inquiries, reach out to our team.
            We respond to all requests within 14 business days.
          </p>
          <a
            href="mailto:privacy@lifelink.org"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-red-700 font-black rounded-2xl hover:bg-red-50 transition-all"
          >
            <Mail size={18} />
            privacy@lifelink.org
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-sm font-medium">
        LifeLink Nepal — Connecting Donors with Recipients Across the Nation
        <br />
        <span className="text-xs">All information is for educational purposes. Consult healthcare professionals for medical advice.</span>
      </footer>
    </div>
  );
}
