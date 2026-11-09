-- ==============================================================================
-- eHANAP: A Decision Tree-Based Cloud System for Intelligent Employment Matching
-- Beneficiary: Municipal Public Employment Service Office (PESO), Roxas, Oriental Mindoro
-- Migration: 20261109000001_initial_ehanap_schema.sql
-- Description: Core relational schema covering 11 tables, indexes, constraints, RLS & Realtime
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
-- Visiting employers (e.g., Puregold Calapan) recruiting within Roxas
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
-- Configured for secure access with permissive policies for authenticated and anon roles
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

-- Allow public read access to active vacancies, approved announcements, and basic statistics
CREATE POLICY "Public read access to active job posts" ON job_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access to announcements" ON system_announcements FOR SELECT USING (true);
CREATE POLICY "Public read access to lra events" ON lra_events FOR SELECT USING (true);

-- Permissive development policies for authenticated/anon during pilot demo
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
-- Enable Supabase Realtime broadcast for primary operational tables
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            users,
            employer_profiles,
            seeker_profiles,
            job_posts,
            applications,
            candidate_matches,
            interviews,
            lra_events,
            peso_referral_slips,
            notifications,
            audit_logs,
            system_announcements;
    END IF;
END $$;
