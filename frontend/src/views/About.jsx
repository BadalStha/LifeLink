import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart, Droplet, Eye, Activity, Phone, Mail, MapPin,
  ChevronDown, ChevronUp, ArrowLeft, Shield, Users, Clock,
  AlertTriangle, CheckCircle, BookOpen, Stethoscope, Droplets
} from 'lucide-react';

const faqs = [
  {
    q: 'Who can donate blood?',
    a: 'Generally, healthy adults aged 18–65 weighing at least 50 kg can donate blood. You must not have donated blood in the last 3 months (for whole blood). A quick health screening is done before every donation.'
  },
  {
    q: 'Is blood donation safe?',
    a: 'Yes. All equipment used is sterile and single-use. The process takes about 10–15 minutes. Most donors feel fine afterward. You may feel slightly light-headed — rest and fluids help recovery.'
  },
  {
    q: 'What organs can be donated?',
    a: 'You can donate kidneys, liver, heart, lungs, pancreas, corneas, and intestines. Living donors can donate one kidney or a portion of their liver. Other organs require deceased (cadaveric) donation.'
  },
  {
    q: 'How often can I donate blood?',
    a: 'Whole blood: once every 3 months (56 days). Platelets: every 2 weeks. Plasma: every 4 weeks. Your body replenishes donated blood within 4–8 weeks.'
  },
  {
    q: 'What happens after I register on LifeLink?',
    a: 'After registration, your profile becomes visible to hospitals and recipients searching for matching donors. You will receive notifications when someone nearby needs your blood type or a matching organ.'
  },
  {
    q: 'Can I donate blood if I have a tattoo?',
    a: 'You can donate blood 6 months after getting a tattoo, provided the tattooing was done at a licensed studio with sterile equipment. This waiting period is a standard safety precaution.'
  },
  {
    q: 'Is there a cost involved in donating?',
    a: 'No. Blood and organ donation is always voluntary and free of charge. It is illegal under Nepali law to sell or buy organs. LifeLink is a free platform connecting donors and recipients.'
  },
  {
    q: 'What blood types are compatible?',
    a: 'O- is the universal donor (any recipient). AB+ is the universal recipient (any donor). Always consult your healthcare provider for exact compatibility since platelet and plasma compatibility differs from whole blood.'
  },
];

const bloodCompatibility = [
  { type: 'O-', canDonateTo: 'Everyone', canReceiveFrom: 'O-' },
  { type: 'O+', canDonateTo: 'O+, A+, B+, AB+', canReceiveFrom: 'O+, O-' },
  { type: 'A-', canDonateTo: 'A+, A-, AB+, AB-', canReceiveFrom: 'A-, O-' },
  { type: 'A+', canDonateTo: 'A+, AB+', canReceiveFrom: 'A+, A-, O+, O-' },
  { type: 'B-', canDonateTo: 'B+, B-, AB+, AB-', canReceiveFrom: 'B-, O-' },
  { type: 'B+', canDonateTo: 'B+, AB+', canReceiveFrom: 'B+, B-, O+, O-' },
  { type: 'AB-', canDonateTo: 'AB+, AB-', canReceiveFrom: 'AB-, A-, B-, O-' },
  { type: 'AB+', canDonateTo: 'AB+ only', canReceiveFrom: 'Everyone' },
];

