import { Routes, Route } from 'react-router-dom';
import { FaHome, FaUsers, FaChalkboardTeacher, FaBook, FaClipboardList } from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';
import AdminOverview from './admin/AdminOverview';
import StudentManagement from './admin/StudentManagement';
import TeacherManagement from './admin/TeacherManagement';
import SubjectManagement from './admin/SubjectManagement';
import AdminAttendance from './admin/AdminAttendance';

const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: FaHome },
  { name: 'Students', path: '/admin/students', icon: FaUsers },
  { name: 'Teachers', path: '/admin/teachers', icon: FaChalkboardTeacher },
  { name: 'Subjects', path: '/admin/subjects', icon: FaBook },
  { name: 'Attendance', path: '/admin/attendance', icon: FaClipboardList },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout role="Admin" links={adminLinks}>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/teachers" element={<TeacherManagement />} />
        <Route path="/subjects" element={<SubjectManagement />} />
        <Route path="/attendance" element={<AdminAttendance />} />
        <Route path="*" element={<div className="flex items-center justify-center h-64 text-slate-400 text-xl font-medium">Module under construction...</div>} />
      </Routes>
    </DashboardLayout>
  );
}
