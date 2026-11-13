export type LanguageCode = 'en' | 'hi' | 'te';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Brand & Header
    brand_name: 'CareBridge',
    tagline: 'Connect care. Close gaps. Support better journeys.',
    nav_home: 'Home',
    nav_departments: 'Departments',
    nav_doctors: 'Doctors',
    nav_how_it_works: 'How it Works',
    nav_emergency: 'Emergency QR',
    nav_contact: 'Contact',
    btn_login: 'Sign In',
    btn_portal: 'Access Portal',
    btn_book_appointment: 'Book Appointment',
    demo_mode_badge: 'Demo Mode Active (Supabase Not Connected)',
    demo_mode_desc: 'Running in safe local mode with realistic clinical records.',

    // Common
    loading: 'Loading...',
    save: 'Save Changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    status: 'Status',
    actions: 'Actions',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    view_all: 'View All',
    back: 'Back',

    // Roles
    role_patient: 'Patient',
    role_doctor: 'Doctor',
    role_admin: 'Administrator',
    role_donor: 'Donor',

    // Landing Hero
    hero_title: 'Connected Healthcare Continuity & Care Coordination',
    hero_subtitle: 'CareBridge bridges clinical gaps between hospital discharges, doctor appointments, pharmacy orders, family health oversight, and urgent blood donation.',
    hero_stat_patients: '12,500+ Patients Connected',
    hero_stat_doctors: '450+ Certified Physicians',
    hero_stat_gaps: '94.8% Care Gaps Resolved',
    hero_stat_response: '< 90s Paramedic QR Access',

    // Features
    feat_care_gaps: 'Care Gap Engine',
    feat_care_gaps_desc: 'Intelligent clinical surveillance flagging missed lab tests, overdue follow-ups, and pending medication refills.',
    feat_journey: 'Unified Health Journey',
    feat_journey_desc: 'Chronological timeline of consultations, prescriptions, lab results, and vitals across all providers.',
    feat_qr: 'Emergency Lifesaving QR',
    feat_qr_desc: 'Time-limited, revocable secure access tokens allowing first responders to access critical allergy and blood data.',
    feat_blood: 'Blood & Organ Coordination',
    feat_blood_desc: 'Direct match network connecting urgent hospital requests with nearby verified donors.',
    feat_pharmacy: 'Continuity Pharmacy',
    feat_pharmacy_desc: 'One-click prescription medication fulfilment with doorstep tracking from licensed pharmacies.',

    // Accessibility
    easy_access_mode: 'Easy Access Mode',
    easy_access_on: 'Large Text Active',
    read_aloud: 'Listen (Text to Speech)',
    voice_input: 'Voice Dictation',

    // Notifications
    notifications: 'Notifications',
    mark_all_read: 'Mark All Read',
    no_notifications: 'No unread notifications.',
  },
  hi: {
    // Brand & Header
    brand_name: 'केयरब्रिज',
    tagline: 'देखभाल जोड़ें। कमियां दूर करें। बेहतर स्वास्थ्य यात्रा का समर्थन करें।',
    nav_home: 'होम',
    nav_departments: 'विभाग',
    nav_doctors: 'चिकित्सक',
    nav_how_it_works: 'यह कैसे काम करता है',
    nav_emergency: 'आपातकालीन क्यूआर',
    nav_contact: 'संपर्क',
    btn_login: 'लॉग इन',
    btn_portal: 'पोर्टल खोलें',
    btn_book_appointment: 'अपॉइंटमेंट बुक करें',
    demo_mode_badge: 'डेमो मोड सक्रिय (सुपाबेस कनेक्ट नहीं है)',
    demo_mode_desc: 'यथार्थवादी नैदानिक डेटा के साथ सुरक्षित स्थानीय मोड में चल रहा है।',

    // Common
    loading: 'लोड हो रहा है...',
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    status: 'स्थिति',
    actions: 'क्रियाएँ',
    close: 'बंद करें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    view_all: 'सभी देखें',
    back: 'वापस',

    // Roles
    role_patient: 'मरीज़ (Patient)',
    role_doctor: 'डॉक्टर (Doctor)',
    role_admin: 'व्यवस्थापक (Admin)',
    role_donor: 'रक्तदाता (Donor)',

    // Landing Hero
    hero_title: 'संबद्ध स्वास्थ्य निरंतरता और देखभाल समन्वय',
    hero_subtitle: 'केयरब्रिज अस्पताल से छुट्टी, डॉक्टर अपॉइंटमेंट, फार्मेसी और आपातकालीन रक्तदान के बीच के अंतर को पाटता है।',
    hero_stat_patients: '12,500+ मरीज़ जुड़े हैं',
    hero_stat_doctors: '450+ प्रमाणित विशेषज्ञ',
    hero_stat_gaps: '94.8% स्वास्थ्य अंतराल दूर किए गए',
    hero_stat_response: '< 90s आपातकालीन क्यूआर पहुंच',

    // Features
    feat_care_gaps: 'केयर गैप इंजन',
    feat_care_gaps_desc: 'छूटे हुए परीक्षणों, बकाया फॉलो-अप और दवा रिफिल की स्वचालित पहचान।',
    feat_journey: 'एकीकृत स्वास्थ्य यात्रा',
    feat_journey_desc: 'परामर्श, नुस्खे, लैब रिपोर्ट और वाइटल्स की कालानुक्रमिक समयरेखा।',
    feat_qr: 'आपातकालीन जीवन रक्षक क्यूआर',
    feat_qr_desc: 'पैरामेडिक्स के लिए एलर्जी और रक्त समूह तक सुरक्षित त्वरित पहुंच।',
    feat_blood: 'रक्त और अंग समन्वय',
    feat_blood_desc: 'अस्पताल की तत्काल जरूरतों को पास के सत्यापित दाताओं से जोड़ना।',
    feat_pharmacy: 'निरंतरता फार्मेसी',
    feat_pharmacy_desc: 'सत्यापित नुस्खे से सीधे दवा वितरण और ट्रैकिंग।',

    // Accessibility
    easy_access_mode: 'सरल पहुंच मोड',
    easy_access_on: 'बड़ा टेक्स्ट सक्रिय',
    read_aloud: 'सुनें (टेक्स्ट टू स्पीच)',
    voice_input: 'आवाज़ से लिखें',

    // Notifications
    notifications: 'सूचनाएं',
    mark_all_read: 'सभी पढ़ा हुआ चिह्नित करें',
    no_notifications: 'कोई नई सूचना नहीं है।',
  },
  te: {
    // Brand & Header
    brand_name: 'కేర్‌బ్రిడ్జ్',
    tagline: 'వైద్య సంరక్షణను కలపండి. అంతరాలను పూడ్చండి. మెరుగైన ఆరోగ్యానికి తోడ్పడండి.',
    nav_home: 'హోమ్',
    nav_departments: 'విభాగాలు',
    nav_doctors: 'వైద్యులు',
    nav_how_it_works: 'ఇది ఎలా పనిచేస్తుంది',
    nav_emergency: 'ఎమర్జెన్సీ క్యూఆర్',
    nav_contact: 'సంప్రదించండి',
    btn_login: 'లాగిన్',
    btn_portal: 'పోర్టల్ ప్రవేశం',
    btn_book_appointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    demo_mode_badge: 'డెమో మోడ్ యాక్టివ్ (సూపాబేస్ కనెక్ట్ కాలేదు)',
    demo_mode_desc: 'సురక్షితమైన లోకల్ మోడ్‌లో క్లినికల్ రికార్డులతో నడుస్తోంది.',

    // Common
    loading: 'లోడ్ అవుతోంది...',
    save: 'మార్పులను భద్రపరచండి',
    cancel: 'రద్దు చేయండి',
    confirm: 'ధృవీకరించండి',
    status: 'స్థితి',
    actions: 'చర్యలు',
    close: 'మూసివేయి',
    search: 'వెతకండి',
    filter: 'ఫిల్టర్',
    view_all: 'అన్నీ చూడండి',
    back: 'వెనుకకు',

    // Roles
    role_patient: 'రోగి (Patient)',
    role_doctor: 'వైద్యుడు (Doctor)',
    role_admin: 'అడ్మినిస్ట్రేటర్ (Admin)',
    role_donor: 'రక్తదాత (Donor)',

    // Landing Hero
    hero_title: 'సమగ్ర ఆరోగ్య సంరక్షణ కొనసాగింపు & సమన్వయ వేదిక',
    hero_subtitle: 'హాస్పిటల్ డిశ్చార్జ్, డాక్టర్ అపాయింట్‌మెంట్లు, మందుల ఆర్డర్లు మరియు అత్యవసర రక్తదానాల మధ్య అంతరాలను కేర్‌బ్రిడ్జ్ తొలగిస్తుంది.',
    hero_stat_patients: '12,500+ అనుసంధానించబడిన రోగులు',
    hero_stat_doctors: '450+ ధృవీకరించబడిన వైద్యులు',
    hero_stat_gaps: '94.8% సంరక్షణ అంతరాలు పరిష్కరించబడ్డాయి',
    hero_stat_response: '< 90s ఎమర్జెన్సీ క్యూఆర్ రెస్పాన్స్',

    // Features
    feat_care_gaps: 'కేర్ గ్యాప్ ఇంజిన్',
    feat_care_gaps_desc: 'మిస్సైన ల్యాబ్ పరీక్షలు మరియు గడువు ముగిసిన ఫాలో-అప్‌లను వెంటనే గుర్తిస్తుంది.',
    feat_journey: 'సమగ్ర హెల్త్ జర్నీ టైమ్‌లైన్',
    feat_journey_desc: 'కన్సల్టేషన్లు, ప్రిస్క్రిప్షన్లు మరియు ల్యాబ్ ఫలితాల పూర్తి కాలక్రమం.',
    feat_qr: 'ఎమర్జెన్సీ జీవరక్షక QR',
    feat_qr_desc: 'అత్యవసర చికిత్సకు అవసరమైన రక్త గ్రూప్, అలర్జీల వివరాలు సురక్షితంగా చూపిస్తుంది.',
    feat_blood: 'రక్త & అవయవ సమన్వయం',
    feat_blood_desc: 'అత్యవసర సమయాల్లో ధృవీకరించబడిన దాతలతో ఆసుపత్రులను కలుపుతుంది.',
    feat_pharmacy: 'కంటిన్యూటీ ఫార్మసీ',
    feat_pharmacy_desc: 'డాక్టర్ ప్రిస్క్రిప్షన్ ఆధారంగా నేరుగా మందుల ఆర్డర్ మరియు ట్రాకింగ్.',

    // Accessibility
    easy_access_mode: 'సులభ యాక్సెస్ మోడ్',
    easy_access_on: 'పెద్ద అక్షరాలు యాక్టివ్',
    read_aloud: 'వినండి (టెక్స్ట్ టు స్పీచ్)',
    voice_input: 'వాయిస్ టైపింగ్',

    // Notifications
    notifications: 'నోటిఫికేషన్లు',
    mark_all_read: 'అన్నీ చదివినట్లుగా గుర్తించండి',
    no_notifications: 'కొత్త నోటిఫికేషన్లు లేవు.',
  },
};
