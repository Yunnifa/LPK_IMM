<script setup>
import { ref, onMounted, watch, computed, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { UserCircleIcon, Bars3Icon } from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();
const currentDate = ref("");
const adminName = ref("Naufal Andrian");

// Inject function dari parent component (Aside)
const toggleMobileMenu = inject("toggleMobileMenu", () => {});

const goToProfile = () => {
  router.push("/profil-admin");
};

// Handle hamburger click
const handleHamburgerClick = () => {
  if (toggleMobileMenu) {
    toggleMobileMenu();
  }
};

// Map route paths ke header titles
const routeToHeaderMap = {
  "/data-monitor": "Data Monitor Layanan Permintaan Kendaraan",
  "/kelola-pertanyaan": "Kelola Pertanyaan Layanan Permintaan Kendaraan",
  "/departemen": "Master Data Departemen",
  "/pengguna": "Master Data Pengguna",
  "/profil": "Profil",
};

const headerTitle = computed(() => {
  const currentPath = route.path;
  let title = routeToHeaderMap[currentPath];

  // Jika route tidak langsung match (misal karena parameter), cek pattern
  if (!title) {
    if (currentPath.match(/^\/edit-data-pengguna-pt\//)) {
      title = "Edit Data Pengguna - PT.IMM";
    } else if (currentPath.match(/^\/edit-data-pengguna-travel\//)) {
      title = "Edit Data Pengguna - Travel";
    } else if (currentPath.match(/^\/edit-unit-pt\//)) {
      title = "Edit Unit Kendaraan - PT.IMM";
    } else if (currentPath.match(/^\/edit-unit-travel\//)) {
      title = "Edit Unit Kendaraan - Travel";
    } else {
      title = "Data Monitor Layanan Permintaan Kendaraan"; // Default title
    }
  }

  return title;
});

onMounted(() => {
  // Format tanggal hari ini
  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  currentDate.value = today.toLocaleDateString("id-ID", options);
});
</script>

<template>
  <div
    class="bg-white border-b border-gray-200 px-2.5 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm"
  >
    <!-- Left Section - Hamburger & Title -->
    <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <!-- Hamburger Menu Button (Mobile) -->
      <button
        @click="handleHamburgerClick"
        class="lg:hidden shrink-0 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bars3Icon class="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
      </button>

      <!-- Title & Date -->
      <div class="flex flex-col min-w-0">
        <h1
          class="text-xs sm:text-sm md:text-base lg:text-xl font-bold text-[#523E95] truncate line-clamp-1"
        >
          {{ headerTitle }}
        </h1>
        <p class="text-xs text-gray-500 hidden sm:block">{{ currentDate }}</p>
      </div>
    </div>

    <!-- Right Section - Admin Info -->
    <div class="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
      <!-- Admin Info (Hidden on mobile and small tablet) -->
      <div class="hidden md:block text-right">
        <p class="text-xs lg:text-sm font-semibold text-gray-800">
          {{ adminName }}
        </p>
        <p class="text-xs text-gray-500">Administrator</p>
      </div>

      <!-- User Circle Icon Button -->
      <button
        @click="goToProfile"
        class="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-indigo-100 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors duration-200 cursor-pointer shrink-0"
      >
        <UserCircleIcon
          class="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 text-black hover:text-indigo-600 transition-colors duration-200"
        />
      </button>
    </div>
  </div>
</template>
