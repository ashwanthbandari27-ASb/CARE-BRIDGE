import { AppDataStore } from './store';
import { AuditLog, Doctor, ContactMessage, Department } from '../types';

export interface AdminAnalytics {
  totalPatients: number;
  totalDoctors: number;
  approvedDoctors: number;
  pendingDoctorApprovals: number;
  totalDonors: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalOrders: number;
  openBloodRequests: number;
  closedCareGaps: number;
  openCareGaps: number;
}

export class AdminService {
  static getAnalytics(): AdminAnalytics {
    const patients = AppDataStore.getPatients();
    const doctors = AppDataStore.getDoctors();
    const donors = AppDataStore.getDonors();
    const appointments = AppDataStore.getAppointments();
    const orders = AppDataStore.getOrders();
    const bloodRequests = AppDataStore.getBloodRequests();
    const careGaps = AppDataStore.getCareGaps();

    return {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      approvedDoctors: doctors.filter((d) => d.isApprovedByAdmin).length,
      pendingDoctorApprovals: doctors.filter((d) => !d.isApprovedByAdmin).length,
      totalDonors: donors.length,
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter((a) => a.status === 'pending').length,
      completedAppointments: appointments.filter((a) => a.status === 'completed').length,
      totalOrders: orders.length,
      openBloodRequests: bloodRequests.filter((r) => r.status === 'open').length,
      closedCareGaps: careGaps.filter((g) => g.isClosed).length,
      openCareGaps: careGaps.filter((g) => !g.isClosed).length,
    };
  }

  static approveDoctor(doctorId: string): { success: boolean; message: string } {
    const doctors = AppDataStore.getDoctors();
    const updated = doctors.map((d) => (d.id === doctorId ? { ...d, isApprovedByAdmin: true } : d));
    AppDataStore.setDoctors(updated);

    const doc = doctors.find((d) => d.id === doctorId);
    if (doc) {
      const notifs = AppDataStore.getNotifications();
      AppDataStore.setNotifications([
        {
          id: 'not_' + Date.now(),
          recipientProfileId: doc.profileId,
          title: 'Doctor Credentials Approved',
          message: 'Your medical license and CareBridge practice profile have been approved by the Administrator.',
          type: 'system',
          actionPath: '/doctor/dashboard',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...notifs,
      ]);
    }

    return { success: true, message: 'Doctor practice credentials approved.' };
  }

  static rejectDoctor(doctorId: string): { success: boolean; message: string } {
    const doctors = AppDataStore.getDoctors();
    const updated = doctors.filter((d) => d.id !== doctorId);
    AppDataStore.setDoctors(updated);
    return { success: true, message: 'Doctor registration rejected and removed.' };
  }

  static getAuditLogs(): AuditLog[] {
    const logs = AppDataStore.getAuditLogs();
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static getContactMessages(): ContactMessage[] {
    const list = AppDataStore.getContactMessages();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static markMessageResolved(msgId: string): void {
    const list = AppDataStore.getContactMessages();
    const updated = list.map((m) => (m.id === msgId ? { ...m, status: 'resolved' as const } : m));
    AppDataStore.setContactMessages(updated);
  }

  static addDepartment(dept: Omit<Department, 'id'>): Department {
    const depts = AppDataStore.getDepartments();
    const newDept: Department = {
      ...dept,
      id: 'd_' + Date.now(),
    };
    AppDataStore.setDepartments([...depts, newDept]);
    return newDept;
  }
}
