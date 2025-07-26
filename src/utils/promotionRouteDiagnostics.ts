/**
 * 推广管理模块路由诊断工具
 * 专门用于诊断推广审核和我的任务页面的访问问题
 */

import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

export interface PromotionRouteDiagnostic {
  routeName: string
  path: string
  exists: boolean
  hasPermission: boolean
  userRoles: string[]
  requiredRoles: string[]
  componentPath: string
  error?: string
}

export interface DiagnosticReport {
  timestamp: string
  userInfo: {
    isLoggedIn: boolean
    token: string | null
    userInfo: any
    roles: string[]
    routesLoaded: boolean
  }
  routes: PromotionRouteDiagnostic[]
  recommendations: string[]
}

export function usePromotionRouteDiagnostics() {
  const router = useRouter()
  const userStore = useUserStore()

  /**
   * 推广管理相关路由配置
   */
  const promotionRoutes = [
    {
      name: 'Promotion',
      path: '/promotion',
      requiredRoles: ['super_admin', 'director', 'leader', 'agent'],
      componentPath: '@/layouts/MainLayout.vue'
    },
    {
      name: 'PromotionAudit',
      path: '/promotion/audit',
      requiredRoles: ['super_admin', 'director', 'leader'],
      componentPath: '@/views/promotion/AuditList.vue'
    },
    {
      name: 'PromotionMyTasks',
      path: '/promotion/my-tasks',
      requiredRoles: ['super_admin', 'director', 'leader', 'agent'],
      componentPath: '@/views/promotion/TaskList.vue'
    },
    {
      name: 'PromotionTaskSubmit',
      path: '/promotion/submit',
      requiredRoles: ['super_admin', 'director', 'leader', 'agent'],
      componentPath: '@/views/promotion/TaskSubmit.vue'
    },
    {
      name: 'PromotionTaskDetail',
      path: '/promotion/task/:id',
      requiredRoles: ['super_admin', 'director', 'leader', 'agent'],
      componentPath: '@/views/promotion/TaskDetail.vue'
    }
  ]

  /**
   * 检查单个路由
   */
  const checkRoute = (routeConfig: any): PromotionRouteDiagnostic => {
    const exists = router.hasRoute(routeConfig.name)
    const userRoles = userStore.roles || []
    const hasPermission = routeConfig.requiredRoles.some((role: string) => userRoles.includes(role))

    let error: string | undefined
    if (!exists) {
      error = '路由不存在，可能是动态路由未加载'
    } else if (!hasPermission) {
      error = `权限不足，需要角色: ${routeConfig.requiredRoles.join(', ')}`
    }

    return {
      routeName: routeConfig.name,
      path: routeConfig.path,
      exists,
      hasPermission,
      userRoles,
      requiredRoles: routeConfig.requiredRoles,
      componentPath: routeConfig.componentPath,
      error
    }
  }

  /**
   * 生成诊断报告
   */
  const generateReport = (): DiagnosticReport => {
    const userInfo = {
      isLoggedIn: userStore.isLoggedIn,
      token: userStore.token,
      userInfo: userStore.userInfo,
      roles: userStore.roles,
      routesLoaded: userStore.routesLoaded
    }

    const routes = promotionRoutes.map(checkRoute)
    const recommendations = generateRecommendations(userInfo, routes)

    return {
      timestamp: new Date().toISOString(),
      userInfo,
      routes,
      recommendations
    }
  }

  /**
   * 生成修复建议
   */
  const generateRecommendations = (userInfo: any, routes: PromotionRouteDiagnostic[]): string[] => {
    const recommendations: string[] = []

    // 检查登录状态
    if (!userInfo.isLoggedIn) {
      recommendations.push('用户未登录，请先登录')
      return recommendations
    }

    // 检查路由加载状态
    if (!userInfo.routesLoaded) {
      recommendations.push('动态路由未加载，请刷新页面或重新登录')
    }

    // 检查用户角色
    if (!userInfo.roles || userInfo.roles.length === 0) {
      recommendations.push('用户角色信息缺失，请重新登录')
    }

    // 检查具体路由问题
    const problemRoutes = routes.filter(route => route.error)
    if (problemRoutes.length > 0) {
      problemRoutes.forEach(route => {
        if (!route.exists) {
          recommendations.push(`路由 ${route.routeName} 不存在，检查动态路由加载`)
        } else if (!route.hasPermission) {
          recommendations.push(`访问 ${route.routeName} 权限不足，当前角色: ${route.userRoles.join(', ')}，需要: ${route.requiredRoles.join(', ')}`)
        }
      })
    }

    // 检查组件文件
    recommendations.push('检查组件文件是否存在: src/views/promotion/AuditList.vue 和 src/views/promotion/TaskList.vue')

    // 检查API接口
    recommendations.push('检查浏览器控制台是否有API请求错误')

    return recommendations
  }

  /**
   * 在控制台打印诊断报告
   */
  const printReport = () => {
    const report = generateReport()
    
    console.group('🔍 推广管理模块路由诊断报告')
    console.log('⏰ 诊断时间:', report.timestamp)
    
    console.group('👤 用户信息')
    console.log('登录状态:', report.userInfo.isLoggedIn ? '✅ 已登录' : '❌ 未登录')
    console.log('Token:', report.userInfo.token ? '✅ 存在' : '❌ 不存在')
    console.log('用户角色:', report.userInfo.roles)
    console.log('路由加载状态:', report.userInfo.routesLoaded ? '✅ 已加载' : '❌ 未加载')
    console.log('用户详情:', report.userInfo.userInfo)
    console.groupEnd()

    console.group('🛣️ 路由检查结果')
    report.routes.forEach(route => {
      const status = route.exists && route.hasPermission ? '✅' : '❌'
      console.log(`${status} ${route.routeName} (${route.path})`)
      if (route.error) {
        console.log(`   ❌ 错误: ${route.error}`)
      }
      console.log(`   权限: ${route.hasPermission ? '✅' : '❌'} (需要: ${route.requiredRoles.join(', ')})`)
      console.log(`   存在: ${route.exists ? '✅' : '❌'}`)
    })
    console.groupEnd()

    console.group('💡 修复建议')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
    console.groupEnd()

    console.groupEnd()

    return report
  }

  /**
   * 尝试修复常见问题
   */
  const attemptFix = async () => {
    console.log('🔧 尝试自动修复...')
    
    try {
      // 1. 重新获取用户信息
      if (userStore.token && !userStore.routesLoaded) {
        console.log('重新获取用户信息...')
        await userStore.getUserInfo()
      }

      // 2. 检查路由是否已加载
      const report = generateReport()
      const missingRoutes = report.routes.filter(route => !route.exists)
      
      if (missingRoutes.length > 0) {
        console.log('发现缺失路由，建议刷新页面重新加载动态路由')
        return {
          success: false,
          message: '需要刷新页面重新加载动态路由'
        }
      }

      console.log('✅ 自动修复完成')
      return {
        success: true,
        message: '问题已修复'
      }
    } catch (error) {
      console.error('❌ 自动修复失败:', error)
      return {
        success: false,
        message: `修复失败: ${error}`
      }
    }
  }

  return {
    generateReport,
    printReport,
    attemptFix,
    checkRoute
  }
}

/**
 * 全局诊断函数，可在浏览器控制台直接调用
 */
export function diagnosePromotionRoutes() {
  const diagnostics = usePromotionRouteDiagnostics()
  return diagnostics.printReport()
}

/**
 * 全局修复函数，可在浏览器控制台直接调用
 */
export function fixPromotionRoutes() {
  const diagnostics = usePromotionRouteDiagnostics()
  return diagnostics.attemptFix()
}

// 将诊断函数挂载到全局对象，方便在控制台调用
if (typeof window !== 'undefined') {
  ;(window as any).diagnosePromotionRoutes = diagnosePromotionRoutes
  ;(window as any).fixPromotionRoutes = fixPromotionRoutes
}
