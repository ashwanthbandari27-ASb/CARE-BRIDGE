-- ==============================================================================
-- CAREBRIDGE STORAGE BUCKETS & REALTIME PUBLICATION MIGRATION
-- Project: CareBridge
-- Version: 20261112000002
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORAGE BUCKETS SETUP
-- ------------------------------------------------------------------------------
-- Provision private buckets for sensitive health data and a public bucket for avatars

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('medical-records', 'medical-records', FALSE, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('lab-attachments', 'lab-attachments', FALSE, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('prescriptions', 'prescriptions', FALSE, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- --- AVATARS POLICIES ---
-- Public can read avatars (doctor headshots & profile icons)
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload/update their own avatar (path prefixed with their auth.uid())
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

-- --- MEDICAL RECORDS POLICIES (PRIVATE) ---
-- Path structure: medical-records/<patient_id>/<file_name>
DROP POLICY IF EXISTS "Patients view own medical files" ON storage.objects;
CREATE POLICY "Patients view own medical files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'medical-records'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients 
      WHERE profile_id = public.get_auth_profile_id()
    )
    OR public.is_treating_doctor((storage.foldername(name))[1]::uuid)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Authorized upload of medical files" ON storage.objects;
CREATE POLICY "Authorized upload of medical files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'medical-records'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients 
      WHERE profile_id = public.get_auth_profile_id()
    )
    OR public.is_treating_doctor((storage.foldername(name))[1]::uuid)
    OR public.is_admin()
  )
);

-- --- LAB ATTACHMENTS POLICIES (PRIVATE) ---
-- Path structure: lab-attachments/<patient_id>/<file_name>
DROP POLICY IF EXISTS "Patients and clinicians view lab files" ON storage.objects;
CREATE POLICY "Patients and clinicians view lab files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'lab-attachments'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients 
      WHERE profile_id = public.get_auth_profile_id()
    )
    OR public.is_treating_doctor((storage.foldername(name))[1]::uuid)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Clinicians upload lab files" ON storage.objects;
CREATE POLICY "Clinicians upload lab files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lab-attachments'
  AND (
    public.is_doctor()
    OR public.is_admin()
  )
);

-- --- PRESCRIPTIONS POLICIES (PRIVATE) ---
-- Path structure: prescriptions/<patient_id>/<file_name>
DROP POLICY IF EXISTS "Patients and treating doctors view prescription PDFs" ON storage.objects;
CREATE POLICY "Patients and treating doctors view prescription PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'prescriptions'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.patients 
      WHERE profile_id = public.get_auth_profile_id()
    )
    OR public.is_treating_doctor((storage.foldername(name))[1]::uuid)
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Doctors upload prescription PDFs" ON storage.objects;
CREATE POLICY "Doctors upload prescription PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'prescriptions'
  AND (
    public.is_doctor()
    OR public.is_admin()
  )
);

-- ------------------------------------------------------------------------------
-- 3. SUPABASE REALTIME REPLICATION PUBLICATION
-- ------------------------------------------------------------------------------
-- Add critical healthcare continuity tables to Supabase Realtime CDC publication

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.care_gaps;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medicine_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already added to publication
END $$;
