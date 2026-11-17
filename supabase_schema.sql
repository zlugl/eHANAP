-- ==============================================================================
-- eHANAP: A Decision Tree-Based Cloud System for Intelligent Employment Matching
-- Beneficiary: Municipal Public Employment Service Office (PESO), Roxas, Oriental Mindoro
-- File: supabase_schema.sql
-- Usage: Paste and run this entire script in the Supabase Dashboard -> SQL Editor
--        Safe to run multiple times (idempotent DDL, policies, triggers & seed data)
-- ==============================================================================

-- Enable essential PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. USERS TABLE
-- Authentication identities, user roles, and verification flags
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employer', 'job_seeker')),
    name TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    is_account_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 2. EMPLOYER PROFILES TABLE
-- Accredited local and external employers registered in Roxas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS employer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    municipality TEXT NOT NULL DEFAULT 'Roxas',
    barangay TEXT,
    industry TEXT NOT NULL,
    company_description TEXT,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'for_compliance', 'rejected', 'suspended')),
    is_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    profile_setup_completed_at TIMESTAMPTZ,
    establishment_type TEXT CHECK (establishment_type IN ('local_established', 'new_external')),
    authorized_branch_manager TEXT,
    hr_contact_person TEXT,
    hr_contact_number TEXT,
    branch_location TEXT,
    mayors_permit_file TEXT,
    dti_sec_file TEXT,
    dti_sec_registration TEXT,
    sanitary_permit_file TEXT,
    letter_of_intent_file TEXT,
    aitr_file TEXT,
    sedula_file TEXT,
    barangay_clearance_file TEXT,
    environment_cert_file TEXT,
    zoning_clearance_file TEXT,
    building_permit_file TEXT,
    tourism_clearance_file TEXT,
    payment_receipt_file TEXT,
    fire_safety_file TEXT,
    business_permit_no TEXT,
    business_permit_file TEXT,
    bir_2303_no TEXT,
    bir_2303_file TEXT,
    document_url TEXT,
    submitted_requirements TEXT[] DEFAULT '{}',
    requirements_submitted BOOLEAN DEFAULT FALSE,
    compliance_remarks TEXT,
    verification_notes TEXT,
    accreditation_submitted_at TIMESTAMPTZ,
    data_privacy_consent JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_status ON employer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_municipality ON employer_profiles(municipality);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_industry ON employer_profiles(industry);

DROP TRIGGER IF EXISTS trg_employer_profiles_updated_at ON employer_profiles;
CREATE TRIGGER trg_employer_profiles_updated_at
    BEFORE UPDATE ON employer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. SEEKER PROFILES TABLE
-- Comprehensive job seeker credentials, multi-domain skills, and PESO walk-in data
-- ==============================================================================
CREATE TABLE IF NOT EXISTS seeker_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    email TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    address TEXT NOT NULL,
    barangay TEXT,
    municipality TEXT NOT NULL DEFAULT 'Roxas',
    civil_status TEXT,
    sex TEXT,
    age INTEGER,
    profile_picture TEXT,
    professional_summary TEXT,
    summary TEXT,
    educational_attainment TEXT NOT NULL,
    primary_degree TEXT NOT NULL,
    technical_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    trade_skills TEXT[] DEFAULT '{}',
    administrative_skills TEXT[] DEFAULT '{}',
    service_hospitality_skills TEXT[] DEFAULT '{}',
    sales_customer_skills TEXT[] DEFAULT '{}',
    it_creative_skills TEXT[] DEFAULT '{}',
    education JSONB DEFAULT '[]'::jsonb,
    work_experience JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    resumes JSONB DEFAULT '[]'::jsonb,
    active_resume_id TEXT,
    is_account_verified BOOLEAN DEFAULT FALSE,
    is_profile_completed BOOLEAN DEFAULT FALSE,
    profile_setup_completed_at TIMESTAMPTZ,
    job_preferences JSONB,
    data_privacy_consent JSONB,
    skill_proficiencies JSONB DEFAULT '[]'::jsonb,
    assessments JSONB DEFAULT '[]'::jsonb,
    employment_status TEXT DEFAULT 'unemployed' CHECK (employment_status IN ('unemployed', 'employed', 'hired', 'underemployed', 'hired_on_the_spot')),
    current_employer TEXT,
    hired_position TEXT,
    hired_at TIMESTAMPTZ,
    is_walk_in BOOLEAN DEFAULT FALSE,
    registration_type TEXT DEFAULT 'online' CHECK (registration_type IN ('online', 'walk_in')),
    education_category TEXT CHECK (education_category IN ('College Graduate', 'High School Graduate', 'Out-of-School Youth')),
    practical_skills TEXT[] DEFAULT '{}',
    trade_certifications TEXT[] DEFAULT '{}',
    geographic_mobility TEXT DEFAULT 'local_only' CHECK (geographic_mobility IN ('local_only', 'provincial', 'willing_to_relocate')),
    willing_to_relocate_for_visiting_companies BOOLEAN DEFAULT FALSE,
    bio_data_details TEXT,
    walk_in_assessment_notes TEXT,
    assessed_by_officer TEXT,
    assessed_at TIMESTAMPTZ,
    profile_completeness INTEGER DEFAULT 0,
    website TEXT,
    projects JSONB DEFAULT '[]'::jsonb,
    volunteer_experience JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,
    job_seeking_status TEXT DEFAULT 'actively_looking' CHECK (job_seeking_status IN ('actively_looking', 'passively_looking', 'not_looking')),
    bookmarked_job_ids TEXT[] DEFAULT '{}',
    notification_preferences JSONB,
    language_preference TEXT DEFAULT 'English',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_profiles_user_id ON seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_municipality ON seeker_profiles(municipality);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_barangay ON seeker_profiles(barangay);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_attainment ON seeker_profiles(educational_attainment);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_employment_status ON seeker_profiles(employment_status);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_technical_skills ON seeker_profiles USING GIN(technical_skills);

