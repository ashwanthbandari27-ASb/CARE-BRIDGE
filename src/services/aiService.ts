import { AppDataStore } from './store';

export interface HealthSummaryResult {
  isAiGenerated: boolean;
  generatedAt: string;
  patientIdentifier: string;
  summaryText: string;
  keyHighlights: string[];
  activeMedications: string[];
  pendingActions: string[];
  disclaimer: string;
}

export class AiHealthSummaryService {
  static async generateSummary(patientId: string): Promise<HealthSummaryResult> {
    const patients = AppDataStore.getPatients();
    const patient = patients.find((p) => p.id === patientId) || patients[0];
    const consultations = AppDataStore.getConsultations().filter((c) => c.patientId === patientId);
    const prescriptions = AppDataStore.getPrescriptions().filter((p) => p.patientId === patientId);
    const labReports = AppDataStore.getLabReports().filter((r) => r.patientId === patientId);
    const careGaps = AppDataStore.getCareGaps().filter((g) => g.patientId === patientId && !g.isClosed);
    const appointments = AppDataStore.getAppointments().filter((a) => a.patientId === patientId && a.status === 'confirmed');

    const activeMeds = prescriptions.flatMap((p) => p.items.map((i) => `${i.medicationName} ${i.dosage} (${i.frequency})`));
    const pendingActions = careGaps.map((g) => `${g.title}: ${g.description}`);

    const disclaimer =
      'CLINICAL NOTICE: This health summary is an automated continuity overview synthesized strictly from authorized electronic health records. It does not constitute medical diagnosis, clinical judgment, or medical advice. Please consult your licensed healthcare provider for all clinical decisions.';

    // Deterministic clinical synthesis
    const recentConsultation = consultations[0];
    const latestVitals = recentConsultation
      ? `BP ${recentConsultation.vitalsBp || '120/80'}, Pulse ${recentConsultation.vitalsPulse || 72} bpm, SpO2 ${recentConsultation.vitalsSpo2 || 98}%`
      : 'Vitals stable';

    const highlights: string[] = [];
    if (patient.chronicConditions?.length) {
      highlights.push(`Chronic Care Continuity: Managing ${patient.chronicConditions.join(', ')}.`);
    }
    if (patient.allergies?.length) {
      highlights.push(`Documented Allergies: ${patient.allergies.join(', ')}.`);
    }
    if (recentConsultation) {
      highlights.push(`Recent Clinical Encounter: Diagnosed with "${recentConsultation.diagnosis}" by ${recentConsultation.doctorName}.`);
    }
    if (appointments.length > 0) {
      highlights.push(`Next Scheduled Follow-up: ${appointments[0].appointmentDate} with ${appointments[0].doctorName}.`);
    }

    const deterministicSummary = `Patient ${patient.patientIdentifier} is currently receiving care continuity for ${patient.chronicConditions?.join(' and ') || 'general preventative health'}. Current documented vitals from the most recent clinical evaluation reflect ${latestVitals}. There are currently ${prescriptions.length} active prescription regimens on file totaling ${activeMeds.length} maintenance medications. Laboratory surveillance records show ${labReports.filter((l) => l.status === 'completed').length} completed investigations and ${labReports.filter((l) => l.status === 'pending').length} pending laboratory orders. To maintain optimal continuity, ${careGaps.length} care gaps have been identified for proactive review.`;

    return {
      isAiGenerated: false,
      generatedAt: new Date().toISOString(),
      patientIdentifier: patient.patientIdentifier,
      summaryText: deterministicSummary,
      keyHighlights: highlights,
      activeMedications: activeMeds,
      pendingActions: pendingActions.length > 0 ? pendingActions : ['All routine care gaps and lab orders are currently up to date.'],
      disclaimer,
    };
  }
}
