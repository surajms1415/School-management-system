import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClipboardCheck, FaFileAlt, FaCheck, FaTimes, FaRobot, 
  FaExclamationTriangle, FaCheckCircle, FaPrint, FaSearch, 
  FaStar, FaGraduationCap, FaUserGraduate 
} from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [riskOverview, setRiskOverview] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  // AI Report Card Modal State
  const [reportCardModal, setReportCardModal] = useState(false);
  const [activeReportCard, setActiveReportCard] = useState(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  
  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher', icon: FaClipboardCheck },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [studRes, subRes] = await Promise.all([
        api.get('/students/'),
        api.get('/subjects/')
      ]);
      setStudents(studRes.data);
      setSubjects(subRes.data);
      if (subRes.data.length > 0) setSelectedSubject(subRes.data[0].id);

      // Fetch AI attendance risk overview
      try {
        const riskRes = await api.get('/ai/attendance-risk-overview/');
        const riskMap = {};
        riskRes.data.forEach(r => {
          riskMap[r.student_id] = r;
        });
        setRiskOverview(riskMap);
      } catch (e) {
        console.warn('Could not load attendance risk overview:', e);
      }
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      await api.post('/attendance/', {
        student_id: studentId,
        subject_id: selectedSubject,
        date: new Date().toISOString().split('T')[0],
        status: status
      });
      alert(`Marked ${status} for student ID: ${studentId}`);
      // Refresh risk overview in background
      api.get('/ai/attendance-risk-overview/').then(res => {
        const riskMap = {};
        res.data.forEach(r => { riskMap[r.student_id] = r; });
        setRiskOverview(riskMap);
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      alert('Failed to mark attendance.');
    }
  };

  const uploadMarks = async (studentId) => {
    const marks = prompt('Enter marks for this subject (out of 100):');
    if (!marks || isNaN(marks)) return;
    try {
      await api.post('/results/', {
        student_id: studentId,
        subject_id: selectedSubject,
        marks: parseFloat(marks)
      });
      alert('Marks uploaded successfully!');
    } catch (err) {
      alert('Failed to upload marks.');
    }
  };

  // 1-Click AI Report Card & Feedback Generator
  const generateReportCard = async (studentId) => {
    setLoadingReportCard(true);
    setReportCardModal(true);
    setActiveReportCard(null);
    try {
      const res = await api.get(`/ai/report-card/${studentId}`);
      setActiveReportCard(res.data);
    } catch (err) {
      console.error('Failed to generate report card:', err);
      alert('Failed to generate AI report card. Please ensure the backend is active.');
      setReportCardModal(false);
    } finally {
      setLoadingReportCard(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    const studentRisk = riskOverview[student.id]?.risk_level || 'Low';
    const matchesRisk = filterRisk === 'ALL' || studentRisk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <DashboardLayout role="Teacher" links={teacherLinks}>
      <div className="flex flex-col h-full space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Classroom Management & AI Co-Pilot
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Mark attendance, manage course grades, monitor attendance risks, and generate 1-click AI report cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Selector */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
              <span className="text-xs font-semibold text-slate-300 mr-2 uppercase tracking-wider">Active Subject:</span>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent font-bold text-cyan-300 focus:outline-none cursor-pointer text-sm"
              >
                {subjects.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>)}
              </select>
            </div>

            {/* Attendance Risk Filter */}
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 flex items-center gap-1.5">
              <span className="text-xs text-slate-300 font-semibold px-2">Risk:</span>
              <button 
                onClick={() => setFilterRisk('ALL')}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${filterRisk === 'ALL' ? 'bg-white/20 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterRisk('High')}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${filterRisk === 'High' ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'text-red-400 hover:text-red-300'}`}
              >
                Critical (&lt;75%)
              </button>
              <button 
                onClick={() => setFilterRisk('Medium')}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${filterRisk === 'Medium' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-amber-400 hover:text-amber-300'}`}
              >
                Caution (75-80%)
              </button>
              <button 
                onClick={() => setFilterRisk('Low')}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${filterRisk === 'Low' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                Safe (≥80%)
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search students by name or roll number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 backdrop-blur-md"
          />
        </div>

        {/* Student Roster Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex-1 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Attendance Risk Early Warning</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-center">Mark Attendance</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-300 uppercase tracking-wider text-right">Academics & AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student) => {
                  const risk = riskOverview[student.id];
                  const riskLevel = risk?.risk_level || 'Low';
                  const pct = risk?.current_percentage !== undefined ? `${risk.current_percentage}%` : 'N/A';
                  
                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-cyan-500/20">
                            {student.name[0]}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">{student.name}</span>
                            <span className="text-xs text-slate-400">{student.grade_level || 'Grade N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-300 font-mono font-medium">{student.roll_number}</td>
                      
                      {/* Attendance Risk Early Warning Column */}
                      <td className="px-6 py-5">
                        {risk ? (
                          <div className="inline-flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              riskLevel === 'High'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : riskLevel === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {riskLevel === 'High' && <FaExclamationTriangle className="text-xs" />}
                              {riskLevel === 'Low' && <FaCheckCircle className="text-xs" />}
                              {pct} • {riskLevel === 'High' ? 'Critical' : riskLevel === 'Medium' ? 'Caution' : 'Safe'}
                            </span>
                            {riskLevel === 'High' && risk.classes_needed_for_75 > 0 && (
                              <span className="text-[11px] text-red-400 font-medium pl-1">
                                Needs {risk.classes_needed_for_75} consecutive class{risk.classes_needed_for_75 > 1 ? 'es' : ''} to reach 75%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Calculating...</span>
                        )}
                      </td>

                      {/* Attendance Action Buttons */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => markAttendance(student.id, 'Present')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs transition-colors border border-emerald-500/30"
                          >
                            <FaCheck /> Present
                          </button>
                          <button 
                            onClick={() => markAttendance(student.id, 'Absent')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold text-xs transition-colors border border-red-500/30"
                          >
                            <FaTimes /> Absent
                          </button>
                        </div>
                      </td>

                      {/* Actions: Upload Marks + 1-Click AI Report Card */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => uploadMarks(student.id)} 
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
                            title="Upload marks for this subject"
                          >
                            <FaFileAlt /> Marks
                          </button>
                          
                          {/* 1-Click AI Report Card Button */}
                          <button 
                            onClick={() => generateReportCard(student.id)} 
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/30 border border-purple-400/30"
                            title="Generate comprehensive AI report card"
                          >
                            <FaRobot className="text-cyan-300" /> AI Report Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-slate-400">
                      No students found matching your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Report Card Modal */}
        <AnimatePresence>
          {reportCardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col text-white"
              >
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <FaGraduationCap className="text-xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Institutional Academic Report Card</h3>
                      <p className="text-xs text-slate-400">AI-Synthesized Performance & Evaluation Matrix</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeReportCard && (
                      <button 
                        onClick={() => window.print()}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors text-sm"
                        title="Print Report Card"
                      >
                        <FaPrint />
                      </button>
                    )}
                    <button 
                      onClick={() => setReportCardModal(false)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors text-sm"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto space-y-6 flex-1">
                  {loadingReportCard ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
                      <p className="text-slate-300 text-sm font-semibold">Synthesizing academic records & generating AI feedback...</p>
                    </div>
                  ) : activeReportCard ? (
                    <>
                      {/* Top Summary Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Student Name</p>
                          <p className="text-base font-extrabold text-white mt-0.5">{activeReportCard.student_name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Roll: {activeReportCard.roll_number}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Overall GPA</p>
                          <p className="text-2xl font-black text-cyan-400 mt-0.5">{activeReportCard.average_score}%</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Letter Grade</p>
                          <span className="inline-block mt-1 px-3 py-0.5 rounded-lg bg-purple-500/30 text-purple-300 font-black text-lg border border-purple-500/40">
                            {activeReportCard.overall_grade}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">Conduct / Attendance</p>
                          <p className="text-xs font-semibold text-slate-300 mt-1 leading-snug">{activeReportCard.conduct_and_attendance}</p>
                        </div>
                      </div>

                      {/* Executive Teacher Remarks */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <FaRobot /> Official Academic Narrative
                        </h4>
                        <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                          {activeReportCard.overall_evaluation}
                        </div>
                      </div>

                      {/* Course by Course Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Course-Specific Observations</h4>
                        <div className="space-y-2.5">
                          {activeReportCard.subject_evaluations?.map((sub, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{sub.subject}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono font-bold">
                                    {sub.marks}/100 ({sub.grade})
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 leading-normal">{sub.evaluator_remark}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations for Parents & Growth Goals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Recommendations for Parents</h4>
                          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                            {activeReportCard.recommendations_for_parents?.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Growth Targets for Student</h4>
                          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                            {activeReportCard.action_items_for_student?.map((act, i) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                  <button 
                    onClick={() => setReportCardModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
