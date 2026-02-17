import { useState, useEffect } from 'react';
import api from '../services/api';
import ExcelJS from 'exceljs';

interface VehicleRequest {
  id: number;
  ticketNumber: string;
  nik: string;
  name: string;
  email: string;
  departmentId: number;
  departmentName?: string;
  purposeReason: string;
  serviceType: string;
  vehiclePurpose: string;
  locationType: string;
  startDate: string;
  endDate: string;
  status: string;
  approval1: string;
  approval2: string;
  approval3: string;
  approval4: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const DataMonitoring = () => {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterServiceType, setFilterServiceType] = useState<'all' | 'layanan_pool' | 'izin_khusus'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);

  // Confirm Modal for Approval
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    level: 1 | 2 | 3 | 4;
    requestId: number;
    request: VehicleRequest | null;
  } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicle-requests');
      const data = response.data;
      setRequests(data);

      // Calculate stats with locationType awareness
      const total = data.length;
      const pending = data.filter((r: VehicleRequest) => {
        // For desa_binaan, only check levels 1-3
        if (r.locationType === 'desa_binaan') {
          return r.approval1 === 'pending' || r.approval2 === 'pending' || r.approval3 === 'pending';
        }
        // For non-desa_binaan, check all 4 levels
        return r.approval1 === 'pending' || r.approval2 === 'pending' || 
               r.approval3 === 'pending' || r.approval4 === 'pending';
      }).length;
      const approved = data.filter((r: VehicleRequest) => {
        // For desa_binaan, approval complete at level 3
        if (r.locationType === 'desa_binaan') {
          return r.approval1 === 'approved' && r.approval2 === 'approved' && r.approval3 === 'approved';
        }
        // For non-desa_binaan, all 4 must be approved
        return r.approval1 === 'approved' && r.approval2 === 'approved' && 
               r.approval3 === 'approved' && r.approval4 === 'approved';
      }).length;
      const rejected = data.filter((r: VehicleRequest) => {
        // For desa_binaan, check levels 1-3
        if (r.locationType === 'desa_binaan') {
          return r.approval1 === 'rejected' || r.approval2 === 'rejected' || r.approval3 === 'rejected';
        }
        // For non-desa_binaan, check all 4 levels
        return r.approval1 === 'rejected' || r.approval2 === 'rejected' || 
               r.approval3 === 'rejected' || r.approval4 === 'rejected';
      }).length;

      setStats({ total, pending, approved, rejected });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredRequests = requests.filter(req => {
    // Status filter with locationType awareness
    let matchesStatus = false;
    if (filterStatus === 'all') {
      matchesStatus = true;
    } else if (filterStatus === 'pending') {
      if (req.locationType === 'desa_binaan') {
        matchesStatus = req.approval1 === 'pending' || req.approval2 === 'pending' || req.approval3 === 'pending';
      } else {
        matchesStatus = req.approval1 === 'pending' || req.approval2 === 'pending' || 
                        req.approval3 === 'pending' || req.approval4 === 'pending';
      }
    } else if (filterStatus === 'approved') {
      if (req.locationType === 'desa_binaan') {
        matchesStatus = req.approval1 === 'approved' && req.approval2 === 'approved' && req.approval3 === 'approved';
      } else {
        matchesStatus = req.approval1 === 'approved' && req.approval2 === 'approved' && 
                        req.approval3 === 'approved' && req.approval4 === 'approved';
      }
    } else if (filterStatus === 'rejected') {
      if (req.locationType === 'desa_binaan') {
        matchesStatus = req.approval1 === 'rejected' || req.approval2 === 'rejected' || req.approval3 === 'rejected';
      } else {
        matchesStatus = req.approval1 === 'rejected' || req.approval2 === 'rejected' || 
                        req.approval3 === 'rejected' || req.approval4 === 'rejected';
      }
    }

    // Search filter
    const matchesSearch = 
      req.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purposeReason.toLowerCase().includes(searchTerm.toLowerCase());

    // Service type filter
    const matchesServiceType = filterServiceType === 'all' || req.serviceType === filterServiceType;

    // Date range filter
    let matchesDateRange = true;
    if (filterDateRange !== 'all') {
      const createdDate = new Date(req.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (filterDateRange === 'today') {
        matchesDateRange = createdDate >= today;
      } else if (filterDateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDateRange = createdDate >= weekAgo;
      } else if (filterDateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDateRange = createdDate >= monthAgo;
      }
    }

    return matchesStatus && matchesSearch && matchesServiceType && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterServiceType, filterDateRange, itemsPerPage]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Approval handlers
  const handleApprove = (level: 1 | 2 | 3 | 4, requestId: number) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setConfirmAction({ type: 'approve', level, requestId, request });
      setShowConfirmModal(true);
      setConfirmNotes('');
    }
  };

  const handleReject = (level: 1 | 2 | 3 | 4, requestId: number) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setConfirmAction({ type: 'reject', level, requestId, request });
      setShowConfirmModal(true);
      setConfirmNotes('');
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      await api.patch(`/vehicle-requests/${confirmAction.requestId}/approval`, {
        level: confirmAction.level,
        status: confirmAction.type === 'approve' ? 'approved' : 'rejected',
        notes: confirmNotes || undefined
      });

      await fetchRequests();
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmNotes('');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status approval');
      console.error('Error updating approval:', err);
    }
  };

  // Detail modal
  const handleShowDetail = (request: VehicleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih data yang akan dihapus');
      return;
    }
    const confirmed = window.confirm(`Hapus ${selectedIds.length} data terpilih?`);
    if (confirmed) {
      try {
        for (const id of selectedIds) {
          await api.delete(`/vehicle-requests/${id}`);
        }
        await fetchRequests();
        setSelectedIds([]);
        alert(`${selectedIds.length} data berhasil dihapus`);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data');
        console.error('Error deleting:', err);
      }
    }
  };

  // Helper function to escape CSV fields
  const escapeCSVField = (field: string | number | null | undefined): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export functions
  const exportToCSV = () => {
    setShowExportDropdown(false);
    const headers = ['No Tiket', 'NIK', 'Nama', 'Department', 'Lokasi', 'Keperluan', 'Layanan', 'Waktu Mulai', 'Waktu Selesai', 'Head Dept', 'GA Transport', 'Head GA', 'Head GS'];
    const csvData = filteredRequests.map(r => [
      escapeCSVField(r.ticketNumber), 
      escapeCSVField(r.nik), 
      escapeCSVField(r.name), 
      escapeCSVField(r.departmentName || r.departmentId),
      escapeCSVField(r.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non Desa Binaan'),
      escapeCSVField(r.purposeReason), 
      escapeCSVField(getServiceLabel(r.serviceType)), 
      escapeCSVField(formatDate(r.startDate)), 
      escapeCSVField(formatDate(r.endDate)),
      escapeCSVField(r.approval1), 
      escapeCSVField(r.approval2), 
      escapeCSVField(r.approval3), 
      escapeCSVField(r.locationType === 'desa_binaan' ? '-' : r.approval4)
    ]);
    
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-monitoring-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export to Excel using ExcelJS
  const exportToExcel = async () => {
    setShowExportDropdown(false);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LPK IMM';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Data Monitoring', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    // Define columns with proper widths
    worksheet.columns = [
      { header: 'No Tiket', key: 'ticketNumber', width: 18 },
      { header: 'NIK', key: 'nik', width: 15 },
      { header: 'Nama', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Lokasi', key: 'lokasi', width: 15 },
      { header: 'Keperluan', key: 'purpose', width: 35 },
      { header: 'Layanan', key: 'service', width: 20 },
      { header: 'Waktu Mulai', key: 'startDate', width: 18 },
      { header: 'Waktu Selesai', key: 'endDate', width: 18 },
      { header: 'Head Dept', key: 'approval1', width: 12 },
      { header: 'GA Transport', key: 'approval2', width: 14 },
      { header: 'Head GA', key: 'approval3', width: 12 },
      { header: 'Head GS', key: 'approval4', width: 12 },
    ];
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4338CA' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    
    // Add data rows
    filteredRequests.forEach((r, index) => {
      const row = worksheet.addRow({
        ticketNumber: r.ticketNumber,
        nik: r.nik,
        name: r.name,
        department: r.departmentName || r.departmentId,
        lokasi: r.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non Desa Binaan',
        purpose: r.purposeReason,
        service: getServiceLabel(r.serviceType),
        startDate: formatDate(r.startDate),
        endDate: formatDate(r.endDate),
        approval1: r.approval1,
        approval2: r.approval2,
        approval3: r.approval3,
        approval4: r.locationType === 'desa_binaan' ? '-' : r.approval4
      });
      
      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
      }
      
      // Style approval cells based on status
      const styleApprovalCell = (cell: ExcelJS.Cell, value: string | undefined) => {
        if (value === 'approved') {
          cell.font = { color: { argb: 'FF10B981' } };
        } else if (value === 'rejected') {
          cell.font = { color: { argb: 'FFEF4444' } };
        } else if (value === 'pending') {
          cell.font = { color: { argb: 'FFF59E0B' } };
        }
      };
      
      styleApprovalCell(row.getCell('approval1'), r.approval1);
      styleApprovalCell(row.getCell('approval2'), r.approval2);
      styleApprovalCell(row.getCell('approval3'), r.approval3);
      styleApprovalCell(row.getCell('approval4'), r.approval4);
    });
    
    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });
    
    // Generate Excel file and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-monitoring-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportToPDF = () => {
    setShowExportDropdown(false);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Monitoring - ${new Date().toLocaleDateString('id-ID')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 10px; }
          h1 { text-align: center; color: #333; font-size: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #4338ca; color: white; padding: 8px 4px; text-align: left; font-size: 9px; }
          td { padding: 6px 4px; border-bottom: 1px solid #ddd; font-size: 9px; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .print-date { text-align: right; font-size: 9px; color: #666; margin-bottom: 10px; }
          .status-pending { color: #f59e0b; }
          .status-approved { color: #10b981; }
          .status-rejected { color: #ef4444; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-date">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <h1>Data Monitoring Permohonan Kendaraan</h1>
        <table>
          <thead>
            <tr>
              <th>No Tiket</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Dept</th>
              <th>Lokasi</th>
              <th>Layanan</th>
              <th>Waktu</th>
              <th>Head Dept</th>
              <th>GA Trans</th>
              <th>Head GA</th>
              <th>Head GS</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequests.map(r => `
              <tr>
                <td>${r.ticketNumber}</td>
                <td>${r.nik}</td>
                <td>${r.name}</td>
                <td>${r.departmentName || r.departmentId}</td>
                <td>${r.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non Desa Binaan'}</td>
                <td>${getServiceLabel(r.serviceType)}</td>
                <td>${formatDate(r.startDate)}</td>
                <td class="status-${r.approval1}">${r.approval1}</td>
                <td class="status-${r.approval2}">${r.approval2}</td>
                <td class="status-${r.approval3}">${r.approval3}</td>
                <td class="status-${r.approval4}">${r.locationType === 'desa_binaan' ? '-' : r.approval4}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get service label
  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'layanan_pool': return 'Layanan Pool';
      case 'izin_khusus': return 'Izin Khusus';
      default: return type;
    }
  };

  // Get approval level label
  const getApprovalLabel = (level: number) => {
    switch (level) {
      case 1: return 'Approval 1';
      case 2: return 'Approval 2';
      case 3: return 'Approval 3';
      case 4: return 'Approval 4';
      default: return `Level ${level}`;
    }
  };

  // Render approval cell
  const renderApprovalCell = (
    status: string, 
    level: 1 | 2 | 3 | 4, 
    requestId: number, 
    prevApproved: boolean,
    prevRejected: boolean
  ) => {
    // If any previous level was rejected
    if (prevRejected) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-300 text-gray-600">
          -
        </span>
      );
    }

    // If previous level is not approved yet
    if (!prevApproved && status === 'pending') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
          Menunggu
        </span>
      );
    }

    if (status === 'pending') {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => handleApprove(level, requestId)}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
            title="Approve"
          >
            ✓
          </button>
          <button
            onClick={() => handleReject(level, requestId)}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
            title="Reject"
          >
            ✕
          </button>
        </div>
      );
    } else if (status === 'approved') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          Approved
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Rejected
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div 
              onClick={() => setFilterStatus('all')}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border p-4 md:p-6 cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'all' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-xs md:text-sm font-medium">Total Permohonan</div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">{stats.total}</div>
                </div>
                <div className="bg-indigo-100 rounded-xl p-2 md:p-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus('pending')}
              className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border p-4 md:p-6 cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-amber-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-amber-700 text-xs md:text-sm font-medium">Pending</div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-900 mt-1 md:mt-2">{stats.pending}</div>
                </div>
                <div className="bg-amber-200/50 rounded-xl p-2 md:p-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus('approved')}
              className={`bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-sm border p-4 md:p-6 cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'approved' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-emerald-700 text-xs md:text-sm font-medium">Approved</div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-900 mt-1 md:mt-2">{stats.approved}</div>
                </div>
                <div className="bg-emerald-200/50 rounded-xl p-2 md:p-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setFilterStatus('rejected')}
              className={`bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl shadow-sm border p-4 md:p-6 cursor-pointer transition-all hover:shadow-md ${
                filterStatus === 'rejected' ? 'border-rose-300 ring-2 ring-rose-100' : 'border-rose-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-rose-700 text-xs md:text-sm font-medium">Rejected</div>
                  <div className="text-2xl md:text-3xl font-bold text-rose-900 mt-1 md:mt-2">{stats.rejected}</div>
                </div>
                <div className="bg-rose-200/50 rounded-xl p-2 md:p-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 relative z-20 overflow-visible">
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="w-full relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama tiket, NIK, nama, atau keperluan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="px-3 md:px-4 py-2 md:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                    {(filterServiceType !== 'all' || filterDateRange !== 'all') && (
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                        {(filterServiceType !== 'all' ? 1 : 0) + (filterDateRange !== 'all' ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 border border-gray-100 p-4">
                      <div className="space-y-4">
                        {/* Service Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Layanan</label>
                          <select
                            value={filterServiceType}
                            onChange={(e) => setFilterServiceType(e.target.value as 'all' | 'layanan_pool' | 'izin_khusus')}
                            className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          >
                            <option value="all">Semua Layanan</option>
                            <option value="layanan_pool">Layanan Pool</option>
                            <option value="izin_khusus">Izin Khusus</option>
                          </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rentang Waktu</label>
                          <select
                            value={filterDateRange}
                            onChange={(e) => setFilterDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
                            className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          >
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">30 Hari Terakhir</option>
                          </select>
                        </div>

                        {/* Reset Filter */}
                        <button
                          onClick={() => {
                            setFilterServiceType('all');
                            setFilterDateRange('all');
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Reset Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showExportDropdown && (
                    <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-40 bg-white rounded-xl shadow-lg z-50 border border-gray-100 py-2">
                      <button
                        onClick={exportToExcel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={handleDelete}
                  disabled={selectedIds.length === 0}
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm ${
                    selectedIds.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-50 hover:bg-red-100 text-red-600'
                  }`}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus {selectedIds.length > 0 && `(${selectedIds.length})`}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-indigo-900 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedRequests.length && paginatedRequests.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">No Tiket</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">NIK</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Nama</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Department</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Keperluan</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Lokasi</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Layanan</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Waktu Mulai</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Waktu Selesai</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Head Dept</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">GA Transport</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Head GA</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Head GS</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((req) => {
                      const prev1Approved = true;
                      const prev1Rejected = false;
                      const prev2Approved = req.approval1 === 'approved';
                      const prev2Rejected = req.approval1 === 'rejected';
                      const prev3Approved = req.approval2 === 'approved' && prev2Approved;
                      const prev3Rejected = req.approval2 === 'rejected' || prev2Rejected;
                      const prev4Approved = req.approval3 === 'approved' && prev3Approved;
                      const prev4Rejected = req.approval3 === 'rejected' || prev3Rejected;

                      return (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(req.id)}
                              onChange={() => handleSelectOne(req.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-3 text-sm font-medium">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-mono">
                              {req.ticketNumber}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">{req.nik}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{req.name}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{req.departmentName || `Dept ${req.departmentId}`}</td>
                          <td className="px-3 py-3 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={req.purposeReason}>{req.purposeReason}</div>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              req.locationType === 'desa_binaan' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {req.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non-Binaan'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">{getServiceLabel(req.serviceType)}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{formatDate(req.startDate)}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{formatDate(req.endDate)}</td>
                          <td className="px-3 py-3 text-sm">
                            {renderApprovalCell(req.approval1, 1, req.id, prev1Approved, prev1Rejected)}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {renderApprovalCell(req.approval2, 2, req.id, prev2Approved, prev2Rejected)}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {renderApprovalCell(req.approval3, 3, req.id, prev3Approved, prev3Rejected)}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {req.locationType === 'desa_binaan' 
                              ? <span className="text-gray-400">-</span>
                              : renderApprovalCell(req.approval4, 4, req.id, prev4Approved, prev4Rejected)
                            }
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <button
                              onClick={() => handleShowDetail(req)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Tampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>data per halaman</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Menampilkan {filteredRequests.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRequests.length)} dari {filteredRequests.length} data</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Back
                </button>
                <span className="px-3 py-1 text-sm">
                  Halaman {currentPage} dari {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal - Style like frontend-prm */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detail Permohonan</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Details in vertical list format */}
            <div className="space-y-4 mb-4">
              {/* Data Pemohon */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-semibold text-gray-900 mb-2">Data Pemohon</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>No Tiket:</strong> <span className="font-mono">{selectedRequest.ticketNumber}</span></div>
                  <div><strong>Pengaju:</strong> {selectedRequest.name}</div>
                  <div><strong>NIK:</strong> {selectedRequest.nik}</div>
                  <div><strong>Email:</strong> <a href={`mailto:${selectedRequest.email}`} className="text-blue-600 hover:underline">{selectedRequest.email}</a></div>
                  <div><strong>Department:</strong> {selectedRequest.departmentName || `Dept ${selectedRequest.departmentId}`}</div>
                </div>
              </div>

              {/* Informasi Permohonan */}
              <div className="border-l-4 border-indigo-500 pl-4 py-2">
                <div className="font-semibold text-gray-900 mb-2">Informasi Permohonan</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Layanan:</strong> {getServiceLabel(selectedRequest.serviceType)}</div>
                  <div><strong>Tujuan Kendaraan:</strong> {selectedRequest.vehiclePurpose === 'dinas' ? 'Dinas' : 'Pribadi'}</div>
                  <div><strong>Tipe Lokasi:</strong> {selectedRequest.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non Desa Binaan'}</div>
                  <div><strong>Keperluan:</strong> {selectedRequest.purposeReason}</div>
                </div>
              </div>

              {/* Waktu Peminjaman */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="font-semibold text-gray-900 mb-2">Waktu Peminjaman</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Mulai:</strong> {formatDate(selectedRequest.startDate)}</div>
                  <div><strong>Selesai:</strong> {formatDate(selectedRequest.endDate)}</div>
                </div>
              </div>

              {/* Status Approval */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-semibold text-gray-900 mb-2">Status Approval</div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span><strong>Level 1 - Head Departemen:</strong></span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.approval1 === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedRequest.approval1 === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRequest.approval1 === 'approved' ? 'Approved' :
                       selectedRequest.approval1 === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Level 2 - GA Transport:</strong></span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.approval2 === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedRequest.approval2 === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRequest.approval2 === 'approved' ? 'Approved' :
                       selectedRequest.approval2 === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span><strong>Level 3 - Head Of General Affairs:</strong></span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.approval3 === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedRequest.approval3 === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedRequest.approval3 === 'approved' ? 'Approved' :
                       selectedRequest.approval3 === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  {selectedRequest.locationType !== 'desa_binaan' && (
                    <div className="flex items-center justify-between">
                      <span><strong>Level 4 - Head Of General Service:</strong></span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedRequest.approval4 === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedRequest.approval4 === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedRequest.approval4 === 'approved' ? 'Approved' :
                         selectedRequest.approval4 === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  )}
                  {selectedRequest.locationType === 'desa_binaan' && (
                    <div className="text-xs text-gray-500 italic mt-1">
                      * Desa Binaan hanya memerlukan 3 level approval
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal - Style like frontend-prm */}
      {showConfirmModal && confirmAction && confirmAction.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 border-t-4 ${
            confirmAction.type === 'approve' ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {confirmAction.type === 'approve' ? (
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className={`text-2xl font-bold ${
                  confirmAction.type === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {confirmAction.type === 'approve' ? 'Approve Permohonan' : 'Reject Permohonan'}
                </h2>
                <p className="text-sm text-gray-600">
                  {getApprovalLabel(confirmAction.level)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Pemohon</div>
                  <div className="text-sm text-gray-900">{confirmAction.request.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-gray-700">No Tiket</div>
                  <div className="text-sm text-gray-900 font-mono">{confirmAction.request.ticketNumber}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Waktu</div>
                  <div className="text-sm text-gray-900">{formatDate(confirmAction.request.startDate)} - {formatDate(confirmAction.request.endDate)}</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {confirmAction.type === 'approve' ? 'Catatan (Opsional)' : 'Alasan Penolakan'}
              </label>
              <textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder={confirmAction.type === 'approve' 
                  ? 'Tambahkan catatan jika diperlukan...' 
                  : 'Jelaskan alasan penolakan...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                  setConfirmNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                  confirmAction.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMonitoring;
