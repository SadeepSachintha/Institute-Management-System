import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 focus:border-indigo-400 focus:bg-indigo-900/50 focus:text-white'
                    : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/50 hover:text-white focus:border-slate-800 focus:bg-slate-900/50 focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
