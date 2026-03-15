import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  X,
  Heart,
  HandHeart,
  ShieldCheck,
  Clock3,
  Users,
  Activity,
  PhoneCall,
  Loader2,
  Search,
  Megaphone,
  BookOpen,
  MessageCircle,
  Bell,
  ArrowRight,
  CheckCircle2,
  Droplets,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, notificationsAPI } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [language, setLanguage] = useState('en');
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ll_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const [readMessageIds, setReadMessageIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ll_read_msg_notifs') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardAPI.getStats();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({ total_donors: 0, active_requests: 0, districts_count: 0 });
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/announcements?limit=4`);
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch {
        setAnnouncements([]);
      }
    };

    fetchStats();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationCount(0);
      setIsNotificationOpen(false);
      return;
    }

    let mounted = true;

    const loadNotifications = async () => {
      if (!mounted) return;
      setIsLoadingNotifications(true);
      try {
        const data = await notificationsAPI.getMyNotifications(15);
        if (!mounted) return;
        setNotifications(data.notifications || []);
        setNotificationCount(Number(data.unread_count) || 0);
      } catch {
        if (!mounted) return;
        setNotifications([]);
        setNotificationCount(0);
      } finally {
        if (mounted) setIsLoadingNotifications(false);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const formatNotificationTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRequestExpiryMs = (urgency) => {
    switch (urgency) {
      case 'critical': return 24 * 60 * 60 * 1000;
      case 'high':     return 7 * 24 * 60 * 60 * 1000;
      case 'medium':   return 30 * 24 * 60 * 60 * 1000;
      default:         return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const visibleNotifications = notifications.filter((item) => {
    if (dismissedIds.has(item.id)) return false;
    if (item.type === 'message' && readMessageIds.has(item.id)) return false;
    if (item.type === 'request' && item.created_at) {
      const ageMs = Date.now() - new Date(item.created_at).getTime();
      if (ageMs > getRequestExpiryMs(item.urgency)) return false;
    }
    return true;
  });

  const dismissNotification = (e, itemId) => {
    e.stopPropagation();
    const updated = new Set(dismissedIds);
    updated.add(itemId);
    setDismissedIds(updated);
    localStorage.setItem('ll_dismissed_notifs', JSON.stringify([...updated]));
  };

  const handleNotificationClick = (item) => {
    setIsNotificationOpen(false);
    if (item.type === 'message' && item.reference_id) {
      const updated = new Set(readMessageIds);
      updated.add(item.id);
      setReadMessageIds(updated);
      localStorage.setItem('ll_read_msg_notifs', JSON.stringify([...updated]));
      navigate(`/chat?to=${item.reference_id}`);
      return;
    }
    if (item.type === 'request' && item.reference_id) {
      navigate(`/request/${item.reference_id}`);
      return;
    }
    if (item.type === 'alert') navigate('/request-help');
  };

  const copy = {
    en: {
      topBar: 'Nepal Emergency Health Support Network | 24/7 Coordinated Donor Matching',
      tagline: 'Jeevan Ko Lagi Sahayog',
      register: 'Register',
      requestHelp: 'Request Help',
      myProfile: 'My Profile',
      login: 'Login',
      trusted: 'Trusted Nepal Health Community',
      heroLabel: 'Nepal\'s Blood & Organ Donation Network',
      heroLine1: 'Donate Blood & Organs.',
      heroLine2: 'Save Lives Across Nepal.',
      heroDesc: 'LifeLink connects verified blood and organ donors with families in need — using locality-based matching, emergency pathways, and community-first coordination across all 77 districts.',
      joinNow: 'Join Now',
      districtReach: 'Districts Covered',
      urgentAlerts: 'Active Requests',
      activeSupporters: 'Registered Donors',
      rapidTitle: 'Rapid Emergency Path',
      rapidDesc: 'Urgent requests are prioritized so nearby verified donors can be notified immediately.',
      communityTitle: 'Community-Led Network',
      communityDesc: "Built for Nepal's cities and rural municipalities — people helping people through verified profiles.",
      supportTitle: 'Blood & Organ Support',
      supportDesc: 'From routine blood support to urgent transplant coordination, requests are structured clearly for fast action.',
      howItWorks: 'How LifeLink Works',
      step1Title: 'Register as Donor or Receiver',
      step1Desc: 'Complete your profile with district and municipality to enable local matching.',
      step2Title: 'Submit Need or Availability',
      step2Desc: 'Medical requirement, urgency level, and location data help prioritize response quickly.',
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
      submitRequest: 'Submit a Request',
      submitRequestDesc: 'Submit your emergency request and connect with nearby donors as quickly as possible.',
      registerAndHelp: 'Register & Request Help',
      step: 'Step',
      english: 'EN',
      nepali: 'नेपाली',
      footerTagline: 'Connecting donors and recipients across Nepal.',
      footerLinks: 'Quick Links',
      footerContact: 'Support',
      copyright: '© 2025 LifeLink Nepal. Saving lives together.',
    },
    np: {
      topBar: 'नेपाल आपतकालीन स्वास्थ्य सहयोग सञ्जाल | २४/७ समन्वित दाता मिलान',
      tagline: 'जीवनका लागि सहयोग',
      register: 'दर्ता',
      requestHelp: 'सहायता माग्नुहोस्',
      myProfile: 'मेरो प्रोफाइल',
      login: 'लगइन',
      trusted: 'विश्वसनीय नेपाली स्वास्थ्य समुदाय',
      heroLabel: 'नेपालको रगत र अंग दान सञ्जाल',
      heroLine1: 'रगत र अंग दान गर्नुहोस्।',
      heroLine2: 'नेपालभरि जीवन बचाउनुहोस्।',
      heroDesc: 'LifeLink ले परिवारलाई छिटो प्रमाणित रगत तथा अंग सहयोग पाउन मद्दत गर्छ, स्थानीय मिलान, स्पष्ट आपतकालीन प्रक्रिया र समुदायमुखी समन्वयसहित।',
      joinNow: 'अहिले जोडिनुहोस्',
      districtReach: 'जिल्ला पहुँच',
      urgentAlerts: 'सक्रिय अनुरोध',
      activeSupporters: 'दर्ता दाताहरू',
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
      submitRequest: 'अनुरोध पेश गर्नुहोस्',
      submitRequestDesc: 'आफ्नो आपतकालीन अनुरोध पेश गर्नुहोस् र नजिकका दातासँग सकेसम्म छिटो सम्पर्क गर्नुहोस्।',
      registerAndHelp: 'दर्ता गर्नुहोस् र सहायता माग्नुहोस्',
      step: 'चरण',
      english: 'EN',
      nepali: 'नेपाली',
      footerTagline: 'नेपालभर दाता र प्राप्तकर्तालाई जोड्दै।',
      footerLinks: 'द्रुत लिंकहरू',
      footerContact: 'सहयोग',
      copyright: '© २०२५ LifeLink Nepal. सँगै जीवन बचाउँदै।',
    },
  };

  const t = copy[language];

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      {/* --- TOP BAR --- */}
      <div className="bg-red-700 text-red-50 text-xs px-4 py-2 text-center tracking-wide font-medium">
        {t.topBar}
      </div>

      {/* --- NAVBAR --- */}
      <nav className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-center px-5 md:px-12 py-4 bg-white sticky top-0 z-[1000] border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-sm">
            <Droplets size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">LifeLink</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{t.tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 text-sm font-semibold text-slate-600">
          {isAuthenticated && (
            <button
              onClick={() => navigate('/find-donors')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-all"
            >
              <Search size={15}/> Find Donors
            </button>
          )}
          <button
            onClick={() => navigate('/about')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
          >
            <BookOpen size={15}/> About
          </button>
          <button
            onClick={() => setLanguage((prev) => (prev === 'en' ? 'np' : 'en'))}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs"
          >
            {language === 'en' ? `नेपाली` : `English`}
          </button>

          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg hover:bg-slate-50 transition-all text-slate-600"
                  aria-label="Notifications"
                >
                  <Bell size={18}/>
                  {visibleNotifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                      {visibleNotifications.length > 99 ? '99+' : visibleNotifications.length}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-[22rem] max-h-[24rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl z-[1100]">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="font-bold text-slate-800 text-sm">Notifications</p>
                      <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                    </div>
                    {isLoadingNotifications ? (
                      <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={20}/></div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {visibleNotifications.map((item) => (
                          <div key={item.id} className="relative group">
                            <button
                              onClick={() => handleNotificationClick(item)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all pr-9"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                <span className="text-[10px] text-slate-400 shrink-0">{formatNotificationTime(item.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.body}</p>
                              <span className="inline-block text-[10px] mt-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold uppercase tracking-wide">{item.type}</span>
                            </button>
                            <button
                              onClick={(e) => dismissNotification(e, item.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 text-slate-400"
                              aria-label="Dismiss"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/chat')} className="p-2 rounded-lg hover:bg-slate-50 transition-all text-slate-600">
                <MessageCircle size={18}/>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-all text-slate-700"
              >
                {t.myProfile}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
              >
                {t.login}
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-semibold shadow-sm"
              >
                {t.register}
              </button>
            </>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-semibold shadow-sm"
            >
              <HandHeart size={15}/> {t.requestHelp}
            </button>
          )}
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #ef4444 0%, transparent 50%), radial-gradient(circle at 80% 20%, #dc2626 0%, transparent 40%)'}}
        />

        <div className="relative max-w-7xl mx-auto px-5 md:px-12 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold tracking-widest uppercase mb-6">
              <ShieldCheck size={13}/> {t.heroLabel}
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
              {t.heroLine1}
              <span className="text-red-400 block mt-1">{t.heroLine2}</span>
            </h2>
            <p className="mt-5 text-slate-300 text-base md:text-lg leading-relaxed max-w-lg">
              {t.heroDesc}
            </p>

            {!isAuthenticated && (
              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-900/40"
                >
                  <ArrowRight size={17}/> {t.joinNow}
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center gap-5 mt-8 pt-6 border-t border-white/10">
              {[
                { icon: <CheckCircle2 size={14}/>, text: 'Verified Donors' },
                { icon: <MapPin size={14}/>, text: 'All 77 Districts' },
                { icon: <Clock3 size={14}/>, text: '24/7 Support' },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                  <span className="text-green-400">{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="relative hidden md:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=80"
                alt="Blood donation — saving lives"
                className="w-full h-[420px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"/>
              <div className="absolute bottom-5 left-5 right-5">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <p className="text-white font-black text-sm">Every drop matters.</p>
                  <p className="text-slate-300 text-xs mt-0.5">One donation can save up to 3 lives.</p>
                </div>
              </div>
            </div>
            {/* Floating stat badge */}
            <div className="absolute -top-4 -right-4 bg-red-600 text-white rounded-2xl p-4 shadow-xl">
              <p className="text-2xl font-black leading-none">77</p>
              <p className="text-red-200 text-xs mt-0.5 font-semibold">Districts</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-5 md:px-12 py-6 grid grid-cols-3 gap-4">
            {isLoadingStats ? (
              <div className="col-span-3 flex justify-center py-2">
                <Loader2 className="animate-spin text-white/40" size={22}/>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{stats?.districts_count || 0}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">{t.districtReach}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-3xl font-black text-red-400">{stats?.active_requests || 0}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">{t.urgentAlerts}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-400">{stats?.total_donors?.toLocaleString() || 0}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">{t.activeSupporters}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================== SERVICE HIGHLIGHTS ==================== */}
      <section className="py-16 px-5 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-red-600 font-bold text-xs uppercase tracking-widest mb-2">What We Offer</p>
            <h3 className="text-3xl font-black text-slate-900">Built for Nepal's healthcare needs</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock3 size={24}/>,
                bg: 'bg-red-50', iconColor: 'text-red-600',
                title: t.rapidTitle, desc: t.rapidDesc,
                accent: 'border-t-red-500',
              },
              {
                icon: <Users size={24}/>,
                bg: 'bg-blue-50', iconColor: 'text-blue-600',
                title: t.communityTitle, desc: t.communityDesc,
                accent: 'border-t-blue-500',
              },
              {
                icon: <Activity size={24}/>,
                bg: 'bg-emerald-50', iconColor: 'text-emerald-600',
                title: t.supportTitle, desc: t.supportDesc,
                accent: 'border-t-emerald-500',
              },
            ].map((card) => (
              <div key={card.title} className={`bg-white rounded-2xl p-7 shadow-sm border border-slate-100 border-t-4 ${card.accent} hover:shadow-md transition-shadow`}>
                <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.iconColor} flex items-center justify-center mb-5`}>
                  {card.icon}
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">{card.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16 px-5 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-red-600 font-bold text-xs uppercase tracking-widest mb-2">Process</p>
            <h3 className="text-3xl font-black text-slate-900">{t.howItWorks}</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-red-200 to-red-200 z-0"/>
            {[
              { num: '01', title: t.step1Title, desc: t.step1Desc, icon: <Users size={22}/> },
              { num: '02', title: t.step2Title, desc: t.step2Desc, icon: <Activity size={22}/> },
              { num: '03', title: t.step3Title, desc: t.step3Desc, icon: <Heart size={22}/> },
            ].map((step, idx) => (
              <div key={step.num} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-red-200 text-2xl font-black">
                  {step.num}
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="mt-10 text-center">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-sm"
              >
                Get Started <ArrowRight size={16}/>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ==================== WHY DONATION MATTERS ==================== */}
      <section className="py-16 px-5 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
            {/* Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80"
                alt="Medical care and donation"
                className="w-full h-72 md:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"/>
              <div className="absolute bottom-5 left-5">
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3">
                  <p className="text-white font-bold text-sm">Nepal Blood Network</p>
                  <p className="text-slate-300 text-xs mt-0.5">Saving lives since 2024</p>
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="order-1 md:order-2">
              <p className="text-red-600 font-bold text-xs uppercase tracking-widest mb-3">{t.whyTag}</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">{t.whyTitle}</h3>
              <p className="text-slate-600 leading-relaxed mb-5">{t.whyDesc}</p>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-red-700 font-bold text-sm uppercase tracking-wide mb-1">{t.priorityTag}</p>
                <p className="text-slate-600 text-sm">{t.priorityDesc}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <AlertTriangle size={20}/>, bg: 'bg-red-50', color: 'text-red-600', title: t.emergencyNeedTitle, desc: t.emergencyNeedDesc },
              { icon: <Users size={20}/>, bg: 'bg-blue-50', color: 'text-blue-600', title: t.communitySaveTitle, desc: t.communitySaveDesc },
              { icon: <Heart size={20}/>, bg: 'bg-emerald-50', color: 'text-emerald-600', title: t.impactTitle, desc: t.impactDesc },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                  {card.icon}
                </div>
                <h4 className="font-black text-slate-900 mb-2">{card.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-5">
            {[
              { title: t.whoDonateTitle, desc: t.whoDonateDesc },
              { title: t.whyEarlyTitle, desc: t.whyEarlyDesc },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={18}/>
                </div>
                <div>
                  <p className="font-black text-slate-900 mb-1">{item.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ANNOUNCEMENTS ==================== */}
      {announcements.length > 0 && (
        <section className="py-14 px-5 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-orange-600 font-bold text-xs uppercase tracking-widest mb-1">Latest</p>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Megaphone className="text-orange-500" size={22}/> Campaigns & Announcements
                </h3>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4 hover:border-orange-200 transition-colors">
                  <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <Megaphone className="text-orange-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 mb-1">{ann.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{ann.content}</p>
                    <p className="text-slate-400 text-xs mt-2">
                      {new Date(ann.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {ann.author_name ? ` — ${ann.author_name}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== EMERGENCY CTA ==================== */}
      <section className="py-14 px-5 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-r from-red-700 to-red-800 rounded-3xl p-8 md:p-12 shadow-xl">
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-red-600/30"/>
            <div className="absolute -right-5 -bottom-10 w-40 h-40 rounded-full bg-red-900/40"/>

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 border border-red-500 text-red-100 text-xs font-bold mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse"/>
                  LIVE
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{t.emergencyCaseTitle}</h3>
                <p className="text-red-200 font-medium max-w-lg">{t.emergencyCaseDesc}</p>
              </div>
              <button
                onClick={() => isAuthenticated ? navigate('/request-help') : setShowEmergencyModal(true)}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white text-red-700 font-black hover:bg-red-50 transition-all shadow-lg shrink-0"
              >
                <PhoneCall size={18}/> {t.openEmergency}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-5 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Droplets size={16} className="text-white"/>
                </div>
                <span className="text-white font-black text-lg">LifeLink</span>
              </div>
              <p className="text-sm leading-relaxed">{t.footerTagline}</p>
            </div>

            <div>
              <p className="text-white font-bold text-sm mb-3">{t.footerLinks}</p>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  { label: 'Find Donors', path: '/find-donors' },
                  { label: 'Request Help', path: '/request-help' },
                  { label: 'About Us', path: '/about' },
                  { label: 'Register', path: '/register' },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    className="text-left hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ChevronRight size={12}/> {link.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white font-bold text-sm mb-3">{t.footerContact}</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-green-500"/> Verified donor network</p>
                <p className="flex items-center gap-2"><Clock3 size={13} className="text-blue-400"/> 24/7 emergency support</p>
                <p className="flex items-center gap-2"><MapPin size={13} className="text-red-400"/> All 77 districts of Nepal</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>{t.copyright}</p>
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
          </div>
        </div>
      </footer>

      {/* ==================== EMERGENCY MODAL ==================== */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowEmergencyModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all">
              <X size={18}/>
            </button>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5">
              <AlertTriangle size={28}/>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{t.requestHelpModal}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {t.requestHelpDesc}
            </p>
            <button
              onClick={() => { setShowEmergencyModal(false); navigate('/register'); }}
              className="w-full bg-red-600 text-white p-4 rounded-2xl font-black text-base hover:bg-red-700 transition-all flex items-center justify-center gap-2.5"
            >
              <HandHeart size={18}/> {t.registerAndHelp}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
