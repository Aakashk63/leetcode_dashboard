import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './components/Leaderboard';
import StudentDetail from './components/StudentDetail';
import Analytics from './components/Analytics';
import AdminDashboard from './components/AdminDashboard';
import { loginUser } from './services/api';
import { Rocket, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';

const Header = ({ setIsAuthenticated }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <nav className="w-full relative z-40 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 text-accent transition-transform hover:scale-105 group p-1">
          <Rocket size={26} className="text-accent drop-shadow-[0_0_10px_rgba(255,59,59,0.8)] group-hover:animate-pulse-fast" />
          <h1 className="text-2xl md:text-3xl font-black tracking-widest text-white uppercase italic drop-shadow-lg">
            CHAMPIONS<span className="text-accent drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]">ARENA</span>
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/analytics" className="px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase transition-all bg-accent/10 border border-accent/40 text-white hover:bg-accent/20 hover:border-accent hover:shadow-[0_0_20px_rgba(255,59,59,0.6)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-fast hidden sm:block shadow-[0_0_8px_rgba(255,59,59,1)]"></div>
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0B1220] slide-in-bottom relative z-10 font-sans">
      <div className="absolute top-0 left-1/2 min-w-[800px] h-[400px] bg-accent/5 blur-[150px] -translate-x-1/2 pointer-events-none rounded-full"></div>
      <form onSubmit={handleLogin} className="glass-card p-10 max-w-sm w-full space-y-6 bg-darker/60 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl relative z-20">
        <div className="flex flex-col items-center justify-center space-y-3 mb-4">
          <ShieldCheck size={48} className="text-accent drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]" />
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-widest text-center">Mentor Login</h2>
        </div>
        {error && <div className="text-red-400 text-sm text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {error}</div>}
        <input type="email" placeholder="Mentor Email" required className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-accent transition-colors shadow-inner text-center" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-accent transition-colors shadow-inner text-center" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full bg-accent/20 border border-accent text-accent py-3 rounded-lg hover:bg-accent hover:text-dark transition-all font-bold shadow-[0_0_10px_rgba(255,59,59,0.3)] hover:shadow-[0_0_20px_rgba(255,59,59,0.6)] tracking-widest">
          ACCESS ARENA
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
      <div className="bg-blobs"></div>
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
