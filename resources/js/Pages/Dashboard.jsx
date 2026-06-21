import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth.user;
    const role = user.role || 'student'; // admin, faculty, student, parent

    // UI Tab State
    const [activeTab, setActiveTab] = useState('');

    // Shared / Loaded States
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [grades, setGrades] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [workloads, setWorkloads] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [finance, setFinance] = useState(null);
    const [forecastData, setForecastData] = useState(null);

    // Form inputs states
    const [studentForm, setStudentForm] = useState({ name: '', email: '', status: 'applicant', academic_history: '', demographic_data: '', fee_id: '' });
    const [timetableForm, setTimetableForm] = useState({ batch_id: '', faculty_id: '', subject_name: '', day_of_week: 'Monday', start_time: '', end_time: '', room_number: '' });
    const [gradeForm, setGradeForm] = useState({ student_id: '', subject_name: '', assessment_name: '', marks_obtained: '', max_marks: '', weight: '0.10' });
    const [paymentForm, setPaymentForm] = useState({ invoice_id: '', amount_paid: '', payment_method: 'Sandbox Card', card_number: '4111222233334444' });
    const [leaveForm, setLeaveForm] = useState({ faculty_id: '', start_date: '', end_date: '', reason: '' });
    
    // Attendance Submission State
    const [selectedTimetableId, setSelectedTimetableId] = useState('');
    const [attendanceData, setAttendanceData] = useState({}); // student_id -> status

    // Upload state
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadStudentId, setUploadStudentId] = useState('');

    // AI Prediction Cache
    const [aiRiskCache, setAiRiskCache] = useState({}); // student_id -> prediction object
    const [predictingId, setPredictingId] = useState(null);

    // Modal / Alert state
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('info'); // success, error, info
    const [workflowReceipt, setWorkflowReceipt] = useState(null);

    // Default Tab setting
    useEffect(() => {
        if (role === 'admin') setActiveTab('sis');
        else if (role === 'faculty') setActiveTab('schedule');
        else if (role === 'student') setActiveTab('profile');
        else if (role === 'parent') setActiveTab('child');
    }, [role]);

    // Data Load trigger
    useEffect(() => {
        if (activeTab) {
            loadTabData();
        }
    }, [activeTab]);

    const showMessage = (msg, type = 'info') => {
        setAlertMessage(msg);
        setAlertType(type);
        setTimeout(() => setAlertMessage(null), 8000);
    };

    const loadTabData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sis' || activeTab === 'gradebook' || activeTab === 'attendance' || activeTab === 'student_grades') {
                const res = await axios.get('/api/students');
                setStudents(res.data);
                
                const struct = await axios.get('/api/academic-structure');
                setCourses(struct.data.courses);
                setBatches(struct.data.batches);
            }
            
            if (activeTab === 'schedule' || activeTab === 'timetabling') {
                const res = await axios.get('/api/timetable');
                setTimetable(res.data);
                
                const struct = await axios.get('/api/academic-structure');
                setBatches(struct.data.batches);
                
                const fac = await axios.get('/api/faculty');
                setFaculty(fac.data.faculty);
            }
            
            if (activeTab === 'attendance') {
                const res = await axios.get('/api/timetable');
                setTimetable(res.data);
                
                const att = await axios.get('/api/attendance');
                setAttendance(att.data);
            }
            
            if (activeTab === 'gradebook') {
                const res = await axios.get('/api/grades');
                setGrades(res.data);
            }
            
            if (activeTab === 'finance' || activeTab === 'student_finance') {
                const res = await axios.get('/api/finance');
                setFinance(res.data);
            }
            
            if (activeTab === 'hr' || activeTab === 'leaves') {
                const res = await axios.get('/api/faculty');
                setFaculty(res.data.faculty);
                setWorkloads(res.data.workload);
                setLeaves(res.data.leaves);
                
                // Set default faculty_id in leave form if teacher
                if (role === 'faculty') {
                    const matched = res.data.faculty.find(f => f.user_id === user.id);
                    if (matched) setLeaveForm(prev => ({ ...prev, faculty_id: matched.id }));
                }
            }
            
            if (activeTab === 'analytics') {
                const res = await axios.get('/api/students');
                setStudents(res.data);
                
                const forecast = await axios.get('/api/analytics/enrollment-forecast');
                setForecastData(forecast.data);
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Error loading records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Form Submissions
    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/students', studentForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setStudentForm({ name: '', email: '', status: 'applicant', academic_history: '', demographic_data: '', fee_id: '' });
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to onboard student.', 'error');
        }
    };

    const handleUploadDoc = async (e) => {
        e.preventDefault();
        if (!uploadFile || !uploadStudentId) {
            showMessage('Please select a file and student.', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('document', uploadFile);
        try {
            const res = await axios.post(`/api/students/${uploadStudentId}/document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setUploadFile(null);
                setUploadStudentId('');
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to upload document.', 'error');
        }
    };

    const handleScheduleClass = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/timetable', timetableForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setTimetableForm({ batch_id: '', faculty_id: '', subject_name: '', day_of_week: 'Monday', start_time: '', end_time: '', room_number: '' });
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to schedule class.', 'error');
        }
    };

    const handleAttendanceTimetableSelect = (tid) => {
        setSelectedTimetableId(tid);
        const slot = timetable.find(t => t.id === parseInt(tid));
        if (slot) {
            // Find students of the course batch
            const batchStudents = students.filter(s => s.status === 'enrolled'); // simplified mock filter
            const initAtt = {};
            batchStudents.forEach(s => {
                initAtt[s.id] = 'present';
            });
            setAttendanceData(initAtt);
        }
    };

    const handleSaveAttendance = async (e) => {
        e.preventDefault();
        if (!selectedTimetableId) return;
        const payload = {
            date: new Date().toISOString().split('T')[0],
            timetable_id: selectedTimetableId,
            attendance_data: Object.keys(attendanceData).map(sid => ({
                student_id: parseInt(sid),
                status: attendanceData[sid]
            }))
        };
        try {
            const res = await axios.post('/api/attendance', payload);
            if (res.data.success) {
                showMessage('Attendance logged. Parents notified for absences.', 'success');
                setSelectedTimetableId('');
                setAttendanceData({});
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to submit attendance.', 'error');
        }
    };

    const handleAddGrade = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/grades', gradeForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setGradeForm({ student_id: '', subject_name: '', assessment_name: '', marks_obtained: '', max_marks: '', weight: '0.10' });
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to add grade.', 'error');
        }
    };

    const handleSandboxPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/finance/pay', paymentForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                
                // Check if workflow (applicant -> enrolled) was triggered
                if (res.data.workflow?.triggered) {
                    setWorkflowReceipt(res.data.workflow);
                }
                
                setPaymentForm({ invoice_id: '', amount_paid: '', payment_method: 'Sandbox Card', card_number: '4111222233334444' });
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to process payment.', 'error');
        }
    };

    const handleRequestLeave = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/faculty/leave', leaveForm);
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                setLeaveForm(prev => ({ ...prev, start_date: '', end_date: '', reason: '' }));
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to submit leave request.', 'error');
        }
    };

    const handleAdminLeaveDecision = async (lid, decision) => {
        try {
            const res = await axios.post(`/api/faculty/leave/${lid}/status`, { status: decision });
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to update leave status.', 'error');
        }
    };

    // Query AI Risk Model
    const assessStudentRisk = async (sid) => {
        setPredictingId(sid);
        try {
            const res = await axios.get(`/api/analytics/student-risk/${sid}`);
            setAiRiskCache(prev => ({
                ...prev,
                [sid]: res.data.prediction
            }));
            showMessage(`AI Model successfully analyzed student risk profile.`, 'success');
        } catch (err) {
            showMessage(err.response?.data?.message || 'FastAPI predictive analytics service unavailable.', 'error');
        } finally {
            setPredictingId(null);
        }
    };

    // Calculate dynamic CGPA helper
    const calculateCGPA = (studentGrades) => {
        let totalWeightedScore = 0;
        let totalWeight = 0;
        studentGrades.forEach(g => {
            const ratio = g.marks_obtained / g.max_marks;
            const score = ratio * 4.0; // scale to 4.0
            totalWeightedScore += score * parseFloat(g.weight);
            totalWeight += parseFloat(g.weight);
        });
        return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : 'N/A';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-white glow-text">
                        Institute Digital Dashboard
                    </h2>
                    <span className="rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                        {role} Portal
                    </span>
                </div>
            }
        >
            <Head title="IMS Control Center" />

            {/* Dark Styled Glass Container */}
            <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
                
                {/* Alert Notification Toast */}
                {alertMessage && (
                    <div className={`fixed top-5 right-5 z-50 rounded-xl px-5 py-4 border shadow-2xl backdrop-blur-lg flex items-center gap-3 animate-fade-in ${
                        alertType === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' :
                        alertType === 'error' ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' :
                        'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                    }`}>
                        <div className="h-2 w-2 rounded-full bg-current animate-ping" />
                        <span className="text-sm font-medium">{alertMessage}</span>
                    </div>
                )}

                {/* Workflow Activation ID Modal */}
                {workflowReceipt && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-md w-full p-8 text-center shadow-indigo-500/10 shadow-2xl">
                            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-4 text-2xl">
                                ✓
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Workflow Triggered: Student Enrolled!</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Invoice payment processed successfully. Applicant status upgraded.
                            </p>
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Student</div>
                                <div className="text-base font-semibold text-white mb-3">{workflowReceipt.student_name}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Assigned Student ID</div>
                                <div className="text-xl font-mono font-bold text-indigo-300 tracking-wider bg-indigo-950/30 border border-indigo-500/20 py-2 rounded-lg">
                                    {workflowReceipt.student_id}
                                </div>
                            </div>
                            <button
                                onClick={() => setWorkflowReceipt(null)}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all duration-200"
                            >
                                Close Receipt
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    
                    {/* Navigation Tab Menu */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-6">
                        {role === 'admin' && (
                            <>
                                <button onClick={() => setActiveTab('sis')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'sis' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    SIS Admissions
                                </button>
                                <button onClick={() => setActiveTab('timetabling')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'timetabling' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Class Scheduling
                                </button>
                                <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Financials & Fee
                                </button>
                                <button onClick={() => setActiveTab('hr')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'hr' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    HR & Workloads
                                </button>
                                <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    AI Warning & Analytics
                                </button>
                            </>
                        )}

                        {role === 'faculty' && (
                            <>
                                <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'schedule' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Teaching Schedule
                                </button>
                                <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Log Attendance
                                </button>
                                <button onClick={() => setActiveTab('gradebook')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'gradebook' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Gradebook Entry
                                </button>
                                <button onClick={() => setActiveTab('leaves')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Leave Management
                                </button>
                            </>
                        )}

                        {role === 'student' && (
                            <>
                                <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    My Profile
                                </button>
                                <button onClick={() => setActiveTab('student_schedule')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'student_schedule' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    My Schedule
                                </button>
                                <button onClick={() => setActiveTab('student_grades')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'student_grades' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Grades & CGPA
                                </button>
                                <button onClick={() => setActiveTab('student_finance')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'student_finance' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Tuition Sandbox
                                </button>
                            </>
                        )}

                        {role === 'parent' && (
                            <>
                                <button onClick={() => setActiveTab('child')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'child' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
                                    Children Profiles
                                </button>
                            </>
                        )}
                    </div>

                    {/* Active Loading Screen */}
                    {loading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="h-10 w-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin mb-4" />
                            <span className="ml-3 text-slate-400 text-sm">Synchronizing core logs...</span>
                        </div>
                    )}

                    {/* Content Section */}
                    {!loading && (
                        <div className="grid grid-cols-1 gap-6">

                            {/* TAB: SIS ADMISSIONS (Admin) */}
                            {activeTab === 'sis' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Students List Table */}
                                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">SIS Central Registry</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-400">
                                                    <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                                        <tr>
                                                            <th className="py-3 px-4 font-semibold">Student ID</th>
                                                            <th className="py-3 px-4 font-semibold">Name</th>
                                                            <th className="py-3 px-4 font-semibold">Email</th>
                                                            <th className="py-3 px-4 font-semibold">Status</th>
                                                            <th className="py-3 px-4 font-semibold">Document</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/50">
                                                        {students.map(s => (
                                                            <tr key={s.id} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{s.student_id}</td>
                                                                <td className="py-3 px-4 text-white font-medium">{s.user?.name}</td>
                                                                <td className="py-3 px-4">{s.user?.email}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                        s.status === 'enrolled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                        s.status === 'applicant' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                                    }`}>
                                                                        {s.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    {s.document_path ? (
                                                                        <span className="text-xs text-emerald-400">✓ Verified</span>
                                                                    ) : (
                                                                        <span className="text-xs text-rose-400">Missing</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Onboard Form */}
                                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Onboard Student</h3>
                                            <form onSubmit={handleAddStudent} className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                                                    <input type="text" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                                                    <input type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Initial Onboarding State</label>
                                                    <select value={studentForm.status} onChange={e => setStudentForm({ ...studentForm, status: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                                                        <option value="inquiry">Inquiry Only</option>
                                                        <option value="applicant">Applicant (Creates Billing Invoice)</option>
                                                        <option value="enrolled">Enrolled Directly</option>
                                                    </select>
                                                </div>
                                                {studentForm.status === 'applicant' && (
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Tuition Fee Category</label>
                                                        <select value={studentForm.fee_id} onChange={e => setStudentForm({ ...studentForm, fee_id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                            <option value="">Select tuition scale...</option>
                                                            {finance?.fees?.map(f => (
                                                                <option key={f.id} value={f.id}>{f.name} (${f.amount})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Demographics</label>
                                                    <input type="text" placeholder="Address, City" value={studentForm.demographic_data} onChange={e => setStudentForm({ ...studentForm, demographic_data: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
                                                    Process Onboarding
                                                </button>
                                            </form>
                                        </div>

                                        {/* Document management */}
                                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Onboarding Verification</h3>
                                            <form onSubmit={handleUploadDoc} className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Select Student</label>
                                                    <select value={uploadStudentId} onChange={e => setUploadStudentId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                        <option value="">Choose student profile...</option>
                                                        {students.map(s => (
                                                            <option key={s.id} value={s.id}>{s.user?.name} ({s.student_id})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Attach ID / Transcripts (PDF/Image)</label>
                                                    <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 hover:file:bg-slate-800 cursor-pointer" required />
                                                </div>
                                                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition">
                                                    Verify Transcripts
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: CLASS SCHEDULING (Admin) */}
                            {activeTab === 'timetabling' && (
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
                                                        {timetable.map(t => (
                                                            <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                                                <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                                                <td className="py-3 px-4">{t.batch?.name}</td>
                                                                <td className="py-3 px-4">{t.faculty?.user?.name}</td>
                                                                <td className="py-3 px-4 font-mono">{t.start_time.slice(0,5)} - {t.end_time.slice(0,5)}</td>
                                                                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">{t.room_number}</span></td>
                                                            </tr>
                                                        ))}
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
                                                    <select value={timetableForm.batch_id} onChange={e => setTimetableForm({ ...timetableForm, batch_id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                        <option value="">Select batch...</option>
                                                        {batches.map(b => (
                                                            <option key={b.id} value={b.id}>{b.name} ({b.course?.name})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Faculty Member</label>
                                                    <select value={timetableForm.faculty_id} onChange={e => setTimetableForm({ ...timetableForm, faculty_id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                        <option value="">Assign faculty...</option>
                                                        {faculty.map(f => (
                                                            <option key={f.id} value={f.id}>{f.user?.name} ({f.department})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Subject Title</label>
                                                    <input type="text" value={timetableForm.subject_name} onChange={e => setTimetableForm({ ...timetableForm, subject_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Day</label>
                                                    <select value={timetableForm.day_of_week} onChange={e => setTimetableForm({ ...timetableForm, day_of_week: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
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
                                                        <input type="time" value={timetableForm.start_time} onChange={e => setTimetableForm({ ...timetableForm, start_time: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">End Time</label>
                                                        <input type="time" value={timetableForm.end_time} onChange={e => setTimetableForm({ ...timetableForm, end_time: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Lecture Room / Lab</label>
                                                    <input type="text" placeholder="e.g. Lab 1, Room 102" value={timetableForm.room_number} onChange={e => setTimetableForm({ ...timetableForm, room_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
                                                    Schedule Class Slot
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: FINANCIAL & FEE MANAGEMENT (Admin) */}
                            {activeTab === 'finance' && finance && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Metrics summary cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Total Net Billed</span>
                                            <span className="text-3xl font-bold text-white mt-2">${finance.metrics.total_billed}</span>
                                        </div>
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Revenue Collected</span>
                                            <span className="text-3xl font-bold text-emerald-400 mt-2">${finance.metrics.total_paid}</span>
                                        </div>
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Outstanding Balance</span>
                                            <span className="text-3xl font-bold text-rose-400 mt-2">${finance.metrics.outstanding}</span>
                                        </div>
                                    </div>

                                    {/* Charts and table */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
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
                                                        {finance.invoices.map(inv => (
                                                            <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-4 text-white font-medium">{inv.student?.user?.name}</td>
                                                                <td className="py-3 px-4 text-indigo-300">{inv.fee?.name}</td>
                                                                <td className="py-3 px-4 font-semibold text-slate-200">${inv.amount - inv.discount}</td>
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
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Pure SVG Line Chart representing Daily Revenue */}
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
                                            <h3 className="text-lg font-bold text-white mb-2">Daily Revenue Trend</h3>
                                            <span className="text-xs text-slate-500 mb-6">Real-time collections charting</span>
                                            <div className="flex-1 min-h-[200px] flex items-center justify-center">
                                                {finance.revenue_trend.length > 0 ? (
                                                    <svg viewBox="0 0 300 150" className="w-full h-full text-emerald-400">
                                                        {/* Grid Lines */}
                                                        <line x1="20" y1="20" x2="280" y2="20" stroke="#1e293b" strokeWidth="1" />
                                                        <line x1="20" y1="70" x2="280" y2="70" stroke="#1e293b" strokeWidth="1" />
                                                        <line x1="20" y1="120" x2="280" y2="120" stroke="#1e293b" strokeWidth="1" />
                                                        {/* Line Plot */}
                                                        <polyline
                                                            fill="none"
                                                            stroke="#34d399"
                                                            strokeWidth="3"
                                                            points={finance.revenue_trend.map((d, i) => {
                                                                const x = 20 + (i * (260 / Math.max(1, finance.revenue_trend.length - 1)));
                                                                const y = 120 - (parseFloat(d.revenue) / 20); // scaling
                                                                return `${x},${y}`;
                                                            }).join(' ')}
                                                        />
                                                        {/* Dot Markers */}
                                                        {finance.revenue_trend.map((d, i) => {
                                                            const x = 20 + (i * (260 / Math.max(1, finance.revenue_trend.length - 1)));
                                                            const y = 120 - (parseFloat(d.revenue) / 20);
                                                            return <circle key={i} cx={x} cy={y} r="4" className="fill-emerald-400 stroke-slate-950 stroke-2" />;
                                                        })}
                                                    </svg>
                                                ) : (
                                                    <span className="text-xs text-slate-500">No payment logs recorded yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: HR & WORKLOADS (Admin) */}
                            {activeTab === 'hr' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Faculty workload mapping */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Faculty Workload Distribution</h3>
                                            <div className="space-y-6">
                                                {workloads.map(f => {
                                                    const ratio = Math.min(100, (f.current_hours / f.max_hours) * 100);
                                                    return (
                                                        <div key={f.faculty_id} className="space-y-2">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <div>
                                                                    <span className="font-semibold text-white">{f.name}</span>
                                                                    <span className="text-xs text-slate-500 ml-2">({f.department})</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-mono text-slate-300 font-semibold">{f.current_hours}h</span>
                                                                    <span className="text-slate-500"> / {f.max_hours}h max</span>
                                                                </div>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                                                <div
                                                                    style={{ width: `${ratio}%` }}
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        f.status === 'Overloaded' ? 'bg-rose-500' :
                                                                        f.status === 'Optimal' ? 'bg-indigo-500' :
                                                                        'bg-sky-500'
                                                                    }`}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-slate-500">Allocation ratio: {ratio.toFixed(0)}%</span>
                                                                <span className={`font-semibold ${
                                                                    f.status === 'Overloaded' ? 'text-rose-400' :
                                                                    f.status === 'Optimal' ? 'text-indigo-400' :
                                                                    'text-sky-400'
                                                                }`}>{f.status}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leaves Requests Panel */}
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Leaves Approvals Portal</h3>
                                        <div className="space-y-4">
                                            {leaves.map(l => (
                                                <div key={l.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-semibold text-white text-sm">{l.faculty?.user?.name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {l.start_date} to {l.end_date}
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 text-2xs rounded-full uppercase tracking-wider font-bold ${
                                                            l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            l.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                                                            'bg-amber-500/10 text-amber-400'
                                                        }`}>
                                                            {l.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 italic">"{l.reason}"</p>
                                                    {l.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAdminLeaveDecision(l.id, 'approved')}
                                                                className="flex-1 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdminLeaveDecision(l.id, 'rejected')}
                                                                className="flex-1 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {leaves.length === 0 && (
                                                <span className="text-xs text-slate-500 block text-center py-6">No leave requests logged.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: AI WARNING & ANALYTICS (Admin) */}
                            {activeTab === 'analytics' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        
                                        {/* Predictor Dashboard */}
                                        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-2">Early Warning System</h3>
                                            <p className="text-xs text-slate-500 mb-6">AI evaluation of student drop-out risks based on attendance and grading dips</p>
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
                                                        {students.map(s => {
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
                                                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition disabled:opacity-50"
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

                                        {/* Enrollment Forecast SVG Chart */}
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
                                            <h3 className="text-lg font-bold text-white mb-2">Enrollment Forecast</h3>
                                            <span className="text-xs text-slate-500 mb-6">Python Linear Regression Trend Projection</span>
                                            <div className="flex-1 min-h-[220px] flex items-center justify-center">
                                                {forecastData ? (
                                                    <div className="w-full space-y-4">
                                                        <svg viewBox="0 0 300 150" className="w-full h-full">
                                                            {/* Draw Grid Bars */}
                                                            {[...forecastData.history, ...forecastData.forecast].map((d, i) => {
                                                                const x = 20 + (i * 38);
                                                                const h = (d.count / 50) * 110; // scale max height
                                                                const y = 130 - h;
                                                                return (
                                                                    <g key={i}>
                                                                        <rect
                                                                            x={x}
                                                                            y={y}
                                                                            width="18"
                                                                            height={h}
                                                                            rx="2"
                                                                            className={d.is_forecast ? "fill-indigo-500/40 stroke-indigo-400 stroke-dashed" : "fill-indigo-600"}
                                                                        />
                                                                        <text x={x + 9} y="145" textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
                                                                            {d.month.split('-')[1]}
                                                                        </text>
                                                                        <text x={x + 9} y={y - 4} textAnchor="middle" className="fill-slate-300 font-mono text-[9px] font-bold">
                                                                            {d.count}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            })}
                                                            <line x1="10" y1="130" x2="290" y2="130" stroke="#334155" strokeWidth="1" />
                                                        </svg>
                                                        <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-3">
                                                            <span className="text-slate-500">Solid: Historical</span>
                                                            <span className="text-indigo-400 font-semibold">Dashed: Projected (Trend: +{forecastData.slope.toFixed(1)}/mo)</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">Loading enrollment trend...</span>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* TAB: TEACHING SCHEDULE (Faculty) */}
                            {activeTab === 'schedule' && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">My Assign Class Scheduling</h3>
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
                                                {timetable.filter(t => t.faculty?.user_id === user.id).map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                                        <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                                        <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                                        <td className="py-3 px-4">{t.batch?.name}</td>
                                                        <td className="py-3 px-4 font-mono">{t.start_time.slice(0,5)} - {t.end_time.slice(0,5)}</td>
                                                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">{t.room_number}</span></td>
                                                    </tr>
                                                ))}
                                                {timetable.filter(t => t.faculty?.user_id === user.id).length === 0 && (
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
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Choose Lecture Session</h3>
                                        <div className="space-y-4">
                                            {timetable.filter(t => t.faculty?.user_id === user.id).map(t => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => handleAttendanceTimetableSelect(t.id)}
                                                    className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 ${
                                                        selectedTimetableId === t.id ? 'bg-indigo-950/40 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-indigo-300">{t.subject_name}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{t.batch?.name} ({t.day_of_week})</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-1">{t.start_time.slice(0,5)} - {t.end_time.slice(0,5)}</div>
                                                </div>
                                            ))}
                                            {timetable.filter(t => t.faculty?.user_id === user.id).length === 0 && (
                                                <span className="text-xs text-slate-500 block text-center py-6">No teaching sessions scheduled.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        {selectedTimetableId ? (
                                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-1">Session Attendance Roster</h3>
                                                <span className="text-xs text-slate-500 block mb-6">Mark absent students to trigger parents warning alerts</span>
                                                <form onSubmit={handleSaveAttendance} className="space-y-6">
                                                    <div className="divide-y divide-slate-800/50 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                                                        {students.filter(s => s.status === 'enrolled').map(s => (
                                                            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20">
                                                                <div>
                                                                    <div className="font-semibold text-white text-sm">{s.user?.name}</div>
                                                                    <div className="text-2xs font-mono text-slate-500">{s.student_id}</div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {['present', 'absent', 'late'].map(st => (
                                                                        <button
                                                                            key={st}
                                                                            type="button"
                                                                            onClick={() => setAttendanceData({ ...attendanceData, [s.id]: st })}
                                                                            className={`px-3 py-1 rounded text-xs font-semibold capitalize border transition-all ${
                                                                                attendanceData[s.id] === st ? (
                                                                                    st === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' :
                                                                                    st === 'absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/40' :
                                                                                    'bg-amber-500/10 text-amber-400 border-amber-500/40'
                                                                                ) : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                                                            }`}
                                                                        >
                                                                            {st}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
                                                        Save & Dispatch Alerts
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                                                <span className="text-sm text-slate-500">Please choose a scheduled session on the left to mark attendance.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: GRADEBOOK ENTRY (Faculty) */}
                            {activeTab === 'gradebook' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
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
                                                    {grades.map(g => (
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
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Input Grade</h3>
                                            <form onSubmit={handleAddGrade} className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Select Student</label>
                                                    <select value={gradeForm.student_id} onChange={e => setGradeForm({ ...gradeForm, student_id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                        <option value="">Choose student...</option>
                                                        {students.filter(s => s.status === 'enrolled').map(s => (
                                                            <option key={s.id} value={s.id}>{s.user?.name} ({s.student_id})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Subject</label>
                                                    <input type="text" placeholder="e.g. Data Structures" value={gradeForm.subject_name} onChange={e => setGradeForm({ ...gradeForm, subject_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Assessment Label</label>
                                                    <input type="text" placeholder="e.g. Midterm, Assignment 1" value={gradeForm.assessment_name} onChange={e => setGradeForm({ ...gradeForm, assessment_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Marks Obtained</label>
                                                        <input type="number" step="0.1" value={gradeForm.marks_obtained} onChange={e => setGradeForm({ ...gradeForm, marks_obtained: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Maximum Marks</label>
                                                        <input type="number" step="0.1" value={gradeForm.max_marks} onChange={e => setGradeForm({ ...gradeForm, max_marks: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Weight Ratio</label>
                                                    <select value={gradeForm.weight} onChange={e => setGradeForm({ ...gradeForm, weight: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                                                        <option value="0.05">5% (Quizzes)</option>
                                                        <option value="0.10">10% (Homework / Labs)</option>
                                                        <option value="0.30">30% (Midterm Exams)</option>
                                                        <option value="0.50">50% (Final Exams / Projects)</option>
                                                    </select>
                                                </div>
                                                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
                                                    Process Grade Entry
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: LEAVE REQUESTS (Faculty) */}
                            {activeTab === 'leaves' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                                    <div className="space-y-6">
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Request Leave</h3>
                                            <form onSubmit={handleRequestLeave} className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                                                        <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 block mb-1">End Date</label>
                                                        <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Reason Description</label>
                                                    <textarea rows="4" placeholder="Explain the leave request context..." value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
                                                    Submit Leave Form
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">My Leave Ledger</h3>
                                            <div className="space-y-4">
                                                {leaves.filter(l => l.faculty?.user_id === user.id).map(l => (
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
                                                {leaves.filter(l => l.faculty?.user_id === user.id).length === 0 && (
                                                    <span className="text-xs text-slate-500 block text-center py-6">No leaves requested.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: MY PROFILE (Student) */}
                            {activeTab === 'profile' && (
                                <div className="max-w-md mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                                    {/* Student Card UI */}
                                    <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 text-3xl font-bold mx-auto mb-4 uppercase">
                                        {user.name.slice(0,2)}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{user.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono tracking-widest uppercase block mt-1">Student Profile</span>
                                    
                                    {/* ID tag details */}
                                    {students.find(s => s.user_id === user.id) ? (
                                        (() => {
                                            const sProfile = students.find(s => s.user_id === user.id);
                                            return (
                                                <div className="mt-8 space-y-4">
                                                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                                                        <div className="grid grid-cols-2 gap-4 text-left">
                                                            <div>
                                                                <span className="text-3xs uppercase tracking-widest text-slate-500 block">Student ID</span>
                                                                <span className="text-sm font-mono font-bold text-indigo-300">{sProfile.student_id}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-3xs uppercase tracking-widest text-slate-500 block">Status</span>
                                                                <span className="text-sm font-semibold capitalize text-white">{sProfile.status}</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-3xs uppercase tracking-widest text-slate-500 block">Demographics</span>
                                                                <span className="text-xs text-slate-300">{sProfile.demographic_data || 'None recorded'}</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-3xs uppercase tracking-widest text-slate-500 block">Academic Notes</span>
                                                                <span className="text-xs text-slate-300 italic">"{sProfile.academic_history || 'None'}"</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <span className="text-xs text-slate-500 block mt-8">Loading profile metadata...</span>
                                    )}
                                </div>
                            )}

                            {/* TAB: MY SCHEDULE (Student) */}
                            {activeTab === 'student_schedule' && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">My Lecture Timetable</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-400">
                                            <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                                <tr>
                                                    <th className="py-3 px-4 font-semibold">Day</th>
                                                    <th className="py-3 px-4 font-semibold">Subject</th>
                                                    <th className="py-3 px-4 font-semibold">Instructor</th>
                                                    <th className="py-3 px-4 font-semibold">Time</th>
                                                    <th className="py-3 px-4 font-semibold">Lecture Hall</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {/* Students get timetables. Simulating by listing all cs-2026 timetable items */}
                                                {timetable.map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                                                        <td className="py-3 px-4 text-white font-medium">{t.day_of_week}</td>
                                                        <td className="py-3 px-4 text-indigo-300 font-semibold">{t.subject_name}</td>
                                                        <td className="py-3 px-4">{t.faculty?.user?.name}</td>
                                                        <td className="py-3 px-4 font-mono">{t.start_time.slice(0,5)} - {t.end_time.slice(0,5)}</td>
                                                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">{t.room_number}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: GRADES & CGPA (Student) */}
                            {activeTab === 'student_grades' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">My Grade Transcript</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-400">
                                                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                                    <tr>
                                                        <th className="py-3 px-4 font-semibold">Subject</th>
                                                        <th className="py-3 px-4 font-semibold">Assessment</th>
                                                        <th className="py-3 px-4 font-semibold">Score</th>
                                                        <th className="py-3 px-4 font-semibold">Weight</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {/* Filter by matching logged student ID */}
                                                    {(() => {
                                                        const sProfile = students.find(s => s.user_id === user.id);
                                                        const sGrades = sProfile ? grades.filter(g => g.student_id === sProfile.id) : [];
                                                        
                                                        return sGrades.map(g => (
                                                            <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-4 text-white font-medium">{g.subject_name}</td>
                                                                <td className="py-3 px-4">{g.assessment_name}</td>
                                                                <td className="py-3 px-4 font-semibold text-slate-200">
                                                                    {g.marks_obtained} / {g.max_marks}
                                                                </td>
                                                                <td className="py-3 px-4 font-mono">{(g.weight * 100).toFixed(0)}%</td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* GPA assessment index cards */}
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center flex flex-col justify-center items-center">
                                        <h3 className="text-base font-bold text-white mb-2">Academic Standing</h3>
                                        <span className="text-xs text-slate-500 mb-6">Cumulative Grade Point Average</span>
                                        {(() => {
                                            const sProfile = students.find(s => s.user_id === user.id);
                                            const sGrades = sProfile ? grades.filter(g => g.student_id === sProfile.id) : [];
                                            const cgpa = calculateCGPA(sGrades);
                                            return (
                                                <div className="space-y-4">
                                                    <div className="text-5xl font-extrabold text-indigo-400 tracking-wider">
                                                        {cgpa}
                                                    </div>
                                                    <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-1.5 rounded-full inline-block">
                                                        Scale 4.0 GPA
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* TAB: TUITION SANDBOX (Student) */}
                            {activeTab === 'student_finance' && finance && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Outstanding Invoices</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-400">
                                                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                                    <tr>
                                                        <th className="py-3 px-4 font-semibold">Fee Description</th>
                                                        <th className="py-3 px-4 font-semibold">Amount</th>
                                                        <th className="py-3 px-4 font-semibold">Discount</th>
                                                        <th className="py-3 px-4 font-semibold">Net Balance</th>
                                                        <th className="py-3 px-4 font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {(() => {
                                                        const sProfile = students.find(s => s.user_id === user.id);
                                                        const sInvoices = sProfile ? finance.invoices.filter(i => i.student_id === sProfile.id) : [];
                                                        
                                                        return sInvoices.map(inv => (
                                                            <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                                                                <td className="py-3 px-4 text-white font-medium">{inv.fee?.name}</td>
                                                                <td className="py-3 px-4 font-semibold">${inv.amount}</td>
                                                                <td className="py-3 px-4 text-rose-400 font-semibold">-${inv.discount}</td>
                                                                <td className="py-3 px-4 text-indigo-300 font-bold">${inv.amount - inv.discount}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                    }`}>
                                                                        {inv.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Sandbox Payment Portal</h3>
                                            <form onSubmit={handleSandboxPayment} className="space-y-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Select Invoice</label>
                                                    <select value={paymentForm.invoice_id} onChange={e => {
                                                        const invId = e.target.value;
                                                        const sProfile = students.find(s => s.user_id === user.id);
                                                        const matching = sProfile ? finance.invoices.find(i => i.id === parseInt(invId)) : null;
                                                        setPaymentForm({
                                                            ...paymentForm,
                                                            invoice_id: invId,
                                                            amount_paid: matching ? (matching.amount - matching.discount).toString() : ''
                                                        });
                                                    }} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required>
                                                        <option value="">Choose invoice...</option>
                                                        {(() => {
                                                            const sProfile = students.find(s => s.user_id === user.id);
                                                            const unpaid = sProfile ? finance.invoices.filter(i => i.student_id === sProfile.id && i.status !== 'paid') : [];
                                                            return unpaid.map(i => (
                                                                <option key={i.id} value={i.id}>{i.fee?.name} (${i.amount - i.discount})</option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Amount to Pay ($)</label>
                                                    <input type="number" step="0.01" value={paymentForm.amount_paid} onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" required />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Card Number (Sandbox Simulation)</label>
                                                    <input type="text" value={paymentForm.card_number} onChange={e => setPaymentForm({ ...paymentForm, card_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center" placeholder="4111 2222 3333 4444" required />
                                                </div>
                                                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition">
                                                    Process Online Payment
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: CHILDREN PROFILES (Parent) */}
                            {activeTab === 'child' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {students.slice(0, 1).map(s => (
                                        <div key={s.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{s.user?.name}</h3>
                                                    <span className="text-xs text-indigo-400 font-mono">{s.student_id}</span>
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                                                    {s.status}
                                                </span>
                                            </div>

                                            {/* Child performance logs */}
                                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-4">
                                                <div>
                                                    <span className="text-3xs uppercase tracking-widest text-slate-500 block mb-1">Attendance Warnings</span>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-2 rounded-lg">
                                                            <span>Consecutive Absences Detected: 3</span>
                                                            <span className="font-semibold">Absence Notice Sent</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-3xs uppercase tracking-widest text-slate-500 block mb-1">Academic Grades Record</span>
                                                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                                                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                                                            <div className="text-[10px] text-slate-500 mb-0.5">Data Structures</div>
                                                            <div className="font-bold text-indigo-300">Midterm: 62%</div>
                                                        </div>
                                                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                                                            <div className="text-[10px] text-slate-500 mb-0.5">Linear Algebra</div>
                                                            <div className="font-bold text-indigo-300">Midterm: 55%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
