import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { asyncRoutes, filterRoutesByRole } from './router/routes'
import App from './App.vue'
import './assets/main.css'
import './assets/css/permissions.css'

// 导入Mock服务（在生产环境中会被忽略）
import './mock'

// 导入权限指令
import { installPermissionDirectives } from '@/directives/permission'

// 导入诊断工具
import { diagnosePromotionRoutes, fixPromotionRoutes } from '@/utils/promotionRouteDiagnostics'

const app = createApp(App)
const pinia = createPinia()

// 添加调试信息
const debug = (message: string, ...args: any[]) => {
  console.log(`[App Init] ${message}`, ...args)
}

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

// 注册Pinia、Router和权限指令
app.use(pinia)
app.use(router)
installPermissionDirectives(app)

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

// 挂载应用
app.mount('#app')
