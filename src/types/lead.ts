/**
 * 客资状态
 * - PENDING: 待处理
 * - FOLLOWING: 跟进中
 * - CONVERTED: 已转化
 * - INVALID: 无效
 */
export type LeadStatus = 'PENDING' | 'FOLLOWING' | 'CONVERTED' | 'INVALID'

export interface Lead {
  id: string // 客资ID
  name: string // 客户姓名
  phone: string // 联系电话
  status: LeadStatus // 客资状态
  source: string // 来源渠道
  salespersonName: string // 归属销售姓名
  salespersonId: string // 归属销售ID
  createdAt: string // 创建时间
  lastFollowUpAt?: string // 最后跟进时间
} 