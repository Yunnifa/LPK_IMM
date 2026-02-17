import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Map route paths ke header titles
  const routeToHeaderMap: { [key: string]: string } = {
    '/admin': 'Data Monitoring',
    '/admin/monitoring': 'Data Monitoring',
    '/admin/kelola-pertanyaan': 'Kelola Pertanyaan',
    '/admin/departemen': 'Data Departemen',
    '/admin/pengguna': 'Data Pengguna',
    '/admin/profile': 'Profile',
    '/admin/departments': 'Data Master - Department',
    '/admin/users': 'Data Master - User',
    '/admin/vehicles': 'Data Master - Kendaraan',
  };

  const getHeaderTitle = () => {
    const currentPath = location.pathname;
    return routeToHeaderMap[currentPath] || 'Admin Panel';
  };

  useEffect(() => {
    // Format tanggal hari ini
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(today.toLocaleDateString('id-ID', options));
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
      {/* Left Section - Burger + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Burger Button - Mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-lg md:text-2xl font-bold text-indigo-900">
            {getHeaderTitle()}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">{currentDate}</p>
        </div>
      </div>

      {/* Right Section - Admin Info */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm md:text-base font-semibold text-gray-800">{user?.fullName || 'Administrator'}</p>
          <p className="text-xs md:text-sm text-gray-500 capitalize">{user?.role || 'Admin'}</p>
        </div>
        {/* User Circle Icon - Clickable */}
        <button
          onClick={() => navigate('/admin/profile')}
          className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          title="Edit Profile"
        >
          <svg className="w-5 h-5 md:w-7 md:h-7 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Header;
