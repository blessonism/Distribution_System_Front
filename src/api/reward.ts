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
 * 奖励结算系统相关 API 接口模块
 * 提供完整的奖励管理功能，包括结算计算、二次审核、客资奖励和统计分析
 * 支持周期性结算、提交限制控制和奖励规则管理
 * 
 * @namespace rewardApi
 */
export const rewardApi = {
  /**
   * 检查代理每日提交限制接口
   * 验证指定代理当日是否还能提交新的推广任务，防止超出每日限额
   * 
   * @param {string} agentId - 代理的唯一标识符
   * @returns {Promise<SubmissionLimitCheck>} 提交限制检查结果，包含剩余次数和限制信息
   * @throws {Error} 检查失败时抛出错误（代理不存在、系统错误等）
   * @complexity O(1) - 单次数据库查询加计数器检查
   * @flow 查询代理信息 -> 获取当日提交记录 -> 计算剩余额度 -> 返回限制状态
   * 
   * @example
   * ```typescript
   * const limitCheck = await rewardApi.checkSubmissionLimit('agent-123')
   * if (limitCheck.canSubmit) {
   *   console.log(`还可提交 ${limitCheck.remainingSubmissions} 次`)
   * } else {
   *   console.log(`已达每日限制 ${limitCheck.dailyLimit} 次`)
   * }
   * ```
   */
  checkSubmissionLimit: async (agentId: string): Promise<SubmissionLimitCheck> => {
    return await http.get(`/reward/submission-limit/check/${agentId}`)
  },

  /**
   * 记录任务提交接口
   * 在代理成功提交推广任务后更新提交计数器，用于每日限制控制
   * 
   * @param {string} agentId - 代理的唯一标识符
   * @returns {Promise<void>} 记录操作无返回值
   * @throws {Error} 记录失败时抛出错误（代理不存在、重复记录等）
   * @complexity O(1) - 单次数据库更新操作
   * @flow 验证代理身份 -> 更新提交计数器 -> 记录提交时间 -> 检查是否达到限制
   * 
   * @example
   * ```typescript
   * // 在成功提交任务后调用
   * await rewardApi.recordSubmission('agent-123')
   * console.log('提交记录已更新')
   * ```
   */
  recordSubmission: async (agentId: string): Promise<void> => {
    return await http.post(`/reward/submission-limit/record/${agentId}`)
  },

  /**
   * 获取代理奖励结算列表接口
   * 查询指定代理的历史结算记录，支持分页和条件筛选
   * 
   * @param {RewardSettlementQuery} params - 查询参数，包含分页、时间范围、状态等筛选条件
   * @returns {Promise<ApiListResponse<RewardSettlement>>} 分页的结算记录列表
   * @throws {Error} 查询失败时抛出错误（权限不足、参数错误等）
   * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页
   * @flow 构建查询条件 -> 数据库查询 -> 应用筛选 -> 分页处理 -> 返回结算记录
   * 
   * @example
   * ```typescript
   * const settlements = await rewardApi.getRewardSettlements({
   *   agentId: 'agent-123',
   *   page: 1,
   *   pageSize: 20,
   *   startWeek: '2024-W01',
   *   endWeek: '2024-W10',
   *   status: 'COMPLETED'
   * })
   * console.log(`共 ${settlements.total} 条结算记录`)
   * ```
   */
  getRewardSettlements: async (params: RewardSettlementQuery): Promise<ApiListResponse<RewardSettlement>> => {
    return await http.get('/reward/settlements', { params })
  },

  /**
   * 获取结算详情接口
   * 获取指定代理在特定周期的详细结算信息，包括计算明细和奖励分解
   * 
   * @param {string} agentId - 代理ID
   * @param {string} settlementWeek - 结算周期，格式为 YYYY-WXX（如：2024-W01）
   * @returns {Promise<RewardSettlement>} 详细的结算信息对象
   * @throws {Error} 获取失败时抛出错误（结算记录不存在、权限不足等）
   * @complexity O(1) - 单次数据库查询加关联数据获取
   * @flow 验证代理和周期 -> 查询结算记录 -> 关联任务明细 -> 计算奖励分解 -> 返回详情
   * 
   * @example
   * ```typescript
   * const detail = await rewardApi.getSettlementDetail('agent-123', '2024-W01')
   * console.log(`总奖励: ${detail.totalReward}元`)
   * console.log(`任务数: ${detail.taskCount}个`)
   * console.log(`奖励明细: ${detail.rewardBreakdown.length}项`)
   * ```
   */
  getSettlementDetail: async (agentId: string, settlementWeek: string): Promise<RewardSettlement> => {
    return await http.get(`/reward/settlements/${agentId}/${settlementWeek}`)
  },

  /**
   * 执行周结算计算接口
   * 对指定周期执行奖励结算计算，生成所有符合条件代理的结算记录
   * 
   * @param {string} settlementWeek - 结算周期，格式为 YYYY-WXX
   * @returns {Promise<WeeklySettlementCalculation[]>} 周结算计算结果列表
   * @throws {Error} 计算失败时抛出错误（周期已结算、数据不完整等）
   * @complexity O(n*m) - n为代理数量，m为平均任务数量，复杂的聚合计算
   * @flow 验证结算周期 -> 查询所有代理任务 -> 应用奖励规则 -> 计算结算金额 -> 生成结算记录
   * 
   * @example
   * ```typescript
   * const calculations = await rewardApi.executeWeeklySettlement('2024-W01')
   * console.log(`结算完成，处理 ${calculations.length} 个代理`)
   * calculations.forEach(calc => {
   *   console.log(`代理 ${calc.agentName}: ${calc.totalReward}元`)
   * })
   * ```
   */
  executeWeeklySettlement: async (settlementWeek: string): Promise<WeeklySettlementCalculation[]> => {
    return await http.post(`/reward/settlements/execute/${settlementWeek}`)
  },

  /**
   * 获取奖励统计数据接口
   * 获取指定代理的奖励统计信息，包括总计、趋势和排名等数据
   * 
   * @param {string} agentId - 代理ID
   * @returns {Promise<RewardStatistics>} 奖励统计数据对象
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(n) - n为统计时间范围内的记录数量，涉及聚合计算
   * @flow 查询代理奖励记录 -> 计算统计指标 -> 生成趋势数据 -> 计算排名 -> 返回统计结果
   * 
   * @example
   * ```typescript
   * const stats = await rewardApi.getRewardStatistics('agent-123')
   * console.log(`总奖励: ${stats.totalReward}元`)
   * console.log(`本月奖励: ${stats.monthlyReward}元`)
   * console.log(`排名: ${stats.ranking}`)
   * ```
   */
  getRewardStatistics: async (agentId: string): Promise<RewardStatistics> => {
    return await http.get(`/reward/statistics/${agentId}`)
  },

  /**
   * 申请二次审核接口
   * 代理对已拒绝的任务申请二次审核，提供申诉理由和补充材料
   * 
   * @param {SecondAuditRequestSubmission} request - 二次审核申请数据，包含任务ID、申诉理由等
   * @returns {Promise<SecondAuditRequest>} 创建的二次审核申请记录
   * @throws {Error} 申请失败时抛出错误（任务不符合条件、重复申请等）
   * @complexity O(1) - 单次数据库插入加状态验证
   * @flow 验证任务状态 -> 检查申请资格 -> 创建申请记录 -> 触发审核流程 -> 返回申请信息
   * 
   * @example
   * ```typescript
   * const auditRequest = await rewardApi.requestSecondAudit({
   *   taskId: 'task-123',
   *   reason: '内容符合规范，请重新审核',
   *   additionalEvidence: ['screenshot1.jpg', 'proof.pdf'],
   *   contactInfo: 'agent@example.com'
   * })
   * console.log(`二次审核申请已提交: ${auditRequest.id}`)
   * ```
   */
  requestSecondAudit: async (request: SecondAuditRequestSubmission): Promise<SecondAuditRequest> => {
    return await http.post('/reward/second-audit/request', request)
  },

  /**
   * 获取二次审核申请列表接口
   * 查询二次审核申请记录，支持按状态、时间等条件筛选
   * 
   * @param {SecondAuditRequestQuery} params - 查询参数，包含分页、筛选、排序条件
   * @returns {Promise<ApiListResponse<SecondAuditRequest>>} 分页的二次审核申请列表
   * @throws {Error} 查询失败时抛出错误
   * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页
   * @flow 构建查询条件 -> 数据库查询 -> 应用筛选 -> 分页处理 -> 返回申请列表
   * 
   * @example
   * ```typescript
   * const requests = await rewardApi.getSecondAuditRequests({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'PENDING',
   *   agentId: 'agent-123',
   *   startDate: '2024-01-01'
   * })
   * console.log(`共 ${requests.total} 个二次审核申请`)
   * ```
   */
  getSecondAuditRequests: async (params: SecondAuditRequestQuery): Promise<ApiListResponse<SecondAuditRequest>> => {
    return await http.get('/reward/second-audit/requests', { params })
  },

  /**
   * 获取二次审核申请详情接口
   * 获取指定二次审核申请的完整信息，包括申请内容、审核历史等
   * 
   * @param {string} requestId - 二次审核申请ID
   * @returns {Promise<SecondAuditRequest>} 二次审核申请详细信息
   * @throws {Error} 获取失败时抛出错误（申请不存在、权限不足等）
   * @complexity O(1) - 单次数据库查询加关联数据获取
   * @flow 验证申请存在 -> 查询申请详情 -> 关联原任务信息 -> 获取审核历史 -> 返回完整信息
   * 
   * @example
   * ```typescript
   * const requestDetail = await rewardApi.getSecondAuditRequestDetail('request-123')
   * console.log(`申请状态: ${requestDetail.status}`)
   * console.log(`申请理由: ${requestDetail.reason}`)
   * console.log(`审核意见: ${requestDetail.auditComment}`)
   * ```
   */
  getSecondAuditRequestDetail: async (requestId: string): Promise<SecondAuditRequest> => {
    return await http.get(`/reward/second-audit/requests/${requestId}`)
  },

  /**
   * 审核二次审核申请接口（管理员专用）
   * 管理员对二次审核申请进行审核，决定是否重新审核原任务
   * 
   * @param {string} requestId - 申请ID
   * @param {'APPROVED' | 'REJECTED'} decision - 审核决定（通过或拒绝）
   * @param {string} [comment] - 可选的审核意见
   * @returns {Promise<SecondAuditRequest>} 审核后的申请信息
   * @throws {Error} 审核失败时抛出错误（权限不足、申请状态冲突等）
   * @complexity O(1) - 单次审核操作加状态更新
   * @flow 验证审核权限 -> 检查申请状态 -> 执行审核决定 -> 更新申请状态 -> 触发后续流程
   * 
   * @example
   * ```typescript
   * // 通过二次审核申请
   * const approved = await rewardApi.auditSecondAuditRequest(
   *   'request-123',
   *   'APPROVED',
   *   '申诉理由充分，同意重新审核'
   * )
   * 
   * // 拒绝二次审核申请
   * const rejected = await rewardApi.auditSecondAuditRequest(
   *   'request-456',
   *   'REJECTED',
   *   '申诉理由不充分，维持原审核结果'
   * )
   * ```
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
   * 检查二次审核资格接口
   * 验证指定任务是否符合申请二次审核的条件
   * 
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 资格检查结果，包含是否符合条件、原因等信息
   * @throws {Error} 检查失败时抛出错误
   * @complexity O(1) - 单次数据库查询加规则验证
   * @flow 查询任务信息 -> 检查任务状态 -> 验证审核资格 -> 检查重复申请 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * const eligibility = await rewardApi.checkSecondAuditEligibility('task-123')
   * if (eligibility.eligible) {
   *   console.log('可以申请二次审核')
   * } else {
   *   console.log(`无法申请，原因: ${eligibility.reason}`)
   * }
   * 
   * if (eligibility.hasExistingRequest) {
   *   console.log(`已有申请，状态: ${eligibility.existingRequestStatus}`)
   * }
   * ```
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
   * 获取当前周期信息接口
   * 获取当前奖励结算周期的详细信息，包括周期范围和结算状态
   * 
   * @returns {Promise<Object>} 当前周期信息，包含周期标识、起止日期、结算状态等
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 基于系统时间的周期计算
   * @flow 获取系统时间 -> 计算当前周期 -> 判断结算状态 -> 返回周期信息
   * 
   * @example
   * ```typescript
   * const weekInfo = await rewardApi.getCurrentWeekInfo()
   * console.log(`当前周期: ${weekInfo.currentWeek}`)
   * console.log(`周期范围: ${weekInfo.weekStartDate} ~ ${weekInfo.weekEndDate}`)
   * console.log(`是否结算期: ${weekInfo.isSettlementTime ? '是' : '否'}`)
   * ```
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
   * 预览周结算计算结果接口
   * 预览指定代理和周期的结算计算，不实际执行结算操作
   * 
   * @param {string} agentId - 代理ID
   * @param {string} [settlementWeek] - 可选的结算周期，不指定则使用当前周期
   * @returns {Promise<WeeklySettlementCalculation>} 预览的结算计算结果
   * @throws {Error} 预览失败时抛出错误（代理不存在、数据不完整等）
   * @complexity O(n) - n为该代理在指定周期的任务数量
   * @flow 验证代理存在 -> 获取任务数据 -> 应用奖励规则 -> 计算预览结果 -> 返回计算详情
   * 
   * @example
   * ```typescript
   * // 预览当前周期结算
   * const preview = await rewardApi.previewWeeklySettlement('agent-123')
   * console.log(`预计奖励: ${preview.totalReward}元`)
   * console.log(`任务数量: ${preview.taskCount}个`)
   * 
   * // 预览指定周期结算
   * const specificPreview = await rewardApi.previewWeeklySettlement('agent-123', '2024-W01')
   * ```
   */
  previewWeeklySettlement: async (agentId: string, settlementWeek?: string): Promise<WeeklySettlementCalculation> => {
    const params = settlementWeek ? { week: settlementWeek } : {}
    return await http.get(`/reward/settlements/preview/${agentId}`, { params })
  },

  /**
   * 创建客资审核奖励记录接口
   * 根据客资审核结果创建相应的奖励记录，计算奖励金额
   * 
   * @param {string} leadId - 客资ID
   * @param {Object} auditResult - 审核结果数据，包含审核动作、相关人员等信息
   * @returns {Promise<Object>} 创建的奖励记录信息，包含奖励ID、金额等
   * @throws {Error} 创建失败时抛出错误（客资不存在、重复创建等）
   * @complexity O(1) - 单次奖励计算加数据库插入
   * @flow 验证客资信息 -> 应用奖励规则 -> 计算奖励金额 -> 创建奖励记录 -> 返回结果
   * 
   * @example
   * ```typescript
   * const reward = await rewardApi.createLeadAuditReward('lead-123', {
   *   action: 'APPROVE',
   *   salespersonId: 'sales-456',
   *   auditorId: 'auditor-789',
   *   leadSource: 'website',
   *   leadValue: 50000
   * })
   * console.log(`奖励创建成功: ${reward.rewardAmount}元`)
   * console.log(`奖励类型: ${reward.rewardType}`)
   * ```
   */
  createLeadAuditReward: async (leadId: string, auditResult: {
    action: 'APPROVE' | 'REJECT'
    salespersonId: string
    auditorId: string
    leadSource: string
    leadValue?: number
  }): Promise<{
    rewardId: string
    rewardAmount: number
    rewardType: string
    eligibleForBonus: boolean
  }> => {
    return await http.post('/reward/lead-audit-reward', {
      leadId,
      ...auditResult
    })
  },

  /**
   * 批量创建客资审核奖励记录接口
   * 一次性为多个客资审核结果创建奖励记录，提高处理效率
   * 
   * @param {Array} rewards - 批量奖励数据数组，每项包含客资和审核信息
   * @returns {Promise<Array>} 批量处理结果，包含成功和失败的详细信息
   * @throws {Error} 批量处理失败时抛出错误
   * @complexity O(n) - n为批量处理的客资数量
   * @flow 验证批量数据 -> 逐个处理奖励创建 -> 记录成功失败状态 -> 返回批量结果
   * 
   * @example
   * ```typescript
   * const batchResults = await rewardApi.batchCreateLeadAuditRewards([
   *   {
   *     leadId: 'lead-123',
   *     action: 'APPROVE',
   *     salespersonId: 'sales-456',
   *     auditorId: 'auditor-789',
   *     leadSource: 'website'
   *   },
   *   {
   *     leadId: 'lead-456',
   *     action: 'REJECT',
   *     salespersonId: 'sales-789',
   *     auditorId: 'auditor-789',
   *     leadSource: 'phone'
   *   }
   * ])
   * 
   * batchResults.forEach(result => {
   *   if (result.success) {
   *     console.log(`客资 ${result.leadId} 奖励创建成功: ${result.rewardAmount}元`)
   *   } else {
   *     console.error(`客资 ${result.leadId} 处理失败: ${result.error}`)
   *   }
   * })
   * ```
   */
  batchCreateLeadAuditRewards: async (rewards: Array<{
    leadId: string
    action: 'APPROVE' | 'REJECT'
    salespersonId: string
    auditorId: string
    leadSource: string
    leadValue?: number
  }>): Promise<Array<{
    leadId: string
    success: boolean
    rewardId?: string
    rewardAmount?: number
    error?: string
  }>> => {
    return await http.post('/reward/lead-audit-reward/batch', { rewards })
  },

  /**
   * 获取客资奖励计算规则接口
   * 获取当前系统的客资奖励计算规则配置，包括基础金额、倍数等参数
   * 
   * @returns {Promise<Object>} 奖励规则配置对象，包含各项计算参数
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 配置数据查询
   * @flow 查询规则配置 -> 返回规则参数
   * 
   * @example
   * ```typescript
   * const rules = await rewardApi.getLeadRewardRules()
   * console.log(`基础奖励: ${rules.baseRewardAmount}元`)
   * console.log(`奖金倍数: ${rules.bonusMultiplier}`)
   * console.log(`质量阈值: ${rules.qualityThreshold}`)
   * console.log('来源倍数:', rules.sourceMultipliers)
   * ```
   */
  getLeadRewardRules: async (): Promise<{
    baseRewardAmount: number
    bonusMultiplier: number
    qualityThreshold: number
    sourceMultipliers: Record<string, number>
  }> => {
    return await http.get('/reward/lead-reward-rules')
  },

  /**
   * 计算客资奖励金额接口（预览）
   * 根据客资数据预览计算奖励金额，不实际创建奖励记录
   * 
   * @param {Object} leadData - 客资数据，包含来源、销售员、价值等信息
   * @returns {Promise<Object>} 奖励计算结果，包含详细的计算过程和最终金额
   * @throws {Error} 计算失败时抛出错误（数据不完整、规则错误等）
   * @complexity O(1) - 奖励规则计算
   * @flow 获取奖励规则 -> 应用计算逻辑 -> 计算各项奖励 -> 返回详细结果
   * 
   * @example
   * ```typescript
   * const calculation = await rewardApi.calculateLeadReward({
   *   source: 'website',
   *   salespersonId: 'sales-123',
   *   leadValue: 100000,
   *   qualityScore: 85
   * })
   * 
   * console.log(`基础奖励: ${calculation.baseReward}元`)
   * console.log(`奖金奖励: ${calculation.bonusReward}元`)
   * console.log(`总奖励: ${calculation.totalReward}元`)
   * console.log('计算明细:', calculation.calculation)
   * ```
   */
  calculateLeadReward: async (leadData: {
    source: string
    salespersonId: string
    leadValue?: number
    qualityScore?: number
  }): Promise<{
    baseReward: number
    bonusReward: number
    totalReward: number
    calculation: {
      baseAmount: number
      sourceMultiplier: number
      qualityBonus: number
      finalAmount: number
    }
  }> => {
    return await http.post('/reward/lead-reward-calculate', leadData)
  }
}