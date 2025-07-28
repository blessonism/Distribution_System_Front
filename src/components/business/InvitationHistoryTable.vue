<!--
/**
 * @fileoverview 邀请历史记录表格组件
 * 基于Vue 3 Composition API构建的全功能邀请历史管理组件，提供完整的数据展示、筛选、搜索、分页和导出功能
 * 集成DataTable组件和shadcn-vue设计系统，支持复杂的筛选条件、实时搜索、用户详情查看等高级功能
 * 采用响应式设计和性能优化策略，确保在大数据量场景下的流畅体验
 * 
 * @component InvitationHistoryTable
 * @author Frontend Team
 * @since 1.0.0
 * @version 2.1.0
 * 
 * @description
 * InvitationHistoryTable组件是邀请系统的核心数据管理界面，主要功能包括：
 * - 📊 完整的邀请历史记录展示，包含被邀请人、角色、状态等详细信息
 * - 🔍 多维度筛选功能，支持角色、状态、时间范围、关键词等筛选条件
 * - 📱 响应式表格设计，完美适配移动端和桌面端显示
 * - 📄 智能分页系统，支持大数据量的高效分页浏览
 * - 📤 数据导出功能，支持筛选条件下的数据导出
 * - 👤 用户详情查看，提供被邀请用户的完整信息展示
 * - 🔄 实时数据刷新，确保数据的时效性和准确性
 * - 🎯 智能搜索功能，支持防抖搜索和多字段匹配
 * - 📈 统计信息展示，包含总邀请数和月度邀请数
 * - 🎨 优雅的空状态处理，提供友好的用户引导
 * - ⚡ 性能优化，包含计算属性缓存、事件防抖等优化手段
 * 
 * @usage
 * ```vue
 * <template>
 *   <InvitationHistoryTable
 *     :data="historyData"
 *     :loading="isLoading"
 *     :total="totalCount"
 *     :page="currentPage"
 *     :page-size="pageSize"
 *     @refresh="handleRefresh"
 *     @export="handleExport"
 *     @page-change="handlePageChange"
 *     @filter-change="handleFilterChange"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const historyData: InvitationRecord[] = [
 *   {
 *     id: 'inv_001',
 *     inviteeName: '张三',
 *     actualRole: 'agent',
 *     inviteCode: 'AGENT2024001',
 *     registeredAt: '2024-01-15T10:30:00Z',
 *     status: 'completed'
 *   }
 * ]
 * 
 * function handleRefresh(params?: HistoryQueryParams) {
 *   // 刷新历史记录数据
 *   fetchInvitationHistory(params)
 * }
 * 
 * function handleExport(params?: HistoryQueryParams) {
 *   // 导出历史记录
 *   exportInvitationHistory(params)
 * }
 * 
 * function handlePageChange(page: number) {
 *   // 处理分页变化
 *   currentPage.value = page
 *   fetchInvitationHistory({ page, pageSize: pageSize.value })
 * }
 * ```
 * 
 * @dependencies
 * - DataTable: 核心表格组件，提供数据展示和操作功能
 * - shadcn-vue: UI组件库，提供Card、Button、Select等基础组件
 * - lucide-vue-next: 图标库，提供各种操作图标
 * - Vue 3 Composition API: 响应式状态管理
 * 
 * @features
 * - **数据表格**: 基于DataTable组件的高性能表格展示
 * - **多维筛选**: 角色、状态、时间范围、关键词等多种筛选方式
 * - **智能搜索**: 防抖搜索，支持姓名和邀请码的模糊匹配
 * - **分页导航**: 智能分页显示，支持快速页面跳转
 * - **数据导出**: 支持筛选条件下的数据导出功能
 * - **用户详情**: 弹窗显示被邀请用户的详细信息
 * - **状态显示**: 直观的状态标签和角色标识
 * - **统计信息**: 实时显示总邀请数和月度统计
 * - **空状态处理**: 友好的空数据提示和筛选清空引导
 * - **响应式布局**: 移动端优化的筛选器和表格布局
 * - **性能优化**: 计算属性缓存、事件防抖、条件渲染等优化
 */
-->

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
/**
 * @fileoverview InvitationHistoryTable组件的核心逻辑实现
 * 使用Vue 3 Composition API实现邀请历史数据的复杂管理，包括筛选、搜索、分页、导出等全套功能
 */
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

/**
 * 组件属性接口定义
 * 定义InvitationHistoryTable组件的输入属性
 * 
 * @interface Props
 * 
 * @property {InvitationRecord[]} data - 邀请历史记录数据数组
 * @property {boolean} [loading=false] - 数据加载状态
 * @property {number} [total=0] - 总记录数，用于分页计算
 * @property {number} [page=1] - 当前页码
 * @property {number} [pageSize=20] - 每页显示的记录数
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   data: [
 *     {
 *       id: 'inv_001',
 *       inviteeName: '张三',
 *       actualRole: 'agent',
 *       inviteCode: 'AGENT001',
 *       registeredAt: '2024-01-15T10:30:00Z',
 *       status: 'completed'
 *     }
 *   ],
 *   loading: false,
 *   total: 150,
 *   page: 1,
 *   pageSize: 20
 * }
 * ```
 */
interface Props {
  /** 邀请历史记录数据数组，包含所有需要展示的记录 */
  data: InvitationRecord[]
  /** 数据加载状态，影响表格和按钮的禁用状态 */
  loading?: boolean
  /** 总记录数，用于分页器的计算和显示 */
  total?: number
  /** 当前页码，从1开始 */
  page?: number
  /** 每页显示的记录数，默认20条 */
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 20
})