DROP TRIGGER IF EXISTS trg_seeker_profiles_updated_at ON seeker_profiles;
CREATE TRIGGER trg_seeker_profiles_updated_at
    BEFORE UPDATE ON seeker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. JOB POSTS TABLE
-- Vacancies posted by verified Roxas employers or PESO admins
-- ==============================================================================
CREATE TABLE IF NOT EXISTS job_posts (
    id TEXT PRIMARY KEY,
    employer_id TEXT NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    company_municipality TEXT NOT NULL DEFAULT 'Roxas',
    company_verified BOOLEAN NOT NULL DEFAULT FALSE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    industry TEXT,
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT '{}',
    employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship')),
    work_location TEXT NOT NULL,
    municipality TEXT NOT NULL DEFAULT 'Roxas',
    vacancies_count INTEGER NOT NULL DEFAULT 1,
    salary_range TEXT,
    application_deadline TEXT,
    posted_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('active', 'closed', 'pending_approval', 'for_compliance', 'rejected', 'archived')),
    review_notes TEXT,
    compliance_remarks TEXT,
    target_applicant_type TEXT CHECK (target_applicant_type IN ('College Graduate', 'High School Graduate', 'Out-of-School Youth', 'Any')),
    deployment_location_type TEXT CHECK (deployment_location_type IN ('local', 'out_of_town')),
    lra_event_id TEXT,
    min_educational_attainment TEXT NOT NULL,
    preferred_degree TEXT NOT NULL,
    degree_importance TEXT DEFAULT 'required' CHECK (degree_importance IN ('required', 'preferred', 'optional')),
    required_skills TEXT[] DEFAULT '{}',
    preferred_skills TEXT[] DEFAULT '{}',
    min_experience_years INTEGER DEFAULT 0,
    experience_importance TEXT DEFAULT 'required' CHECK (experience_importance IN ('required', 'preferred', 'optional')),
    required_certifications TEXT[] DEFAULT '{}',
    technical_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    other_qualifications TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_posts_employer_id ON job_posts(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_category ON job_posts(category);
CREATE INDEX IF NOT EXISTS idx_job_posts_municipality ON job_posts(municipality);
CREATE INDEX IF NOT EXISTS idx_job_posts_required_skills ON job_posts USING GIN(required_skills);

DROP TRIGGER IF EXISTS trg_job_posts_updated_at ON job_posts;
CREATE TRIGGER trg_job_posts_updated_at
    BEFORE UPDATE ON job_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. APPLICATIONS TABLE
-- Seeker job applications with complete Decision Tree match record & status audit
-- ==============================================================================
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    job_seeker_id TEXT NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    employer_id TEXT NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    applied_date TEXT NOT NULL,
    resume_id TEXT,
    current_status TEXT NOT NULL DEFAULT 'applied' CHECK (
        current_status IN (
            'applied', 'submitted', 'ats_screened', 'under_review', 'reviewed',
            'qualified', 'shortlisted', 'for_interview', 'interview_scheduled',
            'interview_completed', 'for_final_review', 'hired', 'rejected',
            'not_selected', 'withdrawn'
        )
    ),
    match_result JSONB NOT NULL,
    status_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    cover_note TEXT,
    match_score NUMERIC(5,2),
    applicant_name TEXT,
    decision_tree_outcome TEXT CHECK (decision_tree_outcome IN ('HIGHLY QUALIFIED', 'QUALIFIED', 'MODERATELY QUALIFIED', 'LOW MATCH', 'NOT QUALIFIED')),
    ats_score NUMERIC(5,2),
    ats_result JSONB,
    feedback JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_employer_id ON applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(current_status);
CREATE INDEX IF NOT EXISTS idx_applications_match_score ON applications(match_score DESC);

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. CANDIDATE MATCHES TABLE
-- Decision Tree pre-computed ranking cache between vacancies and seekers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS candidate_matches (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    job_seeker_id TEXT NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    overall_match NUMERIC(5,2) NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('HIGHLY QUALIFIED', 'QUALIFIED', 'MODERATELY QUALIFIED', 'LOW MATCH', 'NOT QUALIFIED')),
    education_match_score NUMERIC(5,2) DEFAULT 0,
    degree_alignment_score NUMERIC(5,2) DEFAULT 0,
    skills_match_score NUMERIC(5,2) DEFAULT 0,
    experience_match_score NUMERIC(5,2) DEFAULT 0,
    certifications_match_score NUMERIC(5,2) DEFAULT 0,
    matched_reasons TEXT[] DEFAULT '{}',
    missing_qualifications TEXT[] DEFAULT '{}',
    decision_reason TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_candidate_match UNIQUE(job_id, job_seeker_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_matches_job_id ON candidate_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_seeker_id ON candidate_matches(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_score ON candidate_matches(overall_match DESC);

-- ==============================================================================
-- 7. INTERVIEWS TABLE
-- Multi-party interview scheduling pipeline
-- ==============================================================================
CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
    job_id TEXT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    employer_id TEXT NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_seeker_id TEXT NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('face_to_face', 'in_person', 'phone', 'video')),
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location_or_link TEXT NOT NULL,
    instructions TEXT,
    contact_person TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'accepted', 'reschedule_requested', 'declined', 'completed', 'cancelled')),
    proposed_slots JSONB DEFAULT '[]'::jsonb,
    reschedule_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_employer_id ON interviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_seeker_id ON interviews(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

DROP TRIGGER IF EXISTS trg_interviews_updated_at ON interviews;
CREATE TRIGGER trg_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 8. LOCAL RECRUITMENT ACTIVITIES (LRA) TABLE
-- Visiting employers recruiting within Roxas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lra_events (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_origin TEXT NOT NULL,
    industry TEXT NOT NULL,
    letter_of_intent_status TEXT NOT NULL DEFAULT 'received' CHECK (letter_of_intent_status IN ('received', 'under_review', 'approved', 'rejected')),
    letter_of_intent_date TEXT,
    mayors_approval_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mayors_permit_no TEXT,
    event_title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_venue TEXT NOT NULL,
    target_positions TEXT[] DEFAULT '{}',
    total_vacancies INTEGER DEFAULT 0,
    target_applicant_types TEXT[] DEFAULT '{}',
    willingness_to_relocate_required BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'scheduled', 'ongoing', 'completed', 'cancelled')),
    announcement_published BOOLEAN DEFAULT FALSE,
    registered_applicants_count INTEGER DEFAULT 0,
    hots_count INTEGER DEFAULT 0,
    interviews_conducted_count INTEGER DEFAULT 0,
    notes TEXT,
    nominated_candidate_ids TEXT[] DEFAULT '{}',
    nominated_candidates JSONB DEFAULT '[]'::jsonb,
    event_name TEXT,
    start_date TEXT,
    end_date TEXT,
    venue TEXT,
    vacancies TEXT[] DEFAULT '{}',
    total_slots_available INTEGER DEFAULT 0,
    target_applicant_type TEXT[] DEFAULT '{}',
    coordinator_name TEXT,
    coordinator_contact TEXT,
    has_letter_of_intent BOOLEAN DEFAULT FALSE,
    has_mayors_permit BOOLEAN DEFAULT FALSE,
    has_dole_registration BOOLEAN DEFAULT FALSE,
    is_dmw_poea_licensed BOOLEAN DEFAULT FALSE,
    is_publicly_announced BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    hots_applicants_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lra_events_status ON lra_events(status);
