import { defineStore } from 'pinia'
import type {
  PromotionTask,
  AuditRequest,
  AuditHistory,
  AuditStats,
  AuditFilterParams,
  PromotionStatus,
  PromotionPlatform,
  PromotionContentType,
  TaskSubmissionRequest,
  AgentTaskFilterParams,
  AgentTaskStats,
  URLRecognitionResult
} from '@/types/promotion'
import type { PaginatedResponse } from '@/types/api'
import { promotionTaskApi, handlePromotionAuditError } from '@/api/promotion'
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

  // ==================== 代理任务相关状态 ====================

  // 代理任务列表
  agentTaskList: PromotionTask[]
  agentTaskLoading: boolean
  agentTaskError: string | null

  // 代理任务筛选条件
  agentTaskFilters: AgentTaskFilterParams

  // 代理任务分页信息
  agentTaskPagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }

  // 代理任务统计数据
  agentTaskStats: AgentTaskStats | null
  agentStatsLoading: boolean

  // 任务提交相关状态
  submissionForm: TaskSubmissionRequest
  submissionLoading: boolean
  submissionError: string | null

  // URL识别相关状态
  urlRecognition: {
    recognizing: boolean
    result: URLRecognitionResult | null
  }

  // 代理任务UI状态
  agentUI: {
    taskDetailSidebarOpen: boolean
    sidebarTaskId: string | null
    submissionFormOpen: boolean
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
    },

    // ==================== 代理任务相关初始状态 ====================

    agentTaskList: [],
    agentTaskLoading: false,
    agentTaskError: null,

    agentTaskFilters: {
      keyword: '',
      status: 'all',
      platform: 'all',
      contentType: 'all',
      page: 1,
      pageSize: 20
    },

    agentTaskPagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },

    agentTaskStats: null,
    agentStatsLoading: false,

    submissionForm: {
      platform: 'douyin',
      contentType: 'video',
      contentUrl: '',
      contentDescription: ''
    },
    submissionLoading: false,
    submissionError: null,

    urlRecognition: {
      recognizing: false,
      result: null
    },

    agentUI: {
      taskDetailSidebarOpen: false,
      sidebarTaskId: null,
      submissionFormOpen: false
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
    },

    // ==================== 代理任务相关计算属性 ====================

    // 根据筛选条件过滤代理任务
    filteredAgentTasks: (state) => {
      let tasks = state.agentTaskList

      if (state.agentTaskFilters.status !== 'all') {
        tasks = tasks.filter(task => task.status === state.agentTaskFilters.status)
      }

      if (state.agentTaskFilters.platform !== 'all') {
        tasks = tasks.filter(task => task.platform === state.agentTaskFilters.platform)
      }

      if (state.agentTaskFilters.contentType !== 'all') {
        tasks = tasks.filter(task => task.contentType === state.agentTaskFilters.contentType)
      }

      if (state.agentTaskFilters.keyword) {
        const keyword = state.agentTaskFilters.keyword.toLowerCase()
        tasks = tasks.filter(task =>
          task.contentDescription?.toLowerCase().includes(keyword) ||
          task.contentUrl.toLowerCase().includes(keyword)
        )
      }

      return tasks
    },

    // 代理任务统计计算
    agentTaskStatsComputed: (state) => {
      const tasks = state.agentTaskList
      const pending = tasks.filter(task => task.status === 'PENDING').length
      const approved = tasks.filter(task => task.status === 'APPROVED').length
      const rejected = tasks.filter(task => task.status === 'REJECTED').length
      const totalReward = tasks
        .filter(task => task.status === 'APPROVED' && task.rewardAmount)
        .reduce((sum, task) => sum + (task.rewardAmount || 0), 0)

      return {
        totalSubmitted: tasks.length,
        pendingAudit: pending,
        approved,
        rejected,
        totalReward,
        approvalRate: tasks.length > 0 ? Math.round((approved / tasks.length) * 100) : 0
      }
    },

    // 代理任务按平台分组统计
    agentPlatformStats: (state) => {
      const stats: Record<PromotionPlatform, number> = {
        douyin: 0,
        kuaishou: 0,
        xiaohongshu: 0
      }

      state.agentTaskList.forEach(task => {
        stats[task.platform]++
      })

      return stats
    },

    // 代理任务按状态分组统计
    agentStatusStats: (state) => {
      const stats: Record<PromotionStatus, number> = {
        PENDING_MACHINE_AUDIT: 0,
        PENDING_MANUAL_AUDIT: 0,
        APPROVED: 0,
        REJECTED: 0
      }

      state.agentTaskList.forEach(task => {
        stats[task.status]++
      })

      return stats
    },

    // 是否有代理任务数据
    hasAgentTasks: (state) => state.agentTaskList.length > 0,

    // 当前选中的代理任务详情
    currentAgentTask: (state) => {
      if (!state.agentUI.sidebarTaskId) return null
      return state.agentTaskList.find(task => task.id === state.agentUI.sidebarTaskId) || null
    },

    // 提交表单是否有效
    isSubmissionFormValid: (state) => {
      const form = state.submissionForm
      return !!(form.platform && form.contentType && form.contentUrl && form.contentDescription)
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
        
        const response = await promotionTaskApi.getAuditList(this.filters)
        
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
        const task = await promotionTaskApi.getTaskDetail(taskId)
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
        const updatedTask = await promotionTaskApi.auditTask(request)
        
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
        const history = await promotionTaskApi.getAuditHistory(taskId)
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
        const stats = await promotionTaskApi.getAuditStats(dateRange)
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
        const stats = await promotionTaskApi.getMyAuditStats()
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
        
        const result = await promotionTaskApi.exportAuditData(exportParams)
        
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
    },

    // ==================== 代理任务相关操作 ====================

    /**
     * 提交推广任务
     */
    async submitTask(request: TaskSubmissionRequest) {
      this.submissionLoading = true
      this.submissionError = null

      try {
        const newTask = await promotionTaskApi.submitTask(request)

        // 将新任务添加到列表开头
        this.agentTaskList.unshift(newTask)

        // 更新分页信息
        this.agentTaskPagination.total += 1

        // 重置提交表单
        this.submissionForm = {
          platform: 'douyin',
          contentType: 'video',
          contentUrl: '',
          contentDescription: ''
        }

        // 清除URL识别结果
        this.urlRecognition.result = null

        console.log('[推广任务Store] 提交任务成功:', newTask.id)
        return newTask

      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        this.submissionError = errorMessage
        console.error('[推广任务Store] 提交任务失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.submissionLoading = false
      }
    },

    /**
     * 加载代理任务列表
     */
    async loadAgentTaskList(params?: Partial<AgentTaskFilterParams>) {
      this.agentTaskLoading = true
      this.agentTaskError = null

      try {
        // 更新筛选条件
        if (params) {
          this.agentTaskFilters = { ...this.agentTaskFilters, ...params }
        }

        const response = await promotionTaskApi.getAgentTaskList(this.agentTaskFilters)

        this.agentTaskList = response.list
        this.agentTaskPagination = {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: Math.ceil(response.total / response.pageSize)
        }

        console.log('[推广任务Store] 加载代理任务列表成功:', response.list.length, '条')

      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        this.agentTaskError = errorMessage
        console.error('[推广任务Store] 加载代理任务列表失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.agentTaskLoading = false
      }
    },

    /**
     * 刷新代理任务列表
     */
    async refreshAgentTaskList() {
      return this.loadAgentTaskList()
    },

    /**
     * 更新代理任务筛选条件
     */
    updateAgentTaskFilters(newFilters: Partial<AgentTaskFilterParams>) {
      this.agentTaskFilters = { ...this.agentTaskFilters, ...newFilters }

      // 如果是筛选条件变化，重置到第一页
      if (newFilters.keyword !== undefined ||
          newFilters.status !== undefined ||
          newFilters.platform !== undefined ||
          newFilters.contentType !== undefined) {
        this.agentTaskFilters.page = 1
      }

      // 自动加载新数据
      return this.loadAgentTaskList()
    },

    /**
     * 重置代理任务筛选条件
     */
    resetAgentTaskFilters() {
      this.agentTaskFilters = {
        keyword: '',
        status: 'all',
        platform: 'all',
        contentType: 'all',
        page: 1,
        pageSize: 20
      }
      return this.loadAgentTaskList()
    },

    /**
     * 代理任务分页操作
     */
    async changeAgentTaskPage(page: number) {
      this.agentTaskFilters.page = page
      return this.loadAgentTaskList()
    },

    /**
     * 改变代理任务页面大小
     */
    async changeAgentTaskPageSize(pageSize: number) {
      this.agentTaskFilters.pageSize = pageSize
      this.agentTaskFilters.page = 1 // 重置到第一页
      return this.loadAgentTaskList()
    },

    /**
     * 加载代理任务统计
     */
    async loadAgentTaskStats() {
      this.agentStatsLoading = true

      try {
        const stats = await promotionTaskApi.getAgentTaskStats()
        this.agentTaskStats = stats

        console.log('[推广任务Store] 加载代理统计成功:', stats)
        return stats

      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广任务Store] 加载代理统计失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.agentStatsLoading = false
      }
    },

    /**
     * URL平台识别
     */
    async recognizePlatform(url: string) {
      this.urlRecognition.recognizing = true

      try {
        const result = await promotionTaskApi.recognizePlatform(url)
        this.urlRecognition.result = result

        // 如果识别成功，自动更新提交表单的平台
        if (result.platform) {
          this.submissionForm.platform = result.platform
        }

        console.log('[推广任务Store] 平台识别成功:', result.platform)
        return result

      } catch (error: any) {
        const errorMessage = handlePromotionAuditError(error)
        console.error('[推广任务Store] 平台识别失败:', error)
        throw new Error(errorMessage)
      } finally {
        this.urlRecognition.recognizing = false
      }
    },

    /**
     * 更新提交表单
     */
    updateSubmissionForm(updates: Partial<TaskSubmissionRequest>) {
      this.submissionForm = { ...this.submissionForm, ...updates }
      this.submissionError = null
    },

    /**
     * 重置提交表单
     */
    resetSubmissionForm() {
      this.submissionForm = {
        platform: 'douyin',
        contentType: 'video',
        contentUrl: '',
        contentDescription: ''
      }
      this.submissionError = null
      this.urlRecognition.result = null
    },

    /**
     * 代理任务UI状态管理
     */
    openAgentTaskDetailSidebar(taskId: string) {
      this.agentUI.taskDetailSidebarOpen = true
      this.agentUI.sidebarTaskId = taskId
    },

    closeAgentTaskDetailSidebar() {
      this.agentUI.taskDetailSidebarOpen = false
      this.agentUI.sidebarTaskId = null
    },

    openSubmissionForm() {
      this.agentUI.submissionFormOpen = true
    },

    closeSubmissionForm() {
      this.agentUI.submissionFormOpen = false
      this.resetSubmissionForm()
    },

    /**
     * 重置代理任务相关状态
     */
    resetAgentTaskState() {
      this.agentTaskList = []
      this.agentTaskLoading = false
      this.agentTaskError = null
      this.agentTaskStats = null
      this.agentStatsLoading = false
      this.resetSubmissionForm()
      this.agentUI = {
        taskDetailSidebarOpen: false,
        sidebarTaskId: null,
        submissionFormOpen: false
      }
      this.resetAgentTaskFilters()
    }
  }
})

export default usePromotionStore