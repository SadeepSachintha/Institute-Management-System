import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';

export default function FinancePanel({ finance, loadTabData }) {
    if (!finance) return null;

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerifyAction = async (status) => {
        if (!selectedInvoice) return;
        setVerifying(true);
        try {
            const res = await axios.post(`/api/finance/invoices/${selectedInvoice.id}/verify-slip`, {
                status,
                remarks
            });
            if (res.data.success) {
                alert(res.data.message);
                setSelectedInvoice(null);
                setRemarks('');
                if (loadTabData) {
                    loadTabData();
                }
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update slip status.');
        } finally {
            setVerifying(false);
        }
    };

    // Transform trend data to numeric values for correct rendering in Recharts
    const chartData = finance.revenue_trend.map((item) => ({
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: parseFloat(item.revenue)
    }));

    // Custom Tooltip component matching glassmorphic styling
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl">
                    <p className="text-2xs text-slate-500 font-mono tracking-wider uppercase mb-1">{label}</p>
                    <p className="text-sm font-bold text-emerald-400">
                        ${payload[0].value.toFixed(2)} Collected
                    </p>
                </div>
            );
        }
        return null;
    };

    const pendingInvoices = finance.invoices.filter((i) => i.status === 'pending_verification');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Pending Verifications section */}
            {pendingInvoices.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/50" />
                    <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
                        ⚠️ Pending Bank Slip Verifications ({pendingInvoices.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-2 px-3 font-semibold">Student</th>
                                    <th className="py-2 px-3 font-semibold">Fee Category</th>
                                    <th className="py-2 px-3 font-semibold">Amount</th>
                                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {pendingInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-800/10 transition">
                                        <td className="py-2 px-3 text-white font-medium">{inv.student?.user?.name}</td>
                                        <td className="py-2 px-3 text-indigo-300">{inv.fee?.name}</td>
                                        <td className="py-2 px-3 font-semibold text-slate-200">${inv.amount - inv.discount}</td>
                                        <td className="py-2 px-3 text-right">
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                            >
                                                Verify Slip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Metrics summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Net Billed</span>
                    <span className="text-3xl font-bold text-white mt-2">${parseFloat(finance.metrics.total_billed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Revenue Collected</span>
                    <span className="text-3xl font-bold text-emerald-400 mt-2">${parseFloat(finance.metrics.total_paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Outstanding Balance</span>
                    <span className="text-3xl font-bold text-rose-400 mt-2">${parseFloat(finance.metrics.outstanding).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Charts and table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Financial Ledger & Invoices</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Student</th>
                                    <th className="py-3 px-4 font-semibold">Fee Category</th>
                                    <th className="py-3 px-4 font-semibold">Net Cost</th>
                                    <th className="py-3 px-4 font-semibold">Billed Date</th>
                                    <th className="py-3 px-4 font-semibold">Payment Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {finance.invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 text-white font-medium">{inv.student?.user?.name}</td>
                                        <td className="py-3 px-4 text-indigo-300">{inv.fee?.name}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-200">${parseFloat(inv.amount - inv.discount).toFixed(2)}</td>
                                        <td className="py-3 px-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                inv.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => window.open(`/api/finance/invoices/${inv.id}/pdf`, '_blank')}
                                                className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-indigo-400 hover:text-indigo-300 rounded-lg transition"
                                                title="Print Invoice"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            {inv.status === 'paid' && inv.payments && inv.payments.length > 0 && (
                                                <button
                                                    onClick={() => window.open(`/api/finance/payments/${inv.payments[0].id}/pdf`, '_blank')}
                                                    className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-emerald-400 hover:text-emerald-300 rounded-lg transition"
                                                    title="Print Receipt"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {finance.invoices.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-500">No invoices recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recharts Revenue Trend Area Chart */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Daily Revenue Trend</h3>
                    <span className="text-xs text-slate-500 mb-6">Real-time collections charting</span>
                    
                    <div className="flex-1 min-h-[220px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-slate-500">No payment logs recorded yet.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal overlay for verification review */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h4 className="text-base font-bold text-white">Review Bank Deposit Slip</h4>
                            <button
                                onClick={() => { setSelectedInvoice(null); setRemarks(''); }}
                                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs text-slate-300 grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Student Name</span>
                                    <span className="font-semibold text-white">{selectedInvoice.student?.user?.name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Fee Category</span>
                                    <span className="font-semibold text-indigo-300">{selectedInvoice.fee?.name}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Amount Billed</span>
                                    <span className="font-bold text-white">${selectedInvoice.amount - selectedInvoice.discount}</span>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-xl border border-slate-850 p-2 overflow-hidden flex justify-center items-center h-64">
                                {selectedInvoice.slip_path && selectedInvoice.slip_path.toLowerCase().endsWith('.pdf') ? (
                                    <a
                                        href={selectedInvoice.slip_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-400 hover:underline font-mono"
                                    >
                                        📄 Open PDF Slip File in New Tab
                                    </a>
                                ) : (
                                    <img
                                        src={selectedInvoice.slip_path}
                                        alt="Deposit Slip Receipt"
                                        className="max-h-full max-w-full object-contain rounded"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Rejection Remarks (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Reason for rejection..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => handleVerifyAction('reject')}
                                    disabled={verifying}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                >
                                    Reject Slip
                                </button>
                                <button
                                    onClick={() => handleVerifyAction('approve')}
                                    disabled={verifying}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                >
                                    Approve & Mark Paid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
