/**
 * @fileoverview 推广审核业务逻辑组合式API模块
 * 提供完整的推广任务审核功能，包括权限控制、列表管理、筛选搜索、分页操作、任务选择、批量审核、历史记录和统计数据等
 * 
 * @module composables/usePromotionAudit
 * @requires vue
 * @requires @/store/promotion
 * @requires @/store/user
 * @requires @/composables/useDebounce
 * @requires @/types/promotion
 * @requires @/utils/permissionControl
 * @requires @/api/promotion
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { usePromotionStore } from '@/store/promotion'
import { useUserStore } from '@/store/user'
import { useDebounce } from '@/composables/useDebounce'
import type {
  PromotionTask,
  AuditRequest,
  AuditFilterParams,
  PromotionStatus,
  PromotionPlatform,
  PromotionContentType
} from '@/types/promotion'
import { PermissionCheck } from '@/utils/permissionControl'
import { validateAuditRequest } from '@/api/promotion'

/**
 * 审核权限状态接口
 */
export interface AuditPermissions {
  canViewList: boolean
  canViewDetail: boolean
  canAudit: boolean
  canExport: boolean
  canBatchAudit: boolean
  canViewStats: boolean
  hasDataScope: boolean
  errorMessage?: string
}

/**
 * 审核操作状态接口
 */
export interface AuditOperationState {
  loading: boolean
  error: string | null
  success: boolean
  data: any
}

/**
 * 推广审核主要业务逻辑组合式API
 * 提供完整的推广任务审核功能，包括权限控制、列表管理、筛选搜索、分页操作等
 * 
 * @function usePromotionAudit
 * @returns {Object} 推广审核相关的状态、计算属性和操作方法
 * @complexity O(1) - 初始化为常数时间，具体操作复杂度取决于调用的方法
 * @flow 初始化状态 -> 权限检查 -> 提供数据访问 -> 提供操作方法
 * 
 * @example
 * ```typescript
 * const {
 *   permissions,
 *   auditList,
 *   listLoading,
 *   initialize,
 *   refresh,
 *   updateFilters,
 *   changePage
 * } = usePromotionAudit()
 * 
 * // 初始化审核列表
 * await initialize(true) // 启用自动刷新
 * 
 * // 筛选任务
 * await updateFilters({ status: 'PENDING_MANUAL_AUDIT' })
 * 
 * // 分页操作
 * await changePage(2)
 * ```
 */
