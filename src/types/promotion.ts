/**
 * @fileoverview 推广任务管理类型定义
 * 定义分销系统中推广任务相关的核心类型接口和枚举
 * 包含任务状态管理、审核流程控制、统计分析、平台识别、URL识别和批量操作等完整功能模块
 * 集成代理任务提交、审核流程追踪、奖励计算和多平台支持等业务特性
 * 
 * @module types/promotion
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 推广任务状态枚举
 * 定义推广任务在审核流程中的不同阶段状态
 * 
 * @typedef {string} PromotionStatus
 * 
 * 状态流转说明：
 * - PENDING_MACHINE_AUDIT: 待机审 - 系统自动预审阶段（仅展示用）
 * - PENDING_MANUAL_AUDIT: 待人工审核 - 等待审核员手动审核
 * - APPROVED: 已通过 - 审核通过，可以获得奖励
 * - REJECTED: 已拒绝 - 审核不通过，需要修改或重新提交
 * 
 * @example
 * ```typescript
 * const newTaskStatus: PromotionStatus = 'PENDING_MANUAL_AUDIT'
 * const approvedTask: PromotionStatus = 'APPROVED'
 * 
 * // 状态判断
 * function needsAudit(status: PromotionStatus): boolean {
 *   return status === 'PENDING_MANUAL_AUDIT'
 * }
 * 
 * function isCompleted(status: PromotionStatus): boolean {
 *   return status === 'APPROVED' || status === 'REJECTED'
 * }
 * ```
 */
export type PromotionStatus = 
  | 'PENDING_MACHINE_AUDIT'    // 待机审(仅展示)
  | 'PENDING_MANUAL_AUDIT'     // 待人工审核
  | 'APPROVED'                 // 已通过
  | 'REJECTED'                 // 已拒绝

/**
 * 推广平台枚举
 * 定义系统支持的社交媒体推广平台类型
 * 
 * @typedef {string} PromotionPlatform
 * 
 * 平台说明：
 * - douyin: 抖音 - 字节跳动旗下短视频平台
 * - kuaishou: 快手 - 快手科技旗下短视频平台
 * - xiaohongshu: 小红书 - 生活方式分享社区平台
 * 
 * @example
 * ```typescript
 * const platform: PromotionPlatform = 'douyin'
 * 
 * // 平台特性判断
 * function isShortVideoPlatform(platform: PromotionPlatform): boolean {
 *   return platform === 'douyin' || platform === 'kuaishou'
 * }
 * 
 * function isSocialPlatform(platform: PromotionPlatform): boolean {
 *   return platform === 'xiaohongshu'
 * }
 * ```
 */
export type PromotionPlatform = 'douyin' | 'kuaishou' | 'xiaohongshu'

/**
 * 推广内容类型枚举
 * 定义推广内容的展示形式和制作方式
 * 
 * @typedef {string} PromotionContentType
 * 
 * 类型说明：
 * - normal: 普通推广 - 常规内容推广，无特殊要求
 * - live_person: 真人出镜 - 需要真人出镜的推广内容，奖励更高
 * 
 * @example
 * ```typescript
 * const contentType: PromotionContentType = 'live_person'
 * 
 * // 奖励计算
 * function calculateReward(contentType: PromotionContentType): number {
 *   return contentType === 'live_person' ? 10 : 5
 * }
 * ```
 */
export type PromotionContentType = 'normal' | 'live_person' // 普通|真人出镜

/**
 * 推广任务基础信息接口
 * 定义推广任务的完整数据结构，包含任务基础信息、审核状态、奖励信息和扩展字段
 * 
 * @interface PromotionTask
 * 
 * @example
 * ```typescript
 * const task: PromotionTask = {
 *   id: 'task_001',
 *   agentId: 'agent_123',
 *   agentName: '张代理',
 *   agentLevel: 'L3',
 *   platform: 'douyin',
 *   contentType: 'live_person',
 *   contentUrl: 'https://www.douyin.com/video/123456',
 *   contentDescription: '真人出镜推广理财产品',
 *   status: 'PENDING_MANUAL_AUDIT',
 *   submittedAt: '2024-01-01T10:00:00Z',
 *   rewardAmount: 10,
 *   createdAt: '2024-01-01T10:00:00Z',
 *   updatedAt: '2024-01-01T10:00:00Z',
 *   submissionSource: 'agent',
 *   autoDetectedPlatform: 'douyin'
 * }
 * 
 * // 任务状态检查
 * function canEdit(task: PromotionTask): boolean {
 *   return task.status === 'PENDING_MANUAL_AUDIT'
 * }
 * 
 * // 奖励计算
 * function hasReward(task: PromotionTask): boolean {
 *   return task.status === 'APPROVED' && task.rewardAmount > 0
 * }
 * ```
 */
