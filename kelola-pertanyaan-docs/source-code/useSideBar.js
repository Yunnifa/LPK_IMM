// Composable untuk sidebar state management
// File asli: frontend-lpk/src/composables/useSideBar.js

import { ref, provide, inject } from 'vue'

// Symbol untuk injection key
const SidebarStateKey = Symbol('SidebarState')

/**
 * Composable untuk manage sidebar state
 * Gunakan di root component (dashboard, data-monitor, dll)
 */
export function useSidebarProvider() {
  const isSidebarOpen = ref(false)
  
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }
  
  const closeSidebar = () => {
    isSidebarOpen.value = false
  }
  
  const openSidebar = () => {
    isSidebarOpen.value = true
  }
  
  // Provide to children
  provide(SidebarStateKey, {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  })
  
  // Provide legacy support for header
  provide('toggleMobileMenu', toggleSidebar)
  
  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  }
}

/**
 * Composable untuk consume sidebar state
 * Gunakan di child components yang butuh akses ke sidebar state
 */
export function useSidebar() {
  const state = inject(SidebarStateKey, null)
  
  if (!state) {
    console.warn('useSidebar() dipanggil tanpa useSidebarProvider() di parent')
    return {
      isSidebarOpen: ref(false),
      toggleSidebar: () => {},
      closeSidebar: () => {},
      openSidebar: () => {}
    }
  }
  
  return state
}
