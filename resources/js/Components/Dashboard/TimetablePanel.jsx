import React from 'react';

export default function TimetablePanel({
    timetable,
    batches,
    faculty,
    timetableForm,
    setTimetableForm,
    handleScheduleClass
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Master Course Schedules</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Day</th>
                                    <th className="py-3 px-4 font-semibold">Subject</th>
                                    <th className="py-3 px-4 font-semibold">Batch</th>
                                    <th className="py-3 px-4 font-semibold">Faculty</th>
                                    <th className="py-3 px-4 font-semibold">Time</th>
                                    <th className="py-3 px-4 font-semibold">Room</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {timetable.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                        <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                        <td className="py-3 px-4">{t.batch?.name}</td>
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
                                        <td colSpan="6" className="py-8 text-center text-slate-500">No schedules recorded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Timetable Scheduler</h3>
                    <form onSubmit={handleScheduleClass} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Batch Cohort</label>
                            <select
                                value={timetableForm.batch_id}
                                onChange={(e) => setTimetableForm({ ...timetableForm, batch_id: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Select batch...</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.course?.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Faculty Member</label>
                            <select
                                value={timetableForm.faculty_id}
                                onChange={(e) => setTimetableForm({ ...timetableForm, faculty_id: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Assign faculty...</option>
                                {faculty.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.user?.name} ({f.department})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Subject Title</label>
                            <input
                                type="text"
                                value={timetableForm.subject_name}
                                onChange={(e) => setTimetableForm({ ...timetableForm, subject_name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. Algorithms"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Day</label>
                            <select
                                value={timetableForm.day_of_week}
                                onChange={(e) => setTimetableForm({ ...timetableForm, day_of_week: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={timetableForm.start_time}
                                    onChange={(e) => setTimetableForm({ ...timetableForm, start_time: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={timetableForm.end_time}
                                    onChange={(e) => setTimetableForm({ ...timetableForm, end_time: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Lecture Room / Lab</label>
                            <input
                                type="text"
                                placeholder="e.g. Lab 1, Room 102"
                                value={timetableForm.room_number}
                                onChange={(e) => setTimetableForm({ ...timetableForm, room_number: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-650/20"
                        >
                            Schedule Class Slot
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
