import { Head, Link } from '@inertiajs/react';
import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth }) {
    const coreModules = [
        {
            title: "Student Information (SIS)",
            icon: "🎓",
            desc: "Tracks the complete student lifecycle from initial inquiry, through applicant verification and billing, to active enrollment status.",
            color: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400"
        },
        {
            title: "Academic & Scheduling",
            icon: "📅",
            desc: "Automates conflict-free class scheduling, lectures validation, student registers, and absent logs with parent alert integrations.",
            color: "from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-400"
        },
        {
            title: "Tuition Sandbox Ledger",
            icon: "💳",
            desc: "Handles fee scheduling, outstanding invoice tracking, and online sandbox credit-card transactions with automated status upgrades.",
            color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400"
        },
        {
            title: "Faculty leaves & HR",
            icon: "💼",
            desc: "Tracks qualifications, schedules workload hours allocation to prevent staff overloading, and handles leave requests workflows.",
            color: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400"
        },
        {
            title: "AI Early Warning System",
            icon: "🔮",
            desc: "Runs Scikit-learn predictive models dynamically to score student drop-out risks based on attendance trends and grade dips.",
            color: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400"
        }
    ];

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
            <Head title="Welcome to IMS Core" />

            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

            {/* Header Navigation */}
            <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ApplicationLogo className="h-9 w-9" />
                    <span className="text-lg font-bold tracking-tight text-white">IMS Core</span>
                </div>
                <div>
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
                        >
                            Open Console
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-300 hover:text-white transition"
                        >
                            Log In
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
                <div className="space-y-6 max-w-3xl mb-16">
                    <a
                        href="https://ss-labz.pages.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-405 hover:bg-indigo-500/20 hover:text-indigo-300 uppercase tracking-widest transition-all duration-200"
                    >
                        A Product of SS Labz ➜
                    </a>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        The Central Nervous System of Your Educational Institution
                    </h1>
                    <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Unified operations control, automated billing workflows, real-time timetable conflict checks, and Python-powered AI early-warning predictive metrics.
                    </p>
                    <div className="pt-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all"
                            >
                                Enter Dashboard Console ➜
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all"
                            >
                                Enter Access Control Portal ➜
                            </Link>
                        )}
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                    {coreModules.map((m, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-2xl border bg-gradient-to-b text-left transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/60 ${m.color}`}
                        >
                            <div className="text-2xl mb-3">{m.icon}</div>
                            <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                        </div>
                    ))}
                    
                    {/* Access portal helper card */}
                    <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 text-left flex flex-col justify-between hover:border-slate-700/40 transition">
                        <div>
                            <div className="text-2xl mb-3">🛠️</div>
                            <h3 className="text-base font-bold text-slate-400 mb-2">Isolated Environments</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Sandbox deployments with clean containers running on dedicated port stacks (MySQL:3307, FastAPI:8080, Laravel:8000).
                            </p>
                        </div>
                        <div className="pt-4 flex items-center justify-between text-3xs text-slate-600 font-mono">
                            <span>VITE v7.3</span>
                            <span>LARAVEL v12</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-3xs text-slate-600 font-mono tracking-widest uppercase">
                    © 2026 Institute Management System. Developed by <a href="https://ss-labz.pages.dev" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition">SS Labz</a>.
                </span>
                <div className="flex gap-4 text-3xs text-slate-600 font-mono uppercase tracking-wider">
                    <a href="https://ss-labz.pages.dev" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition">SS Labz Home</a>
                    <span>•</span>
                    <span className="hover:text-slate-400 cursor-pointer">MLOps Engine</span>
                </div>
            </footer>
        </div>
    );
}
