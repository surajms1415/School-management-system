import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ student_id: '', subject_id: '', date: '', status: 'Present' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, studRes, subRes] = await Promise.all([
        api.get('/attendance/'),
        api.get('/students/'),
        api.get('/subjects/')
      ]);
      setAttendance(attRes.data);
      setStudents(studRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/attendance/${editingId}`, formData);
      } else {
        await api.post('/attendance/', formData);
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert(`Error ${editingId ? 'updating' : 'creating'} attendance`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ student_id: '', subject_id: '', date: '', status: 'Present' });
  };

  const handleEditClick = (record) => {
    setFormData({
      student_id: record.student_id,
      subject_id: record.subject_id,
      date: record.date,
      status: record.status
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/attendance/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getStudentName = (id) => students.find(s => s.id === id)?.name || 'Unknown';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || 'Unknown';

  const filteredRecords = attendance.filter(record => {
    const studentName = getStudentName(record.student_id).toLowerCase();
    const subjectName = getSubjectName(record.subject_id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || subjectName.includes(query) || record.date.includes(query);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Log</h2>
          <p className="text-slate-500 text-sm mt-1">View all attendance records and import logs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <FaPlus /> Add Attendance
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student, subject or date..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-80 shadow-sm transition-shadow"
            />
          </div>
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <FaFilter /> Filter
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredRecords.map((record, idx) => (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{getStudentName(record.student_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getSubjectName(record.subject_id)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEditClick(record)}
                        className="text-emerald-600 hover:text-emerald-800 p-2 rounded-xl hover:bg-emerald-50 transition-colors mr-2">
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <p className="text-lg font-medium text-slate-400">No attendance records found.</p>
            </div>
          )}
        </div>
      </div>
      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Attendance' : 'Add Attendance'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    value={formData.student_id} onChange={e => setFormData({...formData, student_id: parseInt(e.target.value)})}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: parseInt(e.target.value)})}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
                <div className="pt-6 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
                    {editingId ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
