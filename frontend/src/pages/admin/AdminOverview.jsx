import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaChalkboardTeacher, FaBookOpen } from 'react-icons/fa';
import api from '../../utils/api';

export default function AdminOverview() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, subjects: 0, attendanceCount: 0, resultsCount: 0 });
  const [recentStudents, setRecentStudents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, teachersRes, subjectsRes, attendanceRes, resultsRes] = await Promise.all([
          api.get('/students/').catch(err => { console.error("Error fetching students:", err); return { data: [] }; }),
          api.get('/teachers/').catch(err => { console.error("Error fetching teachers:", err); return { data: [] }; }),
          api.get('/subjects/').catch(err => { console.error("Error fetching subjects:", err); return { data: [] }; }),
          api.get('/attendance/').catch(err => { console.error("Error fetching attendance:", err); return { data: [] }; }),
          api.get('/results/').catch(err => { console.error("Error fetching results:", err); return { data: [] }; })
        ]);
        
        const studentsData = studentsRes.data;
        setStats({
          students: studentsData.length,
          teachers: teachersRes.data.length,
          subjects: subjectsRes.data.length,
          attendanceCount: attendanceRes.data.length,
          resultsCount: resultsRes.data.length
        });
        
        // Get the 4 most recently added students (assuming higher ID means more recent)
        const sortedStudents = [...studentsData].sort((a, b) => b.id - a.id).slice(0, 4);
        setRecentStudents(sortedStudents);
      } catch (err) {
        console.error("Error fetching overview stats", err);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, bgGradient, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`rounded-3xl p-8 shadow-lg ${bgGradient} text-white flex items-center justify-between hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="relative z-10">
        <p className="text-white/80 text-lg font-medium tracking-wide mb-1">{title}</p>
        <h3 className="text-6xl font-extrabold tracking-tight">{value}</h3>
      </div>
      <div className="relative z-10 w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
        <Icon className="text-4xl text-white" />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 h-full flex flex-col pt-4">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 text-lg mt-2 font-medium">Here is the current status of your institution.</p>
        </div>
      </div>

      {/* Large Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          icon={FaUserGraduate} 
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={0.1} 
        />
        <StatCard 
          title="Total Teachers" 
          value={stats.teachers} 
          icon={FaChalkboardTeacher} 
          bgGradient="bg-gradient-to-br from-purple-500 to-purple-700"
          delay={0.2} 
        />
        <StatCard 
          title="Total Subjects" 
          value={stats.subjects} 
          icon={FaBookOpen} 
          bgGradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          delay={0.3} 
        />
      </div>

      {/* Dynamic Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Students Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl"
        >
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Recently Enrolled Students</h3>
          <div className="space-y-4">
            {recentStudents.length > 0 ? recentStudents.map((student, i) => (
              <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-[0_0_8px_currentColor]">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-bold">{student.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Roll No: {student.roll_number} | Grade: {student.grade_level || 'N/A'}</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic py-4">No students enrolled yet.</p>
            )}
          </div>
        </motion.div>

        {/* Database Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col"
        >
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Database Records</h3>
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">Attendance Records Tracked</span>
                <span className="text-blue-400 font-bold">{stats.attendanceCount}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 border border-white/10">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: `${Math.min(100, (stats.attendanceCount / 100) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">Academic Results Processed</span>
                <span className="text-purple-400 font-bold">{stats.resultsCount}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 border border-white/10">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${Math.min(100, (stats.resultsCount / 50) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">Total Registered Users</span>
                <span className="text-green-400 font-bold">{stats.students + stats.teachers + 1}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 border border-white/10">
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
