import { Consultation, Prescription, PrescriptionItem, LabReport, CarePlan } from '../types';
import { AppDataStore } from './store';
import { AppointmentService } from './appointmentService';

export class ConsultationService {
  static getConsultations(patientId?: string, doctorId?: string): Consultation[] {
    let list = AppDataStore.getConsultations();
    if (patientId) list = list.filter((c) => c.patientId === patientId);
    if (doctorId) list = list.filter((c) => c.doctorId === doctorId);
    return list.sort((a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime());
  }

  static createConsultation(data: {
    appointmentId?: string;
    patientId: string;
    doctorId: string;
    vitalsBp?: string;
    vitalsPulse?: number;
    vitalsTemperatureF?: number;
    vitalsSpo2?: number;
    clinicalNotes: string;
    diagnosis: string;
    doctorAdvice?: string;
    followUpRecommendedDate?: string;
    doctorName?: string;
    doctorSpecialty?: string;
  }): Consultation {
    const consultations = AppDataStore.getConsultations();
    const newConsultation: Consultation = {
      id: 'cns_' + Date.now(),
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      consultationDate: new Date().toISOString(),
      vitalsBp: data.vitalsBp,
      vitalsPulse: data.vitalsPulse,
      vitalsTemperatureF: data.vitalsTemperatureF,
      vitalsSpo2: data.vitalsSpo2,
      clinicalNotes: data.clinicalNotes,
      diagnosis: data.diagnosis,
      doctorAdvice: data.doctorAdvice,
      followUpRecommendedDate: data.followUpRecommendedDate,
      doctorName: data.doctorName || 'Attending Physician',
      doctorSpecialty: data.doctorSpecialty || 'Specialist',
    };

    AppDataStore.setConsultations([newConsultation, ...consultations]);

    // If linked to an appointment, mark appointment completed
    if (data.appointmentId) {
      AppointmentService.updateStatus(data.appointmentId, 'completed');
    }

    // Trigger Notification for Patient
    const patients = AppDataStore.getPatients();
    const patientObj = patients.find((p) => p.id === data.patientId);
    if (patientObj) {
      const notifications = AppDataStore.getNotifications();
      AppDataStore.setNotifications([
        {
          id: 'not_' + Date.now(),
          recipientProfileId: patientObj.profileId,
          title: 'Consultation Summary Available',
          message: `${data.doctorName || 'Your doctor'} recorded clinical notes and diagnosis: "${data.diagnosis}".`,
          type: 'appointment',
          actionPath: '/patient/health-journey',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...notifications,
      ]);
    }

    return newConsultation;
  }

  // Prescriptions
  static getPrescriptions(patientId?: string): Prescription[] {
    let list = AppDataStore.getPrescriptions();
    if (patientId) list = list.filter((p) => p.patientId === patientId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createPrescription(data: {
    consultationId?: string;
    patientId: string;
    doctorId: string;
    doctorName?: string;
    notes?: string;
    validDays?: number;
    items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[];
  }): Prescription {
    const prescriptions = AppDataStore.getPrescriptions();
    const rxId = 'rx_' + Date.now();
    const validUntilDate = new Date(Date.now() + (data.validDays || 30) * 86400000)
      .toISOString()
      .split('T')[0];

    const rxItems: PrescriptionItem[] = data.items.map((item, idx) => ({
      ...item,
      id: `rxi_${Date.now()}_${idx}`,
      prescriptionId: rxId,
    }));

    const newRx: Prescription = {
      id: rxId,
      consultationId: data.consultationId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      prescriptionCode: `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      validUntil: validUntilDate,
      notes: data.notes,
      doctorName: data.doctorName || 'Dr. David Chen, MD',
      items: rxItems,
      createdAt: new Date().toISOString(),
    };

    AppDataStore.setPrescriptions([newRx, ...prescriptions]);

    // Notify patient
    const patients = AppDataStore.getPatients();
    const patientObj = patients.find((p) => p.id === data.patientId);
    if (patientObj) {
      const notifs = AppDataStore.getNotifications();
      AppDataStore.setNotifications([
        {
          id: 'not_' + Date.now(),
          recipientProfileId: patientObj.profileId,
          title: 'New Prescription Issued',
          message: `${newRx.doctorName} prescribed ${rxItems.length} medication(s). Available for 1-click pharmacy order.`,
          type: 'prescription',
          actionPath: '/patient/prescriptions',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...notifs,
      ]);
    }

    // Audit log
    const auditLogs = AppDataStore.getAuditLogs();
    AppDataStore.setAuditLogs([
      {
        id: 'aud_' + Date.now(),
        actorName: newRx.doctorName,
        action: 'PRESCRIPTION_CREATED',
        entityType: 'prescription',
        entityId: newRx.id,
        details: { code: newRx.prescriptionCode, itemsCount: rxItems.length },
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ]);

    return newRx;
  }

  // Lab Reports / Investigations
  static getLabReports(patientId?: string): LabReport[] {
    let list = AppDataStore.getLabReports();
    if (patientId) list = list.filter((r) => r.patientId === patientId);
    return list.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  }

  static requestLabTest(data: {
    patientId: string;
    doctorId?: string;
    doctorName?: string;
    testName: string;
    category?: string;
  }): LabReport {
    const list = AppDataStore.getLabReports();
    const newReport: LabReport = {
      id: 'lab_' + Date.now(),
      patientId: data.patientId,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      testName: data.testName,
      category: data.category || 'Clinical Investigation',
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      isNormal: true,
    };

    AppDataStore.setLabReports([newReport, ...list]);

    // Also register an open Care Gap for pending investigation!
    const gaps = AppDataStore.getCareGaps();
    AppDataStore.setCareGaps([
      {
        id: 'gap_' + Date.now(),
        patientId: data.patientId,
        category: 'pending_investigation',
        title: `Pending Lab: ${data.testName}`,
        description: `Ordered by ${data.doctorName || 'Physician'}. Requires sample collection and biochemical analysis.`,
        severity: 'medium',
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        isClosed: false,
        actionUrl: '/patient/medical-records',
      },
      ...gaps,
    ]);

    return newReport;
  }

  static completeLabReport(id: string, resultsSummary: string, isNormal: boolean): void {
    const list = AppDataStore.getLabReports();
    const updated = list.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status: 'completed' as const,
          completedDate: new Date().toISOString().split('T')[0],
          resultsSummary,
          isNormal,
        };
      }
      return r;
    });
    AppDataStore.setLabReports(updated);
  }
}
