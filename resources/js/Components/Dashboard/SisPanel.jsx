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
    loading
}) {
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
                                            {s.document_path ? (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="text-xs text-rose-400">Missing</span>
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