const emergencyContacts = [
  { name: 'Nepal Red Cross Society', phone: '01-4270650', role: 'Blood Bank & Emergency', city: 'Kathmandu' },
  { name: 'Tribhuvan University Teaching Hospital', phone: '01-4412303', role: 'Blood Bank', city: 'Kathmandu' },
  { name: 'B.P. Koirala Institute of Health Sciences', phone: '025-525555', role: 'Blood Bank & Hospital', city: 'Dharan' },
  { name: 'National Blood Transfusion Service', phone: '01-4261192', role: 'Central Blood Bank', city: 'Kathmandu' },
  { name: 'Bir Hospital Blood Bank', phone: '01-4221119', role: 'Emergency Blood Bank', city: 'Kathmandu' },
  { name: 'Pokhara Academy of Health Sciences', phone: '061-522042', role: 'Blood Bank', city: 'Pokhara' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-slate-200 rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-all">
        <p className="font-bold text-slate-800 pr-4">{q}</p>
        {open ? <ChevronUp size={20} className="text-red-600 shrink-0" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" />}
      </div>
      {open && (
        <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100">
          <p className="text-slate-600 font-medium leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Droplets size={16} className="text-white"/>
          </div>
          <span className="text-lg font-black text-slate-900">LifeLink</span>
        </div>
        <span className="text-slate-400 text-sm font-medium hidden md:block">Blood & Organ Donation Awareness</span>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 font-semibold text-sm transition-colors">
              <ArrowLeft size={15}/> Back to Home
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-600 hover:text-red-600 px-3 py-2 transition-colors">Login</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">Register</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-red-700 to-red-900 text-white px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Heart size={16} className="text-red-200" /> Saving Lives Together
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Every Drop Counts.<br />
            <span className="text-red-200">Every Organ Matters.</span>
          </h1>
          <p className="text-red-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            One blood donation can save up to 3 lives. Organ donation can save up to 8.
            Learn how you can become a hero for someone who needs you most.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/donation-preferences' : '/register?type=donor')}
              className="px-6 py-3 bg-white text-red-700 font-black rounded-2xl hover:bg-red-50 transition-all"
            >
              {isAuthLoading ? 'Loading...' : isAuthenticated ? 'Donation Preferences' : 'Become a Donor'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/find-donors')}
                className="px-6 py-3 bg-red-800 text-white font-black rounded-2xl hover:bg-red-900 border border-red-600 transition-all"
              >
                Find a Donor
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Key Stats */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '4.5M+', label: 'Units needed yearly in Nepal', color: 'text-red-600' },
            { value: '8', label: 'Lives saved by one organ donor', color: 'text-green-600' },
            { value: '3', label: 'Lives saved by one blood donation', color: 'text-blue-600' },
            { value: '56', label: 'Days between blood donations', color: 'text-purple-600' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500 font-medium text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Blood Donation Info */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Droplet className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Blood Donation</h2>
              <p className="text-slate-500 font-medium">Why it matters & what to expect</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: <Clock size={20} />, title: 'Quick Process', desc: 'The actual donation takes only 10–15 minutes. The entire appointment, including registration and rest, takes about 45 minutes.', color: 'bg-blue-50 text-blue-600' },
              { icon: <Shield size={20} />, title: 'Completely Safe', desc: 'All needles and equipment are sterile, single-use, and discarded immediately. You cannot contract any disease by donating blood.', color: 'bg-green-50 text-green-600' },
              { icon: <Activity size={20} />, title: 'Eligibility', desc: 'Healthy adults aged 18–65, weight 50+ kg, with no recent illness, surgery, or tattoo in the past 6 months. No high-risk behaviors.', color: 'bg-purple-50 text-purple-600' },
              { icon: <Heart size={20} />, title: 'Health Benefits', desc: 'Reduces iron overload, lowers cardiovascular risk, triggers bone marrow to produce fresh blood cells, and gives you a free mini health check.', color: 'bg-red-50 text-red-600' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blood Compatibility Table */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Blood Type Compatibility</h2>
          <p className="text-slate-500 font-medium mb-6">Know which blood types are compatible with yours</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-4 text-left font-bold">Blood Type</th>
                    <th className="p-4 text-left font-bold">Can Donate To</th>
                    <th className="p-4 text-left font-bold">Can Receive From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bloodCompatibility.map((row) => (
                    <tr key={row.type} className="hover:bg-slate-50">
                      <td className="p-4">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-black text-sm">{row.type}</span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{row.canDonateTo}</td>
                      <td className="p-4 text-slate-600 font-medium">{row.canReceiveFrom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Organ Donation Info */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Stethoscope className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Organ Donation</h2>
              <p className="text-slate-500 font-medium">Give the gift of life through organ donation</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { organ: 'Kidney', icon: '🫘', note: 'Most donated organ. Donors can live with one kidney. Wait list: years.' },
              { organ: 'Liver', icon: '🫁', note: 'Living donors can donate a portion. Liver regenerates in 6–8 weeks.' },
              { organ: 'Corneas', icon: '👁️', note: 'Restores sight. Can be donated after death. No age limit.' },
              { organ: 'Heart', icon: '❤️', note: 'Requires deceased donor. Can save someone in end-stage heart failure.' },
              { organ: 'Lungs', icon: '🫁', note: 'Lung lobes can be donated by living donors. Improves breathing disorders.' },
              { organ: 'Pancreas', icon: '🩺', note: 'Helps patients with Type 1 diabetes. Usually from deceased donors.' },
            ].map((item) => (
              <div key={item.organ} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-slate-800 mb-2">{item.organ}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="font-bold text-green-800 mb-1">Registering as an organ donor in Nepal</p>
                <p className="text-green-700 text-sm leading-relaxed">
                  Under the Human Body Organ Transplantation (Regulation and Prohibition) Act 2055 (1998), organ donation must be voluntary and free.
                  You can indicate your willingness to donate on LifeLink. Hospital staff and your family will be involved in the final process.
                  Your family's consent is always required alongside your registration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-500 font-medium">Everything you need to know about donation</p>
            </div>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* Emergency Contacts */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Phone className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Emergency Contacts</h2>
              <p className="text-slate-500 font-medium">Blood banks and hospitals across Nepal</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact) => (
              <div key={contact.name} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="text-red-600" size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{contact.name}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{contact.role} — {contact.city}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1 mt-2 text-red-600 font-bold text-sm hover:underline"
                  >
                    <Phone size={14} /> {contact.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
            <AlertTriangle className="text-red-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-red-800">National Emergency Number</p>
              <p className="text-red-700 text-sm mt-1">
                Nepal Police: <strong>100</strong> | Ambulance: <strong>102</strong> | Fire Brigade: <strong>101</strong>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-red-700 to-red-900 text-white rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-3">Ready to Make a Difference?</h2>
          <p className="text-red-200 mb-8 text-lg">Join thousands of life savers across Nepal. It takes just 5 minutes to register.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/donation-preferences' : '/register?type=donor')}
              className="px-8 py-3 bg-white text-red-700 font-black rounded-2xl hover:bg-red-50 transition-all"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? 'Loading...' : isAuthenticated ? 'Donation Preferences' : 'Register as Donor'}
            </button>
            <button
              onClick={() => navigate('/request-help')}
              className="px-8 py-3 bg-red-800 text-white font-black rounded-2xl hover:bg-red-900 border border-red-600 transition-all"
            >
              Request Help
            </button>
          </div>
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