export function usePromotionAudit() {
  const promotionStore = usePromotionStore()
  const userStore = useUserStore()

  // 初始化权限
  promotionStore.initializePermissions()

  // 响应式状态
  const isInitialized = ref(false)
  const refreshTimer = ref<number | null>(null)

  /**
   * 权限检查计算属性
   * 基于当前用户角色动态检查推广审核相关的所有权限
   * 
   * @complexity O(1) - 权限检查为常数时间复杂度，基于角色映射
   * @flow
   * 1. 获取当前用户角色信息
   * 2. 如果用户未登录或角色缺失，返回无权限状态
   * 3. 使用PermissionCheck工具检查各项权限
   * 4. 返回完整的权限状态对象
   * 
   * @example
   * ```typescript
   * // 检查用户权限
   * if (permissions.value.canViewList) {
   *   console.log('用户可以查看审核列表')
   * }
   * 
   * if (permissions.value.canBatchAudit) {
   *   console.log('用户可以执行批量审核')
   * }
   * 
   * // 权限错误处理
   * if (permissions.value.errorMessage) {
   *   console.error('权限检查失败:', permissions.value.errorMessage)
   * }
   * ```
   * 
   * @returns 完整的审核权限状态对象
   */
  const permissions = computed<AuditPermissions>(() => {
    const userRole = userStore.userRole
    
    if (!userRole) {
      return {
        canViewList: false,
        canViewDetail: false,
        canAudit: false,
        canExport: false,
        canBatchAudit: false,
        canViewStats: false,
        hasDataScope: false,
        errorMessage: '用户未登录或角色信息缺失'
      }
    }

    return {
      canViewList: PermissionCheck.canAccessPromotionAudit(userRole).hasPermission,
      canViewDetail: PermissionCheck.canViewPromotionTaskDetail(userRole).hasPermission,
      canAudit: PermissionCheck.canApprovePromotionTask(userRole).hasPermission,
      canExport: PermissionCheck.canExportPromotionAuditData(userRole).hasPermission,
      canBatchAudit: PermissionCheck.canBatchAuditPromotion(userRole).hasPermission,
      canViewStats: PermissionCheck.canViewPromotionAuditStats(userRole).hasPermission,
      hasDataScope: true // 基于角色的数据范围权限
    }
  })

  /**
   * 基础数据访问计算属性
   * 提供对Store中审核数据的响应式访问，包括列表、状态、分页等核心数据
   * 
   * @complexity O(1) - 响应式计算属性访问为常数时间
   * @flow
   * 1. 通过computed包装Store状态
   * 2. 建立响应式连接
   * 3. 自动同步数据变化
   * 
   * @example
   * ```typescript
   * // 访问审核列表
   * console.log('当前审核任务:', auditList.value)
   * 
   * // 检查加载状态
   * if (listLoading.value) {
   *   console.log('正在加载审核数据...')
   * }
   * 
   * // 获取分页信息
   * const { current, size, total } = pagination.value
   * console.log(`第${current}页，共${total}条记录`)
   * ```
   */
  const auditList = computed(() => promotionStore.auditList)
  const listLoading = computed(() => promotionStore.listLoading)
  const listError = computed(() => promotionStore.listError)
  const pagination = computed(() => promotionStore.pagination)
  const filters = computed(() => promotionStore.filters)
  const selectedTasks = computed(() => promotionStore.selectedTasks)
  const currentTask = computed(() => promotionStore.currentTask)
  const auditStats = computed(() => promotionStore.auditStats)
  const myStats = computed(() => promotionStore.myStats)

  /**
   * 业务计算属性
   * 基于基础数据计算的业务状态，用于UI展示和逻辑判断
   * 
   * @complexity O(1) - 简单的数据状态检查为常数时间
   * @flow
   * 1. 基于基础数据进行逻辑运算
   * 2. 提供便捷的状态访问方式
   * 3. 支持UI条件渲染和业务逻辑判断
   * 
   * @example
   * ```typescript
   * // 检查数据状态
   * if (hasData.value) {
   *   console.log('有审核数据可显示')
   * }
   * 
   * if (isEmpty.value) {
   *   console.log('暂无审核数据')
   * }
   * 
   * // 获取快速统计
   * const stats = quickStats.value
   * console.log(`总计${stats.total}个任务，待审核${stats.pending}个`)
   * ```
   */
  const hasData = computed(() => auditList.value.length > 0)
  const isEmpty = computed(() => !listLoading.value && auditList.value.length === 0)
  const hasError = computed(() => !!listError.value)
  const hasPermission = computed(() => permissions.value.canViewList)
  
  const quickStats = computed(() => ({
    total: pagination.value.total,
    pending: promotionStore.pendingTasksCount,
    todayAudited: promotionStore.todayAuditedCount,
    approvalRate: promotionStore.approvalRate,
    platformStats: promotionStore.platformStats,
    statusStats: promotionStore.statusStats
  }))

  /**
   * 初始化审核数据
   * 加载审核列表和统计数据，可选择启用自动刷新机制
   * 
   * @param {boolean} autoRefresh - 是否启用自动刷新，默认false
   * @returns {Promise<void>}
   * @complexity O(1) - 并行API调用，时间复杂度取决于网络延迟
   * @flow 权限检查 -> 并行加载数据 -> 设置自动刷新 -> 更新状态
   * 
   * @example
   * ```typescript
   * // 基础初始化
   * await initialize()
   * 
   * // 启用自动刷新的初始化
   * await initialize(true)
   * ```
   */
  const initialize = async (autoRefresh = false) => {
    if (!permissions.value.canViewList) {
      console.warn('[usePromotionAudit] 用户没有查看审核列表的权限')
      return
    }

    try {
      // 加载审核列表
      await promotionStore.loadAuditList()
      
      // 加载统计数据
      if (permissions.value.canViewStats) {
        await Promise.all([
          promotionStore.loadAuditStats(),
          promotionStore.loadMyStats()
        ])
      }

      isInitialized.value = true

      // 设置自动刷新
      if (autoRefresh) {
        startAutoRefresh()
      }

      console.log('[usePromotionAudit] 初始化完成')

    } catch (error) {
      console.error('[usePromotionAudit] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 刷新审核数据
   * 重新加载审核列表和统计数据，保持当前筛选条件
   * 
   * @returns {Promise<void>}
   * @complexity O(1) - API调用的时间复杂度取决于网络延迟
   * @flow 权限检查 -> 刷新列表数据 -> 刷新统计数据 -> 记录日志
   * 
   * @example
   * ```typescript
   * // 手动刷新数据
   * try {
   *   await refresh()
   *   console.log('数据刷新成功')
   * } catch (error) {
   *   console.error('刷新失败:', error)
   * }
   * ```
   */
  const refresh = async () => {
    if (!permissions.value.canViewList) return

    try {
      await promotionStore.refreshAuditList()
      
      if (permissions.value.canViewStats) {
        await promotionStore.loadMyStats()
      }

      console.log('[usePromotionAudit] 数据刷新完成')

    } catch (error) {
      console.error('[usePromotionAudit] 数据刷新失败:', error)
      throw error
    }
  }

  /**
   * 启动自动刷新机制
   * 设置定时器定期刷新审核数据，确保数据的实时性
   * 
   * @complexity O(1) - 定时器设置为常数时间操作
   * @flow
   * 1. 清除已存在的定时器（如果有）
   * 2. 创建新的间隔定时器
   * 3. 在定时器回调中检查权限和加载状态
   * 4. 执行数据刷新并处理错误
   * 
   * @example
   * ```typescript
   * // 使用默认间隔（30秒）启动自动刷新
   * startAutoRefresh()
   * 
   * // 使用自定义间隔（60秒）启动自动刷新
   * startAutoRefresh(60000)
   * 
   * // 在页面激活时启动自动刷新
   * onMounted(() => {
   *   startAutoRefresh()
   * })
   * ```
   * 
   * @param intervalMs - 刷新间隔时间（毫秒），默认30000ms
   */
  const startAutoRefresh = (intervalMs = 30000) => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
    }

    refreshTimer.value = window.setInterval(() => {
      if (permissions.value.canViewList && !listLoading.value) {
        refresh().catch(error => {
          console.warn('[usePromotionAudit] 自动刷新失败:', error)
        })
      }
    }, intervalMs)

    console.log('[usePromotionAudit] 自动刷新已启动，间隔:', intervalMs, 'ms')
  }

  /**
   * 停止自动刷新机制
   * 清除定时器并停止数据的自动刷新
   * 
   * @complexity O(1) - 定时器清除为常数时间操作
   * @flow
   * 1. 检查定时器是否存在
   * 2. 清除间隔定时器
   * 3. 重置定时器引用
   * 4. 记录停止日志
   * 
   * @example
   * ```typescript
   * // 停止自动刷新
   * stopAutoRefresh()
   * 
   * // 在页面失焦时停止刷新
   * onBeforeUnmount(() => {
   *   stopAutoRefresh()
   * })
   * ```
   */
  const stopAutoRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
      console.log('[usePromotionAudit] 自动刷新已停止')
    }
  }

  /**
   * 更新筛选条件
   * 更新审核列表的筛选参数并重新加载数据
   * 
   * @complexity O(1) - 参数更新和API调用为常数时间
   * @flow
   * 1. 接收新的筛选参数
   * 2. 调用Store方法更新筛选条件
   * 3. 触发数据重新加载
   * 
   * @example
   * ```typescript
   * // 按状态筛选
   * await updateFilters({ status: 'PENDING_MANUAL_AUDIT' })
   * 
   * // 按平台筛选
   * await updateFilters({ platform: 'DOUYIN' })
   * 
   * // 组合筛选
   * await updateFilters({
   *   status: 'APPROVED',
   *   platform: 'BILIBILI',
   *   dateRange: {
   *     startDate: '2024-01-01',
   *     endDate: '2024-01-31'
   *   }
   * })
   * ```
   * 
   * @param newFilters - 新的筛选参数
   * @returns Promise<void>
   */
  const updateFilters = async (newFilters: Partial<AuditFilterParams>) => {
    await promotionStore.updateFilters(newFilters)
  }

  /**
   * 重置所有筛选条件
   * 清除所有筛选条件并恢复到默认状态
   * 
   * @complexity O(1) - 重置操作为常数时间
   * @flow
   * 1. 调用Store的重置筛选方法
   * 2. 清除所有筛选参数
   * 3. 重新加载默认数据
   * 
   * @example
   * ```typescript
   * // 重置所有筛选条件
   * await resetFilters()
   * console.log('筛选条件已重置')
   * ```
   * 
   * @returns Promise<void>
   */
  const resetFilters = async () => {
    await promotionStore.resetFilters()
  }

  /**
   * 搜索任务
   * 根据关键词筛选推广任务，支持任务标题、内容和创建者搜索
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟和后端搜索算法
   * @flow
   * 1. 接收搜索关键词参数
   * 2. 清理关键词前后空白字符
   * 3. 调用updateFilters方法更新筛选条件
   * 4. 触发数据重新加载
   * 
   * @example
   * ```typescript
   * // 搜索包含特定关键词的任务
   * await searchTasks('抖音推广')
   * 
   * // 搜索用户名
   * await searchTasks('张三')
   * 
   * // 清空搜索
   * await searchTasks('')
   * ```
   * 
   * @param keyword - 搜索关键词，会自动清理前后空白
   * @returns Promise<void>
   */
  const searchTasks = async (keyword: string) => {
    await updateFilters({ keyword: keyword.trim() })
  }

  /**
   * 按状态筛选任务
   * 根据推广任务的审核状态进行筛选
   * 
   * @complexity O(1) - 状态筛选为常数时间操作
   * @flow
   * 1. 接收状态参数（具体状态或'all'）
   * 2. 调用updateFilters方法更新状态筛选条件
   * 3. 重新加载符合状态条件的任务列表
   * 
   * @example
   * ```typescript
   * // 筛选待审核任务
   * await filterByStatus('PENDING_MANUAL_AUDIT')
   * 
   * // 筛选已通过任务
   * await filterByStatus('APPROVED')
   * 
   * // 显示所有状态任务
   * await filterByStatus('all')
   * ```
   * 
   * @param status - 任务状态或'all'显示全部
   * @returns Promise<void>
   */
  const filterByStatus = async (status: PromotionStatus | 'all') => {
    await updateFilters({ status })
  }

  /**
   * 按平台筛选任务
   * 根据推广平台类型进行任务筛选
   * 
   * @complexity O(1) - 平台筛选为常数时间操作
   * @flow
   * 1. 接收平台参数（具体平台或'all'）
   * 2. 调用updateFilters方法更新平台筛选条件
   * 3. 重新加载指定平台的任务列表
   * 
   * @example
   * ```typescript
   * // 筛选抖音平台任务
   * await filterByPlatform('DOUYIN')
   * 
   * // 筛选B站平台任务
   * await filterByPlatform('BILIBILI')
   * 
   * // 显示所有平台任务
   * await filterByPlatform('all')
   * ```
   * 
   * @param platform - 推广平台类型或'all'显示全部
   * @returns Promise<void>
   */
  const filterByPlatform = async (platform: PromotionPlatform | 'all') => {
    await updateFilters({ platform })
  }

  /**
   * 按内容类型筛选任务
   * 根据推广内容的类型进行任务筛选
   * 
   * @complexity O(1) - 内容类型筛选为常数时间操作
   * @flow
   * 1. 接收内容类型参数（具体类型或'all'）
   * 2. 调用updateFilters方法更新内容类型筛选条件
   * 3. 重新加载指定内容类型的任务列表
   * 
   * @example
   * ```typescript
   * // 筛选视频类型任务
   * await filterByContentType('VIDEO')
   * 
   * // 筛选图文类型任务
   * await filterByContentType('IMAGE_TEXT')
   * 
   * // 显示所有内容类型任务
   * await filterByContentType('all')
   * ```
   * 
   * @param contentType - 内容类型或'all'显示全部
   * @returns Promise<void>
   */
  const filterByContentType = async (contentType: PromotionContentType | 'all') => {
    await updateFilters({ contentType })
  }

  /**
   * 按日期范围筛选任务
   * 根据任务创建或提交的日期范围进行筛选
   * 
   * @complexity O(1) - 日期筛选为常数时间操作
   * @flow
   * 1. 接收开始日期和结束日期参数
   * 2. 构建日期范围对象
   * 3. 调用updateFilters方法更新日期筛选条件
   * 4. 重新加载指定日期范围内的任务列表
   * 
   * @example
   * ```typescript
   * // 筛选本月任务
   * await filterByDateRange('2024-01-01', '2024-01-31')
   * 
   * // 筛选近一周任务
   * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
   * const today = new Date()
   * await filterByDateRange(
   *   lastWeek.toISOString().split('T')[0],
   *   today.toISOString().split('T')[0]
   * )
   * ```
   * 
   * @param startDate - 开始日期（YYYY-MM-DD格式）
   * @param endDate - 结束日期（YYYY-MM-DD格式）
   * @returns Promise<void>
   */
  const filterByDateRange = async (startDate: string, endDate: string) => {
    await updateFilters({
      dateRange: { startDate, endDate }
    })
  }

  /**
   * 分页操作 - 切换到指定页码
   * 切换到指定页码，重新加载该页的任务数据
   * 
   * @complexity O(1) - 页面切换为常数时间操作
   * @flow
   * 1. 接收目标页码参数
   * 2. 调用Store的changePage方法
   * 3. 更新分页状态并重新加载数据
   * 
   * @example
   * ```typescript
   * // 跳转到第3页
   * await changePage(3)
   * 
   * // 响应用户点击分页器
   * const handlePageChange = async (page: number) => {
   *   await changePage(page)
   * }
   * ```
   * 
   * @param page - 目标页码（从1开始）
   * @returns Promise<void>
   */
  const changePage = async (page: number) => {
    await promotionStore.changePage(page)
  }

  /**
   * 更改每页显示数量
   * 调整分页大小并重新加载第一页数据
   * 
   * @complexity O(1) - 页面大小调整为常数时间操作
   * @flow
   * 1. 接收新的页面大小参数
   * 2. 调用Store的changePageSize方法
   * 3. 重置到第一页并重新加载数据
   * 
   * @example
   * ```typescript
   * // 设置每页显示20条
   * await changePageSize(20)
   * 
   * // 设置每页显示50条
   * await changePageSize(50)
   * 
   * // 响应用户选择页面大小
   * const handlePageSizeChange = async (size: number) => {
   *   await changePageSize(size)
   * }
   * ```
   * 
   * @param pageSize - 每页显示的任务数量
   * @returns Promise<void>
   */
  const changePageSize = async (pageSize: number) => {
    await promotionStore.changePageSize(pageSize)
  }

  /**
   * 跳转到第一页
   * 快速导航到列表的第一页
   * 
   * @complexity O(1) - 直接调用changePage(1)
   * @flow
   * 1. 调用changePage方法并传入页码1
   * 2. 加载第一页数据
   * 
   * @example
   * ```typescript
   * // 重置到第一页
   * await goToFirstPage()
   * 
   * // 在搜索后跳转到第一页
   * await searchTasks('关键词')
   * await goToFirstPage()
   * ```
   * 
   * @returns Promise<void>
   */
  const goToFirstPage = async () => {
    await changePage(1)
  }

  /**
   * 跳转到最后一页
   * 快速导航到列表的最后一页
   * 
   * @complexity O(1) - 基于已知总页数的直接跳转
   * @flow
   * 1. 从分页信息中获取总页数
   * 2. 调用changePage方法跳转到最后一页
   * 3. 加载最后一页数据
   * 
   * @example
   * ```typescript
   * // 跳转到最后一页
   * await goToLastPage()
   * 
   * // 查看最新的任务（假设按时间降序排列）
   * await goToLastPage()
   * ```
   * 
   * @returns Promise<void>
   */
  const goToLastPage = async () => {
    await changePage(pagination.value.totalPages)
  }

  /**
   * 任务选择操作
   */
  const toggleTaskSelection = (taskId: string) => {
    promotionStore.toggleTaskSelection(taskId)
  }

  const selectAllTasks = () => {
    promotionStore.selectAllTasks()
  }

  const clearSelection = () => {
    promotionStore.clearSelection()
  }

  const selectPendingTasks = () => {
    promotionStore.selectTasksByStatus('PENDING_MANUAL_AUDIT')
  }

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.value.includes(taskId)
  }

  /**
   * 任务详情操作
   */
  const viewTaskDetail = async (taskId: string) => {
    if (!permissions.value.canViewDetail) {
      throw new Error('没有查看任务详情的权限')
    }

    await promotionStore.loadTaskDetail(taskId)
    promotionStore.openTaskDetailSidebar(taskId)
  }

  const closeTaskDetail = () => {
    promotionStore.closeTaskDetailSidebar()
  }

  /**
   * 导出功能
   */
  const exportData = async (customFilters?: AuditFilterParams) => {
    if (!permissions.value.canExport) {
      throw new Error('没有导出权限')
    }

    await promotionStore.exportAuditData(customFilters)
  }

  const openExportDialog = () => {
    promotionStore.openExportDialog()
  }

  const closeExportDialog = () => {
    promotionStore.closeExportDialog()
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    stopAutoRefresh()
    promotionStore.reset()
    isInitialized.value = false
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    isInitialized: computed(() => isInitialized.value),
    permissions,
    auditList,
    listLoading,
    listError,
    pagination,
    filters,
    selectedTasks,
    currentTask,
    auditStats,
    myStats,
    quickStats,
    hasData,
    isEmpty,
    hasError,
    hasPermission,

    // 方法
    initialize,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    updateFilters,
    resetFilters,
    searchTasks,
    filterByStatus,
    filterByPlatform,
    filterByContentType,
    filterByDateRange,
    changePage,
    changePageSize,
    goToFirstPage,
    goToLastPage,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    selectPendingTasks,
    isTaskSelected,
    viewTaskDetail,
    closeTaskDetail,
    exportData,
    openExportDialog,
    closeExportDialog,
    cleanup
  }
}

