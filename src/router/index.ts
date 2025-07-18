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
addDynamicRoutes(router)

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
    // 特殊处理：如果用户访问404页面但已登录，尝试重定向到dashboard
    if (to.path === '/404' && userStore.token) {
      const hasDashboardRoute = router.hasRoute('Dashboard')
      debug.log('已登录用户访问404页面，检查Dashboard路由:', hasDashboardRoute)
      if (hasDashboardRoute) {
        debug.log('已登录用户从404重定向到dashboard')
        next('/dashboard')
        return
      }
    }
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

  // 特殊处理Dashboard路由
  if (to.path === '/dashboard') {
    debug.log('访问仪表盘路由，特殊处理')
    // 确保用户已登录
    if (!userStore.userInfo && userStore.token) {
      debug.log('有token但无用户信息，获取用户信息')
      await userStore.getUserInfo()
    }
    next()
    return
  }

  try {
    // 如果用户信息未加载且有token，先获取用户信息
    if (!userStore.userInfo && userStore.token) {
      debug.log('有token但无用户信息，获取用户信息')
      await userStore.getUserInfo()
      
      // 将角色保存到localStorage，用于页面刷新时路由重建
      localStorage.setItem('userRoles', JSON.stringify(userStore.roles))
    }

    // 确保动态路由已添加
    if (userStore.token) {
      // 每次路由导航时，强制检查Dashboard路由是否存在
      const hasDashboardRoute = router.hasRoute('Dashboard')
      debug.log('Dashboard路由是否已存在:', hasDashboardRoute)
      
      // 检查所有主要路由是否已添加
      const hasAgentRoute = router.hasRoute('Agent')
      const hasUserRoute = router.hasRoute('User')
      
      // 始终重新添加动态路由，确保路由表完整
      // 解决直接地址栏输入问题
        debug.log('添加/确保动态路由存在', userStore.roles)
        const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
        debug.log('可访问的路由', accessibleRoutes.map(r => r.path))
        
      let routesAdded = false
      
      // 如果关键路由不存在，添加所有路由
      if (!hasDashboardRoute || !hasAgentRoute || !hasUserRoute || !userStore.routesLoaded) {
        // 先检查路由是否已存在，避免重复添加
        accessibleRoutes.forEach(route => {
          if (route.name) {
            // 如果路由已存在，先移除
            if (router.hasRoute(route.name)) {
              debug.log('移除已存在的路由:', route.path, route.name)
              router.removeRoute(route.name)
            }
            
            debug.log('添加路由:', route.path, route.name)
            router.addRoute(route)
            routesAdded = true
          } else {
            debug.log('路由没有名称，无法添加:', route.path)
          }
        })
        
        // 更新状态并保存到localStorage
        userStore.$patch({ routesLoaded: true })
        localStorage.setItem('routesLoaded', 'true')
        
        // 输出所有已注册路由
        debug.dumpRoutes(router)
      }

      // 如果添加了新路由，需要重新导航以确保路由信息正确
      if (routesAdded) {
        debug.log('添加了新路由，重新导航以确保路由信息正确', to.fullPath)
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
      
      debug.dumpRoutes(router)
      
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