<script setup>
import { ref, onMounted, watch, inject, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  XMarkIcon,
  ChevronRightIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  BuildingLibraryIcon,
  ChevronDownIcon,
  CheckIcon,
  InboxStackIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentCheckIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();

// Inject isMobileMenuOpen from parent (provided by page components)
const injectedMobileMenuOpen = inject("isMobileMenuOpen", null);
const injectedToggleMobileMenu = inject("toggleMobileMenu", null);

// Use injected value if available, otherwise use local ref
const localMobileMenuOpen = ref(false);
const isMobileMenuOpen = computed({
  get: () => injectedMobileMenuOpen?.value ?? localMobileMenuOpen.value,
  set: (val) => {
    if (injectedMobileMenuOpen) {
      injectedMobileMenuOpen.value = val;
    } else {
      localMobileMenuOpen.value = val;
    }
  },
});

const activeMenu = ref("data-monitor");
const expandedMenu = ref(new Set());
const windowWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024,
);
const selectedLanguage = ref("id");
const isLanguageDropdownOpen = ref(false);

const languages = [
  { code: "id", label: "Indonesia", flag: "/image_asset/b_indonesia.png" },
  { code: "en", label: "English", flag: "/image_asset/b_amerika.png" },
];

// Monitor window resize
const handleWindowResize = () => {
  windowWidth.value = window.innerWidth;
  // Auto close mobile menu when resizing to larger screen
  if (windowWidth.value >= 1024) {
    isMobileMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", handleWindowResize);
});

// Close mobile menu when route changes
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  },
);

const menuItems = [
  { id: "form-lpk", label: "Formulir", icon: DocumentCheckIcon },
  { id: "data-monitor", label: "Data Monitor", icon: ChartBarIcon },
  {
    id: "kelola-pertanyaan",
    label: "Kelola Pertanyaan",
    icon: QuestionMarkCircleIcon,
  },
  {
    id: "master-data",
    label: "Master Data",
    icon: BuildingLibraryIcon,
    children: [
      { id: "departemen", label: "Departemen", icon: InboxStackIcon },
      { id: "pengguna", label: "Pengguna", icon: UserIcon },
    ],
  },
  { id: "profil", label: "Profil", icon: UserCircleIcon },
];

const handleMenuClick = (menuId, hasChildren = false) => {
  activeMenu.value = menuId;

  // Jika menu memiliki children, toggle expand state
  if (hasChildren) {
    if (expandedMenu.value.has(menuId)) {
      expandedMenu.value.delete(menuId);
    } else {
      expandedMenu.value.add(menuId);
    }
    return;
  }

  // Navigasi berdasarkan menu id
  const routes = {
    "form-lpk": "form-lpk",
    "data-monitor": "data-monitor",
    "kelola-pertanyaan": "kelola-pertanyaan",
    departemen: "departemen",
    pengguna: "pengguna",
    profil: "profil",
  };
  if (routes[menuId]) {
    router.push({ name: routes[menuId] });
  }
  isMobileMenuOpen.value = false;
};

const handleLogout = () => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userData");

  // Redirect to login page
  router.push({ name: "login-admin" });
};

// Map route names ke menu ids
const routeToMenuMap = {
  "data-monitor": "data-monitor",
  "kelola-pertanyaan": "kelola-pertanyaan",
  departemen: "departemen",
  pengguna: "pengguna",
  profil: "profil",
};

// Function untuk update activeMenu berdasarkan current route
const updateActiveMenuFromRoute = () => {
  const currentRouteName = route.name;
  let menuId = routeToMenuMap[currentRouteName];

  if (menuId) {
    activeMenu.value = menuId;

    // Jika menu adalah child, expand parent
    if (menuId === "departemen" || menuId === "pengguna") {
      expandedMenu.value.add("master-data");
    }
  }
};

// Update menu saat component mount
onMounted(() => {
  updateActiveMenuFromRoute();
});

// Update menu saat route berubah
watch(
  () => route.path,
  () => {
    updateActiveMenuFromRoute();
  },
);

const handleLanguageSelect = (languageCode) => {
  selectedLanguage.value = languageCode;
  isLanguageDropdownOpen.value = false;
};

const toggleLanguageDropdown = () => {
  isLanguageDropdownOpen.value = !isLanguageDropdownOpen.value;
};
</script>

