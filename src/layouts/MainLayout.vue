<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 侧边栏 -->
    <aside 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">DS</span>
          </div>
          <span class="text-lg font-semibold text-gray-900">分销系统</span>
        </div>
        <button 
          @click="toggleSidebar" 
          class="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div v-for="route in menuRoutes" :key="route.path">
          <!-- 单级菜单 -->
          <router-link
            v-if="!route.children?.length"
            :to="route.path"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              $route.path === route.path
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <component 
              :is="getIcon(route.meta?.icon)" 
              class="w-5 h-5 mr-3"
            />
            {{ route.meta?.title }}
          </router-link>

          <!-- 多级菜单 -->
          <div v-else>
            <button
              @click="toggleSubmenu(String(route.name))"
              class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="[
                isActiveParent(route)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              <div class="flex items-center">
                <component 
                  :is="getIcon(route.meta?.icon)" 
                  class="w-5 h-5 mr-3"
                />
                {{ route.meta?.title }}
              </div>
              <svg 
                class="w-4 h-4 transition-transform" 
                :class="{ 'rotate-90': route.name && expandedMenus.includes(String(route.name)) }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div 
              v-show="expandedMenus.includes(String(route.name))" 
              class="mt-1 ml-8 space-y-1"
            >
              <router-link
                v-for="child in route.children"
                :key="child.path"
                :to="child.path"
                class="block px-3 py-2 text-sm rounded-md transition-colors"
                :class="[
                  $route.path === child.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                {{ child.meta?.title }}
              </router-link>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <!-- 移动端遮罩 -->
    <div 
      v-if="sidebarOpen" 
      @click="toggleSidebar"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
    ></div>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航 -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center">
            <button 
              @click="toggleSidebar" 
              class="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 class="ml-2 text-xl font-semibold text-gray-900">{{ pageTitle }}</h1>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 通知 -->
            <button class="p-2 rounded-full hover:bg-gray-100">
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <!-- 用户信息 -->
            <div class="relative">
              <button 
                @click="toggleUserMenu" 
                class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
              >
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-700">
                    {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                  </span>
                </div>
                <span class="hidden md:block text-sm font-medium text-gray-700">
                  {{ userStore.userInfo?.username || '用户' }}
                </span>
              </button>

              <!-- 用户菜单 -->
              <div 
                v-if="userMenuOpen" 
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
              >
                <router-link 
                  to="/profile" 
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  个人设置
                </router-link>
                <button 
                  @click="handleLogout" 
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <div class="p-4 sm:p-6 lg:p-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { asyncRoutes } from '@/router/routes'
import type { AppRouteRecordRaw } from '@/router/routes'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const expandedMenus = ref<string[]>([])

// 获取有权限的菜单路由
const menuRoutes = computed(() => {
  const accessibleRoutes = asyncRoutes.filter(route => {
    if (!route.meta?.roles) return true
    return route.meta.roles.some(role => userStore.hasPermission([role]))
  })
  return accessibleRoutes
})

// 页面标题
const pageTitle = computed(() => {
  const matched = route.matched
  const lastMatched = matched[matched.length - 1]
  return lastMatched?.meta?.title || '管理后台'
})

// 获取图标组件
const getIcon = (icon?: string) => {
  // 这里返回实际的图标组件
  // 暂时使用占位符
  return 'div'
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 切换用户菜单
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

// 切换子菜单
const toggleSubmenu = (name: string) => {
  const index = expandedMenus.value.indexOf(name)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(name)
  }
}

// 检查是否是活跃父菜单
const isActiveParent = (route: AppRouteRecordRaw) => {
  return route.children?.some(child => route.path === child.path) || false
}

// 退出登录
const handleLogout = async () => {
  userStore.logout()
  await router.push('/login')
  userMenuOpen.value = false
}

// 点击外部关闭用户菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 默认展开当前路由的父菜单
onMounted(() => {
  const matched = route.matched
  matched.forEach((matchedRoute) => {
    if (matchedRoute.name) {
      expandedMenus.value.push(matchedRoute.name as string)
    }
  })
})
</script>

<style scoped>
.router-link-active {
  @apply bg-blue-50 text-blue-600;
}
</style>