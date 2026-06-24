import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SettingsPanel({ showMessage }) {
    const [settingsForm, setSettingsForm] = useState({
        institution_name: '',
        logo_url: '',
        domain_url: '',
        grade_threshold_a_plus: '',
        grade_threshold_a: '',
        grade_threshold_b: '',
        grade_threshold_c: ''
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/settings');
            setSettingsForm({
                institution_name: res.data.institution_name || '',
                logo_url: res.data.logo_url || '',
                domain_url: res.data.domain_url || '',
                grade_threshold_a_plus: res.data.grade_threshold_a_plus?.toString() || '90',
                grade_threshold_a: res.data.grade_threshold_a?.toString() || '80',
                grade_threshold_b: res.data.grade_threshold_b?.toString() || '70',
                grade_threshold_c: res.data.grade_threshold_c?.toString() || '60'
            });
        } catch (err) {
            showMessage('Failed to load system settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.post('/api/settings', settingsForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                // Force hot reload of Inertia shared props so that the dashboard updates its title/logo
                window.location.reload();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to update system settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="h-8 w-8 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin mb-2" />
                <span className="text-slate-400 text-xs">Loading institutional preferences...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BRANDING PREFERENCES CARD */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Institutional Branding</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">Customize the public name, portal styling links, and official document headers for the institution.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Institution Name</label>
                                <input
                                    type="text"
                                    value={settingsForm.institution_name}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, institution_name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. Academy of Science"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Domain Address / Website URL</label>
                                <input
                                    type="text"
                                    value={settingsForm.domain_url}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, domain_url: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    value={settingsForm.logo_url}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                                    placeholder="e.g. https://domain.com/logo.png"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRADING BENCHMARKS CARD */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Grading Scale Thresholds</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">Define the minimum percentage required for each letter grade score in official transcript report cards.</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">A+ Threshold (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsForm.grade_threshold_a_plus}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, grade_threshold_a_plus: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">A Threshold (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsForm.grade_threshold_a}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, grade_threshold_a: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">B Threshold (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsForm.grade_threshold_b}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, grade_threshold_b: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">C Threshold (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsForm.grade_threshold_c}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, grade_threshold_c: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end mt-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm rounded-xl transition duration-200 shadow-lg shadow-indigo-500/10 flex items-center gap-2 transform hover:scale-[1.01]"
                >
                    {saving ? (
                        <>
                            <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                            Saving Preferences...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save System Settings
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
