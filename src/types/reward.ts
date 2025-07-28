/**
 * @fileoverview 奖励系统类型定义
 * 定义分销系统中奖励结算、二次审核、限额控制相关的核心类型接口
 * 包含奖励计算算法、结算流程管理、审核机制和统计分析等完整功能模块
 * 集成周结算体系、二次奖励审核、提交限制控制和多维度奖励统计等高级功能
 * 
 * @module types/reward
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 奖励结算记录接口
 * 定义代理商周度奖励结算的完整记录结构，包含任务统计、奖励计算和结算状态管理
 * 支持基础奖励和额外奖励的分层计算，实现精细化的奖励发放控制
 * 
 * @interface RewardSettlement
 * 
 * @complexity O(1) - 单条记录数据结构，常数时间复杂度访问
 * @flow 任务提交 → 审核通过 → 奖励计算 → 结算确认 → 发放完成
 * 
 * @example
 * ```typescript
 * const settlement: RewardSettlement = {
 *   id: 'settlement_001',
 *   agentId: 'agent_001',
 *   settlementWeek: '2024-W15',
 *   weekStartDate: '2024-04-08',
 *   weekEndDate: '2024-04-14',
 *   submittedTasksCount: 25,
 *   approvedTasksCount: 20,
 *   qualifiedTasksCount: 18,
 *   baseRewardAmount: 1800,
 *   bonusRewardAmount: 300,
 *   totalRewardAmount: 2100,
 *   settlementStatus: 'QUALIFIED',
 *   settlementDate: '2024-04-15',
 *   createdAt: '2024-04-15T09:00:00Z',
 *   updatedAt: '2024-04-15T18:30:00Z'
 * }
 * 
 * // 计算奖励合格率
 * function calculateQualificationRate(settlement: RewardSettlement): number {
 *   return (settlement.qualifiedTasksCount / settlement.approvedTasksCount) * 100
 * }
 * 
 * // 检查结算状态
 * function isSettlementComplete(settlement: RewardSettlement): boolean {
 *   return settlement.settlementStatus === 'SETTLED'
 * }
 * 
 * // 计算奖励增长率
 * function calculateBonusRate(settlement: RewardSettlement): number {
 *   return (settlement.bonusRewardAmount / settlement.baseRewardAmount) * 100
 * }
 * ```
 */
export interface RewardSettlement {
  /** 结算记录唯一标识ID */
  id: string
  /** 代理商ID */
  agentId: string
  /** 结算周次，格式：2024-W01 */
  settlementWeek: string
  /** 周起始日期 */
  weekStartDate: string
  /** 周结束日期 */
  weekEndDate: string
  
  // 任务统计
  /** 已提交任务数量 */
  submittedTasksCount: number
  /** 审核通过任务数量 */
  approvedTasksCount: number
  /** 合格任务数量（≥ 10条的合格任务数） */
  qualifiedTasksCount: number
  
  // 奖励计算
  /** 基础奖励金额（初审） */
  baseRewardAmount: number
  /** 额外奖励金额（二次审核） */
  bonusRewardAmount: number
  /** 总奖励金额 */
  totalRewardAmount: number
  
  // 结算状态
  /** 结算状态：待处理/合格/已结算/失败 */
  settlementStatus: 'PENDING' | 'QUALIFIED' | 'SETTLED' | 'FAILED'
  /** 结算日期，可选 */
  settlementDate?: string
  /** 结算原因说明，可选 */
  settlementReason?: string
  
  // 审计字段
  /** 记录创建时间 */
  createdAt: string
  /** 记录更新时间 */
  updatedAt: string
}

