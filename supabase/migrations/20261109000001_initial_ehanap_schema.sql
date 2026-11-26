-- ==============================================================================
-- eHANAP: A Decision Tree-Based Cloud System for Intelligent Employment Matching
-- Beneficiary: Municipal Public Employment Service Office (PESO), Roxas, Oriental Mindoro
-- Migration: 20261109000001_initial_ehanap_schema.sql
-- Description: Core relational schema covering 13 tables, indexes, constraints, RLS & Realtime
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
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('incomplete', 'pending_verification', 'pending', 'verified', 'for_compliance', 'rejected', 'suspended')),
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
    documents JSONB DEFAULT '[]'::jsonb,
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
    sub_category TEXT,
    industry TEXT,
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT '{}',
    employment_type TEXT NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Contractual / Project-Based', 'Probationary', 'Seasonal', 'Seasonal / Temporary', 'Temporary', 'Internship', 'Internship / OJT', 'Freelance')),
    work_setup TEXT,
    work_schedule TEXT,
    work_location TEXT NOT NULL,
    municipality TEXT NOT NULL DEFAULT 'Roxas',
    barangay TEXT,
    vacancies_count INTEGER NOT NULL DEFAULT 1,
    salary_range TEXT,
    min_salary NUMERIC(12,2),
    max_salary NUMERIC(12,2),
    pay_schedule TEXT,
    is_salary_negotiable BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    application_deadline TEXT,
    posted_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('active', 'closed', 'pending_approval', 'for_compliance', 'rejected', 'archived')),
    review_notes TEXT,
    compliance_remarks TEXT,
    target_applicant_type TEXT CHECK (target_applicant_type IN ('College Graduate', 'High School Graduate', 'Out-of-School Youth', 'Any')),
    deployment_location_type TEXT CHECK (deployment_location_type IN ('local', 'out_of_town')),
    lra_event_id TEXT,
    min_educational_attainment TEXT NOT NULL,
    required_education_level TEXT,
    accepted_education_levels TEXT[] DEFAULT '{}',
    preferred_degree TEXT NOT NULL,
    preferred_courses TEXT[] DEFAULT '{}',
    preferred_tesda_qualifications TEXT[] DEFAULT '{}',
    any_course_allowed BOOLEAN DEFAULT FALSE,
    degree_importance TEXT DEFAULT 'required' CHECK (degree_importance IN ('required', 'preferred', 'optional')),
    career_level TEXT,
    required_skills TEXT[] DEFAULT '{}',
    preferred_skills TEXT[] DEFAULT '{}',
    min_experience_years INTEGER DEFAULT 0,
    open_to_fresh_graduates BOOLEAN DEFAULT FALSE,
    experience_importance TEXT DEFAULT 'required' CHECK (experience_importance IN ('required', 'preferred', 'optional')),
    required_licenses TEXT[] DEFAULT '{}',
    required_certifications TEXT[] DEFAULT '{}',
    skills JSONB DEFAULT '[]'::jsonb,
    evaluated_skills JSONB DEFAULT '[]'::jsonb,
    technical_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    match_weights JSONB,
    benefits TEXT[] DEFAULT '{}',
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
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'accepted', 'reschedule_requested', 'declined', 'completed', 'cancelled')),
    proposed_slots JSONB DEFAULT '[]'::jsonb,
    reschedule_notes TEXT,
    reminders_sent JSONB DEFAULT '{}'::jsonb,
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

-- Idempotent column & constraint alignment for pre-existing deployments
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS barangay TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS work_setup TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS work_schedule TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS min_salary NUMERIC(12,2);
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS max_salary NUMERIC(12,2);
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS pay_schedule TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS is_salary_negotiable BOOLEAN DEFAULT FALSE;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS required_education_level TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS accepted_education_levels TEXT[] DEFAULT '{}';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS preferred_courses TEXT[] DEFAULT '{}';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS preferred_tesda_qualifications TEXT[] DEFAULT '{}';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS any_course_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS career_level TEXT;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS open_to_fresh_graduates BOOLEAN DEFAULT FALSE;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS required_licenses TEXT[] DEFAULT '{}';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS evaluated_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS match_weights JSONB;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS reminders_sent JSONB DEFAULT '{}'::jsonb;

