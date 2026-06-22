import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import modular dashboard subpanels
import SisPanel from '@/Components/Dashboard/SisPanel';
import TimetablePanel from '@/Components/Dashboard/TimetablePanel';
import FinancePanel from '@/Components/Dashboard/FinancePanel';
import HrPanel from '@/Components/Dashboard/HrPanel';
import AnalyticsPanel from '@/Components/Dashboard/AnalyticsPanel';
import FacultyPanel from '@/Components/Dashboard/FacultyPanel';
import StudentPanel from '@/Components/Dashboard/StudentPanel';
import ParentPanel from '@/Components/Dashboard/ParentPanel';

// Import global toast context
import { useToast } from '@/Contexts/ToastContext';

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
    const [auditLogs, setAuditLogs] = useState([]);

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
    const [retraining, setRetraining] = useState(false);

    // Modal / Workflow state
    const [workflowReceipt, setWorkflowReceipt] = useState(null);

    // Consume global Toast Context
    const { addToast } = useToast();
    const showMessage = (msg, type = 'info') => {
        addToast(msg, type);
    };

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

    const loadTabData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sis' || activeTab === 'gradebook' || activeTab === 'attendance' || activeTab === 'student_grades') {
                const res = await axios.get('/api/students');
                setStudents(res.data);
                
                const struct = await axios.get('/api/academic-structure');
                setCourses(struct.data.courses);
                setBatches(struct.data.batches);

                if (activeTab === 'sis') {
                    const audits = await axios.get('/api/audit-logs');
                    setAuditLogs(audits.data);
                }
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

    const handleVerifyDocument = async (studentId, status) => {
        try {
            const res = await axios.post(`/api/students/${studentId}/verify-document`, { status });
            if (res.data.success) {
                showMessage(res.data.message, 'success');
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to verify document.', 'error');
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

    const handleRetrainModel = async () => {
        setRetraining(true);
        try {
            const res = await axios.post('/api/analytics/train');
            if (res.data.success) {
                showMessage(`${res.data.message} Trained on ${res.data.samples_trained} records.`, 'success');
                setAiRiskCache({});
                loadTabData();
            }
        } catch (err) {
            showMessage(err.response?.data?.message || 'FastAPI training service offline or failed.', 'error');
        } finally {
            setRetraining(false);
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
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="h-10 w-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin mb-4" />
                            <span className="ml-3 text-slate-400 text-sm">Synchronizing core logs...</span>
                        </div>
                    )}

                    {/* Render Panels Conditionally */}
                    {!loading && (
                        <div className="grid grid-cols-1 gap-6">
                            {role === 'admin' && activeTab === 'sis' && (
                                <SisPanel
                                    students={students}
                                    finance={finance}
                                    studentForm={studentForm}
                                    setStudentForm={setStudentForm}
                                    handleAddStudent={handleAddStudent}
                                    uploadStudentId={uploadStudentId}
                                    setUploadStudentId={setUploadStudentId}
                                    setUploadFile={setUploadFile}
                                    handleUploadDoc={handleUploadDoc}
                                    handleVerifyDocument={handleVerifyDocument}
                                    auditLogs={auditLogs}
                                    loading={loading}
                                />
                            )}

                            {role === 'admin' && activeTab === 'timetabling' && (
                                <TimetablePanel
                                    timetable={timetable}
                                    batches={batches}
                                    faculty={faculty}
                                    timetableForm={timetableForm}
                                    setTimetableForm={setTimetableForm}
                                    handleScheduleClass={handleScheduleClass}
                                />
                            )}

                            {role === 'admin' && activeTab === 'finance' && (
                                <FinancePanel finance={finance} />
                            )}

                            {role === 'admin' && activeTab === 'hr' && (
                                <HrPanel
                                    workloads={workloads}
                                    leaves={leaves}
                                    handleAdminLeaveDecision={handleAdminLeaveDecision}
                                />
                            )}

                            {role === 'admin' && activeTab === 'analytics' && (
                                <AnalyticsPanel
                                    students={students}
                                    aiRiskCache={aiRiskCache}
                                    predictingId={predictingId}
                                    assessStudentRisk={assessStudentRisk}
                                    forecastData={forecastData}
                                    retraining={retraining}
                                    handleRetrainModel={handleRetrainModel}
                                />
                            )}

                            {role === 'faculty' && (
                                <FacultyPanel
                                    activeTab={activeTab}
                                    user={user}
                                    timetable={timetable}
                                    students={students}
                                    selectedTimetableId={selectedTimetableId}
                                    handleAttendanceTimetableSelect={handleAttendanceTimetableSelect}
                                    attendanceData={attendanceData}
                                    setAttendanceData={setAttendanceData}
                                    handleSaveAttendance={handleSaveAttendance}
                                    grades={grades}
                                    gradeForm={gradeForm}
                                    setGradeForm={setGradeForm}
                                    handleAddGrade={handleAddGrade}
                                    leaveForm={leaveForm}
                                    setLeaveForm={setLeaveForm}
                                    handleRequestLeave={handleRequestLeave}
                                    leaves={leaves}
                                />
                            )}

                            {role === 'student' && (
                                <StudentPanel
                                    activeTab={activeTab}
                                    user={user}
                                    students={students}
                                    grades={grades}
                                    timetable={timetable}
                                    finance={finance}
                                    paymentForm={paymentForm}
                                    setPaymentForm={setPaymentForm}
                                    handleSandboxPayment={handleSandboxPayment}
                                    calculateCGPA={calculateCGPA}
                                />
                            )}

                            {role === 'parent' && activeTab === 'child' && (
                                <ParentPanel students={students} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
