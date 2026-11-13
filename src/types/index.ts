export type UserRole = 'patient' | 'doctor' | 'admin' | 'donor';

export type LanguageCode = 'en' | 'hi' | 'te';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  languagePreference: LanguageCode;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  profileId: string;
  patientIdentifier: string; // e.g. CB-PAT-2026-0042
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  primaryLanguage: string;
  heightCm?: number;
  weightKg?: number;
  profile?: UserProfile;
}

export interface Doctor {
  id: string;
  profileId: string;
  doctorIdentifier: string; // e.g. CB-DOC-001
  departmentId: string;
  departmentName?: string;
  specialty: string;
  medicalLicenseNumber: string;
  experienceYears: number;
  qualification: string;
  consultationFee: number;
  bio: string;
  isApprovedByAdmin: boolean;
  availableDays: string[];
  slotDurationMinutes: number;
  profile?: UserProfile;
}

export interface Donor {
  id: string;
  profileId: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  isAvailableForBlood: boolean;
  lastDonationDate?: string;
  organPledgeRegistered: boolean;
  organPledgeTypes: string[];
  city: string;
  pincode?: string;
  contactSharingConsent: boolean;
  totalDonations: number;
  profile?: UserProfile;
}

export interface FamilyMember {
  id: string;
  primaryPatientId: string;
  fullName: string;
  relationship: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  authorizedForMedicalRecords: boolean;
  authorizedForEmergencyQR: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  headOfDepartment: string;
  isActive: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export type ConsultationType = 'in_person' | 'teleconsult';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId?: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string;
  status: AppointmentStatus;
  chiefComplaint: string;
  consultationType: ConsultationType;
  cancellationReason?: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  consultationDate: string;
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
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  consultationId?: string;
  patientId: string;
  doctorId: string;
  prescriptionCode: string;
  validUntil: string;
  notes?: string;
  doctorName?: string;
  items: PrescriptionItem[];
  createdAt: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  testName: string;
  category: string;
  requestedDate: string;
  completedDate?: string;
  status: 'pending' | 'sample_collected' | 'completed' | 'cancelled';
  resultsSummary?: string;
  fileAttachmentUrl?: string;
  isNormal: boolean;
}

export interface CarePlan {
  id: string;
  patientId: string;
  doctorId?: string;
  title: string;
  goal: string;
  targetMetric?: string;
  targetDate?: string;
  status: 'active' | 'achieved' | 'paused' | 'discontinued';
}

export interface CareGap {
  id: string;
  patientId: string;
  category: 'overdue_follow_up' | 'pending_investigation' | 'unfilled_prescription' | 'incomplete_care_plan';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  isClosed: boolean;
  closedAt?: string;
  actionUrl?: string;
}

export interface EmergencyProfile {
  id: string;
  patientId: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactRelation: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  criticalNotes?: string;
  organDonorIndicator: boolean;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  patientName: string;
  patientIdentifier: string;
}

export interface EmergencyAccessToken {
  id: string;
  patientId: string;
  tokenHash: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  createdAt: string;
}

export interface EmergencyAccessLog {
  id: string;
  tokenId?: string;
  patientId: string;
  accessedAt: string;
  accessorIp?: string;
  userAgent?: string;
  locationEstimate?: string;
}

export interface BloodRequest {
  id: string;
  requesterProfileId: string;
  patientName: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  unitsRequired: number;
  hospitalName: string;
  city: string;
  contactPhone: string;
  urgency: 'normal' | 'urgent' | 'critical_stat';
  status: 'open' | 'matched' | 'fulfilled' | 'cancelled';
  matchedDonorId?: string;
  matchedDonorName?: string;
  createdAt: string;
}

export interface OrganRequest {
  id: string;
  patientId: string;
  patientName?: string;
  organType: string;
  medicalUrgencyScore: number;
  hospitalRegistered: string;
  status: 'registered_in_network' | 'reviewing_matches' | 'coordinated' | 'closed';
  createdAt: string;
}

export interface PharmacyProduct {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  dosageForm: string;
  strength: string;
  price: number;
  requiresPrescription: boolean;
  inStock: boolean;
  stockQuantity: number;
  manufacturer?: string;
  description?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface MedicineOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface MedicineOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  prescriptionId?: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity: string;
  contactPhone: string;
  status: OrderStatus;
  trackingNumber?: string;
  placedAt: string;
  items: MedicineOrderItem[];
}

export interface NotificationItem {
  id: string;
  recipientProfileId: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'care_gap' | 'blood_request' | 'pharmacy' | 'emergency' | 'system';
  actionPath?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorProfileId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'resolved';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  recordType: 'consultation_summary' | 'discharge_summary' | 'radiology_scan' | 'immunization' | 'pathology' | 'clinical_note' | 'other';
  title: string;
  description?: string;
  recordDate: string;
  fileAttachmentUrl?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  isConfidential: boolean;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId?: string;
  scheduledDueDate: string;
  reason: string;
  status: 'pending' | 'reminded' | 'completed' | 'cancelled' | 'overdue';
  completedAppointmentId?: string;
  notes?: string;
  createdAt: string;
}

export interface Consent {
  id: string;
  patientId: string;
  granteeType: 'doctor' | 'family_member' | 'hospital' | 'emergency_paramedic';
  granteeId?: string;
  scope: 'full_records' | 'prescriptions_only' | 'lab_reports_only' | 'emergency_triage_only';
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface BloodDonor {
  id: string;
  donorId: string;
  bloodGroup: string;
  rhFactor?: '+' | '-';
  hemoglobinLevel?: number;
  eligibilityStatus: 'eligible' | 'temporary_deferral' | 'deferred';
  nextEligibleDate?: string;
  preferredDonationCenter?: string;
  createdAt: string;
}

export interface OrganDonor {
  id: string;
  donorId: string;
  pledgeRegistrationNumber: string;
  authorizedOrgans: string[];
  emergencyDonorCardIssued: boolean;
  witnessName?: string;
  witnessContact?: string;
  legalConsentSignedAt: string;
  isActivePledge: boolean;
}

