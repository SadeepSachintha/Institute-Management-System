import React from 'react';

export default function StudentPanel({
    activeTab,
    user,
    students,
    grades,
    timetable,
    finance,
    paymentForm,
    setPaymentForm,
    handleSandboxPayment,
    calculateCGPA
}) {
    const sProfile = students.find((s) => s.user_id === user.id);
    const sGrades = sProfile ? grades.filter((g) => g.student_id === sProfile.id) : [];

    // Filter payments / invoices for this student
    const sInvoices = sProfile && finance ? finance.invoices.filter((i) => i.student_id === sProfile.id) : [];

    return (
        <div className="w-full">
            {/* TAB: MY PROFILE (Student) */}
            {activeTab === 'profile' && (
                <div className="max-w-md mx-auto bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                    {/* Student Card UI */}
                    <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-3xl font-bold mx-auto mb-4 uppercase">
                        {user.name.slice(0, 2)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{user.name}</h3>
                    <span className="text-xs text-slate-500 font-mono tracking-widest uppercase block mt-1">Student Profile</span>
                    
                    {/* ID tag details */}
                    {sProfile ? (
                        <div className="mt-8 space-y-4">
                            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                        <span className="text-3xs uppercase tracking-widest text-slate-500 block">Student ID</span>
                                        <span className="text-sm font-mono font-bold text-indigo-300">{sProfile.student_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-3xs uppercase tracking-widest text-slate-500 block">Status</span>
                                        <span className="text-sm font-semibold capitalize text-white">{sProfile.status}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-3xs uppercase tracking-widest text-slate-500 block">Demographics</span>
                                        <span className="text-xs text-slate-300">{sProfile.demographic_data || 'None recorded'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-3xs uppercase tracking-widest text-slate-500 block">Academic Notes</span>
                                        <span className="text-xs text-slate-300 italic">"{sProfile.academic_history || 'None'}"</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-500 block mt-8">Loading profile metadata...</span>
                    )}
                </div>
            )}

            {/* TAB: MY SCHEDULE (Student) */}
            {activeTab === 'student_schedule' && (
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">My Lecture Timetable</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Day</th>
                                    <th className="py-3 px-4 font-semibold">Subject</th>
                                    <th className="py-3 px-4 font-semibold">Instructor</th>
                                    <th className="py-3 px-4 font-semibold">Time</th>
                                    <th className="py-3 px-4 font-semibold">Lecture Hall</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {timetable.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                        <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                        <td className="py-3 px-4">{t.faculty?.user?.name}</td>
                                        <td className="py-3 px-4 font-mono">
                                            {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                                                {t.room_number}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {timetable.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500">No classes scheduled.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: GRADES & CGPA (Student) */}
            {activeTab === 'student_grades' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">My Grade Transcript</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Subject</th>
                                        <th className="py-3 px-4 font-semibold">Assessment</th>
                                        <th className="py-3 px-4 font-semibold">Score</th>
                                        <th className="py-3 px-4 font-semibold">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {sGrades.map((g) => (
                                        <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 text-white font-medium">{g.subject_name}</td>
                                            <td className="py-3 px-4">{g.assessment_name}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-200">
                                                {g.marks_obtained} / {g.max_marks}
                                            </td>
                                            <td className="py-3 px-4 font-mono">{(g.weight * 100).toFixed(0)}%</td>
                                        </tr>
                                    ))}
                                    {sGrades.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-slate-500">No grades entries recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* GPA assessment index cards */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 text-center flex flex-col justify-center items-center">
                        <h3 className="text-base font-bold text-white mb-2">Academic Standing</h3>
                        <span className="text-xs text-slate-500 mb-6">Cumulative Grade Point Average</span>
                        <div className="space-y-4">
                            <div className="text-5xl font-extrabold text-indigo-400 tracking-wider">
                                {calculateCGPA(sGrades)}
                            </div>
                            <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-1.5 rounded-full inline-block">
                                Scale 4.0 GPA
                            </span>
                            {sProfile && (
                                <button
                                    onClick={() => window.open(`/api/students/${sProfile.id}/report-card`, '_blank')}
                                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-lg text-xs font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-indigo-500/25"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Report Card (PDF)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TUITION SANDBOX (Student) */}
            {activeTab === 'student_finance' && finance && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Outstanding Invoices</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Fee Description</th>
                                        <th className="py-3 px-4 font-semibold">Amount</th>
                                        <th className="py-3 px-4 font-semibold">Discount</th>
                                        <th className="py-3 px-4 font-semibold">Net Balance</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {sInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 text-white font-medium">{inv.fee?.name}</td>
                                            <td className="py-3 px-4 font-semibold">${inv.amount}</td>
                                            <td className="py-3 px-4 text-rose-400 font-semibold">-${inv.discount}</td>
                                            <td className="py-3 px-4 text-indigo-300 font-bold">${inv.amount - inv.discount}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500">No invoice records.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Sandbox Payment Portal</h3>
                            <form onSubmit={handleSandboxPayment} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Select Invoice</label>
                                    <select
                                        value={paymentForm.invoice_id}
                                        onChange={(e) => {
                                            const invId = e.target.value;
                                            const matching = finance.invoices.find((i) => i.id === parseInt(invId));
                                            setPaymentForm({
                                                ...paymentForm,
                                                invoice_id: invId,
                                                amount_paid: matching ? (matching.amount - matching.discount).toString() : ''
                                            });
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Choose invoice...</option>
                                        {sInvoices.filter((i) => i.status !== 'paid').map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.fee?.name} (${i.amount - i.discount})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Amount to Pay ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentForm.amount_paid}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Card Number (Sandbox Simulation)</label>
                                    <input
                                        type="text"
                                        value={paymentForm.card_number}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, card_number: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest text-center"
                                        placeholder="4111 2222 3333 4444"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-650/20"
                                >
                                    Process Online Payment
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