/**
 * 二次审核申请接口
 * 定义代理商二次审核申请的完整数据结构，包含申请条件、审核状态和奖励信息
 * 支持曝光量门槛检查、证明材料上传和奖励类型配置，实现精准的二次奖励管理
 * 
 * @interface SecondAuditRequest
 * 
 * @complexity O(1) - 单条申请记录数据结构，常数时间复杂度访问
 * @flow 提交申请 → 条件检查 → 证明审核 → 奖励批准 → 结算发放
 * 
 * @example
 * ```typescript
 * const auditRequest: SecondAuditRequest = {
 *   id: 'audit_req_001',
 *   taskId: 'task_001',
 *   agentId: 'agent_001',
 *   currentViewCount: 15000,
 *   thresholdViewCount: 10000,
 *   proofScreenshot: 'screenshot_evidence.jpg',
 *   requestStatus: 'PENDING',
 *   requestDate: '2024-04-10',
 *   bonusAmount: 50,
 *   settlementType: 'WEEKLY'
 * }
 * 
 * // 检查是否满足条件
 * function meetsAuditThreshold(request: SecondAuditRequest): boolean {
 *   return request.currentViewCount >= request.thresholdViewCount
 * }
 * 
 * // 计算超出比例
 * function calculateExcessRate(request: SecondAuditRequest): number {
 *   return ((request.currentViewCount - request.thresholdViewCount) / request.thresholdViewCount) * 100
 * }
 * 
 * // 判断审核状态
 * function isAuditCompleted(request: SecondAuditRequest): boolean {
 *   return ['APPROVED', 'REJECTED'].includes(request.requestStatus)
 * }
 * ```
 */
export interface SecondAuditRequest {
  /** 二次审核申请唯一ID */
  id: string
  /** 关联任务ID */
  taskId: string
  /** 申请人代理商ID */
  agentId: string
  
  // 申请条件
  /** 当前曝光量数值 */
  currentViewCount: number
  /** 门槛曝光量数值 */
  thresholdViewCount: number
  /** 曝光量证明截图，可选 */
  proofScreenshot?: string
  
  // 申请状态
  /** 申请状态：待审核/已通过/已驳回 */
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  /** 申请提交日期 */
  requestDate: string
  /** 审核日期，可选 */
  auditDate?: string
  /** 审核人员ID，可选 */
  auditorId?: string
  /** 审核意见，可选 */
  auditComment?: string
  
  // 奖励信息
  /** 额外奖励金额 */
  bonusAmount: number
  /** 结算类型：即时结算/周结算 */
  settlementType: 'IMMEDIATE' | 'WEEKLY'
}

/**
 * 提交限制检查结果接口
 * 定义代理商日度提交限制的检查结果，包含限额状态、剩余次数和重置时间
 * 用于实时限制控制和用户提示，确保系统稳定运行和公平竞争
 * 
 * @interface SubmissionLimitCheck
 * 
 * @complexity O(1) - 限制检查算法，常数时间复杂度
 * @flow 用户提交 → 限额检查 → 状态返回 → 界面更新 → 用户反馈
 * 
 * @example
 * ```typescript
 * const limitCheck: SubmissionLimitCheck = {
 *   canSubmit: true,
 *   currentCount: 8,
 *   dailyLimit: 10,
 *   remainingCount: 2,
 *   nextResetTime: '2024-04-11T00:00:00Z'
 * }
 * 
 * // 检查是否接近限额
 * function isNearLimit(check: SubmissionLimitCheck): boolean {
 *   return check.remainingCount <= 2 && check.remainingCount > 0
 * }
 * 
 * // 计算使用率
 * function calculateUsageRate(check: SubmissionLimitCheck): number {
 *   return (check.currentCount / check.dailyLimit) * 100
 * }
 * 
 * // 获取剩余时间
 * function getTimeUntilReset(check: SubmissionLimitCheck): number {
 *   const now = new Date().getTime()
 *   const resetTime = new Date(check.nextResetTime).getTime()
 *   return Math.max(0, resetTime - now)
 * }
 * ```
 */
