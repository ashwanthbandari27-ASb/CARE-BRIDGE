-- ==============================================================================
-- CAREBRIDGE HEALTHCARE PLATFORM SEED DATA (PHASE 2)
-- Fictional, HIPAA-compliant demo clinical records
-- ==============================================================================

-- 1. Medical Departments
INSERT INTO departments (id, name, code, description, icon, head_of_department) VALUES
('d1111111-1111-1111-1111-111111111111', 'Cardiology & Heart Center', 'CARD', 'Comprehensive cardiac care, echocardiography, hypertension and coronary continuity care.', 'Heart', 'Dr. David Chen, MD, FACC'),
('d2222222-2222-2222-2222-222222222222', 'Neurology & Brain Sciences', 'NEUR', 'Advanced diagnostic neurology, neurodegenerative care and specialized headache clinic.', 'Brain', 'Dr. Sarah Jenkins, MD'),
('d3333333-3333-3333-3333-333333333333', 'Orthopedics & Joint Clinic', 'ORTH', 'Sports medicine, arthroscopic surgery and spine continuity programs.', 'Bone', 'Dr. Marcus Vance, MS'),
('d4444444-4444-4444-4444-444444444444', 'Pediatrics & Child Wellness', 'PED', 'Newborn care, developmental tracking and pediatric preventative programs.', 'Baby', 'Dr. Priya Sharma, MD'),
('d5555555-5555-5555-5555-555555555555', 'Internal Medicine & Endocrinology', 'INTMED', 'Diabetes management, metabolic continuity and chronic disease coordination.', 'Activity', 'Dr. Robert Rivera, MD')
ON CONFLICT (id) DO NOTHING;

