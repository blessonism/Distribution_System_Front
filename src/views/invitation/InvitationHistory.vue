<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">邀请历史</h1>
        <p class="text-muted-foreground">
          查看您的邀请记录和被邀请用户的详细信息
        </p>
      </div>
      
      <!-- 页面操作 -->
      <div class="flex items-center space-x-2">
        <!-- 返回按钮 -->
        <Button 
          variant="ghost" 
          size="sm"
          @click="$router.push('/invitation/codes')"
        >
          <ArrowLeft class="w-4 h-4 mr-1" />
          返回管理
        </Button>
        
        <!-- 刷新按钮 -->
        <Button 
          variant="outline" 
          size="sm"
          @click="handleRefresh"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          刷新
        </Button>
      </div>
    </div>

    <!-- 权限检查 -->
    <div v-if="!hasInvitationPermission" class="text-center py-12">
      <Shield class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">无访问权限</h3>
      <p class="text-muted-foreground">
        您当前的角色无法访问邀请历史。邀请功能仅对超级管理员、销售总监、销售组长和销售人员开放。
      </p>
    </div>

    <!-- 主要内容区域 -->
    <div v-else class="space-y-6">
      <!-- 统计概览卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 总邀请数 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-blue-100 rounded-full">
                <Users class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">总邀请数</p>
                <p class="text-2xl font-bold">{{ totalInvitations }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 本月邀请 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-green-100 rounded-full">
                <Calendar class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">本月邀请</p>
                <p class="text-2xl font-bold">{{ monthlyInvitations }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 成功邀请 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-emerald-100 rounded-full">
                <UserCheck class="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">成功邀请</p>
                <p class="text-2xl font-bold">{{ successfulInvitations }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 待确认邀请 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-yellow-100 rounded-full">
                <Clock class="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">待确认</p>
                <p class="text-2xl font-bold">{{ pendingInvitations }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 邀请历史表格 -->
      <InvitationHistoryTable
        :data="paginatedInvitationHistory"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        @refresh="handleRefresh"
        @export="handleExport"
        @page-change="handlePageChange"
        @filter-change="handleFilterChange"
      />

      <!-- 空状态处理 -->
      <div v-if="!loading && totalInvitations === 0" class="text-center py-12">
        <UserX class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">暂无邀请记录</h3>
        <p class="text-muted-foreground mb-4">
          您还没有邀请过任何用户。开始邀请新用户加入您的团队吧！
        </p>
        <Button @click="$router.push('/invitation/codes')">
          <Plus class="w-4 h-4 mr-1" />
          开始邀请
        </Button>
      </div>
    </div>

    <!-- 导出进度弹窗 -->
    <Dialog v-model:open="exportDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导出邀请历史</DialogTitle>
          <DialogDescription>
            正在准备您的邀请历史数据
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex flex-col items-center space-y-4 py-6">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p class="text-sm text-muted-foreground">正在生成导出文件，请稍候...</p>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            @click="cancelExport"
            :disabled="exportProgress === 100"
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import InvitationHistoryTable from '@/components/business/InvitationHistoryTable.vue'
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Users,
  Calendar,
  UserCheck,
  Clock,
  UserX,
  Plus
} from 'lucide-vue-next'
import { useInvitationStore } from '@/store/invitation'
import { useUserStore } from '@/store/user'
import { useInvitationPermissions } from '@/composables/usePermission'
import type { InvitationRecord, HistoryQueryParams } from '@/types/invitation'

// 路由和状态管理
const router = useRouter()
const invitationStore = useInvitationStore()
const userStore = useUserStore()

// 权限管理
const permissions = useInvitationPermissions()

// 响应式数据
const loading = ref(false)
const exportDialogOpen = ref(false)
const exportProgress = ref(0)
const exportCancelToken = ref<AbortController | null>(null)

// 分页状态
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 筛选参数
const filterParams = ref<HistoryQueryParams>({})

// 计算属性
const hasInvitationPermission = computed(() => permissions.value.canViewHistory)

const invitationHistory = computed(() => invitationStore.invitationHistory)

const paginatedInvitationHistory = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return invitationHistory.value.slice(start, end)
})

const totalInvitations = computed(() => {
  return invitationHistory.value.length
})

const monthlyInvitations = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return invitationHistory.value.filter(record => {
    const recordDate = new Date(record.registeredAt)
    return recordDate >= monthStart
  }).length
})

