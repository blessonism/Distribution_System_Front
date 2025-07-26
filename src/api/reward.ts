import { http } from '@/utils/request'
import type { 
  RewardSettlement,
  RewardSettlementQuery,
  SecondAuditRequest,
  SecondAuditRequestQuery,
  SecondAuditRequestSubmission,
  SubmissionLimitCheck,
  WeeklySettlementCalculation,
  RewardStatistics
} from '@/types/reward'
import type { ApiListResponse } from '@/types/api'

/**
 * 奖励相关API接口
 */
export const rewardApi = {
  /**
   * 检查每日提交限制
   * @param agentId 代理ID
   */
  checkSubmissionLimit: async (agentId: string): Promise<SubmissionLimitCheck> => {
    return await http.get(`/reward/submission-limit/check/${agentId}`)
  },

  /**
   * 记录任务提交（用于更新提交计数器）
   * @param agentId 代理ID
   */
  recordSubmission: async (agentId: string): Promise<void> => {
    return await http.post(`/reward/submission-limit/record/${agentId}`)
  },

  /**
   * 获取代理的奖励结算列表
   * @param params 查询参数
   */
  getRewardSettlements: async (params: RewardSettlementQuery): Promise<ApiListResponse<RewardSettlement>> => {
    return await http.get('/reward/settlements', { params })
  },

  /**
   * 获取指定代理指定周的结算详情
   * @param agentId 代理ID
   * @param settlementWeek 结算周期 (如: 2024-W01)
   */
  getSettlementDetail: async (agentId: string, settlementWeek: string): Promise<RewardSettlement> => {
    return await http.get(`/reward/settlements/${agentId}/${settlementWeek}`)
  },

  /**
   * 执行周结算计算
   * @param settlementWeek 结算周期
   */
  executeWeeklySettlement: async (settlementWeek: string): Promise<WeeklySettlementCalculation[]> => {
    return await http.post(`/reward/settlements/execute/${settlementWeek}`)
  },

  /**
   * 获取奖励统计数据
   * @param agentId 代理ID
   */
  getRewardStatistics: async (agentId: string): Promise<RewardStatistics> => {
    return await http.get(`/reward/statistics/${agentId}`)
  },

  /**
   * 申请二次审核
   * @param request 申请数据
   */
  requestSecondAudit: async (request: SecondAuditRequestSubmission): Promise<SecondAuditRequest> => {
    return await http.post('/reward/second-audit/request', request)
  },

  /**
   * 获取二次审核申请列表
   * @param params 查询参数
   */
  getSecondAuditRequests: async (params: SecondAuditRequestQuery): Promise<ApiListResponse<SecondAuditRequest>> => {
    return await http.get('/reward/second-audit/requests', { params })
  },

  /**
   * 获取二次审核申请详情
   * @param requestId 申请ID
   */
  getSecondAuditRequestDetail: async (requestId: string): Promise<SecondAuditRequest> => {
    return await http.get(`/reward/second-audit/requests/${requestId}`)
  },

  /**
   * 审核二次审核申请（管理员专用）
   * @param requestId 申请ID
   * @param decision 审核决定
   * @param comment 审核意见
   */
  auditSecondAuditRequest: async (
    requestId: string, 
    decision: 'APPROVED' | 'REJECTED', 
    comment?: string
  ): Promise<SecondAuditRequest> => {
    return await http.put(`/reward/second-audit/requests/${requestId}/audit`, {
      decision,
      comment
    })
  },

  /**
   * 检查任务是否可以申请二次审核
   * @param taskId 任务ID
   */
  checkSecondAuditEligibility: async (taskId: string): Promise<{
    eligible: boolean
    reason?: string
    hasExistingRequest: boolean
    existingRequestStatus?: string
  }> => {
    return await http.get(`/reward/second-audit/check-eligibility/${taskId}`)
  },

  /**
   * 获取当前周期信息
   */
  getCurrentWeekInfo: async (): Promise<{
    currentWeek: string
    weekStartDate: string
    weekEndDate: string
    isSettlementTime: boolean
  }> => {
    return await http.get('/reward/current-week-info')
  },

  /**
   * 预览周结算计算结果（不实际执行）
   * @param agentId 代理ID
   * @param settlementWeek 结算周期
   */
  previewWeeklySettlement: async (agentId: string, settlementWeek?: string): Promise<WeeklySettlementCalculation> => {
    const params = settlementWeek ? { week: settlementWeek } : {}
    return await http.get(`/reward/settlements/preview/${agentId}`, { params })
  }
}