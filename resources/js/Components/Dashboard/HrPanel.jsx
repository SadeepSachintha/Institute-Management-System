import React from 'react';

export default function HrPanel({
    workloads,
    leaves,
    handleAdminLeaveDecision
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Faculty workload mapping */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Faculty Workload Distribution</h3>
                    <div className="space-y-6">
                        {workloads.map((f) => {
                            const ratio = Math.min(100, (f.current_hours / f.max_hours) * 100);
                            return (
                                <div key={f.faculty_id} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-semibold text-white">{f.name}</span>
                                            <span className="text-xs text-slate-500 ml-2">({f.department})</span>
                                        </div>
                                        <div>
                                            <span className="font-mono text-slate-300 font-semibold">{f.current_hours}h</span>
                                            <span className="text-slate-500"> / {f.max_hours}h max</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                            style={{ width: `${ratio}%` }}
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                f.status === 'Overloaded' ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                f.status === 'Optimal' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                                                'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">Allocation ratio: {ratio.toFixed(0)}%</span>
                                        <span className={`font-semibold ${
                                            f.status === 'Overloaded' ? 'text-rose-400' :
                                            f.status === 'Optimal' ? 'text-indigo-400' :
                                            'text-sky-400'
                                        }`}>{f.status}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {workloads.length === 0 && (
                            <span className="text-xs text-slate-500 block text-center py-6">No workload mapping recorded.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Leaves Requests Panel */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Leaves Approvals Portal</h3>
                <div className="space-y-4">
                    {leaves.map((l) => (
                        <div key={l.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-white text-sm">{l.faculty?.user?.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {l.start_date} to {l.end_date}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 text-2xs rounded-full uppercase tracking-wider font-bold ${
                                    l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                    l.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                                    'bg-amber-500/10 text-amber-400'
                                }`}>
                                    {l.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 italic">"{l.reason}"</p>
                            {l.status === 'pending' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleAdminLeaveDecision(l.id, 'approved')}
                                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAdminLeaveDecision(l.id, 'rejected')}
                                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {leaves.length === 0 && (
                        <span className="text-xs text-slate-500 block text-center py-6">No leave requests logged.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
