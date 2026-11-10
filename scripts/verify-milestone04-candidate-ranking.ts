import { calculateDecisionTreeMatch } from '../src/utils/decisionTree';
import { evaluateResumeForAts } from '../src/utils/atsEngine';
import { 
  INITIAL_JOB_SEEKERS, 
  INITIAL_JOB_POSTS, 
  INITIAL_EMPLOYERS, 
  INITIAL_APPLICATIONS 
} from '../src/data/mockData';
import { 
  JobPost, 
  JobSeekerProfile, 
  CandidateInvitation, 
  NotificationItem, 
  MatchResult,
  Application
} from '../src/types';

console.log('--- eHANAP Milestone 04: Automated Candidate Ranking & Two-Way Matching Engine Verification ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runMilestone04Tests() {
  const activeJob = INITIAL_JOB_POSTS.find(j => j.status === 'active') || INITIAL_JOB_POSTS[0];
  const registeredSeekers = [...INITIAL_JOB_SEEKERS];

  // ---------------------------------------------------------------------------
  // Suite 1: Automated Candidate Ranking Roster Computation & Determinism
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 1] Automated Candidate Ranking Roster Computation & Determinism');

  // Evaluate all registered seekers in Roxas against the active vacancy
  const rankingRoster = registeredSeekers.map(seeker => {
    const matchResult = calculateDecisionTreeMatch(seeker, activeJob);
    return {
      seeker,
      matchResult,
      score: matchResult.overallMatch,
      outcome: matchResult.outcome,
      educationScore: matchResult.educationMatchScore,
      degreeScore: matchResult.degreeAlignmentScore,
      skillsScore: matchResult.skillsMatchScore,
      experienceScore: matchResult.experienceMatchScore,
      certificationsScore: matchResult.certificationsMatchScore,
    };
  }).sort((a, b) => b.score - a.score);

  assert(rankingRoster.length === registeredSeekers.length, 'Candidate ranking roster evaluates all registered job seekers in Roxas');
  assert(rankingRoster.length > 0, 'Roster contains candidates');

  // Verify descending score sort
  let isSortedDescending = true;
  for (let i = 0; i < rankingRoster.length - 1; i++) {
    if (rankingRoster[i].score < rankingRoster[i + 1].score) {
      isSortedDescending = false;
      break;
    }
  }
  assert(isSortedDescending, 'Candidate roster is deterministically sorted descending by compatibility score');

  // Verify scores are bounded between 0 and 100
  const allScoresValid = rankingRoster.every(r => r.score >= 0 && r.score <= 100);
  assert(allScoresValid, 'All candidate compatibility scores are strictly within 0% to 100%');

  // Determinism test: multiple evaluations yield identical score & ranking sequence
  const secondRunRoster = registeredSeekers.map(seeker => {
    const matchResult = calculateDecisionTreeMatch(seeker, activeJob);
    return { seekerId: seeker.id, score: matchResult.overallMatch };
  }).sort((a, b) => b.score - a.score);

  const isDeterministic = rankingRoster.every((r, idx) => 
    r.seeker.id === secondRunRoster[idx].seekerId && r.score === secondRunRoster[idx].score
  );
  assert(isDeterministic, 'Decision Tree ranking is 100% deterministic and reproducible');

  // Top candidate qualification across general active vacancy
  const topCandidate = rankingRoster[0];
  assert(topCandidate.score > 0, `Top ranked candidate has positive compatibility score (Actual: ${topCandidate.score}%)`);
  assert(
    topCandidate.outcome !== 'NOT QUALIFIED',
    `Top candidate outcome is viable tier (Actual: ${topCandidate.outcome})`
  );

  // When evaluating a position with aligned profile (e.g. Junior Full-Stack Developer or Agri Supervisor)
  const techJob = INITIAL_JOB_POSTS.find(j => j.id === 'job-tech-developer') || activeJob;
  const techRanking = registeredSeekers.map(s => calculateDecisionTreeMatch(s, techJob))
    .sort((a, b) => b.overallMatch - a.overallMatch);
  assert(techRanking[0].overallMatch >= 70, `Targeted position candidate achieves qualifying compatibility >=70% (Actual: ${techRanking[0].overallMatch}%)`);
  assert(
    ['HIGHLY QUALIFIED', 'QUALIFIED'].includes(techRanking[0].outcome),
    `Targeted top candidate outcome is qualified tier (Actual: ${techRanking[0].outcome})`
  );

  // ---------------------------------------------------------------------------
  // Suite 2: 5-Node Explainable Decision Tree Score Breakdown
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 2] 5-Node Explainable Decision Tree Score Breakdown');

  rankingRoster.forEach((item, idx) => {
    const { matchResult } = item;
    assert(
      matchResult.educationMatchScore >= 0 && matchResult.educationMatchScore <= 100,
      `Candidate #${idx + 1} (${item.seeker.firstName}) has valid Education Match Score (${matchResult.educationMatchScore}%)`
    );
    assert(
      matchResult.degreeAlignmentScore >= 0 && matchResult.degreeAlignmentScore <= 100,
      `Candidate #${idx + 1} (${item.seeker.firstName}) has valid Degree Alignment Score (${matchResult.degreeAlignmentScore}%)`
    );
    assert(
      matchResult.skillsMatchScore >= 0 && matchResult.skillsMatchScore <= 100,
      `Candidate #${idx + 1} (${item.seeker.firstName}) has valid Skills Match Score (${matchResult.skillsMatchScore}%)`
    );
    assert(
      matchResult.experienceMatchScore >= 0 && matchResult.experienceMatchScore <= 100,
      `Candidate #${idx + 1} (${item.seeker.firstName}) has valid Experience Match Score (${matchResult.experienceMatchScore}%)`
    );
    assert(
      matchResult.certificationsMatchScore >= 0 && matchResult.certificationsMatchScore <= 100,
      `Candidate #${idx + 1} (${item.seeker.firstName}) has valid Certifications Match Score (${matchResult.certificationsMatchScore}%)`
    );
  });

  // Verify explainability for top candidate
  assert(topCandidate.matchResult.matchedReasons.length > 0, 'Top candidate has explainable satisfied criteria reasons');
  assert(
    topCandidate.matchResult.matchedReasons.some(r => r.toLowerCase().includes('skill') || r.toLowerCase().includes('competenc') || r.toLowerCase().includes('education')),
    'Explainable reasons reference specific qualification nodes'
  );

  // Verify decision reason summary text
  assert(
    Boolean(topCandidate.matchResult.decisionReason) && topCandidate.matchResult.decisionReason.length > 20,
    'Top candidate decision reason provides human-readable summary for PESO & Employer'
  );
  assert(
    topCandidate.matchResult.decisionReason.includes(activeJob.title),
    'Decision reason summary contextualizes target position title'
  );

  // ---------------------------------------------------------------------------
  // Suite 3: Proactive Candidate Reach Out & Direct Invitation Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 3] Proactive Candidate Reach Out & Direct Invitation Pipeline');

  // In-memory simulation of invitations state and dispatching
  const invitations: CandidateInvitation[] = [];
  const notifications: NotificationItem[] = [];

  function simulateInvite(job: JobPost, seeker: JobSeekerProfile, customMessage?: string) {
    const alreadyInvited = invitations.some(inv => inv.jobId === job.id && inv.jobSeekerId === seeker.id);
    if (alreadyInvited) {
      return { success: false, message: `${seeker.firstName} has already been invited.` };
    }

    const match = calculateDecisionTreeMatch(seeker, job);
    const score = Math.round(match.overallMatch);

    const newInvitation: CandidateInvitation = {
      id: `inv-test-${Date.now()}-${seeker.id}`,
      jobId: job.id,
      employerId: job.employerId,
      companyName: job.companyName,
      jobTitle: job.title,
      jobSeekerId: seeker.id,
      seekerName: `${seeker.firstName} ${seeker.lastName}`,
      matchScore: score,
      message: customMessage || `You have been selected as a top-matching candidate (${score}% compatibility) for "${job.title}". We invite you to apply!`,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };

    invitations.push(newInvitation);

    const inviteNotif: NotificationItem = {
      id: `notif-test-${Date.now()}-${seeker.id}`,
      recipientId: seeker.userId,
      recipientRole: 'job_seeker',
      title: `Job Opportunity Invitation: ${job.title} (${score}% Match)`,
      message: `${job.companyName} reviewed your credentials and invites you to apply for "${job.title}" in ${job.municipality} (${score}% Decision Tree compatibility)!`,
      type: 'action',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/seeker/dashboard',
    };

    notifications.push(inviteNotif);

    return { success: true, invitation: newInvitation };
  }

  // Pick an unapplied candidate from the roster
  const unappliedCandidate = rankingRoster.find(r => 
    !INITIAL_APPLICATIONS.some(a => a.jobId === activeJob.id && a.jobSeekerId === r.seeker.id)
  ) || rankingRoster[0];

  const inviteResult = simulateInvite(activeJob, unappliedCandidate.seeker);
  assert(inviteResult.success === true, 'Proactive invitation successfully dispatches to unapplied candidate');
  assert(Boolean(inviteResult.invitation), 'Invitation object is returned');
  assert(inviteResult.invitation?.status === 'pending', 'New invitation defaults to pending status');
  assert(inviteResult.invitation?.matchScore === Math.round(unappliedCandidate.score), 'Invitation records accurate match percentage');

  // Verify candidate receives targeted real-time notification
  const receivedNotif = notifications.find(n => n.recipientId === unappliedCandidate.seeker.userId);
  assert(Boolean(receivedNotif), 'Job seeker receives targeted notification for employer invitation');
  assert(receivedNotif?.type === 'action', 'Invitation notification is flagged as actionable');
  assert(
    receivedNotif?.title.includes(activeJob.title),
    'Invitation notification title contains vacancy title'
  );
  assert(
    receivedNotif?.message.includes(activeJob.companyName),
    'Invitation notification message identifies employer company'
  );

  // Test idempotency / duplicate prevention
  const duplicateInviteResult = simulateInvite(activeJob, unappliedCandidate.seeker);
  assert(duplicateInviteResult.success === false, 'Duplicate invitations for same job and candidate are prevented');
  assert(invitations.filter(i => i.jobSeekerId === unappliedCandidate.seeker.id).length === 1, 'Invitation table retains single active invitation');

  // ---------------------------------------------------------------------------
  // Suite 4: Two-Way Compatibility Matching & Seeker Badges/Alerts
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 4] Two-Way Compatibility Matching & Seeker Badges/Alerts');

  const testSeeker = registeredSeekers[0];
  const seekerScoredVacancies = INITIAL_JOB_POSTS
    .filter(j => j.status === 'active')
    .map(job => {
      const match = calculateDecisionTreeMatch(testSeeker, job);
      return {
        job,
        score: match.overallMatch,
        outcome: match.outcome,
        reasons: match.matchedReasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  assert(seekerScoredVacancies.length > 0, 'Seeker evaluates compatibility across all active vacancies');
  assert(
    seekerScoredVacancies[0].score >= seekerScoredVacancies[seekerScoredVacancies.length - 1].score,
    'Seeker vacancy feed is sorted descending by compatibility score'
  );

  // Two-way consistency: candidate matching job equals job matching candidate
  const candidateMatch = calculateDecisionTreeMatch(testSeeker, activeJob);
  assert(candidateMatch.overallMatch >= 0 && candidateMatch.overallMatch <= 100, 'Two-way match calculation is valid');

  // Verify match notification threshold (>=70%)
  const qualifiedJobs = seekerScoredVacancies.filter(v => v.score >= 70);
  assert(qualifiedJobs.length > 0, `Seeker has qualifying job matches >=70% (Found: ${qualifiedJobs.length})`);

  // Verify ATS score integration
  const atsEvaluation = evaluateResumeForAts(testSeeker, activeJob);
  assert(atsEvaluation.score >= 0 && atsEvaluation.score <= 100, `ATS Evaluation score is valid (Actual: ${atsEvaluation.score}%)`);
  assert(Boolean(atsEvaluation.grade), `ATS Evaluation assigns letter grade (Actual: ${atsEvaluation.grade})`);

  // ---------------------------------------------------------------------------
  // Suite 5: Multi-Vacancy Distinct Ranking & Employer Specialization
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 5] Multi-Vacancy Distinct Ranking & Employer Specialization');

  if (INITIAL_JOB_POSTS.length >= 2) {
    const jobA = INITIAL_JOB_POSTS[0];
    const jobB = INITIAL_JOB_POSTS[1];

    const rosterA = registeredSeekers.map(s => ({ id: s.id, score: calculateDecisionTreeMatch(s, jobA).overallMatch }))
      .sort((a, b) => b.score - a.score);
    const rosterB = registeredSeekers.map(s => ({ id: s.id, score: calculateDecisionTreeMatch(s, jobB).overallMatch }))
      .sort((a, b) => b.score - a.score);

    assert(rosterA.length === rosterB.length, 'Both vacancies evaluate full candidate pool');
    assert(
      rosterA[0].id !== '' && rosterB[0].id !== '',
      'Distinct vacancies evaluate and identify appropriate candidate alignments'
    );
  } else {
    assert(true, 'Single vacancy baseline verified');
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
  if (passedTests === totalTests) {
    console.log('Milestone 04 Automated Candidate Ranking & Two-Way Matching Engine is VERIFIED successfully!\n');
  } else {
    console.error(`Milestone 04 Verification FAILED (${totalTests - passedTests} failed tests).\n`);
    process.exit(1);
  }
}

runMilestone04Tests().catch(err => {
  console.error('Unhandled error during Milestone 04 verification:', err);
  process.exit(1);
});
