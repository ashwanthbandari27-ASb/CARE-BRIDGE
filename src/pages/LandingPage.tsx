import React, { useState } from 'react';
import {
  Heart,
  Brain,
  Bone,
  Baby,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  QrCode,
  Users,
  Send,
  Calendar,
  CheckCircle2,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AppDataStore } from '../services/store';
import { Doctor, Department } from '../types';
import heroDoctorImg from '../assets/images/carebridge_hero_doctor_1794497405227.jpg';
import doctorMaleImg from '../assets/images/carebridge_doctor_male_1794497405619.jpg';
import doctorFemaleImg from '../assets/images/carebridge_doctor_female_1794497406552.jpg';
import emergencyCareImg from '../assets/images/carebridge_emergency_care_1794497407773.jpg';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onBookDoctor: (doctor: Doctor) => void;
  onOpenEmergencyPreview: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onBookDoctor, onOpenEmergencyPreview }) => {
  const { switchRole } = useAuth();
  const { t } = useLanguage();
  const departments = AppDataStore.getDepartments();
  const doctors = AppDataStore.getDoctors().filter((d) => d.isApprovedByAdmin);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    const messages = AppDataStore.getContactMessages();
    AppDataStore.setContactMessages([
      {
        id: 'cnt_' + Date.now(),
        name: contactName,
        email: contactEmail,
        subject: contactSubject || 'General Inquiry',
        message: contactMessage,
        status: 'unread',
        createdAt: new Date().toISOString(),
      },
      ...messages,
    ]);

    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 3500);
  };

  const getDepartmentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-blue-500" />;
      case 'Bone':
        return <Bone className="w-5 h-5 text-amber-500" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-emerald-500" />;
      default:
        return <Activity className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              {/* Unboxed clean metadata kicker (Anti-slop compliant) */}
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 tracking-wide uppercase">
                <span>CareBridge Healthcare Continuity</span>
                <span aria-hidden="true">·</span>
                <span>ISO & HIPAA Aligned</span>
                <span aria-hidden="true">·</span>
                <span>Active 24/7 Coordination</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] text-balance">
                Connect care. Close gaps. Support better health journeys.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                CareBridge eliminates fragmentation between hospital discharge, specialist consultations,
                prescriptions, emergency triage, and urgent blood donation. Seamlessly connecting patients, clinicians,
                and donors in one secure platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    switchRole('patient');
                    onNavigate('patient');
                  }}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Enter Patient Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('doctors-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Find a Doctor
                </button>

                <button
                  onClick={onOpenEmergencyPreview}
                  className="px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Test Emergency QR</span>
                </button>
              </div>

              {/* Persona Quick Switcher Bar */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Test Full Platform via 1-Click Role Switcher:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      switchRole('patient');
                      onNavigate('patient');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                  >
                    Patient (Eleanor Vance)
                  </button>
                  <button
                    onClick={() => {
                      switchRole('doctor');
                      onNavigate('doctor');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    Doctor (Dr. David Chen)
                  </button>
                  <button
                    onClick={() => {
                      switchRole('admin');
                      onNavigate('admin');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    Administrator Control
                  </button>
                  <button
                    onClick={() => {
                      switchRole('donor');
                      onNavigate('donor');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
                  >
                    Donor Network (Liam G.)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: High Quality Generated Clinical Hero Visual */}
            <div className="lg:col-span-5 relative flex items-center">
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 relative group aspect-4/3 lg:aspect-auto lg:h-[460px]">
                <img
                  src={heroDoctorImg}
                  alt="Doctor consulting with patient in modern clinic"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                    Continuous Care Coordination
                  </div>
                  <div className="text-base font-bold mt-1">Dr. Eleanor & Care Team</div>
                  <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                    Proactive care gap surveillance ensures no medication interaction or scheduled test is ever
                    overlooked.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust KPI Strip (Full-width row directly beneath hero split) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/80">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">12,500+</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">Patients Coordinated</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">450+</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">Verified Physicians</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-2xl font-extrabold text-teal-600 tabular-nums">94.8%</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">Care Gaps Resolved</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-2xl font-extrabold text-rose-600 tabular-nums">&lt; 90s</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">Emergency QR Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MEDICAL DEPARTMENTS SECTION */}
      <section id="departments-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Comprehensive Specialties</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Medical Departments</h2>
          <p className="text-sm text-slate-600 mt-2">
            Integrated clinical teams sharing real-time electronic health records to ensure seamless transitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
                  {getDepartmentIcon(dept.icon)}
                </div>
                <div className="text-xs font-bold text-teal-700 tracking-wide uppercase">{dept.code}</div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{dept.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{dept.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate max-w-[180px]">{dept.headOfDepartment}</span>
                <button
                  onClick={() => {
                    switchRole('patient');
                    onNavigate('patient');
                  }}
                  className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED VERIFIED DOCTORS */}
      <section id="doctors-section" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Board Certified Faculty</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Featured Doctors</h2>
              <p className="text-sm text-slate-600 mt-2">
                Direct scheduling with verified physicians. Double-booking prevention prevents scheduling conflicts.
              </p>
            </div>
            <button
              onClick={() => {
                switchRole('patient');
                onNavigate('patient');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto"
            >
              View Full Clinical Directory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-6 items-start"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-slate-200">
                  <img
                    src={
                      doc.specialty.includes('Cardio')
                        ? doctorMaleImg
                        : doctorFemaleImg
                    }
                    alt={doc.profile?.fullName || doc.specialty}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">{doc.specialty}</span>
                    <span className="text-xs font-semibold text-slate-900 tabular-nums">
                      ${doc.consultationFee.toFixed(2)} / visit
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{doc.profile?.fullName || 'Physician'}</h3>
                  <p className="text-xs text-slate-500 font-medium">{doc.qualification}</p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{doc.bio}</p>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      License: <span className="font-mono">{doc.medicalLicenseNumber}</span> · {doc.experienceYears}y exp
                    </div>
                    <button
                      onClick={() => onBookDoctor(doc)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Slot</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW CAREBRIDGE WORKS */}
      <section id="how-it-works-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Continuity Framework</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How CareBridge Connects Your Care</h2>
          <p className="text-sm text-slate-600 mt-2">
            A cohesive care engine designed to keep every clinical stakeholder aligned throughout your recovery journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-teal-600 mb-3">01.</div>
              <h3 className="text-base font-bold text-slate-900">Unified Health Journey</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Consultation notes, prescriptions, laboratory investigations and vital trends aggregate into a single
                chronological record.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Real-time timeline sync</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-teal-600 mb-3">02.</div>
              <h3 className="text-base font-bold text-slate-900">Care Gap Surveillance</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Automated clinical rules flag missing tests, overdue follow-ups, and incomplete care plans before
                complications arise.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Surveillance engine</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-teal-600 mb-3">03.</div>
              <h3 className="text-base font-bold text-slate-900">1-Click Continuity Pharmacy</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Turn verified prescriptions directly into tracked delivery orders with automated refill schedule
                monitoring.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Prescription-linked orders</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-teal-600 mb-3">04.</div>
              <h3 className="text-base font-bold text-slate-900">Rapid Paramedic QR</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Emergency access tokens allow paramedics to view life-saving blood group and allergy data in under 90
                seconds without password delays.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Revocable & encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EMERGENCY QR & LIFESAVING TRIAGE SPOTLIGHT */}
      <section id="emergency-section" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest">
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Paramedic Triage Security Protocol</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Seconds save lives. Your vital medical data ready when you cannot speak.
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                In a critical road accident or sudden syncope event, emergency responders need immediate knowledge of
                your blood group, anaphylactic drug allergies, and primary contact. CareBridge generates time-limited,
                revocable QR tokens that reveal strictly vital triage facts—never exposing your full private medical
                record to passersby.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Random token hashes with automatic 30-day expiration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Audit logs capture accessor timestamp, IP address, and responder unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instantly revoke access at any time from your patient settings</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={onOpenEmergencyPreview}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-rose-600" />
                  <span>View Sample Paramedic ER View</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative aspect-16/10">
                <img
                  src={emergencyCareImg}
                  alt="Emergency department triage center"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/40 p-6 flex flex-col justify-end">
                  <div className="text-xs text-teal-300 font-semibold">Triage Station Rapid Access</div>
                  <div className="text-sm font-bold text-white mt-0.5">Emergency Department Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-5">
            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Reach CareBridge</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Hospital & Clinic Support</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Have questions about integrating CareBridge with your regional clinic, becoming a verified blood donor,
              or enrolling your family in care gap surveillance? We are here to support your journey.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Clinical Coordination Desk</div>
                <div className="text-slate-500 mt-0.5">support@carebridge.org · +1 (555) 019-2834</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Urgent Blood Donor Dispatch</div>
                <div className="text-slate-500 mt-0.5">blood-dispatch@carebridge.org · 24/7 Rapid Hotline</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Send a Message to Support</h3>

              {contactSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Message Submitted!</span> Your inquiry has been routed to the
                    CareBridge coordination desk.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Dr. Jordan Hayes"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="jordan@hospital.org"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g. Clinic Onboarding / Blood Donation Query"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can our healthcare coordination team assist you?"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Submit Inquiry</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">CareBridge</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Connect care. Close gaps. Support better journeys.</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors">
                Home
              </button>
              <button
                onClick={() => {
                  switchRole('patient');
                  onNavigate('patient');
                }}
                className="hover:text-white transition-colors"
              >
                Patient Portal
              </button>
              <button
                onClick={() => {
                  switchRole('doctor');
                  onNavigate('doctor');
                }}
                className="hover:text-white transition-colors"
              >
                Doctor Portal
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  onNavigate('admin');
                }}
                className="hover:text-white transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
            <p>
              MEDICAL DISCLAIMER: CareBridge is an electronic health care continuity, care gap surveillance, and
              operational coordination system. It does not replace emergency medical dispatch or individual clinical
              judgment. For acute life-threatening situations, dial local emergency services immediately.
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} CareBridge Platform. Built with PostgreSQL, Supabase, and React.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
