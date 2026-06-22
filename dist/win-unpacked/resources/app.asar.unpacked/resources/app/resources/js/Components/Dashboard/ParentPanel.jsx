import React from 'react';

export default function ParentPanel({ students }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.slice(0, 1).map((s) => (
                <div key={s.id} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-white">{s.user?.name}</h3>
                            <span className="text-xs text-indigo-400 font-mono">{s.student_id}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                            {s.status}
                        </span>
                    </div>

                    {/* Child performance logs */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-4">
                        <div>
                            <span className="text-3xs uppercase tracking-widest text-slate-500 block mb-1">Attendance Warnings</span>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-2 rounded-lg">
                                    <span>Consecutive Absences Detected: 3</span>
                                    <span className="font-semibold">Absence Notice Sent</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-3xs uppercase tracking-widest text-slate-500 block mb-1">Academic Grades Record</span>
                            <div className="grid grid-cols-2 gap-2 text-slate-300">
                                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                                    <div className="text-[10px] text-slate-500 mb-0.5">Data Structures</div>
                                    <div className="font-bold text-indigo-300">Midterm: 62%</div>
                                </div>
                                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                                    <div className="text-[10px] text-slate-500 mb-0.5">Linear Algebra</div>
                                    <div className="font-bold text-indigo-300">Midterm: 55%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
