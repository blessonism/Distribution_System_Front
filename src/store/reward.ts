import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rewardApi } from '@/api/reward'
import type { 
  RewardSettlement,
  RewardSettlementQuery,
  SecondAuditRequest,
  SecondAuditRequestQuery,
  SubmissionLimitCheck,
  RewardStatistics,
  WeeklySettlementCalculation
} from '@/types/reward'
import type { ApiListResponse } from '@/types/api'

/**
 * @fileoverview 奖励管理状态管理Store
 * 基于Pinia的奖励管理系统状态存储，提供完整的奖励结算、二次审核申请和统计分析功能
 * 包含奖励结算列表管理、二次审核流程控制、提交限制检查、统计数据展示和预览计算等核心功能
 * 集成周结算预览、奖励统计、状态管理和模拟数据支持，为奖励系统提供统一的数据层
 * 
 * @module store/reward
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 奖励管理Store
 * 管理奖励系统的所有状态和操作，支持结算管理、审核申请、统计分析和任务提交控制
 * 
 * @store useRewardStore
 * @example
 * ```typescript
 * import { useRewardStore } from '@/store/reward'
 * 
 * const rewardStore = useRewardStore()
 * 
 * // 检查提交限制
 * await rewardStore.checkSubmissionLimit('agent123')
 * 
 * // 获取奖励结算列表
 * await rewardStore.fetchRewardSettlements({ agentId: 'agent123' })
 * 
 * // 申请二次审核
 * await rewardStore.requestSecondAudit('task123', 350)
 * ```
 */
