/**
 * 奖励相关类型定义
 */

// 奖励结算记录
export interface RewardSettlement {
  id: string
  agentId: string
  settlementWeek: string // 2024-W01 格式
  weekStartDate: string
  weekEndDate: string
  
  // 任务统计
  submittedTasksCount: number
  approvedTasksCount: number
  qualifiedTasksCount: number // ≥10条的合格任务数
  
  // 奖励计算
  baseRewardAmount: number // 基础奖励(初审)
  bonusRewardAmount: number // 额外奖励(二次审核)
  totalRewardAmount: number
  
  // 结算状态
  settlementStatus: 'PENDING' | 'QUALIFIED' | 'SETTLED' | 'FAILED'
  settlementDate?: string
  settlementReason?: string
  
  // 审计字段
  createdAt: string
  updatedAt: string
}

// 二次审核申请
export interface SecondAuditRequest {
  id: string
  taskId: string
  agentId: string
  
  // 申请条件
  currentViewCount: number
  thresholdViewCount: number
  proofScreenshot?: string // 曝光量截图证明
  
  // 申请状态
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestDate: string
  auditDate?: string
  auditorId?: string
  auditComment?: string
  
  // 奖励信息
  bonusAmount: number
  settlementType: 'IMMEDIATE' | 'WEEKLY'
}

// 提交限制检查结果
export interface SubmissionLimitCheck {
  canSubmit: boolean
  currentCount: number
  dailyLimit: number
  remainingCount: number
  nextResetTime: string
}

// 日提交限制记录
export interface DailySubmissionLimit {
  id: string
  agentId: string
  submissionDate: string
  submissionCount: number
  dailyLimit: number
  createdAt: string
  updatedAt: string
}

// 奖励结算查询参数
export interface RewardSettlementQuery {
  agentId?: string
  week?: string
  status?: string
  page?: number
  pageSize?: number
}

// 二次审核申请查询参数
export interface SecondAuditRequestQuery {
  agentId?: string
  taskId?: string
  status?: string
  page?: number
  pageSize?: number
}

// 二次审核申请提交数据
export interface SecondAuditRequestSubmission {
  taskId: string
  currentViewCount: number
  proofScreenshot?: string
}

// 周结算计算结果
export interface WeeklySettlementCalculation {
  agentId: string
  settlementWeek: string
  weekStartDate: string
  weekEndDate: string
  approvedTasksCount: number
  baseRewardAmount: number
  bonusRewardAmount: number
  totalRewardAmount: number
  isQualified: boolean // 是否达到≥10条门槛
  settlementStatus: 'PENDING' | 'QUALIFIED' | 'FAILED'
}

// 奖励统计数据
export interface RewardStatistics {
  totalEarnings: number
  currentWeekEarnings: number
  pendingRewards: number
  completedSettlements: number
  thisWeekTasksCount: number
  thisWeekApprovedCount: number
  secondAuditBonusCount: number
  averageWeeklyEarnings: number
}