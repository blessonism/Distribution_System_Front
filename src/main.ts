/**
 * @fileoverview Vue 3应用程序入口文件
 * 负责Vue应用的初始化、插件安装、全局配置和应用启动
 * 集成路由系统、状态管理、权限控制、Mock服务和调试工具等核心功能
 * 
 * @author Frontend Team
 * @since 1.0.0
 * @version 2.0.0
 * 
 * @description
 * main.ts是整个Vue应用的核心入口文件，主要功能包括：
 * - 🚀 Vue应用实例创建和配置，建立应用程序基础架构
 * - 🔧 核心插件安装，包括Pinia状态管理和Vue Router路由系统  
 * - 🎨 全局样式导入，统一应用视觉风格和移动端适配
 * - 🔐 权限系统初始化，注册权限指令和认证检查
 * - 🛠️ 开发工具集成，包括Mock服务和路由诊断工具
 * - ⚡ 应用启动优化，包含初始状态检查和路由预处理
 * - 📱 响应式设计支持，确保在不同设备上的正常运行
 * - 🔍 调试和诊断功能，便于开发时问题排查和性能监控
 * 
 * @features
 * - **模块化架构**: 清晰的功能模块分离和依赖管理
 * - **状态管理**: Pinia集成，提供响应式的全局状态管理
 * - **路由系统**: Vue Router集成，支持动态路由和权限控制
 * - **权限控制**: 指令级权限控制，精确控制元素显示和交互
 * - **开发支持**: Mock数据服务和路由诊断工具
 * - **性能优化**: 生产环境警告过滤和应用启动优化
 * - **状态监控**: 初始状态检查和路由状态追踪
 * - **错误处理**: 完善的错误捕获和警告处理机制
 * 
 * @example
 * ```typescript
 * // 应用启动后的全局对象（开发环境）
 * window.diagnosePromotionRoutes() // 诊断推广路由问题
 * window.fixPromotionRoutes()     // 尝试自动修复路由问题
 * 
 * // 应用初始化状态
 * const initState = {
 *   hasToken: !!localStorage.getItem('token'),
 *   hasRoles: !!localStorage.getItem('userRoles'),
 *   routeCount: router.getRoutes().length
 * }
 * ```
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { asyncRoutes, filterRoutesByRole } from './router/routes'
import App from './App.vue'
import './assets/main.css'
import './assets/css/permissions.css'
import './styles/mobile.css'

// 导入Mock服务（在生产环境中会被忽略）
import './mock'

// 导入权限指令
import { installPermissionDirectives } from '@/directives/permission'

// 导入诊断工具
import { diagnosePromotionRoutes, fixPromotionRoutes } from '@/utils/promotionRouteDiagnostics'

const app = createApp(App)
const pinia = createPinia()

/**
 * 调试日志输出函数
 * 为应用初始化过程提供结构化的调试信息输出
 * 
 * @function debug
 * @param {string} message - 调试消息内容
 * @param {...any[]} args - 附加的调试参数
 * @returns {void}
 * 
 * @complexity O(1) - 简单的日志输出，常数时间复杂度
 * @flow 消息格式化 → 控制台输出 → 调试信息记录
 * 
 * @example
 * ```typescript
 * debug('路由初始化完成', { routeCount: 15, hasAuth: true })
 * // 输出: [App Init] 路由初始化完成 { routeCount: 15, hasAuth: true }
 * ```
 */
// 添加调试信息
const debug = (message: string, ...args: any[]) => {
  console.log(`[App Init] ${message}`, ...args)
}

/**
 * Vue警告处理器配置
 * 在生产环境中过滤特定的Vue警告，优化生产环境的日志输出
 * 
 * @complexity O(1) - 简单的字符串匹配和条件判断
 * @flow 环境检查 → 警告过滤 → 日志输出控制
 * 
 * @description 配置规则：
 * - 生产环境：过滤已知的无害警告，减少日志噪音
 * - 开发环境：保持默认警告行为，便于问题调试
 * - 特定过滤：忽略shadcn-vue组件的默认插槽警告
 * 
 * @example
 * ```typescript
 * // 被过滤的警告示例
 * "Non-function value encountered for default slot"
 * // 不会在生产环境控制台中显示
 * ```
 */
// 配置Vue警告
if (import.meta.env.PROD) {
  app.config.warnHandler = (msg, instance, trace) => {
    // 在生产环境中忽略某些特定警告
    if (msg.includes('Non-function value encountered for default slot')) {
      return
    }
    console.warn(`[Vue warn]: ${msg}${trace}`)
  }
}

/**
 * 应用初始状态检查函数
 * 检查本地存储中的用户认证状态和角色信息，并进行状态重置和调试输出
 * 
 * @function checkInitialState
 * @returns {void}
 * 
 * @complexity O(1) - 本地存储访问和简单的状态设置，常数时间复杂度
 * @flow 本地存储检查 → 状态记录 → 调试输出 → 强制刷新标志设置
 * 
 * @description 检查内容：
 * - 检查localStorage中是否存在用户认证token
 * - 检查localStorage中是否存在用户角色信息
 * - 统计当前已注册的路由数量
 * - 设置强制路由刷新标志确保路由状态一致性
 * 
 * @example
 * ```typescript
 * // 应用启动时调用
 * checkInitialState()
 * // 输出示例: [App Init] 应用初始化状态检查 { hasToken: true, hasRoles: true, routeCount: 15 }
 * ```
 */