/**
 * 防抖搜索组合式API
 * 提供带防抖功能的搜索能力，避免频繁API调用导致的性能问题
 * 
 * @function usePromotionAuditSearch
 * @returns {Object} 搜索相关的状态和方法
 * @complexity O(1) - 防抖机制为常数时间复杂度，具体搜索取决于API调用
 * @flow 初始化防抖 -> 监听关键词变化 -> 防抖执行搜索 -> 更新状态
 * 
 * @example
 * ```typescript
 * const {
 *   searchKeyword,
 *   isSearching,
 *   clearSearch
 * } = usePromotionAuditSearch()
 * 
 * // 设置搜索关键词（自动防抖）
 * searchKeyword.value = '推广任务标题'
 * 
 * // 清空搜索
 * await clearSearch()
 * ```
 */
export function usePromotionAuditSearch() {
  const { searchTasks } = usePromotionAudit()
  
  const searchKeyword = ref('')
  const isSearching = ref(false)

  // 防抖搜索
  const { debouncedFunction: debouncedSearch } = useDebounce(
    async (keyword: string) => {
      isSearching.value = true
      try {
        await searchTasks(keyword)
      } catch (error) {
        console.error('[usePromotionAuditSearch] 搜索失败:', error)
      } finally {
        isSearching.value = false
      }
    },
    500 // 500ms 防抖延迟
  )

  // 监听搜索关键词变化
  watch(searchKeyword, (newKeyword) => {
    debouncedSearch(newKeyword)
  })

  const clearSearch = async () => {
    searchKeyword.value = ''
    await searchTasks('')
  }

  return {
    searchKeyword,
    isSearching: computed(() => isSearching.value),
    clearSearch
  }
}