export const useRewardStore = defineStore('reward', () => {
  // ==================== 状态管理 ====================
  
  // 奖励结算列表
  const settlements = ref<RewardSettlement[]>([])
  const settlementsPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const settlementsLoading = ref(false)

  // 二次审核申请列表
  const secondAuditRequests = ref<SecondAuditRequest[]>([])
  const secondAuditPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const secondAuditLoading = ref(false)

  // 提交限制状态
  const submissionLimit = ref<SubmissionLimitCheck>({
    canSubmit: false,
    currentCount: 0,
    dailyLimit: 2,
    remainingCount: 0,
    nextResetTime: ''
  })
  const submissionLimitLoading = ref(false)

  // 奖励统计
  const statistics = ref<RewardStatistics>({
    totalEarnings: 0,
    currentWeekEarnings: 0,
    pendingRewards: 0,
    completedSettlements: 0,
    thisWeekTasksCount: 0,
    thisWeekApprovedCount: 0,
    secondAuditBonusCount: 0,
    averageWeeklyEarnings: 0
  })
  const statisticsLoading = ref(false)

  // 周结算预览
  const settlementPreview = ref<WeeklySettlementCalculation | null>(null)
  const settlementPreviewLoading = ref(false)

  // UI状态
  const selectedSettlement = ref<RewardSettlement | null>(null)
  const selectedSecondAuditRequest = ref<SecondAuditRequest | null>(null)

  // ==================== 计算属性 ====================
  
  /**
   * 计算属性：是否可以提交任务
   * 基于提交限制状态判断当前是否允许提交新任务
   * 
   * @complexity O(1) - 常数时间复杂度，简单状态检查
   * @returns {boolean} 可以提交返回true，否则返回false
   */
  const canSubmitTask = computed(() => submissionLimit.value.canSubmit)
  
  /**
   * 计算属性：本周是否达到结算门槛
   * 检查本周已通过审核的任务数量是否达到最低结算要求（10个）
   * 
   * @complexity O(1) - 常数时间复杂度，简单数值比较
   * @returns {boolean} 达到门槛返回true，否则返回false
   */
  const reachedWeeklyThreshold = computed(() => 
    statistics.value.thisWeekApprovedCount >= 10
  )

  /**
   * 计算属性：本周预期奖励
   * 基于本周通过审核的任务数量计算预期奖励金额
   * 只有达到最低门槛（10个任务）才能获得奖励
   * 
   * @complexity O(1) - 常数时间复杂度，简单数学计算
   * @returns {number} 预期奖励金额，未达到门槛则返回0
   */
  const expectedWeeklyReward = computed(() => {
    const baseReward = statistics.value.thisWeekApprovedCount * 1.0
    return reachedWeeklyThreshold.value ? baseReward : 0
  })

  /**
   * 计算属性：已完成的结算总数
   * 统计已完成结算状态的结算记录数量
   * 
   * @complexity O(n) - n为结算记录总数，需要遍历筛选
   * @returns {number} 已完成结算的数量
   */
  const completedSettlementsCount = computed(() => 
    settlements.value.filter(s => s.settlementStatus === 'SETTLED').length
  )

  // ==================== Actions ====================

  /**
   * 检查提交限制
   * 检查指定代理的任务提交限制状态，包括当前提交次数、每日限制和剩余次数
   * 目前使用模拟数据避免API 404错误，实际部署时需要启用真实API调用
   * 
   * @complexity O(1) - 常数时间复杂度，模拟数据生成或单次API调用
   * @flow 模拟数据生成 → 提交限制状态更新 → 加载状态管理
   * 
   * @param {string} agentId - 代理ID
   * @returns {Promise<void>} 异步操作完成
   * 
   * @example
   * ```typescript
   * await rewardStore.checkSubmissionLimit('agent123')
   * if (rewardStore.canSubmitTask) {
   *   console.log(`还可以提交 ${rewardStore.submissionLimit.remainingCount} 个任务`)
   * }
   * ```
   */
  const checkSubmissionLimit = async (agentId: string) => {
    submissionLimitLoading.value = true
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据检查提交限制，agentId:', agentId)

      // 模拟API响应
      const mockResponse = {
        canSubmit: true,
        currentCount: 0,
        dailyLimit: 2,
        remainingCount: 2,
        nextResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      submissionLimit.value = mockResponse

      // 如果需要真实API，取消注释下面的代码
      // submissionLimit.value = await rewardApi.checkSubmissionLimit(agentId)

    } catch (error) {
      console.error('检查提交限制失败:', error)
      throw error
    } finally {
      submissionLimitLoading.value = false
    }
  }

  /**
   * 记录任务提交
   * 记录代理的任务提交操作，更新提交计数和剩余限制
   * 目前使用模拟逻辑避免API错误，实际部署时需要启用真实API调用
   * 
   * @complexity O(1) - 常数时间复杂度，简单计数更新
   * @flow 提交计数检查 → 计数更新 → 限制状态更新
   * 
   * @param {string} agentId - 代理ID
   * @returns {Promise<void>} 异步操作完成
   * 
   * @example
   * ```typescript
   * await rewardStore.recordTaskSubmission('agent123')
   * console.log('任务提交已记录')
   * ```
   */
  const recordTaskSubmission = async (agentId: string) => {
    try {
      // 临时模拟记录提交，避免API 404错误
      console.log('[RewardStore] 模拟记录任务提交，agentId:', agentId)

      // 模拟更新提交计数
      if (submissionLimit.value.currentCount < submissionLimit.value.dailyLimit) {
        submissionLimit.value.currentCount += 1
        submissionLimit.value.remainingCount = submissionLimit.value.dailyLimit - submissionLimit.value.currentCount
        submissionLimit.value.canSubmit = submissionLimit.value.currentCount < submissionLimit.value.dailyLimit
      }

      // 如果需要真实API，取消注释下面的代码
      // await rewardApi.recordSubmission(agentId)
      // await checkSubmissionLimit(agentId)

    } catch (error) {
      console.error('记录任务提交失败:', error)
      throw error
    }
  }

  /**
   * 获取奖励结算列表
   * 获取指定代理的奖励结算记录，支持分页和筛选参数
   * 目前使用模拟数据提供完整的结算记录示例，包含成功和失败的结算案例
   * 
   * @complexity O(1) - API调用为常数时间，模拟数据生成也是常数时间
   * @flow 参数处理 → 模拟数据生成 → 分页信息更新 → 结算列表更新
   * 
   * @param {RewardSettlementQuery} params - 查询参数（可选）
   * @returns {Promise<void>} 异步操作完成
   * 
   * @example
   * ```typescript
   * await rewardStore.fetchRewardSettlements({
   *   agentId: 'agent123',
   *   page: 1,
   *   pageSize: 10
   * })
   * console.log(`获取到 ${rewardStore.settlements.length} 条结算记录`)
   * ```
   */
  const fetchRewardSettlements = async (params: RewardSettlementQuery = {}) => {
    settlementsLoading.value = true
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据获取奖励结算列表，params:', params)

      // 模拟结算记录数据
      const mockSettlements: RewardSettlement[] = [
        {
          id: '1',
          agentId: params.agentId || '1',
          settlementWeek: '2024-W01',
          weekStartDate: '2024-01-01',
          weekEndDate: '2024-01-07',
          submittedTasksCount: 15,
          approvedTasksCount: 12,
          qualifiedTasksCount: 12,
          baseRewardAmount: 12.0,
          bonusRewardAmount: 8.0,
          totalRewardAmount: 20.0,
          settlementStatus: 'SETTLED',
          settlementDate: '2024-01-08T10:00:00Z',
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-08T10:00:00Z'
        },
        {
          id: '2',
          agentId: params.agentId || '1',
          settlementWeek: '2024-W02',
          weekStartDate: '2024-01-08',
          weekEndDate: '2024-01-14',
          submittedTasksCount: 8,
          approvedTasksCount: 6,
          qualifiedTasksCount: 0,
          baseRewardAmount: 0,
          bonusRewardAmount: 0,
          totalRewardAmount: 0,
          settlementStatus: 'FAILED',
          settlementReason: '未达到最低10条任务要求',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]

      const mockResponse: ApiListResponse<RewardSettlement> = {
        list: mockSettlements,
        total: mockSettlements.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      }

      settlements.value = mockResponse.list
      settlementsPagination.value.total = mockResponse.total
      settlementsPagination.value.page = mockResponse.page
      settlementsPagination.value.pageSize = mockResponse.pageSize

      // 如果需要真实API，取消注释下面的代码
      // const response: ApiListResponse<RewardSettlement> = await rewardApi.getRewardSettlements(query)
      // settlements.value = response.list
      // settlementsPagination.value.total = response.total
      // settlementsPagination.value.page = response.page || query.page
      // settlementsPagination.value.pageSize = response.pageSize || query.pageSize

    } catch (error) {
      console.error('获取奖励结算列表失败:', error)
      throw error
    } finally {
      settlementsLoading.value = false
    }
  }

  /**
   * 获取结算详情
   * 获取指定代理和结算周期的详细结算信息
   * 
   * @complexity O(1) - 单次API调用，常数时间复杂度
   * @flow API调用 → 详情数据获取 → 当前选中结算更新
   * 
   * @param {string} agentId - 代理ID
   * @param {string} settlementWeek - 结算周期（格式：YYYY-WNN）
   * @returns {Promise<RewardSettlement>} 结算详情对象
   * 
   * @example
   * ```typescript
   * const settlement = await rewardStore.fetchSettlementDetail('agent123', '2024-W01')
   * console.log(`结算金额: ${settlement.totalRewardAmount}`)
   * ```
   */
  const fetchSettlementDetail = async (agentId: string, settlementWeek: string) => {
    try {
      const settlement = await rewardApi.getSettlementDetail(agentId, settlementWeek)
      selectedSettlement.value = settlement
      return settlement
    } catch (error) {
      console.error('获取结算详情失败:', error)
      throw error
    }
  }

  /**
   * 获取奖励统计
   * 获取指定代理的奖励统计数据，包括总收入、本周收入、待审奖励等
   * 目前使用模拟数据提供完整的统计信息示例
   * 
   * @complexity O(1) - 常数时间复杂度，模拟数据生成或单次API调用
   * @flow 模拟统计数据生成 → 统计状态更新 → 加载状态管理
   * 
   * @param {string} agentId - 代理ID
   * @returns {Promise<void>} 异步操作完成
   * 
   * @example
   * ```typescript
   * await rewardStore.fetchRewardStatistics('agent123')
   * const stats = rewardStore.statistics
   * console.log(`总收入: ${stats.totalEarnings}`)
   * console.log(`本周任务: ${stats.thisWeekTasksCount}`)
   * ```
   */
  const fetchRewardStatistics = async (agentId: string) => {
    statisticsLoading.value = true
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据获取奖励统计，agentId:', agentId)

      // 模拟统计数据
      const mockStatistics = {
        totalEarnings: 156.50,
        currentWeekEarnings: 0,
        pendingRewards: 24.00,
        completedSettlements: 8,
        thisWeekTasksCount: 3,
        thisWeekApprovedCount: 2,
        secondAuditBonusCount: 5,
        averageWeeklyEarnings: 19.56
      }

      statistics.value = mockStatistics

      // 如果需要真实API，取消注释下面的代码
      // statistics.value = await rewardApi.getRewardStatistics(agentId)

    } catch (error) {
      console.error('获取奖励统计失败:', error)
      throw error
    } finally {
      statisticsLoading.value = false
    }
  }

  /**
   * 申请二次审核
   * 为指定任务申请二次审核，通常用于观看量达到阈值后的奖励申请
   * 目前使用模拟数据创建二次审核申请记录
   * 
   * @complexity O(1) - 常数时间复杂度，单个申请记录创建
   * @flow 模拟申请数据创建 → 申请列表更新 → 申请对象返回
   * 
   * @param {string} taskId - 任务ID
   * @param {number} currentViewCount - 当前观看量
   * @param {string} proofScreenshot - 证明截图（可选）
   * @returns {Promise<SecondAuditRequest>} 二次审核申请对象
   * 
   * @example
   * ```typescript
   * const request = await rewardStore.requestSecondAudit('task123', 350, 'screenshot.jpg')
   * console.log(`二次审核申请已提交: ${request.id}`)
   * ```
   */
  const requestSecondAudit = async (taskId: string, currentViewCount: number, proofScreenshot?: string) => {
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据申请二次审核，taskId:', taskId, 'viewCount:', currentViewCount)

      // 模拟申请结果
      const mockRequest = {
        id: `second_audit_${Date.now()}`,
        taskId,
        agentId: 'current_agent',
        currentViewCount,
        thresholdViewCount: 300,
        proofScreenshot,
        requestStatus: 'PENDING' as const,
        requestDate: new Date().toISOString(),
        bonusAmount: 4.0,
        settlementType: 'IMMEDIATE' as const
      }

      // 模拟刷新申请列表
      secondAuditRequests.value.unshift(mockRequest)

      return mockRequest

      // 如果需要真实API，取消注释下面的代码
      // const request = await rewardApi.requestSecondAudit({
      //   taskId,
      //   currentViewCount,
      //   proofScreenshot
      // })
      // await fetchSecondAuditRequests()
      // return request

    } catch (error) {
      console.error('申请二次审核失败:', error)
      throw error
    }
  }

  /**
   * 获取二次审核申请列表
   * 获取二次审核申请的分页列表数据，支持筛选和排序
   * 
   * @complexity O(1) - API调用为常数时间复杂度
   * @flow 查询参数构建 → API调用 → 申请列表更新 → 分页信息更新
   * 
   * @param {SecondAuditRequestQuery} params - 查询参数（可选）
   * @returns {Promise<void>} 异步操作完成
   * 
   * @example
   * ```typescript
   * await rewardStore.fetchSecondAuditRequests({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'PENDING'
   * })
   * console.log(`获取到 ${rewardStore.secondAuditRequests.length} 条申请`)
   * ```
   */
  const fetchSecondAuditRequests = async (params: SecondAuditRequestQuery = {}) => {
    secondAuditLoading.value = true
    try {
      const query = {
        page: secondAuditPagination.value.page,
        pageSize: secondAuditPagination.value.pageSize,
        ...params
      }
      
      const response: ApiListResponse<SecondAuditRequest> = await rewardApi.getSecondAuditRequests(query)
      secondAuditRequests.value = response.list
      secondAuditPagination.value.total = response.total
      secondAuditPagination.value.page = response.page || query.page
      secondAuditPagination.value.pageSize = response.pageSize || query.pageSize
    } catch (error) {
      console.error('获取二次审核申请列表失败:', error)
      throw error
    } finally {
      secondAuditLoading.value = false
    }
  }

  /**
   * 检查任务二次审核资格
   * 检查指定任务是否符合二次审核的条件和资格
   * 目前使用模拟数据返回资格检查结果
   * 
   * @complexity O(1) - 常数时间复杂度，资格检查逻辑
   * @flow 模拟资格检查 → 结果对象构建 → 检查结果返回
   * 
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 资格检查结果对象
   * 
   * @example
   * ```typescript
   * const eligibility = await rewardStore.checkSecondAuditEligibility('task123')
   * if (eligibility.eligible) {
   *   console.log('任务符合二次审核条件')
   * } else {
   *   console.log(`不符合条件: ${eligibility.reason}`)
   * }
   * ```
   */
  const checkSecondAuditEligibility = async (taskId: string) => {
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据检查二次审核资格，taskId:', taskId)

      // 模拟资格检查结果
      const mockEligibilityResult = {
        eligible: true,
        reason: undefined,
        hasExistingRequest: false,
        existingRequestStatus: undefined
      }

      return mockEligibilityResult

      // 如果需要真实API，取消注释下面的代码
      // return await rewardApi.checkSecondAuditEligibility(taskId)

    } catch (error) {
      console.error('检查二次审核资格失败:', error)
      throw error
    }
  }

  /**
   * 预览周结算
   * 预览指定代理在特定周期的结算计算结果，包括任务统计和奖励金额
   * 目前使用模拟数据提供完整的周结算预览信息
   * 
   * @complexity O(1) - 常数时间复杂度，预览数据生成
   * @flow 模拟预览数据生成 → 预览状态更新 → 预览结果返回
   * 
   * @param {string} agentId - 代理ID
   * @param {string} settlementWeek - 结算周期（可选）
   * @returns {Promise<WeeklySettlementCalculation>} 周结算预览对象
   * 
   * @example
   * ```typescript
   * const preview = await rewardStore.previewWeeklySettlement('agent123', '2024-W03')
   * if (preview.isQualified) {
   *   console.log(`预计奖励: ${preview.totalRewardAmount}`)
   * } else {
   *   console.log(`还需完成 ${preview.remainingTasksNeeded} 个任务`)
   * }
   * ```
   */
  const previewWeeklySettlement = async (agentId: string, settlementWeek?: string) => {
    settlementPreviewLoading.value = true
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[RewardStore] 使用模拟数据预览周结算，agentId:', agentId, 'week:', settlementWeek)

      // 模拟周结算预览数据
      const mockPreview = {
        agentId,
        settlementWeek: settlementWeek || '2024-W03',
        weekStartDate: '2024-01-15',
        weekEndDate: '2024-01-21',
        submittedTasksCount: 3,
        approvedTasksCount: 2,
        qualifiedTasksCount: 0,
        baseRewardAmount: 0,
        bonusRewardAmount: 0,
        totalRewardAmount: 0,
        isQualified: false,
        qualificationThreshold: 10,
        remainingTasksNeeded: 8
      }

      settlementPreview.value = mockPreview

      // 如果需要真实API，取消注释下面的代码
      // settlementPreview.value = await rewardApi.previewWeeklySettlement(agentId, settlementWeek)

      return settlementPreview.value
    } catch (error) {
      console.error('预览周结算失败:', error)
      throw error
    } finally {
      settlementPreviewLoading.value = false
    }
  }

  /**
   * 获取当前周期信息
   * 获取当前的结算周期信息，包括周期开始时间、结束时间等
   * 
   * @complexity O(1) - 单次API调用，常数时间复杂度
   * @flow API调用 → 周期信息获取 → 结果返回
   * 
   * @returns {Promise<any>} 当前周期信息对象
   * 
   * @example
   * ```typescript
   * const weekInfo = await rewardStore.getCurrentWeekInfo()
   * console.log(`当前周期: ${weekInfo.currentWeek}`)
   * ```
   */
  const getCurrentWeekInfo = async () => {
    try {
      return await rewardApi.getCurrentWeekInfo()
    } catch (error) {
      console.error('获取当前周期信息失败:', error)
      throw error
    }
  }

  /**
   * 更新结算列表分页
   * 更新奖励结算列表的当前页码
   * 
   * @complexity O(1) - 常数时间复杂度，简单赋值操作
   * @flow 页码参数验证 → 分页状态更新
   * 
   * @param {number} page - 目标页码
   * 
   * @example
   * ```typescript
   * rewardStore.updateSettlementsPage(3)
   * console.log(`切换到第 ${page} 页`)
   * ```
   */
  const updateSettlementsPage = (page: number) => {
    settlementsPagination.value.page = page
  }

  /**
   * 更新二次审核申请分页
   * 更新二次审核申请列表的当前页码
   * 
   * @complexity O(1) - 常数时间复杂度，简单赋值操作
   * @flow 页码参数验证 → 分页状态更新
   * 
   * @param {number} page - 目标页码
   * 
   * @example
   * ```typescript
   * rewardStore.updateSecondAuditPage(2)
   * console.log(`二次审核列表切换到第 ${page} 页`)
   * ```
   */
  const updateSecondAuditPage = (page: number) => {
    secondAuditPagination.value.page = page
  }

  /**
   * 重置Store状态
   * 将所有状态重置为初始值，清空数据和加载状态
   * 
   * @complexity O(1) - 常数时间复杂度，状态重置操作
   * @flow 各状态字段重置 → 分页信息重置 → 统计数据清空
   * 
   * @example
   * ```typescript
   * rewardStore.resetStore()
   * console.log('奖励Store状态已重置')
   * ```
   */
  const resetStore = () => {
    settlements.value = []
    settlementsPagination.value = { page: 1, pageSize: 20, total: 0 }
    secondAuditRequests.value = []
    secondAuditPagination.value = { page: 1, pageSize: 20, total: 0 }
    submissionLimit.value = {
      canSubmit: false,
      currentCount: 0,
      dailyLimit: 2,
      remainingCount: 0,
      nextResetTime: ''
    }
    statistics.value = {
      totalEarnings: 0,
      currentWeekEarnings: 0,
      pendingRewards: 0,
      completedSettlements: 0,
      thisWeekTasksCount: 0,
      thisWeekApprovedCount: 0,
      secondAuditBonusCount: 0,
      averageWeeklyEarnings: 0
    }
    settlementPreview.value = null
    selectedSettlement.value = null
    selectedSecondAuditRequest.value = null
  }

  return {
    // 状态
    settlements,
    settlementsPagination,
    settlementsLoading,
    secondAuditRequests,
    secondAuditPagination,
    secondAuditLoading,
    submissionLimit,
    submissionLimitLoading,
    statistics,
    statisticsLoading,
    settlementPreview,
    settlementPreviewLoading,
    selectedSettlement,
    selectedSecondAuditRequest,

    // 计算属性
    canSubmitTask,
    reachedWeeklyThreshold,
    expectedWeeklyReward,
    completedSettlementsCount,

    // 方法
    checkSubmissionLimit,
    recordTaskSubmission,
    fetchRewardSettlements,
    fetchSettlementDetail,
    fetchRewardStatistics,
    requestSecondAudit,
    fetchSecondAuditRequests,
    checkSecondAuditEligibility,
    previewWeeklySettlement,
    getCurrentWeekInfo,
    updateSettlementsPage,
    updateSecondAuditPage,
    resetStore
  }
})