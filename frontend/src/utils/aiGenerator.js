/**
 * Client-Side Academic AI Intelligence Engine
 * 
 * Provides robust fallback heuristics and generative synthesis for:
 * 1. Attendance Risk & Exam Debarment Early Warning System
 * 2. 7-Day Personalized Study Schedule & Weakness Diagnostic
 * 3. Official 1-Click Institutional AI Report Card & Parent Recommendations
 *
 * Ensures full resilience when cloud backend instances are sleeping, restarting,
 * or have not yet deployed the AI suite.
 */

export function calculateLetterGrade(score) {
  if (score === null || score === undefined || isNaN(score)) return 'N/A';
  const val = parseFloat(score);
  if (val >= 90) return 'A+';
  if (val >= 80) return 'A';
  if (val >= 70) return 'B+';
  if (val >= 60) return 'B';
  if (val >= 50) return 'C';
  if (val >= 40) return 'D';
  return 'F';
}

export function calculateAttendanceRisk(studentName, attendanceRecords = [], subjectsMap = {}) {
  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter(r => r && (r.status === 'Present' || r.status === 'present')).length;
  const absentClasses = totalClasses - attendedClasses;

  const currentPercentage = totalClasses > 0 
    ? Math.round((attendedClasses / totalClasses) * 1000) / 10 
    : 100.0;
  const thresholdPercentage = 75.0;

  // Subject breakdown
  const subjectCounts = {};
  attendanceRecords.forEach(rec => {
    if (!rec) return;
    const subId = rec.subject_id;
    const subName = subjectsMap[subId] || (rec.subject_name || `Subject #${subId}`);
    if (!subjectCounts[subName]) {
      subjectCounts[subName] = { total: 0, present: 0 };
    }
    subjectCounts[subName].total += 1;
    if (rec.status === 'Present' || rec.status === 'present') {
      subjectCounts[subName].present += 1;
    }
  });

  const subjectBreakdown = Object.entries(subjectCounts).map(([subject, counts]) => {
    const pct = counts.total > 0 ? Math.round((counts.present / counts.total) * 1000) / 10 : 100.0;
    const risk = pct < 75.0 ? 'High' : (pct < 80.0 ? 'Medium' : 'Low');
    return {
      subject,
      total_classes: counts.total,
      attended: counts.present,
      absent: counts.total - counts.present,
      percentage: pct,
      risk_level: risk
    };
  });
  subjectBreakdown.sort((a, b) => a.percentage - b.percentage);

  let riskLevel = 'Low';
  let statusLabel = 'Safe — In Good Academic Standing';
  let classesNeededFor75 = 0;
  let marginOfSafety = 0;

  if (totalClasses === 0) {
    riskLevel = 'Low';
    statusLabel = 'No Attendance Records Yet';
    classesNeededFor75 = 0;
    marginOfSafety = 0;
  } else if (currentPercentage >= 80.0) {
    riskLevel = 'Low';
    statusLabel = 'Safe — In Good Academic Standing';
    classesNeededFor75 = 0;
    marginOfSafety = Math.max(0, Math.floor((4 * attendedClasses - 3 * totalClasses) / 3));
  } else if (currentPercentage >= 75.0) {
    riskLevel = 'Medium';
    statusLabel = 'Caution — Borderline (Near 75% Cutoff)';
    classesNeededFor75 = 0;
    marginOfSafety = Math.max(0, Math.floor((4 * attendedClasses - 3 * totalClasses) / 3));
  } else {
    riskLevel = 'High';
    statusLabel = 'Critical Risk — Below 75% Minimum Requirement';
    classesNeededFor75 = Math.max(1, Math.ceil(3 * totalClasses - 4 * attendedClasses));
    marginOfSafety = 0;
  }

  let aiWarning = `Excellent! ${studentName || 'Student'} maintains steady attendance at ${currentPercentage}%, safely clearing institutional thresholds.`;
  let remediationSteps = [
    `Buffer of ${marginOfSafety} class allowance available for unforeseen emergencies.`,
    'Maintain daily punctuality and class engagement through the term.'
  ];

  if (riskLevel === 'High') {
    aiWarning = `Urgent: ${studentName || 'Student'}'s attendance (${currentPercentage}%) is below the mandatory 75% cutoff by ${(75.0 - currentPercentage).toFixed(1)}%.`;
    remediationSteps = [
      `Must attend the next ${classesNeededFor75} consecutive class session${classesNeededFor75 > 1 ? 's' : ''} without absence to restore eligibility.`,
      subjectBreakdown.length > 0 
        ? `Focus on lower-attendance course: ${subjectBreakdown[0].subject} (${subjectBreakdown[0].percentage}%).`
        : 'Prioritize attending all upcoming lectures.',
      'Submit verified medical excuses for prior unexcused absences to administration.',
      'Check in with class coordinator to ensure exam eligibility clearance.'
    ];
  } else if (riskLevel === 'Medium') {
    aiWarning = `Notice: Attendance is currently ${currentPercentage}%, nearing the 75% institutional barrier.`;
    remediationSteps = [
      `Safety buffer is limited to ${marginOfSafety} class${marginOfSafety !== 1 ? 'es' : ''} before falling into the critical zone.`,
      'Avoid discretionary absences over the coming two weeks.',
      'Regularly monitor subject-wise attendance logs.'
    ];
  }

  return {
    student_name: studentName,
    total_classes: totalClasses,
    attended_classes: attendedClasses,
    absent_classes: absentClasses,
    current_percentage: currentPercentage,
    threshold_percentage: thresholdPercentage,
    risk_level: riskLevel,
    status_label: statusLabel,
    classes_needed_for_75: classesNeededFor75,
    margin_of_safety: marginOfSafety,
    subject_breakdown: subjectBreakdown,
    ai_warning_message: aiWarning,
    remediation_steps: remediationSteps
  };
}