CREATE INDEX IF NOT EXISTS idx_lra_events_event_date ON lra_events(event_date);

DROP TRIGGER IF EXISTS trg_lra_events_updated_at ON lra_events;
CREATE TRIGGER trg_lra_events_updated_at
    BEFORE UPDATE ON lra_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 9. PESO REFERRAL SLIPS TABLE
-- Official PESO referral documents issued to walk-in applicants and candidates
-- ==============================================================================
CREATE TABLE IF NOT EXISTS peso_referral_slips (
    id TEXT PRIMARY KEY,
    referral_number TEXT NOT NULL UNIQUE,
    slip_number TEXT,
    date_issued TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    job_seeker_id TEXT NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    job_seeker_name TEXT NOT NULL,
    job_seeker_contact TEXT NOT NULL,
    job_seeker_address TEXT NOT NULL,
    educational_attainment TEXT NOT NULL,
    education_category TEXT,
    trade_certifications TEXT[] DEFAULT '{}',
    geographic_mobility TEXT,
    job_post_id TEXT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    employer_id TEXT NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    employer_name TEXT NOT NULL,
    employer_address TEXT NOT NULL,
    authorized_contact_person TEXT NOT NULL,
    authorized_contact_number TEXT,
    matching_score NUMERIC(5,2) NOT NULL,
    matching_tier TEXT NOT NULL CHECK (matching_tier IN ('Highly Qualified', 'Qualified', 'Moderately Qualified', 'Low Match')),
    decision_tree_rationale TEXT,
    interview_date TEXT,
    interview_venue TEXT,
    issued_by_officer_name TEXT NOT NULL,
    issued_by_officer_position TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'interview_scheduled', 'hired', 'hired_on_the_spot', 'not_hired', 'expired')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peso_referral_slips_ref_num ON peso_referral_slips(referral_number);