export interface PromotionTask {
  id: string                          // 任务ID
  agentId: string                     // 代理ID
  agentName: string                   // 代理姓名
  agentLevel: string                  // 代理等级
  platform: PromotionPlatform        // 推广平台
  contentType: PromotionContentType   // 内容类型
  contentUrl: string                  // 推广内容链接
  contentPreview?: string             // 内容预览(截图/缩略图)
  contentDescription?: string         // 内容描述
  status: PromotionStatus             // 当前状态
  submittedAt: string                 // 提交时间
  auditedAt?: string                  // 审核时间
  auditorId?: string                  // 审核员ID
  auditorName?: string                // 审核员姓名
  auditComment?: string               // 审核意见
  rewardAmount?: number               // 奖励金额
  viewCount?: number                  // 曝光量(用于二次审核)
  isSecondAudit?: boolean             // 是否二次审核
  createdAt: string                   // 创建时间
  updatedAt: string                   // 更新时间

  // 新增字段（可选，保持兼容性）
  submissionSource?: 'agent' | 'admin'  // 提交来源
  autoDetectedPlatform?: PromotionPlatform  // 自动识别的平台
  manualPlatformOverride?: boolean      // 是否手动覆盖平台选择
}

/**
 * 审核操作请求接口
 * 定义审核员对推广任务进行审核时的请求参数
 * 
 * @interface AuditRequest
 * 
 * @example
 * ```typescript
 * // 审核通过
 * const approveRequest: AuditRequest = {
 *   taskId: 'task_001',
 *   action: 'approve',
 *   comment: '内容质量优秀，符合推广要求',
 *   rewardAmount: 10
 * }
 * 
 * // 审核拒绝
 * const rejectRequest: AuditRequest = {
 *   taskId: 'task_002',
 *   action: 'reject',
 *   comment: '内容质量不达标，请重新制作'
 * }
 * 
 * // 数据验证
 * function validateAuditRequest(request: AuditRequest): boolean {
 *   if (request.action === 'reject' && !request.comment) {
 *     throw new Error('拒绝审核时必须填写审核意见')
 *   }
 *   return true
 * }
 * ```
 */
export interface AuditRequest {
  taskId: string                      // 任务ID
  action: 'approve' | 'reject'        // 审核动作
  comment?: string                    // 审核意见(拒绝时必填)
  rewardAmount?: number               // 奖励金额(通过时)
}

/**
 * 审核历史记录接口
 * 记录推广任务的完整审核轨迹，支持审核流程追踪和历史查询
 * 
 * @interface AuditHistory
 * 
 * @example
 * ```typescript
 * const auditRecord: AuditHistory = {
 *   id: 'audit_001',
 *   taskId: 'task_001',
 *   auditorId: 'auditor_123',
 *   auditorName: '审核员李四',
 *   action: 'approve',
 *   comment: '内容符合要求，给予通过',
 *   auditedAt: '2024-01-01T14:30:00Z',
 *   previousStatus: 'PENDING_MANUAL_AUDIT',
 *   newStatus: 'APPROVED'
 * }
 * 
 * // 审核记录分析
 * function analyzeAuditHistory(records: AuditHistory[]): object {
 *   const approvals = records.filter(r => r.action === 'approve').length
 *   const rejections = records.filter(r => r.action === 'reject').length
 *   return {
 *     totalAudits: records.length,
 *     approvalRate: approvals / records.length,
 *     rejectionRate: rejections / records.length
 *   }
 * }
 * ```
 */
export interface AuditHistory {
  id: string                          // 记录ID
  taskId: string                      // 任务ID
  auditorId: string                   // 审核员ID
  auditorName: string                 // 审核员姓名
  action: 'approve' | 'reject'        // 审核动作
  comment?: string                    // 审核意见
  auditedAt: string                   // 审核时间
  previousStatus: PromotionStatus     // 前一状态
  newStatus: PromotionStatus          // 新状态
}