/**
 * 审核操作组合式API
 * 提供单个和批量审核操作功能，包括权限验证、参数校验和操作状态管理
 * 
 * @function usePromotionAuditOperations
 * @returns {Object} 审核操作相关的状态和方法
 * @complexity O(1) - 单个审核为常数时间，批量审核为O(n)，n为任务数量
 * @flow 权限检查 -> 参数验证 -> 执行操作 -> 更新状态 -> 处理结果
 * 
 * @example
 * ```typescript
 * const {
 *   operationState,
 *   auditTask,
 *   batchAudit,
 *   openAuditDialog
 * } = usePromotionAuditOperations()
 * 
 * // 单个任务审核
 * try {
 *   const result = await auditTask({
 *     taskId: 'task123',
 *     action: 'approve',
 *     comment: '内容符合要求',
 *     rewardAmount: 10.5
 *   })
 *   console.log('审核成功:', result)
 * } catch (error) {
 *   console.error('审核失败:', error)
 * }
 * 
 * // 批量审核
 * await batchAudit(['task1', 'task2'], 'approve', '批量通过')
 * ```
 */
export function usePromotionAuditOperations() {
  const promotionStore = usePromotionStore()
  const { permissions } = usePromotionAudit()

  const operationState = ref<AuditOperationState>({
    loading: false,
    error: null,
    success: false,
    data: null
  })

  /**
   * 执行单个任务审核
   * 对指定推广任务执行审核操作，包括参数验证和权限检查
   * 
   * @param {AuditRequest} request - 审核请求参数，包含任务ID、操作类型、评论和奖励金额
   * @returns {Promise<any>} 审核结果
   * @throws {Error} 权限不足或参数验证失败时抛出错误
   * @complexity O(1) - 单次API调用的时间复杂度
   * @flow 权限检查 -> 参数验证 -> 执行审核 -> 更新状态 -> 返回结果
   * 
   * @example
   * ```typescript
   * const auditRequest = {
   *   taskId: 'promotion_task_123',
   *   action: 'approve',
   *   comment: '推广内容质量优秀，符合平台规范',
   *   rewardAmount: 15.0
   * }
   * 
   * try {
   *   const result = await auditTask(auditRequest)
   *   console.log('审核成功，任务状态已更新')
   * } catch (error) {
   *   console.error('审核失败:', error.message)
   * }
   * ```
   */
  const auditTask = async (request: AuditRequest) => {
    if (!permissions.value.canAudit) {
      throw new Error('没有审核权限')
    }

    // 验证请求参数
    const validation = validateAuditRequest(request)
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '))
    }

    operationState.value = {
      loading: true,
      error: null,
      success: false,
      data: null
    }

    try {
      const result = await promotionStore.auditTask(request)
      
      operationState.value = {
        loading: false,
        error: null,
        success: true,
        data: result
      }

      console.log('[usePromotionAuditOperations] 审核操作成功:', request.taskId, request.action)
      return result

    } catch (error: any) {
      operationState.value = {
        loading: false,
        error: error.message || '审核操作失败',
        success: false,
        data: null
      }

      console.error('[usePromotionAuditOperations] 审核操作失败:', error)
      throw error
    }
  }

  /**
   * 批量审核操作
   * 对多个推广任务执行批量审核，支持统一的操作类型和评论
   * 
   * @complexity O(n) - n为任务数量，每个任务需要独立的API调用
   * @flow
   * 1. 权限检查：验证用户是否有批量审核权限
   * 2. 参数验证：检查任务ID列表是否为空
   * 3. 状态设置：将操作状态设为加载中
   * 4. 循环执行：遍历任务ID列表，逐个执行审核
   * 5. 结果收集：收集所有审核结果
   * 6. 状态更新：根据执行结果更新操作状态
   * 7. 错误处理：捕获并处理执行过程中的错误
   * 
   * @example
   * ```typescript
   * // 批量通过审核
   * const taskIds = ['task1', 'task2', 'task3']
   * try {
   *   const results = await batchAudit(
   *     taskIds,
   *     'approve',
   *     '内容质量良好，符合平台规范',
   *     12.5
   *   )
   *   console.log('批量审核成功:', results.length, '个任务')
   * } catch (error) {
   *   console.error('批量审核失败:', error.message)
   * }
   * 
   * // 批量拒绝审核
   * await batchAudit(
   *   selectedTaskIds,
   *   'reject',
   *   '内容不符合平台要求'
   * )
   * ```
   * 
   * @param taskIds - 要审核的任务ID数组
   * @param action - 审核操作类型：'approve'（通过）或'reject'（拒绝）
   * @param comment - 可选的审核评论
   * @param rewardAmount - 可选的奖励金额（仅在通过时有效）
   * @returns Promise<any[]> - 所有审核操作的结果数组
   * @throws {Error} - 权限不足或参数错误时抛出异常
   */
  const batchAudit = async (
    taskIds: string[],
    action: 'approve' | 'reject',
    comment?: string,
    rewardAmount?: number
  ) => {
    if (!permissions.value.canBatchAudit) {
      throw new Error('没有批量审核权限')
    }

    if (taskIds.length === 0) {
      throw new Error('请先选择要审核的任务')
    }

    operationState.value = {
      loading: true,
      error: null,
      success: false,
      data: null
    }

    try {
      const results = []
      
      // 逐个执行审核（简化实现）
      for (const taskId of taskIds) {
        const request: AuditRequest = {
          taskId,
          action,
          comment,
          rewardAmount
        }
        
        const result = await promotionStore.auditTask(request)
        results.push(result)
      }

      operationState.value = {
        loading: false,
        error: null,
        success: true,
        data: results
      }

      console.log('[usePromotionAuditOperations] 批量审核操作成功:', taskIds.length, '个任务')
      return results

    } catch (error: any) {
      operationState.value = {
        loading: false,
        error: error.message || '批量审核操作失败',
        success: false,
        data: null
      }

      console.error('[usePromotionAuditOperations] 批量审核操作失败:', error)
      throw error
    }
  }

  /**
   * 打开审核对话框
   * 为指定任务打开审核操作对话框，允许用户进行详细的审核操作
   * 
   * @complexity O(1) - 简单的状态设置操作
   * @flow
   * 1. 接收任务ID参数
   * 2. 调用Store方法打开审核对话框
   * 3. 设置当前审核任务ID
   * 
   * @example
   * ```typescript
   * // 打开指定任务的审核对话框
   * openAuditDialog('promotion_task_123')
   * 
   * // 在表格行点击事件中使用
   * const handleAuditClick = (task) => {
   *   openAuditDialog(task.id)
   * }
   * ```
   * 
   * @param taskId - 要审核的任务ID
   */
  const openAuditDialog = (taskId: string) => {
    promotionStore.openAuditDialog(taskId)
  }

  /**
   * 关闭审核对话框
   * 关闭当前打开的审核对话框并清理相关状态
   * 
   * @complexity O(1) - 简单的状态清理操作
   * @flow
   * 1. 调用Store方法关闭对话框
   * 2. 清除当前审核任务状态
   * 3. 重置对话框相关数据
   * 
   * @example
   * ```typescript
   * // 关闭审核对话框
   * closeAuditDialog()
   * 
   * // 在对话框取消按钮中使用
   * const handleCancel = () => {
   *   closeAuditDialog()
   * }
   * ```
   */
  const closeAuditDialog = () => {
    promotionStore.closeAuditDialog()
  }

  /**
   * 打开批量审核面板
   */
  const openBatchAuditPanel = () => {
    promotionStore.openBatchAuditPanel()
  }

  const closeBatchAuditPanel = () => {
    promotionStore.closeBatchAuditPanel()
  }

  /**
   * 重置操作状态
   */
  const resetOperationState = () => {
    operationState.value = {
      loading: false,
      error: null,
      success: false,
      data: null
    }
  }

  return {
    operationState: computed(() => operationState.value),
    auditTask,
    batchAudit,
    openAuditDialog,
    closeAuditDialog,
    openBatchAuditPanel,
    closeBatchAuditPanel,
    resetOperationState
  }
}