CREATE INDEX IF NOT EXISTS idx_peso_referral_slips_seeker ON peso_referral_slips(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_peso_referral_slips_job ON peso_referral_slips(job_post_id);
CREATE INDEX IF NOT EXISTS idx_peso_referral_slips_employer ON peso_referral_slips(employer_id);

DROP TRIGGER IF EXISTS trg_peso_referral_slips_updated_at ON peso_referral_slips;
CREATE TRIGGER trg_peso_referral_slips_updated_at
    BEFORE UPDATE ON peso_referral_slips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 10. NOTIFICATIONS TABLE
-- Real-time notification dispatch
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL,
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'employer', 'job_seeker')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'action')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ==============================================================================
-- 11. AUDIT LOGS TABLE
-- Administrative compliance and system event audit trail
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'employer', 'job_seeker')),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ==============================================================================
-- 12. AUXILIARY TABLES (Announcements & Subscriptions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS system_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT NOT NULL CHECK (target_role IN ('all', 'employer', 'job_seeker')),
    date_posted TEXT NOT NULL,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_alert_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    municipalities TEXT[] DEFAULT '{}',
    employment_types TEXT[] DEFAULT '{}',
    min_salary NUMERIC(10,2),
    is_email_alert_enabled BOOLEAN DEFAULT TRUE,
    is_toast_alert_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lra_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso_referral_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating so the script is safely re-runnable
DROP POLICY IF EXISTS "Public read access to active job posts" ON job_posts;
DROP POLICY IF EXISTS "Public read access to announcements" ON system_announcements;
DROP POLICY IF EXISTS "Public read access to lra events" ON lra_events;

DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on users" ON users;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on employer_profiles" ON employer_profiles;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on seeker_profiles" ON seeker_profiles;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on job_posts" ON job_posts;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on applications" ON applications;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on candidate_matches" ON candidate_matches;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on interviews" ON interviews;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on lra_events" ON lra_events;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on peso_referral_slips" ON peso_referral_slips;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on system_announcements" ON system_announcements;
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated on job_alert_subscriptions" ON job_alert_subscriptions;

-- Allow public read access to active vacancies, approved announcements, and LRA events
CREATE POLICY "Public read access to active job posts" ON job_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access to announcements" ON system_announcements FOR SELECT USING (true);
CREATE POLICY "Public read access to lra events" ON lra_events FOR SELECT USING (true);

-- Permissive policies for authenticated/anon client operations
CREATE POLICY "Allow all operations for anon and authenticated on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on employer_profiles" ON employer_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on seeker_profiles" ON seeker_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on job_posts" ON job_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on candidate_matches" ON candidate_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on interviews" ON interviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on lra_events" ON lra_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on peso_referral_slips" ON peso_referral_slips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on system_announcements" ON system_announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon and authenticated on job_alert_subscriptions" ON job_alert_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- REALTIME CONFIGURATION
-- Enable Supabase Realtime broadcast for operational tables (idempotent)
-- ==============================================================================
DO $$
DECLARE
    tbl TEXT;
    tables_to_add TEXT[] := ARRAY[
        'users',
        'employer_profiles',
        'seeker_profiles',
        'job_posts',
        'applications',
        'candidate_matches',
        'interviews',
        'lra_events',
        'peso_referral_slips',
        'notifications',
        'audit_logs',
        'system_announcements',
        'job_alert_subscriptions'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH tbl IN ARRAY tables_to_add LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public'
                  AND tablename = tbl
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
            END IF;
        END LOOP;
    END IF;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA (PESO ROXAS, ORIENTAL MINDORO)
-- ==============================================================================

-- 1. USERS
INSERT INTO users (id, email, role, name, phone, avatar, is_account_verified, is_profile_completed, created_at)
VALUES
    ('user-peso-admin-01', 'peso.admin@roxas.gov.ph', 'admin', 'Hon. Roberto D. Alvarez', '+63 917 890 1234', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-10T08:00:00Z'),
    ('user-emp-puregold-01', 'puregold.roxas@employer.ph', 'employer', 'Eduardo Manalo', '+63 928 555 4321', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-15T08:00:00Z'),
    ('user-emp-tech-01', 'tech.innovations@employer.ph', 'employer', 'Engr. Patrick Dave Villanueva', '+63 919 444 8765', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-18T08:00:00Z'),
    ('user-emp-agri-01', 'agri.ventures@employer.ph', 'employer', 'Don Ramon S. Ilustre', '+63 920 333 9988', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-20T08:00:00Z'),
    ('user-emp-sales-01', 'sales.central@employer.ph', 'employer', 'Clarissa Mae Mendoza', '+63 927 666 1122', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-22T08:00:00Z'),
    ('user-seeker-juan-01', 'juan.delacruz@jobseeker.ph', 'job_seeker', 'Juan Dela Cruz', '+63 918 123 4567', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80', true, true, '2026-01-25T08:00:00Z'),
    ('user-seeker-maria-02', 'maria.santos@jobseeker.ph', 'job_seeker', 'Maria Santos', '+63 917 888 4433', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', true, true, '2026-02-05T08:00:00Z'),
    ('user-seeker-mark-03', 'mark.villanueva@jobseeker.ph', 'job_seeker', 'Mark Villanueva', '+63 920 777 5566', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', true, true, '2026-02-08T08:00:00Z'),
    ('user-seeker-poqiq-01', 'poqiq75@gmail.com', 'job_seeker', 'Poqiq Roxas', '+63 917 555 7788', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, true, '2026-02-10T08:00:00Z')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    phone = EXCLUDED.phone;

-- 2. EMPLOYER PROFILES
INSERT INTO employer_profiles (
    id, user_id, company_name, representative_name, contact_number, email, address,
    municipality, barangay, industry, establishment_type, company_description, logo_url,
    status, is_profile_completed, profile_setup_completed_at, authorized_branch_manager,
    hr_contact_person, hr_contact_number, business_permit_no, dti_sec_registration,
    requirements_submitted, submitted_requirements, created_at
) VALUES
(
    'emp-puregold-01', 'user-emp-puregold-01', 'Puregold Price Club (Roxas Branch)',
    'Eduardo Manalo', '+63 928 555 4321', 'puregold.roxas@employer.ph', 'National Highway, Brgy. Bagumbayan',
    'Roxas', 'Bagumbayan', 'Customer Service & Retail', 'local_established',
    'Premier nationwide hypermarket retail chain operating in Roxas, Oriental Mindoro.',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80',
    'verified', true, '2026-01-16T09:00:00Z', 'Eduardo Manalo', 'Liza Santos (HR Specialist)',
    '+63 928 555 4322', 'BP-ROXAS-2026-0188', 'SEC-CS200612984', true,
    ARRAY['mayors_permit', 'dti_sec', 'sanitary_permit', 'bir_2303'], '2026-01-15T08:00:00Z'
),
(
    'emp-tech-01', 'user-emp-tech-01', 'Mindoro Tech Innovations & Solutions',
    'Engr. Patrick Dave Villanueva', '+63 919 444 8765', 'tech.innovations@employer.ph', 'Poblacion, Brgy. Cantil',
    'Roxas', 'Cantil', 'Information Technology & Software', 'local_established',
    'Local software development consulting and IT systems provider based in Roxas.',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&auto=format&fit=crop&q=80',
    'verified', true, '2026-01-19T09:00:00Z', 'Engr. Patrick Dave Villanueva', 'Katrina Gomez (Recruiter)',
    '+63 919 444 8766', 'BP-ROXAS-2026-0210', 'DTI-04891238', true,
    ARRAY['mayors_permit', 'dti_sec', 'bir_2303'], '2026-01-18T08:00:00Z'
),
(
    'emp-agri-01', 'user-emp-agri-01', 'Roxas Highland Agro-Farms & Seedlings',
    'Don Ramon S. Ilustre', '+63 920 333 9988', 'agri.ventures@employer.ph', 'Sitio Balugo, Brgy. Victoria',
    'Roxas', 'Victoria', 'Agriculture & Agribusiness', 'local_established',
    'Leading commercial farm producer and seedlings propagation facility in Southern Oriental Mindoro.',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&auto=format&fit=crop&q=80',
    'verified', true, '2026-01-21T09:00:00Z', 'Don Ramon S. Ilustre', 'Nicanor B. Bautista',
    '+63 920 333 9989', 'BP-ROXAS-2026-0095', 'DTI-01984712', true,
    ARRAY['mayors_permit', 'dti_sec', 'sanitary_permit', 'barangay_clearance'], '2026-01-20T08:00:00Z'
),
(
    'emp-sales-01', 'user-emp-sales-01', 'Roxas Central Boutique & Department Store',
    'Clarissa Mae Mendoza', '+63 927 666 1122', 'sales.central@employer.ph', 'Commercial Strip, Brgy. San Vicente',
    'Roxas', 'San Vicente', 'Customer Service & Retail', 'local_established',
    'Prominent retail clothing and lifestyle department store in the municipal commercial center.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
    'verified', true, '2026-01-23T09:00:00Z', 'Clarissa Mae Mendoza', 'Rowena Castillo',
    '+63 927 666 1123', 'BP-ROXAS-2026-0312', 'DTI-02481944', true,
    ARRAY['mayors_permit', 'dti_sec', 'sanitary_permit'], '2026-01-22T08:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    representative_name = EXCLUDED.representative_name,
    status = EXCLUDED.status;

-- 3. SEEKER PROFILES
INSERT INTO seeker_profiles (
    id, user_id, first_name, middle_name, last_name, date_of_birth, email, contact_number,
    address, barangay, municipality, educational_attainment, primary_degree,
    technical_skills, soft_skills, trade_skills, administrative_skills, service_hospitality_skills,
    sales_customer_skills, it_creative_skills, professional_summary, employment_status,
    is_account_verified, is_profile_completed, profile_setup_completed_at, created_at,
    education, work_experience, certifications
) VALUES
(
    'seeker-juan-01', 'user-seeker-juan-01', 'Juan', 'Santos', 'Dela Cruz', '1998-05-14',
    'juan.delacruz@jobseeker.ph', '+63 918 123 4567', 'Sitio Ilaya, Brgy. San Vicente', 'San Vicente', 'Roxas',
    'Bachelor''s Degree', 'BS Information Technology',
    ARRAY['JavaScript', 'React.js', 'Node.js', 'SQL', 'PostgreSQL', 'HTML/CSS', 'Tailwind CSS'],
    ARRAY['Problem Solving', 'Communication', 'Teamwork', 'Time Management'],
    ARRAY[]::TEXT[],
    ARRAY['Technical Documentation', 'Data Entry'],
    ARRAY[]::TEXT[],
    ARRAY['Client Support'],
    ARRAY['Web Development', 'UI Design', 'Database Management'],
    'Motivated Information Technology graduate from Roxas, passionate about modern web applications and database architecture.',
    'unemployed', true, true, '2026-01-26T10:00:00Z', '2026-01-25T08:00:00Z',
    '[{"id":"edu-01","degreeCourse":"BS Information Technology","school":"Mindoro State University - Bongabong","yearGraduated":2022,"educationalAttainment":"Bachelor''s Degree","honors":"Cum Laude"}]'::jsonb,
    '[{"id":"exp-01","company":"Roxas Tech Hub","position":"Junior Web Developer","startDate":"2022-08-01","endDate":"2024-06-30","isCurrent":false,"responsibilities":"Developed interactive client web applications and managed database migrations.","yearsOfExperience":2}]'::jsonb,
    '[{"id":"cert-01","name":"Full-Stack Web Development Certificate","issuingOrganization":"DICT Mindoro","dateObtained":"2023-04-15"}]'::jsonb
),
(
    'seeker-maria-02', 'user-seeker-maria-02', 'Maria', 'Clara', 'Santos', '2001-08-22',
    'maria.santos@jobseeker.ph', '+63 917 888 4433', 'Brgy. Bagumbayan', 'Bagumbayan', 'Roxas',
    'High School Graduate', 'General Academic Strand',
    ARRAY['POS Operation', 'Cash Handling', 'Product Display', 'Customer Service'],
    ARRAY['Active Listening', 'Patience', 'Honesty', 'Punctuality'],
    ARRAY['Retail Merchandising'],
    ARRAY['Basic Inventory Logging'],
    ARRAY['Customer Care', 'Frontline Assistance'],
    ARRAY['Active Selling', 'Product Presentation', 'Cashiering'],
    ARRAY[]::TEXT[],
    'Enthusiastic and reliable high school graduate with retail cashiering experience and strong customer assistance skills.',
    'unemployed', true, true, '2026-02-06T09:00:00Z', '2026-02-05T08:00:00Z',
    '[{"id":"edu-02","degreeCourse":"High School Diploma (GAS)","school":"Roxas National Comprehensive High School","yearGraduated":2020,"educationalAttainment":"High School Graduate"}]'::jsonb,
    '[{"id":"exp-02","company":"Bagumbayan Convenience Mart","position":"Cashier / Sales Clerk","startDate":"2021-01-15","endDate":"2023-12-20","isCurrent":false,"responsibilities":"Processed point-of-sale customer transactions and managed shelf replenishment.","yearsOfExperience":3}]'::jsonb,
    '[{"id":"cert-02","name":"TESDA NC II - Customer Service / Retail Support","issuingOrganization":"TESDA Oriental Mindoro","dateObtained":"2022-11-10"}]'::jsonb
),
(
    'seeker-mark-03', 'user-seeker-mark-03', 'Mark', 'Anthony', 'Villanueva', '1996-11-03',
    'mark.villanueva@jobseeker.ph', '+63 920 777 5566', 'Brgy. Victoria', 'Victoria', 'Roxas',
    'TVET / Vocational', 'Agricultural Crop Production NC II',
    ARRAY['Crop Harvesting', 'Pest Management', 'Irrigation Maintenance', 'Farm Machinery Operation'],
    ARRAY['Hardworking', 'Physical Stamina', 'Team Player', 'Reliability'],
    ARRAY['Agricultural Equipment Servicing', 'Grain Handling'],
    ARRAY['Logistics Dispatch Logging'],
    ARRAY[]::TEXT[],
    ARRAY['Farm Produce Direct Sales'],
    ARRAY[]::TEXT[],
    'Certified TESDA NC II agricultural technician specializing in organic farming, crop protection, and post-harvest management.',
    'unemployed', true, true, '2026-02-09T08:30:00Z', '2026-02-08T08:00:00Z',
    '[{"id":"edu-03","degreeCourse":"Vocational Certificate in Crop Production","school":"Mindoro Agro-Technical Institute","yearGraduated":2018,"educationalAttainment":"TVET / Vocational"}]'::jsonb,
    '[{"id":"exp-03","company":"Victoria Rice & Corn Cooperative","position":"Farm Supervisor Assistant","startDate":"2019-03-01","endDate":"2024-01-31","isCurrent":false,"responsibilities":"Supervised field workers, monitored soil moisture levels, and managed tractor operations.","yearsOfExperience":5}]'::jsonb,
    '[{"id":"cert-03","name":"Agricultural Crop Production NC II","issuingOrganization":"TESDA","dateObtained":"2018-09-20"}]'::jsonb
),
(
    'seeker-poqiq-01', 'user-seeker-poqiq-01', 'Poqiq', 'B.', 'Roxas', '2000-03-12',
    'poqiq75@gmail.com', '+63 917 555 7788', 'Brgy. Cantil', 'Cantil', 'Roxas',
    'Bachelor''s Degree', 'BS Computer Science',
    ARRAY['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Git', 'REST APIs'],
    ARRAY['Analytical Thinking', 'Fast Learner', 'Collaboration', 'Problem Solving'],
    ARRAY[]::TEXT[],
    ARRAY['Project Planning'],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY['Frontend Architecture', 'Full-Stack Development', 'Algorithm Optimization'],
    'Computer Science graduate proficient in React, TypeScript, and modern software engineering practices.',
    'unemployed', true, true, '2026-02-11T10:00:00Z', '2026-02-10T08:00:00Z',
    '[{"id":"edu-04","degreeCourse":"BS Computer Science","school":"Mindoro State University","yearGraduated":2024,"educationalAttainment":"Bachelor''s Degree"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email;

-- 4. JOB POSTS
INSERT INTO job_posts (
    id, employer_id, company_name, company_logo, company_municipality, company_verified,
    title, category, description, employment_type, work_location, municipality, vacancies_count,
    salary_range, application_deadline, posted_date, status, min_educational_attainment,
    preferred_degree, degree_importance, min_experience_years, experience_importance,
    required_skills, preferred_skills, technical_skills, soft_skills, required_certifications,
    responsibilities, created_at
) VALUES
(
    'job-puregold-cashier', 'emp-puregold-01', 'Puregold Price Club (Roxas Branch)',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80',
    'Roxas', true, 'Supermarket Cashier & Frontline Service', 'Customer Service & Retail',
    'Responsible for operating electronic point-of-sale cash registers, processing customer grocery payments, and greeting customers.',
    'Full-time', 'National Highway, Brgy. Bagumbayan, Roxas', 'Roxas', 3, '₱11,000 - ₱13,500 / month',
    '2026-04-30', '2026-02-01', 'active', 'High School Graduate', 'Any', 'optional', 0, 'preferred',
    ARRAY['Cash Handling', 'POS Operation', 'Customer Service'],
    ARRAY['Basic Arithmetic', 'Inventory Checking'],
    ARRAY['POS Terminal', 'Barcode Scanning'],
    ARRAY['Honesty', 'Punctuality', 'Courteous Demeanor'],
    ARRAY[]::TEXT[],
    ARRAY[
        'Accurately scan items and accept cash, credit, or e-wallet payments',
        'Issue correct receipts and change to shoppers',
        'Maintain a clean, organized register counter at all times'
    ],
    '2026-02-01T08:00:00Z'
),
(
    'job-puregold-bagger', 'emp-puregold-01', 'Puregold Price Club (Roxas Branch)',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80',
    'Roxas', true, 'Grocery Bagger & Retail Assistant', 'Customer Service & Retail',
    'Assist customers by packing groceries safely and efficiently according to store packaging guidelines.',
    'Full-time', 'National Highway, Brgy. Bagumbayan, Roxas', 'Roxas', 4, '₱10,500 - ₱12,000 / month',
    '2026-04-30', '2026-02-01', 'active', 'High School Graduate', 'Any', 'optional', 0, 'optional',
    ARRAY['Package Handling', 'Customer Service'],
    ARRAY['Cart Management', 'Merchandise Replenishment'],
    ARRAY['Product Organization'],
    ARRAY['Physical Stamina', 'Friendliness', 'Teamwork'],
    ARRAY[]::TEXT[],
    ARRAY[
        'Pack groceries properly separating perishable goods from household items',
        'Help senior citizens and persons with disabilities carry items to vehicles',
        'Collect and organize shopping carts throughout the sales floor'
    ],
    '2026-02-01T08:30:00Z'
),
(
    'job-tech-dev-01', 'emp-tech-01', 'Mindoro Tech Innovations & Solutions',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&auto=format&fit=crop&q=80',
    'Roxas', true, 'Frontend Web Developer (React & TypeScript)', 'Information Technology & Software',
    'Build and maintain responsive user interfaces for municipal and corporate web platforms using React, TypeScript, and modern CSS.',
    'Full-time', 'Poblacion, Brgy. Cantil, Roxas', 'Roxas', 2, '₱22,000 - ₱32,000 / month',
    '2026-05-15', '2026-02-03', 'active', 'Bachelor''s Degree', 'BS Computer Science', 'required', 1, 'preferred',
    ARRAY['React.js', 'TypeScript', 'HTML/CSS', 'Tailwind CSS'],
    ARRAY['Node.js', 'PostgreSQL', 'Git', 'REST APIs'],
    ARRAY['React', 'TypeScript', 'CSS3', 'Git'],
    ARRAY['Problem Solving', 'Attention to Detail', 'Collaboration'],
    ARRAY[]::TEXT[],
    ARRAY[
        'Develop responsive web views following Hallmark design guidelines',
        'Integrate REST APIs and manage application state efficiently',
        'Collaborate with UX designers and backend engineers on feature releases'
    ],
    '2026-02-03T09:00:00Z'
),
(
    'job-agri-supervisor', 'emp-agri-01', 'Roxas Highland Agro-Farms & Seedlings',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&auto=format&fit=crop&q=80',
    'Roxas', true, 'Farm Operations & Crop Supervisor', 'Agriculture & Agribusiness',
    'Supervise daily farm operations, crop irrigation schedules, seedling nurseries, and organic fertilization programs in Roxas.',
    'Full-time', 'Sitio Balugo, Brgy. Victoria, Roxas', 'Roxas', 1, '₱16,000 - ₱22,000 / month',
    '2026-04-15', '2026-02-04', 'active', 'TVET / Vocational', 'BS Agriculture / Agri-Technology', 'preferred', 2, 'required',
    ARRAY['Crop Harvesting', 'Pest Management', 'Irrigation Maintenance'],
    ARRAY['Soil Analysis', 'Farm Machinery Operation'],
    ARRAY['Field Supervision', 'Crop Scheduling'],
    ARRAY['Leadership', 'Resilience', 'Resourcefulness'],
    ARRAY['Agricultural Crop Production NC II'],
    ARRAY[
        'Manage nursery seedling schedules and greenhouse climate control',
        'Lead field workers in crop cultivation and harvesting operations',
        'Maintain farm logs and submit yield reports to the farm director'
    ],
    '2026-02-04T08:00:00Z'
),
(
    'job-sales-lady', 'emp-sales-01', 'Roxas Central Boutique & Department Store',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
    'Roxas', true, 'Retail Sales Associate / Saleslady', 'Customer Service & Retail',
    'Welcome shoppers, assist in product selection and fittings, maintain store displays, and monitor dressing rooms.',
    'Full-time', 'Commercial Strip, Brgy. San Vicente, Roxas', 'Roxas', 2, '₱11,000 - ₱13,000 / month',
    '2026-04-30', '2026-02-04', 'active', 'High School Graduate', 'Any', 'optional', 0, 'preferred',
    ARRAY['Active Selling', 'Product Presentation', 'Customer Service'],
    ARRAY['Merchandising', 'Stock Counting'],
    ARRAY['Display Styling', 'Inventory Check'],
    ARRAY['Pleasant Personality', 'Patience', 'Persuasiveness'],
    ARRAY[]::TEXT[],
    ARRAY[
        'Assist customers in locating merchandise and recommending complementary items',
        'Keep display shelves and clothing racks neatly arranged and folded',
        'Conduct periodic stock inventory counts alongside store manager'
    ],
    '2026-02-04T10:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status;

-- 5. SYSTEM ANNOUNCEMENTS
INSERT INTO system_announcements (id, title, content, target_role, date_posted, is_important, created_at)
VALUES (
    'ann-01',
    'PESO Roxas Local Hiring Blitz: Supermarket, Tech, Agriculture & Retail Now Open',
    'The Municipal Public Employment Service Office (PESO) of Roxas has verified new job openings across Puregold (Cashier & Bagger), Mindoro Tech, Roxas Highland Agro-Farms, and Roxas Central Boutique. Local job seekers are encouraged to explore and apply directly!',
    'all',
    '2026-02-01',
    true,
    '2026-02-01T08:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 6. AUDIT LOGS
INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity, entity_id, details, timestamp)
VALUES
(
    'audit-01', 'user-peso-admin-01', 'Hon. Roberto D. Alvarez', 'admin',
    'EMPLOYER_ACCREDITED', 'EmployerProfile', 'emp-puregold-01',
    'Verified Mayor''s Permit and accredited Puregold Price Club (Roxas Branch)',
    '2026-02-01T08:00:00Z'
),
(
    'audit-02', 'user-peso-admin-01', 'Hon. Roberto D. Alvarez', 'admin',
    'JOB_APPROVED', 'JobPost', 'job-puregold-cashier',
    'Approved Cashier opening under LGU Roxas Employment Standards',
    '2026-02-05T09:00:00Z'
)
ON CONFLICT (id) DO NOTHING;
