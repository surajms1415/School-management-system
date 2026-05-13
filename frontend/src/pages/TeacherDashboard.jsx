import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClipboardCheck, FaFileAlt, FaCheck, FaTimes } from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher', icon: FaClipboardCheck },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studRes, subRes] = await Promise.all([
          api.get('/students/'),
          api.get('/subjects/')
        ]);
        setStudents(studRes.data);
        setSubjects(subRes.data);
        if (subRes.data.length > 0) setSelectedSubject(subRes.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const markAttendance = async (studentId, status) => {
    try {
      await api.post('/attendance/', {
        student_id: studentId,
        subject_id: selectedSubject,
        date: new Date().toISOString().split('T')[0],
        status: status
      });
      alert(`Marked ${status} for student ID: ${studentId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to mark attendance.");
    }
  };

  const uploadMarks = async (studentId) => {
    const marks = prompt("Enter marks for this subject (out of 100):");
    if (!marks || isNaN(marks)) return;
    try {
      await api.post('/results/', {
        student_id: studentId,
        subject_id: selectedSubject,
        marks: parseFloat(marks)
      });
      alert("Marks uploaded successfully!");
    } catch (err) {
      alert("Failed to upload marks.");
    }
  };

  return (
    <DashboardLayout role="Teacher" links={teacherLinks}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Classroom Management</h2>
            <p className="text-slate-500 text-sm mt-1">Mark daily attendance and upload results.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <span className="text-sm font-semibold text-slate-500 mr-2">Select Subject:</span>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Mark Attendance</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Academics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-200/50">
                          {student.name[0]}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">{student.roll_number}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => markAttendance(student.id, 'Present')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-semibold text-xs transition-colors border border-green-200">
                          <FaCheck /> Present
                        </button>
                        <button onClick={() => markAttendance(student.id, 'Absent')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs transition-colors border border-red-200">
                          <FaTimes /> Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => uploadMarks(student.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg">
                        <FaFileAlt /> Upload Marks
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-500">No students available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
