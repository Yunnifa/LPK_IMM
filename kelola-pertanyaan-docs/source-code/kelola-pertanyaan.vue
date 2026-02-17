<script setup>
import { ref, provide } from "vue";
import Aside from "../bar/aside.vue";
import HeaderAdmin from "../bar/header-admin.vue";
import {
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

// Reactive state
const isMobileMenuOpen = ref(false);
const tambahPertanyaan = ref(false);
const editPertanyaan = ref(false);
const pertanyaanYangDiedit = ref(null);

// Form state untuk tambah
const formNamaTabel = ref("");
const formLabel = ref("");
const formJawabanList = ref([
  { id: 1, tipe: "text", label: "", pilihan_list: [] }
]);

// Form state untuk edit
const formEditNamaTabel = ref("");
const formEditLabel = ref("");
const formEditJawabanList = ref([
  { id: 1, tipe: "text", label: "", pilihan_list: [] }
]);
const formEditPilihanList = ref({});

// Daftar pertanyaan (setiap pertanyaan satu kotak)
const pertanyaanList = ref([
  { 
    id: 1,
    nama_tabel: "Nama Lengkap",
    label: "Nama Lengkap", 
    jawaban_list: [
      { id: 1, tipe: "text", label: "Nama" }
    ]
  },
  { 
    id: 2,
    nama_tabel: "Tanggal",
    label: "Tanggal Kegiatan", 
    jawaban_list: [
      { id: 1, tipe: "date", label: "Tanggal Mulai" },
      { id: 2, tipe: "date", label: "Tanggal Selesai" }
    ]
  },
  {
    id: 3,
    nama_tabel: "Jenis Kelamin",
    label: "Jenis Kelamin",
    jawaban_list: [
      { id: 1, tipe: "multiple", label: "Pilihan", pilihan_list: ["Laki-laki", "Perempuan"] }
    ]
  },
]);

const getTipeLabel = (tipe) => {
  switch (tipe) {
    case "text":
      return "Input Text";
    case "date":
      return "Tanggal";
    case "multiple":
      return "Pilihan Ganda";
    default:
      return "Input Text";
  }
};

// Functions
const openTambahPertanyaan = () => {
  tambahPertanyaan.value = true;
  formNamaTabel.value = "";
  formLabel.value = "";
  formJawabanList.value = [
    { id: 1, tipe: "text", label: "", pilihan_list: [] }
  ];
};

const closeTambahPertanyaan = () => {
  tambahPertanyaan.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const openEditPertanyaan = (pertanyaan) => {
  editPertanyaan.value = true;
  pertanyaanYangDiedit.value = pertanyaan;
  formEditNamaTabel.value = pertanyaan.nama_tabel || "";
  formEditLabel.value = pertanyaan.label;
  formEditJawabanList.value = pertanyaan.jawaban_list.map(j => ({
    id: j.id,
    tipe: j.tipe,
    label: j.label || "",
    pilihan_list: j.pilihan_list ? [...j.pilihan_list] : []
  }));
  
  // Initialize pilihanList object for tracking options per jawaban
  formEditPilihanList.value = {};
  pertanyaan.jawaban_list.forEach(j => {
    if (j.tipe === "multiple") {
      formEditPilihanList.value[j.id] = j.pilihan_list ? [...j.pilihan_list] : [""];
    }
  });
};

const closeEditPertanyaan = () => {
  editPertanyaan.value = false;
  pertanyaanYangDiedit.value = null;
};

const simpanEditPertanyaan = () => {
  if (!formEditNamaTabel.value.trim()) {
    alert("Nama tabel tidak boleh kosong!");
    return;
  }

  if (!formEditLabel.value.trim()) {
    alert("Label pertanyaan tidak boleh kosong!");
    return;
  }

  if (formEditJawabanList.value.length === 0) {
    alert("Minimal harus ada 1 jawaban!");
    return;
  }

  for (let jawaban of formEditJawabanList.value) {
    if (jawaban.tipe !== 'multiple' && !jawaban.label.trim()) {
      alert("Label jawaban tidak boleh kosong!");
      return;
    }
    
    if (jawaban.tipe === "multiple") {
      const validOptions = formEditPilihanList.value[jawaban.id]?.filter((opt) => opt.trim()) || [];
      if (validOptions.length < 2) {
        alert("Pilihan ganda minimal 2 opsi!");
        return;
      }
    }
  }

  const index = pertanyaanList.value.findIndex(
    (p) => p.id === pertanyaanYangDiedit.value.id,
  );
  
  if (index > -1) {
    const updatedJawaban = formEditJawabanList.value.map(j => ({
      id: j.id,
      tipe: j.tipe,
      label: j.tipe === 'multiple' ? "" : j.label,
      pilihan_list: j.tipe === "multiple" 
        ? formEditPilihanList.value[j.id].filter((o) => o.trim()) 
        : []
    }));

    pertanyaanList.value[index] = {
      id: pertanyaanYangDiedit.value.id,
      nama_tabel: formEditNamaTabel.value,
      label: formEditLabel.value,
      jawaban_list: updatedJawaban
    };
  }

  closeEditPertanyaan();
  alert("Pertanyaan berhasil diupdate!");
};

const hapusPertanyaan = (pertanyaan) => {
  if (confirm("Hapus pertanyaan ini?")) {
    const index = pertanyaanList.value.findIndex((p) => p.id === pertanyaan.id);
    if (index > -1) pertanyaanList.value.splice(index, 1);
  }
};

const hapusJawaban = (index) => {
  if (editPertanyaan.value && formEditJawabanList.value.length > 1) {
    const jawaban = formEditJawabanList.value[index];
    delete formEditPilihanList.value[jawaban.id];
    formEditJawabanList.value.splice(index, 1);
  } else if (!editPertanyaan.value && formJawabanList.value.length > 1) {
    formJawabanList.value.splice(index, 1);
  }
};

const tambahJawaban = () => {
  const newId = Math.max(...formJawabanList.value.map(j => j.id), 0) + 1;
  formJawabanList.value.push({
    id: newId,
    tipe: "text",
    label: "",
    pilihan_list: []
  });
};

const tambahJawabanEdit = () => {
  const newId = Math.max(...formEditJawabanList.value.map(j => j.id), 0) + 1;
  formEditJawabanList.value.push({
    id: newId,
    tipe: "text",
    label: "",
    pilihan_list: []
  });
};

const tambahOpsiTambah = (idx) => {
  const jawaban = formJawabanList.value[idx];
  if (!jawaban.pilihan_list) {
    jawaban.pilihan_list = [];
  }
  jawaban.pilihan_list.push("");
};

const tambahOpsiEdit = (jawabanId) => {
  if (!formEditPilihanList.value[jawabanId]) {
    formEditPilihanList.value[jawabanId] = [""];
  }
  formEditPilihanList.value[jawabanId].push("");
};

const simpanPertanyaan = () => {
  if (!formNamaTabel.value.trim()) {
    alert("Nama tabel tidak boleh kosong!");
    return;
  }

  if (!formLabel.value.trim()) {
    alert("Label pertanyaan tidak boleh kosong!");
    return;
  }

  if (formJawabanList.value.length === 0) {
    alert("Minimal harus ada 1 jawaban!");
    return;
  }

  for (let jawaban of formJawabanList.value) {
    if (jawaban.tipe !== 'multiple' && !jawaban.label.trim()) {
      alert("Label jawaban tidak boleh kosong!");
      return;
    }
    
    if (jawaban.tipe === "multiple") {
      const validOptions = jawaban.pilihan_list?.filter((opt) => opt.trim()) || [];
      if (validOptions.length < 2) {
        alert("Pilihan ganda minimal 2 opsi!");
        return;
      }
    }
  }

  const newPertanyaan = {
    id: Date.now(),
    nama_tabel: formNamaTabel.value,
    label: formLabel.value,
    jawaban_list: formJawabanList.value.map(j => ({
      id: j.id,
      tipe: j.tipe,
      label: j.tipe === 'multiple' ? "" : j.label,
      pilihan_list: j.tipe === "multiple" ? (j.pilihan_list?.filter((o) => o.trim()) || []) : []
    }))
  };

  pertanyaanList.value.push(newPertanyaan);
  closeTambahPertanyaan();
  alert("Pertanyaan berhasil ditambahkan!");
};

provide("isMobileMenuOpen", isMobileMenuOpen);
provide("toggleMobileMenu", toggleMobileMenu);
</script>

<template>
  <div class="h-screen flex flex-col font-['Montserrat']">
    <div class="flex flex-1 overflow-hidden">
      <Aside />

      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <HeaderAdmin />

        <main class="bg-[#EFEFEF] flex-1 flex flex-col p-4 overflow-hidden">
          <div
            class="bg-white rounded-xl shadow p-6 flex-1 flex flex-col overflow-hidden min-h-0"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h1 class="text-xl font-bold text-black">Kelola Pertanyaan</h1>
                <p class="text-sm text-black mt-1">
                  Buat dan kelola daftar pertanyaan
                </p>
              </div>
              <button
                @click="openTambahPertanyaan"
                class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white bg-[#6444C6] hover:bg-[#5c3db8] text-sm font-medium"
              >
                <PlusIcon class="w-4 h-4" />
                Tambah Pertanyaan
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto space-y-3">
              <div
                v-for="(pertanyaan, idx) in pertanyaanList"
                :key="pertanyaan.id"
                class="bg-gray-50 rounded-lg border border-gray-200 p-4"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-1">
                      <span class="text-sm font-bold text-black"
                        >{{ idx + 1 }}.</span
                      >
                      <span class="text-sm font-semibold text-black">{{
                        pertanyaan.label
                      }}</span>
                    </div>

                    <!-- Nama Tabel -->
                    <div class="ml-6 mb-2">
                      <span class="text-xs text-gray-600">Tabel: </span>
                      <span class="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {{ pertanyaan.nama_tabel }}
                      </span>
                    </div>

                    <!-- Tampilkan daftar jawaban -->
                    <div class="ml-6 space-y-2">
                      <div
                        v-for="(jawaban, jIdx) in pertanyaan.jawaban_list"
                        :key="jawaban.id"
                        class="text-sm text-black bg-white border border-gray-300 px-3 py-2 rounded"
                      >
                        <div v-if="jawaban.tipe !== 'multiple'" class="flex items-center gap-2">
                          <span class="font-medium">{{ jawaban.label }}</span>
                          <span
                            class="text-xs text-white bg-[#6444C6] px-2 py-0.5 rounded"
                          >
                            {{ getTipeLabel(jawaban.tipe) }}
                          </span>
                        </div>
                        
                        <!-- Tampilkan opsi jika multiple -->
                        <div v-if="jawaban.tipe === 'multiple'">
                          <p class="text-xs text-white bg-[#6444C6] px-2 py-0.5 rounded inline-block mb-1">
                            {{ getTipeLabel(jawaban.tipe) }}
                          </p>
                          <p v-if="jawaban.pilihan_list && jawaban.pilihan_list.length > 0" class="text-xs text-gray-600 mb-1">Opsi:</p>
                          <div v-if="jawaban.pilihan_list && jawaban.pilihan_list.length > 0" class="flex flex-wrap gap-1">
                            <span
                              v-for="(opt, i) in jawaban.pilihan_list"
                              :key="i"
                              class="text-xs text-black bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded"
                            >
                              {{ opt }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 ml-4">
                    <button
                      @click="openEditPertanyaan(pertanyaan)"
                      class="px-3 py-1.5 text-sm font-medium bg-[#6444C6] text-white rounded-lg hover:bg-[#5c3db8]"
                    >
                      Edit
                    </button>
                    <button
                      @click="hapusPertanyaan(pertanyaan)"
                      class="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="pertanyaanList.length === 0" class="text-center py-16">
                <p class="text-lg font-medium text-black">
                  Belum ada pertanyaan
                </p>
                <p class="text-sm text-black mt-1">
                  Klik tombol "Tambah Pertanyaan" untuk membuat pertanyaan baru
                </p>
              </div>
            </div>

            <!-- Modal Tambah -->
            <div
              v-if="tambahPertanyaan"
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              @click.self="closeTambahPertanyaan"
            >
              <div
                class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg"
              >
                <!-- Header Modal -->
                <div
                  class="flex justify-between items-center p-5 border-b border-gray-200"
                >
                  <h2 class="text-lg font-bold text-black">
                    Tambah Pertanyaan
                  </h2>
                  <button
                    @click="closeTambahPertanyaan"
                    class="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon class="w-5 h-5 text-black" />
                  </button>
                </div>

                <div class="p-5 space-y-4">
                  <!-- Nama Tabel -->
                  <div>
                    <label class="block text-sm font-semibold text-black mb-2"
                      >Nama Tabel</label
                    >
                    <input
                      type="text"
                      v-model="formNamaTabel"
                      placeholder="Contoh: Nama Peserta"
                      class="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                    />
                  </div>

                  <!-- Label Pertanyaan -->
                  <div>
                    <label class="block text-sm font-semibold text-black mb-2"
                      >Label Pertanyaan</label
                    >
                    <input
                      type="text"
                      v-model="formLabel"
                      placeholder="Contoh: Tanggal Kegiatan"
                      class="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                    />
                  </div>

                  <!-- Daftar Jawaban -->
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label class="block text-sm font-semibold text-black mb-3"
                      >Daftar Jawaban</label
                    >
                    
                    <div class="space-y-4">
                      <div
                        v-for="(jawaban, idx) in formJawabanList"
                        :key="idx"
                        class="border border-gray-300 rounded-lg p-3 bg-white"
                      >
                        <!-- Label Jawaban (hanya jika bukan multiple) -->
                        <div v-if="jawaban.tipe !== 'multiple'" class="mb-3">
                          <label class="block text-xs font-semibold text-black mb-1"
                            >Label Jawaban</label
                          >
                          <input
                            type="text"
                            v-model="jawaban.label"
                            :placeholder="'Jawaban ' + (idx + 1) + ' (contoh: Tanggal Mulai)'"
                            class="w-full p-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                          />
                        </div>

                        <!-- Tipe Jawaban -->
                        <div class="relative mb-3">
                          <label class="block text-xs font-semibold text-black mb-1"
                            >Tipe Jawaban</label
                          >
                          <select
                            v-model="jawaban.tipe"
                            class="w-full p-2 border border-gray-300 rounded-lg text-sm text-black appearance-none focus:outline-none focus:border-[#6444C6]"
                          >
                            <option value="text">Input Text</option>
                            <option value="multiple">Pilihan Ganda</option>
                            <option value="date">Tanggal</option>
                          </select>
                          <ChevronDownIcon
                            class="absolute right-2 top-8 w-4 h-4 text-black pointer-events-none"
                          />
                        </div>

                        <!-- Multiple Choice Options (jika tipe = multiple) -->
                        <div v-if="jawaban.tipe === 'multiple'" class="bg-gray-100 rounded p-2 border border-gray-300 mb-3">
                          <label class="block text-xs font-semibold text-black mb-2"
                            >Opsi Pilihan</label
                          >
                          <div class="space-y-2">
                            <div
                              v-for="(opt, i) in (jawaban.pilihan_list || [])"
                              :key="i"
                              class="flex gap-2"
                            >
                              <input
                                type="text"
                                v-model="jawaban.pilihan_list[i]"
                                :placeholder="'Opsi ' + (i + 1)"
                                class="flex-1 p-1.5 border border-gray-300 rounded text-sm text-black focus:outline-none focus:border-[#6444C6]"
                              />
                              <button
                                v-if="jawaban.pilihan_list.length > 1"
                                @click="jawaban.pilihan_list.splice(i, 1)"
                                class="px-2 text-red-500 hover:bg-red-50 rounded text-sm"
                              >
                                ×
                              </button>
                            </div>
                            <button
                              @click="tambahOpsiTambah(idx)"
                              class="text-sm text-[#6444C6] font-medium hover:underline w-full text-left"
                            >
                              + Tambah opsi
                            </button>
                          </div>
                        </div>

                        <!-- Hapus Jawaban -->
                        <button
                          v-if="formJawabanList.length > 1"
                          @click="hapusJawaban(idx)"
                          class="w-full py-1.5 text-sm font-medium text-red-500 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          Hapus Jawaban Ini
                        </button>
                      </div>

                      <!-- Tombol Tambah Jawaban -->
                      <button
                        @click="tambahJawaban"
                        class="w-full py-2 text-sm text-[#6444C6] font-medium border border-[#6444C6] rounded-lg hover:bg-purple-50"
                      >
                        + Tambah Jawaban Lain
                      </button>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-3 pt-3">
                    <button
                      @click="closeTambahPertanyaan"
                      class="flex-1 py-2.5 border border-gray-300 text-black rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      @click="simpanPertanyaan"
                      class="flex-1 py-2.5 bg-[#6444C6] text-white rounded-lg text-sm font-medium hover:bg-[#5c3db8]"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Edit -->
            <div
              v-if="editPertanyaan"
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              @click.self="closeEditPertanyaan"
            >
              <div
                class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg"
              >
                <!-- Header Modal -->
                <div
                  class="flex justify-between items-center p-5 border-b border-gray-200"
                >
                  <h2 class="text-lg font-bold text-black">Edit Pertanyaan</h2>
                  <button
                    @click="closeEditPertanyaan"
                    class="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon class="w-5 h-5 text-black" />
                  </button>
                </div>

                <div class="p-5 space-y-4">
                  <!-- Nama Tabel -->
                  <div>
                    <label class="block text-sm font-semibold text-black mb-2"
                      >Nama Tabel</label
                    >
                    <input
                      type="text"
                      v-model="formEditNamaTabel"
                      placeholder="Contoh: tbl_data_peserta"
                      class="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                    />
                  </div>

                  <!-- Label Pertanyaan -->
                  <div>
                    <label class="block text-sm font-semibold text-black mb-2"
                      >Label Pertanyaan</label
                    >
                    <input
                      type="text"
                      v-model="formEditLabel"
                      placeholder="Contoh: Tanggal Kegiatan"
                      class="w-full p-3 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                    />
                  </div>

                  <!-- Daftar Jawaban -->
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label class="block text-sm font-semibold text-black mb-3"
                      >Daftar Jawaban</label
                    >
                    
                    <div class="space-y-4">
                      <div
                        v-for="(jawaban, idx) in formEditJawabanList"
                        :key="idx"
                        class="border border-gray-300 rounded-lg p-3 bg-white space-y-3"
                      >
                        <!-- Label Jawaban (hanya jika bukan multiple) -->
                        <div v-if="jawaban.tipe !== 'multiple'">
                          <label class="block text-xs font-semibold text-black mb-1"
                            >Label Jawaban</label
                          >
                          <input
                            type="text"
                            v-model="jawaban.label"
                            :placeholder="'Jawaban ' + (idx + 1) + ' (contoh: Tanggal Mulai)'"
                            class="w-full p-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-[#6444C6]"
                          />
                        </div>

                        <!-- Tipe Jawaban -->
                        <div class="relative">
                          <label class="block text-xs font-semibold text-black mb-1"
                            >Tipe Jawaban</label
                          >
                          <select
                            v-model="jawaban.tipe"
                            @change="() => {
                              if (jawaban.tipe === 'multiple' && !formEditPilihanList[jawaban.id]) {
                                formEditPilihanList[jawaban.id] = [''];
                              }
                            }"
                            class="w-full p-2 border border-gray-300 rounded-lg text-sm text-black appearance-none focus:outline-none focus:border-[#6444C6]"
                          >
                            <option value="text">Input Text</option>
                            <option value="multiple">Pilihan Ganda</option>
                            <option value="date">Tanggal</option>
                          </select>
                          <ChevronDownIcon
                            class="absolute right-2 top-8 w-4 h-4 text-black pointer-events-none"
                          />
                        </div>

                        <!-- Multiple Choice Options -->
                        <div
                          v-if="jawaban.tipe === 'multiple'"
                          class="bg-gray-100 rounded p-2 border border-gray-300"
                        >
                          <label class="block text-xs font-semibold text-black mb-2"
                            >Opsi Pilihan</label
                          >
                          <div class="space-y-2">
                            <div
                              v-for="(opt, i) in (formEditPilihanList[jawaban.id] || [])"
                              :key="i"
                              class="flex gap-2"
                            >
                              <input
                                type="text"
                                v-model="formEditPilihanList[jawaban.id][i]"
                                :placeholder="'Opsi ' + (i + 1)"
                                class="flex-1 p-1.5 border border-gray-300 rounded text-sm text-black focus:outline-none focus:border-[#6444C6]"
                              />
                              <button
                                v-if="formEditPilihanList[jawaban.id].length > 1"
                                @click="formEditPilihanList[jawaban.id].splice(i, 1)"
                                class="px-2 text-red-500 hover:bg-red-50 rounded text-sm"
                              >
                                ×
                              </button>
                            </div>
                            <button
                              @click="tambahOpsiEdit(jawaban.id)"
                              class="text-sm text-[#6444C6] font-medium hover:underline w-full text-left"
                            >
                              + Tambah opsi
                            </button>
                          </div>
                        </div>

                        <!-- Hapus Jawaban -->
                        <button
                          v-if="formEditJawabanList.length > 1"
                          @click="hapusJawaban(idx)"
                          class="w-full py-1.5 text-sm font-medium text-red-500 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          Hapus Jawaban Ini
                        </button>
                      </div>

                      <!-- Tombol Tambah Jawaban -->
                      <button
                        @click="tambahJawabanEdit"
                        class="w-full py-2 text-sm text-[#6444C6] font-medium border border-[#6444C6] rounded-lg hover:bg-purple-50"
                      >
                        + Tambah Jawaban Lain
                      </button>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-3 pt-3">
                    <button
                      @click="closeEditPertanyaan"
                      class="flex-1 py-2.5 border border-gray-300 text-black rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      @click="simpanEditPertanyaan"
                      class="flex-1 py-2.5 bg-[#6444C6] text-white rounded-lg text-sm font-medium hover:bg-[#5c3db8]"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