export interface SubmissionLimitCheck {
  /** 是否可以提交新任务 */
  canSubmit: boolean
  /** 当前已提交数量 */
  currentCount: number
  /** 日度提交限额 */
  dailyLimit: number
  /** 剩余可提交数量 */
  remainingCount: number
  /** 下次重置时间 */
  nextResetTime: string
}

/**
 * 日提交限制记录接口
 * 定义代理商每日提交限制的持久化记录，用于限额管理和统计分析
 * 支持动态限额调整和历史记录追踪，实现精细化的提交控制机制
 * 
 * @interface DailySubmissionLimit
 * 
 * @complexity O(1) - 单条记录数据结构，常数时间复杂度访问
 * @flow 用户提交 → 记录更新 → 限额检查 → 日度重置 → 周期循环
 * 
 * @example
 * ```typescript
 * const dailyLimit: DailySubmissionLimit = {
 *   id: 'limit_001',
 *   agentId: 'agent_001',
 *   submissionDate: '2024-04-10',
 *   submissionCount: 8,
 *   dailyLimit: 10,
 *   createdAt: '2024-04-10T00:00:00Z',
 *   updatedAt: '2024-04-10T18:30:00Z'
 * }
 * 
 * // 检查是否超出限额
 * function isOverLimit(limit: DailySubmissionLimit): boolean {
 *   return limit.submissionCount >= limit.dailyLimit
 * }
 * 
 * // 计算使用率
 * function getUsagePercentage(limit: DailySubmissionLimit): number {
 *   return (limit.submissionCount / limit.dailyLimit) * 100
 * }
 * 
 * // 检查是否需要警告
 * function needsWarning(limit: DailySubmissionLimit): boolean {
 *   return limit.submissionCount >= limit.dailyLimit * 0.8
 * }
 * ```
 */
export interface DailySubmissionLimit {
  /** 限制记录唯一ID */
  id: string
  /** 代理商ID */
  agentId: string
  /** 提交日期，格式：YYYY-MM-DD */
  submissionDate: string
  /** 当日已提交数量 */
  submissionCount: number
  /** 当日提交限额 */
  dailyLimit: number
  /** 记录创建时间 */
  createdAt: string
  /** 记录更新时间 */
  updatedAt: string
}

/**
 * 奖励结算查询参数接口
 * 定义查询奖励结算记录时的筛选条件和分页参数，支持多维度综合查询
 * 支持按代理商、周次、状态等条件进行精准筛选，实现高效的数据检索
 * 
 * @interface RewardSettlementQuery
 * 
 * @complexity O(log n) - 数据库索引查询，对数时间复杂度
 * @flow 参数构建 → 条件筛选 → 数据查询 → 结果分页 → 数据返回
 * 
 * @example
 * ```typescript
 * const queryParams: RewardSettlementQuery = {
 *   agentId: 'agent_001',
 *   week: '2024-W15',
 *   status: 'QUALIFIED',
 *   page: 1,
 *   pageSize: 20
 * }
 * 
 * // 构建全量查询
 * const allSettlements: RewardSettlementQuery = {
 *   page: 1,
 *   pageSize: 50
 * }
 * 
 * // 按状态筛选
 * const pendingQuery: RewardSettlementQuery = {
 *   status: 'PENDING',
 *   page: 1,
 *   pageSize: 10
 * }
 * 
 * // 按时间范围查询
 * function createWeekRangeQuery(startWeek: string, endWeek: string): RewardSettlementQuery {
 *   return {
 *     week: `${startWeek}_${endWeek}`,
 *     page: 1,
 *     pageSize: 100
 *   }
 * }
 * ```
 */
export interface RewardSettlementQuery {
  /** 代理商ID筛选，可选 */
  agentId?: string
  /** 周次筛选，格式：2024-W01，可选 */
  week?: string
  /** 结算状态筛选，可选 */
  status?: string
  /** 页码，可选 */
  page?: number
  /** 每页数量，可选 */
  pageSize?: number
}

