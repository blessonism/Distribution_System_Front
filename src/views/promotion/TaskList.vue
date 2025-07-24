<template>
  <div class="task-list-page">
    <!-- 页面头部 -->
    <div class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- 面包屑导航 -->
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li>
                <div class="flex items-center">
                  <router-link 
                    to="/promotion" 
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    推广管理
                  </router-link>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-900 dark:text-gray-100 font-medium">
                    我的任务
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <!-- 操作按钮 -->
          <div class="flex items-center space-x-3">
            <Button
              v-if="canSubmitTask"
              variant="outline"
              @click="goToSubmitTask"
              class="flex items-center gap-2"
            >
              <PlusIcon class="w-4 h-4" />
              提交任务
            </Button>
            <Button
              variant="outline"
              @click="loadTestData"
              :disabled="isLoading"
              class="flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ agentTaskList.length > 0 ? '刷新数据' : '加载示例数据' }}
            </Button>
            <Button
              variant="outline"
              @click="refreshData"
              :disabled="isLoading"
            >
              <RefreshCwIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 统计卡片 -->
      <div v-if="canViewStats" class="mb-8">
        <TaskStatsCards
          :stats="agentTaskStats"
          :loading="agentStatsLoading"
          :platform-stats="agentPlatformStats"
        />
      </div>

      <!-- 筛选和搜索区域 -->
      <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              任务列表
            </h2>
            <Button
              variant="ghost"
              size="sm"
              @click="toggleAdvancedFilters"
              class="flex items-center gap-2"
            >
              <FilterIcon class="w-4 h-4" />
              {{ showAdvancedFilters ? '收起筛选' : '高级筛选' }}
              <ChevronDownIcon
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-180': showAdvancedFilters }"
              />
            </Button>
          </div>
          
          <!-- 筛选控件 -->
          <div class="space-y-4">
            <!-- 第一行：基础筛选 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- 关键词搜索 -->
              <div>
                <Label for="keyword-search" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  关键词搜索
                </Label>
                <Input
                  id="keyword-search"
                  v-model="filters.keyword"
                  placeholder="搜索内容描述或链接"
                  class="mt-1"
                  @input="handleFilterChange"
                />
              </div>

              <!-- 状态筛选 -->
              <div>
                <Label for="status-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  审核状态
                </Label>
                <Select v-model="filters.status" @update:value="handleFilterChange">
                  <SelectTrigger id="status-filter" class="mt-1">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="PENDING">待审核</SelectItem>
                    <SelectItem value="APPROVED">已通过</SelectItem>
                    <SelectItem value="REJECTED">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 平台筛选 -->
              <div>
                <Label for="platform-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  推广平台
                </Label>
                <Select v-model="filters.platform" @update:value="handleFilterChange">
                  <SelectTrigger id="platform-filter" class="mt-1">
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

              <!-- 内容类型筛选 -->
              <div>
                <Label for="content-type-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  内容类型
                </Label>
                <Select v-model="filters.contentType" @update:value="handleFilterChange">
                  <SelectTrigger id="content-type-filter" class="mt-1">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="video">视频内容</SelectItem>
                    <SelectItem value="image">图片内容</SelectItem>
                    <SelectItem value="article">文章内容</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- 第二行：时间范围筛选 -->
            <div v-if="showAdvancedFilters" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <!-- 时间范围快捷选择 -->
              <div>
                <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  时间范围
                </Label>
                <div class="mt-1 flex flex-wrap gap-2">
                  <Button
                    v-for="range in timeRangeOptions"
                    :key="range.value"
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-blue-50 border-blue-300 text-blue-700': selectedTimeRange === range.value }"
                    @click="handleTimeRangeSelect(range.value)"
                  >
                    {{ range.label }}
                  </Button>
                </div>
              </div>

              <!-- 自定义开始日期 -->
              <div>
                <Label for="start-date" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  开始日期
                </Label>
                <Input
                  id="start-date"
                  v-model="customDateRange.startDate"
                  type="date"
                  class="mt-1"
                  @change="handleCustomDateChange"
                />
              </div>

              <!-- 自定义结束日期 -->
              <div>
                <Label for="end-date" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  结束日期
                </Label>
                <Input
                  id="end-date"
                  v-model="customDateRange.endDate"
                  type="date"
                  class="mt-1"
                  @change="handleCustomDateChange"
                />
              </div>
            </div>
          </div>

          <!-- 筛选操作按钮 -->
          <div class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              共找到 {{ agentTaskPagination.total }} 个任务
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="resetFilters"
            >
              重置筛选
            </Button>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="overflow-hidden">
          <!-- 错误状态显示 -->
          <div v-if="agentTaskError && !agentTaskLoading" class="p-8 text-center">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div class="flex flex-col items-center gap-4">
                <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                    加载失败
                  </h3>
                  <p class="text-sm text-red-600 dark:text-red-400 mb-4">
                    {{ agentTaskError }}
                  </p>
                  <Button @click="loadTaskList" variant="outline">
                    重新加载
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态显示 -->
          <div v-else-if="!agentTaskLoading && agentTaskList.length === 0" class="p-8 text-center">
            <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div class="flex flex-col items-center gap-4">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    暂无任务
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {{ hasActiveFilters ? '没有符合筛选条件的任务' : '您还没有提交任何推广任务' }}
                  </p>
                  <div class="flex gap-2 justify-center">
                    <Button @click="goToSubmitTask">
                      提交第一个任务
                    </Button>
                    <Button @click="loadTestData" variant="outline" :disabled="isLoading">
                      加载示例数据
                    </Button>
                    <Button v-if="hasActiveFilters" @click="resetFilters" variant="outline">
                      清除筛选
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>



          <!-- 正常数据表格 -->
          <DataTable
            v-else-if="!agentTaskLoading && agentTaskList.length > 0"
            :data="agentTaskList"
            :columns="tableColumns"
            :loading="agentTaskLoading"
            :pagination="true"
            :total-items="agentTaskPagination.total"
            :page-size="agentTaskPagination.pageSize"
            :current-page="agentTaskPagination.page"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
            @row-click="handleRowClick"
          />

          <!-- 分页信息和页面大小选择 -->
          <div class="flex items-center justify-between mt-4 px-2">
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                显示第 {{ (agentTaskPagination.page - 1) * agentTaskPagination.pageSize + 1 }} -
                {{ Math.min(agentTaskPagination.page * agentTaskPagination.pageSize, agentTaskPagination.total) }} 条，
                共 {{ agentTaskPagination.total }} 条记录
              </div>

              <!-- 页面大小选择 -->
              <div class="flex items-center gap-2">
                <Label class="text-sm text-gray-600 dark:text-gray-400">每页显示</Label>
                <Select
                  :value="agentTaskPagination.pageSize.toString()"
                  @update:value="handlePageSizeChange"
                >
                  <SelectTrigger class="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-sm text-gray-600 dark:text-gray-400">条</span>
              </div>
            </div>

            <!-- 快速跳转 -->
            <div class="flex items-center gap-2">
              <Label class="text-sm text-gray-600 dark:text-gray-400">跳转到</Label>
              <Input
                v-model="jumpToPage"
                type="number"
                :min="1"
                :max="agentTaskPagination.totalPages"
                class="w-16 h-8 text-center"
                @keyup.enter="handleJumpToPage"
                @blur="handleJumpToPage"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">页</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情侧栏 -->
    <TaskDetailSidebar
      v-model:open="showDetailSidebar"
      :task="currentTask"
      :loading="taskDetailLoading"
      @close="handleCloseSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { usePromotionStore } from '@/store/promotion'
