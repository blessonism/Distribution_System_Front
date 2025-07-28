/**
 * 客资管理Mock数据
 * 
 * 包含客资、审核记录、来源识别等相关的Mock数据和生成函数
 */

import type { 
  Lead, 
  LeadStatus, 
  LeadAuditStatus,
  PredefinedSource,
  CreateLeadRequest,
  DuplicateCheckResult,
  SourceDetectionResult,
  ReferralCodeValidation,
  UTMParams
} from '@/types/lead'
import type {
  LeadAuditRecord,
  AuditStatistics,
  BatchAuditResult,
  RejectReason
} from '@/types/leadAudit'
import type { UserRole } from '@/types/user'

// 预定义的来源列表
export const mockSources: string[] = [
  '搜索引擎',
  'Google搜索',
  '百度搜索',
  '微信',
  '小红书',
  '微博',
  '抖音',
  'Google广告',
  '微信广告',
  '推荐',
  '代理推荐',
  '线下',
  '官网',
  '热线',
  '其他'
]

// 销售人员数据
export const mockSalespersons = [
  { id: 'S001', name: '张三', role: 'sales' as UserRole },
  { id: 'S002', name: '李四', role: 'sales' as UserRole },
  { id: 'S003', name: '王五', role: 'sales' as UserRole },
  { id: 'S004', name: '赵六', role: 'leader' as UserRole },
  { id: 'S005', name: '钱七', role: 'leader' as UserRole },
  { id: 'S006', name: '孙八', role: 'director' as UserRole },
  { id: 'S007', name: '周九', role: 'sales' as UserRole },
  { id: 'S008', name: '吴十', role: 'sales' as UserRole }
]

// 代理人员数据
export const mockAgents = [
  { id: 'A001', name: '张小红' },
  { id: 'A002', name: '李美丽' },
  { id: 'A003', name: '王芳芳' },
  { id: 'A004', name: '刘晓琴' },
  { id: 'A005', name: '陈思思' },
  { id: 'A006', name: '杨雪梅' },
  { id: 'A007', name: '赵丽华' },
  { id: 'A008', name: '孙晓霞' },
  { id: 'A009', name: '周欣悦' },
  { id: 'A010', name: '吴佳佳' },
  { id: 'A011', name: '郑雅琪' },
  { id: 'A012', name: '何美玲' },
  { id: 'A013', name: '林诗雨' },
  { id: 'A014', name: '高婷婷' },
  { id: 'A015', name: '马琳琳' }
]

// 客户姓名池
export const mockCustomerNames = [
  '陈明', '刘芳', '张伟', '王丽', '李强', '赵敏', '孙涛', '周静',
  '吴勇', '郑娜', '王磊', '李娟', '张勇', '刘静', '陈涛', '杨丽',
  '黄强', '赵静', '孙勇', '周丽', '吴静', '郑勇', '王娟', '李磊',
  '张静', '刘勇', '陈丽', '杨静', '黄勇', '赵丽', '孙静', '周勇'
]

// 生成随机手机号
export function generateMockPhone(): string {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                   '150', '151', '152', '153', '155', '156', '157', '158', '159',
                   '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return prefix + suffix
}

// 生成随机微信号
export function generateMockWechatId(): string {
  const prefixes = ['wx', 'wechat', 'weixin', '']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.random().toString(36).substring(2, 10)
  return prefix + suffix
}

