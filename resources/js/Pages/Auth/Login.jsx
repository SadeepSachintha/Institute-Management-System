import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [activeCredentialRole, setActiveCredentialRole] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Quick-Fill Demo credentials list
    const quickLogins = [
        { role: 'Admin', email: 'admin@ims.com', desc: 'Control Center' },
        { role: 'Faculty', email: 'alan@ims.com', desc: 'Academics Portal' },
        { role: 'Student', email: 'john@ims.com', desc: 'Tuition & Grades' },
        { role: 'Parent', email: 'sarah@ims.com', desc: 'Absence alerts log' }
    ];

    const fillCredentials = (role, email) => {
        setActiveCredentialRole(role);
        setData(prev => ({
            ...prev,
            email: email,
            password: 'password'
        }));
        setTimeout(() => setActiveCredentialRole(null), 600);
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
            <Head title="Access Portal" />

            {/* Glowing background circles for visual depth */}
            <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none animate-pulse" />

            {/* Main Login Box */}
            <div className="relative z-10 w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:border-indigo-500/30 shadow-indigo-500/5">
                
                {/* Header / Brand Logo */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 mb-4">
                        <ApplicationLogo />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">IMS Central Core</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Access Authorization</p>
                </div>

                {status && (
                    <div className="mb-4 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Username / Email field */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Account Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            autoComplete="username"
                            required
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400" />
                    </div>

                    {/* Password field */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Password</label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-2xs text-slate-500 hover:text-indigo-400 transition"
                                >
                                    Forgot security key?
                                </Link>
                            )}
                        </div>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            autoComplete="current-password"
                            required
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-1.5 text-xs text-rose-400" />
                    </div>

                    {/* Remember Checkbox */}
                    <div className="flex items-center">
                        <input
                            id="remember"
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-offset-2 cursor-pointer"
                        />
                        <label htmlFor="remember" className="ms-2.5 text-xs text-slate-400 select-none cursor-pointer">
                            Keep session authorized
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {processing ? 'Authorizing...' : 'Request Access'}
                    </button>
                </form>

                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-slate-800/80"></div>
                    <span className="flex-shrink mx-3 text-4xs text-slate-600 uppercase tracking-widest">Or authenticate via</span>
                    <div className="flex-grow border-t border-slate-800/80"></div>
                </div>

                <a
                    href={route('auth.sso.redirect')}
                    className="w-full py-3 border border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20 text-indigo-300 font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:bg-indigo-950/40 active:scale-[0.98] cursor-pointer mb-2"
                >
                    🔑 Sign In with Keycloak SSO
                </a>

                {/* Interactive Demo Credentials Selector Panel */}
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4 text-center">
                        Authorized Demo Credentials
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                        {quickLogins.map(ql => (
                            <button
                                key={ql.role}
                                type="button"
                                onClick={() => fillCredentials(ql.role, ql.email)}
                                className={`text-left p-3 rounded-xl border bg-slate-950/40 hover:bg-slate-950 transition-all duration-300 relative overflow-hidden ${
                                    activeCredentialRole === ql.role ? 'border-indigo-500 shadow-indigo-500/10 shadow-lg scale-98' : 'border-slate-800/80 hover:border-slate-700'
                                }`}
                            >
                                {activeCredentialRole === ql.role && (
                                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                                )}
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                    {ql.role}
                                </div>
                                <div className="text-3xs text-slate-500 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {ql.email}
                                </div>
                                <div className="text-4xs text-indigo-300 uppercase tracking-widest mt-0.5">
                                    {ql.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
