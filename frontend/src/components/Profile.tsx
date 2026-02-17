import { useState, useEffect } from 'react';
import api from '../services/api';

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
}

const Profile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');



  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setFormFullName(userData.fullName || '');
        setFormEmail(userData.email || '');
        setFormPhone(userData.phone || '');
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formFullName.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (user) {
        await api.put(`/users/${user.id}`, {
          fullName: formFullName,
          email: formEmail,
          phone: formPhone || null,
        });

        // Update localStorage
        const updatedUser = { ...user, fullName: formFullName, email: formEmail, phone: formPhone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        setSuccess('Profile berhasil diupdate');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profile');
    } finally {
      setSaving(false);
    }
  };



  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return 'Administrator';
      case 'head_departemen':
        return 'Head Departemen';
      case 'ga_transport':
        return 'GA Transport';
      case 'general_affair':
        return 'General Affair';
      case 'general_service':
        return 'General Service';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-gray-600 mt-2">Kelola informasi akun Anda</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6">
          <p>{success}</p>
        </div>
      )}

      {/* Profile Info Card */}
      <div className="max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Informasi Profil</h3>
              <p className="text-sm text-gray-500">Update data profil Anda</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1.5">Username tidak dapat diubah</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleLabel(user?.role || '')}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                placeholder="contoh@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                placeholder="Contoh: 628123456789"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
