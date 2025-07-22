<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center space-x-2">
            <History class="w-5 h-5" />
            <span>邀请历史</span>
          </CardTitle>
          <CardDescription>
            查看您的邀请记录和下级用户信息
          </CardDescription>
        </div>
        
        <!-- 统计信息 -->
        <div class="flex items-center space-x-4 text-sm">
          <div class="text-center">
            <div class="font-semibold text-lg">{{ totalInvitations }}</div>
            <div class="text-muted-foreground">总邀请数</div>
          </div>
          <Separator orientation="vertical" class="h-8" />
          <div class="text-center">
            <div class="font-semibold text-lg">{{ monthlyInvitations }}</div>
            <div class="text-muted-foreground">本月邀请</div>
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <DataTable
        :data="filteredData"
        :columns="tableColumns"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #toolbar>
          <div class="flex flex-wrap items-center gap-4">
            <!-- 角色筛选 -->
            <div class="flex items-center space-x-2">
              <Label class="text-sm">角色</Label>
              <Select v-model="filters.role" @update:model-value="applyFilters">
                <SelectTrigger class="w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="director">销售总监</SelectItem>
                  <SelectItem value="leader">销售组长</SelectItem>
                  <SelectItem value="sales">销售</SelectItem>
                  <SelectItem value="agent">代理</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 状态筛选 -->
            <div class="flex items-center space-x-2">
              <Label class="text-sm">状态</Label>
              <Select v-model="filters.status" @update:model-value="applyFilters">
                <SelectTrigger class="w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="pending">等待中</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 时间范围筛选 -->
            <div class="flex items-center space-x-2">
              <Label class="text-sm">时间</Label>
              <Select v-model="filters.timeRange" @update:model-value="applyFilters">
                <SelectTrigger class="w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 搜索框 -->
            <div class="flex items-center space-x-2">
              <Input
                v-model="filters.keyword"
                placeholder="搜索被邀请人..."
                class="w-64"
                @input="debounceSearch"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                @click="clearSearch"
                v-if="filters.keyword"
              >
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </template>

        <template #actions>
          <div class="flex items-center space-x-2">
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

            <!-- 导出按钮 -->
            <Button 
              variant="outline" 
              size="sm" 
              @click="handleExport"
              :disabled="loading || filteredData.length === 0"
            >
              <Download class="w-4 h-4 mr-1" />
              导出
            </Button>

            <!-- 清空筛选 -->
            <Button 
              variant="ghost" 
              size="sm" 
              @click="clearFilters"
              v-if="hasActiveFilters"
            >
              <FilterX class="w-4 h-4 mr-1" />
              清空筛选
            </Button>
          </div>
        </template>

        <!-- 空状态 -->
        <template #empty>
          <div class="text-center py-12">
            <Users class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 class="font-medium mb-2">暂无邀请记录</h3>
            <p class="text-sm text-muted-foreground mb-4">
              {{ hasActiveFilters ? '没有符合筛选条件的邀请记录' : '您还没有邀请过其他用户' }}
            </p>
            <Button 
              v-if="hasActiveFilters" 
              variant="outline" 
              @click="clearFilters"
            >
              清空筛选条件
            </Button>
          </div>
        </template>
      </DataTable>

      <!-- 分页器 -->
      <div 
        v-if="pagination.total > 0" 
        class="flex items-center justify-between mt-6"
      >
        <div class="text-sm text-muted-foreground">
          共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ pagination.totalPages }} 页
        </div>
        
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page <= 1 || loading"
            @click="changePage(pagination.page - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
            上一页
          </Button>
          
          <!-- 页码按钮 -->
          <div class="flex items-center space-x-1">
            <Button
              v-for="pageNum in visiblePages"
              :key="pageNum"
              :variant="pageNum === pagination.page ? 'default' : 'outline'"
              size="sm"
              class="w-8 h-8 p-0"
              :disabled="loading"
              @click="changePage(pageNum)"
            >
              {{ pageNum }}
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.page >= pagination.totalPages || loading"
            @click="changePage(pagination.page + 1)"
          >
            下一页
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>

    <!-- 用户详情弹窗 -->
    <Dialog v-model:open="userDetailDialog.open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
          <DialogDescription>
            查看被邀请用户的详细信息
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="userDetailDialog.user" class="space-y-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">用户名</Label>
              <p class="font-medium">{{ userDetailDialog.user.inviteeName }}</p>
            </div>
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">角色</Label>
              <Badge variant="outline">
                {{ getRoleDisplayName(userDetailDialog.user.actualRole) }}
              </Badge>
            </div>
          </div>

          <!-- 邀请信息 -->
          <Separator />
          <div class="space-y-3">
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">邀请码</Label>
              <p class="font-mono text-sm">{{ userDetailDialog.user.inviteCode }}</p>
            </div>
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">注册时间</Label>
              <p class="text-sm">{{ formatDateTime(userDetailDialog.user.registeredAt) }}</p>
            </div>
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">状态</Label>
              <Badge :variant="userDetailDialog.user.status === 'completed' ? 'default' : 'secondary'">
                {{ userDetailDialog.user.status === 'completed' ? '已完成' : '等待中' }}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="userDetailDialog.open = false">
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch, h } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import DataTable from '@/components/business/DataTable.vue'
import { 
  History,
  Users,
  RefreshCw,
  Download,
  FilterX,
  X,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-vue-next'
import type { InvitationRecord, HistoryQueryParams } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { getRoleDisplayName } from '@/api/invitation'

// Props 定义
interface Props {
  data: InvitationRecord[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 20
})

// Emits 定义
interface Emits {
  refresh: [params?: HistoryQueryParams]
  export: [params?: HistoryQueryParams]
  pageChange: [page: number]
  filterChange: [filters: HistoryQueryParams]
}

const emit = defineEmits<Emits>()

// 响应式数据
const filters = reactive({
  role: 'all' as UserRole | 'all',
  status: 'all' as 'completed' | 'pending' | 'all',
  timeRange: 'all' as 'today' | 'week' | 'month' | 'quarter' | 'all',
  keyword: ''
})

const userDetailDialog = reactive({
  open: false,
  user: null as InvitationRecord | null
})

const searchDebounceTimer = ref<NodeJS.Timeout>()

// 计算属性
const pagination = computed(() => ({
  page: props.page,
  pageSize: props.pageSize,
  total: props.total,
  totalPages: Math.ceil(props.total / props.pageSize)
}))

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const visible = []
  
  // 简单的分页逻辑：显示当前页前后2页
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    visible.push(i)
  }
  
  return visible
})

