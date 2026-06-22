import React from 'react';

export default function SisPanel({
    students,
    finance,
    studentForm,
    setStudentForm,
    handleAddStudent,
    uploadStudentId,
    setUploadStudentId,
    setUploadFile,
    handleUploadDoc,
    handleVerifyDocument,
    auditLogs = [],
    loading
}) {
    const pendingStudents = students.filter(s => s.document_path && s.document_status === 'pending');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Students List Table */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">SIS Central Registry</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Student ID</th>
                                    <th className="py-3 px-4 font-semibold">Name</th>
                                    <th className="py-3 px-4 font-semibold">Email</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {students.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{s.student_id}</td>
                                        <td className="py-3 px-4 text-white font-medium">{s.user?.name}</td>
                                        <td className="py-3 px-4">{s.user?.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                s.status === 'enrolled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                s.status === 'applicant' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {!s.document_path ? (
                                                <span className="text-xs text-rose-400">Missing</span>
                                            ) : s.document_status === 'approved' ? (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Verified
                                                </span>
                                            ) : s.document_status === 'rejected' ? (
                                                <span className="text-xs text-rose-400 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Rejected
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                                                    </svg>
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500">No students found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Document Verification Queue */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Document Verification Queue</h3>
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {pendingStudents.length} Pending
                        </span>
                    </div>
                    {pendingStudents.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                            No pending documents require review.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingStudents.map((s) => (
                                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700/60 transition gap-4">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{s.user?.name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            ID: <span className="font-mono text-indigo-400">{s.student_id}</span> | Email: {s.user?.email}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={`/storage/${s.document_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition border border-slate-700/50 flex items-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
                                        </a>
                                        <button
                                            onClick={() => handleVerifyDocument(s.id, 'approved')}
                                            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-950/20"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleVerifyDocument(s.id, 'rejected')}
                                            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-rose-950/20"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Institutional Audit Trail */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Institutional Audit Trail
                        </h3>
                        <span className="text-2xs font-mono text-slate-500 uppercase tracking-widest">
                            Secure Log
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                        <table className="w-full text-left text-xs text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="py-2.5 px-3 font-semibold">Actor</th>
                                    <th className="py-2.5 px-3 font-semibold">Action</th>
                                    <th className="py-2.5 px-3 font-semibold">Target Entity</th>
                                    <th className="py-2.5 px-3 font-semibold">IP Address</th>
                                    <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/20 transition">
                                        <td className="py-2.5 px-3 font-medium text-white">
                                            {log.user?.name || 'System / Batch'}
                                            <span className="block text-3xs text-slate-500 font-mono mt-0.5">
                                                {log.user?.email || 'automated@ims.core'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-2xs">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-3xs uppercase font-semibold ${
                                                log.action === 'entered_grade' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                                log.action === 'leave_status_changed' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-2xs text-slate-300">
                                            <span className="font-mono text-3xs text-slate-500 block">
                                                {log.auditable_type?.split('\\').pop() || 'N/A'} (ID: {log.auditable_id})
                                            </span>
                                            {log.new_values && (
                                                <span className="block text-3xs text-slate-400 italic mt-0.5">
                                                    {log.action === 'leave_status_changed' 
                                                        ? `Status: ${log.old_values?.status} → ${log.new_values?.status}`
                                                        : log.action === 'entered_grade'
                                                            ? `Assessment: ${log.new_values?.assessment_name} (${log.new_values?.marks_obtained}/${log.new_values?.max_marks} marks)`
                                                            : `Transaction logged`
                                                    }
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-3xs text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                                        <td className="py-2.5 px-3 text-right text-slate-500 text-3xs font-mono">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500 italic">
                                            No administrative actions have been audited yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Onboard Form */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Onboard Student</h3>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                            <input
                                type="text"
                                value={studentForm.name}
                                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Marie Curie"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                            <input
                                type="email"
                                value={studentForm.email}
                                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="name@domain.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Initial Onboarding State</label>
                            <select
                                value={studentForm.status}
                                onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="inquiry">Inquiry Only</option>
                                <option value="applicant">Applicant (Creates Billing Invoice)</option>
                                <option value="enrolled">Enrolled Directly</option>
                            </select>
                        </div>
                        {studentForm.status === 'applicant' && (
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Tuition Fee Category</label>
                                <select
                                    value={studentForm.fee_id}
                                    onChange={(e) => setStudentForm({ ...studentForm, fee_id: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select tuition scale...</option>
                                    {finance?.fees?.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (${parseFloat(f.amount).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Demographics</label>
                            <input
                                type="text"
                                placeholder="Address, City, Country"
                                value={studentForm.demographic_data}
                                onChange={(e) => setStudentForm({ ...studentForm, demographic_data: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-650/20"
                        >
                            Process Onboarding
                        </button>
                    </form>
                </div>

                {/* Document management */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Onboarding Verification</h3>
                    <form onSubmit={handleUploadDoc} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Select Student</label>
                            <select
                                value={uploadStudentId}
                                onChange={(e) => setUploadStudentId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Choose student profile...</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.user?.name} ({s.student_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Attach ID / Transcripts (PDF/Image)</label>
                            <input
                                type="file"
                                onChange={(e) => setUploadFile(e.target.files[0])}
                                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 hover:file:bg-slate-800 cursor-pointer"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-650/20"
                        >
                            Verify Transcripts
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
