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
 * 奖励管理Store
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
  
  // 是否可以提交任务
  const canSubmitTask = computed(() => submissionLimit.value.canSubmit)
  
  // 本周是否达到结算门槛
  const reachedWeeklyThreshold = computed(() => 
    statistics.value.thisWeekApprovedCount >= 10
  )

  // 本周预期奖励
  const expectedWeeklyReward = computed(() => {
    const baseReward = statistics.value.thisWeekApprovedCount * 1.0
    return reachedWeeklyThreshold.value ? baseReward : 0
  })

  // 已完成的结算总数
  const completedSettlementsCount = computed(() => 
    settlements.value.filter(s => s.settlementStatus === 'SETTLED').length
  )

  // ==================== Actions ====================

  /**
   * 检查提交限制
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
   * 分页相关方法
   */
  const updateSettlementsPage = (page: number) => {
    settlementsPagination.value.page = page
  }

  const updateSecondAuditPage = (page: number) => {
    secondAuditPagination.value.page = page
  }

  /**
   * 重置store状态
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