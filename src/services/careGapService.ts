import { CareGap } from '../types';
import { AppDataStore } from './store';

export class CareGapService {
  static getCareGaps(patientId: string): CareGap[] {
    const gaps = AppDataStore.getCareGaps();
    return gaps.filter((g) => g.patientId === patientId);
  }

  /**
   * Care Gap Engine: Runs clinical rules against patient records
   * and updates the patient's care gap records.
   */
  static evaluateAndRefreshGaps(patientId: string): CareGap[] {
    const existingGaps = AppDataStore.getCareGaps();
    const otherPatientGaps = existingGaps.filter((g) => g.patientId !== patientId);
    let patientGaps = existingGaps.filter((g) => g.patientId === patientId);

    const consultations = AppDataStore.getConsultations().filter((c) => c.patientId === patientId);
    const appointments = AppDataStore.getAppointments().filter((a) => a.patientId === patientId);
    const labReports = AppDataStore.getLabReports().filter((r) => r.patientId === patientId);

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Check for overdue follow-ups
    consultations.forEach((c) => {
      if (c.followUpRecommendedDate && c.followUpRecommendedDate < todayStr) {
        // Check if an appointment was booked on or after follow-up date
        const hasFollowUpBooked = appointments.some(
          (a) => a.appointmentDate >= c.followUpRecommendedDate! && a.status !== 'cancelled'
        );

        const existingFollowUpGap = patientGaps.find(
          (g) => g.category === 'overdue_follow_up' && g.dueDate === c.followUpRecommendedDate
        );

        if (!hasFollowUpBooked && !existingFollowUpGap) {
          patientGaps.push({
            id: 'gap_fu_' + Date.now() + Math.random().toString(36).substring(7),
            patientId,
            category: 'overdue_follow_up',
            title: `Overdue Follow-up: ${c.doctorSpecialty || 'Specialist'} Consultation`,
            description: `Dr. ${c.doctorName || 'Physician'} recommended a follow-up around ${c.followUpRecommendedDate}. No subsequent visit detected.`,
            severity: 'high',
            dueDate: c.followUpRecommendedDate,
            isClosed: false,
            actionUrl: '/patient/appointments',
          });
        }
      }
    });

    // 2. Check for pending lab tests
    labReports.forEach((lab) => {
      if (lab.status === 'pending') {
        const existingLabGap = patientGaps.find(
          (g) => g.category === 'pending_investigation' && g.title.includes(lab.testName)
        );
        if (!existingLabGap) {
          patientGaps.push({
            id: 'gap_lab_' + Date.now() + Math.random().toString(36).substring(7),
            patientId,
            category: 'pending_investigation',
            title: `Pending Investigation: ${lab.testName}`,
            description: `Ordered on ${lab.requestedDate}. Sample submission or laboratory results report outstanding.`,
            severity: 'medium',
            dueDate: lab.requestedDate,
            isClosed: false,
            actionUrl: '/patient/medical-records',
          });
        }
      }
    });

    AppDataStore.setCareGaps([...otherPatientGaps, ...patientGaps]);
    return patientGaps;
  }

  static resolveCareGap(gapId: string): { success: boolean; message: string } {
    const list = AppDataStore.getCareGaps();
    const updated = list.map((g) => {
      if (g.id === gapId) {
        return {
          ...g,
          isClosed: true,
          closedAt: new Date().toISOString(),
        };
      }
      return g;
    });

    AppDataStore.setCareGaps(updated);
    return { success: true, message: 'Care gap marked as closed and resolved in patient health journey.' };
  }
}
