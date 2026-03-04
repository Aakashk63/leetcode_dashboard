import React, { useState, useEffect } from 'react';
import { getDailyActivity } from '../services/api';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, Filter, Activity } from 'lucide-react';

const Analytics = () => {
    const [students, setStudents] = useState([]);
    const getLocalYYYYMMDD = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getLocalYYYYMMDD());
    const [batch, setBatch] = useState('All'); // We'll still use local batch filter if needed
    const [activityFilter, setActivityFilter] = useState('Active');
    const [loading, setLoading] = useState(true);
    const [fetchingDate, setFetchingDate] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            setFetchingDate(true);
            try {
                const res = await getDailyActivity(date);
                setStudents(res.data);
                setLoading(false);
                setFetchingDate(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
                setFetchingDate(false);
            }
        };
        fetchActivity();
    }, [date]);

    if (loading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;

    const batches = ['All', ...new Set(students.filter(s => s.batch).map(s => s.batch))];

    const tableData = students
        .map(student => ({
            id: student.username || student.name,
            name: student.name,
            solved: student.solvedToday || 0,
            batch: student.batch || 'Mentor Assigned'
        }))
        .filter(s => batch === 'All' || s.batch === batch)
        .filter(d => {
            if (activityFilter === 'Active') return d.solved > 0;
            if (activityFilter === 'Zero') return d.solved === 0;
            return true;
        })
        .sort((a, b) => b.solved - a.solved);

    return (
        <div className="space-y-8 slide-in-bottom relative z-10 font-sans pb-10">
            {/* Spotlight Backgrounds */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] pointer-events-none rounded-full"></div>

            <div className="flex flex-col items-center space-y-4 mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md uppercase italic tracking-widest text-center">
                    Activity <span className="text-accent">Tracking</span>
                </h2>
            </div>

            <div className="bg-darker/60 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent shadow-[0_0_15px_rgba(255,59,59,0.8)]"></div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                        <Calendar size={20} className="text-accent drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
                    </div>
                    <input
                        type="date"
                        className="bg-black/50 border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-slate-200 focus:outline-none focus:border-accent transition-colors w-full md:w-auto shadow-inner"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={getLocalYYYYMMDD()}
                    />
                </div>

                <div className="flex items-center gap-4 md:gap-6 flex-wrap w-full md:w-auto justify-end">
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                            <Filter size={20} className="text-accent drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
                        </div>
                        <select
                            className="bg-black/50 border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-slate-200 focus:outline-none focus:border-accent transition-colors w-full md:w-auto shadow-inner"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                        >
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                            <Activity size={20} className="text-accent drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
                        </div>
                        <select
                            className="bg-black/50 border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-slate-200 focus:outline-none focus:border-accent transition-colors w-full md:w-auto shadow-inner"
                            value={activityFilter}
                            onChange={(e) => setActivityFilter(e.target.value)}
                        >
                            <option value="Active">Solved {'>'} 0</option>
                            <option value="Zero">Solved 0</option>
                            <option value="All">All Students</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6 h-[450px] flex flex-col">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-wider mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-fast"></div>
                        Activity <span className="text-gray-500">Bar Chart</span>
                    </h2>
                    {tableData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-600 font-bold tracking-widest uppercase">No activity recorded</div>
                    ) : (
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tableData.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={false} />
                                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#0B1220', borderColor: '#FF3B3B40', color: '#f8fafc', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                    />
                                    <Bar dataKey="solved" fill="#FF3B3B" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col h-[450px]">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-wider mb-6 flex-shrink-0 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-fast"></div>
                        Top Active <span className="text-gray-500">{date}</span>
                    </h2>
                    <div className="overflow-y-auto pr-2 custom-scrollbar">
                        {tableData.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">No activity recorded for this date.</div>
                        ) : (
                            <ul className="space-y-3">
                                {tableData.map((d, index) => (
                                    <li key={d.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-slate-600 font-black text-sm w-4">{index + 1}.</span>
                                            <span className="text-slate-200 font-bold tracking-wide">{d.name}</span>
                                        </div>
                                        <span className="bg-accent/10 border border-accent/30 text-accent px-4 py-1.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(255,59,59,0.3)]">
                                            +{d.solved} Solved
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
