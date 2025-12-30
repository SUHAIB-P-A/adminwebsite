import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from './components/adminpanel/AdminPanel';
import Students from './components/Students';
import Enquiries from './components/Enquiries';
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';
import Home from './components/Home';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Only Route
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'admin' && role !== 'Admin') {
    return <Navigate to="/portal/students" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Portal Routes */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="students" replace />} />
            <Route path="students" element={<Students />} />
            <Route path="enquiries" element={<Enquiries />} />

            {/* Staff Management - Admin Only */}
            <Route path="staff" element={
              <AdminRoute>
                <StaffManagement />
              </AdminRoute>
            } />

            <Route path="dashboard" element={<div className="p-4"><h2>Dashboard (Coming Soon)</h2></div>} />
            <Route path="settings" element={<div className="p-4"><h2>Settings</h2></div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