import { useUserStore } from '@/store/user'
// 移除权限导入，使用简化的权限检查
import { useDebounceFn } from '@vueuse/core'
import type { PromotionTask, AgentTaskFilterParams } from '@/types/promotion'
import TaskStatsCards from './components/TaskStatsCards.vue'
import TaskDetailSidebar from './components/TaskDetailSidebar.vue'
import DataTable from '@/components/business/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, RefreshCwIcon, ExternalLinkIcon, FilterIcon, ChevronDownIcon } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast'

const router = useRouter()
const promotionStore = usePromotionStore()
const userStore = useUserStore()

// 响应式状态
const showDetailSidebar = ref(false)
const currentTask = ref<PromotionTask | null>(null)
const selectedTimeRange = ref<string>('all')
const showAdvancedFilters = ref(false)
const jumpToPage = ref<number | string>('')

// 权限检查 - 统一用户状态访问，添加空值检查
const canViewTasks = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return false
    }
    return ['agent', 'super_admin', 'director', 'leader'].includes(userRole)
  } catch (error) {
    console.error('[TaskList] 任务查看权限检查失败:', error)
    return false
  }
})

const canSubmitTask = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return false
    }
    return ['agent', 'super_admin', 'director', 'leader'].includes(userRole)
  } catch (error) {
    console.error('[TaskList] 任务提交权限检查失败:', error)
    return false
  }
})

