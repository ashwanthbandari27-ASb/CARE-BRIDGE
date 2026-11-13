import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Pill,
  Activity,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { AppDataStore } from '../services/store';
import { AppointmentService } from '../services/appointmentService';
import { ConsultationService } from '../services/consultationService';
import { Appointment, Doctor, Patient, Consultation, PrescriptionItem } from '../types';

export const DoctorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const doctors = AppDataStore.getDoctors();
  const patients = AppDataStore.getPatients();

  // Find active doctor
  const activeDoctor: Doctor =
    doctors.find((d) => d.profileId === currentUser?.id) || doctors[0];

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Consultation Note Form
  const [vitalsBp, setVitalsBp] = useState('120/80');
  const [vitalsPulse, setVitalsPulse] = useState(72);
  const [vitalsSpo2, setVitalsSpo2] = useState(99);
  const [vitalsTemp, setVitalsTemp] = useState(98.6);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescriptions Creator in Consultation
  const [rxItems, setRxItems] = useState<Omit<PrescriptionItem, 'id' | 'prescriptionId'>[]>([
    {
      medicationName: 'Amlodipine Besylate',
      dosage: '5mg',
      frequency: 'Once daily in morning',
      durationDays: 30,
      instructions: 'Take with full glass of water after breakfast',
    },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('10mg');
  const [newMedFreq, setNewMedFreq] = useState('Once daily');
  const [newMedDays, setNewMedDays] = useState(14);
  const [newMedInst, setNewMedInst] = useState('');

  // Lab Test Request Form
  const [labTestName, setLabTestName] = useState('');
  const [labTestCategory, setLabTestCategory] = useState('Biochemistry');

  const [consultationSaved, setConsultationSaved] = useState(false);

  const refreshAppointments = () => {
    if (activeDoctor) {
      setAppointments(AppointmentService.getAppointments(undefined, activeDoctor.id));
    }
  };

  useEffect(() => {
    refreshAppointments();
  }, [activeDoctor.id]);

  const handleConfirmAppointment = (id: string) => {
    AppointmentService.updateStatus(id, 'confirmed');
    refreshAppointments();
  };

  const handleStartConsultation = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setClinicalNotes(`Patient presenting with: ${apt.chiefComplaint}`);
    setDiagnosis('');
    setDoctorAdvice('');
    setFollowUpDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setConsultationSaved(false);
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setRxItems((prev) => [
      ...prev,
      {
        medicationName: newMedName,
        dosage: newMedDosage,
        frequency: newMedFreq,
        durationDays: newMedDays,
        instructions: newMedInst,
      },
    ]);
    setNewMedName('');
    setNewMedInst('');
  };

  const handleRemoveMedication = (index: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !diagnosis.trim() || !clinicalNotes.trim()) return;

    // 1. Create Consultation
    const cns = ConsultationService.createConsultation({
      appointmentId: selectedAppointment.id,
      patientId: selectedAppointment.patientId,
      doctorId: activeDoctor.id,
      vitalsBp,
      vitalsPulse,
      vitalsSpo2,
      vitalsTemperatureF: vitalsTemp,
      clinicalNotes,
      diagnosis,
      doctorAdvice,
      followUpRecommendedDate: followUpDate || undefined,
      doctorName: currentUser?.fullName || activeDoctor.specialty,
      doctorSpecialty: activeDoctor.specialty,
    });

    // 2. Create Prescription if medications added
    if (rxItems.length > 0) {
      ConsultationService.createPrescription({
        consultationId: cns.id,
        patientId: selectedAppointment.patientId,
        doctorId: activeDoctor.id,
        doctorName: currentUser?.fullName || activeDoctor.specialty,
        notes: doctorAdvice,
        items: rxItems,
      });
    }

    // 3. Issue Lab test if specified
    if (labTestName.trim()) {
      ConsultationService.requestLabTest({
        patientId: selectedAppointment.patientId,
        doctorId: activeDoctor.id,
        doctorName: currentUser?.fullName || activeDoctor.specialty,
        testName: labTestName,
        category: labTestCategory,
      });
      setLabTestName('');
    }

    setConsultationSaved(true);
    refreshAppointments();
    setTimeout(() => {
      setSelectedAppointment(null);
      setConsultationSaved(false);
    }, 2000);
  };

  // Filter appointments by patient search
  const filteredAppointments = appointments.filter((apt) =>
    apt.patientName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    apt.chiefComplaint.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Doctor Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-slate-100">
                <img
                  src={
                    activeDoctor.specialty.includes('Cardio')
                      ? '/src/assets/images/carebridge_doctor_male_1794497405619.jpg'
                      : '/src/assets/images/carebridge_doctor_female_1794497406552.jpg'
                  }
                  alt={currentUser?.fullName || activeDoctor.specialty}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{currentUser?.fullName || 'Dr. David Chen, MD'}</h1>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                    {activeDoctor.doctorIdentifier}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Specialty: <strong className="text-slate-900">{activeDoctor.specialty}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>License: <strong className="font-mono text-slate-800">{activeDoctor.medicalLicenseNumber}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Fee: <strong className="text-slate-900">${activeDoctor.consultationFee.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Practice License Verified</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Assigned Consultations</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{appointments.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Under Continuity Care</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Confirmed / Today</div>
            <div className="text-2xl font-black text-blue-600 mt-1 tabular-nums">
              {appointments.filter((a) => a.status === 'confirmed').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ready for Consultation</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Completed Encounters</div>
            <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Notes Recorded</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Double-Booking Check</div>
            <div className="text-xs font-bold text-teal-700 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conflict Guard Active</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">PostgreSQL Trigger</div>
          </div>
        </div>

        {/* Main Section: Appointment Schedule & Patient Care */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scheduled Appointments */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Patient Appointments</h2>
                <p className="text-xs text-slate-500">Select an encounter to open clinical consultation notes.</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient name or chief complaint..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No appointments found matching filter.</div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => handleStartConsultation(apt)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                      selectedAppointment?.id === apt.id
                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          apt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{apt.chiefComplaint}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                      <span>{apt.appointmentDate}</span>
                      <span>{apt.startTime.slice(0, 5)} - {apt.endTime.slice(0, 5)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Consultation Room & Clinical Notes */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {selectedAppointment ? (
              <form onSubmit={handleSaveConsultation} className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Clinical Encounter</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedAppointment.patientName}</h3>
                    <p className="text-xs text-slate-500">Chief Complaint: {selectedAppointment.chiefComplaint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {consultationSaved && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Clinical consultation notes, prescription, and care plan recorded successfully!</span>
                  </div>
                )}

                {/* Vitals Input Row */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Encounter Vitals
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500">BP (mmHg)</span>
                      <input
                        type="text"
                        value={vitalsBp}
                        onChange={(e) => setVitalsBp(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Pulse (bpm)</span>
                      <input
                        type="number"
                        value={vitalsPulse}
                        onChange={(e) => setVitalsPulse(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">SpO2 (%)</span>
                      <input
                        type="number"
                        value={vitalsSpo2}
                        onChange={(e) => setVitalsSpo2(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Temp (°F)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={vitalsTemp}
                        onChange={(e) => setVitalsTemp(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Clinical Examination */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Essential hypertension stage 1, mild migraine variant"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical Examination & Observations
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Document subjective presentation, physical findings, and assessment..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor Advice & Care Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={doctorAdvice}
                    onChange={(e) => setDoctorAdvice(e.target.value)}
                    placeholder="Dietary guidance, fluid intake, physical activity limits..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {/* Prescription Creator */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span>Prescribe Medications</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{rxItems.length} items</span>
                  </div>

                  <div className="space-y-2">
                    {rxItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{item.medicationName}</span>
                          <span className="text-slate-500 ml-1.5">{item.dosage} · {item.frequency} ({item.durationDays}d)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Line Item */}
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="text"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      placeholder="Medication name..."
                      className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="Dosage (500mg)"
                      className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Request Laboratory Investigation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Order Lab Investigation (Optional)
                    </label>
                    <input
                      type="text"
                      value={labTestName}
                      onChange={(e) => setLabTestName(e.target.value)}
                      placeholder="e.g. Fasting Lipid Profile, HbA1c, Serum Creatinine"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recommended Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Consultation & Issue Rx</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Consultation Examination Room</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select an encounter from the left list to record vitals, clinical observations, diagnoses, and issue
                  official prescriptions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
