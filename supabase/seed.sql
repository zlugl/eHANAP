-- ==============================================================================
-- eHANAP: Seed Data Script
-- Beneficiary: Municipal PESO Office, Roxas, Oriental Mindoro
-- Replicates initial Roxas accounts, employers, job vacancies, and seekers
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