export function generateStudyPlan(studentName, rollNumber, gradeLevel, resultsData = [], attendanceSummary = null) {
  const count = resultsData.length;
  const totalMarks = resultsData.reduce((sum, r) => sum + (parseFloat(r.marks) || 0), 0);
  const averageScore = count > 0 ? Math.round((totalMarks / count) * 10) / 10 : 0.0;
  const letterGrade = count > 0 ? calculateLetterGrade(averageScore) : 'Active';

  const strengths = [];
  const moderateAreas = [];
  const weakAreas = [];

  const sortedResults = [...resultsData].sort((a, b) => (parseFloat(b.marks) || 0) - (parseFloat(a.marks) || 0));

  sortedResults.forEach(r => {
    const marks = parseFloat(r.marks) || 0;
    const subName = r.subject_name || `Subject #${r.subject_id}`;
    const grade = calculateLetterGrade(marks);
    const entry = { subject: subName, marks, grade };

    if (marks >= 80) {
      strengths.push(entry);
    } else if (marks >= 60) {
      moderateAreas.push(entry);
    } else {
      weakAreas.push(entry);
    }
  });

  let diagnosis = '';
  if (count === 0) {
    diagnosis = `${studentName || 'Student'} (Roll No: ${rollNumber || 'N/A'}) is currently enrolled in ongoing coursework. Follow the structured 7-day revision schedule below to establish strong subject fundamentals and prepare for upcoming evaluations.`;
  } else if (weakAreas.length > 0) {
    const weakList = weakAreas.map(w => w.subject).join(', ');
    const strList = strengths.length > 0 ? strengths.map(s => s.subject).join(', ') : 'foundational modules';
    diagnosis = `${studentName || 'Student'} shows an overall academic score of ${averageScore}%, displaying solid proficiency in ${strList}. However, focused intervention is strongly recommended in ${weakList} to reinforce essential concepts and elevate test readiness.`;
  } else if (moderateAreas.length > 0) {
    diagnosis = `${studentName || 'Student'} maintains steady academic consistency with an average of ${averageScore}%. Targeted problem-solving drills in moderate areas can readily advance performance to the distinction tier.`;
  } else {
    diagnosis = `Outstanding academic mastery across all evaluated subjects with a stellar aggregate of ${averageScore}%. The primary objective is advanced elective enrichment, past-paper timed drills, and long-term retention.`;
  }

  // Build 7-day schedule
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const prioritySubjects = [
    ...weakAreas.map(w => w.subject),
    ...moderateAreas.map(m => m.subject),
    ...strengths.map(s => s.subject)
  ];
  if (prioritySubjects.length === 0) {
    prioritySubjects.push('Core Subject Review', 'Practice Problems', 'Foundational Reading');
  }

  const weeklySchedule = days.map((day, i) => {
    if (day === 'Sunday') {
      return {
        day: 'Sunday',
        focus_subject: 'Weekly Review & Self-Assessment',
        allocated_hours: 1.5,
        recommended_tasks: [
          'Take a timed 30-minute self-quiz covering topics learned throughout the week.',
          'Organize notes, revision cue cards, and flashcards for the upcoming week.',
          'Review formula sheets, core theorems, and chapter summaries.'
        ]
      };
    }

    const subj = prioritySubjects[i % prioritySubjects.length];
    const isWeak = weakAreas.some(w => w.subject === subj);
    const allocatedHours = isWeak ? 2.5 : 1.5;

    const tasks = [
      `Review key lecture notes, slides, and textbook chapters for ${subj}.`,
      `Solve ${isWeak ? '5 challenging conceptual' : '3 standard'} practice problems.`
    ];

    if (isWeak) {
      tasks.push(`Draft a targeted question list on difficult ${subj} topics to clarify with faculty.`);
    } else {
      tasks.push(`Create a 1-page summary mind-map synthesizing core takeaways.`);
    }

    return {
      day,
      focus_subject: subj,
      allocated_hours: allocatedHours,
      recommended_tasks: tasks
    };
  });

  const studyTips = [
    'Pomodoro Technique: Work in focused 25-minute intervals followed by 5-minute active recovery.',
    'Active Recall: Quiz yourself from memory rather than passively rereading highlighted notes.',
    'Spaced Repetition: Review tough topics at 1-day, 3-day, and 7-day intervals to lock in long-term memory.',
    'Feynman Technique: Teach complex concepts out loud in simple, plain language to spot gaps.'
  ];

  return {
    student_name: studentName,
    roll_number: rollNumber,
    grade_level: gradeLevel || 'N/A',
    average_score: averageScore,
    letter_grade: letterGrade,
    diagnosis,
    strengths,
    moderate_areas: moderateAreas,
    weak_areas: weakAreas,
    weekly_schedule: weeklySchedule,
    study_tips: studyTips
  };
}

