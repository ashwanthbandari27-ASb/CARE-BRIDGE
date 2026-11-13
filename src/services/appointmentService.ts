import { Appointment, AppointmentStatus, ConsultationType } from '../types';
import { AppDataStore } from './store';
import { realtimeBus } from '../lib/supabase';

export class AppointmentService {
  static getAppointments(patientId?: string, doctorId?: string): Appointment[] {
    let list = AppDataStore.getAppointments();
    if (patientId) {
      list = list.filter((a) => a.patientId === patientId);
    }
    if (doctorId) {
      list = list.filter((a) => a.doctorId === doctorId);
    }
    return list.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  /**
   * Book appointment with transactional double-booking prevention.
   * Matches the PostgreSQL database trigger logic:
   * Checks whether the doctor is already booked on the target date within the slot.
   */
  static bookAppointment(data: {
    patientId: string;
    doctorId: string;
    departmentId?: string;
    appointmentDate: string;
    startTime: string; // HH:mm:ss
    endTime: string; // HH:mm:ss
    chiefComplaint: string;
    consultationType: ConsultationType;
    patientName?: string;
  }): { success: boolean; message: string; appointment?: Appointment } {
    const appointments = AppDataStore.getAppointments();
    const doctors = AppDataStore.getDoctors();
    const targetDoctor = doctors.find((d) => d.id === data.doctorId);

    // Double Booking Prevention
    const isDoubleBooked = appointments.some((apt) => {
      if (apt.doctorId !== data.doctorId) return false;
      if (apt.appointmentDate !== data.appointmentDate) return false;
      if (apt.status === 'cancelled' || apt.status === 'rejected') return false;

      // Slot overlap check
      const startOverlap = data.startTime >= apt.startTime && data.startTime < apt.endTime;
      const endOverlap = data.endTime > apt.startTime && data.endTime <= apt.endTime;
      const enclosing = data.startTime <= apt.startTime && data.endTime >= apt.endTime;

      return startOverlap || endOverlap || enclosing;
    });

    if (isDoubleBooked) {
      return {
        success: false,
        message: `Conflict: ${targetDoctor?.profile?.fullName || 'The doctor'} is already booked for ${data.startTime.slice(0, 5)} on ${data.appointmentDate}. Please choose another time slot.`,
      };
    }

    const newAppointment: Appointment = {
      id: 'apt_' + Date.now(),
      patientId: data.patientId,
      doctorId: data.doctorId,
      departmentId: data.departmentId || targetDoctor?.departmentId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'confirmed',
      chiefComplaint: data.chiefComplaint,
      consultationType: data.consultationType,
      patientName: data.patientName || 'Eleanor Vance',
      doctorName: targetDoctor?.profile?.fullName || targetDoctor?.specialty || 'Staff Physician',
      doctorSpecialty: targetDoctor?.specialty || 'General Care',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAppointment, ...appointments];
    AppDataStore.setAppointments(updated);

    // Trigger Notification for Doctor
    const notifications = AppDataStore.getNotifications();
    const docProfileId = targetDoctor?.profileId || 'p2000000-0000-0000-0000-000000000002';
    AppDataStore.setNotifications([
      {
        id: 'not_' + Date.now(),
        recipientProfileId: docProfileId,
        title: 'New Confirmed Appointment',
        message: `${newAppointment.patientName} booked a consultation for ${newAppointment.appointmentDate} at ${newAppointment.startTime.slice(0, 5)}.`,
        type: 'appointment',
        actionPath: '/doctor/appointments',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...notifications,
    ]);

    // Record in Audit Log
    const auditLogs = AppDataStore.getAuditLogs();
    AppDataStore.setAuditLogs([
      {
        id: 'aud_' + Date.now(),
        actorName: newAppointment.patientName,
        action: 'APPOINTMENT_BOOKED',
        entityType: 'appointment',
        entityId: newAppointment.id,
        details: { doctor: newAppointment.doctorName, date: newAppointment.appointmentDate, slot: newAppointment.startTime },
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ]);

    return {
      success: true,
      message: 'Appointment successfully confirmed! Added to your CareBridge Health Journey.',
      appointment: newAppointment,
    };
  }

  static updateStatus(
    appointmentId: string,
    status: AppointmentStatus,
    reason?: string
  ): { success: boolean; message: string } {
    const list = AppDataStore.getAppointments();
    const index = list.findIndex((a) => a.id === appointmentId);
    if (index === -1) return { success: false, message: 'Appointment not found.' };

    const updatedList = [...list];
    updatedList[index] = {
      ...updatedList[index],
      status,
      cancellationReason: reason,
    };

    AppDataStore.setAppointments(updatedList);
    return { success: true, message: `Appointment marked as ${status}.` };
  }
}
