/**
 * @fileoverview 客资管理类型定义
 * 定义分销系统中客资管理相关的核心类型接口和枚举
 * 包含客资信息、状态管理、来源检测、审核流程、UTM跟踪和统计分析等完整功能模块
 * 集成来源自动识别、推荐码验证、重复检查和数据分析等高级功能
 * 
 * @module types/lead
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 客资状态枚举
 * 定义客资在业务流程中的不同阶段状态
 * 
 * @typedef {string} LeadStatus
 * 
 * 状态流转说明：
 * - PENDING: 待处理 - 新录入的客资，等待分配处理
 * - FOLLOWING: 跟进中 - 已分配销售人员，正在跟进沟通
 * - CONVERTED: 已转化 - 成功转化为付费客户
 * - INVALID: 无效 - 确认为无效客资（重复、虚假等）
 * 
 * @example
 * ```typescript
 * const newLead: LeadStatus = 'PENDING'
 * const activeLead: LeadStatus = 'FOLLOWING'
 * 
 * // 状态判断
 * function isActiveStatus(status: LeadStatus): boolean {
 *   return status === 'FOLLOWING' || status === 'CONVERTED'
 * }
 * ```
 */
export type LeadStatus = 'PENDING' | 'FOLLOWING' | 'CONVERTED' | 'INVALID'

/**
 * 客资审核状态枚举
 * 定义客资在审核流程中的不同状态
 * 
 * @typedef {string} LeadAuditStatus
 * 
 * 审核流程说明：
 * - PENDING_AUDIT: 待审核 - 客资已录入，等待审核人员审核
 * - APPROVED: 审核通过 - 客资信息确认有效，可以正常跟进
 * - REJECTED: 审核驳回 - 客资信息存在问题，需要修正或淘汰
 * 
 * @example
 * ```typescript
 * const pendingLead: LeadAuditStatus = 'PENDING_AUDIT'
 * const approvedLead: LeadAuditStatus = 'APPROVED'
 * 
 * // 审核状态检查
 * function needsAudit(status: LeadAuditStatus): boolean {
 *   return status === 'PENDING_AUDIT'
 * }
 * ```
 */
export type LeadAuditStatus = 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED'

/**
 * UTM参数接口
 * 用于跟踪客资来源的详细营销信息，支持完整的UTM参数体系
 * 
 * @interface UTMParams
 * 
 * @example
 * ```typescript
 * const utmData: UTMParams = {
 *   utmSource: 'google',        // 来源：Google
 *   utmMedium: 'cpc',           // 媒介：付费点击
 *   utmCampaign: 'summer_sale', // 活动：夏季促销
 *   utmTerm: 'insurance',       // 关键词：保险
 *   utmContent: 'banner_ad'     // 内容：横幅广告
 * }
 * 
 * // UTM参数构建
 * function buildTrackingUrl(baseUrl: string, utm: UTMParams): string {
 *   const params = new URLSearchParams()
 *   if (utm.utmSource) params.set('utm_source', utm.utmSource)
 *   if (utm.utmMedium) params.set('utm_medium', utm.utmMedium)
 *   return `${baseUrl}?${params.toString()}`
 * }
 * ```
 */
export interface UTMParams {
  utmSource?: string      // UTM来源 (如: google, facebook)
  utmMedium?: string      // UTM媒介 (如: cpc, email, social)
  utmCampaign?: string    // UTM活动 (如: summer_sale)
  utmTerm?: string        // UTM关键词
  utmContent?: string     // UTM内容
}

