import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function UserLayout() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Peminjaman Kendaraan</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              <strong>{user?.fullName}</strong>
            </span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/request"
                  className="block px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors text-gray-700"
                >
                  Buat Permintaan
                </Link>
              </li>
              <li>
                <Link
                  to="/my-requests"
                  className="block px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors text-gray-700"
                >
                  Permintaan Saya
                </Link>
              </li>
              <li>
                <Link
                  to="/user/profile"
                  className="block px-4 py-2 rounded hover:bg-blue-500 hover:text-white transition-colors text-gray-700"
                >
                  Profil
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