/**
 * 审核统计数据接口
 * 提供推广任务审核系统的实时统计和分析数据
 * 
 * @interface AuditStats
 * 
 * @example
 * ```typescript
 * const stats: AuditStats = {
 *   totalPending: 45,
 *   todayAudited: 20,
 *   todayApproved: 15,
 *   todayRejected: 5,
 *   approvalRate: 0.75,
 *   avgAuditTime: 12.5,
 *   rewardAmountToday: 150
 * }
 * 
 * // 统计分析
 * function generateAuditReport(stats: AuditStats): string {
 *   return `今日审核效率：${stats.todayAudited}件，通过率：${(stats.approvalRate * 100).toFixed(1)}%`
 * }
 * 
 * // 性能指标
 * function isHighPerformance(stats: AuditStats): boolean {
 *   return stats.approvalRate > 0.8 && stats.avgAuditTime < 15
 * }
 * ```
 */
export interface AuditStats {
  totalPending: number                // 待审核总数
  todayAudited: number               // 今日已审核
  todayApproved: number              // 今日通过数
  todayRejected: number              // 今日拒绝数
  approvalRate: number               // 通过率
  avgAuditTime: number               // 平均审核时间(分钟)
  rewardAmountToday: number          // 今日发放奖励总额
}

/**
 * 审核筛选参数接口
 * 定义审核任务列表的搜索、筛选和分页参数
 * 
 * @interface AuditFilterParams
 * 
 * @example
 * ```typescript
 * const filterParams: AuditFilterParams = {
 *   keyword: '理财',
 *   status: 'PENDING_MANUAL_AUDIT',
 *   platform: 'douyin',
 *   contentType: 'live_person',
 *   dateRange: {
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   },
 *   auditorId: 'auditor_123',
 *   page: 1,
 *   pageSize: 20
 * }
 * 
 * // 构建查询条件
 * function buildQuery(params: AuditFilterParams): object {
 *   const query: any = {}
 *   if (params.status && params.status !== 'all') query.status = params.status
 *   if (params.platform && params.platform !== 'all') query.platform = params.platform
 *   if (params.keyword) query.contentDescription = { $regex: params.keyword, $options: 'i' }
 *   return query
 * }
 * ```
 */
export interface AuditFilterParams {
  keyword?: string                    // 关键词搜索
  status?: PromotionStatus | 'all'   // 状态筛选
  platform?: PromotionPlatform | 'all' // 平台筛选
  contentType?: PromotionContentType | 'all' // 内容类型筛选
  dateRange?: {                      // 时间范围
    startDate: string
    endDate: string
  }
  auditorId?: string                 // 审核员筛选
  page?: number                      // 页码
  pageSize?: number                  // 页面大小
}

/**
 * 审核数据权限范围接口
 * 定义审核员可以查看和操作的数据范围权限
 * 
 * @interface AuditDataScope
 * 
 * @example
 * ```typescript
 * // 超级管理员权限
 * const adminScope: AuditDataScope = {
 *   canViewAll: true
 * }
 * 
 * // 区域经理权限
 * const managerScope: AuditDataScope = {
 *   canViewAll: false,
 *   allowedAgentIds: ['agent_001', 'agent_002', 'agent_003'],
 *   allowedSalesIds: ['sales_001', 'sales_002']
 * }
 * 
 * // 权限检查
 * function hasAccessToTask(scope: AuditDataScope, taskAgentId: string): boolean {
 *   if (scope.canViewAll) return true
 *   return scope.allowedAgentIds?.includes(taskAgentId) || false
 * }
 * ```
 */
export interface AuditDataScope {
  canViewAll: boolean          // 是否可查看全部数据
  allowedAgentIds?: string[]   // 允许查看的代理ID列表
  allowedSalesIds?: string[]   // 允许查看的销售ID列表
}

/**
 * 批量审核请求接口
 * 支持对多个推广任务进行批量审核操作（V2功能预留）
 * 
 * @interface BatchAuditRequest
 * 
 * @example
 * ```typescript
 * const batchRequest: BatchAuditRequest = {
 *   taskIds: ['task_001', 'task_002', 'task_003'],
 *   action: 'approve',
 *   comment: '批量通过，内容质量均符合要求',
 *   rewardAmount: 10
 * }
 * 
 * // 批量操作验证
 * function validateBatchRequest(request: BatchAuditRequest): boolean {
 *   if (request.taskIds.length === 0) {
 *     throw new Error('请至少选择一个任务')
 *   }
 *   if (request.taskIds.length > 50) {
 *     throw new Error('批量操作最多支持50个任务')
 *   }
 *   return true
 * }
 * ```
 */
export interface BatchAuditRequest {
  taskIds: string[]                   // 任务ID列表
  action: 'approve' | 'reject'        // 批量操作
  comment?: string                    // 统一审核意见
  rewardAmount?: number               // 统一奖励金额
}