/**
 * 来源检测方法枚举
 * 定义客资来源自动识别的不同技术方法
 * 
 * @enum {string} SourceDetectionMethod
 * 
 * 检测方法说明：
 * - UTM: 基于UTM参数检测 - 最准确的跟踪方式
 * - REFERRER: 基于引荐页面检测 - 通过HTTP Referrer识别
 * - USER_AGENT: 基于用户代理检测 - 通过浏览器标识识别
 * - REFERRAL_CODE: 基于推荐码检测 - 通过邀请码识别
 * - MANUAL: 手动选择 - 用户手动指定来源
 * - DEFAULT: 默认来源 - 无法识别时的默认值
 * 
 * @example
 * ```typescript
 * const detectionMethod: SourceDetectionMethod = SourceDetectionMethod.UTM
 * 
 * // 检测优先级
 * const priority = {
 *   [SourceDetectionMethod.UTM]: 1,
 *   [SourceDetectionMethod.REFERRAL_CODE]: 2,
 *   [SourceDetectionMethod.REFERRER]: 3,
 *   [SourceDetectionMethod.USER_AGENT]: 4,
 *   [SourceDetectionMethod.MANUAL]: 5,
 *   [SourceDetectionMethod.DEFAULT]: 6
 * }
 * ```
 */
export enum SourceDetectionMethod {
  UTM = 'utm',                    // 基于UTM参数检测
  REFERRER = 'referrer',          // 基于引荐页面检测
  USER_AGENT = 'user_agent',      // 基于用户代理检测
  REFERRAL_CODE = 'referral_code', // 基于推荐码检测
  MANUAL = 'manual',              // 手动选择
  DEFAULT = 'default'             // 默认来源
}

/**
 * 预定义来源类型枚举
 * 定义分销系统支持的所有客资来源渠道分类
 * 
 * @enum {string} PredefinedSource
 * 
 * 来源分类体系：
 * 1. 搜索引擎类 - 通过搜索引擎自然或付费流量
 * 2. 社交媒体类 - 来自各大社交平台的推广
 * 3. 广告投放类 - 付费广告渠道的转化
 * 4. 推荐渠道类 - 口碑传播和推荐获得
 * 5. 线下渠道类 - 线下活动和门店获得
 * 6. 合作渠道类 - 商业合作伙伴转介
 * 7. 直接渠道类 - 官方渠道直接咨询
 * 8. 其他类别 - 特殊或未分类来源
 * 
 * @example
 * ```typescript
 * const wechatLead: PredefinedSource = PredefinedSource.WECHAT
 * const searchLead: PredefinedSource = PredefinedSource.GOOGLE
 * 
 * // 来源归类
 * function getSourceCategory(source: PredefinedSource): string {
 *   if ([PredefinedSource.GOOGLE, PredefinedSource.BAIDU].includes(source)) {
 *     return '搜索引擎'
 *   }
 *   if ([PredefinedSource.WECHAT, PredefinedSource.XIAOHONGSHU].includes(source)) {
 *     return '社交媒体'
 *   }
 *   return '其他'
 * }
 * ```
 */
export enum PredefinedSource {
  // 搜索引擎
  SEARCH_ENGINE = '搜索引擎',
  GOOGLE = 'Google搜索',
  BAIDU = '百度搜索',
  BING = 'Bing搜索',

  // 社交媒体
  SOCIAL_MEDIA = '社交媒体',
  WECHAT = '微信',
  XIAOHONGSHU = '小红书',
  WEIBO = '微博',
  DOUYIN = '抖音',
  KUAISHOU = '快手',

  // 广告投放
  PAID_ADS = '广告投放',
  GOOGLE_ADS = 'Google广告',
  BAIDU_ADS = '百度广告',
  WECHAT_ADS = '微信广告',
  XIAOHONGSHU_ADS = '小红书广告',

  // 推荐渠道
  REFERRAL = '客户推荐',
  AGENT_REFERRAL = '代理推荐',
  EMPLOYEE_REFERRAL = '员工推荐',

  // 线下渠道
  OFFLINE = '线下活动',
  EXHIBITION = '展会',
  SEMINAR = '研讨会',
  STORE_VISIT = '门店到访',

  // 合作渠道
  PARTNERSHIP = '合作渠道',
  AFFILIATE = '联盟营销',
  CHANNEL_PARTNER = '渠道合作伙伴',

  // 直接渠道
  DIRECT = '直接访问',
  WEBSITE = '官网咨询',
  HOTLINE = '热线电话',
  EMAIL = '邮件咨询',

  // 其他
  OTHER = '其他',
  UNKNOWN = '未知来源'
}

