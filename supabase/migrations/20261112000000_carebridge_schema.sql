-- ==============================================================================
-- CAREBRIDGE HEALTHCARE PLATFORM SCHEMA MIGRATION (PHASE 2)
-- Project: CareBridge
-- Tagline: Connect care. Close gaps. Support better journeys.
-- PostgreSQL & Supabase Database Migration
-- Version: 20261112000000
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. DEPARTMENTS & CLINICAL SPECIALTIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Activity',
    head_of_department VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES & AUTHENTICATION ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- references auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'donor')),
    phone VARCHAR(30),
    avatar_url TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'te')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- ------------------------------------------------------------------------------
-- 3. PATIENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    patient_identifier VARCHAR(50) NOT NULL UNIQUE, -- e.g. CB-PAT-2026-0042
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    primary_language VARCHAR(20) DEFAULT 'English',
    height_cm NUMERIC(5, 2),
    weight_kg NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_profile ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_blood ON patients(blood_group);

-- ------------------------------------------------------------------------------
-- 4. DOCTORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_identifier VARCHAR(50) NOT NULL UNIQUE, -- e.g. CB-DOC-2026-001
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    specialty VARCHAR(150) NOT NULL,
    medical_license_number VARCHAR(100) NOT NULL UNIQUE,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    qualification VARCHAR(200) NOT NULL,
    consultation_fee NUMERIC(10, 2) DEFAULT 50.00 CHECK (consultation_fee >= 0),
    bio TEXT,
    is_approved_by_admin BOOLEAN DEFAULT FALSE,
    available_days TEXT[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday"}',
    slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_profile ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_dept ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_approval ON doctors(is_approved_by_admin);

-- ------------------------------------------------------------------------------
-- 5. DONORS & SPECIALIZED DONATION REGISTRIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    is_available_for_blood BOOLEAN DEFAULT TRUE,
    last_donation_date DATE,
    organ_pledge_registered BOOLEAN DEFAULT FALSE,
    organ_pledge_types TEXT[] DEFAULT '{}',
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    contact_sharing_consent BOOLEAN DEFAULT FALSE,
    total_donations INTEGER DEFAULT 0 CHECK (total_donations >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_blood ON donors(blood_group, is_available_for_blood);
CREATE INDEX IF NOT EXISTS idx_donors_city ON donors(city);

-- Specialized Blood Donor Registry
CREATE TABLE IF NOT EXISTS blood_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    rh_factor VARCHAR(5) CHECK (rh_factor IN ('+', '-')),
    hemoglobin_level NUMERIC(4, 1),
    eligibility_status VARCHAR(30) DEFAULT 'eligible' CHECK (eligibility_status IN ('eligible', 'temporary_deferral', 'deferred')),
    next_eligible_date DATE,
    preferred_donation_center VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialized Organ Donor Registry
CREATE TABLE IF NOT EXISTS organ_donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL UNIQUE REFERENCES donors(id) ON DELETE CASCADE,
    pledge_registration_number VARCHAR(100) NOT NULL UNIQUE,
    authorized_organs TEXT[] NOT NULL DEFAULT '{}',
    emergency_donor_card_issued BOOLEAN DEFAULT TRUE,
    witness_name VARCHAR(150),
    witness_contact VARCHAR(50),
    legal_consent_signed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active_pledge BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------------------------
-- 6. FAMILY MEMBERS & HEALTH DELEGATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    member_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    blood_group VARCHAR(10),
    authorized_for_medical_records BOOLEAN DEFAULT FALSE,
    authorized_for_emergency_qr BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_patient ON family_members(primary_patient_id);

-- ------------------------------------------------------------------------------
-- 7. APPOINTMENTS (WITH DOUBLE-BOOKING PREVENTION TRIGGER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
    chief_complaint TEXT NOT NULL,
    consultation_type VARCHAR(20) DEFAULT 'in_person' CHECK (consultation_type IN ('in_person', 'teleconsult')),
    cancellation_reason TEXT,
    rescheduled_from_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_appointment_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Double-Booking Prevention Trigger Function
CREATE OR REPLACE FUNCTION prevent_doctor_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('pending', 'confirmed') THEN
        IF EXISTS (
            SELECT 1 FROM appointments
            WHERE doctor_id = NEW.doctor_id
              AND appointment_date = NEW.appointment_date
              AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
              AND status IN ('pending', 'confirmed')
              AND (
                  (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
                  (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
                  (NEW.start_time <= start_time AND NEW.end_time >= end_time)
              )
        ) THEN
            RAISE EXCEPTION 'Doctor is already booked for timeslot % - % on %', NEW.start_time, NEW.end_time, NEW.appointment_date;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_doctor_double_booking ON appointments;
CREATE TRIGGER trg_prevent_doctor_double_booking
BEFORE INSERT OR UPDATE OF doctor_id, appointment_date, start_time, end_time, status
ON appointments
FOR EACH ROW
EXECUTE FUNCTION prevent_doctor_double_booking();

-- ------------------------------------------------------------------------------
-- 8. CONSULTATIONS & CLINICAL ENCOUNTERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultation_date TIMESTAMPTZ DEFAULT NOW(),
    vitals_bp VARCHAR(20),
    vitals_pulse INTEGER CHECK (vitals_pulse > 0 AND vitals_pulse < 300),
    vitals_temperature_f NUMERIC(4, 1) CHECK (vitals_temperature_f > 70 AND vitals_temperature_f < 115),
    vitals_spo2 INTEGER CHECK (vitals_spo2 >= 0 AND vitals_spo2 <= 100),
    clinical_notes TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    doctor_advice TEXT,
    follow_up_recommended_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);

-- ------------------------------------------------------------------------------
-- 9. PRESCRIPTIONS & MEDICINE ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    prescription_code VARCHAR(50) NOT NULL UNIQUE,
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- e.g. '5mg'
    frequency VARCHAR(100) NOT NULL, -- e.g. 'Once daily in morning'
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_items_rx ON prescription_items(prescription_id);

-- ------------------------------------------------------------------------------
-- 10. MEDICAL RECORDS (EHR DOCUMENTS & CLINICAL ATTACHMENTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('consultation_summary', 'discharge_summary', 'radiology_scan', 'immunization', 'pathology', 'clinical_note', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    file_attachment_url TEXT,
    file_mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id, record_date);

-- ------------------------------------------------------------------------------
-- 11. LAB REPORTS & INVESTIGATION REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General Lab',
    requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sample_collected', 'completed', 'cancelled')),
    results_summary TEXT,
    file_attachment_url TEXT,
    is_normal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id, status);

-- ------------------------------------------------------------------------------
-- 12. CARE PLANS & CARE GAP ENGINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    goal TEXT NOT NULL,
    target_metric VARCHAR(150),
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused', 'discontinued')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('overdue_follow_up', 'pending_investigation', 'unfilled_prescription', 'incomplete_care_plan')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMPTZ,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_gaps_patient ON care_gaps(patient_id, is_closed);

-- ------------------------------------------------------------------------------
-- 13. DEDICATED FOLLOW-UPS TRACKING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    scheduled_due_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'completed', 'cancelled', 'overdue')),
    completed_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON follow_ups(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_ups(scheduled_due_date, status);

-- ------------------------------------------------------------------------------
-- 14. EMERGENCY PROFILE & SECURE TEMPORARY ACCESS TOKENS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    primary_contact_name VARCHAR(150) NOT NULL,
    primary_contact_phone VARCHAR(50) NOT NULL,
    primary_contact_relation VARCHAR(50) NOT NULL,
    secondary_contact_name VARCHAR(150),
    secondary_contact_phone VARCHAR(50),
    critical_notes TEXT,
    organ_donor_indicator BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    token_hash VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_tokens_hash ON emergency_access_tokens(token_hash, is_revoked, expires_at);

CREATE TABLE IF NOT EXISTS emergency_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES emergency_access_tokens(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    accessor_ip VARCHAR(50),
    user_agent TEXT,
    location_estimate VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_emergency_logs_patient ON emergency_access_logs(patient_id);

-- ------------------------------------------------------------------------------
-- 15. BLOOD & ORGAN COORDINATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_profile_id UUID NOT NULL REFERENCES profiles(id),
    patient_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    units_required INTEGER DEFAULT 1 CHECK (units_required > 0),
    hospital_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'urgent' CHECK (urgency IN ('normal', 'urgent', 'critical_stat')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled')),
    matched_donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_requests_search ON blood_requests(blood_group, city, status);

CREATE TABLE IF NOT EXISTS organ_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organ_type VARCHAR(100) NOT NULL, -- e.g. Kidney, Cornea, Liver
    medical_urgency_score INTEGER DEFAULT 50 CHECK (medical_urgency_score >= 0 AND medical_urgency_score <= 100),
    hospital_registered VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'registered_in_network' 
        CHECK (status IN ('registered_in_network', 'reviewing_matches', 'coordinated', 'closed')),
    matched_donor_id UUID REFERENCES donors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. CONTINUITY PHARMACY CATALOG & MEDICINE ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL, -- Tablet, Syrup, Injection, Capsule
    strength VARCHAR(50) NOT NULL, -- e.g. 500mg, 10ml
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    requires_prescription BOOLEAN DEFAULT TRUE,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 100 CHECK (stock_quantity >= 0),
    manufacturer VARCHAR(200),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_category ON pharmacy_products(category, in_stock);

CREATE TABLE IF NOT EXISTS medicine_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled')),
    tracking_number VARCHAR(100),
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES medicine_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES pharmacy_products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_patient ON medicine_orders(patient_id, status);

-- ------------------------------------------------------------------------------
-- 17. PATIENT CONSENTS & HEALTH DATA SHARING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    grantee_type VARCHAR(20) NOT NULL CHECK (grantee_type IN ('doctor', 'family_member', 'hospital', 'emergency_paramedic')),
    grantee_id UUID, -- references doctor.id, profile.id, or family_member.id
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('full_records', 'prescriptions_only', 'lab_reports_only', 'emergency_triage_only')),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_lookup ON consents(patient_id, grantee_id, is_active);

-- ------------------------------------------------------------------------------
-- 18. NOTIFICATIONS, AUDIT LOGS, AND CONTACT MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system' CHECK (type IN ('appointment', 'prescription', 'care_gap', 'blood_request', 'pharmacy', 'emergency', 'system')),
    action_path TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_profile_id, is_read);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_profile_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
