/**
 * 路由诊断工具
 * 用于调试路由问题
 */

import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

export function useRouteDiagnostics() {
  const router = useRouter()
  const userStore = useUserStore()

  /**
   * 检查路由是否存在
   */
  const checkRouteExists = (routeName: string) => {
    return router.hasRoute(routeName)
  }

  /**
   * 获取所有路由信息
   */
  const getAllRoutes = () => {
    return router.getRoutes().map(route => ({
      name: route.name,
      path: route.path,
      meta: route.meta
    }))
  }

  /**
   * 检查用户权限
   */
  const checkUserPermissions = () => {
    return {
      userInfo: userStore.userInfo,
      roles: userStore.roles,
      token: userStore.token,
      routesLoaded: userStore.routesLoaded
    }
  }

  /**
   * 检查特定路由的权限
   */
  const checkRoutePermission = (routeName: string) => {
    const route = router.resolve({ name: routeName })
    const userRoles = userStore.roles
    const routeRoles = route.meta?.roles as string[] | undefined

    return {
      routeExists: router.hasRoute(routeName),
      routeRoles,
      userRoles,
      hasPermission: !routeRoles || routeRoles.some(role => userRoles.includes(role))
    }
  }

  /**
   * 诊断推广模块路由
   */
  const diagnosePromotionRoutes = () => {
    const promotionRoutes = [
      'Promotion',
      'PromotionAudit', 
      'PromotionTaskSubmit',
      'PromotionMyTasks',
      'PromotionTaskDetail'
    ]

    return promotionRoutes.map(routeName => ({
      routeName,
      ...checkRoutePermission(routeName)
    }))
  }

  /**
   * 完整的路由诊断报告
   */
  const generateDiagnosticReport = () => {
    return {
      userInfo: checkUserPermissions(),
      allRoutes: getAllRoutes(),
      promotionRoutes: diagnosePromotionRoutes(),
      timestamp: new Date().toISOString()
    }
  }

  return {
    checkRouteExists,
    getAllRoutes,
    checkUserPermissions,
    checkRoutePermission,
    diagnosePromotionRoutes,
    generateDiagnosticReport
  }
}

/**
 * 在控制台打印路由诊断信息
 */
export function printRouteDiagnostics() {
  const diagnostics = useRouteDiagnostics()
  const report = diagnostics.generateDiagnosticReport()
  
  console.group('🔍 路由诊断报告')
  console.log('📊 用户信息:', report.userInfo)
  console.log('🛣️ 所有路由:', report.allRoutes)
  console.log('🎯 推广模块路由:', report.promotionRoutes)
  console.groupEnd()
  
  return report
}
