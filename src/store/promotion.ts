import { defineStore } from 'pinia'
import type {
  PromotionTask,
  AuditRequest,
  AuditHistory,
  AuditStats,
  AuditFilterParams,
  PromotionStatus,
  PromotionPlatform,
  PromotionContentType
} from '@/types/promotion'
import type { PaginatedResponse } from '@/types/api'
import { promotionAuditApi, handlePromotionAuditError } from '@/api/promotion'
import { PermissionCheck } from '@/utils/permissionControl'
import { useUserStore } from '@/store/user'

interface PromotionState {
  // 任务列表相关状态
  auditList: PromotionTask[]
  listLoading: boolean
  listError: string | null
  
  // 分页信息
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  
  // 筛选条件
  filters: AuditFilterParams
  
  // 选中的任务
  selectedTasks: string[]
  
  // 当前查看的任务详情
  currentTask: PromotionTask | null
  taskDetailLoading: boolean
  
  // 审核历史
  auditHistory: Record<string, AuditHistory[]>
  historyLoading: Record<string, boolean>
  
  // 统计数据
  auditStats: AuditStats | null
  statsLoading: boolean
  
  // 个人审核统计
  myStats: {
    pendingCount: number
    todayAudited: number
    thisWeekAudited: number
  } | null
  
  // UI状态
  ui: {
    auditDialogOpen: boolean
    taskDetailSidebarOpen: boolean
    batchAuditPanelOpen: boolean
    exportDialogOpen: boolean
    currentAuditTaskId: string | null
    sidebarTaskId: string | null
  }
  
  // 操作状态
  operations: {
    auditing: Record<string, boolean>
    batchAuditing: boolean
    exporting: boolean
  }
  
  // 权限缓存
  permissions: {
    canViewList: boolean
    canAudit: boolean
    canExport: boolean
    canBatchAudit: boolean
    canViewStats: boolean
    dataScope: any
  }
}

