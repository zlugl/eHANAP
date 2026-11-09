# eHANAP — Thesis Defense Presentation Runbook

> **Official Thesis Title**: *E-Hanap: A Decision Tree-Based Cloud System for Intelligent Employment Matching and Facilitation*  
> **Degree Program**: Bachelor of Science in Computer Science (BSCS IV - Group 1, Thesis 102)  
> **Researchers**: Margarette Faye G. Lomboy, Lhean Joyce B. Escalona, Regina M. Sacapaño  
> **Adviser / Professor**: Dr. John Edgar S. Anthony  
> **Client & Municipal Partner**: Public Employment Service Office (PESO), Local Government Unit of Roxas, Oriental Mindoro  
> **Document Purpose**: Official step-by-step panel presentation guide, demonstration script, and defense defense manual.

---

## 1. Executive Summary & Local Research Context

Employment facilitation in the **Municipality of Roxas, Oriental Mindoro** historically relied on manual, fragmented mechanisms—physical bulletin boards at the municipal hall, walk-in bio-data submissions, and informal social media announcements. This resulted in three systemic bottlenecks:
1. **Job Seekers** struggled to discover vacancies matching their exact vocational skills and academic attainment.
2. **Local Employers (MSMEs)** faced prolonged recruitment cycles without objective tools to screen and rank applicants against vacancy criteria.
3. **PESO Municipal Office** bore an overwhelming administrative burden coordinating physical records, managing **Local Recruitment Activities (LRA)** for external employers (e.g., Puregold Calapan recruiting in Roxas), and aggregating municipal labor market reports without a centralized database.

**eHANAP** addresses these challenges by delivering a cloud-based, multi-role labor exchange platform driven by a deterministic **Decision Tree Candidate Ranking Engine** and localized governance workflows tailored to the administrative standards of Roxas, Oriental Mindoro.

---

## 2. Core Architectural Highlights

```mermaid
flowchart TD
    subgraph Multi-Role Users
        S[Job Seeker: Juan Dela Cruz]
        E[Roxas Employer: Puregold Price Club]
        A[PESO Roxas Admin: Municipal Officer]
    end

    subgraph Presentation & Client Layer
        Vite[React 19 + Vite 6 + Tailwind CSS v4]
        Context[AppContext Unified State Management]
    end

    subgraph Computational Intelligence
        DT[Decision Tree Scoring Engine (O(log n) Determinism)]
        ATS[ATS Machine-Readability & Keyword Extractor]
    end

    subgraph Data & Storage Layer
        Supa[(Supabase PostgreSQL 11 Relational Tables)]
        RLS[Row Level Security & Audit Logging]
        Fallback[(Resilient Offline Fallback Layer)]
    end

    S --> Vite
    E --> Vite
    A --> Vite
    Vite --> Context
    Context --> DT
    Context --> ATS
    Context --> Supa
    Context -. Offline Fallback .-> Fallback
    Supa --> RLS
```

