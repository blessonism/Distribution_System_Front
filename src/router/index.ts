import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'
import { constantRoutes, asyncRoutes, filterRoutesByRole } from './routes'
import type { AppRouteRecordRaw } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 分销系统管理后台`
  }

  // 不需要登录的页面直接放行
  if (!to.meta?.requiresAuth) {
    next()
    return
  }

  // 检查是否有token
  if (!userStore.token) {
    next('/login')
    return
  }

  try {
    // 如果用户信息未加载且有token，先获取用户信息
    if (!userStore.userInfo && userStore.token) {
      await userStore.getUserInfo()
    }

    // 检查用户角色权限
    if (to.meta?.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0 && userStore.userInfo?.role) {
      const hasPermission = userStore.hasPermission(to.meta.roles)
      if (!hasPermission) {
        next('/404')
        return
      }
    }

    // 如果是首次加载且有token，动态添加路由
    if (!userStore.routesLoaded && userStore.token) {
      const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
      accessibleRoutes.forEach(route => {
        router.addRoute(route)
      })
      userStore.$patch({ routesLoaded: true })
    }

    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    // 清除token并跳转登录
    userStore.logout()
    next('/login')
  }
})

// 重置路由（用于登出）
export function resetRouter() {
  // 获取当前所有路由名称
  const routeNames = router.getRoutes().map(route => route.name).filter(Boolean) as string[]
  
  // 移除所有动态添加的路由
  routeNames.forEach(name => {
    if (name && name !== 'Login' && name !== '404') {
      try {
        router.removeRoute(name)
      } catch (error) {
        console.warn(`Failed to remove route ${name}:`, error)
      }
    }
  })
}

export default router