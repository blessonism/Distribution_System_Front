/**
 * @fileoverview 推广任务状态管理Store
 * 基于Pinia的推广任务管理系统状态存储，提供完整的推广任务审核、代理任务管理和统计分析功能
 * 包含推广任务审核流程控制、代理任务提交与管理、高级筛选、分页控制、批量操作、URL识别和性能优化等核心功能
 * 集成审核统计、权限控制、UI状态管理、错误处理和操作状态追踪，为推广任务系统提供统一的数据层
 * 
 * @module store/promotion
 * @author Frontend Team
 * @since 1.0.0
 */

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

/**
 * 推广任务Store状态接口
 * 定义推广任务管理系统的完整状态结构，包含审核任务、代理任务、筛选条件、分页信息、统计数据和UI状态
 * 
 * @interface PromotionState
 */

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

/**
 * 推广任务管理Store
 * 提供完整的推广任务管理状态和操作方法，支持任务审核、代理任务管理、筛选、分页、批量操作和统计分析
 * 包含审核员任务管理和代理任务管理两个核心功能模块
 * 
 * @store usePromotionStore
 * @example
 * ```typescript
 * import { usePromotionStore } from '@/store/promotion'
 * 
 * const promotionStore = usePromotionStore()
 * 
 * // 初始化权限
 * promotionStore.initializePermissions()
 * 
 * // 加载审核任务列表
 * await promotionStore.loadAuditList()
 * 
 * // 审核任务
 * await promotionStore.auditTask({
 *   taskId: 'task123',
 *   action: 'APPROVE',
 *   remark: '任务质量良好'
 * })
 * 
 * // 代理提交任务
 * await promotionStore.submitTask({
 *   platform: 'douyin',
 *   contentType: 'video',
 *   contentUrl: 'https://...',
 *   contentDescription: '推广内容描述'
 * })
 * ```
 */
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
    /**
     * 根据状态筛选任务
     * 根据当前筛选条件过滤审核任务列表
     * 
     * @complexity O(n) - n为任务总数，需要遍历筛选
     * @flow 筛选条件检查 → 任务列表遍历 → 状态匹配 → 结果收集
     * 
     * @returns {PromotionTask[]} 符合筛选条件的任务数组
     * 
     * @example
     * ```typescript
     * // 设置筛选条件
     * promotionStore.updateFilters({ status: 'PENDING_MANUAL_AUDIT' })
     * 
     * // 获取筛选后的任务
     * const filtered = promotionStore.filteredTasks
     * console.log(`待审核任务: ${filtered.length}条`)
     * ```
     */
    filteredTasks: (state) => {
      if (state.filters.status === 'all') {
        return state.auditList
      }
      return state.auditList.filter(task => task.status === state.filters.status)
    },
    
    /**
     * 待审核任务数量
     * 统计当前列表中处于待人工审核状态的任务数量
     * 
     * @complexity O(n) - n为任务总数，需要遍历统计
     * @flow 任务列表遍历 → 待审核状态检查 → 计数统计
     * 
     * @returns {number} 待审核任务的数量
     * 
     * @example
     * ```typescript
     * const pendingCount = promotionStore.pendingTasksCount
     * if (pendingCount > 0) {
     *   console.log(`有 ${pendingCount} 个任务待审核`)
     * }
     * ```
     */
    pendingTasksCount: (state) => {
      return state.auditList.filter(task => task.status === 'PENDING_MANUAL_AUDIT').length
    },
    
    /**
     * 今日已审核任务数量
     * 统计今天已经完成审核的任务数量
     * 
     * @complexity O(n) - n为任务总数，需要遍历统计
     * @flow 今日日期计算 → 任务列表遍历 → 审核日期匹配 → 计数统计
     * 
     * @returns {number} 今日已审核任务的数量
     * 
     * @example
     * ```typescript
     * const todayCount = promotionStore.todayAuditedCount
     * console.log(`今天已审核 ${todayCount} 个任务`)
     * ```
     */
    todayAuditedCount: (state) => {
      const today = new Date().toDateString()
      return state.auditList.filter(task => 
        task.auditedAt && new Date(task.auditedAt).toDateString() === today
      ).length
    },
    
    /**
     * 通过率计算
     * 计算已审核任务的通过率（通过数量/总审核数量）
     * 
     * @complexity O(n) - n为任务总数，需要遍历筛选和计算
     * @flow 已审核任务筛选 → 通过任务统计 → 通过率计算 → 精度处理
     * 
     * @returns {number} 通过率（0-1之间的小数）
     * 
     * @example
     * ```typescript
     * const rate = promotionStore.approvalRate
     * console.log(`通过率: ${(rate * 100).toFixed(2)}%`)
     * ```
     */
    approvalRate: (state) => {
      const auditedTasks = state.auditList.filter(task => 
        task.status === 'APPROVED' || task.status === 'REJECTED'
      )
      if (auditedTasks.length === 0) return 0
      
      const approvedCount = auditedTasks.filter(task => task.status === 'APPROVED').length
      return Math.round((approvedCount / auditedTasks.length) * 100) / 100
    },
    
    /**
     * 是否有选中的任务
     * 检查当前是否有选中的任务
     * 
     * @complexity O(1) - 直接检查数组长度
     * @returns {boolean} 有选中任务返回true，否则返回false
     */
    hasSelectedTasks: (state) => state.selectedTasks.length > 0,
    
    /**
     * 选中任务的数量
     * 获取当前选中任务的总数量
     * 
     * @complexity O(1) - 直接返回数组长度
     * @returns {number} 选中任务的数量
     */
    selectedTasksCount: (state) => state.selectedTasks.length,
    
    /**
     * 选中的任务列表
     * 根据选中的任务ID获取对应的任务对象列表
     * 
     * @complexity O(n*m) - n为任务总数，m为选中任务数量
     * @flow 任务列表遍历 → 选中ID匹配 → 任务对象收集
     * 
     * @returns {PromotionTask[]} 选中的任务对象数组
     * 
     * @example
     * ```typescript
     * const selectedTasks = promotionStore.selectedTasksList
     * console.log(`选中了 ${selectedTasks.length} 个任务`)
     * selectedTasks.forEach(task => {
     *   console.log(`任务ID: ${task.id}, 状态: ${task.status}`)
     * })
     * ```
     */
    selectedTasksList: (state) => {
      return state.auditList.filter(task => state.selectedTasks.includes(task.id))
    },
    
    /**
     * 当前任务是否可以审核
     * 检查当前选中的任务是否可以进行审核操作
     * 需要同时满足：任务状态为待人工审核 且 用户有审核权限
     * 
     * @complexity O(1) - 简单状态检查
     * @flow 当前任务检查 → 任务状态验证 → 用户权限验证 → 结果返回
     * 
     * @returns {boolean} 可以审核返回true，否则返回false
     * 
     * @example
     * ```typescript
     * if (promotionStore.canAuditCurrentTask) {
     *   console.log('当前任务可以审核')
     * } else {
     *   console.log('当前任务不能审核')
     * }
     * ```
     */
    canAuditCurrentTask: (state) => {
      if (!state.currentTask) return false
      return state.currentTask.status === 'PENDING_MANUAL_AUDIT' && state.permissions.canAudit
    },
    
    /**
     * 是否有待审核任务
     * 检查任务列表中是否存在待人工审核的任务
     * 
     * @complexity O(n) - n为任务总数，需要遍历检查
     * @flow 任务列表遍历 → 待审核状态检查 → 存在性判断
     * 
     * @returns {boolean} 有待审核任务返回true，否则返回false
     * 
     * @example
     * ```typescript
     * if (promotionStore.hasPendingTasks) {
     *   console.log('有任务需要审核')
     * }
     * ```
     */
    hasPendingTasks: (state) => {
      return state.auditList.some(task => task.status === 'PENDING_MANUAL_AUDIT')
    },
    
    /**
     * 按平台分组的统计
     * 统计各个推广平台的任务数量分布
     * 
     * @complexity O(n) - n为任务总数，需要遍历统计
     * @flow 平台统计对象初始化 → 任务列表遍历 → 平台分类计数 → 统计结果返回
     * 
     * @returns {Record<PromotionPlatform, number>} 平台任务数量统计对象
     * 
     * @example
     * ```typescript
     * const platformStats = promotionStore.platformStats
     * Object.entries(platformStats).forEach(([platform, count]) => {
     *   console.log(`${platform}: ${count}个任务`)
     * })
     * ```
     */
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
    
    /**
     * 按状态分组的统计
     * 统计各个任务状态的任务数量分布
     * 
     * @complexity O(n) - n为任务总数，需要遍历统计
     * @flow 状态统计对象初始化 → 任务列表遍历 → 状态分类计数 → 统计结果返回
     * 
     * @returns {Record<PromotionStatus, number>} 状态任务数量统计对象
     * 
     * @example
     * ```typescript
     * const statusStats = promotionStore.statusStats
     * console.log(`待审核: ${statusStats.PENDING_MANUAL_AUDIT}`)
     * console.log(`已通过: ${statusStats.APPROVED}`)
     * ```
     */
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
     * 基于当前用户角色初始化推广任务审核相关的权限设置
     * 包括查看列表、审核任务、导出数据、批量审核和查看统计的权限控制
     * 
     * @complexity O(1) - 常数时间复杂度，简单权限配置查询
     * @flow 用户角色获取 → 权限检查 → 数据作用域计算 → 权限状态更新
     * 
     * @example
     * ```typescript
     * // 在用户登录后或角色变更时调用
     * promotionStore.initializePermissions()
     * 
     * // 检查权限状态
     * if (promotionStore.permissions.canAudit) {
     *   console.log('用户有审核权限')
     * }
     * ```
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
     * 从服务器获取推广任务审核列表，支持筛选条件和分页参数
     * 自动更新筛选条件和分页信息，处理数据转换和错误状态
     * 
     * @complexity O(1) - API调用为常数时间，实际取决于网络和服务器响应
     * @flow 筛选条件合并 → API请求构建 → 服务器调用 → 数据更新 → 分页处理 → 错误处理
     * 
     * @param {Partial<AuditFilterParams>} params - 可选的筛选和分页参数
     * @returns {Promise<void>} 异步操作完成
     * @throws {Error} 当API调用失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 加载默认的审核任务列表
     * await promotionStore.loadAuditList()
     * 
     * // 带筛选条件加载
     * await promotionStore.loadAuditList({
     *   status: 'PENDING_MANUAL_AUDIT',
     *   platform: 'douyin',
     *   page: 1,
     *   pageSize: 20
     * })
     * 
     * // 检查加载结果
     * console.log(`加载了 ${promotionStore.auditList.length} 个任务`)
     * ```
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
     * 使用当前的筛选条件重新加载审核任务列表
     * 
     * @complexity O(1) - 简单的委托调用
     * @flow 调用loadAuditList方法重新获取数据
     * 
     * @returns {Promise<void>} 异步操作完成
     * 
     * @example
     * ```typescript
     * // 刷新当前任务列表
     * await promotionStore.refreshAuditList()
     * console.log('任务列表已刷新')
     * ```
     */
    async refreshAuditList() {
      return this.loadAuditList()
    },

    /**
     * 更新筛选条件
     * 更新审核任务列表的筛选条件，自动重置页码并重新加载数据
     * 当关键筛选条件变更时会重置到第一页
     * 
     * @complexity O(1) - 对象合并和页码重置为常数时间
     * @flow 筛选条件合并 → 页码重置检查 → 数据重新加载
     * 
     * @param {Partial<AuditFilterParams>} newFilters - 新的筛选条件
     * @returns {Promise<void>} 数据重新加载的异步操作
     * 
     * @example
     * ```typescript
     * // 更新状态筛选
     * await promotionStore.updateFilters({
     *   status: 'PENDING_MANUAL_AUDIT'
     * })
     * 
     * // 更新多个筛选条件
     * await promotionStore.updateFilters({
     *   platform: 'douyin',
     *   contentType: 'video',
     *   keyword: '推广'
     * })
     * 
     * console.log(`筛选后有 ${promotionStore.filteredTasks.length} 个任务`)
     * ```
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
     * 将所有筛选条件重置为默认值，并重新加载任务列表
     * 
     * @complexity O(1) - 简单的对象重置和方法调用
     * @flow 筛选条件重置 → 数据重新加载
     * 
     * @returns {Promise<void>} 数据重新加载的异步操作
     * 
     * @example
     * ```typescript
     * // 清除所有筛选条件
     * await promotionStore.resetFilters()
     * console.log('筛选条件已重置，显示所有任务')
     * ```
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
     * 切换到指定页码并重新加载对应页面的数据
     * 
     * @complexity O(1) - 页码更新和API调用为常数时间
     * @flow 页码更新 → 数据重新加载
     * 
     * @param {number} page - 目标页码（从1开始）
     * @returns {Promise<void>} 数据加载的异步操作
     * 
     * @example
     * ```typescript
     * // 跳转到第3页
     * await promotionStore.changePage(3)
     * console.log(`当前页码: ${promotionStore.filters.page}`)
     * ```
     */
    async changePage(page: number) {
      this.filters.page = page
      return this.loadAuditList()
    },

    /**
     * 改变页面大小
     * 更新每页显示的任务数量，重置到第一页并重新加载数据
     * 
     * @complexity O(1) - 页面大小更新和API调用为常数时间
     * @flow 页面大小更新 → 页码重置 → 数据重新加载
     * 
     * @param {number} pageSize - 每页显示的任务数量
     * @returns {Promise<void>} 数据加载的异步操作
     * 
     * @example
     * ```typescript
     * // 设置每页显示50个任务
     * await promotionStore.changePageSize(50)
     * console.log(`每页显示: ${promotionStore.filters.pageSize} 个任务`)
     * ```
     */
    async changePageSize(pageSize: number) {
      this.filters.pageSize = pageSize
      this.filters.page = 1 // 重置到第一页
      return this.loadAuditList()
    },

    /**
     * 加载任务详情
     * 获取指定推广任务的详细信息，支持缓存机制和强制刷新
     * 同时更新列表中对应任务的数据以保持状态同步
     * 
     * @complexity O(n) - n为任务列表长度，需要查找并更新对应任务
     * @flow 缓存检查 → API调用 → 任务详情更新 → 列表同步 → 错误处理
     * 
     * @param {string} taskId - 要加载的任务ID
     * @param {boolean} forceReload - 是否强制重新加载，忽略缓存
     * @returns {Promise<PromotionTask>} 任务详情对象
     * @throws {Error} 当API调用失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 加载任务详情（使用缓存）
     * const task = await promotionStore.loadTaskDetail('task123')
     * console.log(`任务状态: ${task.status}`)
     * 
     * // 强制刷新任务详情
     * const freshTask = await promotionStore.loadTaskDetail('task123', true)
     * console.log(`最新状态: ${freshTask.status}`)
     * ```
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
     * 对指定推广任务执行审核操作（通过或拒绝），并更新相关状态
     * 自动处理任务状态同步、选择清理和UI状态管理
     * 
     * @complexity O(n) - n为任务列表长度，需要查找并更新对应任务
     * @flow 审核状态设置 → API调用 → 任务详情更新 → 列表同步 → 选择清理 → UI状态重置
     * 
     * @param {AuditRequest} request - 审核请求对象，包含任务ID、操作和备注
     * @returns {Promise<PromotionTask>} 更新后的任务对象
     * @throws {Error} 当审核操作失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 审核通过任务
     * const updatedTask = await promotionStore.auditTask({
     *   taskId: 'task123',
     *   action: 'APPROVE',
     *   remark: '内容质量良好，符合推广要求'
     * })
     * console.log(`任务已审核: ${updatedTask.status}`)
     * 
     * // 拒绝任务
     * await promotionStore.auditTask({
     *   taskId: 'task456',
     *   action: 'REJECT',
     *   remark: '内容不符合推广规范'
     * })
     * ```
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
     * 获取指定任务的历史审核记录，支持缓存机制和强制刷新
     * 提供审核轨迹追踪，帮助了解任务的完整审核流程
     * 
     * @complexity O(1) - API调用为常数时间，缓存查找也是常数时间
     * @flow 缓存检查 → 加载状态设置 → API调用 → 历史记录更新 → 缓存设置 → 错误处理
     * 
     * @param {string} taskId - 要查询审核历史的任务ID
     * @param {boolean} forceReload - 是否强制重新加载，忽略缓存
     * @returns {Promise<AuditHistory[]>} 审核历史记录数组
     * @throws {Error} 当API调用失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 获取任务的审核历史
     * const history = await promotionStore.loadAuditHistory('task123')
     * history.forEach(record => {
     *   console.log(`${record.auditorName} 在 ${record.auditedAt} ${record.action}`)
     * })
     * 
     * // 强制刷新审核历史
     * const freshHistory = await promotionStore.loadAuditHistory('task123', true)
     * ```
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
     * 获取推广任务审核系统的统计分析数据，支持时间范围筛选
     * 提供全局审核概览，包括任务分布、审核效率和质量指标
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow 统计参数构建 → API调用 → 统计数据更新 → 错误处理
     * 
     * @param {object} dateRange - 可选的时间范围筛选参数
     * @param {string} dateRange.startDate - 开始日期（ISO字符串）
     * @param {string} dateRange.endDate - 结束日期（ISO字符串）
     * @returns {Promise<AuditStats>} 审核统计数据对象
     * @throws {Error} 当API调用失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 获取全部时间的统计数据
     * const allStats = await promotionStore.loadAuditStats()
     * console.log(`总任务数: ${allStats.totalTasks}`)
     * 
     * // 获取指定时间范围的统计
     * const monthStats = await promotionStore.loadAuditStats({
     *   startDate: '2024-01-01',
     *   endDate: '2024-01-31'
     * })
     * console.log(`本月审核率: ${monthStats.auditRate}%`)
     * ```
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
     * 获取当前审核员的个人审核统计数据，包括待处理任务数和审核绩效
     * 提供个人工作量概览和绩效跟踪，支持个性化工作台显示
     * 
     * @complexity O(1) - API调用为常数时间复杂度
     * @flow API调用 → 个人统计更新 → 错误处理
     * 
     * @returns {Promise<object>} 个人审核统计对象
     * @throws {Error} 当API调用失败时抛出包装后的错误
     * 
     * @example
     * ```typescript
     * // 获取个人审核统计
     * const myStats = await promotionStore.loadMyStats()
     * console.log(`我的待审核任务: ${myStats.pendingCount}`)
     * console.log(`今日已审核: ${myStats.todayAudited}`)
     * console.log(`本周已审核: ${myStats.thisWeekAudited}`)
     * ```
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
     * 导出推广任务审核数据为Excel或其他格式文件，支持多种导出选项和筛选条件
     * 包含权限验证、参数构建、文件下载处理和多种导出格式支持
     * 
     * @complexity O(1) - API调用为常数时间，文件下载处理也是常数时间
     * @flow 权限检查 → 导出参数构建 → API调用 → 文件下载处理 → 错误处理
     * 
     * @param {object} exportOptions - 可选的导出配置参数
     * @param {string} exportOptions.scope - 导出范围（'current'|'all'）
     * @param {string} exportOptions.format - 导出格式（'xlsx'|'csv'）
     * @param {object} exportOptions.fields - 导出字段配置
     * @param {object} exportOptions.dateRange - 时间范围筛选
     * @returns {Promise<any>} 导出结果对象或Blob
     * @throws {Error} 当权限不足或导出失败时抛出错误
     * 
     * @example
     * ```typescript
     * // 导出当前筛选结果
     * await promotionStore.exportAuditData({
     *   scope: 'current',
     *   format: 'xlsx',
     *   fields: {
     *     basic: true,
     *     content: true,
     *     audit: true
     *   }
     * })
     * 
     * // 导出指定时间范围的所有数据
     * await promotionStore.exportAuditData({
     *   scope: 'all',
     *   dateRange: {
     *     startDate: '2024-01-01',
     *     endDate: '2024-01-31'
     *   }
     * })
     * ```
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
     * 任务选择操作 - 切换选择状态
     * 切换指定任务的选择状态，如果已选中则取消选择，未选中则添加到选择列表
     * 用于支持批量操作和多任务管理功能
     * 
     * @complexity O(n) - n为已选任务数量，需要查找操作
     * @flow 选择状态检查 → 添加或移除操作
     * 
     * @param {string} taskId - 要切换选择状态的任务ID
     * 
     * @example
     * ```typescript
     * // 切换任务选择状态
     * promotionStore.toggleTaskSelection('task123')
     * 
     * // 检查选择状态
     * const isSelected = promotionStore.selectedTasks.includes('task123')
     * console.log(`任务是否已选择: ${isSelected}`)
     * ```
     */
    toggleTaskSelection(taskId: string) {
      const index = this.selectedTasks.indexOf(taskId)
      if (index === -1) {
        this.selectedTasks.push(taskId)
      } else {
        this.selectedTasks.splice(index, 1)
      }
    },

    /**
     * 全选所有任务
     * 将当前列表中的所有任务添加到选择列表中，用于批量操作
     * 
     * @complexity O(n) - n为当前任务列表长度，需要映射操作
     * @flow 任务ID列表提取 → 选择列表更新
     * 
     * @example
     * ```typescript
     * // 选择当前页面的所有任务
     * promotionStore.selectAllTasks()
     * console.log(`已选择 ${promotionStore.selectedTasksCount} 个任务`)
     * ```
     */
    selectAllTasks() {
      this.selectedTasks = this.auditList.map(task => task.id)
    },

    /**
     * 清空选择
     * 清空所有已选择的任务，重置选择状态
     * 
     * @complexity O(1) - 常数时间复杂度，数组重置
     * @flow 选择列表清空
     * 
     * @example
     * ```typescript
     * promotionStore.clearSelection()
     * console.log(promotionStore.selectedTasks.length) // 0
     * ```
     */
    clearSelection() {
      this.selectedTasks = []
    },

    /**
     * 按状态选择任务
     * 选择所有指定状态的任务，便于批量处理同类任务
     * 
     * @complexity O(n) - n为任务列表长度，需要筛选操作
     * @flow 任务列表筛选 → 选择列表更新
     * 
     * @param {PromotionStatus} status - 要选择的任务状态
     * 
     * @example
     * ```typescript
     * // 选择所有待审核的任务
     * promotionStore.selectTasksByStatus('PENDING_MANUAL_AUDIT')
     * console.log(`选择了 ${promotionStore.selectedTasksCount} 个待审核任务`)
     * ```
     */
    selectTasksByStatus(status: PromotionStatus) {
      this.selectedTasks = this.auditList
        .filter(task => task.status === status)
        .map(task => task.id)
    },

    /**
     * UI状态管理 - 打开审核对话框
     * 打开指定任务的审核对话框，并同时加载任务详情
     * 集成UI状态管理和数据预加载功能
     * 
     * @complexity O(1) - UI状态更新和方法调用为常数时间
     * @flow UI状态更新 → 任务详情预加载
     * 
     * @param {string} taskId - 要审核的任务ID
     * 
     * @example
     * ```typescript
     * // 打开任务审核对话框
     * promotionStore.openAuditDialog('task123')
     * 
     * // 检查对话框状态
     * if (promotionStore.ui.auditDialogOpen) {
     *   console.log(`正在审核任务: ${promotionStore.ui.currentAuditTaskId}`)
     * }
     * ```
     */
    openAuditDialog(taskId: string) {
      this.ui.auditDialogOpen = true
      this.ui.currentAuditTaskId = taskId
      
      // 同时加载任务详情
      this.loadTaskDetail(taskId)
    },

    /**
     * 关闭审核对话框
     * 关闭审核对话框并清理相关UI状态
     * 
     * @complexity O(1) - 简单的UI状态重置操作
     * @flow UI状态重置
     * 
     * @example
     * ```typescript
     * promotionStore.closeAuditDialog()
     * console.log(promotionStore.ui.auditDialogOpen) // false
     * ```
     */
    closeAuditDialog() {
      this.ui.auditDialogOpen = false
      this.ui.currentAuditTaskId = null
    },

    /**
     * 打开任务详情侧边栏
     * 打开指定任务的详情侧边栏，并同时加载任务详情和审核历史
     * 提供全面的任务信息查看和审核轨迹追踪
     * 
     * @complexity O(1) - UI状态更新和方法调用为常数时间
     * @flow UI状态更新 → 任务详情加载 → 审核历史加载
     * 
     * @param {string} taskId - 要查看详情的任务ID
     * 
     * @example
     * ```typescript
     * // 打开任务详情侧边栏
     * promotionStore.openTaskDetailSidebar('task123')
     * 
     * // 检查侧边栏状态
     * if (promotionStore.ui.taskDetailSidebarOpen) {
     *   console.log(`正在查看任务: ${promotionStore.ui.sidebarTaskId}`)
     * }
     * ```
     */
    openTaskDetailSidebar(taskId: string) {
      this.ui.taskDetailSidebarOpen = true
      this.ui.sidebarTaskId = taskId
      
      // 加载任务详情和审核历史
      this.loadTaskDetail(taskId)
      this.loadAuditHistory(taskId)
    },

    /**
     * 关闭任务详情侧边栏
     * 关闭任务详情侧边栏并清理相关状态和数据
     * 
     * @complexity O(1) - 简单的UI状态重置操作
     * @flow UI状态重置 → 任务数据清理
     * 
     * @example
     * ```typescript
     * promotionStore.closeTaskDetailSidebar()
     * console.log(promotionStore.ui.taskDetailSidebarOpen) // false
     * console.log(promotionStore.currentTask) // null
     * ```
     */
    closeTaskDetailSidebar() {
      this.ui.taskDetailSidebarOpen = false
      this.ui.sidebarTaskId = null
      this.currentTask = null
    },

    /**
     * 打开批量审核面板
     * 打开批量审核操作面板，需要批量审核权限
     * 支持对多个任务同时进行审核操作
     * 
     * @complexity O(1) - 权限检查和UI状态更新为常数时间
     * @flow 权限检查 → UI状态更新
     * 
     * @throws {Error} 当用户没有批量审核权限时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   promotionStore.openBatchAuditPanel()
     *   console.log('批量审核面板已打开')
     * } catch (error) {
     *   console.error('没有批量审核权限')
     * }
     * ```
     */
    openBatchAuditPanel() {
      if (!this.permissions.canBatchAudit) {
        throw new Error('没有批量审核权限')
      }
      this.ui.batchAuditPanelOpen = true
    },

    /**
     * 关闭批量审核面板
     * 关闭批量审核操作面板
     * 
     * @complexity O(1) - 简单的UI状态重置操作
     * @flow UI状态重置
     * 
     * @example
     * ```typescript
     * promotionStore.closeBatchAuditPanel()
     * console.log(promotionStore.ui.batchAuditPanelOpen) // false
     * ```
     */
    closeBatchAuditPanel() {
      this.ui.batchAuditPanelOpen = false
    },

    /**
     * 打开导出对话框
     * 打开数据导出对话框，需要导出权限
     * 提供各种导出选项配置和格式选择
     * 
     * @complexity O(1) - 权限检查和UI状态更新为常数时间
     * @flow 权限检查 → UI状态更新
     * 
     * @throws {Error} 当用户没有导出权限时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   promotionStore.openExportDialog()
     *   console.log('导出对话框已打开')
     * } catch (error) {
     *   console.error('没有导出权限')
     * }
     * ```
     */
    openExportDialog() {
      if (!this.permissions.canExport) {
        throw new Error('没有导出权限')
      }
      this.ui.exportDialogOpen = true
    },

    /**
     * 关闭导出对话框
     * 关闭数据导出对话框
     * 
     * @complexity O(1) - 简单的UI状态重置操作
     * @flow UI状态重置
     * 
     * @example
     * ```typescript
     * promotionStore.closeExportDialog()
     * console.log(promotionStore.ui.exportDialogOpen) // false
     * ```
     */
    closeExportDialog() {
      this.ui.exportDialogOpen = false
    },

    /**
     * 重置所有状态
     * 将Store的所有状态重置为初始值，清空数据和操作状态
     * 用于用户登出、角色切换或系统重置场景
     * 
     * @complexity O(1) - 常数时间复杂度，对象重置操作
     * @flow 任务数据清空 → 状态重置 → 操作状态清理 → UI状态重置 → 筛选条件重置
     * 
     * @example
     * ```typescript
     * // 用户登出时重置状态
     * promotionStore.reset()
     * console.log('推广任务Store状态已重置')
     * 
     * // 重置后的状态检查
     * console.log(promotionStore.auditList.length) // 0
     * console.log(promotionStore.selectedTasks.length) // 0
     * console.log(promotionStore.ui.auditDialogOpen) // false
     * ```
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