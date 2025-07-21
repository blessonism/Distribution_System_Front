<template>
  <div class="agent-detail-container">
    <!-- 添加返回按钮 -->
    <div class="mb-4 flex items-center">
      <Button variant="outline" size="sm" class="flex items-center gap-2" @click="navigateBackToList">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-arrow-left"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
        返回代理列表
      </Button>
    </div>

    <!-- 错误提示 -->
    <Alert v-if="showErrorAlert" variant="destructive" class="mb-4">
      <AlertTitle>错误</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>
    
    <!-- 成功提示 -->
    <Alert v-if="showSuccessAlert" variant="default" class="mb-4">
      <AlertTitle>成功</AlertTitle>
      <AlertDescription>{{ successMessage }}</AlertDescription>
    </Alert>
    
    <!-- 加载状态 -->
    <div v-if="loading.detail" class="flex justify-center items-center py-12">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p class="mt-2 text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
    
    <!-- 代理详情内容 -->
    <div v-else-if="agentDetail">
    <Card class="mb-4">
      <CardHeader class="pb-0">
        <CardTitle>代理基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col md:flex-row gap-6 pt-4">
          <!-- 代理头像和基本信息 -->
          <div class="flex flex-col items-center md:w-1/4">
            <div class="h-32 w-32 mb-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="h-24 w-24 text-primary/70">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" stroke="none"/>
              </svg>
            </div>
              <h3 class="text-xl font-semibold">{{ agentDetail.name || '暂无数据' }}</h3>
            <div class="flex items-center gap-2 mt-1">
                <Badge :variant="getStatusVariant(agentDetail.status)">
                  {{ getStatusText(agentDetail.status) }}
              </Badge>
                <Badge variant="outline">{{ agentDetail.level || '暂无等级' }}</Badge>
            </div>
          </div>

          <!-- 代理详细信息 -->
          <div class="md:w-3/4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">手机号码</h4>
                    <p class="font-medium">{{ agentDetail.phone || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" x2="8" y1="2" y2="4"></line><line x1="16" x2="16" y1="2" y2="4"></line></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">微信名称</h4>
                    <p class="font-medium">{{ agentDetail.wechatName || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">代理类型</h4>
                    <p class="font-medium">{{ getCategoryDescription(agentDetail.category) }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">添加日期</h4>
                    <p class="font-medium">{{ agentDetail.addedDate || agentDetail.createdAt || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">推荐人/推荐码</h4>
                    <p class="font-medium">{{ agentDetail.referrer || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M21 15V6"></path><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path><path d="M12 12H3"></path><path d="M16 6H3"></path><path d="M12 18H3"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">小红书账号</h4>
                    <p class="font-medium">{{ agentDetail.redBookAccount || '暂无数据' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="mb-4">
      <CardHeader>
        <CardTitle>代理状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div class="flex items-center">
              <Badge :variant="agentDetail.isAdded ? 'default' : 'outline'" class="mr-2">
                {{ agentDetail.isAdded ? '是' : '否' }}
            </Badge>
            <span>已添加</span>
          </div>
          <div class="flex items-center">
              <Badge :variant="agentDetail.isPosting ? 'default' : 'outline'" class="mr-2">
                {{ agentDetail.isPosting ? '是' : '否' }}
            </Badge>
            <span>发帖</span>
          </div>
          <div class="flex items-center">
              <Badge :variant="agentDetail.isIntercept ? 'default' : 'outline'" class="mr-2">
                {{ agentDetail.isIntercept ? '是' : '否' }}
            </Badge>
            <span>截流</span>
          </div>
          <div class="flex items-center">
              <Badge :variant="agentDetail.isAttracting ? 'default' : 'outline'" class="mr-2">
                {{ agentDetail.isAttracting ? '是' : '否' }}
            </Badge>
            <span>引流获客</span>
          </div>
          <div class="flex items-center">
              <Badge :variant="agentDetail.isInGroup ? 'default' : 'outline'" class="mr-2">
                {{ agentDetail.isInGroup ? '是' : '否' }}
            </Badge>
            <span>进群</span>
          </div>
        </div>
      </CardContent>
    </Card>

      <Card v-if="hasPerformanceViewPermission && agentPerformance" class="mb-4">
      <CardHeader>
          <div class="flex justify-between items-center">
        <CardTitle>业绩数据</CardTitle>
            <Button variant="outline" size="sm" @click="refreshData" :disabled="loading.performance">
              <RefreshCwIcon class="h-4 w-4 mr-1" :class="{ 'animate-spin': loading.performance }" />
              刷新
            </Button>
          </div>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">有效客资数</h3>
              <p class="text-2xl font-bold">{{ agentPerformance.validClients || 0 }}</p>
          </div>
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">成交金额</h3>
              <p class="text-2xl font-bold">¥{{ agentPerformance.totalRevenue || 0 }}</p>
          </div>
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">提成金额</h3>
              <p class="text-2xl font-bold">¥{{ agentPerformance.commission || 0 }}</p>
          </div>
        </div>
        
        <!-- 业绩趋势图表 -->
        <div v-if="hasPerformanceViewPermission" class="mb-6">
          <Suspense>
            <template #default>
              <div v-if="!agentStore.loading.performance">
                <AgentPerformanceChart 
                  :key="`chart-${chartPeriod}-${chartUpdateCounter}`"
                  :performanceData="agentPerformance" 
                  :loading="agentStore.loading.performance"
                  :period="chartPeriod" 
                  @period-change="handlePeriodChange"
                  @refresh="refreshPerformanceData"
                />
              </div>
            </template>
            <template #fallback>
              <div class="h-64 flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </template>
          </Suspense>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>备注信息</CardTitle>
      </CardHeader>
      <CardContent>
          <p>{{ agentDetail.notes || '暂无备注' }}</p>
      </CardContent>
    </Card>
    </div>
    
    <!-- 固定操作面板 -->
    <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50" v-if="agentDetail">
      <Button v-if="hasEditPermission" size="sm" variant="default" @click="openEditDialog" class="rounded-full h-12 w-12 flex items-center justify-center p-0">
        <PencilIcon class="h-5 w-5" />
      </Button>
      <Button v-if="hasDeletePermission" size="sm" variant="destructive" @click="confirmDelete" class="rounded-full h-12 w-12 flex items-center justify-center p-0">
        <TrashIcon class="h-5 w-5" />
      </Button>
    </div>
    
    <!-- 确认删除对话框 -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除该代理吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button 
            type="button" 
            variant="destructive" 
            :loading="loading.action"
            @click="deleteAgent"
          >
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgentStore } from '@/store/agent'
import { useUserStore } from '@/store/user'
import { useListState } from '@/composables/useListState'
import { storeToRefs } from 'pinia'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PencilIcon, TrashIcon, RefreshCwIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { AgentCategory, AgentStatus } from '@/types/agent'
import AgentPerformanceChart from '@/components/business/AgentPerformanceChart.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// 使用Pinia Store
const agentStore = useAgentStore()
const userStore = useUserStore()
const { agentDetail, agentPerformance, loading } = storeToRefs(agentStore)
const route = useRoute()
const router = useRouter()

// 使用列表状态管理
const { navigateBackToList } = useListState()

// 图表周期选择
const chartPeriod = ref<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
// 图表更新计数器，用于强制重新渲染
const chartUpdateCounter = ref(0)

// 编辑和删除对话框状态
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

// 错误处理相关
const errorMessage = ref('')
const showErrorAlert = ref(false)

// 成功处理相关
const successMessage = ref('')
const showSuccessAlert = ref(false)

// 处理API错误的函数
const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error)
  
  // 尝试从错误响应中获取更详细的信息
  if (error.response && error.response.data && error.response.data.message) {
    errorMessage.value = error.response.data.message
  } else if (error.message) {
    errorMessage.value = error.message
  } else {
    errorMessage.value = defaultMessage
  }
  
  showErrorAlert.value = true
  
  // 5秒后自动关闭错误提示
  setTimeout(() => {
    showErrorAlert.value = false
  }, 5000)
}

// 获取代理详情
const fetchAgentDetail = async () => {
  try {
    const id = route.params.id as string
    await agentStore.fetchAgentDetail(id)
    
    // 如果没有找到代理数据，显示错误或重定向
    if (!agentDetail.value) {
      errorMessage.value = '找不到该代理的信息'
      showErrorAlert.value = true
      return
    }
    
    // 获取业绩数据
    await fetchPerformanceData()
  } catch (error) {
    handleApiError(error, '获取代理详情失败')
  }
}

// 获取业绩数据
const fetchPerformanceData = async () => {
  if (!agentDetail.value) return
  
  try {
    console.log('正在请求业绩数据，参数:', {
      id: agentDetail.value.id,
      period: chartPeriod.value,
      includeTrend: true
    })
    
    // 清除该周期的业绩缓存以获取最新数据
    if (agentDetail.value) {
      agentStore.cache.clearPerformanceCache(agentDetail.value.id, chartPeriod.value)
    }
    
    const result = await agentStore.fetchAgentPerformance(agentDetail.value.id, {
      period: chartPeriod.value,
      includeTrend: true
    })
    
    console.log('获取到的业绩数据:', JSON.stringify(result, null, 2))
    console.log('业绩数据中是否包含trendData:', !!result?.trendData)
  } catch (error) {
    handleApiError(error, '获取业绩数据失败')
  }
}

// 刷新数据
const refreshData = async () => {
  try {
    agentStore.loading.detail = true
    
    const id = route.params.id as string
    await agentStore.forceRefresh(id, {
      period: chartPeriod.value,
      includeTrend: true
    })
    
    agentStore.loading.detail = false
    
    // 显示成功消息
    successMessage.value = '数据已更新'
    showSuccessAlert.value = true
    setTimeout(() => {
      showSuccessAlert.value = false
    }, 3000)
  } catch (error) {
    agentStore.loading.detail = false
    handleApiError(error, '刷新数据失败')
  }
}

// 添加专用于刷新业绩数据的方法
const refreshPerformanceData = async () => {
  if (!agentDetail.value) return
  
  try {
    // 强制刷新业绩数据
    if (agentDetail.value) {
      agentStore.cache.clearPerformanceCache(agentDetail.value.id, chartPeriod.value)
      
      // 确保传递当前周期和includeTrend参数
      await agentStore.fetchAgentPerformance(agentDetail.value.id, {
        period: chartPeriod.value,
        includeTrend: true
      })
    }
  } catch (error) {
    handleApiError(error, '刷新业绩数据失败')
  }
}

// 处理周期变更
const handlePeriodChange = (period: string) => {
  chartPeriod.value = period as 'day' | 'week' | 'month' | 'quarter' | 'year'
  // 增加计数器以强制重新渲染
  chartUpdateCounter.value++
  fetchPerformanceData()
}

// 权限控制
const hasEditPermission = computed(() => {
  // 根据用户角色判断是否有编辑权限
  const userRole = userStore.userRole
  // 管理员和销售总监可以编辑所有代理
  if (['super_admin', 'director'].includes(userRole || '')) {
    return true
  }
  // 销售组长只能编辑其组内代理
  if (userRole === 'leader') {
    // 由于当前userStore.userInfo中可能不存在groupId字段，暂时允许组长编辑
    // 后续如果userInfo中添加了groupId字段，可以取消注释下面的代码
    // return agentDetail.value?.groupId === userStore.userInfo?.groupId
    return true
  }
  return false
})

const hasDeletePermission = computed(() => {
  const userRole = userStore.userRole
  return ['super_admin', 'director'].includes(userRole || '')
})

const hasPerformanceViewPermission = computed(() => {
  // 管理员、销售总监和销售组长可以查看业绩数据
  const userRole = userStore.userRole
  return ['super_admin', 'director', 'leader'].includes(userRole || '')
})

// 打开编辑对话框
const openEditDialog = () => {
  showEditDialog.value = true
}

// 确认删除
const confirmDelete = () => {
  showDeleteDialog.value = true
}

// 删除代理
const deleteAgent = async () => {
  if (!agentDetail.value) return
  
  try {
    const success = await agentStore.deleteAgent(agentDetail.value.id)
    if (success) {
      // 跳转回列表页
      navigateBackToList()
    }
  } catch (error) {
    handleApiError(error, '删除代理失败')
  } finally {
    showDeleteDialog.value = false
  }
}

// 自动刷新数据（每60秒）
let refreshInterval: number | undefined

const startAutoRefresh = () => {
  refreshInterval = window.setInterval(() => {
    refreshData()
  }, 60000) // 60秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
}

// 初始化图表
const initChart = () => {
  // 图表初始化已移到AgentPerformanceChart组件中
  console.log('图表组件已加载')
}

// 监听图表周期变化
watch(chartPeriod, () => {
  // 图表初始化已移到AgentPerformanceChart组件中
  console.log('周期已更改为：', chartPeriod.value)
})

// 监听业绩数据变化
watch(() => agentPerformance.value, (newVal) => {
  if (newVal) {
    console.log('业绩数据已更新')
  }
}, { deep: true })

onMounted(() => {
  fetchAgentDetail()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 辅助函数
const getStatusVariant = (status: string | AgentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline'
  
  switch (status) {
    case AgentStatus.ACTIVE:
      return 'default'
    case AgentStatus.PENDING:
      return 'secondary'
    case AgentStatus.BLOCKED:
      return 'destructive'
    case AgentStatus.INACTIVE:
      return 'outline'
    default:
      return 'outline'
  }
}

// 获取状态文本
const getStatusText = (status: string | AgentStatus): string => {
  if (!status) return '未知状态'
  
  switch (status) {
    case AgentStatus.ACTIVE:
      return '活跃'
    case AgentStatus.PENDING:
      return '待审核'
    case AgentStatus.BLOCKED:
      return '已封禁'
    case AgentStatus.INACTIVE:
      return '非活跃'
    default:
      return status as string
  }
}

// 获取代理类型详细描述
const getCategoryDescription = (category: string | AgentCategory): string => {
  if (!category) return '暂无数据'
  
  switch (category) {
    case AgentCategory.A:
      return 'A类（执行力强，能主动完成任务)'
    case AgentCategory.B:
      return 'B类（被动催促型，需要适当督促）'
    case AgentCategory.C: 
      return 'C类（引导从事型，需要详细指导）'
    case AgentCategory.D:
      return 'D类（沉默代理型，活跃度低）'
    default:
      return category as string
  }
}
</script> 

<style scoped>
.agent-detail-container {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 