ALTER TABLE employer_profiles DROP CONSTRAINT IF EXISTS employer_profiles_status_check;
ALTER TABLE employer_profiles ADD CONSTRAINT employer_profiles_status_check CHECK (status IN ('incomplete', 'pending_verification', 'pending', 'verified', 'for_compliance', 'rejected', 'suspended'));
ALTER TABLE job_posts DROP CONSTRAINT IF EXISTS job_posts_employment_type_check;
ALTER TABLE job_posts ADD CONSTRAINT job_posts_employment_type_check CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Contractual / Project-Based', 'Probationary', 'Seasonal', 'Seasonal / Temporary', 'Temporary', 'Internship', 'Internship / OJT', 'Freelance'));
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_status_check;
ALTER TABLE interviews ADD CONSTRAINT interviews_status_check CHECK (status IN ('scheduled', 'rescheduled', 'accepted', 'reschedule_requested', 'declined', 'completed', 'cancelled'));

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPERS & POLICIES
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

-- SECURITY DEFINER helpers resolve the app user from auth.uid() or verified JWT email without RLS recursion
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id
    FROM public.users
    WHERE auth.uid() IS NOT NULL
      AND (
          id = auth.uid()::text
          OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.users
    WHERE auth.uid() IS NOT NULL
      AND (
          id = auth.uid()::text
          OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_peso_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.current_app_user_role() = 'admin', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.get_employer_status(emp_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT status FROM public.employer_profiles WHERE id = emp_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_job_post_status(target_job_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT status FROM public.job_posts WHERE id = target_job_id LIMIT 1;
$$;

-- Drop legacy permissive policies and existing scoped policies so script is idempotent
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

DROP POLICY IF EXISTS "Users select own or admin" ON users;
DROP POLICY IF EXISTS "Users insert self or admin" ON users;
DROP POLICY IF EXISTS "Users update own or admin" ON users;
DROP POLICY IF EXISTS "Users delete admin only" ON users;
CREATE POLICY "Users select own or admin" ON users
    FOR SELECT USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (id = auth.uid()::text OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );
CREATE POLICY "Users insert self or admin" ON users
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND role IN ('employer', 'job_seeker')
            AND (id = auth.uid()::text OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );
CREATE POLICY "Users update own or admin" ON users
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND id = public.current_app_user_id())
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND id = public.current_app_user_id()
            AND role = public.current_app_user_role()
        )
    );
CREATE POLICY "Users delete admin only" ON users
    FOR DELETE USING (public.is_peso_admin());

DROP POLICY IF EXISTS "Employers select verified, own, or admin" ON employer_profiles;
DROP POLICY IF EXISTS "Employers insert own pending or admin" ON employer_profiles;
DROP POLICY IF EXISTS "Employers update own non-status or admin" ON employer_profiles;
DROP POLICY IF EXISTS "Employers delete admin only" ON employer_profiles;
CREATE POLICY "Employers select verified, own, or admin" ON employer_profiles
    FOR SELECT USING (
        status = 'verified'
        OR public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    );
CREATE POLICY "Employers insert own pending or admin" ON employer_profiles
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND user_id = public.current_app_user_id()
            AND status IN ('incomplete', 'pending_verification', 'pending')
        )
    );
CREATE POLICY "Employers update own non-status or admin" ON employer_profiles
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND user_id = public.current_app_user_id()
            AND (
                status = COALESCE(public.get_employer_status(id), 'incomplete')
                OR (
                    COALESCE(public.get_employer_status(id), 'incomplete') IN ('incomplete', 'pending_verification', 'pending', 'for_compliance')
                    AND status IN ('incomplete', 'pending_verification', 'pending')
                )
            )
        )
    );
