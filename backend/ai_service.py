import os
import json
import math
from typing import List, Dict, Any, Optional

# Load optional .env if present
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()
except ImportError:
    pass

# Try importing google.genai
GEMINI_CLIENT = None
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    try:
        from google import genai
        GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"[AI Service] Could not initialize Gemini client: {e}")


def _query_gemini_json(prompt: str, system_instruction: str = "You are an expert AI academic advisor.") -> Optional[Dict[str, Any]]:
    """Helper to query Gemini API and parse JSON response safely."""
    if not GEMINI_CLIENT:
        return None
    try:
        response = GEMINI_CLIENT.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json"
            }
        )
        if response and response.text:
            return json.loads(response.text)
    except Exception as err:
        print(f"[AI Service] Gemini call failed, falling back to deterministic engine: {err}")
    return None


def calculate_letter_grade(percentage: float) -> str:
    """Return standard academic letter grade."""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B+"
    elif percentage >= 60:
        return "B"
    elif percentage >= 50:
        return "C"
    elif percentage >= 40:
        return "D"
    return "F"


# ---------------------------------------------------------------------------
# 1. ATTENDANCE RISK EARLY WARNING SYSTEM
# ---------------------------------------------------------------------------
def calculate_attendance_risk(
    student_name: str,
    attendance_records: List[Dict[str, Any]],
    subjects_map: Dict[int, str]
) -> Dict[str, Any]:
    """
    Analyzes historical attendance logs, applies the 75% institutional cutoff model,
    calculates remediation margins, and returns comprehensive risk intelligence.
    """
    total_classes = len(attendance_records)
    attended_classes = sum(1 for r in attendance_records if r.get("status") == "Present")
    absent_classes = total_classes - attended_classes

    current_percentage = round((attended_classes / total_classes * 100), 1) if total_classes > 0 else 100.0
    threshold_percentage = 75.0

    # Subject-wise attendance calculation
    subject_counts: Dict[str, Dict[str, int]] = {}
    for rec in attendance_records:
        sub_id = rec.get("subject_id")
        sub_name = subjects_map.get(sub_id, f"Subject #{sub_id}")
        if sub_name not in subject_counts:
            subject_counts[sub_name] = {"total": 0, "present": 0}
        subject_counts[sub_name]["total"] += 1
        if rec.get("status") == "Present":
            subject_counts[sub_name]["present"] += 1

    subject_breakdown = []
    for sub_name, counts in subject_counts.items():
        sub_pct = round((counts["present"] / counts["total"] * 100), 1) if counts["total"] > 0 else 100.0
        sub_risk = "High" if sub_pct < 75.0 else ("Medium" if sub_pct < 80.0 else "Low")
        subject_breakdown.append({
            "subject": sub_name,
            "total_classes": counts["total"],
            "attended": counts["present"],
            "absent": counts["total"] - counts["present"],
            "percentage": sub_pct,
            "risk_level": sub_risk
        })

    # Sort subjects by lowest attendance first
    subject_breakdown.sort(key=lambda x: x["percentage"])

    # Determine institutional risk category
    if total_classes == 0:
        risk_level = "Low"
        status_label = "No Attendance Records Yet"
        classes_needed_for_75 = 0
        margin_of_safety = 0
    elif current_percentage >= 80.0:
        risk_level = "Low"
        status_label = "Safe — In Good Academic Standing"
        classes_needed_for_75 = 0
        # How many consecutive classes can the student miss before dipping below 75%?
        # (attended) / (total + M) >= 0.75  =>  4*attended - 3*total >= 3*M
        margin_of_safety = max(0, int((4 * attended_classes - 3 * total_classes) // 3))
    elif 75.0 <= current_percentage < 80.0:
        risk_level = "Medium"
        status_label = "Caution — Borderline (Near 75% Cutoff)"
        classes_needed_for_75 = 0
        margin_of_safety = max(0, int((4 * attended_classes - 3 * total_classes) // 3))
    else:
        risk_level = "High"
        status_label = "Critical Risk — Below 75% Minimum Requirement"
        # How many consecutive classes must the student attend without missing any to reach 75%?
        # (attended + C) / (total + C) >= 0.75  =>  0.25*C >= 0.75*total - attended  =>  C >= 3*total - 4*attended
        classes_needed_for_75 = max(1, math.ceil(3 * total_classes - 4 * attended_classes))
        margin_of_safety = 0

    # Default heuristic AI warning message and remediation steps
    if risk_level == "High":
        ai_warning = f"Urgent: {student_name}'s attendance ({current_percentage}%) is below the mandatory 75% threshold by {round(75.0 - current_percentage, 1)}%."
        remediation_steps = [
            f"Must attend the next {classes_needed_for_75} consecutive class session{'s' if classes_needed_for_75 > 1 else ''} without missing any to cross 75%.",
            f"Focus on the lowest attendance subject{'s' if len(subject_breakdown) > 1 else ''}: {', '.join([s['subject'] + ' (' + str(s['percentage']) + '%)' for s in subject_breakdown[:2]])}.",
            "Provide official medical excuses or documentation to the administrative office for excused absences.",
            "Schedule a mandatory check-in with the class coordinator to avoid exam debarment."
        ]
    elif risk_level == "Medium":
        ai_warning = f"Warning: {student_name}'s attendance is currently {current_percentage}%, which is very close to the 75% disqualification boundary."
        remediation_steps = [
            f"You only have a safety buffer of {margin_of_safety} class{'es' if margin_of_safety != 1 else ''} before falling into the critical zone.",
            "Avoid discretionary absences over the coming two weeks.",
            f"Monitor {subject_breakdown[0]['subject'] if subject_breakdown else 'all subjects'} carefully to maintain compliance."
        ]
    else:
        ai_warning = f"Excellent! {student_name} maintains consistent attendance at {current_percentage}%, well above the 75% cutoff."
        remediation_steps = [
            f"Safe buffer of {margin_of_safety} class{'es' if margin_of_safety != 1 else ''} available for unforeseen emergencies.",
            "Maintain current punctuality and engagement throughout the remainder of the academic term."
        ]

    # Try enhanced Gemini LLM analysis if API key is configured
    if GEMINI_CLIENT and total_classes > 0:
        prompt = f"""
        Student Name: {student_name}
        Total Classes: {total_classes}
        Attended: {attended_classes}
        Current Attendance Rate: {current_percentage}%
        Institutional Minimum: 75%
        Risk Level: {risk_level}
        Classes Needed for 75%: {classes_needed_for_75}
        Safety Buffer Margin: {margin_of_safety}
        Subject Breakdown: {json.dumps(subject_breakdown)}

        Provide a structured JSON output with two fields:
        "ai_warning_message": A concise, impactful diagnostic alert message (2-3 sentences).
        "remediation_steps": A list of 3-4 specific, actionable bullet points to guide the student and faculty.
        """
        gemini_result = _query_gemini_json(prompt, "You are an institutional academic retention advisor.")
        if gemini_result:
            if "ai_warning_message" in gemini_result:
                ai_warning = gemini_result["ai_warning_message"]
            if "remediation_steps" in gemini_result and isinstance(gemini_result["remediation_steps"], list):
                remediation_steps = gemini_result["remediation_steps"]

    return {
        "student_name": student_name,
        "total_classes": total_classes,
        "attended_classes": attended_classes,
        "absent_classes": absent_classes,
        "current_percentage": current_percentage,
        "threshold_percentage": threshold_percentage,
        "risk_level": risk_level,
        "status_label": status_label,
        "classes_needed_for_75": classes_needed_for_75,
        "margin_of_safety": margin_of_safety,
        "subject_breakdown": subject_breakdown,
        "ai_warning_message": ai_warning,
        "remediation_steps": remediation_steps
    }


# ---------------------------------------------------------------------------
# 2. AUTOMATED STUDY PLAN & WEAKNESS DIAGNOSTIC
# ---------------------------------------------------------------------------
def generate_study_plan(
    student_name: str,
    roll_number: str,
    grade_level: Optional[str],
    results_data: List[Dict[str, Any]],
    attendance_summary: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Diagnoses academic strengths & weaknesses from recorded scores and attendance,
    and produces an actionable 7-day personalized study timetable and learning tactics.
    """
    total_marks = sum(r.get("marks", 0) for r in results_data)
    count = len(results_data)
    average_score = round(total_marks / count, 1) if count > 0 else 0.0

    strengths = []
    moderate = []
    weak_areas = []

    for r in sorted(results_data, key=lambda x: x.get("marks", 0), reverse=True):
        sub_name = r.get("subject_name", f"Subject #{r.get('subject_id')}")
        marks = r.get("marks", 0)
        grade = calculate_letter_grade(marks)
        entry = {
            "subject": sub_name,
            "marks": marks,
            "grade": grade
        }
        if marks >= 80:
            strengths.append(entry)
        elif marks >= 60:
            moderate.append(entry)
        else:
            weak_areas.append(entry)

    # Heuristic Diagnostic Summary
    if count == 0:
        diagnosis = (
            f"{student_name} is currently registered and actively participating in coursework. "
            f"Follow the preparatory 7-day revision schedule below to establish strong study habits and prepare for upcoming evaluations."
        )
    elif weak_areas:
        weak_names = ", ".join([w["subject"] for w in weak_areas])
        diagnosis = (
            f"{student_name} demonstrates an overall average of {average_score}%, with notable proficiency in "
            f"{', '.join([s['subject'] for s in strengths]) if strengths else 'core coursework'}. "
            f"However, critical intervention is recommended in {weak_names}, which require immediate conceptual review and dedicated practice."
        )
    elif moderate:
        diagnosis = (
            f"{student_name} shows consistent foundational performance with an overall average of {average_score}%. "
            f"Targeted problem-solving exercises can elevate moderate courses to the distinction tier."
        )
    else:
        diagnosis = (
            f"Outstanding performance across all evaluated courses with a stellar average of {average_score}%. "
            f"The primary focus is advanced mastery, past-paper drills, and maintaining consistency."
        )

    # Build 7-day intelligent schedule
    # Prioritize weak areas with more hours and earlier days
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    priority_subjects = [w["subject"] for w in weak_areas] + [m["subject"] for m in moderate] + [s["subject"] for s in strengths]
    if not priority_subjects:
        priority_subjects = ["General Coursework", "Core Revision"]

    weekly_schedule = []
    for i, day in enumerate(days):
        if day == "Sunday":
            weekly_schedule.append({
                "day": day,
                "focus_subject": "Weekly Review & Self-Assessment",
                "allocated_hours": 1.5,
                "recommended_tasks": [
                    "Complete a timed 30-minute self-quiz covering the week's topics.",
                    "Organize study materials, notes, and flashcards for the upcoming week.",
                    "Light review of formula sheets and core definitions."
                ]
            })
            continue

        subj = priority_subjects[i % len(priority_subjects)]
        is_weak = any(w["subject"] == subj for w in weak_areas)
        allocated_hours = 2.5 if is_weak else 1.5

        tasks = [
            f"Review class lecture notes and textbook summaries for {subj}.",
            f"Solve {'5 challenging' if is_weak else '3 standard'} practice problems or write revision flashcards."
        ]
        if is_weak:
            tasks.append(f"Prepare a question list on {subj} doubts to discuss with the instructor.")
        else:
            tasks.append("Synthesize key takeaways into 1-page summary mind maps.")

        weekly_schedule.append({
            "day": day,
            "focus_subject": subj,
            "allocated_hours": allocated_hours,
            "recommended_tasks": tasks
        })

    study_tips = [
        "Use the Pomodoro Technique: 25 minutes of deep concentration followed by a 5-minute active rest.",
        "Active Recall: Test yourself without looking at notes instead of passive re-reading.",
        "Spaced Repetition: Revisit topics after 1 day, 3 days, and 7 days to consolidate long-term retention.",
        "The Feynman Technique: Explain tough concepts simply out loud as if teaching someone else."
    ]

    # Try Gemini LLM for deeper personalized synthesis
    if GEMINI_CLIENT and count > 0:
        prompt = f"""
        Student: {student_name} (Roll: {roll_number}, Grade: {grade_level or 'General'})
        Recorded Scores: {json.dumps(results_data)}
        Overall Average: {average_score}%
        Attendance Percentage: {attendance_summary.get('current_percentage', 100)}%
        Identified Weak Areas: {json.dumps(weak_areas)}
        Identified Strengths: {json.dumps(strengths)}

        Generate a personalized academic diagnosis and weekly study plan in JSON format with keys:
        - "diagnosis": A detailed 3-4 sentence academic diagnostic analysis.
        - "strengths_summary": A list of strings describing key strengths.
        - "growth_areas_summary": A list of strings detailing weak topics and action points.
        - "weekly_schedule": A list of 7 objects (Monday to Sunday) each containing: "day", "focus_subject", "allocated_hours" (number), "recommended_tasks" (list of strings).
        - "study_tips": A list of 4 highly practical study techniques.
        """
        gemini_result = _query_gemini_json(prompt, "You are a master academic coach and learning strategist.")
        if gemini_result:
            if "diagnosis" in gemini_result:
                diagnosis = gemini_result["diagnosis"]
            if "weekly_schedule" in gemini_result and isinstance(gemini_result["weekly_schedule"], list):
                weekly_schedule = gemini_result["weekly_schedule"]
            if "study_tips" in gemini_result and isinstance(gemini_result["study_tips"], list):
                study_tips = gemini_result["study_tips"]

    return {
        "student_name": student_name,
        "roll_number": roll_number,
        "grade_level": grade_level or "N/A",
        "average_score": average_score,
        "letter_grade": calculate_letter_grade(average_score),
        "diagnosis": diagnosis,
        "strengths": strengths,
        "moderate_areas": moderate,
        "weak_areas": weak_areas,
        "weekly_schedule": weekly_schedule,
        "study_tips": study_tips
    }


# ---------------------------------------------------------------------------
# 3. 1-CLICK AI REPORT CARD & FEEDBACK GENERATOR
# ---------------------------------------------------------------------------
def generate_report_card(
    student_name: str,
    roll_number: str,
    grade_level: Optional[str],
    results_data: List[Dict[str, Any]],
    attendance_data: Dict[str, Any],
    evaluator_name: str = "Faculty Academic Board"
) -> Dict[str, Any]:
    """
    Synthesizes academic results, attendance compliance, and behavioral patterns
    into a formal, comprehensive, professional institutional report card.
    """
    total_marks = sum(r.get("marks", 0) for r in results_data)
    count = len(results_data)
    average_score = round(total_marks / count, 1) if count > 0 else 0.0
    overall_grade = calculate_letter_grade(average_score) if count > 0 else "In Progress"

    att_pct = attendance_data.get("current_percentage", 100.0)
    att_risk = attendance_data.get("risk_level", "Low")

    # Subject breakdown
    subject_evaluations = []
    for r in results_data:
        s_name = r.get("subject_name", f"Subject #{r.get('subject_id')}")
        marks = r.get("marks", 0)
        grade = calculate_letter_grade(marks)
        if marks >= 85:
            remark = f"Exemplary command of course principles. Consistently produces high-caliber work."
        elif marks >= 70:
            remark = f"Solid understanding and consistent engagement. Shows capability for top-tier results."
        elif marks >= 50:
            remark = f"Satisfactory grasp of fundamental concepts; needs focused review in advanced problem areas."
        else:
            remark = f"Requires urgent remedial guidance and structured tutoring to bridge foundational gaps."

        subject_evaluations.append({
            "subject": s_name,
            "marks": marks,
            "grade": grade,
            "evaluator_remark": remark
        })

    if not subject_evaluations:
        subject_evaluations.append({
            "subject": "Enrolled Coursework",
            "marks": 0,
            "grade": "In Progress",
            "evaluator_remark": "Coursework in progress. Marks will be reflected upon conclusion of examinations."
        })

    # Conduct / Attendance behavioral evaluation
    if att_pct >= 90:
        conduct = "Exemplary Attendance & Punctuality"
    elif att_pct >= 75:
        conduct = "Regular Attendance — Meets Institutional Requirements"
    else:
        conduct = f"Attendance Concern ({att_pct}% vs 75% required) — Requires Administrative Rectification"

    # Executive narrative evaluation
    overall_evaluation = (
        f"{student_name} (Roll No: {roll_number}) has concluded this academic cycle with an overall aggregate of "
        f"{average_score}% ({overall_grade}). "
        f"In terms of engagement, the student has logged an attendance rate of {att_pct}%, categorized as {att_risk} risk. "
    )
    if count == 0:
        overall_evaluation += (
            f"The student is actively registered in the current term. "
            f"Regular attendance and proactive coursework engagement are encouraged throughout the session."
        )
    elif average_score >= 80:
        overall_evaluation += (
            f"The student reflects commendable intellectual curiosity and academic discipline. "
            f"Teachers commend their work ethic and encourage them to undertake elective enrichment projects."
        )
    elif average_score >= 60:
        overall_evaluation += (
            f"The student exhibits reliable competence across core curricula. With increased consistency in daily homework "
            f"and active classroom discourse, they have strong potential to attain top honors."
        )
    else:
        overall_evaluation += (
            f"The academic committee has highlighted immediate intervention points. Regular attendance and dedicated "
            f"remedial hours will be paramount to elevating their scholastic standing."
        )

    recommendations_for_parents = [
        "Establish an uninterrupted daily study block of 90 minutes at home.",
        f"Monitor attendance consistency, aiming to stay well above the 75% institutional standard.",
        "Maintain regular communication with course instructors regarding homework progress."
    ]

    action_items_for_student = [
        "Clarify doubts immediately after each lecture rather than deferring to exam week.",
        "Participate actively in collaborative group discussions and practical sessions.",
        "Utilize the personalized study schedule to balance subject preparation."
    ]

    # Gemini LLM for high-end tailored prose
    if GEMINI_CLIENT:
        prompt = f"""
        Generate a formal academic institutional report card for:
        Student Name: {student_name}
        Roll Number: {roll_number}
        Grade Level: {grade_level or 'High School'}
        Average Score: {average_score}%
        Letter Grade: {overall_grade}
        Attendance Rate: {att_pct}% (Risk: {att_risk})
        Subject Scores: {json.dumps(results_data)}
        Evaluator: {evaluator_name}

        Provide a structured JSON response with:
        - "overall_evaluation": A polished 2-paragraph formal teacher evaluation narrative.
        - "conduct_summary": A concise sentence assessing attendance and institutional deportment.
        - "subject_evaluations": A list of objects matching the subjects with "subject", "marks", "grade", "evaluator_remark" (a personalized 1-2 sentence observation).
        - "recommendations_for_parents": A list of 3 specific recommendations for parents.
        - "action_items_for_student": A list of 3 clear growth goals for the student.
        """
        gemini_result = _query_gemini_json(prompt, "You are a senior academic dean drafting official student report cards.")
        if gemini_result:
            if "overall_evaluation" in gemini_result:
                overall_evaluation = gemini_result["overall_evaluation"]
            if "conduct_summary" in gemini_result:
                conduct = gemini_result["conduct_summary"]
            if "subject_evaluations" in gemini_result and isinstance(gemini_result["subject_evaluations"], list):
                subject_evaluations = gemini_result["subject_evaluations"]
            if "recommendations_for_parents" in gemini_result and isinstance(gemini_result["recommendations_for_parents"], list):
                recommendations_for_parents = gemini_result["recommendations_for_parents"]
            if "action_items_for_student" in gemini_result and isinstance(gemini_result["action_items_for_student"], list):
                action_items_for_student = gemini_result["action_items_for_student"]

    return {
        "student_name": student_name,
        "roll_number": roll_number,
        "grade_level": grade_level or "General",
        "average_score": average_score,
        "overall_grade": overall_grade,
        "conduct_and_attendance": conduct,
        "overall_evaluation": overall_evaluation,
        "subject_evaluations": subject_evaluations,
        "recommendations_for_parents": recommendations_for_parents,
        "action_items_for_student": action_items_for_student,
        "evaluator_name": evaluator_name
    }
