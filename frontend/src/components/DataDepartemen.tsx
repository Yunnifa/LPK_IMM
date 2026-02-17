import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

interface Department {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

const DataDepartemen = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; field: string; message: string }[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data departemen');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormName('');
    setFormDescription('');
    setEditingDepartment(null);
    setShowModal(true);
  };

  const openEditModal = (department: Department) => {
    setModalMode('edit');
    setFormName(department.name);
    setFormDescription(department.description || '');
    setEditingDepartment(department);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormName('');
    setFormDescription('');
    setEditingDepartment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert('Nama departemen tidak boleh kosong');
      return;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/departments', {
          name: formName,
          description: formDescription || null,
        });
        alert('Departemen berhasil ditambahkan');
      } else if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, {
          name: formName,
          description: formDescription || null,
        });
        alert('Departemen berhasil diupdate');
      }

      closeModal();
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan departemen');
      console.error('Error saving department:', err);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedDepartments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedDepartments.map(d => d.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih departemen yang akan dihapus');
      return;
    }

    if (!confirm(`Hapus ${selectedIds.length} departemen yang dipilih?`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await api.delete(`/departments/${id}`);
      }
      alert(`${selectedIds.length} departemen berhasil dihapus`);
      setSelectedIds([]);
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus departemen');
      console.error('Error deleting departments:', err);
    }
  };

  // Get data to export with proper sequential IDs
  const getExportData = () => {
    const dataToExport = selectedIds.length > 0 
      ? filteredDepartments.filter(d => selectedIds.includes(d.id))
      : filteredDepartments;
    
    return dataToExport.map((d, index) => ({
      id: `DEPT-${String(index + 1).padStart(2, '0')}`,
      name: d.name
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    setShowExportDropdown(false);
    const data = getExportData();
    const headers = ['ID Dept', 'Nama Departemen'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => [
        d.id,
        `"${d.name}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_departemen_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to Excel
  const handleExportExcel = () => {
    setShowExportDropdown(false);
    const data = getExportData();
    const headers = ['ID Dept', 'Nama Departemen'];
    const csvContent = '\uFEFF' + [
      headers.join('\t'),
      ...data.map(d => [
        d.id,
        d.name
      ].join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_departemen_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  // Export to PDF
  const handleExportPDF = () => {
    setShowExportDropdown(false);
    const data = getExportData();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Departemen - ${new Date().toLocaleDateString('id-ID')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background-color: #4338ca; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .print-date { text-align: right; font-size: 10px; color: #666; margin-bottom: 10px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-date">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <h1>Data Departemen</h1>
        <table>
          <thead>
            <tr>
              <th>ID Dept</th>
              <th>Nama Departemen</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(d => `
              <tr>
                <td>${d.id}</td>
                <td>${d.name}</td>
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

  // Import handlers
  const handleImportClick = () => {
    setShowImportModal(true);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setShowErrorDetails(false);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setShowErrorDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Main data sheet
    const worksheet = workbook.addWorksheet('Data Departemen');
    
    // Define columns with headers
    worksheet.columns = [
      { header: 'Nama Departemen *', key: 'name', width: 35 },
      { header: 'Deskripsi', key: 'description', width: 50 },
    ];
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4338CA' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    
    // Add sample data row
    worksheet.addRow({
      name: 'General Affairs',
      description: 'Departemen urusan umum perusahaan'
    });
    
    // Style sample row
    const sampleRow = worksheet.getRow(2);
    sampleRow.font = { italic: true, color: { argb: 'FF888888' } };
    
    // Add Instructions sheet
    const instructionSheet = workbook.addWorksheet('Petunjuk');
    instructionSheet.getColumn('A').width = 60;
    
    const instructions = [
      'PETUNJUK PENGISIAN TEMPLATE',
      '',
      '1. Isi data pada sheet "Data Departemen"',
      '2. Kolom dengan tanda (*) wajib diisi',
      '3. Hapus baris contoh (baris 2 berwarna italic abu-abu) sebelum import',
      '',
      'KETERANGAN KOLOM:',
      '- Nama Departemen: Nama lengkap departemen (wajib)',
      '- Deskripsi: Deskripsi singkat departemen (opsional)',
    ];
    
    instructions.forEach((text, idx) => {
      const cell = instructionSheet.getCell(`A${idx + 1}`);
      cell.value = text;
      if (idx === 0) {
        cell.font = { bold: true, size: 14 };
      } else if (text.startsWith('KETERANGAN')) {
        cell.font = { bold: true };
      }
    });
    
    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_import_departemen_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const processImport = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get first sheet (skip hidden sheets)
      let sheetName = workbook.SheetNames.find(name => !name.startsWith('__'));
      if (!sheetName) sheetName = workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Skip header row
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      let successCount = 0;
      let failedCount = 0;
      const errors: { row: number; field: string; message: string }[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        
        setUploadProgress(Math.round(((i + 1) / rows.length) * 100));
        
        // Parse row data
        const name = String(row[0] || '').trim();
        const description = String(row[1] || '').trim();
        
        // Validation
        if (!name) {
          errors.push({ row: rowNum, field: 'Nama Departemen', message: 'Nama departemen wajib diisi' });
          failedCount++;
          continue;
        }
        
        // Create department
        try {
          await api.post('/departments', {
            name: name,
            description: description || null,
          });
          successCount++;
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || err.message || 'Gagal membuat departemen';
          errors.push({ row: rowNum, field: 'API', message: errorMessage });
          failedCount++;
        }
      }
      
      setUploadResult({ success: successCount, failed: failedCount, errors });
      
      if (successCount > 0) {
        fetchDepartments();
      }
    } catch (err) {
      console.error('Import error:', err);
      setUploadResult({ 
        success: 0, 
        failed: 1, 
        errors: [{ row: 0, field: 'File', message: 'Error membaca file. Pastikan format file benar.' }] 
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* Row 1: Tambah + Import */}
          <div className="flex gap-2">
            <button
              onClick={openAddModal}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
            <button
              onClick={handleImportClick}
              className="flex-1 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
          </div>

          {/* Row 2: Search */}
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Row 3: Export + Hapus */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              {showExportDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
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
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                selectedIds.length > 0
                  ? 'bg-red-50 hover:bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-row gap-3 items-center">
          {/* Tambah Button */}
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>

          {/* Import Button */}
          <button
            onClick={handleImportClick}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>

          {/* Search */}
          <div className="flex-1 w-full relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
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

          {/* Hapus Button */}
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              selectedIds.length > 0
                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedDepartments.length && paginatedDepartments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID Dept</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama Departemen</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data departemen
                    </td>
                  </tr>
                ) : (
                  paginatedDepartments.map((dept, index) => (
                    <tr key={dept.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(dept.id) ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(dept.id)}
                          onChange={() => toggleSelectOne(dept.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-mono">
                          DEPT-{String(startIndex + index + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dept.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openEditModal(dept)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
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
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>data per halaman</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Menampilkan {filteredDepartments.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredDepartments.length)} dari {filteredDepartments.length} data</span>
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
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'add' ? 'Tambah Departemen' : 'Edit Departemen'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Departemen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Masukkan nama departemen"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Masukkan deskripsi (opsional)"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  {modalMode === 'add' ? 'Tambah' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Import Data Departemen</h3>
              <button
                onClick={handleCloseImportModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Download Template Button */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                <div>
                  <p className="font-medium text-indigo-900">Download Template</p>
                  <p className="text-sm text-indigo-600">Gunakan template untuk format yang benar</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-medium text-emerald-700">{selectedFile.name}</p>
                    <p className="text-sm text-emerald-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Hapus file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-700">
                      {dragOver ? 'Lepas file di sini' : 'Drag & drop file atau klik untuk pilih'}
                    </p>
                    <p className="text-sm text-gray-500">Format: .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mengimport data...</span>
                    <span className="text-indigo-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-emerald-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-emerald-600">{uploadResult.success}</p>
                      <p className="text-sm text-emerald-700">Berhasil</p>
                    </div>
                    <div className="flex-1 p-4 bg-red-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                      <p className="text-sm text-red-700">Gagal</p>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="border border-red-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="w-full p-3 bg-red-50 text-left flex items-center justify-between hover:bg-red-100 transition-colors"
                      >
                        <span className="font-medium text-red-700">
                          Detail Error ({uploadResult.errors.length})
                        </span>
                        <svg
                          className={`w-5 h-5 text-red-600 transition-transform ${showErrorDetails ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showErrorDetails && (
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-red-100 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-red-800">Baris</th>
                                <th className="px-3 py-2 text-left text-red-800">Kolom</th>
                                <th className="px-3 py-2 text-left text-red-800">Pesan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100">
                              {uploadResult.errors.map((err, idx) => (
                                <tr key={idx} className="hover:bg-red-50">
                                  <td className="px-3 py-2 text-red-700">{err.row}</td>
                                  <td className="px-3 py-2 text-red-700">{err.field}</td>
                                  <td className="px-3 py-2 text-red-600">{err.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCloseImportModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {uploadResult ? 'Tutup' : 'Batal'}
              </button>
              {!uploadResult && (
                <button
                  onClick={processImport}
                  disabled={!selectedFile || uploading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedFile && !uploading
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDepartemen;
