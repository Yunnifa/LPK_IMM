import { useState, useEffect } from 'react';
import { 
  getAllFormFields, 
  createFormField, 
  updateFormField, 
  deleteFormField 
} from '../services/apiService';
import { FormField } from '../types';

// Type aliases for form field types
type FieldTypeValue = 'text' | 'date' | 'select' | 'radio' | 'textarea' | 'checkbox' | 'datetime';

const KelolaPertanyaan = () => {
  // State
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [tambahModal, setTambahModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [fieldYangDiedit, setFieldYangDiedit] = useState<FormField | null>(null);
  const [showTambahDropdown, setShowTambahDropdown] = useState(false);

  // Search & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form state untuk tambah
  const [formLabel, setFormLabel] = useState('');
  const [formFieldType, setFormFieldType] = useState<FieldTypeValue>('text');
  const [formOptions, setFormOptions] = useState<string[]>(['', '']);
  const [formIsRequired, setFormIsRequired] = useState(false);

  // Form state untuk edit
  const [editLabel, setEditLabel] = useState('');
  const [editFieldType, setEditFieldType] = useState<FieldTypeValue>('text');
  const [editOptions, setEditOptions] = useState<{ id?: number; value: string }[]>([]);
  const [editIsRequired, setEditIsRequired] = useState(false);

  // Load fields from API
  useEffect(() => {
    loadFields();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTambahDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('.tambah-dropdown-container')) {
          setShowTambahDropdown(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTambahDropdown]);

  const loadFields = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllFormFields();
      // Sort by sortOrder and filter active
      const sortedFields = data
        .filter((f: FormField) => f.isActive)
        .sort((a: FormField, b: FormField) => a.sortOrder - b.sortOrder);
      setFields(sortedFields);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Generate field key from label
  const generateFieldKey = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Open tambah modal
  const openTambahModal = () => {
    setFormLabel('');
    setFormFieldType('text');
    setFormOptions(['', '']);
    setFormIsRequired(false);
    setTambahModal(true);
  };

  // Close tambah modal
  const closeTambahModal = () => {
    setTambahModal(false);
  };

  // Open edit modal
  const openEditModal = (field: FormField) => {
    setFieldYangDiedit(field);
    setEditLabel(field.label);
    setEditFieldType(field.fieldType);
    setEditOptions(
      field.options.length > 0 
        ? field.options.map(o => ({ id: o.id, value: o.label }))
        : [{ value: '' }, { value: '' }]
    );
    setEditIsRequired(field.isRequired);
    setEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModal(false);
    setFieldYangDiedit(null);
  };

  // Simpan pertanyaan baru
  const simpanPertanyaan = async () => {
    if (!formLabel.trim()) {
      alert('Deskripsi pertanyaan tidak boleh kosong!');
      return;
    }

    if ((formFieldType === 'select' || formFieldType === 'radio')) {
      const validOptions = formOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Pilihan ganda minimal 2 opsi!');
        return;
      }
    }

    try {
      setSaving(true);
      const fieldKey = generateFieldKey(formLabel);
      const maxSortOrder = fields.length > 0 
        ? Math.max(...fields.map(f => f.sortOrder)) 
        : 0;

      const newFieldData: any = {
        fieldKey,
        label: formLabel,
        fieldType: formFieldType,
        sortOrder: maxSortOrder + 1,
        isRequired: formIsRequired,
      };

      // Add options for select/radio types
      if (formFieldType === 'select' || formFieldType === 'radio') {
        newFieldData.options = formOptions
          .filter(opt => opt.trim())
          .map((opt, idx) => ({
            value: opt.toLowerCase().replace(/\s+/g, '_'),
            label: opt,
            sortOrder: idx,
          }));
      }

      await createFormField(newFieldData);
      await loadFields();
      closeTambahModal();
      alert('Pertanyaan berhasil ditambahkan!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan pertanyaan');
    } finally {
      setSaving(false);
    }
  };

  // Simpan edit pertanyaan
  const simpanEditPertanyaan = async () => {
    if (!editLabel.trim()) {
      alert('Deskripsi pertanyaan tidak boleh kosong!');
      return;
    }

    if ((editFieldType === 'select' || editFieldType === 'radio')) {
      const validOptions = editOptions.filter(opt => opt.value.trim());
      if (validOptions.length < 2) {
        alert('Pilihan ganda minimal 2 opsi!');
        return;
      }
    }

    if (!fieldYangDiedit) return;

    try {
      setSaving(true);
      const fieldKey = generateFieldKey(editLabel);

      const updateData: any = {
        fieldKey,
        label: editLabel,
        fieldType: editFieldType,
        isRequired: editIsRequired,
      };

      // Add options for select/radio types
      if (editFieldType === 'select' || editFieldType === 'radio') {
        updateData.options = editOptions
          .filter(opt => opt.value.trim())
          .map((opt, idx) => ({
            id: opt.id,
            value: opt.value.toLowerCase().replace(/\s+/g, '_'),
            label: opt.value,
            sortOrder: idx,
          }));
      } else {
        // Clear options for non-select types
        updateData.options = [];
      }

      await updateFormField(fieldYangDiedit.id, updateData);
      await loadFields();
      closeEditModal();
      alert('Pertanyaan berhasil diupdate!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan pertanyaan');
    } finally {
      setSaving(false);
    }
  };

  // Delete selected fields
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Hapus ${selectedIds.length} pertanyaan yang dipilih?`)) return;

    try {
      setSaving(true);
      for (const id of selectedIds) {
        await deleteFormField(id);
      }
      await loadFields();
      setSelectedIds([]);
      alert('Pertanyaan berhasil dihapus!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus pertanyaan');
    } finally {
      setSaving(false);
    }
  };

  // Filter fields
  const filteredFields = fields.filter(f =>
    f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.fieldKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selection handlers
  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFields.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFields.map(f => f.id));
    }
  };

  // Option handlers for tambah
  const tambahOpsi = () => {
    setFormOptions([...formOptions, '']);
  };

  const hapusOpsi = (index: number) => {
    if (formOptions.length > 1) {
      setFormOptions(formOptions.filter((_, i) => i !== index));
    }
  };

  const updateOpsi = (index: number, value: string) => {
    const updated = [...formOptions];
    updated[index] = value;
    setFormOptions(updated);
  };

  // Option handlers for edit
  const tambahOpsiEdit = () => {
    setEditOptions([...editOptions, { value: '' }]);
  };

  const hapusOpsiEdit = (index: number) => {
    if (editOptions.length > 1) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    }
  };

  const updateOpsiEdit = (index: number, value: string) => {
    const updated = [...editOptions];
    updated[index] = { ...updated[index], value };
    setEditOptions(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
            />
          </div>

          {/* Add Button with Dropdown */}
          <div className="relative tambah-dropdown-container">
            <button
              onClick={() => setShowTambahDropdown(!showTambahDropdown)}
              disabled={saving}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showTambahDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    setShowTambahDropdown(false);
                    openTambahModal();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tambah Pertanyaan
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide">Tipe Jawaban Tersedia:</div>
                <div className="px-4 py-2 text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Input Text
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Text Area (Paragraf)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Tanggal
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    Tanggal & Waktu
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Pilihan Ganda / Dropdown
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                    Checkbox
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={selectedIds.length === 0 || saving}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
              selectedIds.length === 0 || saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 hover:bg-red-100 text-red-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Select All */}
      {filteredFields.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredFields.length && filteredFields.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              {selectedIds.length > 0 ? `${selectedIds.length} dipilih` : 'Pilih semua'}
            </span>
          </label>
          <span className="text-sm text-gray-400 ml-auto">{filteredFields.length} pertanyaan</span>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-3">
        {filteredFields.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-500">Tidak ada pertanyaan ditemukan</p>
            <button
              onClick={openTambahModal}
              className="mt-4 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              + Tambah pertanyaan pertama
            </button>
          </div>
        ) : (
          filteredFields.map((field, idx) => (
            <div
              key={field.id}
              className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${
                selectedIds.includes(field.id) 
                  ? 'border-indigo-300 shadow-sm ring-2 ring-indigo-100' 
                  : 'border-gray-100 shadow-sm hover:border-gray-200'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(field.id)}
                    onChange={() => toggleSelectOne(field.id)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-semibold text-gray-800">{field.label}</h3>
                      {field.isRequired && (
                        <span className="px-2 py-0.5 text-xs bg-red-50 text-red-500 rounded-full">Wajib</span>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="ml-10">
                      {/* Text/Textarea/Date/Datetime - Show input preview */}
                      {(field.fieldType === 'text' || field.fieldType === 'textarea' || field.fieldType === 'date' || field.fieldType === 'datetime') && (
                        <div className={`w-full bg-gray-50 border-2 border-gray-300 rounded-xl ${field.fieldType === 'textarea' ? 'h-20' : 'h-10'} flex items-center px-3`}>
                          {field.fieldType === 'datetime' && <span className="text-xs text-gray-400">Tanggal & Waktu</span>}
                          {field.fieldType === 'date' && <span className="text-xs text-gray-400">Pilih Tanggal</span>}
                        </div>
                      )}

                      {/* Checkbox - Show checkbox preview */}
                      {field.fieldType === 'checkbox' && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300" />
                          <span className="text-sm text-gray-500">Checkbox</span>
                        </div>
                      )}

                      {/* Select/Radio - Show options */}
                      {(field.fieldType === 'select' || field.fieldType === 'radio') && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.options.map((opt, i) => (
                            <span
                              key={i}
                              className="text-sm text-gray-700 bg-gray-50 border-2 border-gray-300 px-4 py-2 rounded-xl"
                            >
                              {opt.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(field)}
                    className="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah */}
      {tambahModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeTambahModal()}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tambah Pertanyaan</h2>
                <p className="text-sm text-gray-500 mt-0.5">Buat pertanyaan baru untuk formulir</p>
              </div>
              <button onClick={closeTambahModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Deskripsi Pertanyaan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Pertanyaan</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Contoh: Nama Lengkap, Tanggal Kegiatan"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Tipe Jawaban */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Jawaban</label>
                <div className="relative">
                  <select
                    value={formFieldType}
                    onChange={(e) => setFormFieldType(e.target.value as any)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="text">Input Text</option>
                    <option value="textarea">Text Area (Paragraf)</option>
                    <option value="date">Tanggal</option>
                    <option value="datetime">Tanggal & Waktu</option>
                    <option value="radio">Pilihan Ganda</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Options for select/radio */}
              {(formFieldType === 'select' || formFieldType === 'radio') && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-purple-700 mb-3">Opsi Pilihan</label>
                  <div className="space-y-2">
                    {formOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOpsi(i, e.target.value)}
                          placeholder={`Opsi ${i + 1}`}
                          className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        {formOptions.length > 1 && (
                          <button
                            onClick={() => hapusOpsi(i)}
                            className="px-3 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={tambahOpsi}
                      className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1 mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah opsi
                    </button>
                  </div>
                </div>
              )}

              {/* Required checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsRequired}
                  onChange={(e) => setFormIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Pertanyaan wajib diisi</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeTambahModal}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={simpanPertanyaan}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editModal && fieldYangDiedit && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeEditModal()}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Edit Pertanyaan</h2>
                <p className="text-sm text-gray-500 mt-0.5">Ubah pertanyaan formulir</p>
              </div>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Deskripsi Pertanyaan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Pertanyaan</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Contoh: Nama Lengkap, Tanggal Kegiatan"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Tipe Jawaban */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Jawaban</label>
                <div className="relative">
                  <select
                    value={editFieldType}
                    onChange={(e) => setEditFieldType(e.target.value as any)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="text">Input Text</option>
                    <option value="textarea">Text Area (Paragraf)</option>
                    <option value="date">Tanggal</option>
                    <option value="datetime">Tanggal & Waktu</option>
                    <option value="radio">Pilihan Ganda</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Options for select/radio */}
              {(editFieldType === 'select' || editFieldType === 'radio') && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-purple-700 mb-3">Opsi Pilihan</label>
                  <div className="space-y-2">
                    {editOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => updateOpsiEdit(i, e.target.value)}
                          placeholder={`Opsi ${i + 1}`}
                          className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                        {editOptions.length > 1 && (
                          <button
                            onClick={() => hapusOpsiEdit(i)}
                            className="px-3 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={tambahOpsiEdit}
                      className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1 mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah opsi
                    </button>
                  </div>
                </div>
              )}

              {/* Required checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsRequired}
                  onChange={(e) => setEditIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Pertanyaan wajib diisi</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeEditModal}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={simpanEditPertanyaan}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaPertanyaan;
