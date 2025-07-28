/**
 * @fileoverview 路由诊断工具模块
 * 通用的路由诊断工具，用于调试和分析Vue Router路由问题
 * 提供路由存在性检查、权限验证、用户状态分析和推广模块专项诊断等功能
 * 支持开发环境调试和生产环境问题排查，为路由问题提供全面的诊断信息
 * 
 * @module utils/routeDiagnostics
 * @author Frontend Team
 * @since 1.0.0
 */

import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

/**
 * 使用路由诊断功能
 * 提供全面的Vue Router诊断能力，包括路由检查、权限验证和用户状态分析
 * 
 * @complexity O(n) - n为路由数量，取决于具体的检查操作
 * @flow 路由检查 → 权限验证 → 用户信息获取 → 诊断报告生成
 * 
 * @returns 诊断相关的方法集合
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRouteDiagnostics } from '@/utils/routeDiagnostics'
 * 
 * const diagnostics = useRouteDiagnostics()
 * 
 * // 检查路由是否存在
 * const exists = diagnostics.checkRouteExists('PromotionAudit')
 * 
 * // 检查用户权限
 * const permissions = diagnostics.checkUserPermissions()
 * 
 * // 生成完整诊断报告
 * const report = diagnostics.generateDiagnosticReport()
 * </script>
 * ```
 */
  const router = useRouter()
  const userStore = useUserStore()

  /**
   * 检查路由是否存在
   * 验证指定名称的路由是否在Vue Router中注册
   * 
   * @complexity O(1) - 常数时间复杂度，Vue Router内部哈希查找
   * @flow 路由名输入 → Vue Router检查 → 存在性返回
   * 
   * @param {string} routeName - 要检查的路由名称
   * @returns {boolean} 路由是否存在
   * 
   * @example
   * ```typescript
   * const exists = checkRouteExists('PromotionAudit')
   * if (!exists) {
   *   console.log('路由 PromotionAudit 不存在，可能是动态路由未加载')
   * }
   * ```
   */
  const checkRouteExists = (routeName: string) => {
    return router.hasRoute(routeName)
  }

  /**
   * 获取所有路由信息
   * 返回当前注册的所有路由的基本信息（名称、路径、元数据）
   * 
   * @complexity O(n) - n为注册的路由数量，需要遍历所有路由
   * @flow 路由获取 → 信息提取 → 数组构建
   * 
   * @returns {Array} 路由信息数组，包含名称、路径和元数据
   * 
   * @example
   * ```typescript
   * const routes = getAllRoutes()
   * console.log(`共注册了 ${routes.length} 个路由`)
   * 
   * routes.forEach(route => {
   *   console.log(`${route.name}: ${route.path}`)
   *   if (route.meta?.roles) {
   *     console.log(`  需要角色: ${route.meta.roles.join(', ')}`)
   *   }
   * })
   * ```
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
   * 获取当前用户的完整权限信息，包括用户详情、角色和认证状态
   * 
   * @complexity O(1) - 常数时间复杂度，从用户存储中获取数据
   * @flow 用户存储访问 → 信息收集 → 权限对象构建
   * 
   * @returns {object} 用户权限信息对象
   * 
   * @example
   * ```typescript
   * const permissions = checkUserPermissions()
   * 
   * console.log('用户信息:', permissions.userInfo)
   * console.log('用户角色:', permissions.roles)
   * console.log('Token状态:', permissions.token ? '有效' : '无效')
   * console.log('路由加载状态:', permissions.routesLoaded)
   * 
   * if (!permissions.token) {
   *   console.log('用户未登录，需要先登录')
   * }
   * ```
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
   * 验证用户是否有权限访问指定的路由
   * 
   * @complexity O(n) - n为路由所需角色数量，需要检查角色匹配
   * @flow 路由解析 → 权限获取 → 角色匹配 → 权限结果
   * 
   * @param {string} routeName - 要检查的路由名称
   * @returns {object} 路由权限检查结果
   * 
   * @example
   * ```typescript
   * const permission = checkRoutePermission('PromotionAudit')
   * 
   * console.log('路由存在:', permission.routeExists)
   * console.log('路由所需角色:', permission.routeRoles)
   * console.log('用户当前角色:', permission.userRoles)
   * console.log('是否有权限:', permission.hasPermission)
   * 
   * if (!permission.hasPermission) {
   *   console.log(`权限不足，需要: ${permission.routeRoles?.join(', ')}`)
   *   console.log(`当前角色: ${permission.userRoles.join(', ')}`)
   * }
   * ```
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
   * 专门检查推广相关路由的状态和权限
   * 
   * @complexity O(n) - n为推广路由数量（约为5个），需要检查每个路由
   * @flow 推广路由列表 → 逐个权限检查 → 结果汇总
   * 
   * @returns {Array} 推广路由诊断结果数组
   * 
   * @example
   * ```typescript
   * const promotionDiag = diagnosePromotionRoutes()
   * 
   * promotionDiag.forEach(route => {
   *   console.log(`路由: ${route.routeName}`)
   *   console.log(`  存在: ${route.routeExists ? '✅' : '❌'}`)
   *   console.log(`  权限: ${route.hasPermission ? '✅' : '❌'}`)
   *   
   *   if (!route.routeExists) {
   *     console.log('  问题: 路由不存在，可能是动态路由未加载')
   *   } else if (!route.hasPermission) {
   *     console.log(`  问题: 权限不足，需要: ${route.routeRoles?.join(', ')}`)
   *   }
   * })
   * ```
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
   * 生成包含用户信息、所有路由和推广模块诊断的完整报告
   * 
   * @complexity O(n) - n为总路由数量，需要收集所有路由信息
   * @flow 用户信息收集 → 路由信息收集 → 推广诊断 → 报告汇总
   * 
   * @returns {object} 完整的诊断报告对象
   * 
   * @example
   * ```typescript
   * const report = generateDiagnosticReport()
   * 
   * console.log('诊断报告生成时间:', report.timestamp)
   * console.log('用户登录状态:', report.userInfo.userInfo ? '已登录' : '未登录')
   * console.log('用户角色:', report.userInfo.roles)
   * console.log('总路由数量:', report.allRoutes.length)
   * console.log('推广路由状态:', report.promotionRoutes)
   * 
   * // 检查是否有问题路由
   * const problemRoutes = report.promotionRoutes.filter(r => !r.routeExists || !r.hasPermission)
   * if (problemRoutes.length > 0) {
   *   console.log('发现问题路由:', problemRoutes.map(r => r.routeName))
   * }
   * ```
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
 * 以结构化格式在浏览器控制台输出详细的路由诊断报告
 * 
 * @complexity O(n) - n为路由数量，需要输出所有路由信息
 * @flow 诊断报告生成 → 控制台分组输出 → 报告返回
 * 
 * @returns {object} 诊断报告对象，同时在控制台输出格式化信息
 * 
 * @example
 * ```javascript
 * // 在浏览器控制台中调用
 * const report = printRouteDiagnostics()
 * 
 * // 会在控制台显示如下信息：
 * // 🔍 路由诊断报告
 * // 📊 用户信息: { userInfo: {...}, roles: [...], ... }
 * // 🛣️ 所有路由: [{ name: 'Home', path: '/', ... }, ...]
 * // 🎯 推广模块路由: [{ routeName: 'Promotion', routeExists: true, ... }]
 * ```
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