/**
 * 二次审核申请查询参数接口
 * 定义查询二次审核申请记录时的筛选条件和分页参数，支持多维度综合查询
 * 支持按代理商、任务、状态等条件进行精准筛选，实现高效的审核记录管理
 * 
 * @interface SecondAuditRequestQuery
 * 
 * @complexity O(log n) - 数据库索引查询，对数时间复杂度
 * @flow 参数构建 → 条件筛选 → 数据查询 → 结果分页 → 数据返回
 * 
 * @example
 * ```typescript
 * const auditQuery: SecondAuditRequestQuery = {
 *   agentId: 'agent_001',
 *   taskId: 'task_001',
 *   status: 'PENDING',
 *   page: 1,
 *   pageSize: 15
 * }
 * 
 * // 按状态查询
 * const pendingRequests: SecondAuditRequestQuery = {
 *   status: 'PENDING',
 *   page: 1,
 *   pageSize: 20
 * }
 * 
 * // 按代理商查询
 * const agentRequests: SecondAuditRequestQuery = {
 *   agentId: 'agent_001',
 *   page: 1,
 *   pageSize: 10
 * }
 * ```
 */
export interface SecondAuditRequestQuery {
  /** 代理商ID筛选，可选 */
  agentId?: string
  /** 任务ID筛选，可选 */
  taskId?: string
  /** 审核状态筛选，可选 */
  status?: string
  /** 页码，可选 */
  page?: number
  /** 每页数量，可选 */
  pageSize?: number
}

/**
 * 二次审核申请提交数据接口
 * 定义代理商提交二次审核申请时的数据结构，包含必要的任务信息和证明材料
 * 用于前端表单提交和后端数据验证，确保申请信息的完整性和准确性
 * 
 * @interface SecondAuditRequestSubmission
 * 
 * @complexity O(1) - 简单数据结构，常数时间复杂度访问
 * @flow 用户输入 → 数据验证 → 表单提交 → 后端处理 → 结果反馈
 * 
 * @example
 * ```typescript
 * const submission: SecondAuditRequestSubmission = {
 *   taskId: 'task_001',
 *   currentViewCount: 15000,
 *   proofScreenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
 * }
 * 
 * // 不带截图的申请
 * const simpleSubmission: SecondAuditRequestSubmission = {
 *   taskId: 'task_002',
 *   currentViewCount: 12000
 * }
 * 
 * // 数据验证
 * function validateSubmission(data: SecondAuditRequestSubmission): boolean {
 *   return data.taskId.length > 0 && data.currentViewCount > 0
 * }
 * 
 * // 检查是否有截图
 * function hasProofImage(data: SecondAuditRequestSubmission): boolean {
 *   return !!data.proofScreenshot && data.proofScreenshot.length > 0
 * }
 * ```
 */
export interface SecondAuditRequestSubmission {
  /** 关联任务ID */
  taskId: string
  /** 当前曝光量数值 */
  currentViewCount: number
  /** 曝光量证明截图，可选 */
  proofScreenshot?: string
}

/**
 * 周结算计算结果接口
 * 定义代理商周度奖励结算的计算结果，包含全面的统计数据和奖励金额信息
 * 用于结算预览、数据校验和结算确认，确保奖励计算的准确性和透明度
 * 
 * @interface WeeklySettlementCalculation
 * 
 * @complexity O(1) - 结算结果数据结构，常数时间复杂度访问
 * @flow 数据收集 → 任务统计 → 奖励计算 → 门槛检查 → 结果输出
 * 
 * @example
 * ```typescript
 * const calculation: WeeklySettlementCalculation = {
 *   agentId: 'agent_001',
 *   settlementWeek: '2024-W15',
 *   weekStartDate: '2024-04-08',
 *   weekEndDate: '2024-04-14',
 *   approvedTasksCount: 18,
 *   baseRewardAmount: 1800,
 *   bonusRewardAmount: 200,
 *   totalRewardAmount: 2000,
 *   isQualified: true,
 *   settlementStatus: 'QUALIFIED'
 * }
 * 
 * // 检查是否达到门槛
 * function meetsQualificationThreshold(calc: WeeklySettlementCalculation): boolean {
 *   return calc.approvedTasksCount >= 10 && calc.isQualified
 * }
 * 
 * // 计算奖励增幅
 * function calculateBonusPercentage(calc: WeeklySettlementCalculation): number {
 *   return (calc.bonusRewardAmount / calc.baseRewardAmount) * 100
 * }
 * 
 * // 计算平均任务奖励
 * function getAverageTaskReward(calc: WeeklySettlementCalculation): number {
 *   return calc.totalRewardAmount / calc.approvedTasksCount
 * }
 * ```
 */
