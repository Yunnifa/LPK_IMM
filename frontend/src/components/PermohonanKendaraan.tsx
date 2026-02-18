import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDepartments, createVehicleRequest, searchTicket, getFormFields } from '../services/apiService';
import { Department, FormField, VehicleRequest } from '../types';

function PermohonanKendaraan() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cek-tiket' | 'form'>('form');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ ticketNumber: string } | null>(null);
  
  // Dynamic form values keyed by fieldKey
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Ticket search state
  const [ticketSearch, setTicketSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState<VehicleRequest | null>(null);
  const [ticketError, setTicketError] = useState('');

  // Legacy formData for backward compatibility with existing fields
  const [formData, setFormData] = useState({
    serviceType: '',
    name: '',
    nik: '',
    email: '',
    departmentId: '',
    vehiclePurpose: '',
    purposeReason: '',
    locationType: '',
    startDate: '',
    endDate: '',
    agreement: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptData, fieldsData] = await Promise.all([
        getDepartments(),
        getFormFields(),
      ]);
      setDepartments(deptData);
      
      // Sort fields by sortOrder
      const sortedFields = fieldsData.sort((a: FormField, b: FormField) => a.sortOrder - b.sortOrder);
      setFormFields(sortedFields);
      
      // Initialize form values
      const initialValues: Record<string, string> = {};
      sortedFields.forEach((field: FormField) => {
        initialValues[field.fieldKey] = '';
      });
      setFormValues(initialValues);
    } catch (err: any) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dynamic field changes
  const handleFieldChange = (fieldKey: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldKey]: value }));
    
    // Also update legacy formData for fields that map to core request fields
    const coreFieldMap: Record<string, string> = {
      'jenis_layanan': 'serviceType',
      'nama_lengkap': 'name',
      'nomor_induk_kependudukan': 'nik',
      'alamat_email': 'email',
      'department_bagian': 'departmentId',
      'jenis_keperluan_kendaraan': 'vehiclePurpose',
      'alasan_keperluan_kendaraan': 'purposeReason',
      'lokasi_tempat_tujuan': 'locationType',
      'tanggal_mulai': 'startDate',
      'tanggal_selesai': 'endDate',
      'persetujuan_ketentuan': 'agreement',
    };
    
    const mappedField = coreFieldMap[fieldKey];
    if (mappedField) {
      setFormData(prev => ({ ...prev, [mappedField]: value }));
    }
  };

  const handleSearchTicket = async () => {
    if (!ticketSearch.trim()) {
      setTicketError('Masukkan nomor tiket');
      return;
    }

    setSearchLoading(true);
    setTicketError('');
    setTicketResult(null);

    try {
      const result = await searchTicket(ticketSearch.trim());
      setTicketResult(result);
    } catch (err: any) {
      setTicketError(err.response?.data?.error || 'Tiket tidak ditemukan');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields from formFields
    const missingFields = formFields
      .filter(f => f.isRequired && f.fieldKey !== 'ketentuan_peminjaman_kendaraan' && f.fieldKey !== 'ketentuan') // Skip ketentuan (read-only)
      .filter(f => !formValues[f.fieldKey]?.trim());
    
    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(f => f.label).join(', ');
      setError(`Mohon lengkapi: ${fieldLabels}`);
      return;
    }

    // Check agreement specifically
    if (formValues['persetujuan_ketentuan'] !== 'setuju') {
      setError('Anda harus menyetujui ketentuan untuk melanjutkan');
      return;
    }

    setSubmitting(true);

    try {
      const response = await createVehicleRequest({
        serviceType: formData.serviceType || formValues['jenis_layanan'] || '',
        name: formData.name || formValues['nama_lengkap'] || '',
        nik: formData.nik || formValues['nomor_induk_kependudukan'] || '',
        email: formData.email || formValues['alamat_email'] || '',
        departmentId: parseInt(formData.departmentId || formValues['department_bagian'] || '0'),
        vehiclePurpose: formData.vehiclePurpose || formValues['jenis_keperluan_kendaraan'] || '',
        purposeReason: formData.purposeReason || formValues['alasan_keperluan_kendaraan'] || '',
        locationType: formData.locationType || formValues['lokasi_tempat_tujuan'] || '',
        startDate: formData.startDate || formValues['tanggal_mulai'] || '',
        endDate: formData.endDate || formValues['tanggal_selesai'] || '',
      });

      setSuccessData({ ticketNumber: response.ticketNumber });
      
      // Reset form values
      const resetValues: Record<string, string> = {};
      formFields.forEach(f => { resetValues[f.fieldKey] = ''; });
      setFormValues(resetValues);
      setFormData({
        serviceType: '',
        name: '',
        nik: '',
        email: '',
        departmentId: '',
        vehiclePurpose: '',
        purposeReason: '',
        locationType: '',
        startDate: '',
        endDate: '',
        agreement: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-400 text-yellow-900',
      approved: 'bg-green-500 text-white',
      rejected: 'bg-red-500 text-white',
    };
    
    const labels: Record<string, string> = {
      pending: 'Menunggu Approval',
      approved: 'Disetujui',
      rejected: 'Ditolak',
    };

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getApprovalBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-200 text-gray-600',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  // Get approval level labels
  const getApprovalLevelLabel = (level: number) => {
    const labels = {
      1: 'Head Departemen',
      2: 'GA Transport',
      3: 'Head Of General Affairs',
      4: 'Head Of General Service',
    };
    return labels[level as keyof typeof labels] || `Level ${level}`;
  };
  
  // Render dynamic form field
  const renderFormField = (field: FormField) => {
    const value = formValues[field.fieldKey] || '';
    
    // Special handling for ketentuan field - render as read-only list (no box wrapper, already inside group)
    if (field.fieldKey === 'ketentuan_peminjaman_kendaraan' || field.fieldKey === 'ketentuan') {
      return (
        <div key={field.id}>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            {field.options.map((opt) => (
              <li key={opt.id}>{opt.label}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    switch (field.fieldType) {
      case 'text':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={field.placeholder || ''}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={field.placeholder || ''}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
        
      case 'date':
      case 'datetime':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.fieldType === 'datetime' ? 'datetime-local' : 'date'}
              value={value}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
        
      case 'select':
        // Special handling for department field
        if (field.fieldKey === 'department_bagian') {
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
              </label>
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih {field.label}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            </div>
          );
        }
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih {field.label}</option>
              {field.options.map((opt) => (
                <option key={opt.id} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
        
      case 'radio':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((opt) => (
                <label key={opt.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={field.fieldKey}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value === 'true' || value === '1'}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
              </span>
            </label>
            {field.helpText && <p className="text-xs text-gray-500 mt-1 ml-8">{field.helpText}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Group form fields by groupName
  const groupedFields = formFields.reduce((acc, field) => {
    const group = field.groupName || 'Lainnya';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  // Merge Ketentuan + Persetujuan into a single group called "Ketentuan & Persetujuan"
  const orderedGroupEntries = () => {
    const entries = Object.entries(groupedFields);
    const ketentuanIndex = entries.findIndex(([name]) => name === 'Ketentuan');
    const persetujuanIndex = entries.findIndex(([name]) => name === 'Persetujuan');
    
    if (ketentuanIndex !== -1 && persetujuanIndex !== -1) {
      // Merge both groups into one
      const ketentuanFields = entries[ketentuanIndex][1];
      const persetujuanFields = entries[persetujuanIndex][1];
      const mergedFields = [...ketentuanFields, ...persetujuanFields];
      
      // Remove both original entries (remove higher index first to avoid shift issues)
      const higherIdx = Math.max(ketentuanIndex, persetujuanIndex);
      const lowerIdx = Math.min(ketentuanIndex, persetujuanIndex);
      entries.splice(higherIdx, 1);
      entries.splice(lowerIdx, 1);
      
      // Add merged group at the end
      entries.push(['Ketentuan & Persetujuan', mergedFields]);
    }
    return entries;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <img src="/Loader-2.gif" alt="Loading..." className="w-16 h-16" />
      </div>
    );
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Nomor tiket berhasil disalin!');
  };

  // Telegram bot username (ganti dengan bot Anda)
  const TELEGRAM_BOT_USERNAME = 'LPK_IMM_Bot';

  // Success Screen
  if (successData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
          <p className="text-gray-600 mb-4">Permintaan kendaraan Anda telah dikirim.</p>
          
          {/* Ticket Number Box */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Nomor Tiket Anda:</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-blue-600">{successData.ticketNumber}</p>
              <button
                onClick={() => copyToClipboard(successData.ticketNumber)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Salin nomor tiket"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Klik ikon untuk menyalin nomor tiket</p>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-2">💡 Simpan Nomor Tiket Anda:</p>
            <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Screenshot halaman ini, atau</li>
              <li>Salin nomor tiket dengan tombol di atas</li>
            </ol>
          </div>

          {/* Telegram Bot Section */}
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <p className="text-sm font-semibold text-indigo-800">Notifikasi via Telegram</p>
            </div>
            <p className="text-xs text-indigo-700 mb-3">
              Daftarkan diri Anda ke Bot Telegram kami untuk menerima notifikasi tiket di permohonan berikutnya secara otomatis.
            </p>
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${successData.ticketNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Hubungkan Telegram
            </a>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  serviceType: '',
                  name: '',
                  nik: '',
                  email: '',
                  departmentId: '',
                  vehiclePurpose: '',
                  purposeReason: '',
                  locationType: '',
                  startDate: '',
                  endDate: '',
                  agreement: '',
                });
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buat Permohonan Baru
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setActiveTab('cek-tiket');
                setTicketSearch(successData.ticketNumber);
              }}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cek Status Tiket
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/BG_2.png)' }}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <img src="/IMM.svg" alt="IMM Logo" className="h-10 w-auto" />
          {/* Mobile: FPK - IMM (centered) */}
          <span className="md:hidden flex-1 text-center text-lg font-bold text-blue-600">FPK - IMM</span>
          {/* Desktop: Full title */}
          <h1 className="hidden md:block flex-1 text-center text-2xl font-bold text-blue-600">Sistem Layanan Peminjaman Kendaraan PT Indominco Mandiri</h1>
          {/* Mobile: Login */}
          <button
            onClick={() => navigate('/login')}
            className="md:hidden px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
          {/* Desktop: Admin Login */}
          <button
            onClick={() => navigate('/login')}
            className="hidden md:block px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('cek-tiket')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'cek-tiket'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cek Tiket
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'form'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Form Permohonan Kendaraan
            </button>
          </div>
        </div>

        {/* Cek Tiket Tab */}
        {activeTab === 'cek-tiket' && (
          <div>
            {/* Box 1: Header */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Tiket Kendaraan</h2>
              <p className="text-gray-600">Silahkan cari tiket anda</p>
            </div>

            {/* Box 2: Search */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cari Tiket</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value.toUpperCase())}
                  placeholder="Nomor tiket (contoh: GA-TR-XXXX)"
                  className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchTicket()}
                />
                <button
                  onClick={handleSearchTicket}
                  disabled={searchLoading}
                  className="p-3 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 shrink-0"
                  title="Cari Tiket"
                >
                  {searchLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Mencari...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="hidden sm:inline">Cari</span>
                    </>
                  )}
                </button>
              </div>

              {ticketError && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {ticketError}
                </div>
              )}
            </div>

            {/* Ticket Result */}
            {ticketResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Tiket</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Nomor Tiket</span>
                    <span className="font-bold text-blue-600 text-lg">{ticketResult.ticketNumber}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Nama Pemohon</span>
                    <span className="font-semibold">{ticketResult.name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">NIK</span>
                    <span className="font-semibold">{ticketResult.nik}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold">{ticketResult.email}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Department</span>
                    <span className="font-semibold">{ticketResult.departmentName}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Keperluan</span>
                    <span className="font-semibold capitalize">
                      {ticketResult.vehiclePurpose === 'dinas' ? 'Dinas' : 'Pribadi'} - {ticketResult.purposeReason}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Lokasi Tujuan</span>
                    <span className="font-semibold capitalize">
                      {ticketResult.locationType === 'desa_binaan' ? 'Desa Binaan' : 'Non-Desa Binaan'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Waktu Peminjaman</span>
                    <span className="font-semibold">{formatDate(ticketResult.startDate)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Waktu Selesai</span>
                    <span className="font-semibold">{formatDate(ticketResult.endDate)}</span>
                  </div>

                  {/* Approval Progress Section */}
                  <div className="pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Status Approval</h4>
                    <div className="space-y-3">
                      {/* Approval Level 1 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            ticketResult.approval1 === 'approved' ? 'bg-green-500' : 
                            ticketResult.approval1 === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                          }`}>1</div>
                          <div>
                            <p className="font-medium text-gray-800">{getApprovalLevelLabel(1)}</p>
                            {ticketResult.approval1At && (
                              <p className="text-xs text-gray-500">{formatDate(ticketResult.approval1At)}</p>
                            )}
                            {ticketResult.approval1Notes && (
                              <p className="text-xs text-gray-600 italic">"{ticketResult.approval1Notes}"</p>
                            )}
                          </div>
                        </div>
                        {getApprovalBadge(ticketResult.approval1)}
                      </div>

                      {/* Approval Level 2 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            ticketResult.approval2 === 'approved' ? 'bg-green-500' : 
                            ticketResult.approval2 === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                          }`}>2</div>
                          <div>
                            <p className="font-medium text-gray-800">{getApprovalLevelLabel(2)}</p>
                            {ticketResult.approval2At && (
                              <p className="text-xs text-gray-500">{formatDate(ticketResult.approval2At)}</p>
                            )}
                            {ticketResult.approval2Notes && (
                              <p className="text-xs text-gray-600 italic">"{ticketResult.approval2Notes}"</p>
                            )}
                          </div>
                        </div>
                        {getApprovalBadge(ticketResult.approval2)}
                      </div>

                      {/* Approval Level 3 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            ticketResult.approval3 === 'approved' ? 'bg-green-500' : 
                            ticketResult.approval3 === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                          }`}>3</div>
                          <div>
                            <p className="font-medium text-gray-800">{getApprovalLevelLabel(3)}</p>
                            {ticketResult.approval3At && (
                              <p className="text-xs text-gray-500">{formatDate(ticketResult.approval3At)}</p>
                            )}
                            {ticketResult.approval3Notes && (
                              <p className="text-xs text-gray-600 italic">"{ticketResult.approval3Notes}"</p>
                            )}
                          </div>
                        </div>
                        {getApprovalBadge(ticketResult.approval3)}
                      </div>

                      {/* Approval Level 4 - Only show for non-desa_binaan */}
                      {ticketResult.locationType !== 'desa_binaan' && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              ticketResult.approval4 === 'approved' ? 'bg-green-500' : 
                              ticketResult.approval4 === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                            }`}>4</div>
                            <div>
                              <p className="font-medium text-gray-800">{getApprovalLevelLabel(4)}</p>
                              {ticketResult.approval4At && (
                                <p className="text-xs text-gray-500">{formatDate(ticketResult.approval4At)}</p>
                              )}
                              {ticketResult.approval4Notes && (
                                <p className="text-xs text-gray-600 italic">"{ticketResult.approval4Notes}"</p>
                              )}
                            </div>
                          </div>
                          {getApprovalBadge(ticketResult.approval4)}
                        </div>
                      )}
                    </div>

                    {/* Overall Status */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Status Keseluruhan</span>
                      {getStatusBadge(ticketResult.status)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Tab */}
        {activeTab === 'form' && (
          <div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Dynamic Form Fields grouped by groupName */}
              {orderedGroupEntries().map(([groupName, fields]) => (
                <div key={groupName} className="bg-white rounded-lg shadow-md mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">{groupName}</h2>
                  </div>
                  <div className={`p-6 ${groupName === 'Waktu Peminjaman' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
                    {fields.map((field) => renderFormField(field))}
                  </div>
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Mengirim...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PermohonanKendaraan;