export const usePromotionStore = defineStore('promotion', {
  state: (): PromotionState => ({
    auditList: [],
    listLoading: false,
    listError: null,
    
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },
    
    filters: {
      keyword: '',
      status: 'all',
      platform: 'all',
      contentType: 'all',
      page: 1,
      pageSize: 20
    },
    
    selectedTasks: [],
    
    currentTask: null,
    taskDetailLoading: false,
    
    auditHistory: {},
    historyLoading: {},
    
    auditStats: null,
    statsLoading: false,
    
    myStats: null,
    
    ui: {
      auditDialogOpen: false,
      taskDetailSidebarOpen: false,
      batchAuditPanelOpen: false,
      exportDialogOpen: false,
      currentAuditTaskId: null,
      sidebarTaskId: null
    },
    
    operations: {
      auditing: {},
      batchAuditing: false,
      exporting: false
    },
    
    permissions: {
      canViewList: false,
      canAudit: false,
      canExport: false,
      canBatchAudit: false,
      canViewStats: false,
      dataScope: null
    }
  }),

  getters: {
    // 根据状态筛选任务
    filteredTasks: (state) => {
      if (state.filters.status === 'all') {
        return state.auditList
      }
      return state.auditList.filter(task => task.status === state.filters.status)
    },
    
    // 待审核任务数量
    pendingTasksCount: (state) => {
      return state.auditList.filter(task => task.status === 'PENDING_MANUAL_AUDIT').length
    },
    
    // 今日已审核任务数量
    todayAuditedCount: (state) => {
      const today = new Date().toDateString()
      return state.auditList.filter(task => 
        task.auditedAt && new Date(task.auditedAt).toDateString() === today
      ).length
    },
    
    // 通过率计算
    approvalRate: (state) => {
      const auditedTasks = state.auditList.filter(task => 
        task.status === 'APPROVED' || task.status === 'REJECTED'
      )
      if (auditedTasks.length === 0) return 0
      
      const approvedCount = auditedTasks.filter(task => task.status === 'APPROVED').length
      return Math.round((approvedCount / auditedTasks.length) * 100) / 100
    },
    
    // 是否有选中的任务
    hasSelectedTasks: (state) => state.selectedTasks.length > 0,
    
    // 选中任务的数量
    selectedTasksCount: (state) => state.selectedTasks.length,
    
    // 选中的任务列表
    selectedTasksList: (state) => {
      return state.auditList.filter(task => state.selectedTasks.includes(task.id))
    },
    
    // 当前任务是否可以审核
    canAuditCurrentTask: (state) => {
      if (!state.currentTask) return false
      return state.currentTask.status === 'PENDING_MANUAL_AUDIT' && state.permissions.canAudit
    },
    
    // 是否有待审核任务
    hasPendingTasks: (state) => {
      return state.auditList.some(task => task.status === 'PENDING_MANUAL_AUDIT')
    },
    
    // 按平台分组的统计
    platformStats: (state) => {
      const stats: Record<PromotionPlatform, number> = {
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0
      }
      
      state.auditList.forEach(task => {
        stats[task.platform]++
      })
      
      return stats
    },
    
    // 按状态分组的统计
    statusStats: (state) => {
      const stats: Record<PromotionStatus, number> = {
        PENDING_MACHINE_AUDIT: 0,
        PENDING_MANUAL_AUDIT: 0,
        APPROVED: 0,
        REJECTED: 0
      }
      
      state.auditList.forEach(task => {
        stats[task.status]++
      })
      
      return stats
    }
  },

  actions: {
    /**
     * 初始化权限
     */
    initializePermissions() {
      const userStore = useUserStore()
      const userRole = userStore.userRole
      
      if (userRole) {
        this.permissions = {
          canViewList: PermissionCheck.canAccessPromotionAudit(userRole).hasPermission,
          canAudit: PermissionCheck.canApprovePromotionTask(userRole).hasPermission,
          canExport: PermissionCheck.canExportPromotionAuditData(userRole).hasPermission,
          canBatchAudit: PermissionCheck.canBatchAuditPromotion(userRole).hasPermission,
          canViewStats: PermissionCheck.canViewPromotionAuditStats(userRole).hasPermission,
          dataScope: PermissionCheck.getPromotionAuditDataScope(userRole, userStore.userInfo?.id?.toString() || '')
        }
      }
    },

    /**
     * 加载审核任务列表
     */
    async loadAuditList(params?: Partial<AuditFilterParams>) {
      this.listLoading = true
      this.listError = null
      
      try {
        // 更新筛选条件
        if (params) {
          this.filters = { ...this.filters, ...params }
        }
        
        const response = await promotionAuditApi.getAuditList(this.filters)
        
        this.auditList = response.list
        this.pagination = {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages
        }
        
        console.log('[推广审核Store] 加载任务列表成功:', response.list.length, '条')
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        this.listError = errorMessage
        console.error('[推广审核Store] 加载任务列表失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.listLoading = false
      }
    },

    /**
     * 刷新任务列表
     */
    async refreshAuditList() {
      return this.loadAuditList()
    },

    /**
     * 更新筛选条件
     */
    updateFilters(newFilters: Partial<AuditFilterParams>) {
      this.filters = { ...this.filters, ...newFilters }
      
      // 重置到第一页
      if (newFilters.keyword !== undefined || 
          newFilters.status !== undefined || 
          newFilters.platform !== undefined || 
          newFilters.contentType !== undefined) {
        this.filters.page = 1
      }
      
      // 自动加载新数据
      return this.loadAuditList()
    },

    /**
     * 重置筛选条件
     */
    resetFilters() {
      this.filters = {
        keyword: '',
        status: 'all',
        platform: 'all',
        contentType: 'all',
        page: 1,
        pageSize: 20
      }
      return this.loadAuditList()
    },

    /**
     * 分页操作
     */
    async changePage(page: number) {
      this.filters.page = page
      return this.loadAuditList()
    },

    /**
     * 改变页面大小
     */
    async changePageSize(pageSize: number) {
      this.filters.pageSize = pageSize
      this.filters.page = 1 // 重置到第一页
      return this.loadAuditList()
    },

    /**
     * 加载任务详情
     */
    async loadTaskDetail(taskId: string, forceReload = false) {
      // 如果已有数据且不强制刷新，直接返回
      if (!forceReload && this.currentTask?.id === taskId) {
        return this.currentTask
      }
      
      this.taskDetailLoading = true
      
      try {
        const task = await promotionAuditApi.getTaskDetail(taskId)
        this.currentTask = task
        
        // 同时更新列表中的对应任务
        const index = this.auditList.findIndex(t => t.id === taskId)
        if (index !== -1) {
          this.auditList[index] = task
        }
        
        console.log('[推广审核Store] 加载任务详情成功:', taskId)
        return task
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 加载任务详情失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.taskDetailLoading = false
      }
    },

    /**
     * 执行审核操作
     */
    async auditTask(request: AuditRequest) {
      const { taskId } = request
      this.operations.auditing[taskId] = true
      
      try {
        const updatedTask = await promotionAuditApi.auditTask(request)
        
        // 更新当前任务详情
        if (this.currentTask?.id === taskId) {
          this.currentTask = updatedTask
        }
        
        // 更新列表中的任务
        const index = this.auditList.findIndex(t => t.id === taskId)
        if (index !== -1) {
          this.auditList[index] = updatedTask
        }
        
        // 清除选中状态
        this.selectedTasks = this.selectedTasks.filter(id => id !== taskId)
        
        // 关闭审核对话框
        this.ui.auditDialogOpen = false
        this.ui.currentAuditTaskId = null
        
        console.log('[推广审核Store] 审核操作成功:', taskId, request.action)
        return updatedTask
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 审核操作失败:', error)
        throw new Error(errorMessage)
      } finally {
        delete this.operations.auditing[taskId]
      }
    },

    /**
     * 加载审核历史
     */
    async loadAuditHistory(taskId: string, forceReload = false) {
      // 如果已有数据且不强制刷新，直接返回
      if (!forceReload && this.auditHistory[taskId]) {
        return this.auditHistory[taskId]
      }
      
      this.historyLoading[taskId] = true
      
      try {
        const history = await promotionAuditApi.getAuditHistory(taskId)
        this.auditHistory[taskId] = history
        
        console.log('[推广审核Store] 加载审核历史成功:', taskId, history.length, '条记录')
        return history
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 加载审核历史失败:', error)
        throw new Error(errorMessage)
      } finally {
        delete this.historyLoading[taskId]
      }
    },

    /**
     * 加载统计数据
     */
    async loadAuditStats(dateRange?: { startDate: string; endDate: string }) {
      this.statsLoading = true
      
      try {
        const stats = await promotionAuditApi.getAuditStats(dateRange)
        this.auditStats = stats
        
        console.log('[推广审核Store] 加载统计数据成功:', stats)
        return stats
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 加载统计数据失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.statsLoading = false
      }
    },

    /**
     * 加载个人审核统计
     */
    async loadMyStats() {
      try {
        const stats = await promotionAuditApi.getMyAuditStats()
        this.myStats = stats
        
        console.log('[推广审核Store] 加载个人统计成功:', stats)
        return stats
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 加载个人统计失败:', error)
        throw new Error(errorMessage)
      }
    },

    /**
     * 导出审核数据
     */
    async exportAuditData(exportOptions?: any) {
      if (!this.permissions.canExport) {
        throw new Error('没有导出权限')
      }
      
      this.operations.exporting = true
      
      try {
        // 构建导出参数
        const exportParams = {
          scope: exportOptions?.scope || 'current',
          filters: exportOptions?.scope === 'all' ? {} : this.filters,
          dateRange: exportOptions?.startDate && exportOptions?.endDate ? {
            startDate: exportOptions.startDate,
            endDate: exportOptions.endDate
          } : undefined,
          fields: exportOptions?.fields || {
            basic: true,
            agent: true,
            content: true,
            audit: true,
            stats: false,
            history: false
          },
          format: exportOptions?.format || 'xlsx',
          includeHeader: exportOptions?.includeHeader !== false,
          includeSummary: exportOptions?.includeSummary || false
        }
        
        const result = await promotionAuditApi.exportAuditData(exportParams)
        
        // 如果返回的是blob，直接下载
        if (result instanceof Blob) {
          const url = window.URL.createObjectURL(result)
          const link = document.createElement('a')
          link.href = url
          link.download = `promotion-audit-${new Date().toISOString().split('T')[0]}.${exportParams.format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          // 如果返回的是下载URL
          const link = document.createElement('a')
          link.href = result.downloadUrl
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        
        console.log('[推广审核Store] 导出成功')
        return result
        
      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广审核Store] 导出失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.operations.exporting = false
      }
    },

    /**
     * 任务选择操作
     */
    toggleTaskSelection(taskId: string) {
      const index = this.selectedTasks.indexOf(taskId)
      if (index === -1) {
        this.selectedTasks.push(taskId)
      } else {
        this.selectedTasks.splice(index, 1)
      }
    },

    selectAllTasks() {
      this.selectedTasks = this.auditList.map(task => task.id)
    },

    clearSelection() {
      this.selectedTasks = []
    },

    selectTasksByStatus(status: PromotionStatus) {
      this.selectedTasks = this.auditList
        .filter(task => task.status === status)
        .map(task => task.id)
    },

    /**
     * UI状态管理
     */
    openAuditDialog(taskId: string) {
      this.ui.auditDialogOpen = true
      this.ui.currentAuditTaskId = taskId
      
      // 同时加载任务详情
      this.loadTaskDetail(taskId)
    },

    closeAuditDialog() {
      this.ui.auditDialogOpen = false
      this.ui.currentAuditTaskId = null
    },

    openTaskDetailSidebar(taskId: string) {
      this.ui.taskDetailSidebarOpen = true
      this.ui.sidebarTaskId = taskId
      
      // 加载任务详情和审核历史
      this.loadTaskDetail(taskId)
      this.loadAuditHistory(taskId)
    },

    closeTaskDetailSidebar() {
      this.ui.taskDetailSidebarOpen = false
      this.ui.sidebarTaskId = null
      this.currentTask = null
    },

    openBatchAuditPanel() {
      if (!this.permissions.canBatchAudit) {
        throw new Error('没有批量审核权限')
      }
      this.ui.batchAuditPanelOpen = true
    },

    closeBatchAuditPanel() {
      this.ui.batchAuditPanelOpen = false
    },

    openExportDialog() {
      if (!this.permissions.canExport) {
        throw new Error('没有导出权限')
      }
      this.ui.exportDialogOpen = true
    },

    closeExportDialog() {
      this.ui.exportDialogOpen = false
    },

    /**
     * 重置所有状态
     */
    reset() {
      this.auditList = []
      this.listLoading = false
      this.listError = null
      this.pagination = {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      }
      this.selectedTasks = []
      this.currentTask = null
      this.auditHistory = {}
      this.historyLoading = {}
      this.auditStats = null
      this.myStats = null
      this.operations = {
        auditing: {},
        batchAuditing: false,
        exporting: false
      }
      this.ui = {
        auditDialogOpen: false,
        taskDetailSidebarOpen: false,
        batchAuditPanelOpen: false,
        exportDialogOpen: false,
        currentAuditTaskId: null,
        sidebarTaskId: null
      }
      this.resetFilters()
    }
  }
})

export default usePromotionStore