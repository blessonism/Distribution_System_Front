import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { asyncRoutes, filterRoutesByRole } from './router/routes'
import App from './App.vue'
import './assets/main.css'

// 导入Mock服务（在生产环境中会被忽略）
import './mock'

const app = createApp(App)
const pinia = createPinia()

// 添加调试信息
const debug = (message: string, ...args: any[]) => {
  console.log(`[App Init] ${message}`, ...args)
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

// 注册Pinia和Router
app.use(pinia)
app.use(router)

// 挂载应用
app.mount('#app')