const canViewStats = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return false
    }
    return ['agent', 'super_admin', 'director', 'leader'].includes(userRole)
  } catch (error) {
    console.error('[TaskList] 统计查看权限检查失败:', error)
    return false
  }
})

// 筛选条件
const filters = ref<AgentTaskFilterParams>({
  keyword: '',
  status: 'all',
  platform: 'all',
  contentType: 'all',
  page: 1,
  pageSize: 20
})

// 自定义时间范围
const customDateRange = ref({
  startDate: '',
  endDate: ''
})

// 时间范围选项
const timeRangeOptions = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
  { label: '最近90天', value: 'quarter' },
  { label: '自定义', value: 'custom' }
]

// 计算属性
const agentTaskList = computed(() => promotionStore.agentTaskList)
const agentTaskLoading = computed(() => promotionStore.agentTaskLoading)
const agentTaskError = computed(() => promotionStore.agentTaskError)
const agentTaskPagination = computed(() => promotionStore.agentTaskPagination)
const agentTaskStats = computed(() => promotionStore.agentTaskStats)
const agentStatsLoading = computed(() => promotionStore.agentStatsLoading)
const agentPlatformStats = computed(() => promotionStore.agentPlatformStats)
const taskDetailLoading = computed(() => promotionStore.taskDetailLoading)
const isLoading = computed(() => agentTaskLoading.value || agentStatsLoading.value)

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filters.value.keyword !== '' ||
         filters.value.status !== 'all' ||
         filters.value.platform !== 'all' ||
         filters.value.contentType !== 'all' ||
         filters.value.dateRange !== undefined
})