export function generateReportCard(studentName, rollNumber, gradeLevel, resultsData = [], attendanceData = null, evaluatorName = 'Academic Faculty Board') {
  const count = resultsData.length;
  const totalMarks = resultsData.reduce((sum, r) => sum + (parseFloat(r.marks) || 0), 0);
  const averageScore = count > 0 ? Math.round((totalMarks / count) * 10) / 10 : 0.0;
  const overallGrade = count > 0 ? calculateLetterGrade(averageScore) : 'In Progress';

  const attPct = attendanceData?.current_percentage ?? 100.0;
  const attRisk = attendanceData?.risk_level ?? 'Low';

  let conduct = 'Regular Attendance — Meets Institutional Standards';
  if (attPct >= 90) conduct = 'Exemplary Attendance & Punctuality';
  else if (attPct < 75) conduct = `Attendance Concern (${attPct}% vs 75% required) — Requires Remediation`;

  const subjectEvaluations = resultsData.map(r => {
    const marks = parseFloat(r.marks) || 0;
    const subName = r.subject_name || `Subject #${r.subject_id}`;
    const grade = calculateLetterGrade(marks);

    let remark = 'Satisfactory grasp of fundamental concepts; needs focused review in advanced problem areas.';
    if (marks >= 85) remark = 'Exemplary command of course principles. Consistently produces high-caliber academic work.';
    else if (marks >= 70) remark = 'Solid understanding and consistent engagement. Shows potential for distinction tier.';
    else if (marks < 50) remark = 'Requires urgent remedial guidance and structured practice to bridge foundational gaps.';

    return {
      subject: subName,
      marks,
      grade,
      evaluator_remark: remark
    };
  });

  if (subjectEvaluations.length === 0) {
    subjectEvaluations.push({
      subject: 'Enrolled Coursework',
      marks: 0,
      grade: 'In Progress',
      evaluator_remark: 'Course evaluation in progress. Scores will reflect upon completion of upcoming term assessments.'
    });
  }

  let overallEvaluation = `${studentName || 'Student'} (Roll No: ${rollNumber || 'N/A'}) has concluded this academic cycle with an overall average of ${averageScore}% (${overallGrade}). Attendance stands at ${attPct}%, categorised as ${attRisk} risk standing.\n\n`;
  if (count === 0) {
    overallEvaluation += 'The student is actively registered in the current term. Ongoing participation and timely assignment submission are encouraged to achieve strong academic outcomes.';
  } else if (averageScore >= 80) {
    overallEvaluation += 'The student reflects commendable intellectual curiosity and academic discipline. Teachers commend their work ethic and encourage them to pursue elective honors and academic projects.';
  } else if (averageScore >= 60) {
    overallEvaluation += 'The student exhibits reliable competence across core curricula. With increased consistency in daily homework and active classroom discourse, they possess strong potential to attain top honors.';
  } else {
    overallEvaluation += 'The academic committee has highlighted immediate intervention points. Regular attendance and dedicated remedial study hours will be paramount to elevating scholastic standing.';
  }

  const recommendationsForParents = [
    'Establish an uninterrupted daily study block of 90 minutes at home.',
    'Monitor weekly attendance consistency, aiming to keep attendance comfortably above the 75% threshold.',
    'Maintain regular communication with course instructors regarding academic progress.'
  ];

  const actionItemsForStudent = [
    'Clarify doubts immediately after each lecture rather than deferring to exam week.',
    'Participate actively in collaborative group discussions and practical sessions.',
    'Utilize the personalized study schedule to balance subject preparation.'
  ];

  return {
    student_name: studentName,
    roll_number: rollNumber,
    grade_level: gradeLevel || 'General',
    average_score: averageScore,
    overall_grade: overallGrade,
    conduct_and_attendance: conduct,
    overall_evaluation: overallEvaluation,
    subject_evaluations: subjectEvaluations,
    recommendations_for_parents: recommendationsForParents,
    action_items_for_student: actionItemsForStudent,
    evaluator_name: evaluatorName
  };
}
