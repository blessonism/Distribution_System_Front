<template>
  <div class="space-y-6 p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">推广管理模块路由诊断</h1>
        <p class="text-gray-600">诊断推广审核和我的任务页面的访问问题</p>
      </div>
      <div class="flex space-x-2">
        <Button @click="runDiagnostics" :disabled="loading">
          <RefreshCw class="h-4 w-4 mr-1" :class="{ 'animate-spin': loading }" />
          重新诊断
        </Button>
        <Button @click="attemptFix" variant="outline" :disabled="loading">
          <Wrench class="h-4 w-4 mr-1" />
          尝试修复
        </Button>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center">
          <User class="h-5 w-5 mr-2" />
          用户信息
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :class="report?.userInfo.isLoggedIn ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm">{{ report?.userInfo.isLoggedIn ? '已登录' : '未登录' }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :class="report?.userInfo.token ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm">{{ report?.userInfo.token ? 'Token存在' : 'Token缺失' }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :class="report?.userInfo.routesLoaded ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm">{{ report?.userInfo.routesLoaded ? '路由已加载' : '路由未加载' }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :class="hasValidRoles ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="text-sm">{{ hasValidRoles ? '角色正常' : '角色异常' }}</span>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-sm text-gray-600">
            <strong>当前角色:</strong> {{ report?.userInfo.roles?.join(', ') || '无' }}
          </p>
          <p class="text-sm text-gray-600">
            <strong>用户名:</strong> {{ report?.userInfo.userInfo?.username || '未知' }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- 路由检查结果 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center">
          <Route class="h-5 w-5 mr-2" />
          路由检查结果
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="route in report?.routes" :key="route.routeName" 
               class="border rounded-lg p-4" 
               :class="getRouteStatusClass(route)">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium">{{ route.routeName }}</h3>
                <p class="text-sm text-gray-600">{{ route.path }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full" :class="route.exists ? 'bg-green-500' : 'bg-red-500'"></div>
                <div class="w-3 h-3 rounded-full" :class="route.hasPermission ? 'bg-green-500' : 'bg-red-500'"></div>
                <span class="text-sm font-medium" :class="getRouteStatusTextClass(route)">
                  {{ getRouteStatus(route) }}
                </span>
              </div>
            </div>
            <div class="mt-2 text-sm">
              <p><strong>需要角色:</strong> {{ route.requiredRoles.join(', ') }}</p>
              <p><strong>组件路径:</strong> {{ route.componentPath }}</p>
              <p v-if="route.error" class="text-red-600 mt-1">
                <strong>错误:</strong> {{ route.error }}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 修复建议 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center">
          <Lightbulb class="h-5 w-5 mr-2" />
          修复建议
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div v-for="(recommendation, index) in report?.recommendations" 
               :key="index" 
               class="flex items-start space-x-2">
            <span class="text-sm font-medium text-blue-600">{{ index + 1 }}.</span>
            <span class="text-sm">{{ recommendation }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 快速操作 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center">
          <Settings class="h-5 w-5 mr-2" />
          快速操作
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button @click="navigateToAudit" variant="outline" class="w-full">
            <ExternalLink class="h-4 w-4 mr-2" />
            访问推广审核
          </Button>
          <Button @click="navigateToMyTasks" variant="outline" class="w-full">
            <ExternalLink class="h-4 w-4 mr-2" />
            访问我的任务
          </Button>
          <Button @click="refreshPage" variant="outline" class="w-full">
            <RefreshCw class="h-4 w-4 mr-2" />
            刷新页面
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- 修复结果提示 -->
    <Alert v-if="fixResult" :variant="fixResult.success ? 'default' : 'destructive'">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ fixResult.success ? '修复成功' : '修复失败' }}</AlertTitle>
      <AlertDescription>{{ fixResult.message }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePromotionRouteDiagnostics, type DiagnosticReport } from '@/utils/promotionRouteDiagnostics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  RefreshCw, 
  Wrench, 
  User, 
  Route, 
  Lightbulb, 
  Settings, 
  ExternalLink,
  AlertCircle
} from 'lucide-vue-next'

const router = useRouter()
const diagnostics = usePromotionRouteDiagnostics()

const loading = ref(false)
const report = ref<DiagnosticReport | null>(null)
const fixResult = ref<{ success: boolean; message: string } | null>(null)

const hasValidRoles = computed(() => {
  return report.value?.userInfo.roles && report.value.userInfo.roles.length > 0
})

const runDiagnostics = async () => {
  loading.value = true
  try {
    report.value = diagnostics.generateReport()
    fixResult.value = null
  } finally {
    loading.value = false
  }
}

const attemptFix = async () => {
  loading.value = true
  try {
    fixResult.value = await diagnostics.attemptFix()
    // 修复后重新诊断
    await runDiagnostics()
  } finally {
    loading.value = false
  }
}

const getRouteStatus = (route: any) => {
  if (!route.exists) return '不存在'
  if (!route.hasPermission) return '无权限'
  return '正常'
}

const getRouteStatusClass = (route: any) => {
  if (!route.exists || !route.hasPermission) return 'border-red-200 bg-red-50'
  return 'border-green-200 bg-green-50'
}

const getRouteStatusTextClass = (route: any) => {
  if (!route.exists || !route.hasPermission) return 'text-red-600'
  return 'text-green-600'
}

const navigateToAudit = () => {
  router.push('/promotion/audit').catch(err => {
    console.error('导航到推广审核失败:', err)
  })
}

const navigateToMyTasks = () => {
  router.push('/promotion/my-tasks').catch(err => {
    console.error('导航到我的任务失败:', err)
  })
}

const refreshPage = () => {
  window.location.reload()
}

onMounted(() => {
  runDiagnostics()
})
</script>