CREATE POLICY "Employers delete admin only" ON employer_profiles
    FOR DELETE USING (public.is_peso_admin());

DROP POLICY IF EXISTS "Seekers select own, employer, or admin" ON seeker_profiles;
DROP POLICY IF EXISTS "Seekers insert own or admin" ON seeker_profiles;
DROP POLICY IF EXISTS "Seekers update own or admin" ON seeker_profiles;
DROP POLICY IF EXISTS "Seekers delete admin only" ON seeker_profiles;
CREATE POLICY "Seekers select own, employer, or admin" ON seeker_profiles
    FOR SELECT USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
        OR (auth.uid() IS NOT NULL AND public.current_app_user_role() = 'employer')
    );
CREATE POLICY "Seekers insert own or admin" ON seeker_profiles
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    );
CREATE POLICY "Seekers update own or admin" ON seeker_profiles
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    ) WITH CHECK (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    );
CREATE POLICY "Seekers delete admin only" ON seeker_profiles
    FOR DELETE USING (public.is_peso_admin());

DROP POLICY IF EXISTS "Public read access to active job posts" ON job_posts;
DROP POLICY IF EXISTS "Job posts insert employer pending or admin" ON job_posts;
DROP POLICY IF EXISTS "Job posts insert verified employer or admin" ON job_posts;
DROP POLICY IF EXISTS "Job posts update employer non-approve or admin" ON job_posts;
DROP POLICY IF EXISTS "Job posts delete employer own or admin" ON job_posts;
CREATE POLICY "Public read access to active job posts" ON job_posts
    FOR SELECT USING (
        status = 'active'
        OR public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
        )
    );
CREATE POLICY "Job posts insert verified employer or admin" ON job_posts
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            AND (
                status = 'pending_approval'
                OR (
                    status = 'active'
                    AND public.get_employer_status(employer_id) = 'verified'
                )
            )
        )
    );
CREATE POLICY "Job posts update employer non-approve or admin" ON job_posts
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
        )
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            AND (
                status = COALESCE(public.get_job_post_status(id), 'pending_approval')
                OR status IN ('closed', 'archived')
            )
        )
    );
CREATE POLICY "Job posts delete employer own or admin" ON job_posts
    FOR DELETE USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
        )
    );

DROP POLICY IF EXISTS "Applications select participant or admin" ON applications;
DROP POLICY IF EXISTS "Applications insert seeker own or admin" ON applications;
DROP POLICY IF EXISTS "Applications update participant or admin" ON applications;
DROP POLICY IF EXISTS "Applications delete admin only" ON applications;
CREATE POLICY "Applications select participant or admin" ON applications
    FOR SELECT USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    );
CREATE POLICY "Applications insert seeker own or admin" ON applications
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
        )
    );
CREATE POLICY "Applications update participant or admin" ON applications
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    );
CREATE POLICY "Applications delete admin only" ON applications
    FOR DELETE USING (public.is_peso_admin());

DROP POLICY IF EXISTS "Candidate matches select participant or admin" ON candidate_matches;
DROP POLICY IF EXISTS "Candidate matches write participant or admin" ON candidate_matches;
CREATE POLICY "Candidate matches select participant or admin" ON candidate_matches
    FOR SELECT USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR job_id IN (
                    SELECT jp.id FROM public.job_posts jp
                    JOIN public.employer_profiles ep ON ep.id = jp.employer_id
                    WHERE ep.user_id = public.current_app_user_id()
                )
            )
        )
    );
CREATE POLICY "Candidate matches write participant or admin" ON candidate_matches
    FOR ALL USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR job_id IN (
                    SELECT jp.id FROM public.job_posts jp
                    JOIN public.employer_profiles ep ON ep.id = jp.employer_id
                    WHERE ep.user_id = public.current_app_user_id()
                )
            )
        )
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR job_id IN (
                    SELECT jp.id FROM public.job_posts jp
                    JOIN public.employer_profiles ep ON ep.id = jp.employer_id
                    WHERE ep.user_id = public.current_app_user_id()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Interviews select participant or admin" ON interviews;
DROP POLICY IF EXISTS "Interviews insert employer or admin" ON interviews;
DROP POLICY IF EXISTS "Interviews update participant or admin" ON interviews;
DROP POLICY IF EXISTS "Interviews delete employer or admin" ON interviews;
CREATE POLICY "Interviews select participant or admin" ON interviews
    FOR SELECT USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    );