// 生成Mock客资数据
export function generateMockLeads(count: number = 100): Lead[] {
  const leads: Lead[] = []
  const leadStatuses: LeadStatus[] = ['PENDING', 'FOLLOWING', 'CONVERTED', 'INVALID']
  const auditStatuses: LeadAuditStatus[] = ['PENDING_AUDIT', 'APPROVED', 'REJECTED']

  // 确保有足够的待审核记录 - 前40%为待审核，30%已通过，30%已驳回
  const getAuditStatus = (index: number): LeadAuditStatus => {
    const ratio = index / count
    if (ratio < 0.4) return 'PENDING_AUDIT'
    if (ratio < 0.7) return 'APPROVED'
    return 'REJECTED'
  }
  
  for (let i = 1; i <= count; i++) {
    const salesperson = mockSalespersons[i % mockSalespersons.length]
    const agent = mockAgents[i % mockAgents.length]
    const customerName = mockCustomerNames[i % mockCustomerNames.length]
    const source = mockSources[i % mockSources.length] as PredefinedSource
    const auditStatus = getAuditStatus(i - 1) // 使用新的分配函数
    
    // 生成创建时间（最近90天内）
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    
    // 生成审核时间（如果已审核）
    let auditedAt: string | undefined
    let auditedBy: string | undefined
    let auditedByName: string | undefined
    
    if (auditStatus !== 'PENDING_AUDIT') {
      const auditDelay = Math.random() * 24 * 60 * 60 * 1000 // 0-24小时后审核
      auditedAt = new Date(new Date(createdAt).getTime() + auditDelay).toISOString()
      const auditor = mockSalespersons.find(s => ['leader', 'director'].includes(s.role)) || mockSalespersons[0]
      auditedBy = auditor.id
      auditedByName = auditor.name
    }
    
    const lead: Lead = {
      id: `LID_${String(i).padStart(4, '0')}`,
      name: customerName + (Math.random() > 0.5 ? '先生' : '女士'),
      phone: generateMockPhone(),
      status: leadStatuses[i % leadStatuses.length],
      source: source,
      salespersonName: salesperson.name,
      salespersonId: salesperson.id,
      agentName: agent.name,
      agentId: agent.id,
      createdAt,
      lastFollowUpAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      
      // 新增字段
      wechatId: Math.random() > 0.3 ? generateMockWechatId() : undefined,
      notes: Math.random() > 0.5 ? `客户备注信息 ${i}` : undefined,
      auditStatus,
      auditedAt,
      auditedBy,
      auditedByName,
      auditComment: auditStatus !== 'PENDING_AUDIT' && Math.random() > 0.5 ? '审核通过，信息完整' : undefined,
      rejectReason: auditStatus === 'REJECTED' && Math.random() > 0.5 ? '手机号格式错误' : undefined,
      
      // 来源识别字段
      sourceDetail: `${source}详细信息`,
      referralCode: Math.random() > 0.7 ? `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
      utmSource: Math.random() > 0.6 ? ['google', 'baidu', 'wechat', 'xiaohongshu'][Math.floor(Math.random() * 4)] : undefined,
      utmMedium: Math.random() > 0.6 ? ['cpc', 'social', 'email', 'organic'][Math.floor(Math.random() * 4)] : undefined,
      utmCampaign: Math.random() > 0.6 ? ['summer_sale', 'new_year', 'brand_campaign'][Math.floor(Math.random() * 3)] : undefined,
      referrer: Math.random() > 0.7 ? 'https://example.com/landing-page' : undefined,
      
      // 系统字段
      updatedAt: new Date().toISOString(),
      version: 1
    }
    
    leads.push(lead)
  }
  
  return leads
}

// 生成Mock审核记录
export function generateMockAuditRecords(leadId: string, count: number = 3): LeadAuditRecord[] {
  const records: LeadAuditRecord[] = []
  const actions: ('APPROVE' | 'REJECT')[] = ['APPROVE', 'REJECT']
  const rejectReasons: RejectReason[] = ['invalid_phone', 'duplicate_lead', 'incomplete_info', 'other']
  
  for (let i = 0; i < count; i++) {
    const auditor = mockSalespersons.find(s => ['leader', 'director'].includes(s.role)) || mockSalespersons[0]
    const action = actions[i % actions.length]
    
    const record: LeadAuditRecord = {
      id: `AR_${leadId}_${i + 1}`,
      leadId,
      auditorId: auditor.id,
      auditorName: auditor.name,
      auditorRole: auditor.role,
      action,
      comment: `审核意见 ${i + 1}`,
      rejectReason: action === 'REJECT' ? rejectReasons[i % rejectReasons.length] : undefined,
      auditedAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
      beforeStatus: i === 0 ? 'PENDING_AUDIT' : (action === 'APPROVE' ? 'PENDING_AUDIT' : 'REJECTED'),
      afterStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      leadSnapshot: {
        name: '客户姓名',
        phone: generateMockPhone(),
        source: mockSources[0] as PredefinedSource,
        wechatId: generateMockWechatId(),
        notes: '客户备注'
      }
    }
    
    records.push(record)
  }
  
  return records
}

// 生成Mock重复检查结果
export function generateMockDuplicateCheck(phone: string): DuplicateCheckResult {
  const isDuplicate = Math.random() > 0.7 // 30% 概率重复
  
  if (!isDuplicate) {
    return {
      isDuplicate: false,
      duplicateLeads: [],
      similarity: 0,
      matchFields: []
    }
  }
  
  // 生成重复的客资
  const duplicateLeads = generateMockLeads(Math.floor(Math.random() * 3) + 1)
  duplicateLeads.forEach(lead => {
    lead.phone = phone // 确保手机号匹配
  })
  
  return {
    isDuplicate: true,
    duplicateLeads,
    similarity: 0.8 + Math.random() * 0.2, // 80%-100% 相似度
    matchFields: ['phone', 'name']
  }
}

// 生成Mock来源检测结果
export function generateMockSourceDetection(utmParams?: UTMParams): SourceDetectionResult {
  const sources = [PredefinedSource.GOOGLE, PredefinedSource.WECHAT, PredefinedSource.XIAOHONGSHU]
  const suggestedSource = sources[Math.floor(Math.random() * sources.length)]
  
  return {
    suggestedSource,
    sourceDetail: `基于UTM参数检测到的${suggestedSource}`,
    confidence: 0.7 + Math.random() * 0.3,
    detectionMethod: utmParams ? 'utm' : 'referrer',
    utmParams,
    referrer: 'https://example.com/landing',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    matchedRules: ['rule_1', 'rule_2'],
    alternatives: [
      {
        source: PredefinedSource.BAIDU,
        confidence: 0.6,
        reason: '引荐域名匹配'
      }
    ],
    detectedAt: new Date().toISOString()
  }
}

// 生成Mock推荐码验证结果
export function generateMockReferralCodeValidation(code: string): ReferralCodeValidation {
  const isValid = Math.random() > 0.3 // 70% 概率有效
  
  if (!isValid) {
    return {
      isValid: false,
      referralCode: code,
      codeType: 'agent',
      isExpired: Math.random() > 0.5,
      isExhausted: Math.random() > 0.5,
      validatedAt: new Date().toISOString()
    }
  }
  
  const referrer = mockSalespersons[Math.floor(Math.random() * mockSalespersons.length)]
  
  return {
    isValid: true,
    referralCode: code,
    referrerInfo: {
      id: referrer.id,
      name: referrer.name,
      role: referrer.role,
      level: 'SV' + (Math.floor(Math.random() * 6) + 1)
    },
    codeType: 'agent',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: Math.floor(Math.random() * 10),
    maxUsage: 50,
    isExpired: false,
    isExhausted: false,
    validatedAt: new Date().toISOString()
  }
}

// 生成Mock审核统计
export function generateMockAuditStatistics(): AuditStatistics {
  // 基于新的40/30/30分布
  const pendingCount = 40  // 40%待审核
  const approvedCount = 30 // 30%已通过
  const rejectedCount = 30 // 30%已驳回
  const totalAudited = approvedCount + rejectedCount

  return {
    totalAudited,
    approvedCount,
    rejectedCount,
    pendingCount,
    approvalRate: approvedCount / totalAudited,
    rejectionRate: rejectedCount / totalAudited,
    avgAuditTime: 15 + Math.random() * 30, // 15-45分钟
    totalAuditTime: totalAudited * (15 + Math.random() * 30),
    rejectReasonStats: [
      { reason: 'invalid_phone', count: 15, percentage: 0.3 },
      { reason: 'duplicate_lead', count: 10, percentage: 0.2 },
      { reason: 'incomplete_info', count: 8, percentage: 0.16 },
      { reason: 'other', count: 17, percentage: 0.34 }
    ],
    auditorStats: mockSalespersons
      .filter(s => ['leader', 'director'].includes(s.role))
      .map(auditor => ({
        auditorId: auditor.id,
        auditorName: auditor.name,
        auditedCount: 20 + Math.floor(Math.random() * 30),
        approvedCount: 15 + Math.floor(Math.random() * 20),
        rejectedCount: 5 + Math.floor(Math.random() * 10),
        avgAuditTime: 10 + Math.random() * 20
      })),
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateTo: new Date().toISOString()
  }
}

// 生成Mock批量审核结果
export function generateMockBatchAuditResult(leadIds: string[]): BatchAuditResult {
  const successCount = Math.floor(leadIds.length * 0.8)
  const failureCount = leadIds.length - successCount
  
  return {
    totalCount: leadIds.length,
    successCount,
    failureCount,
    duplicateCount: 0,
    successLeadIds: leadIds.slice(0, successCount),
    failures: leadIds.slice(successCount).map((id, index) => ({
      leadId: id,
      error: '审核失败',
      reason: index % 2 === 0 ? '权限不足' : '客资状态错误'
    })),
    batchId: `BATCH_${Date.now()}`,
    executedAt: new Date().toISOString(),
    executedBy: 'USER_001'
  }
}