/**
 * 来源检测规则接口
 */
export interface SourceDetectionRule {
  id: string                      // 规则ID
  name: string                    // 规则名称
  priority: number                // 优先级 (数字越小优先级越高)
  enabled: boolean                // 是否启用
  conditions: {                   // 检测条件
    utmSource?: string[]          // UTM来源匹配
    utmMedium?: string[]          // UTM媒介匹配
    referrerDomain?: string[]     // 引荐域名匹配
    referrerPath?: string[]       // 引荐路径匹配
    userAgentKeywords?: string[]  // 用户代理关键词
    referralCodePattern?: string  // 推荐码模式
  }
  result: {                       // 检测结果
    source: PredefinedSource      // 匹配的来源
    sourceDetail?: string         // 来源详情
    confidence: number            // 置信度
  }
}

/**
 * 来源检测结果接口
 * 用于自动识别客资来源
 */
export interface SourceDetectionResult {
  suggestedSource: PredefinedSource // 建议的来源
  sourceDetail: string              // 来源详情描述
  confidence: number                // 置信度 (0-1)
  detectionMethod: SourceDetectionMethod // 检测方法
  utmParams?: UTMParams             // UTM参数
  referrer?: string                 // 引荐页面URL
  userAgent?: string                // 用户代理字符串
  referralCode?: string             // 推荐码
  matchedRules?: string[]           // 匹配的规则ID列表
  alternatives?: {                  // 备选来源建议
    source: PredefinedSource
    confidence: number
    reason: string
  }[]
  detectedAt: string                // 检测时间
}

/**
 * 来源验证结果接口
 */
export interface SourceValidationResult {
  isValid: boolean                  // 是否有效
  source: PredefinedSource          // 验证后的来源
  issues?: string[]                 // 发现的问题
  suggestions?: string[]            // 改进建议
  validatedAt: string               // 验证时间
}

/**
 * 推荐码验证结果接口
 */
export interface ReferralCodeValidation {
  isValid: boolean                  // 推荐码是否有效
  referralCode: string              // 推荐码
  referrerInfo?: {                  // 推荐人信息
    id: string                      // 推荐人ID
    name: string                    // 推荐人姓名
    role: string                    // 推荐人角色
    level?: string                  // 推荐人等级
  }
  codeType: 'agent' | 'employee' | 'customer' | 'promotion' // 推荐码类型
  expiresAt?: string                // 过期时间
  usageCount?: number               // 使用次数
  maxUsage?: number                 // 最大使用次数
  isExpired: boolean                // 是否已过期
  isExhausted: boolean              // 是否已用完
  validatedAt: string               // 验证时间
}

/**
 * 来源分析报告接口
 */
export interface SourceAnalysisReport {
  period: {                         // 分析周期
    startDate: string
    endDate: string
  }
  totalLeads: number                // 总客资数
  sourceBreakdown: {                // 来源分布
    source: PredefinedSource
    count: number
    percentage: number
    conversionRate?: number         // 转化率
    avgQuality?: number             // 平均质量分
  }[]
  detectionMethodStats: {           // 检测方法统计
    method: SourceDetectionMethod
    count: number
    accuracy: number                // 准确率
  }[]
  topReferrers: {                   // 主要引荐来源
    domain: string
    count: number
    conversionRate: number
  }[]
  utmAnalysis: {                    // UTM分析
    campaigns: {
      campaign: string
      leads: number
      cost?: number
      roi?: number
    }[]
    sources: {
      source: string
      leads: number
      quality: number
    }[]
    mediums: {
      medium: string
      leads: number
      conversionRate: number
    }[]
  }
  recommendations: string[]         // 优化建议
  generatedAt: string               // 报告生成时间
}

