import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from './components/adminpanel/AdminPanel';
import Students from './components/Students';
import Enquiries from './components/Enquiries';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AdminPanel />}>
            <Route index element={<Navigate to="/students" replace />} />
            <Route path="students" element={<Students />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="dashboard" element={<div className="p-4"><h2>Dashboard</h2></div>} />
            <Route path="settings" element={<div className="p-4"><h2>Settings</h2></div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
