import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaArrowLeft } from 'react-icons/fa';
import api from '../utils/api';

export default function Login({ role }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await api.post('/token', formData);
      localStorage.setItem('token', res.data.access_token);
      
      const decoded = jwtDecode(res.data.access_token);
      if (decoded.role !== role) {
        setError(`Access denied. You are not an ${role}.`);
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      if (decoded.role === 'Admin') navigate('/admin');
      else if (decoded.role === 'Teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError('Invalid credentials. Please ensure you are using the correct ID/Roll Number.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = role === 'Admin' ? FaUserShield : role === 'Teacher' ? FaChalkboardTeacher : FaUserGraduate;
  const colorClass = role === 'Admin' ? 'text-blue-400' : role === 'Teacher' ? 'text-purple-400' : 'text-cyan-400';
  const bgClass = role === 'Admin' ? 'bg-blue-600' : role === 'Teacher' ? 'bg-purple-600' : 'bg-cyan-600';
  
  // Custom placeholders to make it extremely clear what the "username" actually is
  const usernameLabel = role === 'Admin' ? 'Admin Username' : role === 'Teacher' ? 'Teacher Employee ID' : 'Student Roll Number';
  const usernamePlaceholder = role === 'Admin' ? 'e.g. admin' : role === 'Teacher' ? 'e.g. EMP-101' : 'e.g. CS-2024';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background matches Home Page for seamless transition */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-90 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="absolute top-8 left-8 z-20">
        <button 
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
        >
          <FaArrowLeft /> Back to Portal
        </button>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-800/50 backdrop-blur-2xl border border-slate-700 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className={`${bgClass}/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner transform rotate-3`}>
            <div className={`w-full h-full bg-white/5 rounded-[2rem] flex items-center justify-center -rotate-3`}>
                <Icon className={`text-5xl ${colorClass}`} />
            </div>
          </div>
          <h2 className="text-center text-4xl font-black text-white tracking-tight">
            {role}
          </h2>
          <p className="mt-2 text-center text-slate-400 font-medium">
            Authenticate to access your dashboard
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">{usernameLabel}</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {role !== 'Admin' && (
              <p className="text-xs text-slate-500 mt-2">
                * Note: Do not use your name. Use your assigned {role === 'Teacher' ? 'Employee ID' : 'Roll Number'}.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-medium"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white ${bgClass} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all transform hover:scale-[1.02] ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