-- 2. User Profiles (Patient, Doctors, Admin, Donor)
INSERT INTO profiles (id, email, full_name, role, phone, city, state, is_verified, is_active) VALUES
('p1000000-0000-0000-0000-000000000001', 'patient@carebridge.org', 'Eleanor Vance', 'patient', '+1 (555) 234-5678', 'Austin', 'Texas', TRUE, TRUE),
('p2000000-0000-0000-0000-000000000002', 'doctor.chen@carebridge.org', 'Dr. David Chen, MD', 'doctor', '+1 (555) 345-6789', 'Austin', 'Texas', TRUE, TRUE),
('p2000000-0000-0000-0000-000000000003', 'doctor.jenkins@carebridge.org', 'Dr. Sarah Jenkins, MD', 'doctor', '+1 (555) 456-7890', 'Austin', 'Texas', TRUE, TRUE),
('p3000000-0000-0000-0000-000000000004', 'admin@carebridge.org', 'CareBridge System Admin', 'admin', '+1 (555) 888-0000', 'Austin', 'Texas', TRUE, TRUE),
('p4000000-0000-0000-0000-000000000005', 'donor@carebridge.org', 'Liam Gallagher', 'donor', '+1 (555) 678-9012', 'Austin', 'Texas', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Patient Details (Eleanor Vance)
INSERT INTO patients (id, profile_id, patient_identifier, date_of_birth, gender, blood_group, allergies, chronic_conditions, height_cm, weight_kg) VALUES
('pat00000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'CB-PAT-2026-0042', '1962-04-18', 'female', 'O+', ARRAY['Penicillin', 'Sulfa drugs'], ARRAY['Hypertension', 'Mild Osteoarthritis'], 164.5, 68.2)
ON CONFLICT (id) DO NOTHING;

-- 4. Doctor Details
INSERT INTO doctors (id, profile_id, doctor_identifier, department_id, specialty, medical_license_number, experience_years, qualification, consultation_fee, bio, is_approved_by_admin) VALUES
('doc00000-0000-0000-0000-000000000001', 'p2000000-0000-0000-0000-000000000002', 'CB-DOC-001', 'd1111111-1111-1111-1111-111111111111', 'Cardiologist', 'TX-MED-44921', 16, 'MD, FACC - Johns Hopkins Medicine', 120.00, 'Specializing in preventative cardiology, hypertension and post-infarct care continuity.', TRUE),
('doc00000-0000-0000-0000-000000000002', 'p2000000-0000-0000-0000-000000000003', 'CB-DOC-002', 'd2222222-2222-2222-2222-222222222222', 'Neurologist', 'TX-MED-88190', 14, 'MD - Stanford Health Care', 140.00, 'Expertise in neurodegenerative conditions, migraines, cognitive continuity and stroke recovery.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Donor Details & Specific Registries
INSERT INTO donors (id, profile_id, blood_group, is_available_for_blood, last_donation_date, organ_pledge_registered, organ_pledge_types, city, pincode, contact_sharing_consent, total_donations) VALUES
('don00000-0000-0000-0000-000000000001', 'p4000000-0000-0000-0000-000000000005', 'O+', TRUE, '2026-08-15', TRUE, ARRAY['Cornea', 'Kidney', 'Bone Marrow'], 'Austin', '78701', TRUE, 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO blood_donors (id, donor_id, blood_group, rh_factor, hemoglobin_level, eligibility_status, next_eligible_date, preferred_donation_center) VALUES
('bd000000-0000-0000-0000-000000000001', 'don00000-0000-0000-0000-000000000001', 'O+', '+', 14.8, 'eligible', CURRENT_DATE, 'Central Texas Regional Blood Center')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organ_donors (id, donor_id, pledge_registration_number, authorized_organs, emergency_donor_card_issued, witness_name, witness_contact) VALUES
('od000000-0000-0000-0000-000000000001', 'don00000-0000-0000-0000-000000000001', 'TX-OD-2026-9921', ARRAY['Cornea', 'Kidney', 'Bone Marrow'], TRUE, 'Clara Gallagher', '+1 (555) 678-9999')
ON CONFLICT (id) DO NOTHING;

-- 6. Family Members
INSERT INTO family_members (id, primary_patient_id, full_name, relationship, date_of_birth, blood_group, authorized_for_medical_records, authorized_for_emergency_qr) VALUES
('fam00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'Thomas Vance', 'Spouse', '1960-08-11', 'A+', TRUE, TRUE),
('fam00000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'Clara Vance', 'Daughter', '1992-05-22', 'O+', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Appointments
INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, status, chief_complaint, consultation_type) VALUES
('apt00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '3 days', '10:00:00', '10:30:00', 'confirmed', 'Follow-up on blood pressure regulation and morning dizziness with postural shift', 'in_person'),
('apt00000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000002', 'd2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '14 days', '14:00:00', '14:30:00', 'completed', 'Episodic tension headache and sleep disruption with neck stiffness', 'in_person')
ON CONFLICT (id) DO NOTHING;

-- 8. Consultations
INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, consultation_date, vitals_bp, vitals_pulse, vitals_temperature_f, vitals_spo2, clinical_notes, diagnosis, doctor_advice, follow_up_recommended_date) VALUES
('cns00000-0000-0000-0000-000000000001', 'apt00000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000002', NOW() - INTERVAL '14 days', '128/82', 74, 98.4, 99, 'Patient reports mild morning headaches linked with posture and screen time. Neurological cranial nerve exam intact.', 'Cervicogenic tension headache & mild sleep deficit', 'Maintain sleep hygiene, cervical stretching exercises and avoid evening stimulants.', CURRENT_DATE + INTERVAL '16 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Prescriptions & Items
INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, prescription_code, valid_until, notes) VALUES
('rx000000-0000-0000-0000-000000000001', 'cns00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000002', 'RX-2026-9021', CURRENT_DATE + INTERVAL '60 days', 'Take medications with food. Keep a daily headache log.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration_days, instructions) VALUES
('rxi00000-0000-0000-0000-000000000001', 'rx000000-0000-0000-0000-000000000001', 'Amlodipine Besylate', '5mg', 'Once daily in morning', 30, 'Take consistently each morning with water.'),
('rxi00000-0000-0000-0000-000000000002', 'rx000000-0000-0000-0000-000000000001', 'Magnesium Glycinate', '200mg', 'Once daily at bedtime', 30, 'For muscle relaxation and restorative sleep.')
ON CONFLICT (id) DO NOTHING;

-- 10. Medical Records
INSERT INTO medical_records (id, patient_id, doctor_id, record_type, title, description, record_date, is_confidential) VALUES
('mr000000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', 'discharge_summary', 'Cardiology Continuity Inpatient Baseline', 'Discharged post-hypertension titration protocol. Normal sinus rhythm.', CURRENT_DATE - INTERVAL '60 days', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 11. Lab Reports
INSERT INTO lab_reports (id, patient_id, doctor_id, consultation_id, test_name, category, requested_date, completed_date, status, results_summary, is_normal) VALUES
('lab00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', NULL, 'Complete Fasting Lipid & Electrolyte Profile', 'Biochemistry', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '18 days', 'completed', 'Total Cholesterol: 192 mg/dL, HDL: 54 mg/dL, LDL: 110 mg/dL, Triglycerides: 140 mg/dL. Creatinine: 0.9 mg/dL (Normal).', TRUE),
('lab00000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', NULL, 'Follow-up Serum Electrolytes & Renal Function', 'Biochemistry', CURRENT_DATE - INTERVAL '2 days', NULL, 'pending', NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 12. Care Plans & Care Gaps
INSERT INTO care_plans (id, patient_id, doctor_id, title, goal, target_metric, target_date, status) VALUES
('cp00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', 'Arterial Hypertension & Cardiovascular Continuity', 'Maintain resting blood pressure < 130/80 mmHg and average 10,000 weekly low-impact aerobic steps.', 'BP < 130/80 mmHg', CURRENT_DATE + INTERVAL '45 days', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO care_gaps (id, patient_id, category, title, description, severity, due_date, is_closed) VALUES
('gap00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'pending_investigation', 'Complete Lipid Panel & Electrolyte Profile', 'Cardiology continuity check requires fasting lipid profile prior to your scheduled cardiology consult.', 'high', CURRENT_DATE + INTERVAL '2 days', FALSE),
('gap00000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'overdue_follow_up', 'Routine Diabetic & HbA1c Screening', 'Last glycemic screening was 10 months ago. Annual screening overdue.', 'medium', CURRENT_DATE - INTERVAL '10 days', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 13. Follow-Ups
INSERT INTO follow_ups (id, patient_id, doctor_id, consultation_id, scheduled_due_date, reason, status) VALUES
('fu000000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000002', 'cns00000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '16 days', 'Re-evaluation of tension headache frequency and sleep hygiene response', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 14. Emergency Profile, Access Tokens & Logs
INSERT INTO emergency_profiles (id, patient_id, primary_contact_name, primary_contact_phone, primary_contact_relation, secondary_contact_name, secondary_contact_phone, critical_notes, organ_donor_indicator) VALUES
('em000000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'Thomas Vance', '+1 (555) 234-9988', 'Spouse', 'Clara Vance', '+1 (555) 345-1122', 'Severe allergy to Penicillin. Carries emergency beta-blocker.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_access_tokens (id, patient_id, token_hash, expires_at, is_revoked) VALUES
('tok00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'cb_er_9a87f12e3b44c', NOW() + INTERVAL '30 days', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_access_logs (id, token_id, patient_id, accessed_at, accessor_ip, user_agent, location_estimate) VALUES
('log00000-0000-0000-0000-000000000001', 'tok00000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', '198.51.100.22', 'Austin EMS First Responder iPad / Mobile Safari', 'Austin Metro Paramedic Unit 4')
ON CONFLICT (id) DO NOTHING;

-- 15. Blood Requests & Organ Requests
INSERT INTO blood_requests (id, requester_profile_id, patient_name, blood_group, units_required, hospital_name, city, contact_phone, urgency, status) VALUES
('br000000-0000-0000-0000-000000000001', 'p3000000-0000-0000-0000-000000000004', 'Julian Drake', 'O+', 2, 'St. David Medical Center', 'Austin', '+1 (555) 912-4433', 'urgent', 'open'),
('br000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'Emergency ER Reserve Unit', 'A+', 3, 'Dell Seton Medical Center', 'Austin', '+1 (555) 443-8822', 'critical_stat', 'matched')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organ_requests (id, patient_id, organ_type, medical_urgency_score, hospital_registered, status) VALUES
('or000000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'Cornea', 45, 'Dell Seton Medical Center', 'registered_in_network')
ON CONFLICT (id) DO NOTHING;

-- 16. Continuity Pharmacy Products & Orders
INSERT INTO pharmacy_products (id, name, generic_name, category, dosage_form, strength, price, requires_prescription, in_stock, stock_quantity, manufacturer, description) VALUES
('ph000000-0000-0000-0000-000000000001', 'Amlodipine Besylate 5mg', 'Amlodipine', 'Cardiovascular', 'Tablet', '5mg', 18.50, TRUE, TRUE, 250, 'Pfizer / Greenstone', 'Calcium channel blocker for arterial hypertension management.'),
('ph000000-0000-0000-0000-000000000002', 'Metformin HCl 500mg', 'Metformin Extended Release', 'Endocrine', 'Tablet', '500mg', 14.00, TRUE, TRUE, 400, 'Merck', 'First-line medication for type 2 diabetes glycemic control.'),
('ph000000-0000-0000-0000-000000000003', 'Atorvastatin Calcium 20mg', 'Atorvastatin', 'Cardiovascular', 'Tablet', '20mg', 22.00, TRUE, TRUE, 180, 'Apotex', 'HMG-CoA reductase inhibitor for lipid and cardiovascular risk reduction.'),
('ph000000-0000-0000-0000-000000000004', 'Magnesium Glycinate 200mg', 'Magnesium Chelated', 'Wellness & Supplements', 'Capsule', '200mg', 16.20, FALSE, TRUE, 120, 'Pure Encapsulations', 'Highly absorbable chelated magnesium supporting neuromuscular relaxation.'),
('ph000000-0000-0000-0000-000000000005', 'Amoxicillin Trihydrate 500mg', 'Amoxicillin', 'Antibiotics', 'Capsule', '500mg', 19.80, TRUE, TRUE, 85, 'Teva Pharmaceuticals', 'Broad-spectrum penicillin antibiotic (Verify allergy before dispensing!).'),
('ph000000-0000-0000-0000-000000000006', 'Omeprazole Delayed-Release 20mg', 'Omeprazole', 'Gastrointestinal', 'Capsule', '20mg', 15.50, FALSE, TRUE, 300, 'AstraZeneca', 'Proton pump inhibitor for gastroesophageal reflux relief.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO medicine_orders (id, order_number, patient_id, prescription_id, total_amount, delivery_address, delivery_city, contact_phone, status, tracking_number) VALUES
('ord00000-0000-0000-0000-000000000001', 'CB-MED-8491', 'pat00000-0000-0000-0000-000000000001', 'rx000000-0000-0000-0000-000000000001', 34.70, '742 Evergreen Terrace, Suite 4B', 'Austin', '+1 (555) 234-5678', 'dispatched', 'CB-EXP-992019')
ON CONFLICT (id) DO NOTHING;

INSERT INTO medicine_order_items (id, order_id, product_id, quantity, unit_price, subtotal) VALUES
('ordi0000-0000-0000-0000-000000000001', 'ord00000-0000-0000-0000-000000000001', 'ph000000-0000-0000-0000-000000000001', 1, 18.50, 18.50),
('ordi0000-0000-0000-0000-000000000002', 'ord00000-0000-0000-0000-000000000001', 'ph000000-0000-0000-0000-000000000004', 1, 16.20, 16.20)
ON CONFLICT (id) DO NOTHING;

-- 17. Consents
INSERT INTO consents (id, patient_id, grantee_type, grantee_id, scope, is_active) VALUES
('cs000000-0000-0000-0000-000000000001', 'pat00000-0000-0000-0000-000000000001', 'doctor', 'doc00000-0000-0000-0000-000000000001', 'full_records', TRUE),
('cs000000-0000-0000-0000-000000000002', 'pat00000-0000-0000-0000-000000000001', 'family_member', 'fam00000-0000-0000-0000-000000000001', 'emergency_triage_only', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 18. Notifications & Audit Logs
INSERT INTO notifications (id, recipient_profile_id, title, message, type, action_path, is_read) VALUES
('not00000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'Upcoming Cardiology Follow-Up', 'Your appointment with Dr. David Chen is confirmed for in 3 days at 10:00 AM.', 'appointment', '/patient/appointments', FALSE),
('not00000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'Pharmacy Order Dispatched', 'Prescription order #CB-MED-8491 has been dispatched with tracking #CB-EXP-992019.', 'pharmacy', '/patient/pharmacy', FALSE),
('not00000-0000-0000-0000-000000000003', 'p2000000-0000-0000-0000-000000000002', 'New Patient Appointment Assigned', 'Eleanor Vance has a confirmed consultation booked for Thursday 10:00 AM.', 'appointment', '/doctor/appointments', FALSE),
('not00000-0000-0000-0000-000000000004', 'p4000000-0000-0000-0000-000000000005', 'Matching Urgent Blood Request in Austin', 'Urgent need for 2 units O+ at St. David Medical Center.', 'blood_request', '/donor/requests', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, actor_profile_id, action, entity_type, entity_id, details, ip_address) VALUES
('aud00000-0000-0000-0000-000000000001', 'p2000000-0000-0000-0000-000000000003', 'PRESCRIPTION_ISSUED', 'prescription', 'rx000000-0000-0000-0000-000000000001', '{"prescriptionCode":"RX-2026-9021","itemsCount":2,"patient":"Eleanor Vance"}'::jsonb, '10.0.4.12'),
('aud00000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'EMERGENCY_QR_GENERATED', 'emergency_token', 'tok00000-0000-0000-0000-000000000001', '{"validDays":30}'::jsonb, '192.168.1.101'),
('aud00000-0000-0000-0000-000000000003', 'p3000000-0000-0000-0000-000000000004', 'DOCTOR_CREDENTIALS_VERIFIED', 'doctor', 'doc00000-0000-0000-0000-000000000001', '{"license":"TX-MED-44921","status":"approved"}'::jsonb, '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contact_messages (id, name, email, subject, message, status) VALUES
('cnt00000-0000-0000-0000-000000000001', 'Marcus Sterling', 'marcus@austinclinic.org', 'CareBridge Clinical Integration Inquiry', 'We are seeking to integrate our regional community clinic with CareBridge care gap alerts and pharmacy network.', 'unread')
ON CONFLICT (id) DO NOTHING;
