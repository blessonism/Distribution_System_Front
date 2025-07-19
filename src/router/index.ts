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
  dumpRoutes: (routerInstance?: any) => {
    // 确保有可用的router实例
    const routerToUse = routerInstance || (typeof router !== 'undefined' ? router : null)
    if (!routerToUse) {
      console.error('[Router Error] 尝试输出路由，但router实例不可用')
      return
    }
    
    try {
      const routes = routerToUse.getRoutes()
      debug.log('当前所有路由:', routes.map((r: any) => ({
      path: r.path,
      name: r.name,
        matched: r.path === routerToUse.currentRoute?.value?.path,
      meta: r.meta
    })))
    } catch (error) {
      console.error('[Router Error] 输出路由信息失败:', error)
    }
  }
}

// 从localStorage中获取routesLoaded状态
const localRoutesLoaded = localStorage.getItem('routesLoaded') === 'true'

// 先创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 增强版根据本地存储的角色预加载路由
function addDynamicRoutes(routerInstance = router) {
  try {
    // 检查token和用户角色
    const token = localStorage.getItem('token')
    const rolesJson = localStorage.getItem('userRoles')
    
    if (!token || !rolesJson) {
      debug.log('无token或用户角色，跳过路由预加载')
      return false
    }
    
    const roles = JSON.parse(rolesJson)
    debug.log('从本地存储预加载路由，用户角色:', roles)
    
    // 获取当前路由状态
    const hasDashboardRoute = routerInstance.hasRoute('Dashboard')
    debug.log('Dashboard路由是否存在:', hasDashboardRoute)
    
    // 过滤可访问的路由
    const accessibleRoutes = filterRoutesByRole(asyncRoutes, roles)
    debug.log('要添加的动态路由数量:', accessibleRoutes.length)
    
    // 添加动态路由
    accessibleRoutes.forEach(route => {
      // 如果路由已存在，先移除再添加
      if (route.name && routerInstance.hasRoute(route.name)) {
        debug.log('移除已存在的路由:', route.path, route.name)
        routerInstance.removeRoute(route.name)
      }
      
      debug.log('预加载添加路由:', route.path, route.name)
      routerInstance.addRoute(route)
    })
    
    // 记录路由已加载
    localStorage.setItem('routesLoaded', 'true')
    
    // 输出所有已添加的路由
    debug.dumpRoutes(routerInstance)
    
    return true
  } catch (error) {
    debug.error('预加载路由失败:', error)
    return false
  }
}

// 强制添加路由 - 无论如何都添加路由，但要在创建router实例之后
// addDynamicRoutes(router) // 移除此处的早期路由加载，逻辑统一到 beforeEach 中

// 路由守卫
router.beforeEach(async (to, from, next) => {
  debug.log(`路由导航：从 ${from.path} 到 ${to.path}`)
  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 分销系统管理后台`
  }

  const token = userStore.token
  // 使用 hasRoute 检查核心动态路由（如Dashboard）是否存在，作为路由是否已加载的判断依据
  const routesLoaded = router.hasRoute('Dashboard')

  if (token) {
    // 如果用户已登录
    if (to.path === '/login') {
      // 如果已登录且目标是登录页，重定向到仪表盘
      debug.log('用户已登录，访问登录页，重定向到 /dashboard')
      next({ path: '/dashboard' })
    } else {
      // 检查动态路由是否已加载
      if (routesLoaded) {
        // 路由已加载，正常放行
        debug.log('路由已加载，正常导航')
        next()
      } else {
        try {
          // 路由未加载，开始获取用户信息、角色和权限
          debug.log('路由未加载，开始获取用户信息和权限...')
          await userStore.getUserInfo()

          // 根据角色动态生成可访问的路由
          const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles)
          accessibleRoutes.forEach(route => {
            // 确保不会重复添加
            if (route.name && !router.hasRoute(route.name)) {
              router.addRoute(route)
            }
          })
          debug.log('动态路由添加完毕.')

          // 标记路由已加载
          userStore.$patch({ routesLoaded: true })
          
          // 使用 replace: true, 这样导航就不会留下历史记录
          // 确保addRoute()完成后，再重新导航到目标页面
          debug.log('路由添加完成，重新导航到:', to.fullPath)
          next({ ...to, replace: true })
        } catch (error) {
          // 获取用户信息失败（例如token过期），重置状态并跳转到登录页
          debug.error('获取用户信息失败:', error)
          await userStore.$reset()
          next('/login')
        }
      }
    }
  } else {
    // 用户未登录
    if (to.meta.requiresAuth) {
      // 如果目标页面需要认证，重定向到登录页
      debug.log(`访问受限页面 ${to.path}，重定向到登录页`)
      next('/login')
    } else {
      // 不需要认证的页面，直接放行
      debug.log(`访问公共页面 ${to.path}，直接放行`)
      next()
    }
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
  debug.log('开始重置路由，当前路由:', routeNames)
  
  // 移除所有动态添加的路由 - 特别关注Dashboard, Agent, User等关键路由
  const criticalRoutes = ['Dashboard', 'Agent', 'User', 'Lead', 'Deal', 'Promotion', 'Settings']
  
  // 先移除关键路由
  criticalRoutes.forEach(name => {
    if (router.hasRoute(name)) {
      try {
        debug.log(`移除关键路由: ${name}`)
        router.removeRoute(name)
      } catch (error) {
        debug.error(`移除关键路由失败 ${name}:`, error)
      }
    }
  })
  
  // 再移除其它动态路由
  routeNames.forEach(name => {
    const routeName = name as string
    if (routeName && routeName !== 'Login' && routeName !== '404' && !criticalRoutes.includes(routeName)) {
      try {
        debug.log(`移除动态路由: ${routeName}`)
        router.removeRoute(routeName)
      } catch (error) {
        debug.error(`移除动态路由失败 ${routeName}:`, error)
      }
    }
  })
  
  // 清除本地存储的路由状态
  localStorage.removeItem('routesLoaded')
  localStorage.removeItem('userRoles')
  
  // 再次检查，确保所有动态路由都被移除
  const remainingRoutes = router.getRoutes().map(route => route.name).filter(Boolean)
  debug.log('路由重置完成，剩余路由:', remainingRoutes)
}

export default router