<template>
  <!-- Mobile Backdrop -->
  <div
    v-if="isMobileMenuOpen"
    @click="isMobileMenuOpen = false"
    class="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-white flex flex-col shadow-lg overflow-y-auto border-r border-gray-200 transition-all duration-300 z-40',
      'w-56 sm:w-60 lg:w-64 lg:translate-x-0',
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Header -->
    <div
      class="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between"
    >
      <img
        src="/image_asset/IMM.svg"
        alt="Logo P2H"
        class="h-8 sm:h-9 w-auto mx-auto"
      />
      <button
        @click="isMobileMenuOpen = false"
        class="lg:hidden p-1.5 hover:bg-gray-100 rounded transition-colors"
      >
        <XMarkIcon class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col gap-1 sm:gap-2 py-3 sm:py-5 px-2 sm:px-3">
      <template v-for="item in menuItems" :key="item.id">
        <!-- Main Menu Item -->
        <button
          :class="[
            'flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 text-left rounded',
            activeMenu === item.id
              ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 pl-3 sm:pl-4'
              : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600',
          ]"
          @click="handleMenuClick(item.id, !!item.children)"
        >
          <component
            v-if="item.icon"
            :is="item.icon"
            :class="[
              'w-4 h-4 sm:w-5 sm:h-5 shrink-0',
              activeMenu === item.id ? 'text-indigo-600' : 'text-gray-600',
            ]"
          />
          <span class="flex-1">{{ item.label }}</span>
          <!-- Chevron Icon for items with children -->
          <ChevronRightIcon
            v-if="item.children"
            :class="[
              'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300',
              expandedMenu.has(item.id) ? 'rotate-90' : '',
            ]"
          />
        </button>

        <!-- Children Menu Items -->
        <template v-if="item.children && expandedMenu.has(item.id)">
          <button
            v-for="child in item.children"
            :key="child.id"
            :class="[
              'flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 text-left rounded ml-4 sm:ml-6 border-l-2 border-transparent',
              activeMenu === child.id
                ? 'bg-indigo-50 text-indigo-600 border-l-indigo-600 pl-3 sm:pl-4'
                : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600',
            ]"
            @click="handleMenuClick(child.id, false)"
          >
            <component
              v-if="child.icon"
              :is="child.icon"
              :class="[
                'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0',
                activeMenu === child.id ? 'text-indigo-600' : 'text-gray-500',
              ]"
            />
            <span class="flex-1">{{ child.label }}</span>
          </button>
        </template>
      </template>
    </nav>

    <!-- Language Dropdown -->
    <div class="px-3 sm:px-5 pb-3 sm:pb-2 relative">
      <button
        @click="toggleLanguageDropdown"
        class="w-full flex items-center gap-2 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-full font-semibold text-xs sm:text-sm hover:bg-blue-100 hover:border-blue-300 transition-all duration-300"
      >
        <img
          :src="languages.find((l) => l.code === selectedLanguage).flag"
          :alt="languages.find((l) => l.code === selectedLanguage).label"
          class="w-5 h-5 sm:w-6 sm:h-6 rounded"
        />
        <span class="flex-1 text-left">{{
          languages.find((l) => l.code === selectedLanguage).label
        }}</span>
        <ChevronDownIcon
          :class="[
            'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300',
            isLanguageDropdownOpen ? 'rotate-180' : '',
          ]"
        />
      </button>

      <!-- Language Dropdown Menu -->
      <div
        v-if="isLanguageDropdownOpen"
        class="absolute bottom-full mb-1 sm:mb-2 left-3 sm:left-5 right-3 sm:right-5 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
      >
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="handleLanguageSelect(lang.code)"
          :class="[
            'w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-left transition-all duration-200',
            selectedLanguage === lang.code
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 border-l-blue-600'
              : 'text-gray-700 hover:bg-gray-50',
          ]"
        >
          <img
            :src="lang.flag"
            :alt="lang.label"
            class="w-5 h-5 sm:w-6 sm:h-6 rounded"
          />
          <span>{{ lang.label }}</span>
          <CheckIcon
            v-if="selectedLanguage === lang.code"
            class="ml-auto w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
          />
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="border-t border-gray-200 px-2 sm:px-3 py-4 sm:py-5">
      <button
        @click="handleLogout"
        class="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 bg-red-50 border border-red-200 text-red-600 rounded font-semibold text-xs sm:text-sm hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-300"
      >
        <ArrowRightStartOnRectangleIcon class="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Logout</span>
      </button>
    </div>
  </aside>

  <!-- Spacer Desktop -->
  <div class="hidden lg:block w-64" />
</template>

<style scoped>
/* Sidebar transitions */
aside {
  transition: transform 0.3s ease-in-out;
}

/* Custom scrollbar */
aside::-webkit-scrollbar {
  width: 8px;
}

aside::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

aside::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
