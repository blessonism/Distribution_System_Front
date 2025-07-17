<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">DS</span>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          分销系统管理后台
        </h2>
      </div>

      <Card class="mt-8">
        <CardHeader>
          <CardTitle class="text-center">用户登录</CardTitle>
          <CardDescription class="text-center">
            使用您的账号密码登录系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <Label for="username">用户名</Label>
              <Input
                id="username"
                v-model="loginForm.username"
                type="text"
                placeholder="请输入用户名"
                required
                :disabled="loading"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">密码</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  required
                  :disabled="loading"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  @click="showPassword = !showPassword"
                >
                  <svg 
                    v-if="showPassword" 
                    class="h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg 
                    v-else 
                    class="h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              class="w-full"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '登录中...' : '登录' }}
            </Button>

            <Alert v-if="error" variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>登录失败</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </form>
        </CardContent>
        <CardFooter class="flex justify-center">
          <p class="text-sm text-gray-600">
            忘记密码？请联系管理员
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import type { LoginRequest } from '@/types/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const showPassword = ref(false)
const error = ref('')

const loginForm = reactive<LoginRequest>({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 登录并获取用户信息
    await userStore.login(loginForm)

    console.log('登录成功，用户信息:', userStore.userInfo)
    console.log('用户角色:', userStore.roles)
    console.log('当前路由:', router.currentRoute.value.path)
    console.log('路由是否已加载:', userStore.routesLoaded)

    // 显示登录成功提示
    toast({
      title: '登录成功',
      description: `欢迎回来，${userStore.userInfo?.nickname || userStore.userInfo?.username}`,
      variant: 'default',
    })
    
    // 登录成功后，初始化动态路由并直接导航到dashboard
    if (!userStore.routesLoaded && userStore.token) {
      console.log('登录后手动添加动态路由')
      // 导入所需的函数
      const { asyncRoutes, filterRoutesByRole } = await import('@/router/routes')
      
      // 过滤并添加路由
      const accessibleRoutes = filterRoutesByRole(asyncRoutes, userStore.roles || [])
      // 使用外部已声明的router实例，而不是在这里重新声明
      accessibleRoutes.forEach(route => {
        if (route.name && !router.hasRoute(route.name)) {
          console.log('添加路由:', route.path, route.name)
          router.addRoute(route)
        }
      })
      userStore.$patch({ routesLoaded: true })
    }
    
    // 直接导航到dashboard
    console.log('尝试直接跳转到dashboard')
    try {
      // 确保Layout路由已加载
      if (!router.hasRoute('Layout')) {
        console.warn('Layout路由尚未加载，可能导致导航失败')
      }
      
      // 先检查router.getRoutes()中是否有dashboard路径
      const routes = router.getRoutes()
      console.log('当前所有路由:', routes.map(r => ({ path: r.path, name: r.name })))
      
      await router.push('/dashboard')
      console.log('跳转结束，当前路由:', router.currentRoute.value.path)
    } catch (navError) {
      console.error('导航到dashboard失败:', navError)
      error.value = '页面跳转失败，请刷新页面重试'
    }
    
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查用户名和密码'
    console.error('登录失败:', err)
  } finally {
    loading.value = false
  }
}
</script>