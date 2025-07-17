import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'

// 导入Mock服务（在生产环境中会被忽略）
import './mock'

const app = createApp(App)
const pinia = createPinia()

// 在应用挂载前记录所有路由
router.beforeEach((to, from, next) => {
  if (from.path === '/') {
    console.log('应用初始化，当前所有路由:', router.getRoutes().map(r => ({
      path: r.path,
      name: r.name,
      children: r.children?.length || 0
    })))
  }
  next()
})

app.use(pinia)
app.use(router)

app.mount('#app')
