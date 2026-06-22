import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function FinancePanel({ finance }) {
    if (!finance) return null;

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

    return (
        <div className="space-y-6 animate-fade-in">
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
                                    </tr>
                                ))}
                                {finance.invoices.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500">No invoices recorded.</td>
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
        </div>
    );
}
