import {
  UserProfile,
  Patient,
  Doctor,
  Donor,
  Department,
  Appointment,
  Consultation,
  Prescription,
  LabReport,
  CarePlan,
  CareGap,
  EmergencyProfile,
  EmergencyAccessToken,
  EmergencyAccessLog,
  BloodRequest,
  PharmacyProduct,
  MedicineOrder,
  NotificationItem,
  AuditLog,
  ContactMessage,
  FamilyMember,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_DONORS,
  INITIAL_DEPARTMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_REPORTS,
  INITIAL_CARE_PLANS,
  INITIAL_CARE_GAPS,
  INITIAL_EMERGENCY_PROFILE,
  INITIAL_EMERGENCY_TOKENS,
  INITIAL_EMERGENCY_LOGS,
  INITIAL_BLOOD_REQUESTS,
  INITIAL_PHARMACY_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONTACT_MESSAGES,
  INITIAL_FAMILY_MEMBERS,
} from './mockData';
import { realtimeBus } from '../lib/supabase';

const STORAGE_PREFIX = 'carebridge_db_';

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err);
  }
  return defaultValue;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist ${key}:`, err);
  }
}

export class AppDataStore {
  // Profiles & Users
  static getProfiles(): UserProfile[] {
    return getStored('profiles', INITIAL_PROFILES);
  }
  static setProfiles(val: UserProfile[]) {
    setStored('profiles', val);
    realtimeBus.emit('profiles_updated', val);
  }

  // Patients
  static getPatients(): Patient[] {
    return getStored('patients', INITIAL_PATIENTS);
  }
  static setPatients(val: Patient[]) {
    setStored('patients', val);
    realtimeBus.emit('patients_updated', val);
  }

  // Doctors
  static getDoctors(): Doctor[] {
    return getStored('doctors', INITIAL_DOCTORS);
  }
  static setDoctors(val: Doctor[]) {
    setStored('doctors', val);
    realtimeBus.emit('doctors_updated', val);
  }

  // Donors
  static getDonors(): Donor[] {
    return getStored('donors', INITIAL_DONORS);
  }
  static setDonors(val: Donor[]) {
    setStored('donors', val);
    realtimeBus.emit('donors_updated', val);
  }

  // Family Members
  static getFamilyMembers(): FamilyMember[] {
    return getStored('family_members', INITIAL_FAMILY_MEMBERS);
  }
  static setFamilyMembers(val: FamilyMember[]) {
    setStored('family_members', val);
    realtimeBus.emit('family_members_updated', val);
  }

  // Departments
  static getDepartments(): Department[] {
    return getStored('departments', INITIAL_DEPARTMENTS);
  }
  static setDepartments(val: Department[]) {
    setStored('departments', val);
  }

  // Appointments
  static getAppointments(): Appointment[] {
    return getStored('appointments', INITIAL_APPOINTMENTS);
  }
  static setAppointments(val: Appointment[]) {
    setStored('appointments', val);
    realtimeBus.emit('appointments_updated', val);
  }

  // Consultations
  static getConsultations(): Consultation[] {
    return getStored('consultations', INITIAL_CONSULTATIONS);
  }
  static setConsultations(val: Consultation[]) {
    setStored('consultations', val);
    realtimeBus.emit('consultations_updated', val);
  }

  // Prescriptions
  static getPrescriptions(): Prescription[] {
    return getStored('prescriptions', INITIAL_PRESCRIPTIONS);
  }
  static setPrescriptions(val: Prescription[]) {
    setStored('prescriptions', val);
    realtimeBus.emit('prescriptions_updated', val);
  }

  // Lab Reports
  static getLabReports(): LabReport[] {
    return getStored('lab_reports', INITIAL_LAB_REPORTS);
  }
  static setLabReports(val: LabReport[]) {
    setStored('lab_reports', val);
    realtimeBus.emit('lab_reports_updated', val);
  }

  // Care Plans
  static getCarePlans(): CarePlan[] {
    return getStored('care_plans', INITIAL_CARE_PLANS);
  }
  static setCarePlans(val: CarePlan[]) {
    setStored('care_plans', val);
    realtimeBus.emit('care_plans_updated', val);
  }

  // Care Gaps
  static getCareGaps(): CareGap[] {
    return getStored('care_gaps', INITIAL_CARE_GAPS);
  }
  static setCareGaps(val: CareGap[]) {
    setStored('care_gaps', val);
    realtimeBus.emit('care_gaps_updated', val);
  }

  // Emergency Profile
  static getEmergencyProfile(): EmergencyProfile {
    return getStored('emergency_profile', INITIAL_EMERGENCY_PROFILE);
  }
  static setEmergencyProfile(val: EmergencyProfile) {
    setStored('emergency_profile', val);
    realtimeBus.emit('emergency_profile_updated', val);
  }

  // Emergency Access Tokens
  static getEmergencyTokens(): EmergencyAccessToken[] {
    return getStored('emergency_tokens', INITIAL_EMERGENCY_TOKENS);
  }
  static setEmergencyTokens(val: EmergencyAccessToken[]) {
    setStored('emergency_tokens', val);
    realtimeBus.emit('emergency_tokens_updated', val);
  }

  // Emergency Access Logs
  static getEmergencyLogs(): EmergencyAccessLog[] {
    return getStored('emergency_logs', INITIAL_EMERGENCY_LOGS);
  }
  static setEmergencyLogs(val: EmergencyAccessLog[]) {
    setStored('emergency_logs', val);
    realtimeBus.emit('emergency_logs_updated', val);
  }

  // Blood Requests
  static getBloodRequests(): BloodRequest[] {
    return getStored('blood_requests', INITIAL_BLOOD_REQUESTS);
  }
  static setBloodRequests(val: BloodRequest[]) {
    setStored('blood_requests', val);
    realtimeBus.emit('blood_requests_updated', val);
  }

  // Pharmacy Products
  static getPharmacyProducts(): PharmacyProduct[] {
    return getStored('pharmacy_products', INITIAL_PHARMACY_PRODUCTS);
  }
  static setPharmacyProducts(val: PharmacyProduct[]) {
    setStored('pharmacy_products', val);
    realtimeBus.emit('pharmacy_products_updated', val);
  }

  // Medicine Orders
  static getOrders(): MedicineOrder[] {
    return getStored('orders', INITIAL_ORDERS);
  }
  static setOrders(val: MedicineOrder[]) {
    setStored('orders', val);
    realtimeBus.emit('orders_updated', val);
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    return getStored('notifications', INITIAL_NOTIFICATIONS);
  }
  static setNotifications(val: NotificationItem[]) {
    setStored('notifications', val);
    realtimeBus.emit('notifications_updated', val);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored('audit_logs', INITIAL_AUDIT_LOGS);
  }
  static setAuditLogs(val: AuditLog[]) {
    setStored('audit_logs', val);
    realtimeBus.emit('audit_logs_updated', val);
  }

  // Contact Messages
  static getContactMessages(): ContactMessage[] {
    return getStored('contact_messages', INITIAL_CONTACT_MESSAGES);
  }
  static setContactMessages(val: ContactMessage[]) {
    setStored('contact_messages', val);
    realtimeBus.emit('contact_messages_updated', val);
  }

  // Reset to default sample clinical data
  static resetToDefaults() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  }
}
