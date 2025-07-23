// 推广任务状态枚举
export type PromotionStatus = 
  | 'PENDING_MACHINE_AUDIT'    // 待机审(仅展示)
  | 'PENDING_MANUAL_AUDIT'     // 待人工审核
  | 'APPROVED'                 // 已通过
  | 'REJECTED'                 // 已拒绝

// 推广平台枚举
export type PromotionPlatform = 'douyin' | 'kuaishou' | 'xiaohongshu'

// 推广内容类型
export type PromotionContentType = 'normal' | 'live_person' // 普通|真人出镜

// 推广任务基础模型
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
}

// 审核操作请求
export interface AuditRequest {
  taskId: string                      // 任务ID
  action: 'approve' | 'reject'        // 审核动作
  comment?: string                    // 审核意见(拒绝时必填)
  rewardAmount?: number               // 奖励金额(通过时)
}

// 审核历史记录
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

// 审核统计数据
export interface AuditStats {
  totalPending: number                // 待审核总数
  todayAudited: number               // 今日已审核
  todayApproved: number              // 今日通过数
  todayRejected: number              // 今日拒绝数
  approvalRate: number               // 通过率
  avgAuditTime: number               // 平均审核时间(分钟)
  rewardAmountToday: number          // 今日发放奖励总额
}

// 筛选参数
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

// 数据范围权限(Data Scope)
export interface AuditDataScope {
  canViewAll: boolean          // 是否可查看全部数据
  allowedAgentIds?: string[]   // 允许查看的代理ID列表
  allowedSalesIds?: string[]   // 允许查看的销售ID列表
}

// 批量审核请求(V2功能预留)
export interface BatchAuditRequest {
  taskIds: string[]                   // 任务ID列表
  action: 'approve' | 'reject'        // 批量操作
  comment?: string                    // 统一审核意见
  rewardAmount?: number               // 统一奖励金额
}

// 推广平台选项配置
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