/**
 * 客资主要信息接口
 * 定义分销系统中客资的核心信息结构，包含基础信息、审核状态、来源跟踪和系统字段
 * 支持完整的客资生命周期管理和多维度信息跟踪
 * 
 * @interface Lead
 * 
 * @example
 * ```typescript
 * const lead: Lead = {
 *   // 基础信息
 *   id: 'lead_001',
 *   name: '张三',
 *   phone: '13800138000',
 *   wechatId: 'zhangsan_wx',
 *   
 *   // 业务状态
 *   status: 'FOLLOWING',
 *   auditStatus: 'APPROVED',
 *   
 *   // 来源信息
 *   source: '微信',
 *   sourceDetail: '微信朋友圈广告',
 *   utmSource: 'wechat',
 *   utmCampaign: 'friends_circle_ad',
 *   
 *   // 分配信息
 *   salespersonName: '李销售',
 *   salespersonId: 'sales_001',
 *   
 *   // 时间记录
 *   createdAt: '2024-01-01T00:00:00Z',
 *   lastFollowUpAt: '2024-01-15T10:30:00Z',
 *   auditedAt: '2024-01-02T09:00:00Z'
 * }
 * ```
 */
export interface Lead {
  // === 现有字段 (保持向后兼容) ===
  id: string                    // 客资ID
  name: string                  // 客户姓名
  phone: string                 // 联系电话
  status: LeadStatus            // 客资状态
  source: string                // 来源渠道
  salespersonName: string       // 归属销售姓名
  salespersonId: string         // 归属销售ID
  agentName?: string            // 归属代理姓名
  agentId?: string              // 归属代理ID
  createdAt: string             // 创建时间
  lastFollowUpAt?: string       // 最后跟进时间

  // === 新增扩展字段 ===
  wechatId?: string             // 微信号
  notes?: string                // 备注信息

  // === 审核相关字段 ===
  auditStatus: LeadAuditStatus  // 审核状态 (默认为 PENDING_AUDIT)
  auditedAt?: string            // 审核时间
  auditedBy?: string            // 审核人ID
  auditedByName?: string        // 审核人姓名
  auditComment?: string         // 审核备注
  rejectReason?: string         // 驳回原因

  // === 来源识别字段 ===
  sourceDetail?: string         // 来源详情描述
  referralCode?: string         // 推荐码
  utmSource?: string            // UTM来源
  utmMedium?: string            // UTM媒介
  utmCampaign?: string          // UTM活动
  utmTerm?: string              // UTM关键词
  utmContent?: string           // UTM内容
  referrer?: string             // 引荐页面URL

  // === 系统字段 ===
  updatedAt?: string            // 最后更新时间
  version?: number              // 数据版本号 (用于乐观锁)
}

/**
 * 创建客资请求接口
 * 定义创建新客资记录时需要提供的必要信息
 * 
 * @interface CreateLeadRequest
 * 
 * @example
 * ```typescript
 * const newLead: CreateLeadRequest = {
 *   name: '王五',
 *   phone: '13900139000',
 *   source: '小红书',
 *   salespersonId: 'sales_002',
 *   wechatId: 'wangwu_xiaohongshu',
 *   notes: '对理财产品感兴趣，预算较充足',
 *   referralCode: 'REF123456',
 *   utmParams: {
 *     utmSource: 'xiaohongshu',
 *     utmMedium: 'social',
 *     utmCampaign: 'finance_promotion'
 *   },
 *   referrer: 'https://xiaohongshu.com/discovery/item/123'
 * }
 * 
 * // 数据验证示例
 * function validateCreateRequest(data: CreateLeadRequest): boolean {
 *   return data.name.trim().length > 0 &&
 *          /^1[3-9]\d{9}$/.test(data.phone) &&
 *          data.source.trim().length > 0
 * }
 * ```
 */
export interface CreateLeadRequest {
  name: string                  // 客户姓名 (必填)
  phone: string                 // 联系电话 (必填)
  source: string                // 来源渠道 (必填)
  salespersonId: string         // 归属销售ID (必填)
  agentId?: string              // 归属代理ID (可选)
  wechatId?: string             // 微信号 (可选)
  notes?: string                // 备注信息 (可选)
  referralCode?: string         // 推荐码 (可选)
  utmParams?: UTMParams         // UTM参数 (可选)
  referrer?: string             // 引荐页面 (可选)
}

