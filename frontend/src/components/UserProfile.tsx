import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/apiService';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">My Profile</h2>

      <div className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <p className="text-gray-900">{user.fullName}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username
            </label>
            <p className="text-gray-900">{user.username}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone
            </label>
            <p className="text-gray-900">{user.phone || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role
            </label>
            <p className="text-gray-900 capitalize">{user.role}</p>
          </div>

          <div className="pt-4">
            <button className="btn btn-primary">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
