import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDepartments, createVehicleRequest, getCurrentUser, getFormFields, saveFormResponses } from '../services/apiService';

// Interfaces
interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
}

interface FormFieldOption {
  id: number;
  value: string;
  label: string;
  sortOrder: number;
}

interface FormField {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: 'text' | 'date' | 'select' | 'radio' | 'textarea';
  groupName: string | null;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
  isSystemField: boolean;
  options: FormFieldOption[];
}

function VehicleRequestForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Dynamic form values - keyed by fieldKey
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, deptData, fieldsData] = await Promise.all([
        getCurrentUser(),
        getDepartments(),
        getFormFields(),
      ]);
      setUser(userData);
      setDepartments(deptData);
      
      // Sort fields and set initial values
      const sortedFields = fieldsData.sort((a: FormField, b: FormField) => a.sortOrder - b.sortOrder);
      setFormFields(sortedFields);
      
      // Initialize form values with defaults
      const initialValues: Record<string, string> = {};
      sortedFields.forEach((field: FormField) => {
        initialValues[field.fieldKey] = '';
        // Pre-fill user data for common fields (matching seeded fieldKeys)
        if (field.fieldKey === 'nama_lengkap' || field.fieldKey === 'name') {
          initialValues[field.fieldKey] = userData.fullName || '';
        }
        if (field.fieldKey === 'alamat_email' || field.fieldKey === 'email') {
          initialValues[field.fieldKey] = userData.email || '';
        }
      });
      setFormValues(initialValues);
    } catch (err: any) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldKey: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    const missingFields = formFields
      .filter(f => f.isRequired && !formValues[f.fieldKey]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      setError(`Lengkapi field yang wajib diisi: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      // Create vehicle request with basic data
      // Map dynamic field keys to the expected API fields
      const requestData: any = {
        serviceType: formValues['jenis_layanan'] || formValues['service_type'] || 'layanan_pool',
        name: formValues['nama_lengkap'] || formValues['name'] || user?.fullName || '',
        nik: formValues['nomor_induk_kependudukan'] || formValues['nik'] || '',
        email: formValues['alamat_email'] || formValues['email'] || user?.email || '',
        departmentId: parseInt(formValues['department_bagian'] || formValues['department_id'] || '0') || 1,
        vehiclePurpose: formValues['jenis_keperluan_kendaraan'] || formValues['vehicle_purpose'] || 'dinas',
        purposeReason: formValues['alasan_keperluan_kendaraan'] || formValues['purpose_reason'] || '',
        locationType: formValues['lokasi_tempat_tujuan'] || formValues['location_type'] || 'desa_binaan',
        startDate: formValues['tanggal_mulai'] || formValues['start_date'] || new Date().toISOString(),
        endDate: formValues['tanggal_selesai'] || formValues['end_date'] || new Date().toISOString(),
        agreement: formValues['persetujuan_ketentuan'] === 'setuju' || formValues['agreement'] === 'setuju' || true,
      };

      const result = await createVehicleRequest(requestData);

      // Save dynamic form responses
      if (result.id) {
        const responses = formFields.map(field => ({
          fieldId: field.id,
          fieldKey: field.fieldKey,
          value: formValues[field.fieldKey] || '',
        }));
        await saveFormResponses(result.id, responses);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-requests');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  // Group fields by groupName
  const groupedFields = formFields.reduce((acc, field) => {
    const group = field.groupName || 'Lainnya';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  // Sort groups by minimum sortOrder of their fields
  const sortedGroupEntries = Object.entries(groupedFields).sort((a, b) => {
    const minA = Math.min(...a[1].map(f => f.sortOrder));
    const minB = Math.min(...b[1].map(f => f.sortOrder));
    return minA - minB;
  });

  // Render a single field
  const renderField = (field: FormField) => {
    const value = formValues[field.fieldKey] || '';

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
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || ''}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
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
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || ''}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all resize-none"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      case 'select':
        // Special handling for ketentuan - render as bullet list (info only)
        if (field.fieldKey === 'ketentuan') {
          return (
            <div key={field.id}>
              {field.helpText && <p className="text-sm text-gray-600 mb-3">{field.helpText}</p>}
              <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                {field.options.map((opt) => (
                  <li key={opt.id}>{opt.label}</li>
                ))}
              </ul>
            </div>
          );
        }
        // Special handling for department field
        if (field.fieldKey === 'department_bagian' || field.fieldKey === 'department_id' || field.fieldKey === 'departemen') {
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
              </label>
              <select
                value={value}
                onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
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
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
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
            <div className="flex flex-wrap gap-4">
              {field.options.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.fieldKey}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Memuat formulir...</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-lg text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
          <p className="text-gray-600">Permintaan kendaraan Anda telah dikirim.</p>
          <p className="text-gray-400 text-sm mt-3">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat Datang, {user?.fullName}
          </h1>
          <p className="text-gray-600 mt-2">Mohon mengisi formulir permintaan</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {formFields.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Belum ada pertanyaan formulir yang dikonfigurasi.</p>
            <p className="text-gray-400 text-sm mt-1">Hubungi administrator untuk mengatur formulir.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Render grouped fields - sorted by sortOrder */}
            {sortedGroupEntries.map(([groupName, fields]) => (
              <div key={groupName} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-100 bg-gradient-to-r ${groupName === 'Ketentuan' ? 'from-amber-50/50' : 'from-indigo-50/50'} to-transparent`}>
                  <h2 className="text-lg font-semibold text-gray-800">{groupName}</h2>
                </div>
                <div className="p-6 space-y-5">
                  {fields.map(field => renderField(field))}
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Mengirim...
                  </span>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default VehicleRequestForm;

