/**
 * 客资审核相关类型定义
 * 
 * 本文件定义了客资审核流程中涉及的所有类型接口，包括：
 * - 审核记录
 * - 审核决定
 * - 审核查询参数
 * - 审核统计信息
 * - 批量审核操作
 */

import type { UserRole } from '@/types/user'
import type { LeadAuditStatus } from './lead'

/**
 * 审核操作类型
 * - APPROVE: 审核通过
 * - REJECT: 审核驳回
 */
export type AuditAction = 'APPROVE' | 'REJECT'

/**
 * 驳回原因枚举
 * 预定义常见的驳回原因，提高审核效率
 */
export enum RejectReason {
  INVALID_PHONE = 'invalid_phone',           // 手机号无效
  DUPLICATE_LEAD = 'duplicate_lead',         // 重复客资
  INCOMPLETE_INFO = 'incomplete_info',       // 信息不完整
  SUSPICIOUS_SOURCE = 'suspicious_source',   // 来源可疑
  INVALID_WECHAT = 'invalid_wechat',        // 微信号无效
  FAKE_CUSTOMER = 'fake_customer',          // 虚假客户
  OUT_OF_SCOPE = 'out_of_scope',            // 超出业务范围
  OTHER = 'other'                           // 其他原因
}

/**
 * 驳回原因显示文本映射
 */
export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  [RejectReason.INVALID_PHONE]: '手机号无效或格式错误',
  [RejectReason.DUPLICATE_LEAD]: '重复客资，已存在相同记录',
  [RejectReason.INCOMPLETE_INFO]: '客户信息不完整',
  [RejectReason.SUSPICIOUS_SOURCE]: '来源渠道可疑或不明确',
  [RejectReason.INVALID_WECHAT]: '微信号无效或无法添加',
  [RejectReason.FAKE_CUSTOMER]: '疑似虚假客户信息',
  [RejectReason.OUT_OF_SCOPE]: '超出当前业务范围',
  [RejectReason.OTHER]: '其他原因'
}

/**
 * 审核决定接口
 * 用于提交审核操作时的数据结构
 */
export interface AuditDecision {
  action: AuditAction               // 审核动作
  comment?: string                  // 审核意见 (可选)
  rejectReason?: RejectReason       // 驳回原因 (驳回时必填)
  customRejectReason?: string       // 自定义驳回原因 (当rejectReason为OTHER时使用)
}

/**
 * 客资审核记录接口
 * 记录每次审核操作的完整信息
 */
export interface LeadAuditRecord {
  id: string                        // 审核记录ID
  leadId: string                    // 客资ID
  auditorId: string                 // 审核人ID
  auditorName: string               // 审核人姓名
  auditorRole: UserRole             // 审核人角色
  action: AuditAction               // 审核动作
  comment?: string                  // 审核意见
  rejectReason?: RejectReason       // 驳回原因
  customRejectReason?: string       // 自定义驳回原因
  auditedAt: string                 // 审核时间
  beforeStatus: LeadAuditStatus     // 审核前状态
  afterStatus: LeadAuditStatus      // 审核后状态
  
  // 审核环境信息
  ipAddress?: string                // 审核时的IP地址
  userAgent?: string                // 审核时的用户代理
  
  // 关联信息
  leadSnapshot?: {                  // 审核时的客资快照
    name: string
    phone: string
    source: string
    wechatId?: string
    notes?: string
  }
}

/**
 * 审核查询参数接口
 * 用于查询审核记录和待审核客资
 */
export interface AuditQueryParams {
  page?: number                     // 页码
  pageSize?: number                 // 每页数量
  leadId?: string                   // 特定客资ID
  auditorId?: string                // 审核人ID筛选
  auditorRole?: UserRole            // 审核人角色筛选
  action?: AuditAction              // 审核动作筛选
  auditStatus?: LeadAuditStatus     // 审核状态筛选
  dateFrom?: string                 // 审核时间起始
  dateTo?: string                   // 审核时间结束
  rejectReason?: RejectReason       // 驳回原因筛选
  keyword?: string                  // 关键词搜索 (客户姓名、手机号)
  