### 2.1 Theoretical Framework
- **Decision Tree Theory**: Provides transparent, mathematically verifiable candidate scoring across 5 nodes ($O(\log n)$ evaluation speed), eliminating black-box bias.
- **Technology Acceptance Model (TAM)**: Maximizes Perceived Usefulness (PU) and Perceived Ease of Use (PEOU) for municipal constituents with diverse digital literacy.
- **Diffusion of Innovation (DOI)**: Facilitates municipal adoption across all 20 Roxas barangays.
- **Input-Process-Output (IPO) Model**:
  - *Inputs*: Job seeker credentials (resumes/bio-data), employer vacancy requirements, and PESO regulatory permits (BPLO Mayor's Permit, DTI/SEC).
  - *Process*: Automated ATS parsing, Decision Tree classification, ranking calculation, and multi-role state synchronization.
  - *Outputs*: Ranked candidate roster for employers, compatibility notifications for seekers, and municipal labor analytics for PESO.

### 2.2 Database Architecture Transition (Firebase $\to$ Supabase PostgreSQL)
Per academic panel directive, eHANAP transitioned from Firebase Firestore to **Supabase PostgreSQL**:
- **11 Relational Tables**: `users`, `employer_profiles`, `seeker_profiles`, `job_posts`, `applications`, `candidate_matches`, `interviews`, `lra_events`, `peso_referral_slips`, `notifications`, `audit_logs`.
- **Row Level Security (RLS)**: Enforces role isolation (Seekers cannot inspect employer private applicant pools; employers cannot tamper with admin moderation queues).
- **Offline Fallback Architecture**: Built-in dual persistence and offline demonstration mock fallback ensure 100% presentation stability even during panel defense room network failures.

---

## 3. Pre-Defense System Verification Checklist

Before starting the live demonstration, run the automated verification suite to prove platform integrity:

```bash
# 1. Run full automated verification suite (137 tests covering Supabase, Decision Tree, ATS, and E2E)
npm test

# 2. Verify static type safety (must be 0 errors)
npm run lint

# 3. Verify clean production bundle build
npm run build

# 4. Launch development server for defense presentation
npm run dev
```

**Expected Terminal Output**:
- `npm test`: `🎉 ALL TEST SUITES PASSED (137/137 tests verified)!`
- `npm run lint`: `0 errors`
- `npm run dev`: `Local: http://localhost:5173/`

---

## 4. Minute-by-Minute Live Defense Demonstration Script

| Timeline | Act / Persona | Key Features Demonstrated | Presenter Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | **Introduction** | System Mission, Municipal Context & Architecture | *"eHANAP is the official intelligent employment system for Roxas, Oriental Mindoro, operating in partnership with PESO Roxas..."* |
| **1:00 - 3:30** | **Act 1: Job Seeker** | Profile Setup, ATS Resume Audit, Match Alerts, 1-Click Apply | *"Notice how Juan Dela Cruz uploads his resume, receives instant ATS readability feedback, and gets an automated alert for matching jobs..."* |
| **3:30 - 6:30** | **Act 2: Roxas Employer** | Job Vacancy Posting, **Automated Candidate Ranking Engine**, Applicant Progression | *"This is our core thesis feature: The Automated Candidate Ranking Engine orders all registered Roxas seekers by descending compatibility with transparent score cards..."* |
| **6:30 - 8:45** | **Act 3: PESO Admin** | Business Verification, Job Moderation, **LRA Coordination**, Referral Slips, Municipal Analytics | *"PESO Roxas acts as the municipal gatekeeper, moderating jobs, facilitating regional recruitment with Puregold Calapan, and issuing referral slips..."* |
| **8:45 - 10:00** | **Conclusion** | Technical Summary, Theoretical Alignment, Panel Q&A Transition | *"By pairing Decision Tree determinism with Supabase relational integrity, eHANAP bridges the labor gap in Roxas. We welcome your questions."* |

---

### Step-by-Step Walkthrough Guide

#### Act 1: The Job Seeker Journey (Juan Dela Cruz)
1. **Navigate to the Application**: Open `http://localhost:5173`.
2. **Demo Account Switcher**:
   - In the navigation bar, click the **Demo Accounts** dropdown or **Sign In** modal.
   - Select **Juan Dela Cruz (Job Seeker)**.
   - *Highlight*: Instant session hydration without typing passwords, ensuring zero presentation friction.
3. **Inspect Seeker Profile & ATS Feedback**:
   - Navigate to **Profile** or click **ATS Resume Analysis**.
   - Show the **ATS Score Card** (e.g., 95% Grade A+):
     - Contact completeness (Verified Philippine phone, Roxas municipality, email).
     - Standard ATS section coverage (Summary, Education, Work History, Skills).
     - Keyword density and machine-readability rating.
4. **Discover Matching Vacancies & Apply**:
   - Navigate to **Job Search**.
   - Point out the **Compatibility Badges** (e.g., `92% Match`, `85% Match`).
   - Open a high-match vacancy (e.g., *Inventory & Cashier Specialist* at Puregold Roxas).
   - Click **1-Click Apply**. The application record is immediately saved with immutable Decision Tree match snapshot metadata.

---

#### Act 2: Roxas Employer & The Automated Candidate Ranking Engine (Puregold Roxas)
1. **Switch Role to Employer**:
   - Click the Demo Switcher in the top bar.
   - Select **Puregold Price Club - Roxas (Employer)**.
2. **Review Employer Dashboard**:
   - Show business verification status (*Verified Roxas Establishment* with Mayor's Permit BPLO No. `BPLO-ROXAS-2026-0842`).
3. **Core Thesis Highlight — The Automated Candidate Ranking Roster**:
   - Open **Job Vacancies** $\to$ click on *Inventory & Cashier Specialist*.
   - Click the **Candidate Ranking Roster** tab.
   - **Show the Panel**:
     - The table lists registered Roxas job seekers **automatically sorted from highest to lowest compatibility score (100% down to 20%)**.
     - Click **View Score Breakdown** on the top candidate:
       - **Node 1: Educational Attainment ($W_{edu} = 25\%$)**: College Graduate $\ge$ Bachelor's Degree ($100\%$).
       - **Node 2: Degree Alignment ($W_{deg} = 20\%$)**: BS Information Technology aligns with retail inventory systems ($100\%$).
       - **Node 3: 6-Category Skills Competency ($W_{skills} = 30\%$)**: Cash Handling, POS Operation, Inventory Audit ($100\%$) + PESO verified assessment boost ($+5\%$).
       - **Node 4: Experience Delta ($W_{exp} = 15\%$)**: 2 years work experience meets vacancy requirement ($100\%$).
       - **Node 5: Certifications ($W_{cert} = 10\%$)**: Verified TESDA NC II in Retail Services ($100\%$).
   - *Key Presenter Statement*: *"Unlike black-box AI algorithms, our Decision Tree gives employers complete mathematical explainability for why Candidate A was ranked above Candidate B."*
4. **Advance Candidate Through Pipeline**:
   - Click **Review Applicant** on Juan Dela Cruz.
   - Transition status from `applied` $\to$ `under_review` $\to$ `for_interview`.
   - Click **Schedule Interview**: Pick date, set venue (*Puregold Roxas Office, Public Market Complex*), and click **Confirm**.
   - Advance status to `hired`.

---

#### Act 3: PESO / LGU Municipal Administrator (PESO Roxas)
1. **Switch Role to PESO Admin**:
   - Select **PESO Roxas Administrator** (`peso.admin@roxas.gov.ph`).
2. **Employer Compliance Gatekeeping**:
   - Navigate to **Employer Verifications**.
   - Show how PESO officers audit uploaded Mayor's Business Permits, DTI registrations, and Sanitary Clearances before granting municipal posting privileges.
3. **Job Vacancy Moderation**:
   - Navigate to **Job Moderation Queue**.
   - Show new employer postings awaiting compliance verification against Roxas minimum wage regulations.
4. **Local Recruitment Activity (LRA) Coordination**:
   - Navigate to **Local Recruitment Activities (LRA)**.
   - Show the **Puregold Calapan Regional Mega Job Fair** event.
   - Point out key metrics tracked:
     - Target Quota: 50
     - Registered Roxas Applicants: 120
     - **Hired-On-The-Spot (HOTS)** count: 28 candidates!
   - *Key Presenter Statement*: *"This directly solves PESO Roxas's operational bottleneck when coordinating regional employers who visit our municipality to hire local talent."*
5. **Printable PESO Referral Slip**:
   - Navigate to **Walk-In Referrals**.
   - Open a referral slip for a walk-in resident.
   - Click **Print Official Referral Slip** (formats formal government referral with barcode, seal, and validity window).
6. **Municipal Labor Market Analytics Dashboard**:
   - Navigate to **Analytics & Reports**.
   - Show live aggregations:
     - Total Registered Seekers in Roxas
     - Active Municipal Vacancies
     - Barangay-level employment distribution (Bagumbayan, Paclasan, Dangay, San Mariano)
     - Industry demand trends.

---

## 5. Anticipated Panel Defense Questions & Technical Defenses

### Question 1: *"Why did you use a Decision Tree algorithm rather than Deep Learning, Random Forest, or an LLM like OpenAI/ChatGPT for matching?"*
> **Defense Answer**:
> *"We selected a deterministic Decision Tree for three critical academic and practical reasons:*
> 1. ***Mathematical Explainability & Fairness***: Under Philippine labor standards and non-discrimination employment laws, hiring algorithms must be transparent and explainable. A Decision Tree provides an audit trail explaining exact score components (Education, Degree, Skills, Experience, Certifications). Deep neural networks are black boxes that cannot guarantee explainability to municipal job seekers.
> 2. ***Computational Efficiency & Zero API Cost***: A Decision Tree operates at $O(\log n)$ complexity and runs locally in-browser or on lightweight servers with zero latency and zero external token fees, making it sustainable for a local government unit with limited budget.
> 3. ***Determinism & Repeatability***: Given the exact same qualifications, a Decision Tree will always yield the same ranking, preventing algorithmic hallucinations or non-deterministic variance."*

---

### Question 2: *"How does the system ensure local Roxas residents and businesses are authentic and compliant?"*
> **Defense Answer**:
> *"eHANAP implements a strict multi-tier verification gate supervised by PESO Roxas:*
> 1. *Employers must submit their BPLO Mayor's Permit number and regulatory documents. Only after a PESO officer marks the business as `verified` can their vacancies appear to job seekers.*
> 2. *Vacancies are quarantined in `pending_approval` status until PESO confirms compliance with local minimum wage laws and fair hiring guidelines.*
> 3. *For external companies recruiting in Roxas (e.g. Puregold Calapan Branch), PESO coordinates through the dedicated Local Recruitment Activity (LRA) module, ensuring municipal oversight."*

---

### Question 3: *"How does eHANAP accommodate job seekers without college degrees, such as High School graduates and Out-of-School Youth (OSY)?"*
> **Defense Answer**:
> *"eHANAP supports multi-credential ingestion:*
> 1. *While college graduates can upload PDF resumes, high school graduates and OSY can complete the structured **Bio-Data Onboarding Wizard**.*
> 2. *The Decision Tree includes dedicated node weights for **Trade & Vocational Skills** and **PESO Skill Assessment Badges**.*
> 3. *For walk-in constituents who do not own smartphones or computers, the PESO Admin portal provides a **Walk-In Encoding Desk** where officers digitize bio-data and issue physical **PESO Referral Slips**."*

---

### Question 4: *"Why did you transition from Firebase/Firestore to Supabase (PostgreSQL)?"*
> **Defense Answer**:
> *"The thesis panel specifically directed us to migrate to Supabase PostgreSQL because employment facilitation is inherently relational:*
> 1. *Job vacancies have relational foreign keys linking employers, applications, interview schedules, and audit logs.*
> 2. *PostgreSQL provides ACID compliance, strong referential integrity, and cascading deletions that prevent orphaned records.*
> 3. *Supabase provides native Row Level Security (RLS) policies at the database engine level, ensuring candidates cannot inspect other candidates' applications.*
> 4. *Supabase Realtime provides live WebSocket subscriptions for immediate job match and application status updates without polling."*

---

### Question 5: *"How is compliance with the Data Privacy Act of 2012 (Republic Act 10173) ensured?"*
> **Defense Answer**:
> *"eHANAP enforces privacy-by-design:*
> 1. *Row Level Security (RLS) ensures that candidate resumes and contact details are only accessible to employers whose vacancies the candidate applied for or matched with.*
> 2. *Administrative actions (approvals, verifications, status updates) are recorded in an immutable `audit_logs` table with timestamps and actor IDs.*
> 3. *Sensitive administrative credentials and service keys are protected in environment variables and never exposed to client-side bundles."*

---

### Question 6: *"What happens if the internet connection goes down during the defense presentation?"*
> **Defense Answer**:
> *"eHANAP is engineered with a **Resilient Dual-Persistence & Offline Fallback Layer**. If the remote Supabase connection is unreachable, the client automatically loads verified local mock data from `mockData.ts` and `pesoLguData.ts`, and stores session updates in `localStorage`. The entire Decision Tree candidate ranking engine, ATS evaluator, and multi-role dashboard run 100% client-side in the browser, guaranteeing zero downtime or presentation crashes during defense."*

---

## 6. Emergency Quick-Reference Commands

```bash
# Verify all automated tests passing
npm test

# Check TypeScript linting
npm run lint

# Build production bundle
npm run build

# Clear localStorage to reset demonstration state
# Open DevTools Console in browser and run:
# localStorage.clear(); window.location.reload();
```

---

*Prepared by BSCS IV - Group 1 (Lomboy, Escalona, Sacapaño) under the advisement of Dr. John Edgar S. Anthony for the Municipal PESO Office of Roxas, Oriental Mindoro.*