CREATE POLICY "Interviews insert employer or admin" ON interviews
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
        )
    );
CREATE POLICY "Interviews update participant or admin" ON interviews
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    ) WITH CHECK (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    );
CREATE POLICY "Interviews delete employer or admin" ON interviews
    FOR DELETE USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
        )
    );

DROP POLICY IF EXISTS "Public read access to lra events" ON lra_events;
DROP POLICY IF EXISTS "LRA events write admin only" ON lra_events;
CREATE POLICY "Public read access to lra events" ON lra_events FOR SELECT USING (true);
CREATE POLICY "LRA events write admin only" ON lra_events
    FOR ALL USING (public.is_peso_admin()) WITH CHECK (public.is_peso_admin());

DROP POLICY IF EXISTS "Referral slips select participant or admin" ON peso_referral_slips;
DROP POLICY IF EXISTS "Referral slips write admin only" ON peso_referral_slips;
CREATE POLICY "Referral slips select participant or admin" ON peso_referral_slips
    FOR SELECT USING (
        public.is_peso_admin()
        OR (
            auth.uid() IS NOT NULL
            AND (
                job_seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = public.current_app_user_id())
                OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id = public.current_app_user_id())
            )
        )
    );
CREATE POLICY "Referral slips write admin only" ON peso_referral_slips
    FOR ALL USING (public.is_peso_admin()) WITH CHECK (public.is_peso_admin());

DROP POLICY IF EXISTS "Notifications select own or admin" ON notifications;
DROP POLICY IF EXISTS "Notifications insert authenticated or admin" ON notifications;
DROP POLICY IF EXISTS "Notifications update own or admin" ON notifications;
DROP POLICY IF EXISTS "Notifications delete own or admin" ON notifications;
CREATE POLICY "Notifications select own or admin" ON notifications
    FOR SELECT USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND recipient_id = public.current_app_user_id())
    );
CREATE POLICY "Notifications insert authenticated or admin" ON notifications
    FOR INSERT WITH CHECK (
        public.is_peso_admin()
        OR auth.uid() IS NOT NULL
    );
CREATE POLICY "Notifications update own or admin" ON notifications
    FOR UPDATE USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND recipient_id = public.current_app_user_id())
    ) WITH CHECK (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND recipient_id = public.current_app_user_id())
    );
CREATE POLICY "Notifications delete own or admin" ON notifications
    FOR DELETE USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND recipient_id = public.current_app_user_id())
    );

DROP POLICY IF EXISTS "Audit logs admin only" ON audit_logs;
CREATE POLICY "Audit logs admin only" ON audit_logs
    FOR ALL USING (public.is_peso_admin()) WITH CHECK (public.is_peso_admin());

DROP POLICY IF EXISTS "Public read access to announcements" ON system_announcements;
DROP POLICY IF EXISTS "Announcements write admin only" ON system_announcements;
CREATE POLICY "Public read access to announcements" ON system_announcements FOR SELECT USING (true);
CREATE POLICY "Announcements write admin only" ON system_announcements
    FOR ALL USING (public.is_peso_admin()) WITH CHECK (public.is_peso_admin());

DROP POLICY IF EXISTS "Job alert subscriptions own or admin" ON job_alert_subscriptions;
CREATE POLICY "Job alert subscriptions own or admin" ON job_alert_subscriptions
    FOR ALL USING (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    ) WITH CHECK (
        public.is_peso_admin()
        OR (auth.uid() IS NOT NULL AND user_id = public.current_app_user_id())
    );

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
