import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './components/Leaderboard';
import StudentDetail from './components/StudentDetail';
import Analytics from './components/Analytics';
import AdminDashboard from './components/AdminDashboard';
import { loginUser } from './services/api';
import { Rocket, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';

const Header = ({ setIsAuthenticated }) => {
  const role = localStorage.getItem('role');
  const isSuperAdmin = role === 'super_admin';
  const isMentor = role === 'mentor';

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <nav className="w-full relative z-40 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className={`flex items-center space-x-3 transition-transform hover:scale-105 group p-1 ${isSuperAdmin ? 'text-blue-500' : 'text-accent'}`}>
          <Rocket size={26} className={`${isSuperAdmin ? 'text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-accent drop-shadow-[0_0_10px_rgba(255,59,59,0.8)]'} group-hover:animate-pulse-fast`} />
          <h1 className="text-2xl md:text-3xl font-black tracking-widest text-white uppercase italic drop-shadow-lg">
            CHAMPIONS<span className={isSuperAdmin ? 'text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-accent drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]'}>ARENA</span>
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <Link to="/admin" className="px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase transition-all flex items-center gap-2 bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              <ShieldCheck size={16} /> Master Control
            </Link>
          )}
          {isMentor && (
            <Link to="/admin" className="px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase transition-all flex items-center gap-2 bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]">
              <ShieldCheck size={16} /> Mentor Control
            </Link>
          )}
          <Link to="/analytics" className={`px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase transition-all flex items-center gap-2 ${isSuperAdmin ? 'bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'bg-accent/10 border border-accent/40 text-white hover:bg-accent/20 hover:border-accent hover:shadow-[0_0_20px_rgba(255,59,59,0.6)]'}`}>
            <div className={`w-2 h-2 rounded-full hidden sm:block ${isSuperAdmin ? 'bg-blue-500 animate-pulse-fast shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-accent animate-pulse-fast shadow-[0_0_8px_rgba(255,59,59,1)]'}`}></div>
            Progress
          </Link>
          <button onClick={handleLogout} className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-full transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isMaster, setIsMaster] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0B1220] slide-in-bottom relative z-10 font-sans">
      <button
        onClick={() => setIsMaster(!isMaster)}
        className="absolute top-6 right-6 px-4 py-2 border text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer border-slate-700 text-slate-400 hover:text-white hover:border-white"
      >
        {isMaster ? 'Mentor Login' : 'Master Control'}
      </button>

      <div className={`absolute top-0 left-1/2 min-w-[800px] h-[400px] blur-[150px] -translate-x-1/2 pointer-events-none rounded-full ${isMaster ? 'bg-blue-500/10' : 'bg-accent/5'}`}></div>

      <form onSubmit={handleLogin} className={`glass-card p-10 max-w-sm w-full space-y-6 bg-darker/60 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl relative z-20 ${isMaster ? 'glass-card-hover-blue' : 'glass-card-hover-red'}`}>
        <div className="flex flex-col items-center justify-center space-y-3 mb-4">
          <ShieldCheck size={48} className={isMaster ? 'text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-accent drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]'} />
          <h2 className={`text-2xl font-bold uppercase tracking-widest text-center ${isMaster ? 'text-blue-400' : 'text-slate-100'}`}>
            {isMaster ? 'Master Control' : 'Mentor Login'}
          </h2>
        </div>

        {error && <div className="text-red-400 text-sm text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {error}</div>}

        <input type="email" placeholder={isMaster ? "Admin Email" : "Mentor Email"} required className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none transition-colors shadow-inner text-center ${isMaster ? 'focus:border-blue-500' : 'focus:border-accent'}`} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required className={`w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none transition-colors shadow-inner text-center ${isMaster ? 'focus:border-blue-500' : 'focus:border-accent'}`} value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" className={`w-full py-3 rounded-lg font-bold tracking-widest transition-all ${isMaster ? 'bg-blue-500/20 text-blue-400 border border-blue-500 hover:bg-blue-500 hover:text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-accent/20 border border-accent text-accent hover:bg-accent hover:text-dark shadow-[0_0_10px_rgba(255,59,59,0.3)]'}`}>
          {isMaster ? 'INITIALIZE SYSTEM' : 'ACCESS ARENA'}
        </button>
      </form>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <Router>
      <div className={`bg-blobs ${localStorage.getItem('role') === 'super_admin' ? 'bg-blobs-blue' : ''}`}></div>
      <div className="min-h-screen flex flex-col relative z-0">
        <Header setIsAuthenticated={setIsAuthenticated} />
        <div className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/student/:username" element={<StudentDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