/**
 * 更新客资请求接口
 * 定义更新客资信息时可修改的字段，所有字段都是可选的
 * 
 * @interface UpdateLeadRequest
 * 
 * @example
 * ```typescript
 * // 更新客资状态
 * const statusUpdate: UpdateLeadRequest = {
 *   status: 'CONVERTED',
 *   notes: '已成功签约，转化为正式客户'
 * }
 * 
 * // 更新联系信息
 * const contactUpdate: UpdateLeadRequest = {
 *   phone: '13800138001',
 *   wechatId: 'new_wechat_id'
 * }
 * 
 * // 调整分配信息
 * const reassignment: UpdateLeadRequest = {
 *   salespersonId: 'sales_003'
 * }
 * 
 * // UTM信息补充
 * const utmUpdate: UpdateLeadRequest = {
 *   utmParams: {
 *     utmSource: 'updated_source',
 *     utmCampaign: 'retargeting_campaign'
 *   }
 * }
 * ```
 */
export interface UpdateLeadRequest {
  name?: string
  phone?: string
  status?: LeadStatus
  source?: string
  salespersonId?: string
  agentId?: string
  wechatId?: string
  notes?: string
  referralCode?: string
  utmParams?: UTMParams
}

/**
 * 客资查询参数接口
 * 定义查询客资列表时支持的筛选和分页参数
 * 
 * @interface LeadQueryParams
 * 
 * @example
 * ```typescript
 * const queryParams: LeadQueryParams = {
 *   page: 1,
 *   pageSize: 20,
 *   name: '张',
 *   phone: '138',
 *   status: 'FOLLOWING',
 *   auditStatus: 'APPROVED',
 *   source: '微信',
 *   salespersonId: 'sales_001',
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-01-31',
 *   auditDateFrom: '2024-01-01',
 *   auditDateTo: '2024-01-31'
 * }
 * 
 * // 构建查询条件
 * function buildSearchCondition(params: LeadQueryParams): object {
 *   const conditions: any = {}
 *   if (params.status) conditions.status = params.status
 *   if (params.auditStatus) conditions.auditStatus = params.auditStatus
 *   if (params.salespersonId) conditions.salespersonId = params.salespersonId
 *   return conditions
 * }
 * ```
 */
export interface LeadQueryParams {
  page?: number                 // 页码
  pageSize?: number             // 每页数量
  name?: string                 // 客户姓名搜索
  phone?: string                // 手机号搜索
  status?: LeadStatus           // 客资状态筛选
  auditStatus?: LeadAuditStatus // 审核状态筛选
  source?: string               // 来源筛选
  salespersonId?: string        // 销售人员筛选
  agentId?: string              // 代理人员筛选
  dateFrom?: string             // 创建时间起始
  dateTo?: string               // 创建时间结束
  auditDateFrom?: string        // 审核时间起始
  auditDateTo?: string          // 审核时间结束
}

/**
 * 重复客资检查结果接口
 * 用于检测和处理重复客资问题的结果信息
 * 
 * @interface DuplicateCheckResult
 * 
 * @example
 * ```typescript
 * const checkResult: DuplicateCheckResult = {
 *   isDuplicate: true,
 *   duplicateLeads: [
 *     {
 *       id: 'lead_001',
 *       name: '张三',
 *       phone: '13800138000',
 *       // ... 其他字段
 *     }
 *   ],
 *   similarity: 0.95,
 *   matchFields: ['phone', 'name']
 * }
 * 
 * // 重复处理逻辑
 * function handleDuplicate(result: DuplicateCheckResult): void {
 *   if (result.isDuplicate && result.similarity > 0.9) {
 *     console.log(`发现高度相似客资，匹配字段：${result.matchFields.join(', ')}`)
 *     result.duplicateLeads.forEach(lead => {
 *       console.log(`重复客资：${lead.name} - ${lead.phone}`)
 *     })
 *   }
 * }
 * ```
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean          // 是否重复
  duplicateLeads: Lead[]        // 重复的客资列表
  similarity: number            // 相似度 (0-1)
  matchFields: string[]         // 匹配的字段
}