// 表格列定义 - 修复为DataTable组件期望的格式
const tableColumns = computed(() => [
  {
    id: 'id',
    accessorKey: 'id',
    header: '任务ID',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      return task.id
    }
  },
  {
    id: 'platform',
    accessorKey: 'platform',
    header: '平台',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      const platformNames = {
        douyin: '抖音',
        kuaishou: '快手',
        xiaohongshu: '小红书'
      }
      return platformNames[task.platform] || task.platform
    }
  },
  {
    id: 'contentType',
    accessorKey: 'contentType',
    header: '内容类型',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      const typeNames = {
        video: '视频',
        image: '图片',
        article: '文章'
      }
      return typeNames[task.contentType] || task.contentType
    }
  },
  {
    id: 'contentDescription',
    accessorKey: 'contentDescription',
    header: '内容描述',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      const description = task.contentDescription || ''
      return description.length > 50 ? description.substring(0, 50) + '...' : description
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      const statusConfig = {
        PENDING: { label: '待审核', variant: 'secondary' as const },
        PENDING_MACHINE_AUDIT: { label: '机器审核中', variant: 'secondary' as const },
        PENDING_MANUAL_AUDIT: { label: '人工审核中', variant: 'secondary' as const },
        APPROVED: { label: '已通过', variant: 'default' as const },
        REJECTED: { label: '已拒绝', variant: 'destructive' as const }
      }
      const config = statusConfig[task.status] || { label: task.status, variant: 'secondary' as const }
      return h(Badge, { variant: config.variant }, () => config.label)
    }
  },
  {
    id: 'submittedAt',
    accessorKey: 'submittedAt',
    header: '提交时间',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      return new Date(task.submittedAt).toLocaleString('zh-CN')
    }
  },
  {
    id: 'rewardAmount',
    accessorKey: 'rewardAmount',
    header: '奖励金额',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      return task.rewardAmount ? `¥${task.rewardAmount}` : '-'
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: { row: any }) => {
      const task = row.original || row
      const actions = []

      // 查看详情按钮
      actions.push(
        h(Button, {
          variant: 'outline',
          size: 'sm',
          onClick: () => handleViewDetail(task),
          class: 'mr-1'
        }, () => '详情')
      )

      // 查看原链接按钮
      actions.push(
        h(Button, {
          variant: 'ghost',
          size: 'sm',
          onClick: (e: Event) => {
            e.stopPropagation()
            window.open(task.contentUrl, '_blank')
          },
          title: '查看原链接',
          class: 'mr-1'
        }, () => h(ExternalLinkIcon, { class: 'w-4 h-4' }))
      )

      // 根据任务状态显示不同操作
      if (task.status === 'PENDING') {
        // 待审核状态：可以查看审核进度
        actions.push(
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleCheckAuditProgress(task)
            },
            title: '查看审核进度'
          }, () => h('svg', {
            class: 'w-4 h-4',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, [
            h('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            })
          ]))
        )
      } else if (task.status === 'APPROVED') {
        // 已通过状态：显示奖励信息
        if (task.rewardAmount) {
          actions.push(
            h('span', {
              class: 'text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded'
            }, `¥${task.rewardAmount}`)
          )
        }
      } else if (task.status === 'REJECTED') {
        // 已拒绝状态：显示拒绝原因按钮
        actions.push(
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleViewRejectReason(task)
            },
            title: '查看拒绝原因',
            class: 'text-red-600 hover:text-red-700'
          }, () => h('svg', {
            class: 'w-4 h-4',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, [
            h('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '2',
              d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            })
          ]))
        )
      }

      return h('div', { class: 'flex items-center gap-1' }, actions)
    }
  }
])

// 组件状态管理
const isComponentMounted = ref(false)
const abortController = ref<AbortController | null>(null)

// 防抖的筛选处理
const debouncedFilterChange = useDebounceFn(() => {
  if (isComponentMounted.value) {
    filters.value.page = 1
    loadTaskList()
  }
}, 500)

// 页面初始化
onMounted(async () => {
  try {
    isComponentMounted.value = true
    abortController.value = new AbortController()

    // 权限检查
    if (!canViewTasks.value) {
      if (isComponentMounted.value) {
        toast({
          title: '权限不足',
          description: '您没有权限访问任务列表',
          variant: 'destructive'
        })
        router.push('/dashboard')
      }
      return
    }

    // 加载任务列表和统计数据
    const promises = []

    // 加载任务列表
    promises.push(loadTaskList())

    // 只有有权限且组件仍然挂载时才加载统计数据
    if (canViewStats.value && isComponentMounted.value) {
      promises.push(loadTaskStats())
    }

    await Promise.all(promises)

    // 如果没有数据，显示提示
    if (isComponentMounted.value && agentTaskList.value.length === 0) {
      console.log('[TaskList] 当前无任务数据，可点击"加载示例数据"查看效果')
    }
  } catch (error) {
    if (isComponentMounted.value) {
      console.error('[TaskList] 组件初始化失败:', error)
    }
  }
})

