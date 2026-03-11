import React, { useState, useEffect } from 'react';
import { addStudent, triggerUpdate, deleteStudent, getLeaderboard, addMentor, getMentors, updateStudent } from '../services/api';
import { UserPlus, RefreshCw, Trash2, ShieldCheck, AlertCircle, FilePlus, Edit3, X, Save, User } from 'lucide-react';

const AdminDashboard = () => {
    const role = localStorage.getItem('role');
    const isSuperAdmin = role === 'super_admin';

    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState([]);

    // Mentor Form State
    const [mentorForm, setMentorForm] = useState({ email: '', password: '', display: '', sheet: null });

    // Student Form State (Add/Edit)
    const [formData, setFormData] = useState({ name: '', email: '', leetcodeUrl: '', batch: '', mentorEmail: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
        if (isSuperAdmin) fetchMentors();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await getLeaderboard();
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMentors = async () => {
        try {
            const res = await getMentors();
            setMentors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddMentor = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const mData = new FormData();
            mData.append('email', mentorForm.email);
            mData.append('password', mentorForm.password);
            mData.append('display', mentorForm.display);
            mData.append('sheet', mentorForm.sheet);

            await addMentor(mData);
            setMsg({ type: 'success', text: 'Mentor successfully created and bulk upload started!' });
            setMentorForm({ email: '', password: '', display: '', sheet: null });

            if (isSuperAdmin) fetchMentors();
            setTimeout(() => { fetchStudents(); }, 3000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add mentor.' });
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

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            if (editingId) {
                await updateStudent(editingId, formData);
                setMsg({ type: 'success', text: 'Student profile updated successfully!' });
                setEditingId(null);
            } else {
                await addStudent(formData);
                setMsg({ type: 'success', text: 'Student added successfully!' });
            }
            setFormData({ name: '', email: '', leetcodeUrl: '', batch: '', mentorEmail: '' });
            fetchStudents();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to process student.' });
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (student) => {
        setEditingId(student._id);
        setFormData({
            name: student.name,
            email: student.email || '',
            leetcodeUrl: student.leetcodeUrl || `https://leetcode.com/u/${student.leetcodeUsername}/`,
            batch: student.batch || '',
            mentorEmail: student.mentorEmail || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', email: '', leetcodeUrl: '', batch: '', mentorEmail: '' });
    };

    if (!isSuperAdmin && role !== 'mentor') {
        return (
            <div className="flex justify-center items-center h-96 slide-in-bottom relative z-10 text-red-500 font-bold tracking-widest uppercase">
                ERROR: Unauthorized Access.
            </div>
        );
    }

    return (
        <div className="space-y-8 slide-in-bottom relative z-10 mb-20">
            <div className="flex justify-between items-center">
                <h1 className={`text-2xl font-bold tracking-widest uppercase ${isSuperAdmin ? 'text-blue-400' : 'text-purple-400'}`}>
                    {isSuperAdmin ? 'Master Control Panel' : 'Mentor Control Panel'}
                </h1>
                <button
                    onClick={handleUpdateAll}
                    disabled={updateLoading}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs disabled:opacity-50 ${isSuperAdmin ? 'bg-blue-500/20 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-purple-500/20 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]'}`}
                >
                    <RefreshCw size={16} className={updateLoading ? "animate-spin" : ""} />
                    {updateLoading ? 'Updating...' : 'Force Sync System'}
                </button>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-lg font-bold tracking-widest text-xs border text-center uppercase ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : (isSuperAdmin ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-green-500/10 border-green-500/50 text-green-400')}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* Student Add/Update Form */}
                    <form onSubmit={handleStudentSubmit} className={`glass-card p-6 space-y-5 h-fit bg-[#0B1220]/50 border-white/10 transition-colors shadow-2xl relative ${isSuperAdmin ? 'glass-card-hover-blue hover:border-blue-500/20' : 'glass-card-hover-red hover:border-accent/20'}`}>
                        {editingId && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                        <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center gap-2 ${editingId ? 'text-yellow-400' : (isSuperAdmin ? 'text-blue-400' : 'text-purple-400')} drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]`}>
                                {editingId ? <Edit3 size={24} /> : <UserPlus size={24} />}
                                <h2 className="text-lg font-bold text-slate-100 tracking-wider">
                                    {editingId ? 'Update Student Profile' : 'Add New Student'}
                                </h2>
                            </div>
                            {editingId && (
                                <button type="button" onClick={cancelEdit} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Student Name</label>
                                <input required type="text" placeholder="John Doe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Email (Optional)</label>
                                <input type="email" placeholder="john@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">LeetCode URL or Username</label>
                                <input required type="text" placeholder="https://leetcode.com/u/username/" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={formData.leetcodeUrl} onChange={e => setFormData({ ...formData, leetcodeUrl: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Batch / Year</label>
                                <input required type="text" placeholder="Batch 2024" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} />
                            </div>
                            {isSuperAdmin && (
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Assign Mentor</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                        value={formData.mentorEmail}
                                        onChange={e => setFormData({ ...formData, mentorEmail: e.target.value })}
                                    >
                                        <option value="">Select Mentor</option>
                                        {mentors.map(m => <option key={m.email} value={m.email}>{m.display || m.email}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg transition-all font-bold mt-4 uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500 hover:bg-yellow-500 hover:text-black' : 'bg-blue-500/20 text-blue-400 border border-blue-500 hover:bg-blue-500 hover:text-white'}`}>
                            {loading ? <RefreshCw size={16} className="animate-spin" /> : (editingId ? <Save size={16} /> : <UserPlus size={16} />)}
                            {loading ? 'Processing...' : (editingId ? 'Save Profile Changes' : 'Register Student')}
                        </button>
                    </form>

                    {isSuperAdmin && (
                        <form onSubmit={handleAddMentor} className="glass-card glass-card-hover-blue p-6 space-y-5 h-fit bg-[#0B1220]/50 border-blue-500/20 transition-colors shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                            <div className="flex items-center gap-2 mb-2 text-blue-400">
                                <FilePlus size={24} />
                                <h2 className="text-lg font-bold text-slate-100 tracking-wider">Deploy New Admin/Mentor</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Mentor Email</label>
                                    <input required type="email" placeholder="mentor@admin.com" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={mentorForm.email} onChange={e => setMentorForm({ ...mentorForm, email: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Password</label>
                                        <input required type="text" placeholder="Secure PW" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={mentorForm.password} onChange={e => setMentorForm({ ...mentorForm, password: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Display Name</label>
                                        <input required type="text" placeholder="e.g. Mentor 5" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" value={mentorForm.display} onChange={e => setMentorForm({ ...mentorForm, display: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Upload Database Sheet (.xlsx)</label>
                                    <input required type="file" accept=".xlsx, .xls" className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20" onChange={e => setMentorForm({ ...mentorForm, sheet: e.target.files[0] })} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-500/20 text-blue-400 border border-blue-500 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition-all font-bold mt-4 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] uppercase tracking-widest text-xs">
                                {loading ? 'Processing System...' : 'Initialize New Admin'}
                            </button>
                        </form>
                    )}
                </div>

                <div className={`glass-card p-6 flex flex-col h-full bg-[#0B1220]/50 border-white/5 ${isSuperAdmin ? 'glass-card-hover-blue' : 'glass-card-hover-red'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <h2 className="text-lg font-bold text-slate-200 drop-shadow-md whitespace-nowrap">
                            {isSuperAdmin ? 'Global Student Directory' : 'My Student Directory'}
                        </h2>
                        <div className="relative w-full md:max-w-xs">
                            <input
                                type="text"
                                placeholder="Search by name or username..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <User size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-2 custom-scrollbar h-[600px]">
                        <ul className="space-y-3">
                            {students
                                .filter(s =>
                                    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    s.leetcodeUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    s.batch?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(s => (
                                    <li key={s._id} className={`flex justify-between items-center p-4 bg-slate-800/30 rounded-xl border ${editingId === s._id ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/5'} hover:bg-slate-700/40 transition-all group`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-100 text-sm">{s.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                                    @{s.leetcodeUsername} • {s.batch}
                                                </div>
                                                {isSuperAdmin && (
                                                    <div className="text-[10px] text-blue-500/70 font-medium truncate max-w-[150px]">
                                                        {s.mentorEmail || 'Unassigned'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(s)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors">
                                                <Edit3 size={16} />
                                            </button>
                                            {isSuperAdmin && (
                                                <button onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            {students.length === 0 && (
                                <div className="text-center text-slate-600 py-20 font-medium tracking-widest uppercase text-xs flex flex-col items-center gap-3">
                                    <User size={40} className="text-slate-800" />
                                    No entries found.
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
