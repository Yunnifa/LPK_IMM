import { useState, useEffect } from 'react';
import api from '../services/api';

interface VehicleRequest {
  id: number;
  ticketNumber: string;
  serviceType: string;
  name: string;
  nik: string;
  email: string;
  departmentId: number;
  vehiclePurpose: string;
  purposeReason: string;
  locationType: string;
  startDate: string;
  endDate: string;
  status: string;
  agreement: boolean;
  createdAt: string;
  department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

function AdminRequests() {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/vehicle-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || '-';
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/vehicle-requests/${id}/status`, { status: newStatus });
      fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Menunggu</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Disetujui</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Ditolak</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Semua ({requests.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Menunggu ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Disetujui ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ditolak ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">No. Tiket</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Departemen</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Keperluan</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tanggal</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada permohonan
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{request.ticketNumber}</td>
                  <td className="px-4 py-3 text-sm">{request.name}</td>
                  <td className="px-4 py-3 text-sm">{getDepartmentName(request.departmentId)}</td>
                  <td className="px-4 py-3 text-sm">{request.vehiclePurpose}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(request.startDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Detail Permohonan</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-500">Nomor Tiket</label>
                  <p className="font-mono text-blue-600 font-semibold">{selectedRequest.ticketNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Jenis Layanan</label>
                  <p className="font-medium">{selectedRequest.serviceType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Nama</label>
                  <p className="font-medium">{selectedRequest.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">NIK</label>
                  <p className="font-medium">{selectedRequest.nik}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Departemen</label>
                  <p className="font-medium">{getDepartmentName(selectedRequest.departmentId)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Keperluan Kendaraan</label>
                  <p className="font-medium">{selectedRequest.vehiclePurpose}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Alasan Keperluan</label>
                  <p className="font-medium">{selectedRequest.purposeReason}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Jenis Lokasi</label>
                  <p className="font-medium">{selectedRequest.locationType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal Dibuat</label>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Waktu Mulai</label>
                  <p className="font-medium">{formatDate(selectedRequest.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Waktu Selesai</label>
                  <p className="font-medium">{formatDate(selectedRequest.endDate)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRequests;
