import { NavLink, useNavigate } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-64 bg-indigo-900 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-indigo-700 text-center relative">
        {/* Close button - Mobile only */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-indigo-800 transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex justify-center mb-3">
          <img src="/IMM.svg" alt="IMM Logo" className="h-12 w-auto" />
        </div>
        <h2 className="text-xl font-bold">Admin Page</h2>
        <p className="text-sm text-indigo-300 mt-1">Sistem Layanan Peminjaman Kendaraan</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Data Monitoring */}
        <NavLink
          to="/admin/monitoring"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Data Monitoring</span>
          </div>
        </NavLink>

        {/* Kelola Pertanyaan */}
        <NavLink
          to="/admin/kelola-pertanyaan"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-medium">Kelola Pertanyaan</span>
          </div>
        </NavLink>

        {/* Data Departemen */}
        <NavLink
          to="/admin/departemen"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">Data Departemen</span>
          </div>
        </NavLink>

        {/* Data Pengguna */}
        <NavLink
          to="/admin/pengguna"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">Data Pengguna</span>
          </div>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/admin/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">Profile</span>
          </div>
        </NavLink>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-indigo-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