  // 权限相关筛选
  salespersonId?: string            // 销售人员筛选 (基于权限)
  teamIds?: string[]                // 团队ID筛选 (基于权限)
}

/**
 * 批量审核请求接口
 */
export interface BatchAuditRequest {
  leadIds: string[]                 // 客资ID列表
  decision: AuditDecision           // 统一的审核决定
  batchComment?: string             // 批量操作备注
}

/**
 * 批量审核结果接口
 */
export interface BatchAuditResult {
  totalCount: number                // 总数量
  successCount: number              // 成功数量
  failureCount: number              // 失败数量
  successLeadIds: string[]          // 成功的客资ID列表
  failures: {                       // 失败详情
    leadId: string
    error: string
    reason: string
  }[]
  batchId: string                   // 批量操作ID
  executedAt: string                // 执行时间
  executedBy: string                // 执行人ID
}

/**
 * 审核统计信息接口
 */
export interface AuditStatistics {
  // 基础统计
  totalAudited: number              // 总审核数量
  approvedCount: number             // 通过数量
  rejectedCount: number             // 驳回数量
  pendingCount: number              // 待审核数量
  
  // 比率统计
  approvalRate: number              // 通过率 (0-1)
  rejectionRate: number             // 驳回率 (0-1)
  
  // 时间统计
  avgAuditTime: number              // 平均审核时间 (分钟)
  totalAuditTime: number            // 总审核时间 (分钟)
  
  // 驳回原因统计
  rejectReasonStats: {
    reason: RejectReason
    count: number
    percentage: number
  }[]
  
  // 审核人统计
  auditorStats: {
    auditorId: string
    auditorName: string
    auditedCount: number
    approvedCount: number
    rejectedCount: number
    avgAuditTime: number
  }[]
  
  // 时间范围
  dateFrom: string                  // 统计起始时间
  dateTo: string                    // 统计结束时间
}

/**
 * 审核权限检查结果接口
 */
export interface AuditPermissionCheck {
  canAudit: boolean                 // 是否可以审核
  canBatchAudit: boolean            // 是否可以批量审核
  canViewAll: boolean               // 是否可以查看所有审核记录
  allowedLeadIds?: string[]         // 允许审核的客资ID列表 (权限受限时)
  allowedSalesIds?: string[]        // 允许查看的销售ID列表 (权限受限时)
  reason?: string                   // 权限限制原因
}

/**
 * 审核流程配置接口
 */
export interface AuditWorkflowConfig {
  // 自动审核配置
  enableAutoAudit: boolean          // 是否启用自动审核
  autoAuditRules: {
    condition: string               // 自动审核条件
    action: AuditAction             // 自动审核动作
    priority: number                // 规则优先级
  }[]
  
  // 审核时限配置
  auditTimeLimit: number            // 审核时限 (小时)
  escalationEnabled: boolean        // 是否启用升级机制
  escalationTimeLimit: number       // 升级时限 (小时)
  
  // 通知配置
  notificationEnabled: boolean      // 是否启用通知
  notificationChannels: string[]    // 通知渠道
  
  // 质量控制
  requireComment: boolean           // 是否必须填写审核意见
  requireRejectReason: boolean      // 驳回时是否必须选择原因
  enableAuditReview: boolean        // 是否启用审核复查
}

/**
 * 审核操作上下文接口
 * 用于传递审核操作的上下文信息
 */
export interface AuditContext {
  auditorId: string                 // 审核人ID
  auditorRole: UserRole             // 审核人角色
  ipAddress?: string                // IP地址
  userAgent?: string                // 用户代理
  sessionId?: string                // 会话ID
  requestId?: string                // 请求ID
  timestamp: string                 // 操作时间戳
}
