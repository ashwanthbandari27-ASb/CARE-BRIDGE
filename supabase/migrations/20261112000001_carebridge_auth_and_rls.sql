-- ==============================================================================
-- CAREBRIDGE SUPABASE AUTH INTEGRATION & ROW LEVEL SECURITY (RLS) POLICIES
-- Project: CareBridge
-- Version: 20261112000001
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Get active user's internal profile ID
CREATE OR REPLACE FUNCTION public.get_auth_profile_id()
RETURNS UUID AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Get active user's system role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Check if active user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Check if active user is a verified doctor
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.doctors d ON d.profile_id = p.id
        WHERE p.auth_user_id = auth.uid() 
          AND p.role = 'doctor' 
          AND d.is_approved_by_admin = TRUE
          AND p.is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Check if current authenticated doctor is assigned to / treating the specified patient
CREATE OR REPLACE FUNCTION public.is_treating_doctor(p_patient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_doctor_id UUID;
BEGIN
    SELECT d.id INTO v_doctor_id
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.profile_id
    WHERE p.auth_user_id = auth.uid() LIMIT 1;

    IF v_doctor_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if doctor has an appointment, consultation, follow-up, or active consent
    RETURN EXISTS (
        SELECT 1 FROM public.appointments
        WHERE doctor_id = v_doctor_id AND patient_id = p_patient_id
    ) OR EXISTS (
        SELECT 1 FROM public.consultations
        WHERE doctor_id = v_doctor_id AND patient_id = p_patient_id
    ) OR EXISTS (
        SELECT 1 FROM public.consents
        WHERE patient_id = p_patient_id 
          AND grantee_id = v_doctor_id 
          AND is_active = TRUE 
          AND (valid_until IS NULL OR valid_until > NOW())
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 2. SUPABASE AUTH USER CREATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(20);
    v_full_name VARCHAR(255);
    v_profile_id UUID;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    -- Security rule: New users cannot self-assign the 'admin' role through signup metadata
    IF v_role NOT IN ('patient', 'doctor', 'donor') THEN
        v_role := 'patient';
    END IF;

    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        auth_user_id,
        email,
        full_name,
        role,
        is_verified,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_role,
        (v_role <> 'doctor'), -- Doctors require admin approval
        TRUE
    ) RETURNING id INTO v_profile_id;

    -- Auto-provision role-specific table
    IF v_role = 'patient' THEN
        INSERT INTO public.patients (
            profile_id,
            patient_identifier,
            blood_group
        ) VALUES (
            v_profile_id,
            'CB-PAT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
            COALESCE(NEW.raw_user_meta_data->>'blood_group', 'O+')
        );
    ELSIF v_role = 'doctor' THEN
        INSERT INTO public.doctors (
            profile_id,
            doctor_identifier,
            specialty,
            medical_license_number,
            qualification,
            is_approved_by_admin
        ) VALUES (
            v_profile_id,
            'CB-DOC-' || lpad(floor(random() * 1000)::text, 3, '0'),
            COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Physician'),
            COALESCE(NEW.raw_user_meta_data->>'medical_license_number', 'PENDING-' || floor(random() * 90000)::text),
            COALESCE(NEW.raw_user_meta_data->>'qualification', 'MD / MBBS'),
            FALSE
        );
    ELSIF v_role = 'donor' THEN
        INSERT INTO public.donors (
            profile_id,
            blood_group,
            city,
            is_available_for_blood
        ) VALUES (
            v_profile_id,
            COALESCE(NEW.raw_user_meta_data->>'blood_group', 'O+'),
            COALESCE(NEW.raw_user_meta_data->>'city', 'Austin'),
            TRUE
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users (if running inside Supabase database environment)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. ANTI-PRIVILEGE ESCALATION TRIGGER (PROFILES)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only an existing administrator can change roles or grant doctor verification
    IF (NEW.role <> OLD.role OR NEW.is_verified <> OLD.is_verified) THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Only an administrator may change roles or approve verification status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
BEFORE UPDATE OF role, is_verified ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- ------------------------------------------------------------------------------
-- 4. ENABLE RLS ON ALL 29 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organ_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organ_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. COMPREHENSIVE RLS POLICIES
-- ------------------------------------------------------------------------------

-- --- DEPARTMENTS ---
DROP POLICY IF EXISTS "Public can view active departments" ON public.departments;
CREATE POLICY "Public can view active departments" ON public.departments
FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
CREATE POLICY "Admins manage departments" ON public.departments
FOR ALL USING (public.is_admin());

-- --- PROFILES ---
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = auth_user_id 
    OR role = 'doctor' 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
FOR UPDATE USING (auth.uid() = auth_user_id OR public.is_admin());

-- --- PATIENTS ---
DROP POLICY IF EXISTS "Patients view own profile" ON public.patients;
CREATE POLICY "Patients view own profile" ON public.patients
FOR SELECT USING (
    profile_id = public.get_auth_profile_id()
    OR public.is_treating_doctor(id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Patients insert policy" ON public.patients;
CREATE POLICY "Patients insert policy" ON public.patients
FOR INSERT WITH CHECK (
    profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Patients update own demographics" ON public.patients;
CREATE POLICY "Patients update own demographics" ON public.patients
FOR UPDATE USING (
    profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

-- --- DOCTORS ---
DROP POLICY IF EXISTS "Doctors view policy" ON public.doctors;
CREATE POLICY "Doctors view policy" ON public.doctors
FOR SELECT USING (
    is_approved_by_admin = TRUE 
    OR profile_id = public.get_auth_profile_id() 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Doctors insert policy" ON public.doctors;
CREATE POLICY "Doctors insert policy" ON public.doctors
FOR INSERT WITH CHECK (
    profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Doctors update profile" ON public.doctors;
CREATE POLICY "Doctors update profile" ON public.doctors
FOR UPDATE USING (
    profile_id = public.get_auth_profile_id() 
    OR public.is_admin()
);

-- --- DONORS & SUB-REGISTRIES ---
DROP POLICY IF EXISTS "Donors view policy" ON public.donors;
CREATE POLICY "Donors view policy" ON public.donors
FOR SELECT USING (
    profile_id = public.get_auth_profile_id()
    OR (is_available_for_blood = TRUE AND contact_sharing_consent = TRUE)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Donors insert policy" ON public.donors;
CREATE POLICY "Donors insert policy" ON public.donors
FOR INSERT WITH CHECK (
    profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Donors manage own status" ON public.donors;
CREATE POLICY "Donors manage own status" ON public.donors
FOR UPDATE USING (
    profile_id = public.get_auth_profile_id() 
    OR public.is_admin()
);

-- Blood Donors
DROP POLICY IF EXISTS "Blood donors view policy" ON public.blood_donors;
CREATE POLICY "Blood donors view policy" ON public.blood_donors
FOR SELECT USING (
    donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Blood donors manage policy" ON public.blood_donors;
CREATE POLICY "Blood donors manage policy" ON public.blood_donors
FOR ALL USING (
    donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- Organ Donors
DROP POLICY IF EXISTS "Organ donors view policy" ON public.organ_donors;
CREATE POLICY "Organ donors view policy" ON public.organ_donors
FOR SELECT USING (
    donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Organ donors manage policy" ON public.organ_donors;
CREATE POLICY "Organ donors manage policy" ON public.organ_donors
FOR ALL USING (
    donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- --- FAMILY MEMBERS ---
DROP POLICY IF EXISTS "Family members select policy" ON public.family_members;
CREATE POLICY "Family members select policy" ON public.family_members
FOR SELECT USING (
    primary_patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR member_profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Family members manage policy" ON public.family_members;
CREATE POLICY "Family members manage policy" ON public.family_members
FOR ALL USING (
    primary_patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- --- APPOINTMENTS ---
DROP POLICY IF EXISTS "Appointments select policy" ON public.appointments;
CREATE POLICY "Appointments select policy" ON public.appointments
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Appointments insert policy" ON public.appointments;
CREATE POLICY "Appointments insert policy" ON public.appointments
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Appointments update policy" ON public.appointments;
CREATE POLICY "Appointments update policy" ON public.appointments
FOR UPDATE USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- --- CONSULTATIONS ---
DROP POLICY IF EXISTS "Consultations select policy" ON public.consultations;
CREATE POLICY "Consultations select policy" ON public.consultations
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Consultations insert policy" ON public.consultations;
CREATE POLICY "Consultations insert policy" ON public.consultations
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- --- PRESCRIPTIONS & ITEMS ---
DROP POLICY IF EXISTS "Prescriptions select policy" ON public.prescriptions;
CREATE POLICY "Prescriptions select policy" ON public.prescriptions
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Prescriptions insert policy" ON public.prescriptions;
CREATE POLICY "Prescriptions insert policy" ON public.prescriptions
FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Prescription items select policy" ON public.prescription_items;
CREATE POLICY "Prescription items select policy" ON public.prescription_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_id
          AND (
              p.patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
              OR p.doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
              OR public.is_admin()
          )
    )
);

DROP POLICY IF EXISTS "Prescription items insert policy" ON public.prescription_items;
CREATE POLICY "Prescription items insert policy" ON public.prescription_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_id
          AND (
              p.doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
              OR public.is_admin()
          )
    )
);

-- --- MEDICAL RECORDS ---
DROP POLICY IF EXISTS "Medical records select policy" ON public.medical_records;
CREATE POLICY "Medical records select policy" ON public.medical_records
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR (public.is_treating_doctor(patient_id) AND is_confidential = FALSE)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Medical records insert policy" ON public.medical_records;
CREATE POLICY "Medical records insert policy" ON public.medical_records
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

-- --- LAB REPORTS ---
DROP POLICY IF EXISTS "Lab reports select policy" ON public.lab_reports;
CREATE POLICY "Lab reports select policy" ON public.lab_reports
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Lab reports insert policy" ON public.lab_reports;
CREATE POLICY "Lab reports insert policy" ON public.lab_reports
FOR INSERT WITH CHECK (
    public.is_doctor()
    OR public.is_admin()
);

-- --- CARE PLANS ---
DROP POLICY IF EXISTS "Care plans select policy" ON public.care_plans;
CREATE POLICY "Care plans select policy" ON public.care_plans
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Care plans manage policy" ON public.care_plans;
CREATE POLICY "Care plans manage policy" ON public.care_plans
FOR ALL USING (
    public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

-- --- CARE GAPS ---
DROP POLICY IF EXISTS "Care gaps select policy" ON public.care_gaps;
CREATE POLICY "Care gaps select policy" ON public.care_gaps
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Care gaps update policy" ON public.care_gaps;
CREATE POLICY "Care gaps update policy" ON public.care_gaps
FOR UPDATE USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

-- --- FOLLOW UPS ---
DROP POLICY IF EXISTS "Follow ups select policy" ON public.follow_ups;
CREATE POLICY "Follow ups select policy" ON public.follow_ups
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_treating_doctor(patient_id)
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Follow ups manage policy" ON public.follow_ups;
CREATE POLICY "Follow ups manage policy" ON public.follow_ups
FOR ALL USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- --- EMERGENCY PROFILES, TOKENS & LOGS ---
DROP POLICY IF EXISTS "Emergency profile select policy" ON public.emergency_profiles;
CREATE POLICY "Emergency profile select policy" ON public.emergency_profiles
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Emergency profile manage policy" ON public.emergency_profiles;
CREATE POLICY "Emergency profile manage policy" ON public.emergency_profiles
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Emergency tokens manage policy" ON public.emergency_access_tokens;
CREATE POLICY "Emergency tokens manage policy" ON public.emergency_access_tokens
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Emergency access logs select policy" ON public.emergency_access_logs;
CREATE POLICY "Emergency access logs select policy" ON public.emergency_access_logs
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Emergency access logs insert policy" ON public.emergency_access_logs;
CREATE POLICY "Emergency access logs insert policy" ON public.emergency_access_logs
FOR INSERT WITH CHECK (TRUE);

-- --- BLOOD REQUESTS & ORGAN REQUESTS ---
DROP POLICY IF EXISTS "Blood requests select policy" ON public.blood_requests;
CREATE POLICY "Blood requests select policy" ON public.blood_requests
FOR SELECT USING (
    status = 'open'
    OR requester_profile_id = public.get_auth_profile_id()
    OR matched_donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Blood requests insert policy" ON public.blood_requests;
CREATE POLICY "Blood requests insert policy" ON public.blood_requests
FOR INSERT WITH CHECK (
    requester_profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Blood requests update policy" ON public.blood_requests;
CREATE POLICY "Blood requests update policy" ON public.blood_requests
FOR UPDATE USING (
    requester_profile_id = public.get_auth_profile_id()
    OR matched_donor_id IN (SELECT id FROM public.donors WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

-- Organ Requests
DROP POLICY IF EXISTS "Organ requests select policy" ON public.organ_requests;
CREATE POLICY "Organ requests select policy" ON public.organ_requests
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Organ requests manage policy" ON public.organ_requests;
CREATE POLICY "Organ requests manage policy" ON public.organ_requests
FOR ALL USING (
    public.is_admin()
);

-- --- PHARMACY PRODUCTS & ORDERS ---
DROP POLICY IF EXISTS "Pharmacy products view policy" ON public.pharmacy_products;
CREATE POLICY "Pharmacy products view policy" ON public.pharmacy_products
FOR SELECT USING (in_stock = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Pharmacy products admin manage" ON public.pharmacy_products;
CREATE POLICY "Pharmacy products admin manage" ON public.pharmacy_products
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Medicine orders select policy" ON public.medicine_orders;
CREATE POLICY "Medicine orders select policy" ON public.medicine_orders
FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Medicine orders insert policy" ON public.medicine_orders;
CREATE POLICY "Medicine orders insert policy" ON public.medicine_orders
FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Medicine order items select policy" ON public.medicine_order_items;
CREATE POLICY "Medicine order items select policy" ON public.medicine_order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.medicine_orders o
        WHERE o.id = order_id
          AND (
              o.patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
              OR public.is_admin()
          )
    )
);

DROP POLICY IF EXISTS "Medicine order items insert policy" ON public.medicine_order_items;
CREATE POLICY "Medicine order items insert policy" ON public.medicine_order_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.medicine_orders o
        WHERE o.id = order_id
          AND (
              o.patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
              OR public.is_admin()
          )
    )
);

-- --- NOTIFICATIONS ---
DROP POLICY IF EXISTS "Notifications recipient policy" ON public.notifications;
CREATE POLICY "Notifications recipient policy" ON public.notifications
FOR ALL USING (
    recipient_profile_id = public.get_auth_profile_id()
    OR public.is_admin()
);

-- --- CONSENTS ---
DROP POLICY IF EXISTS "Consents manage policy" ON public.consents;
CREATE POLICY "Consents manage policy" ON public.consents
FOR ALL USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id = public.get_auth_profile_id())
    OR grantee_id = public.get_auth_profile_id()
    OR public.is_admin()
);

-- --- AUDIT LOGS ---
DROP POLICY IF EXISTS "Audit logs admin view" ON public.audit_logs;
CREATE POLICY "Audit logs admin view" ON public.audit_logs
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Audit logs insert" ON public.audit_logs;
CREATE POLICY "Audit logs insert" ON public.audit_logs
FOR INSERT WITH CHECK (TRUE);

-- --- CONTACT MESSAGES ---
DROP POLICY IF EXISTS "Contact messages public insert" ON public.contact_messages;
CREATE POLICY "Contact messages public insert" ON public.contact_messages
FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Contact messages admin manage" ON public.contact_messages;
CREATE POLICY "Contact messages admin manage" ON public.contact_messages
FOR SELECT USING (public.is_admin());
