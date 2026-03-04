import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudent, getStudentProfile } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, Target, Award, Zap, Code2 } from 'lucide-react';

const StatsCard = ({ title, value, color, icon }) => (
    <div className="glass-card p-6 flex items-center justify-between">
        <div>
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-4 rounded-full bg-slate-800 shadow-inner overflow-hidden relative`}>
            <div className="absolute inset-0 opacity-20 bg-current"></div>
            {icon}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl shrink-0 z-50">
                <p className="text-slate-300 font-semibold mb-2">{label}</p>
                <p className="text-accent font-bold">Solved: {data.solved}</p>
                {data.problems && data.problems.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-400 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {data.problems.map((p, i) => (
                            <li key={i}>• {p}</li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }
    return null;
};

const StudentDetail = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get basic student info (name, batch, etc.) from DB
                const res = await getStudent(id);
                const dbStudent = res.data;

                // 2. Get live LeetCode stats using username
                try {
                    const profileRes = await getStudentProfile(dbStudent.leetcodeUsername);
                    const liveStats = profileRes.data;

                    // 3. Process Calendar Data for Chart
                    const calendar = liveStats.calendar || {};
                    const last7DaysData = [];
                    const now = Math.floor(Date.now() / 1000);
                    const secondsInDay = 86400;

                    for (let i = 6; i >= 0; i--) {
                        const dayTimestamp = Math.floor((now - (i * secondsInDay)) / secondsInDay) * secondsInDay;
                        const dateObj = new Date(dayTimestamp * 1000);
                        const dateStr = dateObj.toLocaleDateString('en-CA');

                        last7DaysData.push({
                            date: dateStr,
                            name: dateStr.split('-').slice(1).join('/'),
                            solved: calendar[dayTimestamp] || 0,
                            solvedProblems: [] // LeetCode calendar doesn't provide titles
                        });
                    }

                    setStudent({
                        ...dbStudent,
                        ...liveStats,
                        recentActivityDetailed: last7DaysData
                    });
                } catch (e) {
                    console.error("Live profile fetch failed", e);
                    setStudent(dbStudent);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="animate-pulse h-64 bg-slate-800 rounded-xl" />;
    if (!student) return <div className="text-center text-red-500 mt-10">Student not found.</div>;

    // Last 7 days chart data
    const dataSource = student.recentActivityDetailed || [...student.dailyStats].reverse().slice(0, 7).reverse();
    const chartData = dataSource.map(d => ({
        name: d.date ? d.date.split('-').slice(1).join('/') : '',
        solved: d.solved,
        problems: d.solvedProblems || []
    }));

    return (
        <div className="space-y-6 slide-in-bottom relative z-10">
            <Link to="/" className="inline-flex items-center space-x-2 text-slate-400 hover:text-accent transition-colors">
                <ArrowLeft size={16} /><span>Back to Leaderboard</span>
            </Link>

            <div className="glass-card p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    {student.name.charAt(0).toUpperCase()}
                </div>

                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2 drop-shadow-md">{student.name}</h1>
                    <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-sm mt-3">
                        <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300">
                            Batch: {student.batch}
                        </span>
                        <a href={`https://leetcode.com/u/${student.leetcodeUsername}/`} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center space-x-1">
                            <Code2 size={14} /> <span>@{student.leetcodeUsername}</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatsCard title="Total Solved" value={student.totalSolved} color="text-accent" icon={<Award className="text-accent" size={24} />} />
                <StatsCard title="Today" value={student.todaySolved || 0} color="text-orange-400" icon={<Zap className="text-orange-400" size={24} />} />
                <StatsCard title="Easy" value={student.easySolved} color="text-green-400" icon={<Target className="text-green-400" size={24} />} />
                <StatsCard title="Medium" value={student.mediumSolved} color="text-yellow-400" icon={<Target className="text-yellow-400" size={24} />} />
                <StatsCard title="Hard" value={student.hardSolved} color="text-red-400" icon={<Target className="text-red-400" size={24} />} />
            </div>

            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                    <BarChart className="text-accent" size={18} />
                    <span>7-Day Activity</span>
                </h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="solved" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default StudentDetail;
