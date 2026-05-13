import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt, FaBell, FaSearch } from 'react-icons/fa';

export default function DashboardLayout({ children, role, links }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden font-sans relative">
      {/* Dynamic Animated Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-90 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute top-3/4 left-1/2 w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-2xl relative z-20"
          >
            <div className="h-16 flex items-center px-6 border-b border-white/10">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Edu<span className="text-blue-400">Core</span>
              </h1>
            </div>

            <div className="p-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-8 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                  {role[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Welcome</p>
                  <p className="text-xs text-slate-400 font-medium">{role} Portal</p>
                </div>
              </div>

              <nav className="space-y-1">
                {links.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-blue-500/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <link.icon className={`text-xl ${isActive ? 'text-blue-400 drop-shadow-md' : 'text-slate-500'}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-500/20"
              >
                <FaSignOutAlt className="text-lg" />
                <span className="font-semibold">Logout Session</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 bg-white/5 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white focus:outline-none p-2.5 rounded-xl hover:bg-white/10 transition-all bg-white/5 border border-white/5"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="hidden md:flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all shadow-inner">
              <FaSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none focus:outline-none ml-3 text-sm text-white placeholder-slate-500 w-72"
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative p-2.5 text-slate-400 hover:text-white transition-all rounded-xl hover:bg-white/10 bg-white/5 border border-white/5">
              <FaBell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