// 我们将使用router/index.ts中的路由守卫处理动态路由，这里只做初始检查
const checkInitialState = () => {
  // 检查是否有token和用户角色
  const token = localStorage.getItem('token')
  const userRolesStr = localStorage.getItem('userRoles')
  
  debug('应用初始化状态检查', { 
    hasToken: !!token, 
    hasRoles: !!userRolesStr,
    routeCount: router.getRoutes().length
  })
  
  // 设置一个标志，强制刷新路由状态
  localStorage.setItem('forceRouteRefresh', 'true')
}

// 在应用挂载前检查初始状态
checkInitialState()

/**
 * 路由导航守卫配置
 * 设置Vue Router的全局前置守卫，用于路由导航时的调试信息记录
 * 
 * @guard router.beforeEach
 * @param {Route} to - 即将进入的目标路由对象
 * @param {Route} from - 当前导航正要离开的路由对象
 * @param {Function} next - 调用该方法来resolve这个钩子
 * 
 * @complexity O(1) - 简单的条件判断和日志输出，常数时间复杂度
 * @flow 路由变化检测 → 条件判断 → 调试信息输出 → 导航继续
 * 
 * @description 守卫功能：
 * - 检测从根路径开始的导航，记录关键路由信息
 * - 输出路由变化的调试信息，包含源路径、目标路径、路由数量
 * - 为后续的权限控制和动态路由加载提供基础信息
 * - 确保所有导航都能正常进行，不阻塞路由跳转
 * 
 * @example
 * ```typescript
 * // 典型的调试输出示例
 * // [App Init] 路由导航开始，当前路由信息: { from: '/', to: '/dashboard', routeCount: 15 }
 * ```
 */
// 在应用挂载前记录所有路由
router.beforeEach((to, from, next) => {
  if (from.path === '/') {
    debug('路由导航开始，当前路由信息:', {
      from: from.path,
      to: to.path,
      routeCount: router.getRoutes().length,
    })
  }
  next()
})

/**
 * 核心插件和模块注册
 * 按照正确的顺序注册Pinia状态管理、Vue Router路由系统和权限指令
 * 
 * @description 注册顺序：
 * 1. Pinia - 全局状态管理，为组件提供响应式状态
 * 2. Vue Router - 路由系统，处理页面导航和组件渲染
 * 3. 权限指令 - 元素级权限控制，基于用户角色显示/隐藏DOM元素
 * 
 * @complexity O(1) - 插件注册操作，常数时间复杂度
 * @flow Pinia注册 → Router注册 → 权限指令安装 → 应用配置完成
 * 
 * @example
 * ```typescript
 * // 在组件中使用注册的功能
 * // Pinia store
 * const userStore = useUserStore()
 * 
 * // Router导航
 * router.push('/dashboard')
 * 
 * // 权限指令
 * <button v-permission="['admin']">管理员操作</button>
 * ```
 */
// 注册Pinia、Router和权限指令
app.use(pinia)
app.use(router)
installPermissionDirectives(app)

/**
 * 开发环境诊断工具配置
 * 在开发模式下将推广路由诊断工具挂载到全局对象，便于开发者调试
 * 
 * @environment development
 * 
 * @complexity O(1) - 简单的对象属性赋值和日志输出，常数时间复杂度
 * @flow 环境检查 → 全局对象挂载 → 使用说明输出
 * 
 * @description 诊断功能：
 * - `diagnosePromotionRoutes()`: 诊断推广路由配置问题
 * - `fixPromotionRoutes()`: 尝试自动修复路由问题
 * - 仅在开发环境可用，生产环境不会加载这些工具
 * - 通过浏览器控制台直接调用，方便开发调试
 * 
 * @example
 * ```typescript
 * // 在浏览器控制台中使用
 * diagnosePromotionRoutes() // 诊断推广路由问题
 * fixPromotionRoutes()     // 尝试自动修复路由问题
 * ```
 */
// 在开发环境下将诊断工具挂载到全局
if (import.meta.env.DEV) {
  // 将诊断函数挂载到全局对象，方便在控制台调用
  ;(window as any).diagnosePromotionRoutes = diagnosePromotionRoutes
  ;(window as any).fixPromotionRoutes = fixPromotionRoutes

  console.log('🔧 开发模式：推广路由诊断工具已加载')
  console.log('💡 在控制台输入以下命令进行诊断：')
  console.log('   diagnosePromotionRoutes() - 诊断推广路由问题')
  console.log('   fixPromotionRoutes() - 尝试自动修复')
}

/**
 * Vue应用实例挂载
 * 将配置完成的Vue应用实例挂载到DOM元素上，启动整个应用
 * 
 * @mount #app
 * 
 * @complexity O(1) - DOM挂载操作，常数时间复杂度
 * @flow DOM查找 → 应用挂载 → 组件渲染 → 应用启动完成
 * 
 * @description 挂载过程：
 * - 查找DOM中id为'app'的元素作为挂载点
 * - 将Vue应用实例渲染到该DOM元素中
 * - 触发应用的完整生命周期，开始响应用户交互
 * - 启动路由系统，处理初始URL和页面渲染
 * 
 * @example
 * ```html
 * <!-- index.html中的挂载点 -->
 * <div id="app"></div>
 * 
 * <!-- 应用挂载后的DOM结构 -->
 * <div id="app">
 *   <div class="app-container">
 *     <!-- Vue组件渲染的内容 -->
 *   </div>
 * </div>
 * ```
 */
// 挂载应用
app.mount('#app')
