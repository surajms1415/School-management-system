import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

export default function Home() {
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, translateY: -10, transition: { duration: 0.4, type: "spring" } }
  };

  // Generate random particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 300 + 50,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic Animated Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-90 z-0"></div>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen filter blur-[100px] opacity-40"
            style={{
              width: particle.size,
              height: particle.size,
              background: particle.id % 2 === 0 ? '#4f46e5' : particle.id % 3 === 0 ? '#9333ea' : '#06b6d4',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              x: [0, Math.random() * 400 - 200, 0],
              y: [0, Math.random() * 400 - 200, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="z-10 text-center mb-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/50 transform rotate-12"
        >
          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center -rotate-12 backdrop-blur-sm border border-white/20">
             <span className="text-4xl font-extrabold text-white">E</span>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 mb-6 tracking-tighter"
        >
          EduCore
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto px-4 font-light"
        >
          The next-generation intelligence platform. Select your portal.
        </motion.p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-7xl w-full">
        {/* Admin Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/admin-login')}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 cursor-pointer shadow-2xl group"
        >
          <div className="bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/20">
            <FaUserShield className="text-4xl text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Admin</h2>
          <p className="text-slate-400 text-sm leading-relaxed">System configuration, user management, and operational analytics.</p>
        </motion.div>

        {/* Teacher Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/teacher-login')}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 cursor-pointer shadow-2xl group"
        >
          <div className="bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20">
            <FaChalkboardTeacher className="text-4xl text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Teacher</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Classroom management, grading, and attendance tracking.</p>
        </motion.div>

        {/* Student Card */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: 0.6 }}
          onClick={() => navigate('/student-login')}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 cursor-pointer shadow-2xl group"
        >
          <div className="bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border border-cyan-500/20">
            <FaUserGraduate className="text-4xl text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Student</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Personal dashboard, academic records, and performance metrics.</p>
        </motion.div>
      </div>
    </div>
  );
}
