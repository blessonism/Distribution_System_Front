<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">推广审核</h1>
        <p class="text-gray-600">审核推广任务和奖励</p>
      </div>
      <div class="flex space-x-2">
        <Button
          v-if="permissions.canExport"
          variant="outline"
          size="sm"
          @click="exportDialogOpen = true"
          :disabled="!hasData"
        >
          <Download class="h-4 w-4 mr-1" />
          导出
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="refresh"
          :disabled="listLoading"
        >
          <RefreshCw class="h-4 w-4 mr-1" :class="{ 'animate-spin': listLoading }" />
          刷新
        </Button>
      </div>
    </div>

    <!-- 权限检查 -->
    <div v-if="!hasPermission" class="text-center py-12">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
        <Lock class="h-8 w-8 text-red-600" />
      </div>
      <h3 class="mt-4 text-lg font-medium text-gray-900">访问受限</h3>
      <p class="mt-2 text-sm text-gray-500">{{ permissions.errorMessage || '您没有访问推广审核模块的权限' }}</p>
    </div>

    <!-- 主要内容区 -->
    <div v-else class="space-y-6">
      <!-- 统计概览 -->
      <AuditStatsCards
        v-if="permissions.canViewStats"
        :stats="auditStats"
        :loading="!isInitialized"
        :platform-stats="quickStats.platformStats"
        @refresh="loadStats"
        @view-platform-stats="handleViewPlatformStats"
      />

      <!-- 搜索和筛选 -->
      <Card>
        <CardContent class="pt-6">
          <div class="space-y-4">
            <!-- 搜索栏 -->
            <div class="flex items-center space-x-2">
              <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchKeyword"
                  placeholder="搜索任务ID、代理姓名或内容描述..."
                  class="pl-10"
                />
              </div>
              <Button
                v-if="searchKeyword"
                variant="ghost"
                size="sm"
                @click="clearSearch"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>

            <!-- 筛选条件 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label class="text-sm font-medium">审核状态</Label>
                <Select :value="filters.status" @update:value="filterByStatus">
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="PENDING_MACHINE_AUDIT">机器审核中</SelectItem>
                    <SelectItem value="PENDING_MANUAL_AUDIT">待人工审核</SelectItem>
                    <SelectItem value="APPROVED">已通过</SelectItem>
                    <SelectItem value="REJECTED">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label class="text-sm font-medium">推广平台</Label>
                <Select :value="filters.platform" @update:value="filterByPlatform">
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部平台</SelectItem>
                    <SelectItem value="douyin">抖音</SelectItem>
                    <SelectItem value="kuaishou">快手</SelectItem>
                    <SelectItem value="xiaohongshu">小红书</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label class="text-sm font-medium">内容类型</Label>
                <Select :value="filters.contentType" @update:value="filterByContentType">
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="live_person">真人出镜</SelectItem>
                    <SelectItem value="text">纯文本</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex items-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="resetFilters"
                  :disabled="listLoading"
                  class="flex-1"
                >
                  重置
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 批量操作栏 -->
      <div v-if="selectedTasks.length > 0" class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-center space-x-2">
          <Badge variant="secondary">{{ selectedTasks.length }}</Badge>
          <span class="text-sm text-blue-700">个任务已选中</span>
        </div>
        <div class="flex space-x-2">
          <Button
            v-if="permissions.canBatchAudit"
            size="sm"
            variant="default"
            @click="handleBatchApprove"
            :disabled="!canBatchApprove"
          >
            <CheckCircle class="h-4 w-4 mr-1" />
            批量通过
          </Button>
          <Button
            v-if="permissions.canBatchAudit"
            size="sm"
            variant="destructive"
            @click="handleBatchReject"
            :disabled="!canBatchReject"
          >
            <XCircle class="h-4 w-4 mr-1" />
            批量拒绝
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="clearSelection"
          >
            取消选择
          </Button>
        </div>
      </div>

      <!-- 审核列表 -->
      <Card>
        <CardContent class="p-0">
          <!-- 加载状态 -->
          <div v-if="listLoading && !hasData" class="p-6">
            <div class="space-y-4">
              <div v-for="i in 5" :key="i" class="animate-pulse">
                <div class="flex items-center space-x-4">
                  <div class="h-4 w-4 bg-muted rounded"></div>
                  <div class="h-16 bg-muted rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="hasError" class="p-6 text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <AlertCircle class="h-8 w-8 text-red-600" />
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">加载失败</h3>
            <p class="mt-2 text-sm text-gray-500">{{ listError }}</p>
            <Button
              variant="outline"
              size="sm"
              @click="refresh"
              class="mt-4"
            >
              重新加载
            </Button>
          </div>

          <!-- 空数据状态 -->
          <div v-else-if="isEmpty" class="p-6 text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
              <FileText class="h-8 w-8 text-gray-400" />
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">暂无数据</h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ Object.values(filters).some(v => v && v !== 'all') ? '当前筛选条件下没有找到审核任务' : '还没有推广审核任务' }}
            </p>
            <Button
              v-if="Object.values(filters).some(v => v && v !== 'all')"
              variant="outline"
              size="sm"
              @click="resetFilters"
              class="mt-4"
            >
              清除筛选条件
            </Button>
          </div>

          <!-- 审核列表数据 -->
          <div v-else class="divide-y">
            <AuditTaskRow
              v-for="task in auditList"
              :key="task.id"
              :task="task"
              :selected="isTaskSelected(task.id)"
              :can-audit="permissions.canAudit"
              :can-view-detail="permissions.canViewDetail"
              @select="toggleTaskSelection(task.id)"
              @view-detail="viewTaskDetail(task.id)"
              @approve="handleTaskApprove"
              @reject="handleTaskReject"
            />
          </div>
        </CardContent>
      </Card>

      <!-- 分页 -->
      <div v-if="hasData && pagination.totalPages > 1" class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          共 {{ pagination.total }} 条记录，每页显示 {{ pagination.pageSize }} 条
        </div>
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :page-size="pagination.pageSize"
          @page-change="changePage"
          @page-size-change="changePageSize"
        />
      </div>
    </div>

    <!-- 任务详情侧栏 -->
    <TaskDetailSidebar
      :open="!!currentTask"
      :task="currentTask"
      :task-id="currentTask?.id"
      :loading="false"
      :error="null"
      :can-audit="permissions.canAudit"
      @close="closeTaskDetail"
      @refresh="handleTaskRefresh"
      @approve="handleTaskApprove"
      @reject="handleTaskReject"
    />

    <!-- 审核操作对话框 -->
    <AuditDialog
      :open="auditDialogOpen"
      :task="auditDialogTask"
      :audit-type="auditDialogType"
      :loading="auditDialogLoading"
      @close="closeAuditDialog"
      @submit="handleAuditSubmit"
      @cancel="closeAuditDialog"
    />

    <!-- 导出对话框 -->
    <ExportDialog
      :open="exportDialogOpen"
      :current-filters="filters"
      :current-filtered-count="auditList.length"
      :total-count="pagination.total"
      @close="closeExportDialog"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast/use-toast'
