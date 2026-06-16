import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const [isDark, setIsDark] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        result = await register(name, email, password);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex relative transition-colors duration-500`} style={{ background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)' }}>
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-3 rounded-full transition-colors shadow-lg ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative overflow-hidden">
        {/* Animated background circles perfectly centered behind branding */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`absolute w-[600px] h-[600px] rounded-full blur-2xl ${isDark ? 'opacity-20' : 'opacity-[0.08]'}`} style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)' }} />
          <div className={`absolute w-[400px] h-[400px] rounded-full blur-xl ${isDark ? 'opacity-20' : 'opacity-[0.05]'}`} style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 60%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
            <GraduationCap size={40} className="text-white drop-shadow-md" />
          </div>
          <h1 className={`text-5xl font-extrabold mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Student<span style={{ color: '#06b6d4' }}>Hub</span>
          </h1>
          <p className={`text-lg max-w-md leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Advanced Student Performance Analytics Platform for Universities
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'ML Analytics', value: '8+' },
              { label: 'Report Types', value: '6' },
              { label: 'Real-time KPIs', value: '9' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-extrabold" style={{ color: isDark ? '#22d3ee' : '#0284c7' }}>{stat.value}</p>
                <p className={`text-xs mt-1 uppercase tracking-wider font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">StudentHub</h1>
          </div>

          {/* Form Card */}
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} backdrop-blur-xl border rounded-2xl p-8 shadow-2xl`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                {isRegister ? 'Sign up to get your own analytics workspace' : 'Sign in to your analytics dashboard'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Full Name</label>
                  <div className="relative">
                    <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium ${
                        isDark ? 'text-white placeholder-slate-400 bg-white/5 border-white/10' : 'text-slate-900 placeholder-slate-400 bg-slate-50 border-slate-200'
                      }`}
                      style={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Email</label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium ${
                      isDark ? 'text-white placeholder-slate-400 bg-white/5 border-white/10' : 'text-slate-900 placeholder-slate-400 bg-slate-50 border-slate-200'
                    }`}
                    style={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Password</label>
                <div className="relative">
                  <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium ${
                      isDark ? 'text-white placeholder-slate-400 bg-white/5 border-white/10' : 'text-slate-900 placeholder-slate-400 bg-slate-50 border-slate-200'
                    }`}
                    style={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/25"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className={`ml-1 font-bold transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 p-3 rounded-lg"
                style={{ 
                  background: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)', 
                  border: isDark ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid rgba(6, 182, 212, 0.2)'
                }}
              >
                <Sparkles size={14} className={isDark ? "text-cyan-400 flex-shrink-0" : "text-cyan-600 flex-shrink-0"} style={{ color: isDark ? '#22d3ee' : '#0284c7' }} />
                <p className="text-xs font-semibold" style={{ color: isDark ? '#cffafe' : '#164e63' }}>
                  New accounts start with a demo dataset of 300 students. You can replace it with your own data anytime.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
