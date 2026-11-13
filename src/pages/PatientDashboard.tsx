import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Pill,
  ShoppingBag,
  QrCode,
  Heart,
  Users,
  Sparkles,
  Volume2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AppDataStore } from '../services/store';
import { AppointmentService } from '../services/appointmentService';
import { CareGapService } from '../services/careGapService';
import { PharmacyService } from '../services/pharmacyService';
import { BloodService } from '../services/bloodService';
import { EmergencyService } from '../services/emergencyService';
import { AiHealthSummaryService, HealthSummaryResult } from '../services/aiService';
import { BookingModal } from '../components/BookingModal';
import { Patient, Appointment, Prescription, CareGap, LabReport, Consultation, MedicineOrder } from '../types';

interface PatientDashboardProps {
  onOpenEmergencyParamedic: (tokenHash: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onOpenEmergencyParamedic }) => {
  const { currentUser } = useAuth();
  const { t, speakText } = useLanguage();

  const patients = AppDataStore.getPatients();
  const activePatient: Patient =
    patients.find((p) => p.profileId === currentUser?.id) || patients[0];

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'appointments'
    | 'journey'
    | 'care_gaps'
    | 'prescriptions'
    | 'pharmacy'
    | 'emergency_qr'
    | 'blood_organ'
    | 'family'
    | 'ai_summary'
  >('overview');

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [careGaps, setCareGaps] = useState<CareGap[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [emergencyTokens, setEmergencyTokens] = useState<any[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<any[]>([]);
  const [emergencyProfile, setEmergencyProfile] = useState<any>(null);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<HealthSummaryResult | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Pharmacy Shopping state
  const pharmacyProducts = PharmacyService.getProducts();
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [orderPlacedMsg, setOrderPlacedMsg] = useState<string | null>(null);

  // Blood Request Form State
  const [bloodForm, setBloodForm] = useState({
    bloodGroup: 'O+' as any,
    unitsRequired: 2,
    hospitalName: 'St. David Medical Center',
    city: 'Austin',
    contactPhone: '+1 (555) 234-5678',
    urgency: 'urgent' as any,
  });
  const [bloodMsg, setBloodMsg] = useState<string | null>(null);

  // Add Family Member form state
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRel, setNewFamilyRel] = useState('Spouse');

  const refreshAllData = () => {
    if (!activePatient) return;
    setAppointments(AppointmentService.getAppointments(activePatient.id));
    setConsultations(AppDataStore.getConsultations().filter((c) => c.patientId === activePatient.id));
    setPrescriptions(AppDataStore.getPrescriptions().filter((p) => p.patientId === activePatient.id));
    setCareGaps(CareGapService.evaluateAndRefreshGaps(activePatient.id));
    setLabReports(AppDataStore.getLabReports().filter((l) => l.patientId === activePatient.id));
    setOrders(PharmacyService.getOrders(activePatient.id));
    setEmergencyTokens(EmergencyService.getActiveTokens(activePatient.id));
    setEmergencyLogs(EmergencyService.getAccessLogs(activePatient.id));
    setEmergencyProfile(EmergencyService.getEmergencyProfile(activePatient.id));
    setBloodRequests(BloodService.getBloodRequests());
    setFamilyMembers(AppDataStore.getFamilyMembers().filter((f) => f.primaryPatientId === activePatient.id));
  };

  useEffect(() => {
    refreshAllData();
  }, [activePatient.id]);

  // Load AI Health Summary
  const handleGenerateSummary = async () => {
    setIsGeneratingAi(true);
    const summary = await AiHealthSummaryService.generateSummary(activePatient.id);
    setAiSummary(summary);
    setIsGeneratingAi(false);
  };

  // Close Care Gap
  const handleResolveGap = (gapId: string) => {
    CareGapService.resolveCareGap(gapId);
    refreshAllData();
  };

  // Cancel Appointment
  const handleCancelAppointment = (id: string) => {
    AppointmentService.updateStatus(id, 'cancelled', 'Cancelled by patient');
    refreshAllData();
  };

  // Pharmacy Cart Functions
  const handleAddToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const handleCheckout = () => {
    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;

    const res = PharmacyService.createOrder({
      patientId: activePatient.id,
      items,
      deliveryAddress: '742 Evergreen Terrace, Suite 4B',
      deliveryCity: 'Austin',
      contactPhone: currentUser?.phone || '+1 (555) 234-5678',
    });

    if (res.success) {
      setOrderPlacedMsg(res.message);
      setCart({});
      refreshAllData();
      setTimeout(() => setOrderPlacedMsg(null), 4000);
    }
  };

  // Emergency Token Management
  const handleGenerateToken = () => {
    EmergencyService.generateToken(activePatient.id, 30);
    refreshAllData();
  };

  const handleRevokeToken = (tokenId: string) => {
    EmergencyService.revokeToken(tokenId);
    refreshAllData();
  };

  // Submit Blood Request
  const handleSubmitBloodRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const res = BloodService.createBloodRequest({
      requesterProfileId: currentUser?.id || 'p1000000-0000-0000-0000-000000000001',
      patientName: currentUser?.fullName || 'Eleanor Vance',
      bloodGroup: bloodForm.bloodGroup,
      unitsRequired: bloodForm.unitsRequired,
      hospitalName: bloodForm.hospitalName,
      city: bloodForm.city,
      contactPhone: bloodForm.contactPhone,
      urgency: bloodForm.urgency,
    });
    setBloodMsg(res.message);
    refreshAllData();
    setTimeout(() => setBloodMsg(null), 4000);
  };

  // Add Family Member
  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    const existing = AppDataStore.getFamilyMembers();
    AppDataStore.setFamilyMembers([
      {
        id: 'fam_' + Date.now(),
        primaryPatientId: activePatient.id,
        fullName: newFamilyName,
        relationship: newFamilyRel,
        authorizedForMedicalRecords: true,
        authorizedForEmergencyQR: true,
        createdAt: new Date().toISOString(),
      },
      ...existing,
    ]);
    setNewFamilyName('');
    refreshAllData();
  };

  const activeToken = emergencyTokens[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Patient 360 Top Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {currentUser?.fullName.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{currentUser?.fullName || 'Eleanor Vance'}</h1>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {activePatient.patientIdentifier}
                  </span>
                </div>
                {/* Unboxed Metadata with separators */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Blood: <strong className="text-slate-900">{activePatient.bloodGroup}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>DOB: 1962-04-18 (64y)</span>
                  <span aria-hidden="true">·</span>
                  <span>Allergies: <strong className="text-rose-700">{activePatient.allergies.join(', ') || 'None'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>

              <button
                onClick={() => {
                  if (activeToken) {
                    onOpenEmergencyParamedic(activeToken.tokenHash);
                  } else {
                    setActiveTab('emergency_qr');
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <QrCode className="w-4 h-4" />
                <span>Emergency QR</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Segmented Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-6 border-t border-slate-100 mt-6 scrollbar-none">
            {[
              { id: 'overview', label: 'Patient 360°' },
              { id: 'appointments', label: `Appointments (${appointments.length})` },
              { id: 'journey', label: 'Health Journey' },
              { id: 'care_gaps', label: `Care Gaps (${careGaps.filter((g) => !g.isClosed).length})` },
              { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
              { id: 'pharmacy', label: 'Pharmacy & Orders' },
              { id: 'emergency_qr', label: 'Emergency QR' },
              { id: 'blood_organ', label: 'Blood & Organ' },
              { id: 'family', label: `Family (${familyMembers.length})` },
              { id: 'ai_summary', label: 'AI Health Summary' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Viewports */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* 1. OVERVIEW & PATIENT 360° */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Next Appointment</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {appointments.find((a) => a.status === 'confirmed')?.appointmentDate || 'None Scheduled'}
                </div>
                <div className="text-[11px] text-teal-600 mt-0.5 truncate">
                  {appointments.find((a) => a.status === 'confirmed')?.doctorName || 'Schedule anytime'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Open Care Gaps</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
                  {careGaps.filter((g) => !g.isClosed).length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Surveillance Active</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Active Prescriptions</div>
                <div className="text-2xl font-extrabold text-teal-600 mt-1 tabular-nums">{prescriptions.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ready for 1-click refill</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Emergency QR Status</div>
                <div className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Token Active</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">30-day auto-rotate</div>
              </div>
            </div>

            {/* Two Column Layout: Care Gaps Spotlight & Clinical Vitals */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Care Gaps Priority Action Box */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-slate-900">Care Gaps Requiring Attention</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('care_gaps')}
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {careGaps
                    .filter((g) => !g.isClosed)
                    .map((gap) => (
                      <div
                        key={gap.id}
                        className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{gap.title}</div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{gap.description}</p>
                          <div className="text-[11px] text-amber-800 font-medium mt-1">
                            Due by: {gap.dueDate || 'Immediate'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleResolveGap(gap.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 whitespace-nowrap shrink-0 shadow-xs"
                        >
                          Mark Done
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Vitals & Clinical Base Card */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Clinical Baseline & Vitals</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Resting Blood Pressure</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {consultations[0]?.vitalsBp || '128/82 mmHg'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Heart Rate / Pulse</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {consultations[0]?.vitalsPulse || 74} bpm
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Oxygen Saturation (SpO2)</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {consultations[0]?.vitalsSpo2 || 99}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">Documented Chronic Conditions</span>
                    <span className="font-semibold text-slate-900">
                      {activePatient.chronicConditions.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('ai_summary');
                      handleGenerateSummary();
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Generate Complete Health Summary</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Appointment Management</h2>
                <p className="text-xs text-slate-500">Upcoming, past consultations, and real-time rescheduling.</p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Book New Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500">No appointments scheduled.</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : apt.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">· {apt.consultationType.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{apt.doctorName}</h3>
                      <p className="text-xs text-slate-600">{apt.chiefComplaint}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono pt-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{apt.appointmentDate}</span>
                        <span>·</span>
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{apt.startTime.slice(0, 5)} - {apt.endTime.slice(0, 5)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                        >
                          Cancel
                        </button>
                      )}
                      {apt.status === 'completed' && (
                        <button
                          onClick={() => setActiveTab('journey')}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                        >
                          View Notes
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. HEALTH JOURNEY TIMELINE */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Unified Health Journey</h2>
              <p className="text-xs text-slate-500">
                Complete chronological continuum of consultations, diagnoses, lab investigations, and prescription records.
              </p>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
              {/* Event 1: Recent Consultation */}
              {consultations.map((c) => (
                <div key={c.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Clinical Consultation</span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {new Date(c.consultationDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{c.diagnosis}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.clinicalNotes}</p>

                    <div className="p-3 rounded-xl bg-slate-50 text-xs border border-slate-100">
                      <div className="font-semibold text-slate-800">Doctor Advice:</div>
                      <div className="text-slate-600 mt-0.5">{c.doctorAdvice || 'Follow standard precautions.'}</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Attending: {c.doctorName} ({c.doctorSpecialty})</span>
                      {c.followUpRecommendedDate && (
                        <span className="font-medium text-teal-700">Follow-up due: {c.followUpRecommendedDate}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Event 2: Prescriptions */}
              {prescriptions.map((rx) => (
                <div key={rx.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Prescription Issued</span>
                      <span className="text-xs text-slate-400 tabular-nums">Code: {rx.prescriptionCode}</span>
                    </div>

                    <div className="space-y-2">
                      {rx.items.map((item) => (
                        <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{item.medicationName}</span>
                            <span className="text-slate-500 ml-1.5">{item.dosage} · {item.frequency}</span>
                          </div>
                          <span className="font-mono text-slate-600">{item.durationDays} days</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500">Valid until: {rx.validUntil}</span>
                      <button
                        onClick={() => setActiveTab('pharmacy')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order via Pharmacy</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Event 3: Lab Reports */}
              {labReports.map((lab) => (
                <div key={lab.id} className="relative group">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white" />
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Lab Investigation</span>
                      <span className="text-xs text-slate-400">{lab.requestedDate}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{lab.testName}</h3>
                    <p className="text-xs text-slate-600">
                      Status: <strong className="capitalize">{lab.status.replace('_', ' ')}</strong>
                      {lab.resultsSummary && ` · Results: ${lab.resultsSummary}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CARE GAPS TAB */}
        {activeTab === 'care_gaps' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Care Gap Surveillance Engine</h2>
              <p className="text-xs text-slate-500">
                Identifies pending diagnostic tests, overdue specialist follow-ups, and incomplete clinical care actions.
              </p>
            </div>

            <div className="space-y-3">
              {careGaps.map((gap) => (
                <div
                  key={gap.id}
                  className={`p-5 rounded-2xl bg-white border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    gap.isClosed ? 'opacity-60 border-slate-200' : 'border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          gap.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {gap.severity} Priority
                      </span>
                      {gap.isClosed ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Due: {gap.dueDate || 'Immediate'}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{gap.title}</h3>
                    <p className="text-xs text-slate-600">{gap.description}</p>
                  </div>

                  {!gap.isClosed && (
                    <button
                      onClick={() => handleResolveGap(gap.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shadow-xs"
                    >
                      Resolve Gap
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Authorized Prescriptions</h2>
              <p className="text-xs text-slate-500">Issued by verified attending clinicians with 1-click doorstep delivery.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-teal-700 font-bold">{rx.prescriptionCode}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">By {rx.doctorName}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Valid to: {rx.validUntil}</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {rx.items.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="font-bold text-slate-900">{item.medicationName} ({item.dosage})</div>
                        <div className="text-slate-600 mt-0.5">Frequency: {item.frequency} · {item.durationDays} days</div>
                        {item.instructions && (
                          <div className="text-slate-500 text-[11px] mt-1 italic">{item.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{rx.notes || 'Take as advised.'}</span>
                    <button
                      onClick={() => setActiveTab('pharmacy')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                    >
                      Order via Pharmacy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PHARMACY TAB */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Continuity Pharmacy</h2>
                <p className="text-xs text-slate-500">Order prescribed medications & health essentials directly to your doorstep.</p>
              </div>

              {Object.keys(cart).length > 0 && (
                <button
                  onClick={handleCheckout}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Checkout ({Object.values(cart).reduce((a, b) => a + b, 0)} items)</span>
                </button>
              )}
            </div>

            {orderPlacedMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orderPlacedMsg}</span>
              </div>
            )}

            {/* Medicine Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pharmacyProducts.map((prod) => (
                <div key={prod.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-teal-700 font-bold uppercase">{prod.category}</span>
                      <span className="font-extrabold text-slate-900 tabular-nums">${prod.price.toFixed(2)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{prod.name}</h3>
                    <p className="text-xs text-slate-500">{prod.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">Stock: {prod.stockQuantity}</span>
                    <button
                      onClick={() => handleAddToCart(prod.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors"
                    >
                      + Add to Cart {cart[prod.id] ? `(${cart[prod.id]})` : ''}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Past Orders Track Strip */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Your Medicine Orders</h3>
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Order #{ord.orderNumber} · ${ord.totalAmount.toFixed(2)}</div>
                      <div className="text-slate-500 mt-0.5">Tracking ID: <span className="font-mono text-teal-700">{ord.trackingNumber}</span></div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md font-bold uppercase text-[10px] bg-teal-100 text-teal-800">
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. EMERGENCY QR TAB */}
        {activeTab === 'emergency_qr' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Emergency Lifesaving QR & Access Tokens</h2>
              <p className="text-xs text-slate-500">
                Provide first responders immediate access to vital blood group, allergy, and contact information without exposing private history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* QR Display Card */}
              <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                <div className="w-56 h-56 mx-auto bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-white shadow-lg">
                  <QrCode className="w-32 h-32 text-white" />
                  <div className="text-[11px] font-mono mt-2 text-teal-300">
                    {activeToken?.tokenHash || 'cb_er_sample'}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">CareBridge Medical ID QR</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Auto-expires in 30 days. Can be revoked immediately.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => onOpenEmergencyParamedic(activeToken?.tokenHash || 'cb_er_9a87f12e3b44c')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Simulate Paramedic Scan</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateToken}
                      className="flex-1 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Rotate Token
                    </button>
                    {activeToken && (
                      <button
                        onClick={() => handleRevokeToken(activeToken.id)}
                        className="py-2 px-3 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Access Audit Logs */}
              <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Emergency Access Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Every scan and retrieval of your emergency data is immutably recorded.
                </p>

                <div className="space-y-3">
                  {emergencyLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No emergency access scans logged.</p>
                  ) : (
                    emergencyLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{log.locationEstimate || 'Emergency Unit'}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {new Date(log.accessedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-600 font-mono text-[11px]">IP: {log.accessorIp}</div>
                        <div className="text-[11px] text-slate-500 truncate">{log.userAgent}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. BLOOD & ORGAN DONATION TAB */}
        {activeTab === 'blood_organ' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Blood Help & Organ Donor Network</h2>
              <p className="text-xs text-slate-500">Broadcast urgent blood needs or register your organ pledge with CareBridge.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Blood Request Form */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Broadcast Urgent Blood Request</h3>

                {bloodMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium">
                    {bloodMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitBloodRequest} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Blood Group Needed</label>
                      <select
                        value={bloodForm.bloodGroup}
                        onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Units Required</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={bloodForm.unitsRequired}
                        onChange={(e) => setBloodForm({ ...bloodForm, unitsRequired: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hospital / Medical Center</label>
                    <input
                      type="text"
                      required
                      value={bloodForm.hospitalName}
                      onChange={(e) => setBloodForm({ ...bloodForm, hospitalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      required
                      value={bloodForm.city}
                      onChange={(e) => setBloodForm({ ...bloodForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
                  >
                    Broadcast to Verified Donors
                  </button>
                </form>
              </div>

              {/* Active Network Requests */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Your Active Blood Requests</h3>
                <div className="space-y-3">
                  {bloodRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-rose-700">{req.bloodGroup} · {req.unitsRequired} Units</span>
                        <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border">
                          {req.status}
                        </span>
                      </div>
                      <div className="text-slate-900 font-semibold">{req.hospitalName}, {req.city}</div>
                      {req.matchedDonorName && (
                        <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                          ✓ Matched with Donor: {req.matchedDonorName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. FAMILY HEALTH TAB */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Family Health & Authorized Care Sharing</h2>
              <p className="text-xs text-slate-500">
                Grant authorized access to designated family members for appointment coordination and emergency QR support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Member List */}
              <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Linked Family Members</h3>
                <div className="space-y-3">
                  {familyMembers.map((fam) => (
                    <div key={fam.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{fam.fullName}</div>
                        <div className="text-slate-500">{fam.relationship} · Blood: {fam.bloodGroup || 'O+'}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Authorized for Care
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Member Form */}
              <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Add Family Member</h3>
                <form onSubmit={handleAddFamilyMember} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      placeholder="e.g. Thomas Vance"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={newFamilyRel}
                      onChange={(e) => setNewFamilyRel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child / Daughter / Son</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Authorize Member
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 10. AI HEALTH SUMMARY TAB */}
        {activeTab === 'ai_summary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Clinical Health Summary</h2>
                <p className="text-xs text-slate-500">
                  Synthesized continuity digest generated strictly from authorized medical records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Synthesizing...' : 'Re-generate Summary'}</span>
                </button>

                {aiSummary && (
                  <button
                    onClick={() => speakText(aiSummary.summaryText)}
                    className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Read Aloud"
                  >
                    <Volume2 className="w-4 h-4 text-teal-600" />
                  </button>
                )}
              </div>
            </div>

            {aiSummary ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-teal-950 text-xs leading-relaxed space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-teal-800">
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesized Continuity Record Overview</span>
                  </div>
                  <p>{aiSummary.summaryText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Highlights</h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {aiSummary.keyHighlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Regimens</h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {aiSummary.activeMedications.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Pill className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                  {aiSummary.disclaimer}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Synthesize Health Continuity Digest</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button below to generate a consolidated overview of Eleanor Vance's vitals, consultations,
                  and open care gaps.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingSuccess={() => refreshAllData()}
      />
    </div>
  );
};
