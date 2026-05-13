import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* We can map all three to the same login component which handles the role, 
            or separate them if needed. For now, we use a single Login component 
            that we will update to handle different roles nicely. */}
        <Route path="/admin-login" element={<Login role="Admin" />} />
        <Route path="/teacher-login" element={<Login role="Teacher" />} />
        <Route path="/student-login" element={<Login role="Student" />} />
        
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/teacher/*" element={<TeacherDashboard />} />
        <Route path="/student/*" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