import {
  Search,
  X,
  Download,
  RefreshCw,
  Lock,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-vue-next'
import AuditStatsCards from './components/AuditStatsCards.vue'
import TaskDetailSidebar from './components/TaskDetailSidebar.vue'
import AuditDialog from './components/AuditDialog.vue'
import AuditTaskRow from './components/AuditTaskRow.vue'
import ExportDialog from './components/ExportDialog.vue'
import Pagination from '@/components/ui/pagination.vue'
import { 
  usePromotionAudit,
  usePromotionAuditSearch,
  usePromotionAuditOperations
} from '@/composables/usePromotionAudit'
import type { AuditRequest, PromotionTask } from '@/types/promotion'

// 使用 composables
const {
  isInitialized,
  permissions,
  auditList,
  listLoading,
  listError,
  pagination,
  filters,
  selectedTasks,
  currentTask,
  auditStats,
  quickStats,
  hasData,
  isEmpty,
  hasError,
  hasPermission,
  initialize,
  refresh,
  updateFilters,
  resetFilters,
  filterByStatus,
  filterByPlatform,
  filterByContentType,
  changePage,
  changePageSize,
  toggleTaskSelection,
  selectAllTasks,
  clearSelection,
  isTaskSelected,
  viewTaskDetail,
  closeTaskDetail,
  exportData,
  openExportDialog
} = usePromotionAudit()

const {
  searchKeyword,
  isSearching,
  clearSearch
} = usePromotionAuditSearch()

const {
  operationState,
  auditTask,
  batchAudit
} = usePromotionAuditOperations()

// 审核对话框状态
const auditDialogOpen = ref(false)
const auditDialogTask = ref<PromotionTask | null>(null)
const auditDialogType = ref<'approve' | 'reject'>('approve')
const auditDialogLoading = ref(false)

// 导出对话框状态
const exportDialogOpen = ref(false)

// 计算属性
const canBatchApprove = computed(() => {
  return selectedTasks.value.some(taskId => {
    const task = auditList.value.find(t => t.id === taskId)
    return task && task.status === 'PENDING_MANUAL_AUDIT'
  })
})

const canBatchReject = computed(() => {
  return selectedTasks.value.some(taskId => {
    const task = auditList.value.find(t => t.id === taskId)
    return task && task.status === 'PENDING_MANUAL_AUDIT'
  })
})

// 方法
const loadStats = async () => {
  // 这里可以添加统计数据刷新逻辑
  await refresh()
}

const handleViewPlatformStats = () => {
  // 查看平台统计详情
  console.log('查看平台统计详情')
}

const handleTaskRefresh = async (taskId: string) => {
  try {
    await refresh()
    toast({
      title: '刷新成功',
      description: '任务信息已更新'
    })
  } catch (error) {
    toast({
      title: '刷新失败',
      description: '无法获取最新任务信息',
      variant: 'destructive'
    })
  }
}

const handleTaskApprove = (taskId: string) => {
  const task = auditList.value.find(t => t.id === taskId)
  if (!task) {
    toast({
      title: '操作失败',
      description: '找不到对应的任务',
      variant: 'destructive'
    })
    return
  }

  if (task.status !== 'PENDING_MANUAL_AUDIT') {
    toast({
      title: '操作失败',
      description: '只能审核待人工审核的任务',
      variant: 'destructive'
    })
    return
  }

  auditDialogTask.value = task
  auditDialogType.value = 'approve'
  auditDialogOpen.value = true
}

const handleTaskReject = (taskId: string) => {
  const task = auditList.value.find(t => t.id === taskId)
  if (!task) {
    toast({
      title: '操作失败',
      description: '找不到对应的任务',
      variant: 'destructive'
    })
    return
  }

  if (task.status !== 'PENDING_MANUAL_AUDIT') {
    toast({
      title: '操作失败',
      description: '只能审核待人工审核的任务',
      variant: 'destructive'
    })
    return
  }

  auditDialogTask.value = task
  auditDialogType.value = 'reject'
  auditDialogOpen.value = true
}

const handleBatchApprove = () => {
  // TODO: 实现批量通过逻辑
  console.log('批量通过:', selectedTasks.value)
}

const handleBatchReject = () => {
  // TODO: 实现批量拒绝逻辑
  console.log('批量拒绝:', selectedTasks.value)
}

const handleAuditSubmit = async (request: AuditRequest) => {
  auditDialogLoading.value = true
  
  try {
    await auditTask(request)
    
    toast({
      title: '审核成功',
      description: `任务已${request.action === 'approve' ? '通过' : '拒绝'}审核`,
      variant: 'default'
    })
    
    closeAuditDialog()
    await refresh()
    
  } catch (error: any) {
    toast({
      title: '审核失败',
      description: error.message || '操作失败，请重试',
      variant: 'destructive'
    })
  } finally {
    auditDialogLoading.value = false
  }
}

const closeAuditDialog = () => {
  auditDialogOpen.value = false
  auditDialogTask.value = null
  auditDialogLoading.value = false
}

const handleExport = async (exportOptions: any) => {
  try {
    await exportData(exportOptions)
    exportDialogOpen.value = false
  } catch (error: any) {
    // 错误已经在store中处理并显示toast
    console.error('导出失败:', error)
  }
}

const closeExportDialog = () => {
  exportDialogOpen.value = false
}

// 生命周期
onMounted(async () => {
  if (!hasPermission.value) {
    console.warn('[AuditList] 用户没有访问权限')
    return
  }

  try {
    await initialize(true) // 启用自动刷新
    console.log('[AuditList] 页面初始化完成')
  } catch (error) {
    console.error('[AuditList] 页面初始化失败:', error)
    toast({
      title: '加载失败',
      description: '无法加载推广审核数据，请刷新页面重试',
      variant: 'destructive'
    })
  }
})

// 清理
onUnmounted(() => {
  console.log('[AuditList] 页面卸载，清理资源')
})
</script>