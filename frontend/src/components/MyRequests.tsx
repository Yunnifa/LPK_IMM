import { useState, useEffect } from 'react';
import { getVehicleRequests, cancelVehicleRequest } from '../services/apiService';

interface VehicleRequest {
  id: number;
  serviceType: string;
  name: string;
  departmentName: string;
  vehiclePurpose: string;
  locationType: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

function MyRequests() {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getVehicleRequests();
      setRequests(data);
    } catch (err: any) {
      setError('Gagal memuat data permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan permintaan ini?')) return;
    
    try {
      await cancelVehicleRequest(id);
      loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal membatalkan permintaan');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getServiceLabel = (type: string) => {
    return type === 'layanan_pool' ? 'Layanan Pool' : 'Izin Khusus Kendaraan Operasional';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Permintaan Saya</h2>
        <a
          href="/request"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Buat Permintaan Baru
        </a>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Layanan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waktu Peminjaman
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Pengajuan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{request.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getServiceLabel(request.serviceType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{formatDate(request.startDate)}</div>
                  <div className="text-xs">s/d {formatDate(request.endDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Batalkan
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Belum ada permintaan. Buat permintaan baru untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRequests;
