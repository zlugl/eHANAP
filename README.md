# eHANAP — PESO Roxas Employment Matching & Labor Market Platform

**eHANAP** is a Decision Tree-based localized job placement, automated candidate ranking, and labor market monitoring system developed for the **Municipality of Roxas, Oriental Mindoro**, operating under the supervision of the **Public Employment Service Office (PESO)** and the Local Government Unit (LGU).

---

## Core Features & User Roles

### 1. Job Seekers
- **Resume & Bio-Data Parsing**: Upload corporate resumes or traditional Philippine Bio-Data sheets (PDF, DOCX, or Image OCR) with AI-assisted and deterministic fallback extraction.
- **Decision Tree Compatibility Scoring**: View real-time compatibility percentage (`0–100%`) and qualification tiers (*Highly Qualified*, *Qualified*, *Moderately Qualified*, *Low Match*) with transparent sub-score breakdowns across education, degree alignment, skills, experience, and certifications.
- **ATS Resume Evaluator & Builder**: Scan resumes for keyword density, section completeness, and formatting or build a standardized resume and export to PDF.
- **Real-Time Application & Interview Tracking**: Apply to verified vacancies, respond to interview schedules, and receive job alert notifications.

### 2. Employers
- **PESO-LGU Compliance & Accreditation**: Submit mandatory regulatory documents (Mayor's Permit, DTI/SEC, BIR 2303, Sanitary Permit, etc.) for PESO verification.
- **Automated Candidate Ranking Engine**: Automatically evaluate and rank registered job seekers by compatibility score whenever a vacancy is posted and approved.
- **Applicant & Interview Pipeline**: Review applicant match reports, shortlist candidates, schedule interviews, and record hiring decisions.

### 3. PESO / LGU Administrator
- **Employer & Vacancy Gatekeeping**: Verify employer accreditations and approve or return job postings for compliance before public listing.
- **Walk-In Applicant Encoding & PESO Referral Slips**: Encode walk-in seekers (College Graduates, High School Graduates, Out-of-School Youth), assess practical/TESDA trade skills, and issue official printable PESO Referral Slips (`PESO-RXS-REF-*`).
- **Local Recruitment Activity (LRA) Management**: Coordinate visiting regional/external employers, track Letters of Intent, Mayor's Permits, and Hired-On-The-Spot (HOTS) counts.
- **Municipal Labor Market Analytics**: Track employment status distributions, barangay-level seeker demographics, and placement metrics across all 20 barangays of Roxas.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Lucide React, Recharts, jsPDF, html2canvas
- **Backend**: Node.js, Express (`server.ts` with Vite middleware in development)
- **Database & Realtime**: Supabase (PostgreSQL, Row Level Security, Supabase Auth, Supabase Realtime) with automatic offline/localStorage fallback
- **Document & AI Parsing**: `@google/genai` (Gemini API with circuit-breaker failover), `pdf-parse`, `mammoth`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres"
GEMINI_API_KEY="your-gemini-api-key" # Optional: falls back to deterministic parser if omitted
```

### 3. Initialize the Supabase Database Schema
1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Copy and paste the contents of [`supabase_schema.sql`](./supabase_schema.sql) and click **Run**.
   - This creates all 13 tables, indexes, triggers, Row Level Security (RLS) policies, Realtime publications, and initial PESO Roxas seed data.

### 4. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000/`** in your browser.

---

## Demo Accounts

You can switch roles instantly using the **Demo Persona Switcher** in the navigation bar or sign in with the following pre-seeded accounts (default password: `eHANAP@2026`):

| Role | Name / Organization | Email |
| :--- | :--- | :--- |
| **PESO Admin** | Hon. Roberto D. Alvarez (PESO Roxas) | `peso.admin@roxas.gov.ph` |
| **Employer** | Puregold Price Club (Roxas Branch) | `puregold.roxas@employer.ph` |
| **Employer** | Mindoro Tech Innovations & Solutions | `tech.innovations@employer.ph` |
| **Job Seeker** | Juan Dela Cruz | `juan.delacruz@jobseeker.ph` |
| **Job Seeker** | Maria Santos | `maria.santos@jobseeker.ph` |
| **Job Seeker** | Mark Villanueva | `mark.villanueva@jobseeker.ph` |

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express + Vite development server at `http://localhost:3000/` |
| `npm run build` | Builds the frontend production bundle (`dist/`) and bundles the Express server (`dist/server.cjs`) |
| `npm start` | Runs the production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript static type checking (`tsc --noEmit`) |
| `npm test` | Runs the automated milestone & architecture verification suite (`scripts/verify-milestone07.ts`) |

---

## Project Structure

```text
├── server.ts                  # Express + Vite server entry point
├── server/                    # Modular backend controllers, document parser & AI resume service
├── src/
│   ├── components/            # Reusable UI components, modals, and role-based navbar
│   ├── constants/             # Roxas 20 barangays, Mindoro municipalities, and job categories
│   ├── context/               # Domain & application state providers (Auth, Notifications, Toast, App)
│   ├── data/                  # Initial Roxas PESO seed data and regulatory checklists
│   ├── hooks/                 # Custom React hooks (e.g., useSeekerProfileForm)
│   ├── lib/                   # Supabase client & unified localStorage adapter
│   ├── services/              # Supabase CRUD, real-time subscriptions, and auth service
│   ├── utils/                 # Pure domain logic: Decision Tree, ATS Engine, Match Resolver, PDF export
│   └── views/                 # Role-based views (Landing, Seeker, Employer, PESO Admin)
├── supabase/                  # SQL migrations and seed scripts
├── supabase_schema.sql        # All-in-one idempotent Supabase SQL schema + seed script
└── scripts/                   # Automated verification & diagnostic test suites
```
