import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'
import { constantRoutes, asyncRoutes, filterRoutesByRole } from './routes'
import type { AppRouteRecordRaw } from './routes'

// 创建调试函数
const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.MODE !== 'production') {
      console.log('[Router Debug]', ...args)
    }
  },
  error: (...args: any[]) => {
    console.error('[Router Error]', ...args)
  },
  dumpRoutes: () => {
    const routes = router.getRoutes()
    debug.log('当前所有路由:', routes.map(r => ({
      path: r.path,
      name: r.name,
      matched: r.path === router.currentRoute.value.path,
      meta: r.meta
    })))
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  debug.log(`路由导航：从 ${from.path} 到 ${to.path}`)
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 分销系统管理后台`
  }

  debug.log('当前用户状态:', {
    token: !!userStore.token,
    userInfo: !!userStore.userInfo,
    roles: userStore.roles,
    routesLoaded: userStore.routesLoaded
  })

  // 检查根路径"/"和处理需要登录的路径
  if (to.path === '/' && !userStore.token) {
    debug.log('访问根路径，但无token，重定向到登录页')
    next('/login')
    return
  }

  // 不需要登录的页面直接放行
  if (!to.meta?.requiresAuth) {
    debug.log('访问不需要认证的页面，直接放行')
    next()
    return
  }

  // 检查是否有token
  if (!userStore.token) {
    debug.log('访问需要认证的页面，但无token，重定向到登录页')
    next('/login')
    return
  }

  try {
    // 如果用户信息未加载且有token，先获取用户信息
    if (!userStore.userInfo && userStore.token) {
      debug.log('有token但无用户信息，获取用户信息')
      await userStore.getUserInfo()
    }

    // 确保动态路由已添加 (每次路由导航都检查，确保路由不会丢失)
    if (userStore.token && (!userStore.routesLoaded || !router.hasRoute('Layout'))) {
      debug.log('添加/确保动态路由存在', userStore.roles)
      const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
      debug.log('可访问的路由', accessibleRoutes.map(r => r.path))
      
      // 先检查路由是否已存在，避免重复添加
      accessibleRoutes.forEach(route => {
        if (route.name && !router.hasRoute(route.name)) {
          debug.log('添加路由:', route.path)
          router.addRoute(route)
        } else {
          debug.log('路由已存在或无名称:', route.path)
        }
      })
      userStore.$patch({ routesLoaded: true })
      
      // 输出所有已注册路由
      debug.dumpRoutes()

      // 如果是直接访问的路由，需要刷新以获取正确的路由信息
      if (to.name === undefined || to.name === null) {
        debug.log('重新导航以确保路由信息正确', to.fullPath)
        next({ path: to.fullPath, replace: true })
        return
      }
    }

    // 检查用户角色权限
    if (to.meta?.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0 && userStore.userInfo?.role) {
      const hasPermission = userStore.hasPermission(to.meta.roles)
      if (!hasPermission) {
        debug.error('用户无权限访问此页面', to.path, userStore.userInfo.role, to.meta.roles)
        next('/404')
        return
      }
    }

    // 如果访问根路径且已登录，重定向到dashboard
    if (to.path === '/' && userStore.token) {
      debug.log('访问根路径且已登录，重定向到dashboard')
      
      // 检查Layout路由是否已注册
      const hasRoute = router.hasRoute('Layout')
      debug.log('Layout路由是否已注册:', hasRoute)
      
      if (!hasRoute) {
        debug.log('Layout路由未注册，尝试重新添加动态路由')
        const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
        accessibleRoutes.forEach(route => {
          if (route.name && !router.hasRoute(route.name)) {
            debug.log('添加路由:', route.path)
            router.addRoute(route)
          }
        })
      }
      
      debug.dumpRoutes()
      
      // 尝试导航到dashboard
      next('/dashboard')
      return
    }

    // 路由匹配之前，打印当前要访问的路径和匹配情况
    const matchedRoute = router.resolve(to.path)
    debug.log('路由匹配结果:', {
      path: to.path,
      matched: matchedRoute.matched.map(m => m.path),
      name: matchedRoute.name
    })

    // 如果路由匹配失败但应该存在，尝试重新添加路由
    if (matchedRoute.matched.length === 0 && to.path !== '/404') {
      debug.log('路由匹配失败，尝试重新添加路由:', to.path)
      // 添加所有动态路由后再次尝试匹配
      const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
      accessibleRoutes.forEach(route => {
        if (route.name && !router.hasRoute(route.name)) {
          debug.log('添加丢失的路由:', route.path)
          router.addRoute(route)
        }
      })
      
      debug.dumpRoutes()
      
      // 重新尝试导航
      next({ path: to.fullPath, replace: true })
      return
    }

    debug.log('通过所有检查，允许访问:', to.path)
    next()
  } catch (error) {
    debug.error('路由守卫错误:', error)
    // 清除token并跳转登录
    userStore.logout()
    next('/login')
  }
})

// 后置钩子，记录导航是否完成
router.afterEach((to, from) => {
  debug.log(`路由导航完成: ${from.path} -> ${to.path}`)
})

// 路由报错钩子
router.onError((error) => {
  debug.error('路由错误:', error)
})

// 重置路由（用于登出）
export function resetRouter() {
  // 获取当前所有路由名称
  const routeNames = router.getRoutes().map(route => route.name).filter(Boolean) as string[]
  
  // 移除所有动态添加的路由
  routeNames.forEach(name => {
    if (name && name !== 'Login' && name !== '404') {
      try {
        router.removeRoute(name as string)
      } catch (error) {
        debug.error(`Failed to remove route ${name}:`, error)
      }
    }
  })
  
  debug.log('路由重置完成')
}

export default router