export interface WeeklySettlementCalculation {
  /** 代理商ID */
  agentId: string
  /** 结算周次，格式：2024-W01 */
  settlementWeek: string
  /** 周起始日期 */
  weekStartDate: string
  /** 周结束日期 */
  weekEndDate: string
  /** 审核通过任务数量 */
  approvedTasksCount: number
  /** 基础奖励金额 */
  baseRewardAmount: number
  /** 额外奖励金额 */
  bonusRewardAmount: number
  /** 总奖励金额 */
  totalRewardAmount: number
  /** 是否达到≥ 10条门槛 */
  isQualified: boolean
  /** 结算状态：待处理/合格/失败 */
  settlementStatus: 'PENDING' | 'QUALIFIED' | 'FAILED'
}

/**
 * 奖励统计数据接口
 * 定义代理商奖励系统的综合统计数据，包含收入统计、任务统计和绩效分析
 * 用于仪表盘展示、绩效评估和奖励预测，提供全面的奖励系统视图
 * 
 * @interface RewardStatistics
 * 
 * @complexity O(1) - 统计数据结构，常数时间复杂度访问
 * @flow 数据聚合 → 指标计算 → 统计分析 → 结果展示 → 决策支持
 * 
 * @example
 * ```typescript
 * const statistics: RewardStatistics = {
 *   totalEarnings: 25000,
 *   currentWeekEarnings: 2100,
 *   pendingRewards: 800,
 *   completedSettlements: 12,
 *   thisWeekTasksCount: 18,
 *   thisWeekApprovedCount: 16,
 *   secondAuditBonusCount: 3,
 *   averageWeeklyEarnings: 2083.33
 * }
 * 
 * // 计算通过率
 * function calculateApprovalRate(stats: RewardStatistics): number {
 *   return (stats.thisWeekApprovedCount / stats.thisWeekTasksCount) * 100
 * }
 * 
 * // 计算二次审核率
 * function calculateSecondAuditRate(stats: RewardStatistics): number {
 *   return (stats.secondAuditBonusCount / stats.thisWeekApprovedCount) * 100
 * }
 * 
 * // 预测月度收入
 * function predictMonthlyEarnings(stats: RewardStatistics): number {
 *   return stats.averageWeeklyEarnings * 4.33 // 平均月周数
 * }
 * 
 * // 计算奖励增长趋势
 * function calculateGrowthTrend(current: number, average: number): string {
 *   const growth = ((current - average) / average) * 100
 *   return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`
 * }
 * ```
 */
export interface RewardStatistics {
  /** 总收入金额 */
  totalEarnings: number
  /** 当前周收入金额 */
  currentWeekEarnings: number
  /** 待发放奖励金额 */
  pendingRewards: number
  /** 已完成结算次数 */
  completedSettlements: number
  /** 本周任务提交数量 */
  thisWeekTasksCount: number
  /** 本周审核通过数量 */
  thisWeekApprovedCount: number
  /** 二次审核奖励次数 */
  secondAuditBonusCount: number
  /** 平均周收入金额 */
  averageWeeklyEarnings: number
}