/**
 * 审核历史组合式API
 * 提供推广任务审核历史记录的查询和管理功能
 * 
 * @function usePromotionAuditHistory
 * @returns {Object} 审核历史相关的方法和状态访问器
 * @complexity O(1) - 基础操作为常数时间，历史加载取决于记录数量
 * @flow 加载历史 -> 缓存管理 -> 状态查询 -> 返回访问器
 * 
 * @example
 * ```typescript
 * const {
 *   loadHistory,
 *   getTaskHistory,
 *   isHistoryLoading
 * } = usePromotionAuditHistory()
 * 
 * // 加载任务审核历史
 * await loadHistory('task123')
 * 
 * // 获取历史记录（响应式）
 * const history = getTaskHistory('task123')
 * 
 * // 检查加载状态
 * const loading = isHistoryLoading('task123')
 * ```
 */
export function usePromotionAuditHistory() {
  const promotionStore = usePromotionStore()

  /**
   * 加载审核历史记录
   * 加载指定任务的审核历史记录，支持强制重新加载
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟
   * @flow
   * 1. 接收任务ID和重载选项
   * 2. 调用Store方法加载历史数据
   * 3. 缓存历史记录以提高性能
   * 4. 返回加载结果
   * 
   * @example
   * ```typescript
   * // 加载任务审核历史
   * await loadHistory('task123')
   * 
   * // 强制重新加载历史（忽略缓存）
   * await loadHistory('task123', true)
   * 
   * // 批量加载多个任务的历史
   * const taskIds = ['task1', 'task2', 'task3']
   * await Promise.all(taskIds.map(id => loadHistory(id)))
   * ```
   * 
   * @param taskId - 任务ID
   * @param forceReload - 是否强制重新加载，默认false
   * @returns Promise<any> - 历史记录加载结果
   */
  const loadHistory = async (taskId: string, forceReload = false) => {
    return await promotionStore.loadAuditHistory(taskId, forceReload)
  }

  /**
   * 获取任务审核历史
   * 返回指定任务的响应式审核历史记录
   * 
   * @complexity O(1) - 响应式计算属性访问为常数时间
   * @flow
   * 1. 接收任务ID参数
   * 2. 创建响应式计算属性
   * 3. 从Store中获取对应的历史记录
   * 4. 如果记录不存在则返回空数组
   * 
   * @example
   * ```typescript
   * // 获取任务历史（响应式）
   * const history = getTaskHistory('task123')
   * 
   * // 在模板中使用
   * watch(history, (newHistory) => {
   *   console.log('历史记录更新:', newHistory.length, '条记录')
   * })
   * 
   * // 访问历史记录数据
   * const historyData = history.value
   * historyData.forEach(record => {
   *   console.log('审核时间:', record.auditTime)
   *   console.log('审核结果:', record.result)
   * })
   * ```
   * 
   * @param taskId - 任务ID
   * @returns ComputedRef<any[]> - 响应式的历史记录数组
   */
  const getTaskHistory = (taskId: string) => {
    return computed(() => promotionStore.auditHistory[taskId] || [])
  }

  /**
   * 检查历史记录加载状态
   * 返回指定任务历史记录的加载状态
   * 
   * @complexity O(1) - 响应式状态访问为常数时间
   * @flow
   * 1. 接收任务ID参数
   * 2. 创建响应式计算属性
   * 3. 从Store中获取对应的加载状态
   * 4. 如果状态不存在则返回false
   * 
   * @example
   * ```typescript
   * // 检查加载状态
   * const loading = isHistoryLoading('task123')
   * 
   * // 在模板中显示加载状态
   * if (loading.value) {
   *   console.log('正在加载历史记录...')
   * }
   * 
   * // 条件渲染
   * const showSpinner = loading.value
   * ```
   * 
   * @param taskId - 任务ID
   * @returns ComputedRef<boolean> - 响应式的加载状态
   */
  const isHistoryLoading = (taskId: string) => {
    return computed(() => promotionStore.historyLoading[taskId] || false)
  }

  return {
    loadHistory,
    getTaskHistory,
    isHistoryLoading
  }
}