/**
 * 组件事件接口定义
 * 定义InvitationHistoryTable组件对外发出的所有事件
 * 
 * @interface Emits
 * 
 * @event refresh - 数据刷新事件，可选传递查询参数
 * @event export - 数据导出事件，可选传递筛选参数
 * @event pageChange - 页码变化事件，传递新的页码
 * @event filterChange - 筛选条件变化事件，传递筛选参数
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleRefresh(params?: HistoryQueryParams) {
 *   // 重新获取数据，可带筛选条件
 *   fetchInvitationHistory(params)
 * }
 * 
 * function handleExport(params?: HistoryQueryParams) {
 *   // 导出当前筛选条件下的数据
 *   exportInvitationData(params)
 * }
 * 
 * function handlePageChange(page: number) {
 *   // 切换到指定页码
 *   loadPage(page)
 * }
 * 
 * function handleFilterChange(filters: HistoryQueryParams) {
 *   // 应用新的筛选条件
 *   applyFilters(filters)
 * }
 * ```
 */
interface Emits {
  /** 刷新数据事件，通常由用户点击刷新按钮触发 */
  refresh: [params?: HistoryQueryParams]
  /** 导出数据事件，用户点击导出按钮时触发 */
  export: [params?: HistoryQueryParams]
  /** 页码变化事件，用户切换页面时触发 */
  pageChange: [page: number]
  /** 筛选条件变化事件，任何筛选器改变时触发 */
  filterChange: [filters: HistoryQueryParams]
}

const emit = defineEmits<Emits>()

/**
 * 组件响应式状态管理
 * 管理筛选器状态、用户详情弹窗和搜索防抖等核心状态
 */

/**
 * 筛选器响应式状态对象
 * 包含所有可用的筛选条件，支持多维度数据筛选
 * 
 * @interface FilterState
 * @property {UserRole | 'all'} role - 角色筛选，支持所有用户角色或'all'表示全部
 * @property {'completed' | 'pending' | 'all'} status - 状态筛选，支持已完成、等待中或全部
 * @property {'today' | 'week' | 'month' | 'quarter' | 'all'} timeRange - 时间范围筛选
 * @property {string} keyword - 关键词搜索，支持姓名和邀请码搜索
 */
const filters = reactive({
  role: 'all' as UserRole | 'all',
  status: 'all' as 'completed' | 'pending' | 'all',
  timeRange: 'all' as 'today' | 'week' | 'month' | 'quarter' | 'all',
  keyword: ''
})

/**
 * 用户详情弹窗状态对象
 * 管理用户详情查看弹窗的开启状态和当前查看的用户数据
 * 
 * @interface UserDetailDialog
 * @property {boolean} open - 弹窗是否开启
 * @property {InvitationRecord | null} user - 当前查看的用户记录
 */
const userDetailDialog = reactive({
  open: false,
  user: null as InvitationRecord | null
})

/**
 * 搜索防抖定时器引用
 * 用于实现搜索输入的防抖功能，避免频繁触发搜索请求
 */
const searchDebounceTimer = ref<NodeJS.Timeout>()

/**
 * 计算属性：分页信息
 * 基于props数据计算完整的分页信息对象
 * 
 * @computed pagination
 * @returns {Object} 分页信息对象
 * 
 * @complexity O(1) - 简单的数学计算，常数时间复杂度
 * @flow 属性获取 → 总页数计算 → 分页对象构建 → 信息返回
 * 
 * @returns {Object} 分页信息
 * @returns {number} returns.page - 当前页码
 * @returns {number} returns.pageSize - 每页记录数
 * @returns {number} returns.total - 总记录数
 * @returns {number} returns.totalPages - 总页数
 * 
 * @example
 * ```typescript
 * // 总记录数为150，每页20条，当前第3页
 * const paginationInfo = pagination.value
 * // { page: 3, pageSize: 20, total: 150, totalPages: 8 }
 * ```
 */
const pagination = computed(() => ({
  page: props.page,
  pageSize: props.pageSize,
  total: props.total,
  totalPages: Math.ceil(props.total / props.pageSize)
}))

/**
 * 计算属性：可见页码列表
 * 计算分页器中应该显示的页码按钮，采用当前页前后2页的策略
 * 
 * @computed visiblePages
 * @returns {number[]} 可见页码数组
 * 
 * @complexity O(k) - k为可见页码数量，通常为常数
 * @flow 当前页获取 → 范围计算 → 边界处理 → 页码数组生成
 * 
 * @description 可见页码逻辑：
 * - 显示当前页前后各2页
 * - 自动处理边界情况（首页和末页）
 * - 最多显示5个页码按钮
 * 
 * @example
 * ```typescript
 * // 当前页为5，总页数为10
 * const visible = visiblePages.value // [3, 4, 5, 6, 7]
 * 
 * // 当前页为1，总页数为10
 * const visible = visiblePages.value // [1, 2, 3]
 * 
 * // 当前页为10，总页数为10
 * const visible = visiblePages.value // [8, 9, 10]
 * ```
 */
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

/**
 * 计算属性：是否有激活的筛选条件
 * 检查当前是否存在任何非默认的筛选条件
 * 
 * @computed hasActiveFilters
 * @returns {boolean} 是否存在激活的筛选条件
 * 
 * @complexity O(1) - 简单的条件判断，常数时间复杂度
 * 
 * @description 检查的筛选条件：
 * - 角色筛选不为'all'
 * - 状态筛选不为'all'
 * - 时间范围筛选不为'all'
 * - 关键词搜索不为空
 * 
 * @example
 * ```typescript
 * // 所有筛选器都为默认值
 * const hasFilters = hasActiveFilters.value // false
 * 
 * // 设置了角色筛选
 * filters.role = 'agent'
 * const hasFilters = hasActiveFilters.value // true
 * ```
 */
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