// 监听筛选条件变化
const stopWatching = watch(() => filters.value.keyword, debouncedFilterChange)

// 组件卸载前清理
onBeforeUnmount(() => {
  try {
    isComponentMounted.value = false

    // 取消所有未完成的请求
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }

    // 停止监听
    if (stopWatching) {
      stopWatching()
    }

    // 清理防抖函数
    if (debouncedFilterChange && typeof debouncedFilterChange.cancel === 'function') {
      debouncedFilterChange.cancel()
    }

    console.log('[TaskList] 组件清理完成')
  } catch (error) {
    console.error('[TaskList] 组件清理失败:', error)
  }
})

// 方法
const loadTaskList = async () => {
  if (!isComponentMounted.value) return

  try {
    await promotionStore.loadAgentTaskList(filters.value)
  } catch (error) {
    console.error('加载任务列表失败:', error)

    // 只有在组件仍然挂载时才显示错误提示
    if (!isComponentMounted.value) return

    // 根据错误类型显示不同的提示
    let errorMessage = '无法加载任务列表，请稍后重试'

    if (error instanceof Error) {
      if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试'
      } else if (error.message.includes('权限')) {
        errorMessage = '没有权限访问任务列表'
      } else if (error.message.includes('超时')) {
        errorMessage = '请求超时，请稍后重试'
      }
    }

    toast({
      title: '加载失败',
      description: errorMessage,
      variant: 'destructive'
    })
  }
}

const loadTaskStats = async () => {
  if (!isComponentMounted.value) return

  try {
    await promotionStore.loadAgentTaskStats()
  } catch (error) {
    console.error('加载统计数据失败:', error)

    // 统计数据加载失败不显示toast，只在控制台记录
    // 因为这不是关键功能，不应该干扰用户
  }
}

const handleFilterChange = () => {
  if (filters.value.keyword) {
    debouncedFilterChange()
  } else {
    filters.value.page = 1
    loadTaskList()
  }
}

const resetFilters = () => {
  filters.value = {
    keyword: '',
    status: 'all',
    platform: 'all',
    contentType: 'all',
    page: 1,
    pageSize: 20
  }
  selectedTimeRange.value = 'all'
  customDateRange.value = {
    startDate: '',
    endDate: ''
  }
  loadTaskList()
}

// 处理时间范围选择
const handleTimeRangeSelect = (range: string) => {
  selectedTimeRange.value = range

  const today = new Date()
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  switch (range) {
    case 'all':
      filters.value.dateRange = undefined
      break
    case 'today':
      filters.value.dateRange = {
        startDate: formatDate(today),
        endDate: formatDate(today)
      }
      break
    case 'week':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      filters.value.dateRange = {
        startDate: formatDate(weekAgo),
        endDate: formatDate(today)
      }
      break
    case 'month':
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      filters.value.dateRange = {
        startDate: formatDate(monthAgo),
        endDate: formatDate(today)
      }
      break
    case 'quarter':
      const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      filters.value.dateRange = {
        startDate: formatDate(quarterAgo),
        endDate: formatDate(today)
      }
      break
    case 'custom':
      // 自定义范围，不自动设置日期
      break
  }

  if (range !== 'custom') {
    filters.value.page = 1
    loadTaskList()
  }
}

// 处理自定义日期范围变化
const handleCustomDateChange = () => {
  if (customDateRange.value.startDate && customDateRange.value.endDate) {
    selectedTimeRange.value = 'custom'
    filters.value.dateRange = {
      startDate: customDateRange.value.startDate,
      endDate: customDateRange.value.endDate
    }
    filters.value.page = 1
    loadTaskList()
  } else if (!customDateRange.value.startDate && !customDateRange.value.endDate) {
    // 如果两个日期都清空了，则清除日期筛选
    filters.value.dateRange = undefined
    filters.value.page = 1
    loadTaskList()
  }
}

