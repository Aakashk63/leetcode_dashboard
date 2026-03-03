import React, { useState } from 'react';
import { addStudent, triggerUpdate, deleteStudent, getLeaderboard } from '../services/api';
import { UserPlus, RefreshCw, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
    const [auth, setAuth] = useState(false);
    const [password, setPassword] = useState('');

    const [formData, setFormData] = useState({ name: '', email: '', leetcodeUrl: '', batch: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [students, setStudents] = useState([]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setAuth(true);
            fetchStudents();
        } else {
            setMsg({ type: 'error', text: 'Invalid Credentials.' });
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await getLeaderboard();
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            await addStudent(formData);
            setMsg({ type: 'success', text: 'Student added successfully!' });
            setFormData({ name: '', email: '', leetcodeUrl: '', batch: '' });
            fetchStudents();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add student.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAll = async () => {
        setUpdateLoading(true);
        setMsg({ type: '', text: '' });
        try {
            const res = await triggerUpdate();
            setMsg({ type: 'success', text: res.data.message });
            fetchStudents();
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Update failed.' });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await deleteStudent(id);
                setMsg({ type: 'success', text: 'Student deleted.' });
                fetchStudents();
            } catch (err) {
                console.error(err);
                setMsg({ type: 'error', text: 'Delete failed.' });
            }
        }
    };

    if (!auth) {
        return (
            <div className="flex justify-center items-center h-96 slide-in-bottom relative z-10">
                <form onSubmit={handleLogin} className="glass-card p-10 max-w-sm w-full space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-3 mb-4">
                        <ShieldCheck size={48} className="text-accent drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-widest text-center">Admin Login</h2>
                    </div>

                    {msg.text && <div className="text-red-400 text-sm text-center flex items-center justify-center gap-1"><AlertCircle size={14} /> {msg.text}</div>}
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        className="glass-input w-full text-center tracking-widest"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-accent/20 border border-accent text-accent py-3 rounded-lg hover:bg-accent hover:text-dark transition-all font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                        AUTHORIZE
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 slide-in-bottom relative z-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-100">Admin Control Panel</h1>
                <button
                    onClick={handleUpdateAll}
                    disabled={updateLoading}
                    className="bg-blue-500/20 border border-blue-500 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] disabled:opacity-50"
                >
                    <RefreshCw size={16} className={updateLoading ? "animate-spin" : ""} />
                    {updateLoading ? 'Updating...' : 'Sync All Stats'}
                </button>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-lg font-medium border text-center ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleAdd} className="glass-card p-6 space-y-5 h-fit">
                    <div className="flex items-center gap-2 mb-2 text-accent">
                        <UserPlus size={20} />
                        <h2 className="text-lg font-bold text-slate-200">Register Student</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Full Name</label>
                            <input required type="text" className="glass-input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Email Address</label>
                            <input required type="email" className="glass-input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">LeetCode URL</label>
                            <input required type="url" placeholder="https://leetcode.com/u/username" className="glass-input w-full" value={formData.leetcodeUrl} onChange={e => setFormData({ ...formData, leetcodeUrl: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Batch / Group</label>
                            <input required type="text" placeholder="e.g., CS-2024" className="glass-input w-full" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-accent text-dark border border-accent py-3 rounded-lg hover:bg-transparent hover:text-accent transition-all font-bold mt-4 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                        {loading ? 'Processing...' : 'Add to System'}
                    </button>
                </form>

                <div className="glass-card p-6 flex flex-col h-full">
                    <h2 className="text-lg font-bold text-slate-200 mb-4 text-slate-200">Student Directory</h2>
                    <div className="overflow-y-auto pr-2 custom-scrollbar h-[400px]">
                        <ul className="space-y-2">
                            {students.map(s => (
                                <li key={s._id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                    <div>
                                        <div className="font-semibold text-slate-200 text-sm">{s.name}</div>
                                        <div className="text-xs text-slate-400">@{s.leetcodeUsername} • {s.batch}</div>
                                    </div>
                                    <button onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                            {students.length === 0 && <div className="text-center text-slate-500 py-10">No students registered.</div>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
