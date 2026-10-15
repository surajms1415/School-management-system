import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaChartBar, FaCalendarAlt, FaExclamationTriangle, 
  FaCheckCircle, FaBook, FaClock, FaLightbulb, FaRobot, 
  FaPrint, FaGraduationCap, FaChevronRight 
} from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import { calculateAttendanceRisk, generateStudyPlan, generateReportCard } from '../utils/aiGenerator';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'study-plan' | 'report-card'
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // AI State
  const [attendanceRisk, setAttendanceRisk] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const studentLinks = [
    { name: 'My Dashboard', path: '/student', icon: FaChartBar },
  ];

  useEffect(() => {
    fetchCoreData();
  }, []);

  const fetchCoreData = async () => {
    try {
      const [profRes, attRes, resRes, subRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/my-attendance/'),
        api.get('/my-results/'),
        api.get('/subjects/')
      ]);
      setProfile(profRes.data);
      setAttendance(attRes.data);
      setResults(resRes.data);
      setSubjects(subRes.data);

      const subMap = {};
      (subRes.data || []).forEach(s => { subMap[s.id] = s.name; });

      // Fetch AI Attendance Risk with client fallback
      try {
        const riskRes = await api.get('/ai/attendance-risk/');
        setAttendanceRisk(riskRes.data);
      } catch (e) {
        console.warn('Backend /ai/attendance-risk/ unreachable, computing client early-warning model:', e);
        const fallbackRisk = calculateAttendanceRisk(profRes.data?.username || 'Student', attRes.data || [], subMap);
        setAttendanceRisk(fallbackRisk);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  const loadStudyPlan = async () => {
    setActiveTab('study-plan');
    if (!studyPlan) {
      setLoadingAI(true);
      try {
        const res = await api.get('/ai/study-plan/');
        setStudyPlan(res.data);
      } catch (err) {
        console.warn('Backend /ai/study-plan/ unavailable, generating tailored client study plan:', err);
        const subMap = {};
        subjects.forEach(s => { subMap[s.id] = s.name; });
        const resultsData = results.map(r => ({
          subject_id: r.subject_id,
          subject_name: subMap[r.subject_id] || `Subject #${r.subject_id}`,
          marks: r.marks
        }));
        const currentRisk = attendanceRisk || calculateAttendanceRisk(profile?.username, attendance, subMap);
        const generated = generateStudyPlan(
          profile?.username || 'Student',
          profile?.username || 'N/A',
          'Enrolled Student',
          resultsData,
          currentRisk
        );
        setStudyPlan(generated);
      } finally {
        setLoadingAI(false);
      }
    }
  };

  const loadReportCard = async () => {
    setActiveTab('report-card');
    if (!reportCard) {
      setLoadingAI(true);
      try {
        const res = await api.get('/ai/my-report-card/');
        setReportCard(res.data);
      } catch (err) {
        console.warn('Backend /ai/my-report-card/ unavailable, synthesizing official client report card:', err);
        const subMap = {};
        subjects.forEach(s => { subMap[s.id] = s.name; });
        const resultsData = results.map(r => ({
          subject_id: r.subject_id,
          subject_name: subMap[r.subject_id] || `Subject #${r.subject_id}`,
          marks: r.marks
        }));
        const currentRisk = attendanceRisk || calculateAttendanceRisk(profile?.username, attendance, subMap);
        const generated = generateReportCard(
          profile?.username || 'Student',
          profile?.username || 'N/A',
          'Enrolled Student',
          resultsData,
          currentRisk,
          'Academic Board'
        );
        setReportCard(generated);
      } finally {
        setLoadingAI(false);
      }
    }
  };

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id === id);
    return sub ? sub.name : `Subject #${id}`;
  };

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 100 : Math.round((presentClasses / totalClasses) * 100);

  const riskLevel = attendanceRisk?.risk_level || (attendancePercentage >= 80 ? 'Low' : (attendancePercentage >= 75 ? 'Medium' : 'High'));

  return (
    <DashboardLayout role="Student" links={studentLinks}>
      <div className="flex flex-col h-full space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-cyan-100">
              Student Academic Hub
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-2 mb-1">
              Welcome back, {profile?.username || 'Student'}!
            </h1>
            <p className="text-cyan-100 text-sm max-w-xl">
              Track your daily attendance, monitor eligibility cutoffs, and access AI-generated study timetables and official evaluations.
            </p>
          </div>

          {/* Navigation Tab Pills */}
          <div className="relative z-10 flex flex-wrap gap-2 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              Overview
            </button>
            <button 
              onClick={loadStudyPlan}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'study-plan' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <FaRobot className="text-cyan-400" /> AI Study Plan
            </button>
            <button 
              onClick={loadReportCard}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'report-card' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <FaGraduationCap className="text-cyan-400" /> AI Report Card
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & ATTENDANCE RISK EARLY WARNING          */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 flex-1 overflow-auto">
            {/* ATTENDANCE RISK EARLY WARNING CARD */}
            <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl ${
              riskLevel === 'High' 
                ? 'bg-red-950/40 border-red-500/30 text-white' 
                : riskLevel === 'Medium' 
                ? 'bg-amber-950/40 border-amber-500/30 text-white' 
                : 'bg-emerald-950/30 border-emerald-500/30 text-white'
            }`}>
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
                    riskLevel === 'High' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : riskLevel === 'Medium' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {riskLevel === 'High' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                      Attendance Risk Early Warning System
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        riskLevel === 'High' 
                          ? 'bg-red-500 text-white' 
                          : riskLevel === 'Medium' 
                          ? 'bg-amber-500 text-slate-900' 
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {riskLevel === 'High' ? 'Critical Debarment Risk' : riskLevel === 'Medium' ? 'Caution — Near Cutoff' : 'Safe Standing'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Minimum institutional exam eligibility threshold: <strong className="text-white">75.0%</strong>
                    </p>
                  </div>
                </div>

                {/* Metric Summary */}
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Current Attendance</span>
                    <span className={`text-3xl font-black ${
                      riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {attendanceRisk?.current_percentage ?? attendancePercentage}%
                    </span>
                  </div>
                  <div className="border-l border-white/10 pl-6">
                    <span className="text-xs text-slate-400 block font-semibold">Status Action</span>
                    {riskLevel === 'High' ? (
                      <span className="text-sm font-bold text-red-300">
                        Attend next {attendanceRisk?.classes_needed_for_75 || 1} classes consecutively
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-emerald-300">
                        Buffer: {attendanceRisk?.margin_of_safety || 0} class allowance
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Warning & Remediation Steps */}
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <FaRobot /> AI Diagnostic Assessment
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                    {attendanceRisk?.ai_warning_message || (
                      riskLevel === 'High'
                        ? 'Your current attendance has dipped below 75%. You are at risk of institutional debarment.'
                        : 'Attendance compliance is on track. Continue attending scheduled lectures consistently.'
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Recommended Action Steps
                  </p>
                  <ul className="text-xs text-slate-200 space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/10">
                    {attendanceRisk?.remediation_steps ? (
                      attendanceRisk.remediation_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))
                    ) : (
                      <li>Maintain consistent daily attendance across all classes.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Split Grids: Logs & Academic Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Log */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col">
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <h2 className="text-lg font-bold text-white">Daily Attendance Records</h2>
                  <span className="text-xs text-slate-400 font-mono">
                    {presentClasses} / {totalClasses} Classes Present
                  </span>
                </div>
                <div className="flex-1 overflow-auto max-h-80 pr-2 space-y-2.5">
                  {attendance.map((record, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      key={record.id} 
                      className="flex justify-between items-center p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{getSubjectName(record.subject_id)}</p>
                        <p className="text-xs text-slate-400">{record.date}</p>
                      </div>
                      <span className={`font-black text-xs px-3 py-1 rounded-xl ${
                        record.status === 'Present' 
                          ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30' 
                          : 'text-red-300 bg-red-500/20 border border-red-500/30'
                      }`}>
                        {record.status}
                      </span>
                    </motion.div>
                  ))}
                  {attendance.length === 0 && <p className="text-slate-400 text-center py-10">No attendance records logged.</p>}
                </div>
              </div>

              {/* Academic Results */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col">
                <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
                  <h2 className="text-lg font-bold text-white">Academic Results</h2>
                  <button 
                    onClick={loadStudyPlan}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    View AI Study Plan <FaChevronRight className="text-[10px]" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto max-h-80 pr-2 space-y-3.5">
                  {results.map((result, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      key={result.id} 
                      className="p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white text-sm">{getSubjectName(result.subject_id)}</span>
                        <span className="font-black text-cyan-400 text-base">{result.marks}<span className="text-xs text-slate-400">/100</span></span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            result.marks >= 80 ? 'bg-emerald-400' : result.marks >= 60 ? 'bg-cyan-400' : 'bg-red-400'
                          }`} 
                          style={{ width: `${result.marks}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                  {results.length === 0 && <p className="text-slate-400 text-center py-10">No results recorded yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: AUTOMATED STUDY PLAN & WEAKNESS DIAGNOSTIC        */}
        {/* ======================================================== */}
        {activeTab === 'study-plan' && (
          <div className="space-y-6 flex-1 overflow-auto">
            {loadingAI ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                <p className="text-slate-300 text-sm font-semibold">Generating your tailored 7-Day Study Schedule & Diagnostic...</p>
              </div>
            ) : studyPlan ? (
              <>
                {/* Diagnostic Overview Card */}
                <div className="p-7 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <FaRobot /> AI Academic Diagnostic
                      </span>
                      <h2 className="text-2xl font-black text-white mt-1">Personalized Performance Analysis</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-semibold block">Overall Average</span>
                        <span className="text-2xl font-black text-cyan-400">{studyPlan.average_score}%</span>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/30 text-purple-300 font-black text-xl border border-purple-500/40">
                        {studyPlan.letter_grade}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {studyPlan.diagnosis}
                  </p>

                  {/* Strengths & Weak Areas Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">Key Strengths</span>
                      <div className="flex flex-wrap gap-2">
                        {studyPlan.strengths?.length > 0 ? (
                          studyPlan.strengths.map((s, i) => (
                            <span key={i} className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                              {s.subject} ({s.marks}/100)
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Continue building fundamentals.</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-2">Priority Focus Areas</span>
                      <div className="flex flex-wrap gap-2">
                        {studyPlan.weak_areas?.length > 0 ? (
                          studyPlan.weak_areas.map((w, i) => (
                            <span key={i} className="px-3 py-1 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                              {w.subject} ({w.marks}/100)
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-300">All evaluated courses meet high standards!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-DAY INTERACTIVE TIMETABLE */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <FaCalendarAlt className="text-cyan-400" /> 7-Day Intelligent Revision Timetable
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {studyPlan.weekly_schedule?.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">{item.day}</span>
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-300 font-mono">
                              <FaClock className="text-[10px]" /> {item.allocated_hours} hrs
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-white mb-2">{item.focus_subject}</h4>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                            {item.recommended_tasks?.map((task, tIdx) => (
                              <li key={tIdx} className="leading-snug">{task}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Cognitive Study Tips */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <FaLightbulb /> Proven Cognitive Study Tactics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {studyPlan.study_tips?.map((tip, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200 leading-normal">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white/5 rounded-3xl border border-white/10 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-3xl border border-cyan-500/30">
                  <FaRobot />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">7-Day AI Study Plan Ready</h3>
                  <p className="text-sm text-slate-400 max-w-md mt-1">
                    Generate your tailored revision timetable and academic performance diagnosis.
                  </p>
                </div>
                <button
                  onClick={loadStudyPlan}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  Generate Study Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: OFFICIAL AI REPORT CARD                           */}
        {/* ======================================================== */}
        {activeTab === 'report-card' && (
          <div className="space-y-6 flex-1 overflow-auto">
            {loadingAI ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
                <p className="text-slate-300 text-sm font-semibold">Compiling your official institutional report card...</p>
              </div>
            ) : reportCard ? (
              <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-6 max-w-4xl mx-auto text-white">
                <div className="flex justify-between items-center border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg">
                      <FaGraduationCap />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Official Academic Report Card</h2>
                      <p className="text-xs text-slate-400">Institutional Evaluation & Progress Record</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/15"
                  >
                    <FaPrint /> Print / Export
                  </button>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Student</span>
                    <span className="text-base font-extrabold text-white">{reportCard.student_name}</span>
                    <span className="text-xs text-slate-400 font-mono block">Roll: {reportCard.roll_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Grade Average</span>
                    <span className="text-2xl font-black text-cyan-400">{reportCard.average_score}%</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Letter Grade</span>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-lg bg-purple-500/30 text-purple-300 font-black text-lg border border-purple-500/40">
                      {reportCard.overall_grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Attendance Rating</span>
                    <span className="text-xs font-semibold text-slate-300 mt-1 block leading-snug">{reportCard.conduct_and_attendance}</span>
                  </div>
                </div>

                {/* Narrative Assessment */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Faculty Academic Narrative</h4>
                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {reportCard.overall_evaluation}
                  </div>
                </div>

                {/* Course by Course */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Course-Specific Results & Feedback</h4>
                  <div className="space-y-2.5">
                    {reportCard.subject_evaluations?.map((sub, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{sub.subject}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono font-bold">
                              {sub.marks}/100 ({sub.grade})
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{sub.evaluator_remark}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Recommendations for Parents</h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {reportCard.recommendations_for_parents?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Student Growth Targets</h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {reportCard.action_items_for_student?.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white/5 rounded-3xl border border-white/10 p-8 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-3xl border border-purple-500/30">
                  <FaGraduationCap />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Official AI Report Card</h3>
                  <p className="text-sm text-slate-400 max-w-md mt-1">
                    Synthesize grades, attendance standing, and personalized faculty evaluations.
                  </p>
                </div>
                <button
                  onClick={loadReportCard}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Generate Report Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