const handlePageChange = (page: number) => {
  filters.value.page = page
  loadTaskList()
}

const handlePageSizeChange = (pageSize: string | number) => {
  const newPageSize = typeof pageSize === 'string' ? parseInt(pageSize) : pageSize
  filters.value.pageSize = newPageSize
  filters.value.page = 1
  loadTaskList()
}

// 跳转到指定页面
const handleJumpToPage = () => {
  const page = typeof jumpToPage.value === 'string' ? parseInt(jumpToPage.value) : jumpToPage.value

  if (page && page >= 1 && page <= agentTaskPagination.value.totalPages) {
    filters.value.page = page
    loadTaskList()
  } else {
    // 重置为当前页面
    jumpToPage.value = agentTaskPagination.value.page

    if (page && (page < 1 || page > agentTaskPagination.value.totalPages)) {
      toast({
        title: '页码无效',
        description: `请输入1-${agentTaskPagination.value.totalPages}之间的页码`,
        variant: 'destructive'
      })
    }
  }
}

const handleRowClick = (task: PromotionTask) => {
  handleViewDetail(task)
}

const handleViewDetail = (task: PromotionTask) => {
  currentTask.value = task
  showDetailSidebar.value = true
}

const handleCloseSidebar = () => {
  showDetailSidebar.value = false
  currentTask.value = null
}

const goToSubmitTask = () => {
  router.push('/promotion/submit')
}

const loadTestData = async () => {
  try {
    console.log('[TaskList] 开始加载数据...')

    // 加载任务列表和统计数据
    await Promise.all([
      loadTaskList(),
      loadTaskStats()
    ])

    if (isComponentMounted.value) {
      toast({
        title: '数据加载成功',
        description: `已加载 ${agentTaskList.value.length} 条任务数据`,
        variant: 'default'
      })
    }

    console.log('[TaskList] 数据加载完成，任务数量:', agentTaskList.value.length)

  } catch (error) {
    if (isComponentMounted.value) {
      console.error('[TaskList] 加载数据失败:', error)
      toast({
        title: '加载失败',
        description: '无法加载数据，请稍后重试',
        variant: 'destructive'
      })
    }
  }
}

const refreshData = async () => {
  try {
    // 显示刷新状态
    const refreshPromises = [
      loadTaskList(),
      loadTaskStats()
    ]

    await Promise.allSettled(refreshPromises)

    // 只有在没有错误的情况下才显示成功提示
    if (!agentTaskError.value) {
      toast({
        title: '刷新成功',
        description: '数据已更新',
        variant: 'default'
      })
    }
  } catch (error) {
    console.error('刷新数据失败:', error)
    toast({
      title: '刷新失败',
      description: '数据刷新失败，请稍后重试',
      variant: 'destructive'
    })
  }
}

// 重试加载数据（带指数退避）
const retryLoadData = async (retryCount = 0, maxRetries = 3) => {
  try {
    await loadTaskList()
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000 // 指数退避：1s, 2s, 4s
      console.log(`加载失败，${delay}ms后重试 (${retryCount + 1}/${maxRetries})`)

      setTimeout(() => {
        retryLoadData(retryCount + 1, maxRetries)
      }, delay)
    } else {
      console.error('重试次数已达上限，加载失败')
    }
  }
}

// 切换高级筛选显示
const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

// 查看审核进度
const handleCheckAuditProgress = (task: PromotionTask) => {
  toast({
    title: '审核进度',
    description: `任务 ${task.id} 正在审核中，预计1-3个工作日内完成`,
    variant: 'default'
  })
}

// 查看拒绝原因
const handleViewRejectReason = (task: PromotionTask) => {
  const reason = task.auditComment || '暂无详细拒绝原因'
  toast({
    title: '拒绝原因',
    description: reason,
    variant: 'destructive'
  })
}
</script>

<style scoped>
.task-list-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-950;
}
</style>
