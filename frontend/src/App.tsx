import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PermohonanKendaraan from './components/PermohonanKendaraan';
import AdminLayout from './components/AdminLayout';
import AdminRequests from './components/AdminRequests';
import DataMonitoring from './components/DataMonitoring';
import DataDepartemen from './components/DataDepartemen';
import DataPengguna from './components/DataPengguna';
import KelolaPertanyaan from './components/KelolaPertanyaan';
import Profile from './components/Profile';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const getUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).role;
    }
    return null;
  };

  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }

    const role = getUserRole();
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/login" />;
    }

    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PermohonanKendaraan />} />
        <Route path="/permohonan" element={<PermohonanKendaraan />} />
        <Route path="/login" element={<Login />} />

        {/* Admin/SuperAdmin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<DataMonitoring />} />
          <Route path="/admin/monitoring" element={<DataMonitoring />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/departemen" element={<DataDepartemen />} />
          <Route path="/admin/pengguna" element={<DataPengguna />} />
          <Route path="/admin/kelola-pertanyaan" element={<KelolaPertanyaan />} />
          <Route path="/admin/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
