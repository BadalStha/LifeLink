import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Send,
  X,
  Heart,
  HandHeart,
  ShieldCheck,
  Clock3,
  Users,
  Activity,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [language, setLanguage] = useState('en');

  const copy = {
    en: {
      topBar: 'Nepal Emergency Health Support Network | 24/7 Coordinated Donor Matching',
      tagline: 'Jeevan Ko Lagi Sahayog',
      becomeDonor: 'Become a Donor',
      requestHelp: 'Request Help',
      myProfile: 'My Profile',
      login: 'Login',
      trusted: 'Trusted Nepal Health Community',
      heroLine1: 'Donate Blood.',
      heroLine2: 'Save Lives Across Nepal.',
      heroDesc: 'LifeLink helps families find verified blood and organ support quickly, with locality-based matching, clear emergency pathways, and community-first coordination.',
      joinDonor: 'Join as Donor',
      registerHelp: 'Register for Help',
      districtReach: 'District reach',
      urgentAlerts: 'Urgent alerts',
      activeSupporters: 'Active supporters',
      rapidTitle: 'Rapid Emergency Path',
      rapidDesc: 'Urgent requests are prioritized so nearby verified donors can be notified immediately.',
      communityTitle: 'Community-Led Network',
      communityDesc: "Built for Nepal's cities and rural municipalities, with people helping people through verified profiles.",
      supportTitle: 'Blood and Organ Support',
      supportDesc: 'From routine blood support to urgent transplant coordination, requests are structured clearly for fast action.',
      howItWorks: 'How LifeLink Works',
      step1Title: 'Register as Donor or Receiver',
      step1Desc: 'Complete details with district and municipality to support local matching.',
      step2Title: 'Submit Need or Availability',
      step2Desc: 'Medical requirement, urgency, and location data help prioritize response quickly.',
      step3Title: 'Coordinate and Save Lives',
      step3Desc: 'Matched users connect and proceed with local health facilities and donation protocols.',
      whyTag: 'Why Donation Is Necessary',
      whyTitle: 'A single donor decision can protect an entire family from crisis.',
      whyDesc: 'In Nepal, emergency blood and transplant-related support can become critical within hours. Timely donation improves treatment outcomes, reduces avoidable delays, and gives doctors a safer window to act.',
      priorityTag: 'Public Health Priority',
      priorityDesc: 'Regular voluntary donation helps maintain emergency readiness and supports planned treatments nationwide.',
      emergencyNeedTitle: 'Emergencies Need Immediate Supply',
      emergencyNeedDesc: 'Road trauma, maternal emergencies, surgeries, and chronic illness care often require urgent blood availability.',
      communitySaveTitle: 'Community Strength Saves Lives',
      communitySaveDesc: 'When local communities participate, patients can receive faster support close to where they live.',
      impactTitle: 'One Registration, Long-Term Impact',
      impactDesc: 'A verified donor profile can support multiple patients over time and strengthen national response capacity.',
      whoDonateTitle: 'Who Can Usually Donate?',
      whoDonateDesc: 'Healthy adults who meet medical screening criteria can register and donate as advised by health professionals.',
      whyEarlyTitle: 'Why Register Early?',
      whyEarlyDesc: 'Early registration improves matching speed during urgent calls, especially for rare blood groups and organ needs.',
      emergencyCaseTitle: 'Emergency Case Right Now?',
      emergencyCaseDesc: 'Use the Request Help pathway immediately and submit urgency details for fast broadcast.',
      openEmergency: 'Open Emergency Request',
      broadcastAlert: 'Broadcast Alert',
      requestHelpModal: 'Request Help',
      broadcastDesc: 'Notify all matching donors within your area immediately.',
      requestHelpDesc: 'Create an account to submit your emergency request and notify nearby donors instantly.',
      sendAlert: 'Send Alert Now',
      registerAndHelp: 'Register & Request Help',
      step: 'Step',
      english: 'EN',
      nepali: 'नेपाली',
    },
    np: {
      topBar: 'नेपाल आपतकालीन स्वास्थ्य सहयोग सञ्जाल | २४/७ समन्वित दाता मिलान',
      tagline: 'जीवनका लागि सहयोग',
      becomeDonor: 'दाता बन्नुहोस्',
      requestHelp: 'सहायता माग्नुहोस्',
      myProfile: 'मेरो प्रोफाइल',
      login: 'लगइन',
      trusted: 'विश्वसनीय नेपाली स्वास्थ्य समुदाय',
      heroLine1: 'रगत दान गर्नुहोस्।',
      heroLine2: 'नेपालभरि जीवन बचाउनुहोस्।',
      heroDesc: 'LifeLink ले परिवारलाई छिटो प्रमाणित रगत तथा अंग सहयोग पाउन मद्दत गर्छ, स्थानीय मिलान, स्पष्ट आपतकालीन प्रक्रिया र समुदायमुखी समन्वयसहित।',
      joinDonor: 'दाता रूपमा सहभागी हुनुहोस्',
      registerHelp: 'सहायताका लागि दर्ता गर्नुहोस्',
      districtReach: 'जिल्ला पहुँच',
      urgentAlerts: 'आपतकालीन सूचना',
      activeSupporters: 'सक्रिय सहयोगी',
      rapidTitle: 'द्रुत आपतकालीन प्रक्रिया',
      rapidDesc: 'आपतकालीन अनुरोधलाई प्राथमिकता दिइन्छ ताकि नजिकका प्रमाणित दातालाई तुरुन्त जानकारी दिन सकियोस्।',
      communityTitle: 'समुदाय-नेतृत्व सञ्जाल',
      communityDesc: 'नेपालका शहर र ग्रामीण नगरपालिकाका लागि तयार, जहाँ मानिसले मानिसलाई प्रमाणित प्रोफाइलमार्फत सहयोग गर्छन्।',
      supportTitle: 'रगत र अंग सहयोग',
      supportDesc: 'नियमित रगत सहयोगदेखि आपतकालीन प्रत्यारोपण समन्वयसम्म, छिटो काम हुने गरी अनुरोध स्पष्ट बनाइन्छ।',
      howItWorks: 'LifeLink कसरी काम गर्छ',
      step1Title: 'दाता वा सहयोग चाहिने रूपमा दर्ता गर्नुहोस्',
      step1Desc: 'स्थानीय मिलानलाई सहज बनाउन जिल्ला र नगरपालिका विवरण पूरा गर्नुहोस्।',
      step2Title: 'आवश्यकता वा उपलब्धता बुझाउनुहोस्',
      step2Desc: 'चिकित्सकीय आवश्यकता, आपतकालीन स्तर र स्थानले छिटो प्राथमिकता निर्धारणमा मद्दत गर्छ।',
      step3Title: 'समन्वय गर्नुहोस् र जीवन बचाउनुहोस्',
      step3Desc: 'मिलान भएका प्रयोगकर्ताले स्थानीय स्वास्थ्य संस्थासँग प्रक्रिया अगाडि बढाउँछन्।',
      whyTag: 'दान किन आवश्यक छ',
      whyTitle: 'एक जना दाताको निर्णयले पूरै परिवारलाई संकटबाट जोगाउन सक्छ।',
      whyDesc: 'नेपालमा रगत तथा प्रत्यारोपणसम्बन्धी सहयोग केही घण्टामै अत्यन्त आवश्यक हुन सक्छ। समयमै दानले उपचारको नतिजा राम्रो बनाउँछ र ढिलाइ घटाउँछ।',
      priorityTag: 'जनस्वास्थ्य प्राथमिकता',
      priorityDesc: 'नियमित स्वैच्छिक दानले आपतकालीन तयारी कायम राख्छ र नियोजित उपचारलाई देशभर समर्थन गर्छ।',
      emergencyNeedTitle: 'आपतकालमा तुरुन्त आपूर्ति चाहिन्छ',
      emergencyNeedDesc: 'सडक दुर्घटना, मातृ आपतकाल, शल्यक्रिया र दीर्घरोग उपचारमा तुरुन्त रगत आवश्यक पर्न सक्छ।',
      communitySaveTitle: 'समुदायको बलले जीवन बचाउँछ',
      communitySaveDesc: 'स्थानीय समुदाय सक्रिय हुँदा बिरामीले आफ्नै क्षेत्रमै छिटो सहयोग पाउन सक्छन्।',
      impactTitle: 'एक दर्ता, दीर्घकालीन प्रभाव',
      impactDesc: 'प्रमाणित दाता प्रोफाइलले समयसँगै धेरै बिरामीलाई सहयोग गर्न सक्छ।',
      whoDonateTitle: 'सामान्यतया कसले दान गर्न सक्छ?',
      whoDonateDesc: 'स्वास्थ्य परीक्षण मापदण्ड पूरा गर्ने स्वस्थ वयस्कले स्वास्थ्यकर्मीको सल्लाह अनुसार दान गर्न सक्छन्।',
      whyEarlyTitle: 'छिटै दर्ता किन गर्ने?',
      whyEarlyDesc: 'समयमै दर्ताले विशेषगरी दुर्लभ रक्त समूह र अंग आवश्यकतामा मिलानको गति बढाउँछ।',
      emergencyCaseTitle: 'अहिले नै आपतकालीन केस छ?',
      emergencyCaseDesc: 'छिटो प्रसारणका लागि सहायता अनुरोध मार्ग प्रयोग गरी आवश्यक विवरण तुरुन्त पठाउनुहोस्।',
      openEmergency: 'आपतकालीन अनुरोध खोल्नुहोस्',
      broadcastAlert: 'आपतकालीन प्रसारण',
      requestHelpModal: 'सहायता अनुरोध',
      broadcastDesc: 'तपाईंको क्षेत्रका मिल्दोजुल्दो दातालाई तुरुन्त जानकारी पठाउनुहोस्।',
      requestHelpDesc: 'नजिकका दातालाई सूचना पठाउन आपतकालीन अनुरोधका लागि खाता बनाउनुहोस्।',
      sendAlert: 'अहिले नै अलर्ट पठाउनुहोस्',
      registerAndHelp: 'दर्ता गर्नुहोस् र सहायता माग्नुहोस्',
      step: 'चरण',
      english: 'EN',
      nepali: 'नेपाली',
    },
  };

  const t = copy[language];

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-red-50 via-white to-slate-100"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      <div className="bg-slate-900 text-slate-100 text-xs sm:text-sm px-4 py-2 text-center tracking-wide">
        {t.topBar}
      </div>

      {/* --- NAVBAR --- */}
      <nav className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center px-5 md:px-10 py-5 bg-white/90 backdrop-blur sticky top-0 z-[1000] border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-red-700 cursor-pointer leading-none" onClick={() => navigate('/')}>LifeLink</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">{t.tagline}</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 font-bold text-slate-600">
          <button 
            onClick={() => navigate('/register?type=donor')} 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-all border border-green-200"
          >
            <Heart size={18}/> {t.becomeDonor}
          </button>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200"
          >
            <HandHeart size={18}/> {t.requestHelp}
          </button>
          <button
            onClick={() => setLanguage((prev) => (prev === 'en' ? 'np' : 'en'))}
            className="px-4 py-2 rounded-full border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Switch language"
          >
            {language === 'en' ? `${t.nepali} | ${t.english}` : `${t.english} | ${t.nepali}`}
          </button>
          {isAuthenticated ? (
            <button onClick={() => navigate('/profile')} className="hover:text-red-700 transition-all px-2">{t.myProfile}</button>
          ) : (
            <button onClick={() => navigate('/login')} className="hover:text-red-700 transition-all px-2">{t.login}</button>
          )}
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="px-4 md:px-8 pt-12 md:pt-16 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-[32px] p-7 md:p-10 shadow-xl">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-extrabold tracking-wider uppercase mb-5">
              <ShieldCheck size={14} /> {t.trusted}
            </p>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
              {t.heroLine1}
              <span className="text-red-700 block">{t.heroLine2}</span>
            </h2>
            <p className="mt-5 text-slate-600 text-base md:text-lg leading-relaxed font-medium max-w-xl">
              {t.heroDesc}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/register?type=donor')}
                className="px-5 py-3 rounded-2xl bg-red-700 text-white font-extrabold hover:bg-red-800 transition-all"
              >
                {t.joinDonor}
              </button>
              <button
                onClick={() => navigate('/request-help')}
                className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-black transition-all"
              >
                {t.registerHelp}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <p className="text-lg font-black text-emerald-700">77</p>
                <p className="text-xs font-semibold text-slate-600">{t.districtReach}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                <p className="text-lg font-black text-red-700">24/7</p>
                <p className="text-xs font-semibold text-slate-600">{t.urgentAlerts}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                <p className="text-lg font-black text-blue-700">1,000+</p>
                <p className="text-xs font-semibold text-slate-600">{t.activeSupporters}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- SERVICE HIGHLIGHTS --- */}
      <section className="px-4 md:px-10 pb-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <Clock3 size={22} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{t.rapidTitle}</h4>
            <p className="text-slate-600 font-medium">{t.rapidDesc}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Users size={22} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{t.communityTitle}</h4>
            <p className="text-slate-600 font-medium">{t.communityDesc}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Activity size={22} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{t.supportTitle}</h4>
            <p className="text-slate-600 font-medium">{t.supportDesc}</p>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="px-4 md:px-10 pb-12">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-[32px] p-7 md:p-10">
          <h3 className="text-3xl font-black text-slate-900 mb-6">{t.howItWorks}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-red-700 text-sm font-black mb-2">{t.step} 1</p>
              <h4 className="font-black text-slate-900 mb-2">{t.step1Title}</h4>
              <p className="text-slate-600 font-medium text-sm">{t.step1Desc}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-red-700 text-sm font-black mb-2">{t.step} 2</p>
              <h4 className="font-black text-slate-900 mb-2">{t.step2Title}</h4>
              <p className="text-slate-600 font-medium text-sm">{t.step2Desc}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-red-700 text-sm font-black mb-2">{t.step} 3</p>
              <h4 className="font-black text-slate-900 mb-2">{t.step3Title}</h4>
              <p className="text-slate-600 font-medium text-sm">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY DONATION MATTERS --- */}
      <section className="px-4 md:px-10 pb-12">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-[32px] p-7 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">
            <div className="max-w-2xl">
              <p className="text-red-700 font-black text-xs tracking-widest uppercase mb-2">{t.whyTag}</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{t.whyTitle}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                {t.whyDesc}
              </p>
            </div>
            <div className="md:min-w-56 bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700 font-black uppercase tracking-wide mb-1">{t.priorityTag}</p>
              <p className="text-slate-700 font-semibold text-sm">{t.priorityDesc}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-3">
                <AlertTriangle size={20} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">{t.emergencyNeedTitle}</h4>
              <p className="text-slate-600 text-sm font-medium">{t.emergencyNeedDesc}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Users size={20} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">{t.communitySaveTitle}</h4>
              <p className="text-slate-600 text-sm font-medium">{t.communitySaveDesc}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Heart size={20} />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">{t.impactTitle}</h4>
              <p className="text-slate-600 text-sm font-medium">{t.impactDesc}</p>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 p-5 bg-white">
              <p className="text-slate-900 font-black mb-2">{t.whoDonateTitle}</p>
              <p className="text-slate-600 text-sm font-medium">{t.whoDonateDesc}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 bg-white">
              <p className="text-slate-900 font-black mb-2">{t.whyEarlyTitle}</p>
              <p className="text-slate-600 text-sm font-medium">{t.whyEarlyDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-10 pb-16">
        <div className="max-w-7xl mx-auto bg-red-700 rounded-[32px] p-7 md:p-9 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h3 className="text-2xl md:text-3xl font-black mb-2">{t.emergencyCaseTitle}</h3>
              <p className="text-red-100 font-medium">{t.emergencyCaseDesc}</p>
            </div>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-red-700 font-black hover:bg-red-50 transition-all"
            >
              <PhoneCall size={18} /> {t.openEmergency}
            </button>
          </div>
        </div>
      </section>

      {/* --- EMERGENCY MODAL --- */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300 relative">
            <button onClick={() => setShowEmergencyModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600"><X/></button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6"><AlertTriangle size={32}/></div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              {isAuthenticated ? t.broadcastAlert : t.requestHelpModal}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {isAuthenticated 
                ? t.broadcastDesc
                : t.requestHelpDesc}
            </p>
            {isAuthenticated ? (
              <button 
                onClick={() => { alert("Broadcast Sent!"); setShowEmergencyModal(false); }}
                className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                <Send size={20}/> {t.sendAlert}
              </button>
            ) : (
              <button 
                onClick={() => navigate('/request-help')}
                className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                <HandHeart size={20}/> {t.registerAndHelp}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}