/**
 * 推广平台选项配置
 * 用于前端下拉选择和显示的平台配置数据
 * 
 * @constant {readonly} PROMOTION_PLATFORMS
 * 
 * @example
 * ```typescript
 * // 在组件中使用
 * const platformOptions = PROMOTION_PLATFORMS.map(platform => ({
 *   value: platform.value,
 *   label: platform.label
 * }))
 * 
 * // 平台验证
 * function isValidPlatform(value: string): value is PromotionPlatform {
 *   return PROMOTION_PLATFORMS.some(p => p.value === value)
 * }
 * ```
 */
export const PROMOTION_PLATFORMS = [
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'xiaohongshu', label: '小红书' }
] as const

// 内容类型选项配置
export const CONTENT_TYPES = [
  { value: 'normal', label: '普通推广' },
  { value: 'live_person', label: '真人出镜' }
] as const

// 状态选项配置
export const PROMOTION_STATUS_OPTIONS = [
  { value: 'PENDING_MACHINE_AUDIT', label: '待机审', color: 'blue' },
  { value: 'PENDING_MANUAL_AUDIT', label: '待人工审核', color: 'orange' },
  { value: 'APPROVED', label: '已通过', color: 'green' },
  { value: 'REJECTED', label: '已拒绝', color: 'red' }
] as const

// 状态显示映射
export const getStatusDisplay = (status: PromotionStatus) => {
  const option = PROMOTION_STATUS_OPTIONS.find(opt => opt.value === status)
  return option ? { label: option.label, color: option.color } : { label: status, color: 'gray' }
}

// 平台显示映射
export const getPlatformDisplay = (platform: PromotionPlatform) => {
  const option = PROMOTION_PLATFORMS.find(opt => opt.value === platform)
  return option ? option.label : platform
}

// 内容类型显示映射
export const getContentTypeDisplay = (contentType: PromotionContentType) => {
  const option = CONTENT_TYPES.find(opt => opt.value === contentType)
  return option ? option.label : contentType
}

// ==================== 代理任务提交相关类型定义 ====================

// 任务提交请求接口
export interface TaskSubmissionRequest {
  platform: PromotionPlatform          // 推广平台
  contentType: PromotionContentType    // 内容类型
  contentUrl: string                   // 推广内容链接
  contentDescription: string           // 内容描述
  autoDetectedPlatform?: PromotionPlatform  // 自动识别的平台
}

// 代理任务筛选参数
export interface AgentTaskFilterParams {
  keyword?: string                     // 关键词搜索
  status?: PromotionStatus | 'all'    // 状态筛选
  platform?: PromotionPlatform | 'all' // 平台筛选
  contentType?: PromotionContentType | 'all' // 内容类型筛选
  dateRange?: {                       // 时间范围
    startDate: string
    endDate: string
  }
  page?: number                       // 页码
  pageSize?: number                   // 页面大小
}

// 代理任务统计数据
export interface AgentTaskStats {
  totalSubmitted: number              // 总提交数
  pendingAudit: number               // 待审核数
  approved: number                   // 已通过数
  rejected: number                   // 已拒绝数
  totalReward: number                // 总奖励金额
  thisMonthSubmitted: number         // 本月提交数
  thisMonthApproved: number          // 本月通过数
}

// 平台识别规则接口
export interface PlatformRecognitionRule {
  platform: PromotionPlatform
  patterns: RegExp[]
  displayName: string
  icon: string
}

// 平台URL识别规则配置
export const PLATFORM_RECOGNITION_RULES: PlatformRecognitionRule[] = [
  {
    platform: 'douyin',
    patterns: [
      /douyin\.com/i,
      /dy\.com/i,
      /iesdouyin\.com/i
    ],
    displayName: '抖音',
    icon: 'douyin-icon'
  },
  {
    platform: 'kuaishou',
    patterns: [
      /kuaishou\.com/i,
      /ks\.com/i,
      /kwai\.com/i
    ],
    displayName: '快手',
    icon: 'kuaishou-icon'
  },
  {
    platform: 'xiaohongshu',
    patterns: [
      /xiaohongshu\.com/i,
      /xhs\.com/i,
      /redbook\.com/i
    ],
    displayName: '小红书',
    icon: 'xiaohongshu-icon'
  }
]

// URL识别结果接口
export interface URLRecognitionResult {
  platform: PromotionPlatform | null
  confidence: number
  suggestions: PromotionPlatform[]
}