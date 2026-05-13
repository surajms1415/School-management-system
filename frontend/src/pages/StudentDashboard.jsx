import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaChartBar } from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const studentLinks = [
    { name: 'My Dashboard', path: '/student', icon: FaChartBar },
  ];

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const getSubjectName = (id) => {
    const sub = subjects.find(s => s.id === id);
    return sub ? sub.name : 'Unknown';
  };

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  return (
    <DashboardLayout role="Student" links={studentLinks}>
      <div className="flex flex-col h-full space-y-6">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl p-8 shadow-lg text-white flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Welcome back, {profile?.username || 'Student'}!</h1>
            <p className="text-cyan-100">Keep up the great work this semester.</p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <FaUser className="text-4xl text-white" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
          {/* Attendance Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Attendance Log</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${attendancePercentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {attendancePercentage}% Overall
              </span>
            </div>
            <div className="flex-1 overflow-auto pr-2 space-y-3">
              {attendance.map((record, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  key={record.id} 
                  className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="font-bold text-white">{getSubjectName(record.subject_id)}</p>
                    <p className="text-xs text-slate-400">{record.date}</p>
                  </div>
                  <span className={`font-black text-sm px-4 py-1.5 rounded-xl ${record.status === 'Present' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {record.status}
                  </span>
                </motion.div>
              ))}
              {attendance.length === 0 && <p className="text-slate-400 text-center mt-10">No attendance records found.</p>}
            </div>
          </div>
          
          {/* Results Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Academic Results</h2>
            <div className="flex-1 overflow-auto pr-2 space-y-4">
              {results.map((result, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  key={result.id} 
                  className="p-5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-white text-lg">{getSubjectName(result.subject_id)}</span>
                    <span className="font-black text-cyan-400 text-xl">{result.marks}<span className="text-sm text-slate-500">/100</span></span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${result.marks}%` }}></div>
                  </div>
                </motion.div>
              ))}
              {results.length === 0 && <p className="text-slate-400 text-center mt-10">No results found.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
