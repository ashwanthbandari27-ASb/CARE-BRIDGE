import React, { useState } from 'react';
import { X, Calendar, Clock, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Doctor } from '../types';
import { AppDataStore } from '../services/store';
import { AppointmentService } from '../services/appointmentService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctor?: Doctor | null;
  onBookingSuccess?: () => void;
}

const TIME_SLOTS = [
  '09:00:00',
  '09:30:00',
  '10:00:00',
  '10:30:00',
  '11:00:00',
  '11:30:00',
  '14:00:00',
  '14:30:00',
  '15:00:00',
  '15:30:00',
  '16:00:00',
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctor,
  onBookingSuccess,
}) => {
  const doctors = AppDataStore.getDoctors().filter((d) => d.isApprovedByAdmin);
  const patients = AppDataStore.getPatients();
  const defaultPatient = patients[0];

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    preselectedDoctor?.id || doctors[0]?.id || ''
  );

  // Default to tomorrow
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState<string>(tomorrow);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00:00');
  const [consultationType, setConsultationType] = useState<'in_person' | 'teleconsult'>('in_person');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [patientName, setPatientName] = useState<string>(defaultPatient?.profile?.fullName || 'Eleanor Vance');
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeDoc = doctors.find((d) => d.id === selectedDoctorId) || preselectedDoctor || doctors[0];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      setBookingResult({ success: false, message: 'Please provide a brief reason or chief complaint.' });
      return;
    }

    setIsSubmitting(true);
    setBookingResult(null);

    // Compute slot end time (30 min duration)
    const [h, m] = selectedSlot.split(':').map(Number);
    const endMinutes = m + 30;
    const endH = endMinutes >= 60 ? h + 1 : h;
    const endM = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    const result = AppointmentService.bookAppointment({
      patientId: defaultPatient?.id || 'pat00000-0000-0000-0000-000000000001',
      doctorId: activeDoc.id,
      departmentId: activeDoc.departmentId,
      appointmentDate,
      startTime: selectedSlot,
      endTime,
      chiefComplaint,
      consultationType,
      patientName,
    });

    setBookingResult(result);
    setIsSubmitting(false);

    if (result.success) {
      setTimeout(() => {
        if (onBookingSuccess) onBookingSuccess();
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div>
            <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
              CareBridge Clinical Scheduling
            </div>
            <h3 className="text-lg font-bold mt-0.5">Book Doctor Consultation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleBook} className="p-6 space-y-5">
          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Physician
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.profile?.fullName || doc.specialty} — {doc.specialty} (${doc.consultationFee.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Format
              </label>
              <select
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="in_person">In-Person Clinic Visit</option>
                <option value="teleconsult">Secure Telehealth Video</option>
              </select>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Available 30-Minute Slots
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center tabular-nums ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {slot.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Details & Chief Complaint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Chief Complaint / Reason for Visit
            </label>
            <textarea
              rows={3}
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Follow-up on hypertension medication, persistent headache, joint ache..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Status feedback */}
          {bookingResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                bookingResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {bookingResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{bookingResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
            >
              {isSubmitting ? 'Verifying Availability...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
