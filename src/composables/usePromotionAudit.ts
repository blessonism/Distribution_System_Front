/**
 * 推广审核业务逻辑 Composable
 * 封装审核列表加载、筛选、分页等业务逻辑
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
 * 推广审核主要业务逻辑 Composable
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
   * 权限检查
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
   * 基础数据访问
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
   * 计算属性
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
   * 初始化数据
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
   * 刷新数据
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
   * 自动刷新控制
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

  const stopAutoRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
      console.log('[usePromotionAudit] 自动刷新已停止')
    }
  }

  /**
   * 筛选和搜索
   */
  const updateFilters = async (newFilters: Partial<AuditFilterParams>) => {
    await promotionStore.updateFilters(newFilters)
  }

  const resetFilters = async () => {
    await promotionStore.resetFilters()
  }

  const searchTasks = async (keyword: string) => {
    await updateFilters({ keyword: keyword.trim() })
  }

  const filterByStatus = async (status: PromotionStatus | 'all') => {
    await updateFilters({ status })
  }

  const filterByPlatform = async (platform: PromotionPlatform | 'all') => {
    await updateFilters({ platform })
  }

  const filterByContentType = async (contentType: PromotionContentType | 'all') => {
    await updateFilters({ contentType })
  }

  const filterByDateRange = async (startDate: string, endDate: string) => {
    await updateFilters({
      dateRange: { startDate, endDate }
    })
  }

  /**
   * 分页操作
   */
  const changePage = async (page: number) => {
    await promotionStore.changePage(page)
  }

  const changePageSize = async (pageSize: number) => {
    await promotionStore.changePageSize(pageSize)
  }

  const goToFirstPage = async () => {
    await changePage(1)
  }

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
 * 防抖搜索 Composable
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
 * 审核操作 Composable
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
   */
  const openAuditDialog = (taskId: string) => {
    promotionStore.openAuditDialog(taskId)
  }

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
 * 审核历史 Composable
 */
export function usePromotionAuditHistory() {
  const promotionStore = usePromotionStore()

  const loadHistory = async (taskId: string, forceReload = false) => {
    return await promotionStore.loadAuditHistory(taskId, forceReload)
  }

  const getTaskHistory = (taskId: string) => {
    return computed(() => promotionStore.auditHistory[taskId] || [])
  }

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
 * 统计数据 Composable
 */
export function usePromotionAuditStats() {
  const promotionStore = usePromotionStore()
  const { permissions } = usePromotionAudit()

  const loadStats = async (dateRange?: { startDate: string; endDate: string }) => {
    if (!permissions.value.canViewStats) {
      throw new Error('没有查看统计数据的权限')
    }

    return await promotionStore.loadAuditStats(dateRange)
  }

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