import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white glow-text">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-4 shadow-xl sm:rounded-2xl sm:p-8 hover:border-indigo-500/10 transition-all duration-300">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-4 shadow-xl sm:rounded-2xl sm:p-8 hover:border-indigo-500/10 transition-all duration-300">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-4 shadow-xl sm:rounded-2xl sm:p-8 hover:border-indigo-500/10 transition-all duration-300">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
