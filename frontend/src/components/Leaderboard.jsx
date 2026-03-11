import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/api';
import { Crown, Flame, Search, ArrowUpDown, Download } from 'lucide-react';

const Leaderboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('high'); // 'high', 'low'
    const role = localStorage.getItem('role');
    const isSuperAdmin = role === 'super_admin';

    useEffect(() => {
        let isUpdating = false;
        const fetchData = async () => {
            try {
                // Initial fast fetch
                const res = await getLeaderboard();
                setStudents(res.data);
                setLoading(false);

                // Background update for real-time data
                if (!isUpdating) {
                    isUpdating = true;
                    import('../services/api').then(async ({ triggerUpdate }) => {
                        try {
                            await triggerUpdate();
                            const fresh = await getLeaderboard();
                            setStudents(fresh.data);
                        } catch (e) { console.error('Background update failed', e); }
                    });
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getLocalYYYYMMDD = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const currentDay = getLocalYYYYMMDD();

    const sortedStudents = [...students].sort((a, b) => b.totalSolved - a.totalSolved);

    const getDailySolved = (student) => {
        if (student.todaySolved !== undefined) return student.todaySolved;
        return student.dailyStats?.find(d => d.date === currentDay)?.solved || 0;
    };

    const topThree = [
        sortedStudents[1], // 2nd
        sortedStudents[0], // 1st
        sortedStudents[2]  // 3rd
    ];

    const filteredStudents = sortedStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.leetcodeUsername.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayStudents = [...filteredStudents].sort((a, b) => {
        if (sortOrder === 'low') {
            return a.totalSolved - b.totalSolved;
        }
        return b.totalSolved - a.totalSolved;
    });

    const exportToCSV = () => {
        const headers = ['Rank', 'Name', 'Username', 'Batch', 'Total Solved', 'Today Solved'];
        const csvContent = [
            headers.join(','),
            ...displayStudents.map((s, idx) =>
                [idx + 1, s.name, s.leetcodeUsername, s.batch || 'N/A', s.totalSolved, getDailySolved(s)].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leaderboard_export_${currentDay}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent shadow-[0_0_15px_rgba(255,59,59,0.5)]"></div>
            </div>
        );
    }

    if (students.length === 0) {
        return <div className="text-center text-muted">No competitive data available.</div>;
    }

    return (
        <div className="space-y-12 slide-in-bottom relative z-10 font-sans pb-10">
            {/* Spotlight / Ambient Backgrounds */}
            <div className={`absolute top-0 left-1/2 min-w-[800px] h-[400px] blur-[150px] -translate-x-1/2 pointer-events-none rounded-full ${isSuperAdmin ? 'bg-blue-500/10' : 'bg-accent/5'}`}></div>
            <div className={`absolute top-[20%] left-1/2 min-w-[300px] h-[300px] blur-[100px] -translate-x-1/2 pointer-events-none rounded-full ${isSuperAdmin ? 'bg-blue-500/15' : 'bg-accent/10'}`}></div>

            {/* HEADER SECTION */}
            <div className="flex flex-col items-center space-y-6">
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md uppercase italic tracking-widest text-center">
                    Leader<span className={isSuperAdmin ? "text-blue-500" : "text-accent"}>Board</span>
                </h2>
            </div>

            {/* MAIN PODIUM SECTION */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 mt-16 px-4">
                {/* 2nd Place */}
                {topThree[0] && (
                    <Link to={`/student/${topThree[0].leetcodeUsername}`} className="flex flex-col items-center w-full md:w-48 order-2 md:order-1 group">
                        <div className="relative mb-4 flex flex-col items-center transition-transform group-hover:-translate-y-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-500 to-gray-300 flex items-center justify-center text-dark font-black text-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-2 border-gray-400 z-10">
                                {topThree[0].name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`mt-2 text-white font-bold tracking-wide truncate max-w-[120px] transition-colors ${isSuperAdmin ? 'group-hover:text-blue-400' : 'group-hover:text-accent'}`}>{topThree[0].name}</span>
                            <div className="bg-darker border border-white/10 px-3 py-1 rounded-full text-gray-300 text-xs font-bold mt-2 shadow-inner flex items-center gap-1">
                                <Flame size={12} className="text-gray-400" />
                                {topThree[0].totalSolved}
                            </div>
                        </div>
                        <div className="w-full h-32 md:h-40 bg-gradient-to-t from-darker to-[#1a2235] border border-white/5 border-b-0 rounded-t-xl relative overflow-hidden shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] flex justify-center">
                            <div className="absolute top-2 w-10 h-1 bg-white/10 rounded-full"></div>
                            <span className="text-4xl font-black text-white/20 mt-6 select-none">2ND</span>
                        </div>
                    </Link>
                )}

                {/* 1st Place (Center) */}
                {topThree[1] && (
                    <Link to={`/student/${topThree[1].leetcodeUsername}`} className="flex flex-col items-center w-full md:w-56 order-1 md:order-2 z-10 animate-float group">
                        <div className="relative mb-6 flex flex-col items-center">
                            <Crown className={`${isSuperAdmin ? 'text-blue-400' : 'text-gold'} w-10 h-10 -mb-3 z-20 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]`} />
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-tr flex items-center justify-center text-white font-black text-3xl z-10 group-hover:scale-105 transition-transform border-2 ${isSuperAdmin ? 'from-blue-600 to-cyan-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] border-blue-400' : 'from-accent to-orange-500 shadow-[0_0_30px_rgba(255,59,59,0.5)] border-accent'}`}>
                                {topThree[1].name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`mt-4 text-white font-black text-lg tracking-wide drop-shadow-md truncate max-w-[150px] transition-colors ${isSuperAdmin ? 'group-hover:text-blue-400' : 'group-hover:text-accent'}`}>{topThree[1].name}</span>
                            <div className={`px-4 py-1.5 rounded-full text-white text-sm font-black mt-2 flex items-center gap-1 border ${isSuperAdmin ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-accent/20 border-accent/50 shadow-[0_0_15px_rgba(255,59,59,0.4)]'}`}>
                                <Flame size={14} className={`${isSuperAdmin ? 'text-blue-400' : 'text-accent'} animate-pulse-fast`} />
                                {topThree[1].totalSolved}
                            </div>
                        </div>
                        <div className={`w-full h-40 md:h-56 bg-gradient-to-t border-x rounded-t-xl relative overflow-hidden flex justify-center before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1/2 before:bg-gradient-to-b before:to-transparent ${isSuperAdmin ? 'from-[#0B1220] to-[#101525] border-blue-500/60 shadow-[inset_0_5px_20px_rgba(59,130,246,0.2),0_-5px_30px_rgba(59,130,246,0.15)] before:from-blue-500/20' : 'from-[#0B1220] to-[#251015] border-accent/60 shadow-[inset_0_5px_20px_rgba(255,59,59,0.2),0_-5px_30px_rgba(255,59,59,0.15)] before:from-accent/20'}`}>
                            <div className={`absolute top-2 w-16 h-1 rounded-full ${isSuperAdmin ? 'bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,1)]' : 'bg-accent/50 shadow-[0_0_10px_rgba(255,59,59,1)]'}`}></div>
                            <span className={`text-6xl font-black mt-8 select-none drop-shadow-md ${isSuperAdmin ? 'text-blue-500/20' : 'text-accent/20'}`}>1ST</span>
                        </div>
                    </Link>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <Link to={`/student/${topThree[2].leetcodeUsername}`} className="flex flex-col items-center w-full md:w-48 order-3 md:order-3 group">
                        <div className="relative mb-4 flex flex-col items-center transition-transform group-hover:-translate-y-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-2 border-amber-600 z-10">
                                {topThree[2].name.charAt(0).toUpperCase()}
                            </div>
                            <span className="mt-2 text-white font-bold tracking-wide truncate max-w-[120px] group-hover:text-amber-500 transition-colors">{topThree[2].name}</span>
                            <div className="bg-darker border border-white/10 px-3 py-1 rounded-full text-amber-500 text-xs font-bold mt-2 shadow-inner flex items-center gap-1">
                                <Flame size={12} className="text-amber-500" />
                                {topThree[2].totalSolved}
                            </div>
                        </div>
                        <div className="w-full h-28 md:h-36 bg-gradient-to-t from-darker to-[#1a1715] border border-white/5 border-b-0 rounded-t-xl relative overflow-hidden shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] flex justify-center">
                            <div className="absolute top-2 w-10 h-1 bg-white/10 rounded-full"></div>
                            <span className="text-4xl font-black text-white/20 mt-6 select-none">3RD</span>
                        </div>
                    </Link>
                )}
            </div>



            {/* LOWER RANK TABLE */}
            <div className="max-w-4xl mx-auto pt-8 space-y-4">

                {/* Search & Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 bg-darker/50 p-4 border border-white/5 rounded-2xl items-center justify-between">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search student by name or leetcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <button
                            onClick={() => setSortOrder(prev => prev === 'high' ? 'low' : 'high')}
                            className={`bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-300 transition-all whitespace-nowrap ${isSuperAdmin ? 'hover:border-blue-500/50' : 'hover:border-accent/50'}`}
                        >
                            <ArrowUpDown size={16} className={sortOrder === 'low' ? (isSuperAdmin ? 'text-blue-400' : 'text-accent') : 'text-muted'} />
                            Sort: {sortOrder === 'high' ? 'High to Low' : 'Low to High'}
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] whitespace-nowrap"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-[80px_1fr_120px_120px] bg-black/40 p-4 text-xs font-bold text-muted uppercase tracking-wider border-b border-white/5 px-6">
                        <div className="text-center">Rank</div>
                        <div>Player</div>
                        <div className="text-center">Total Solved</div>
                        <div className="text-center">Today's Solves</div>
                    </div>

                    <div className="flex flex-col p-2 space-y-2">
                        {displayStudents.map((student, index) => {
                            const rank = index + 1;
                            return (
                                <Link to={`/student/${student.leetcodeUsername}`} key={student._id || index} className="grid grid-cols-[80px_1fr_120px_120px] items-center bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-xl p-3 px-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-[1px] group">
                                    <div className="text-center font-black text-slate-500 text-lg group-hover:text-white transition-colors">
                                        {rank}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold border border-white/10 transition-colors ${isSuperAdmin ? 'group-hover:border-blue-500/50' : 'group-hover:border-accent/50'}`}>
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white tracking-wide truncate max-w-[150px] md:max-w-none">{student.name}</div>
                                            <div className="text-xs text-muted">@{student.leetcodeUsername}</div>
                                        </div>
                                    </div>
                                    <div className={`text-center font-black transition-all ${isSuperAdmin ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0)] group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-accent drop-shadow-[0_0_8px_rgba(255,59,59,0)] group-hover:drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]'}`}>
                                        {student.totalSolved}
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs px-3 py-1 rounded-full shadow-[inset_0_0_5px_rgba(99,102,241,0.2)] flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-fast"></div>
                                            +{getDailySolved(student)}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                        {displayStudents.length === 0 && (
                            <div className="p-8 text-center text-muted font-bold space-y-2">
                                <p>No more players ranked.</p>
                                <p className="text-sm font-normal">Keep solving to join the arena!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