const hasActiveFilters = computed(() => {
  return filters.role !== 'all' ||
         filters.status !== 'all' ||
         filters.timeRange !== 'all' ||
         filters.keyword.trim() !== ''
})

const filteredData = computed(() => {
  let result = [...props.data]
  
  // 角色筛选
  if (filters.role !== 'all') {
    result = result.filter(item => item.actualRole === filters.role)
  }
  
  // 状态筛选
  if (filters.status !== 'all') {
    result = result.filter(item => item.status === filters.status)
  }
  
  // 时间范围筛选
  if (filters.timeRange !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    result = result.filter(item => {
      const itemDate = new Date(item.registeredAt)
      
      switch (filters.timeRange) {
        case 'today':
          return itemDate >= today
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          return itemDate >= weekStart
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          return itemDate >= monthStart
        case 'quarter':
          const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
          return itemDate >= quarterStart
        default:
          return true
      }
    })
  }
  
  // 关键词搜索
  if (filters.keyword.trim()) {
    const keyword = filters.keyword.trim().toLowerCase()
    result = result.filter(item =>
      item.inviteeName.toLowerCase().includes(keyword) ||
      item.inviteCode.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const totalInvitations = computed(() => props.total)

const monthlyInvitations = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return props.data.filter(item => {
    const itemDate = new Date(item.registeredAt)
    return itemDate >= monthStart
  }).length
})

const tableColumns = computed(() => [
  {
    id: 'inviteeName',
    header: '被邀请人',
    accessorKey: 'inviteeName',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      // 直接返回简单的字符串用于调试
      return h('div', { class: 'font-medium' }, row.original.inviteeName)
    }
  },
  {
    id: 'actualRole',
    header: '角色',
    accessorKey: 'actualRole',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      const roleName = getRoleDisplayName(row.original.actualRole)
      return h('span', { 
        class: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800' 
      }, roleName)
    }
  },
  {
    id: 'inviteCode',
    header: '邀请码',
    accessorKey: 'inviteCode',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      return h('code', { 
        class: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm' 
      }, row.original.inviteCode)
    }
  },
  {
    id: 'registeredAt',
    header: '注册时间',
    accessorKey: 'registeredAt',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      return formatDate(row.original.registeredAt)
    }
  },
  {
    id: 'status',
    header: '状态',
    accessorKey: 'status',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      const isCompleted = row.original.status === 'completed'
      const text = isCompleted ? '已完成' : '等待中'
      return h('span', { 
        class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }` 
      }, text)
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: { row: { original: InvitationRecord } }) => {
      return h('button', {
        class: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8',
        onClick: () => {
          // 使用类型断言来访问全局方法
          const win = window as any
          if (win.viewUserDetail) {
            win.viewUserDetail(row.original.id)
          }
        }
      }, [
        h('svg', {
          class: 'w-4 h-4',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          innerHTML: `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          `
        })
      ])
    }
  }
])

// 挂载时设置全局方法
onMounted(() => {
  (window as any).viewUserDetail = (recordId: string) => {
    const user = props.data.find(item => item.id === recordId)
    if (user) {
      userDetailDialog.user = user
      userDetailDialog.open = true
    }
  }
})

// 监听筛选条件变化
watch(filters, (newFilters) => {
  const params: HistoryQueryParams = {
    page: 1, // 筛选时重置到第一页
    pageSize: props.pageSize
  }
  
  if (newFilters.role !== 'all') {
    params.role = newFilters.role as UserRole
  }
  
  if (newFilters.keyword.trim()) {
    params.keyword = newFilters.keyword.trim()
  }
  
  // 添加时间范围到参数中
  if (newFilters.timeRange !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (newFilters.timeRange) {
      case 'today':
        params.startDate = today.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        params.startDate = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        params.startDate = monthStart.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        params.startDate = quarterStart.toISOString().split('T')[0]
        break
    }
  }
  
  emit('filterChange', params)
}, { deep: true })

// 方法
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const debounceSearch = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  searchDebounceTimer.value = setTimeout(() => {
    applyFilters()
  }, 300)
}

const clearSearch = () => {
  filters.keyword = ''
  applyFilters()
}

const applyFilters = () => {
  // 筛选逻辑已在 watch 中处理
}

const clearFilters = () => {
  filters.role = 'all'
  filters.status = 'all'
  filters.timeRange = 'all'
  filters.keyword = ''
}

const handleRefresh = () => {
  const params: HistoryQueryParams = {
    page: props.page,
    pageSize: props.pageSize
  }
  
  emit('refresh', params)
}

const handleExport = () => {
  const params: HistoryQueryParams = {}
  
  if (filters.role !== 'all') {
    params.role = filters.role as UserRole
  }
  
  if (filters.keyword.trim()) {
    params.keyword = filters.keyword.trim()
  }
  
  emit('export', params)
  
  toast({
    title: '导出已开始',
    description: '请稍候，正在准备导出文件...',
  })
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages && !props.loading) {
    emit('pageChange', page)
  }
}
</script>

<style scoped>
/* 表格样式优化 */
:deep(.data-table) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.data-table th) {
  background-color: hsl(var(--muted));
  font-weight: 500;
}

:deep(.data-table tr:hover) {
  background-color: hsl(var(--muted) / 0.5);
}

/* 筛选器响应式布局 */
@media (max-width: 768px) {
  .toolbar-filters {
    flex-direction: column;
    gap: 1rem;
  }
  
  .toolbar-filters > div {
    width: 100%;
  }
}

/* 分页器样式 */
.pagination-button {
  transition: all 0.2s ease-in-out;
}

.pagination-button:hover {
  transform: translateY(-1px);
}
</style>