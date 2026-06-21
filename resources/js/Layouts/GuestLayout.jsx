import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
            {/* Glowing background circles for visual depth */}
            <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none animate-pulse" />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="mb-6 h-16 w-16">
                    <Link href="/">
                        <ApplicationLogo className="h-full w-full" />
                    </Link>
                </div>

                <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:border-indigo-500/30 shadow-indigo-500/5">
                    {children}
                </div>
            </div>
        </div>
    );
}
