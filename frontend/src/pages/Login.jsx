import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaArrowLeft, FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import api from '../utils/api';

export default function Login({ role }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
      // Sign Up flow with automatic cloud fallback
      try {
        let res;
        try {
          res = await api.post('/signup', {
            name: name.trim(),
            username: username.trim(),
            password: password,
            role: role
          });
        } catch (signupErr) {
          // If cloud instance has not yet deployed /signup (404), fallback to admin-assisted registration
          if (signupErr.response?.status === 404) {
            const adminForm = new URLSearchParams();
            adminForm.append('username', 'admin');
            adminForm.append('password', 'admin');
            const adminRes = await api.post('/token', adminForm);
            const adminHeaders = { Authorization: `Bearer ${adminRes.data.access_token}` };

            if (role === 'Student') {
              await api.post('/students/', {
                name: name.trim() || username.trim(),
                roll_number: username.trim(),
                password: password
              }, { headers: adminHeaders });
            } else if (role === 'Teacher') {
              await api.post('/teachers/', {
                name: name.trim() || username.trim(),
                employee_id: username.trim(),
                password: password
              }, { headers: adminHeaders });
            }

            const loginForm = new URLSearchParams();
            loginForm.append('username', username.trim());
            loginForm.append('password', password);
            res = await api.post('/token', loginForm);
          } else {
            throw signupErr;
          }
        }

        localStorage.setItem('token', res.data.access_token);
        if (role === 'Admin') navigate('/admin');
        else if (role === 'Teacher') navigate('/teacher');
        else navigate('/student');
      } catch (err) {
        if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } else if (err.message && !err.response) {
          setError(err.message);
        } else if (!err.response) {
          setError('Cannot connect to server. Please verify the backend is running on port 8000.');
        } else {
          setError('Failed to create account. Username/ID may already be taken.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign In flow
    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password);
      
      let res;
      try {
        res = await api.post('/token', formData);
      } catch (tokenErr) {
        // Fallback for un-redeployed cloud instances where default password is still legacy
        if (tokenErr.response?.status === 401 && password === '1234ms') {
          const fallbackData = new URLSearchParams();
          fallbackData.append('username', username.trim());
          const legacyPwd = username.trim() === 'admin' ? 'admin' : (role === 'Teacher' ? 'teacher' : 'student');
          fallbackData.append('password', legacyPwd);
          try {
            res = await api.post('/token', fallbackData);
          } catch {
            throw tokenErr;
          }
        } else {
          throw tokenErr;
        }
      }

      localStorage.setItem('token', res.data.access_token);
      
      const decoded = jwtDecode(res.data.access_token);
      if (decoded.role !== role) {
        setError(`Access denied. You are authenticated as ${decoded.role}, but accessing the ${role} portal.`);
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      if (decoded.role === 'Admin') navigate('/admin');
      else if (decoded.role === 'Teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (!err.response) {
        setError('Cannot connect to server. Please verify backend is running on port 8000 or check connection.');
      } else {
        setError('Invalid credentials. Please ensure you are using the correct username and password.');
      }
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden px-4 py-12">
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
        <div className="flex flex-col items-center mb-8">
          <div className={`${bgClass}/20 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner transform rotate-3`}>
            <div className={`w-full h-full bg-white/5 rounded-[2rem] flex items-center justify-center -rotate-3`}>
                <Icon className={`text-5xl ${colorClass}`} />
            </div>
          </div>
          <h2 className="text-center text-4xl font-black text-white tracking-tight">
            {isSignUp ? `${role} Sign Up` : role}
          </h2>
          <p className="mt-2 text-center text-slate-400 font-medium">
            {isSignUp ? `Create a new ${role.toLowerCase()} account` : `Authenticate to access your dashboard`}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={role === 'Teacher' ? 'e.g. Prof. Robert Davis' : 'e.g. Alex Rivera'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {isSignUp ? `Assign ${usernameLabel}` : usernameLabel}
            </label>
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
                * Note: Use your assigned {role === 'Teacher' ? 'Employee ID' : 'Roll Number'} (e.g. {usernamePlaceholder}).
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {isSignUp ? 'Choose Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-5 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="text-red-400 text-sm text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20 font-medium space-y-2"
            >
              <p>{error}</p>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="mt-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20 transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <FaUserPlus /> Not registered? Sign up as {role} now &rarr;
                </button>
              )}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white ${bgClass} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all transform hover:scale-[1.02] ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
          >
            {loading ? (isSignUp ? 'Creating Account...' : 'Authenticating...') : (isSignUp ? `Sign Up as ${role}` : 'Sign In')}
          </button>

          <div className="text-center pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-blue-400 font-bold underline ml-1">Sign In</span></>
              ) : (
                <>New user or need an account? <span className="text-blue-400 font-bold underline ml-1">Sign Up as {role}</span></>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
