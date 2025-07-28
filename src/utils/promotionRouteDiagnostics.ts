/**
 * @fileoverview 推广管理模块路由诊断工具模块
 * 专门用于诊断推广审核和我的任务页面的访问问题，提供全面的路由检查和修复建议
 * 包含路由存在性检查、权限验证、用户状态分析和自动修复尝试等核心功能
 * 集成控制台输出和全局调用接口，便于开发和维护人员快速定位问题
 * 
 * @module utils/promotionRouteDiagnostics
 * @author Frontend Team
 * @since 1.0.0
 */

import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

/**
 * 推广路由诊断信息接口
 * 单个路由的详细诊断信息
 * 
 * @interface PromotionRouteDiagnostic
 */
interface PromotionRouteDiagnostic {
  routeName: string
  path: string
  exists: boolean
  hasPermission: boolean
  userRoles: string[]
  requiredRoles: string[]
  componentPath: string
  error?: string
}

/**
 * 诊断报告接口
 * 完整的系统诊断报告包含用户信息、路由状态和修复建议
 * 
 * @interface DiagnosticReport
 */
interface DiagnosticReport {
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

/**
 * 使用推广路由诊断功能
 * 提供完整的推广模块路由诊断能力，包括检查、报告和修复功能
 * 
 * @complexity O(n) - n为推广路由数量，约为5个路由
 * @flow 路由检查 → 权限验证 → 问题诊断 → 修复建议 → 自动修复
 * 
 * @returns 诊断相关的方法集合
 * 
 * @example
 * ```vue
 * <script setup>
 * import { usePromotionRouteDiagnostics } from '@/utils/promotionRouteDiagnostics'
 * 
 * const diagnostics = usePromotionRouteDiagnostics()
 * 
 * // 生成诊断报告
 * const report = diagnostics.generateReport()
 * console.log(report)
 * 
 * // 在控制台打印报告
 * diagnostics.printReport()
 * 
 * // 尝试自动修复
 * const fixResult = await diagnostics.attemptFix()
 * </script>
 * ```
 */
export function usePromotionRouteDiagnostics() {
  const router = useRouter()
  const userStore = useUserStore()

  /**
   * 推广管理相关路由配置
   * 定义所有推广相关路由的名称、路径、权限和组件信息
   * 
   * @constant {Array} promotionRoutes
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
   * 对单个路由进行存在性和权限检查
   * 
   * @complexity O(1) - 常数时间复杂度，路由检查和权限匹配
   * @flow 路由存在性检查 → 用户角色获取 → 权限匹配 → 错误信息生成
   * 
   * @param {any} routeConfig - 路由配置对象
   * @returns {PromotionRouteDiagnostic} 路由诊断结果
   * 
   * @example
   * ```typescript
   * const routeConfig = {
   *   name: 'PromotionAudit',
   *   path: '/promotion/audit',
   *   requiredRoles: ['super_admin', 'director'],
   *   componentPath: '@/views/promotion/AuditList.vue'
   * }
   * 
   * const diagnostic = checkRoute(routeConfig)
   * console.log(diagnostic.exists) // true/false
   * console.log(diagnostic.hasPermission) // true/false
   * console.log(diagnostic.error) // 错误信息或undefined
   * ```
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
   * 创建包含用户信息、路由状态和修复建议的完整报告
   * 
   * @complexity O(n) - n为推广路由数量，需要检查每个路由
   * @flow 用户信息收集 → 路由检查 → 建议生成 → 报告构建
   * 
   * @returns {DiagnosticReport} 完整的诊断报告
   * 
   * @example
   * ```typescript
   * const report = generateReport()
   * console.log(report.userInfo.isLoggedIn) // 登录状态
   * console.log(report.routes.length) // 检查的路由数量
   * console.log(report.recommendations) // 修复建议数组
   * ```
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
   * 基于用户状态和路由检查结果生成具体的修复建议
   * 
   * @complexity O(n) - n为问题路由数量，需要分析每个问题
   * @flow 登录状态检查 → 路由加载检查 → 角色检查 → 问题路由分析 → 建议生成
   * 
   * @param {any} userInfo - 用户信息对象
   * @param {PromotionRouteDiagnostic[]} routes - 路由诊断结果数组
   * @returns {string[]} 修复建议数组
   * 
   * @example
   * ```typescript
   * const userInfo = {
   *   isLoggedIn: true,
   *   roles: ['agent'],
   *   routesLoaded: false
   * }
   * const routes = [] // 路由诊断结果数组
   * 
   * const recommendations = generateRecommendations(userInfo, routes)
   * console.log(recommendations)
   * // [
   * //   '动态路由未加载，请刷新页面或重新登录',
   * //   '访问 PromotionAudit 权限不足，当前角色: agent，需要: director'
   * // ]
   * ```
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
   * 以结构化格式在浏览器控制台输出详细的诊断信息
   * 
   * @complexity O(n) - n为路由数量，需要输出每个路由的状态
   * @flow 报告生成 → 控制台分组 → 用户信息输出 → 路由状态输出 → 建议输出
   * 
   * @returns {DiagnosticReport} 诊断报告对象，同时在控制台输出
   * 
   * @example
   * ```typescript
   * // 在控制台中执行
   * const report = printReport()
   * 
   * // 会在控制台显示如下信息：
   * // 🔍 推广管理模块路由诊断报告
   * // ⏰ 诊断时间: 2024-01-01T12:00:00.000Z
   * // 👤 用户信息
   * //   登录状态: ✅ 已登录
   * //   Token: ✅ 存在
   * //   用户角色: ['agent']
   * //   路由加载状态: ✅ 已加载
   * ```
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
   * 自动检测和修复常见的路由问题，如重新获取用户信息和路由加载
   * 
   * @complexity O(1) - 常数时间复杂度，主要是API调用和状态检查
   * @flow 用户信息检查 → 重新获取信息 → 路由加载检查 → 修复结果返回
   * 
   * @returns {Promise<{success: boolean, message: string}>} 修复结果
   * 
   * @example
   * ```typescript
   * const fixResult = await attemptFix()
   * 
   * if (fixResult.success) {
   *   console.log('修复成功:', fixResult.message)
   * } else {
   *   console.log('修复失败:', fixResult.message)
   *   // 可能需要用户手动操作，如刷新页面
   * }
   * ```
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
 * 便捷的诊断入口，无需导入模块即可使用
 * 
 * @complexity O(n) - 依赖于usePromotionRouteDiagnostics的复杂度
 * @flow 诊断实例创建 → 报告生成和打印
 * 
 * @returns {DiagnosticReport} 诊断报告对象
 * 
 * @example
 * ```javascript
 * // 在浏览器控制台中直接调用
 * const report = diagnosePromotionRoutes()
 * 
 * // 查看特定路由状态
 * const auditRoute = report.routes.find(r => r.routeName === 'PromotionAudit')
 * console.log(auditRoute.exists, auditRoute.hasPermission)
 * ```
 */
export function diagnosePromotionRoutes() {
  const diagnostics = usePromotionRouteDiagnostics()
  return diagnostics.printReport()
}

/**
 * 全局修复函数，可在浏览器控制台直接调用
 * 便捷的自动修复入口，无需导入模块即可使用
 * 
 * @complexity O(1) - 依赖于usePromotionRouteDiagnostics的attemptFix方法
 * @flow 诊断实例创建 → 自动修复尝试
 * 
 * @returns {Promise<{success: boolean, message: string}>} 修复结果
 * 
 * @example
 * ```javascript
 * // 在浏览器控制台中直接调用
 * fixPromotionRoutes().then(result => {
 *   if (result.success) {
 *     console.log('修复成功:', result.message)
 *     location.reload() // 可选：刷新页面以应用修复
 *   } else {
 *     console.log('需要手动修复:', result.message)
 *   }
 * })
 * ```
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