const successfulInvitations = computed(() => {
  return invitationHistory.value.filter(record => record.status === 'completed').length
})

const pendingInvitations = computed(() => {
  return invitationHistory.value.filter(record => record.status === 'pending').length
})

// 监听器
watch(() => pagination.page, () => {
  loadHistoryData()
})

// 页面加载
onMounted(async () => {
  await loadPageData()
})

// 方法
const loadPageData = async () => {
  if (!hasInvitationPermission.value) {
    return
  }

  loading.value = true
  try {
    await loadHistoryData()
  } catch (error) {
    console.error('加载页面数据失败:', error)
    toast({
      title: '加载失败',
      description: '加载邀请历史数据时发生错误，请刷新页面重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const loadHistoryData = async () => {
  try {
    const params: HistoryQueryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterParams.value
    }

    await invitationStore.fetchInvitationHistory(params)
    
    // 更新分页信息
    pagination.total = invitationHistory.value.length
  } catch (error) {
    console.error('加载邀请历史失败:', error)
    throw error
  }
}

const handleRefresh = async () => {
  await loadHistoryData()
  toast({
    title: '刷新成功',
    description: '邀请历史数据已更新',
  })
}

const handlePageChange = async (page: number) => {
  pagination.page = page
}

const handleFilterChange = async (filters: HistoryQueryParams) => {
  filterParams.value = filters
  pagination.page = 1 // 筛选时重置到第一页
  await loadHistoryData()
}

const handleExport = async (params?: HistoryQueryParams) => {
  exportDialogOpen.value = true
  exportProgress.value = 0
  exportCancelToken.value = new AbortController()

  try {
    // 模拟导出进度
    const progressInterval = setInterval(() => {
      exportProgress.value += 10
      if (exportProgress.value >= 100) {
        clearInterval(progressInterval)
      }
    }, 200)

    // 这里应该调用实际的导出API
    // await invitationStore.exportInvitationHistory({
    //   ...filterParams.value,
    //   ...params
    // })

    // 模拟导出完成
    setTimeout(() => {
      clearInterval(progressInterval)
      exportProgress.value = 100
      
      toast({
        title: '导出完成',
        description: '邀请历史数据已导出完成',
      })
      
      exportDialogOpen.value = false
      
      // 模拟文件下载
      const link = document.createElement('a')
      link.href = '#' // 这里应该是实际的文件URL
      link.download = `invitation-history-${new Date().toISOString().split('T')[0]}.xlsx`
      // link.click()
    }, 2000)
    
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('导出邀请历史失败:', error)
      toast({
        title: '导出失败',
        description: '导出邀请历史时发生错误，请稍后重试',
        variant: 'destructive',
      })
    }
    exportDialogOpen.value = false
  }
}

const cancelExport = () => {
  if (exportCancelToken.value) {
    exportCancelToken.value.abort()
  }
  exportDialogOpen.value = false
  toast({
    title: '导出已取消',
    description: '邀请历史导出操作已取消',
  })
}

// 便捷导航方法
const goToInvitationCodes = () => {
  router.push('/invitation/codes')
}

// 数据刷新方法
const refreshData = async () => {
  await loadPageData()
}

// 导出包装器，用于组件外部调用
const exportData = async (customParams?: HistoryQueryParams) => {
  await handleExport(customParams)
}

// 暴露给父组件的方法
defineExpose({
  refreshData,
  exportData,
  goToInvitationCodes
})
</script>

<style scoped>
/* 统计卡片动画 */
.stats-card {
  transition: all 0.2s ease-in-out;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 页面标题样式 */
.page-header {
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 {
    grid-template-columns: 1fr;
  }
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 空状态样式 */
.empty-state {
  opacity: 0;
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 导出进度条样式 */
.export-progress {
  transition: width 0.3s ease-out;
}

/* 卡片内容间距调整 */
.card-content-compact {
  padding: 1rem;
}

/* 统计数字强调样式 */
.stat-number {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

/* 页面动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>