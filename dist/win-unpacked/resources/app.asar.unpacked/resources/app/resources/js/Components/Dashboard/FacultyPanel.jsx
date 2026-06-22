import React, { useState } from 'react';
import axios from 'axios';

export default function FacultyPanel({
    activeTab,
    user,
    timetable,
    students,
    selectedTimetableId,
    handleAttendanceTimetableSelect,
    attendanceData,
    setAttendanceData,
    handleSaveAttendance,
    grades,
    gradeForm,
    setGradeForm,
    handleAddGrade,
    leaveForm,
    setLeaveForm,
    handleRequestLeave,
    leaves,
    loadTabData,
    showMessage
}) {
    const facultyClasses = timetable.filter((t) => t.faculty?.user_id === user.id);
    const facultyLeaves = leaves.filter((l) => l.faculty?.user_id === user.id);

    const [gradeEntryMode, setGradeEntryMode] = useState('single'); // 'single' or 'bulk'
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [previewHeaders, setPreviewHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [totalPreviewCount, setTotalPreviewCount] = useState(0);
    const [importErrors, setImportErrors] = useState([]);
    const [isImporting, setIsImporting] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = ["Student ID", "Subject Name", "Assessment Name", "Marks Obtained", "Max Marks", "Weight"];
        const rows = [
            ["STU-2026-0001", "Data Structures", "Assignment 1", "85.5", "100", "10%"],
            ["STU-2026-0002", "Data Structures", "Midterm Exam", "78", "100", "0.30"],
            ["1", "Linear Algebra", "Quiz 1", "9.5", "10", "5%"]
        ];
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bulk_grades_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (file) => {
        if (!file) return;
        setSelectedFile(file);
        setImportErrors([]);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
                const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim()));
                setPreviewHeaders(headers);
                setPreviewRows(rows);
                setTotalPreviewCount(lines.length - 1);
            }
        };
        reader.readAsText(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleProcessImport = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsImporting(true);
        setImportErrors([]);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await axios.post('/api/grades/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setSelectedFile(null);
                setPreviewHeaders([]);
                setPreviewRows([]);
                setTotalPreviewCount(0);
                setGradeEntryMode('single');
                if (loadTabData) {
                    loadTabData();
                }
            }
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setImportErrors(err.response.data.errors);
                showMessage(err.response.data.message || 'Import failed due to validation errors.', 'error');
            } else {
                showMessage(err.response?.data?.message || 'An error occurred during bulk import.', 'error');
            }
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="w-full">
            {/* TAB: TEACHING SCHEDULE (Faculty) */}
            {activeTab === 'schedule' && (
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">My Assigned Class Schedule</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Day</th>
                                    <th className="py-3 px-4 font-semibold">Subject</th>
                                    <th className="py-3 px-4 font-semibold">Cohort Batch</th>
                                    <th className="py-3 px-4 font-semibold">Time</th>
                                    <th className="py-3 px-4 font-semibold">Room / Lab</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {facultyClasses.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                        <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                        <td className="py-3 px-4">{t.batch?.name}</td>
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
                                {facultyClasses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500">No classes assigned.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: ATTENDANCE LOG (Faculty) */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Choose Lecture Session</h3>
                        <div className="space-y-4">
                            {facultyClasses.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => handleAttendanceTimetableSelect(t.id)}
                                    className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 ${
                                        selectedTimetableId === t.id
                                            ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="font-semibold text-indigo-350">{t.subject_name}</div>
                                    <div className="text-xs text-slate-400 mt-1">{t.batch?.name} ({t.day_of_week})</div>
                                    <div className="text-xs text-slate-550 font-mono mt-1">
                                        {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}
                                    </div>
                                </div>
                            ))}
                            {facultyClasses.length === 0 && (
                                <span className="text-xs text-slate-500 block text-center py-6">No teaching sessions scheduled.</span>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {selectedTimetableId ? (
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-1">Session Attendance Roster</h3>
                                <span className="text-xs text-slate-500 block mb-6">Mark absent students to trigger parent alerts</span>
                                <form onSubmit={handleSaveAttendance} className="space-y-6">
                                    <div className="divide-y divide-slate-800/50 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                                        {students.filter((s) => s.status === 'enrolled').map((s) => (
                                            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20">
                                                <div>
                                                    <div className="font-semibold text-white text-sm">{s.user?.name}</div>
                                                    <div className="text-2xs font-mono text-slate-500">{s.student_id}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['present', 'absent', 'late'].map((st) => (
                                                        <button
                                                            key={st}
                                                            type="button"
                                                            onClick={() => setAttendanceData({ ...attendanceData, [s.id]: st })}
                                                            className={`px-3 py-1 rounded text-xs font-semibold capitalize border transition-all ${
                                                                attendanceData[s.id] === st
                                                                    ? st === 'present'
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                                                                        : st === 'absent'
                                                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                                                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                                            }`}
                                                        >
                                                            {st}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-650/20"
                                    >
                                        Save & Dispatch Alerts
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[300px] shadow-lg">
                                <span className="text-sm text-slate-500">Please choose a scheduled session on the left to mark attendance.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: GRADEBOOK ENTRY (Faculty) */}
            {activeTab === 'gradebook' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-4">Grade Registry</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Student</th>
                                        <th className="py-3 px-4 font-semibold">Subject</th>
                                        <th className="py-3 px-4 font-semibold">Assessment</th>
                                        <th className="py-3 px-4 font-semibold">Score</th>
                                        <th className="py-3 px-4 font-semibold">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {grades.map((g) => (
                                        <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 text-white font-medium">{g.student?.user?.name}</td>
                                            <td className="py-3 px-4 text-indigo-300">{g.subject_name}</td>
                                            <td className="py-3 px-4">{g.assessment_name}</td>
                                            <td className="py-3 px-4 font-semibold text-slate-200">
                                                {g.marks_obtained} / {g.max_marks}
                                            </td>
                                            <td className="py-3 px-4 font-mono">{(g.weight * 100).toFixed(0)}%</td>
                                        </tr>
                                    ))}
                                    {grades.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500">No grades entries recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        {/* Toggle Tabs */}
                        <div className="flex border border-slate-800 rounded-lg p-1 bg-slate-950 mb-4">
                            <button
                                type="button"
                                onClick={() => setGradeEntryMode('single')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                                    gradeEntryMode === 'single'
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Single Entry
                            </button>
                            <button
                                type="button"
                                onClick={() => setGradeEntryMode('bulk')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                                    gradeEntryMode === 'bulk'
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Bulk Import (CSV)
                            </button>
                        </div>

                        {gradeEntryMode === 'single' ? (
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4">Input Grade</h3>
                                <form onSubmit={handleAddGrade} className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Select Student</label>
                                        <select
                                            value={gradeForm.student_id}
                                            onChange={(e) => setGradeForm({ ...gradeForm, student_id: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="">Choose student...</option>
                                            {students.filter((s) => s.status === 'enrolled').map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.user?.name} ({s.student_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Data Structures"
                                            value={gradeForm.subject_name}
                                            onChange={(e) => setGradeForm({ ...gradeForm, subject_name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Assessment Label</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Midterm, Assignment 1"
                                            value={gradeForm.assessment_name}
                                            onChange={(e) => setGradeForm({ ...gradeForm, assessment_name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Marks Obtained</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={gradeForm.marks_obtained}
                                                onChange={(e) => setGradeForm({ ...gradeForm, marks_obtained: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Maximum Marks</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={gradeForm.max_marks}
                                                onChange={(e) => setGradeForm({ ...gradeForm, max_marks: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Weight Ratio</label>
                                        <select
                                            value={gradeForm.weight}
                                            onChange={(e) => setGradeForm({ ...gradeForm, weight: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="0.05">5% (Quizzes)</option>
                                            <option value="0.10">10% (Homework / Labs)</option>
                                            <option value="0.30">30% (Midterm Exams)</option>
                                            <option value="0.50">50% (Final Exams / Projects)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-650/20"
                                    >
                                        Process Grade Entry
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Bulk CSV Importer</h3>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                                    >
                                        Download Template
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Upload a CSV file containing grades to import them in bulk.
                                </p>

                                <form onSubmit={handleProcessImport} className="space-y-4">
                                    {/* Drag & Drop Area */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative ${
                                            dragActive
                                                ? 'border-indigo-500 bg-indigo-950/20'
                                                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv,text/csv"
                                            onChange={(e) => handleFileChange(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-2 pointer-events-none">
                                            <div className="text-slate-400 font-medium text-sm">
                                                {selectedFile ? selectedFile.name : 'Drag and drop CSV here, or click to browse'}
                                            </div>
                                            {selectedFile && (
                                                <div className="text-2xs text-slate-500 font-mono">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview Table */}
                                    {previewRows.length > 0 && (
                                        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 p-3 space-y-2">
                                            <div className="flex justify-between items-center text-2xs text-slate-500">
                                                <span>CSV PREVIEW (first {previewRows.length} rows)</span>
                                                <span className="font-semibold">{totalPreviewCount} total rows</span>
                                            </div>
                                            <div className="overflow-x-auto text-[10px]">
                                                <table className="w-full text-left text-slate-400 divide-y divide-slate-800">
                                                    <thead>
                                                        <tr>
                                                            {previewHeaders.map((h, i) => (
                                                                <th key={i} className="pb-1 font-semibold text-slate-350">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-850">
                                                        {previewRows.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {row.map((cell, ci) => (
                                                                    <td key={ci} className="py-1 max-w-[80px] truncate" title={cell}>{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Errors Display */}
                                    {importErrors.length > 0 && (
                                        <div className="border border-red-900/30 rounded-lg bg-rose-950/20 p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                            <div className="text-xs font-bold text-rose-400">Import Validation Errors:</div>
                                            <div className="divide-y divide-rose-900/20 text-xs">
                                                {importErrors.map((err, idx) => (
                                                    <div key={idx} className="py-1 text-slate-300">
                                                        <span className="font-bold text-rose-400">Row {err.row}:</span> {err.error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!selectedFile || isImporting}
                                        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition shadow-lg ${
                                            !selectedFile || isImporting
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-650/20'
                                        }`}
                                    >
                                        {isImporting ? 'Processing Import...' : 'Process CSV Import'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: LEAVE REQUESTS (Faculty) */}
            {activeTab === 'leaves' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4">Request Leave</h3>
                            <form onSubmit={handleRequestLeave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={leaveForm.start_date}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={leaveForm.end_date}
                                            onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Reason Description</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Explain the leave request context..."
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-650/20"
                                >
                                    Submit Leave Form
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4">My Leave Ledger</h3>
                            <div className="space-y-4">
                                {facultyLeaves.map((l) => (
                                    <div key={l.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold text-white">{l.start_date} to {l.end_date}</div>
                                            <p className="text-xs text-slate-400 mt-1">Reason: "{l.reason}"</p>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs rounded-full uppercase tracking-wider font-semibold ${
                                            l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            l.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {l.status}
                                        </span>
                                    </div>
                                ))}
                                {facultyLeaves.length === 0 && (
                                    <span className="text-xs text-slate-500 block text-center py-6">No leaves requested.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
