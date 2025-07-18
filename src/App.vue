<template>
  <Toaster />
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toaster } from '@/components/ui/toast'

const router = useRouter()

// 在组件挂载后检查是否需要重定向
onMounted(() => {
  setTimeout(() => {
    // 从sessionStorage获取保存的路径
    const redirectPath = sessionStorage.getItem('redirect_path')
    const token = localStorage.getItem('token')
    const currentPath = router.currentRoute.value.path
    
    console.log('[App] 初始化路径检查:', { 
      currentPath, 
      redirectPath,
      hasToken: !!token,
      routes: router.getRoutes().length
    })
    
    // 确保刷新后路由状态正确
    if (token && currentPath === '/404' && router.hasRoute('Dashboard')) {
      console.log('[App] 检测到路由错误状态，重定向到dashboard')
      window.location.replace('/dashboard')
      return
    }
    
    // 如果当前在根路径且已登录，则重定向到dashboard
    if (currentPath === '/' && token) {
      console.log('[App] 已登录用户访问根路径，重定向到dashboard')
      router.replace('/dashboard')
      return
    }
    
    if (redirectPath) {
      console.log('[App] 检测到重定向路径:', redirectPath)
      // 清除重定向信息，防止循环重定向
      sessionStorage.removeItem('redirect_path')
      
      // 如果有token，尝试导航到保存的路径
      if (token) {
        // 如果是根路径，导航到dashboard
        if (redirectPath === '/' || redirectPath === '') {
          console.log('[App] 重定向到默认路径: /dashboard')
          // 使用window.location.replace确保完全刷新
          window.location.replace('/dashboard')
        } else {
          // 导航到保存的路径，使用完整刷新确保路由注册正确
          console.log('[App] 重定向到:', redirectPath)
          window.location.replace(redirectPath)
        }
      } else {
        // 如果没有token，导航到登录页
        console.log('[App] 未检测到token，重定向到登录页')
        router.replace('/login')
      }
    }
  }, 100); // 延迟执行，确保路由已注册
})
</script>
