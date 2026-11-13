# CAREBRIDGE — Healthcare Continuity & Care Coordination Platform

**Tagline:** *Connect care. Close gaps. Support better journeys.*

CAREBRIDGE is a full-stack healthcare coordination and care continuity platform designed to close clinical communication gaps across hospital discharges, doctor appointments, pharmacy orders, family health oversight, and urgent blood donation.

---

## 1. Architecture Overview

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Hook Form, Zod.
- **Backend & Database:** PostgreSQL, Supabase (`@supabase/supabase-js`), Supabase Authentication, Supabase Realtime, Row-Level Security (RLS) policies, transactional database triggers (double-booking prevention).
- **Design Constitution:** Deep healthcare blue (`#0f3d64`), clean white canvas, clinical teal accents (`#0d9488`), Plus Jakarta Sans typography, tabular figures for vitals and numbers, strict anti-slop guidelines.

---

## 2. Roles & Permissions

1. **Patient (Eleanor Vance):**
   - Patient 360° overview (vitals, blood group, allergies, emergency contacts)
   - Appointments (booking, rescheduling, double-booking prevention)
   - Unified Health Journey (chronological timeline of diagnoses, notes, labs, and medications)
   - Care Gap Surveillance Engine (flags pending labs, overdue follow-ups, and open care plans)
   - Prescriptions & 1-click Continuity Pharmacy
   - Emergency Lifesaving QR code (time-limited revocable access tokens with access logs)
   - Blood Help requests & Organ Donor pledge
   - Family Health consent management
   - AI Health Summary with clinical safety disclaimers and Text-to-Speech

2. **Doctor (Dr. David Chen, MD / Dr. Sarah Jenkins, MD):**
   - Doctor dashboard & assigned appointments
   - Clinical consultation room: record vitals (BP, pulse, SpO2, temp), examination notes, and diagnosis
   - Prescription generator: add medications with dosage, frequency, and instructions
   - Investigation/Lab test ordering
   - Follow-up scheduling
   - Automatic patient notification triggers

3. **Administrator:**
   - Real-time platform analytics with Recharts
   - Doctor credential & medical license verification queue (approve / reject)
   - User account directory & role management
   - Medical department configuration
   - Support message inbox
   - Tamper-resistant HIPAA audit trail

4. **Donor (Liam Gallagher):**
   - Donor profile (blood group, location, emergency dispatch availability toggle)
   - Real-time compatible blood request matching
   - Commit and accept blood donation requests
   - Organ donor pledge tissue registry

---

## 3. PostgreSQL Database Migrations & Seed Data

Complete production SQL files are located in:
- Schema Migration: `supabase/migrations/20261112000000_carebridge_schema.sql`
- Clinical Seed Data: `supabase/seed/seed.sql`

Entities implemented:
- `departments`, `profiles`, `patients`, `doctors`, `donors`, `family_members`
- `appointments` (with `prevent_doctor_double_booking` trigger)
- `consultations`, `prescriptions`, `prescription_items`, `lab_reports`, `care_plans`, `care_gaps`
- `emergency_profiles`, `emergency_access_tokens`, `emergency_access_logs`
- `blood_requests`, `organ_requests`
- `pharmacy_products`, `medicine_orders`, `medicine_order_items`
- `notifications`, `audit_logs`, `contact_messages`
- Row-Level Security (RLS) policies for all sensitive tables

---

## 4. Environment Variables

Create a `.env` file from `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."

# Optional Gemini API Key for AI Health Summary
GEMINI_API_KEY=""

# Application URL
APP_URL="http://localhost:3000"
```

*Note:* If Supabase credentials are not yet configured, CareBridge automatically runs in a clearly-labelled **Local Demo Mode** with comprehensive clinical sample data across all 4 roles.

---

## 5. Development & Build Commands

```bash
# Install dependencies
npm install

# Run Vite development server on port 3000
npm run dev

# TypeScript typecheck
npm run lint

# Production build
npm run build
```

---

## 6. 1-Click Instant Persona Testing

CareBridge provides built-in 1-click test login personas in the top navigation and authentication modals:
- **Patient:** `patient@carebridge.org` (Eleanor Vance)
- **Doctor:** `doctor.chen@carebridge.org` (Dr. David Chen, MD)
- **Administrator:** `admin@carebridge.org` (System Admin)
- **Donor:** `donor@carebridge.org` (Liam Gallagher, O+)