/**
 * 统计数据组合式API
 * 提供推广审核统计数据的查询和管理功能，支持权限控制和日期范围筛选
 * 
 * @function usePromotionAuditStats
 * @returns {Object} 统计数据相关的方法和状态
 * @complexity O(1) - 统计数据加载的时间复杂度主要取决于API调用
 * @flow 权限检查 -> 加载统计数据 -> 缓存管理 -> 返回响应式状态
 * 
 * @example
 * ```typescript
 * const {
 *   loadStats,
 *   loadMyStats,
 *   statsData,
 *   myStatsData,
 *   statsLoading
 * } = usePromotionAuditStats()
 * 
 * // 加载指定日期范围的统计数据
 * await loadStats({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * })
 * 
 * // 加载当前用户的统计数据
 * await loadMyStats()
 * 
 * // 访问响应式统计数据
 * console.log('总统计:', statsData.value)
 * console.log('个人统计:', myStatsData.value)
 * ```
 */
export function usePromotionAuditStats() {
  const promotionStore = usePromotionStore()
  const { permissions } = usePromotionAudit()

  /**
   * 加载统计数据
   * 加载指定日期范围的审核统计数据，需要相应权限
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟
   * @flow
   * 1. 权限检查：验证用户是否有查看统计数据的权限
   * 2. 参数处理：处理可选的日期范围参数
   * 3. API调用：调用Store方法加载统计数据
   * 4. 数据缓存：缓存加载的统计数据
   * 5. 返回结果：返回统计数据加载结果
   * 
   * @example
   * ```typescript
   * // 加载默认统计数据
   * await loadStats()
   * 
   * // 加载指定日期范围的统计数据
   * await loadStats({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * })
   * 
   * // 错误处理
   * try {
   *   const stats = await loadStats()
   *   console.log('统计数据加载成功')
   * } catch (error) {
   *   console.error('加载失败:', error.message)
   * }
   * ```
   * 
   * @param dateRange - 可选的日期范围对象，包含startDate和endDate
   * @returns Promise<any> - 统计数据加载结果
   * @throws {Error} - 权限不足时抛出错误
   */
  const loadStats = async (dateRange?: { startDate: string; endDate: string }) => {
    if (!permissions.value.canViewStats) {
      throw new Error('没有查看统计数据的权限')
    }

    return await promotionStore.loadAuditStats(dateRange)
  }

  /**
   * 加载当前用户的统计数据
   * 加载当前登录用户的个人审核统计数据
   * 
   * @complexity O(1) - API调用的时间复杂度主要取决于网络延迟
   * @flow
   * 1. 调用Store方法加载个人统计数据
   * 2. 数据包含个人审核数量、通过率等指标
   * 3. 缓存个人统计数据
   * 4. 返回加载结果
   * 
   * @example
   * ```typescript
   * // 加载个人统计数据
   * await loadMyStats()
   * 
   * // 在页面初始化时加载
   * onMounted(async () => {
   *   try {
   *     await loadMyStats()
   *     console.log('个人统计数据加载完成')
   *   } catch (error) {
   *     console.error('加载个人统计失败:', error)
   *   }
   * })
   * ```
   * 
   * @returns Promise<any> - 个人统计数据加载结果
   */
  const loadMyStats = async () => {
    return await promotionStore.loadMyStats()
  }

  const statsData = computed(() => promotionStore.auditStats)
  const myStatsData = computed(() => promotionStore.myStats)
  const statsLoading = computed(() => promotionStore.statsLoading)

  return {
    loadStats,
    loadMyStats,
    statsData,
    myStatsData,
    statsLoading
  }
}

/**
 * 默认导出主要业务逻辑
 */
export default usePromotionAudit