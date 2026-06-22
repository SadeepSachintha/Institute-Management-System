import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AnalyticsPanel({
    students,
    aiRiskCache,
    predictingId,
    assessStudentRisk,
    forecastData,
    retraining,
    handleRetrainModel
}) {
    // Process forecast data for charting
    const chartData = forecastData
        ? [...forecastData.history, ...forecastData.forecast].map((item) => ({
              month: new Date(item.month + '-02').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
              count: item.count,
              is_forecast: item.is_forecast
          }))
        : [];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl">
                    <p className="text-2xs text-slate-500 font-mono tracking-wider uppercase mb-1">{label}</p>
                    <p className={`text-sm font-bold ${data.is_forecast ? 'text-indigo-400' : 'text-sky-400'}`}>
                        {payload[0].value} {data.is_forecast ? 'Projected' : 'Enrolled'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Predictor Dashboard */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Early Warning System</h3>
                            <p className="text-xs text-slate-500">
                                AI evaluation of student drop-out risks based on attendance and grading dips
                            </p>
                        </div>
                        <button
                            onClick={handleRetrainModel}
                            disabled={retraining}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-950/30 flex items-center gap-2 self-start sm:self-center"
                        >
                            {retraining ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Retraining...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                                    </svg>
                                    Retrain AI Model
                                </>
                            )}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Student ID</th>
                                    <th className="py-3 px-4 font-semibold">Name</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold">Risk Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {students.map((s) => {
                                    const cached = aiRiskCache[s.id];
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-mono text-indigo-400">{s.student_id}</td>
                                            <td className="py-3 px-4 text-white font-medium">{s.user?.name}</td>
                                            <td className="py-3 px-4 capitalize">{s.status}</td>
                                            <td className="py-3 px-4">
                                                {cached ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            cached.risk_level === 'High Risk' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            cached.risk_level === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {cached.risk_level} ({cached.risk_score}%)
                                                        </span>
                                                        <button
                                                            onClick={() => assessStudentRisk(s.id)}
                                                            disabled={predictingId === s.id}
                                                            className="text-xs text-slate-500 hover:text-white transition underline"
                                                        >
                                                            Re-evaluate
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => assessStudentRisk(s.id)}
                                                        disabled={predictingId === s.id}
                                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-650/20"
                                                    >
                                                        {predictingId === s.id ? 'Analyzing...' : 'Assess AI Risk'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Enrollment Forecast Bar Chart */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Enrollment Forecast</h3>
                    <span className="text-xs text-slate-500 mb-6">Python Linear Regression Trend Projection</span>
                    
                    <div className="flex-1 min-h-[220px] w-full flex items-center justify-center">
                        {forecastData ? (
                            <div className="w-full h-full flex flex-col justify-between">
                                <div className="flex-1 min-h-[170px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.85}/>
                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85}/>
                                                </linearGradient>
                                                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis
                                                dataKey="month"
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
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.is_forecast ? 'url(#forecastGrad)' : 'url(#historicalGrad)'}
                                                        stroke={entry.is_forecast ? '#6366f1' : 'none'}
                                                        strokeWidth={entry.is_forecast ? 1 : 0}
                                                        strokeDasharray={entry.is_forecast ? '3 3' : '0'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-col gap-1 text-2xs border-t border-slate-800 pt-3 mt-3">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-sm bg-sky-400" /> Historical Months
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-sm border border-indigo-400 bg-indigo-500/20" /> 3-Month Projection
                                        </span>
                                    </div>
                                    <div className="text-right text-indigo-400 font-mono font-semibold">
                                        Regression Slope: +{forecastData.slope.toFixed(1)} students/mo
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-500">Loading enrollment trend...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
