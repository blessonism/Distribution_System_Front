import { http } from '@/utils/request'
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadQueryParams,
  DuplicateCheckResult,
  SourceDetectionResult,
  SourceValidationResult,
  ReferralCodeValidation,
  UTMParams,
  PredefinedSource
} from '@/types/lead'
import type { ApiListResponse } from '@/types/api'

/**
 * 客资管理系统相关 API 接口模块
 * 提供完整的客资生命周期管理功能，包括创建、查询、来源检测、重复检查和统计分析
 * 支持批量导入、来源验证、推荐码管理和数据导出功能
 * 
 * @namespace leadApi
 */

/**
 * 获取客资列表接口
 * 支持多维度筛选、分页查询和排序功能，用于客资管理和监控
 * 
 * @param {LeadQueryParams} [params] - 可选查询参数，包含分页、筛选、排序等条件
 * @returns {Promise<ApiListResponse<Lead>>} 分页的客资列表响应
 * @throws {Error} 查询失败时抛出错误（权限不足、参数错误等）
 * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页
 * @flow 构建查询条件 -> 数据库查询 -> 应用筛选和排序 -> 分页处理 -> 返回客资列表
 * 
 * @example
 * ```typescript
 * const leads = await getLeads({
 *   page: 1,
 *   pageSize: 20,
 *   keyword: '张三',
 *   auditStatus: 'PENDING_AUDIT',
 *   source: 'website',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   sortBy: 'createTime',
 *   sortOrder: 'desc'
 * })
 * console.log(`共 ${leads.total} 条客资记录`)
 * ```
 */
export function getLeads(params?: LeadQueryParams): Promise<ApiListResponse<Lead>> {
  return http.get('/leads/all', { params })
}

/**
 * 获取单个客资详情接口
 * 根据客资ID获取完整的客资信息，包括联系方式、来源、审核状态等
 * 
 * @param {string} leadId - 客资的唯一标识符
 * @returns {Promise<Lead>} 客资详细信息对象
 * @throws {Error} 获取失败时抛出错误（客资不存在、权限不足等）
 * @complexity O(1) - 单次数据库主键查询
 * @flow 验证客资ID -> 数据库查询 -> 关联审核历史 -> 返回完整客资信息
 * 
 * @example
 * ```typescript
 * const lead = await getLeadById('lead-123')
 * console.log(`客资姓名: ${lead.name}`)
 * console.log(`联系电话: ${lead.phone}`)
 * console.log(`来源: ${lead.source}`)
 * console.log(`审核状态: ${lead.auditStatus}`)
 * ```
 */
export function getLeadById(leadId: string): Promise<Lead> {
  return http.get(`/leads/${leadId}`)
}

/**
 * 创建新客资接口
 * 创建新的客资记录，自动设置为待审核状态并进行来源检测
 * 
 * @param {CreateLeadRequest} leadData - 客资数据，包含姓名、联系方式、来源等基本信息
 * @returns {Promise<Lead>} 创建成功的客资信息
 * @throws {Error} 创建失败时抛出错误（数据验证失败、重复客资等）
 * @complexity O(1) - 单次数据库插入加重复检查
 * @flow 数据验证 -> 重复检查 -> 自动来源检测 -> 设置审核状态 -> 数据库插入 -> 返回客资信息
 * 
 * @example
 * ```typescript
 * const newLead = await createLead({
 *   name: '张三',
 *   phone: '13800138000',
 *   wechatId: 'zhangsan_wx',
 *   source: 'website',
 *   sourceDetail: '官网注册',
 *   utmParams: {
 *     utm_source: 'google',
 *     utm_medium: 'cpc',
 *     utm_campaign: 'brand'
 *   },
 *   notes: '通过官网咨询表单提交'
 * })
 * console.log(`客资创建成功: ${newLead.id}，状态: ${newLead.auditStatus}`)
 * ```
 */
export function createLead(leadData: CreateLeadRequest): Promise<Lead> {
  // 在创建前自动进行来源检测
  const requestData = {
    ...leadData,
    auditStatus: 'PENDING_AUDIT' // 新客资默认为待审核状态
  }

  return http.post('/leads/create', requestData)
}

/**
 * 更新客资信息接口
 * 更新指定客资的信息，支持部分字段更新
 * 
 * @param {string} leadId - 要更新的客资ID
 * @param {UpdateLeadRequest} leadData - 更新数据，只需包含要修改的字段
 * @returns {Promise<Lead>} 更新后的客资信息
 * @throws {Error} 更新失败时抛出错误（客资不存在、权限不足、数据验证失败等）
 * @complexity O(1) - 单次数据库更新操作
 * @flow 验证客资存在 -> 数据验证 -> 权限检查 -> 数据库更新 -> 触发审核流程 -> 返回更新结果
 * 
 * @example
 * ```typescript
 * const updatedLead = await updateLead('lead-123', {
 *   phone: '13900139000',
 *   wechatId: 'new_wechat_id',
 *   notes: '客户联系方式已更新'
 * })
 * console.log(`客资信息已更新: ${updatedLead.name}`)
 * ```
 */
export function updateLead(leadId: string, leadData: UpdateLeadRequest): Promise<Lead> {
  return http.put(`/leads/${leadId}`, leadData)
}

/**
 * 删除客资接口
 * 软删除指定客资，保留数据但标记为已删除状态
 * 
 * @param {string} leadId - 要删除的客资ID
 * @returns {Promise<void>} 删除操作无返回值
 * @throws {Error} 删除失败时抛出错误（客资不存在、权限不足、已分配销售等）
 * @complexity O(1) - 单次数据库软删除更新
 * @flow 验证客资存在 -> 检查删除权限 -> 检查关联状态 -> 软删除操作 -> 记录删除日志
 * 
 * @example
 * ```typescript
 * await deleteLead('lead-123')
 * console.log('客资已删除')
 * ```
 */
export function deleteLead(leadId: string): Promise<void> {
  return http.delete(`/leads/${leadId}`)
}

/**
 * 分配客资给销售接口
 * 将指定客资分配给指定销售人员进行跟进
 * 
 * @param {string} leadId - 客资ID
 * @param {string} salespersonId - 销售人员ID
 * @returns {Promise<Lead>} 分配后的客资信息
 * @throws {Error} 分配失败时抛出错误（客资不存在、销售不存在、权限不足等）
 * @complexity O(1) - 单次数据库更新加关联设置
 * @flow 验证客资和销售存在 -> 检查分配权限 -> 更新分配关系 -> 记录分配历史 -> 返回更新结果
 * 
 * @example
 * ```typescript
 * const assignedLead = await assignLead('lead-123', 'sales-456')
 * console.log(`客资已分配给: ${assignedLead.salespersonName}`)
 * ```
 */
export function assignLead(leadId: string, salespersonId: string): Promise<Lead> {
  return http.put(`/leads/${leadId}/assign`, { salespersonId })
}

/**
 * 更新客资状态接口
 * 更新客资的跟进状态，记录状态变更历史
 * 
 * @param {string} leadId - 客资ID
 * @param {string} status - 新的状态值
 * @returns {Promise<Lead>} 状态更新后的客资信息
 * @throws {Error} 更新失败时抛出错误（客资不存在、状态不合法、权限不足等）
 * @complexity O(1) - 单次数据库状态更新
 * @flow 验证客资存在 -> 检查状态合法性 -> 权限检查 -> 更新状态 -> 记录状态历史 -> 返回结果
 * 
 * @example
 * ```typescript
 * const updatedLead = await updateLeadStatus('lead-123', 'CONTACTED')
 * console.log(`客资状态已更新为: ${updatedLead.status}`)
 * ```
 */
export function updateLeadStatus(leadId: string, status: string): Promise<Lead> {
  return http.put(`/leads/${leadId}/status`, { status })
}

/**
 * 检查客资重复性接口
 * 根据手机号、姓名、微信号等信息检查是否存在重复的客资记录
 * 
 * @param {Object} leadData - 客资数据，至少包含手机号，可选姓名和微信ID
 * @param {string} leadData.phone - 手机号（必填）
 * @param {string} [leadData.name] - 姓名（可选）
 * @param {string} [leadData.wechatId] - 微信ID（可选）
 * @returns {Promise<DuplicateCheckResult>} 重复检查结果，包含是否重复和匹配的客资信息
 * @throws {Error} 检查失败时抛出错误
 * @complexity O(n) - n为相似客资记录数量，涉及多字段匹配
 * @flow 标准化输入数据 -> 多字段模糊匹配 -> 计算相似度 -> 返回重复检查结果
 * 
 * @example
 * ```typescript
 * const duplicateCheck = await checkDuplicateLead({
 *   phone: '13800138000',
 *   name: '张三',
 *   wechatId: 'zhangsan_wx'
 * })
 * 
 * if (duplicateCheck.isDuplicate) {
 *   console.log('发现重复客资:')
 *   duplicateCheck.matches.forEach(match => {
 *     console.log(`${match.name} - ${match.phone} (相似度: ${match.similarity}%)`)
 *   })
 * } else {
 *   console.log('未发现重复客资')
 * }
 * ```
 */
export function checkDuplicateLead(leadData: {
  phone: string
  name?: string
  wechatId?: string
}): Promise<DuplicateCheckResult> {
  return http.post('/leads/check-duplicate', leadData)
}

/**
 * 自动检测客资来源接口
 * 基于访问者信息自动识别客资来源，包括推荐链接、UTM参数分析等
 * 
 * @param {Object} detectionData - 检测数据，包含referrer、UTM参数、用户代理等信息
 * @param {string} [detectionData.referrer] - 来源网址
 * @param {UTMParams} [detectionData.utmParams] - UTM跟踪参数
 * @param {string} [detectionData.userAgent] - 用户代理字符串
 * @param {string} [detectionData.referralCode] - 推荐码
 * @returns {Promise<SourceDetectionResult>} 来源检测结果，包含识别的来源和置信度
 * @throws {Error} 检测失败时抛出错误
 * @complexity O(1) - 规则匹配和模式识别
 * @flow 解析referrer -> 分析UTM参数 -> 匹配来源规则 -> 计算置信度 -> 返回检测结果
 * 
 * @example
 * ```typescript
 * const sourceDetection = await detectLeadSource({
 *   referrer: 'https://google.com/search?q=产品咨询',
 *   utmParams: {
 *     utm_source: 'google',
 *     utm_medium: 'cpc',
 *     utm_campaign: 'brand_campaign',
 *     utm_term: '产品咨询'
 *   },
 *   userAgent: 'Mozilla/5.0...',
 *   referralCode: 'REF123'
 * })
 * 
 * console.log(`检测到来源: ${sourceDetection.detectedSource}`)
 * console.log(`置信度: ${sourceDetection.confidence}%`)
 * console.log(`来源详情: ${sourceDetection.sourceDetail}`)
 * ```
 */
export function detectLeadSource(detectionData: {
  referrer?: string
  utmParams?: UTMParams
  userAgent?: string
  referralCode?: string
}): Promise<SourceDetectionResult> {
  return http.post('/leads/detect-source', detectionData)
}

/**
 * 验证来源信息接口
 * 验证提供的来源信息是否合法和完整，检查来源配置的有效性
 * 
 * @param {Object} sourceData - 来源数据
 * @param {string} sourceData.source - 来源标识
 * @param {string} [sourceData.sourceDetail] - 来源详细描述
 * @param {UTMParams} [sourceData.utmParams] - UTM参数
 * @returns {Promise<SourceValidationResult>} 来源验证结果，包含验证状态和建议
 * @throws {Error} 验证失败时抛出错误
 * @complexity O(1) - 来源规则验证
 * @flow 检查来源合法性 -> 验证UTM参数格式 -> 检查来源配置 -> 返回验证结果
 * 
 * @example
 * ```typescript
 * const validation = await validateLeadSource({
 *   source: 'website',
 *   sourceDetail: '官网注册页面',
 *   utmParams: {
 *     utm_source: 'google',
 *     utm_medium: 'cpc'
 *   }
 * })
 * 
 * if (validation.isValid) {
 *   console.log('来源信息验证通过')
 * } else {
 *   console.log('验证失败:', validation.errors.join(', '))
 *   console.log('建议:', validation.suggestions)
 * }
 * ```
 */
export function validateLeadSource(sourceData: {
  source: string
  sourceDetail?: string
  utmParams?: UTMParams
}): Promise<SourceValidationResult> {
  return http.post('/leads/validate-source', sourceData)
}

/**
 * 验证推荐码接口
 * 验证推荐码的有效性，检查推荐码是否存在、有效且可用
 * 
 * @param {string} referralCode - 要验证的推荐码
 * @returns {Promise<ReferralCodeValidation>} 推荐码验证结果，包含有效性和推荐人信息
 * @throws {Error} 验证失败时抛出错误
 * @complexity O(1) - 单次数据库查询加状态检查
 * @flow 查询推荐码 -> 检查有效期 -> 验证使用状态 -> 获取推荐人信息 -> 返回验证结果
 * 
 * @example
 * ```typescript
 * const codeValidation = await validateReferralCode('REF123')
 * 
 * if (codeValidation.isValid) {
 *   console.log(`推荐码有效，推荐人: ${codeValidation.referrerName}`)
 *   console.log(`推荐人ID: ${codeValidation.referrerId}`)
 * } else {
 *   console.log(`推荐码无效: ${codeValidation.reason}`)
 * }
 * ```
 */
export function validateReferralCode(referralCode: string): Promise<ReferralCodeValidation> {
  return http.get(`/leads/validate-referral-code/${encodeURIComponent(referralCode)}`)
}

/**
 * 获取来源建议列表接口
 * 获取预定义的来源选项列表，支持关键词搜索和热门推荐
 * 
 * @param {string} [keyword] - 可选的搜索关键词，用于筛选来源选项
 * @returns {Promise<Object>} 来源建议结果，包含搜索结果、热门选项和最近使用
 * @throws {Error} 获取失败时抛出错误
 * @complexity O(n) - n为来源选项数量，涉及关键词匹配
 * @flow 关键词匹配 -> 查询热门来源 -> 获取最近使用 -> 组合结果 -> 返回建议列表
 * 
 * @example
 * ```typescript
 * // 获取所有来源建议
 * const allSuggestions = await getSourceSuggestions()
 * console.log('热门来源:', allSuggestions.popular)
 * console.log('最近使用:', allSuggestions.recent)
 * 
 * // 根据关键词搜索
 * const searchResults = await getSourceSuggestions('网站')
 * console.log('搜索结果:', searchResults.suggestions)
 * ```
 */
export function getSourceSuggestions(keyword?: string): Promise<{
  suggestions: PredefinedSource[]
  popular: PredefinedSource[]
  recent: PredefinedSource[]
}> {
  return http.get('/leads/source-suggestions', {
    params: keyword ? { keyword } : undefined
  })
}

/**
 * 批量导入客资接口
 * 批量创建多个客资记录，支持重复检查、来源检测等自动化处理选项
 * 
 * @param {CreateLeadRequest[]} leads - 客资列表，每项包含客资的基本信息
 * @param {Object} [options] - 可选的导入配置选项
 * @param {boolean} [options.skipDuplicateCheck] - 是否跳过重复检查
 * @param {boolean} [options.autoDetectSource] - 是否自动检测来源
 * @param {PredefinedSource} [options.defaultSource] - 默认来源配置
 * @returns {Promise<Object>} 批量导入结果，包含成功、失败和重复的详细统计
 * @throws {Error} 批量导入失败时抛出错误
 * @complexity O(n*m) - n为客资数量，m为平均重复检查的复杂度
 * @flow 数据预处理 -> 批量重复检查 -> 逐个创建客资 -> 统计处理结果 -> 返回导入报告
 * 
 * @example
 * ```typescript
 * const importResult = await batchImportLeads([
 *   {
 *     name: '张三',
 *     phone: '13800138000',
 *     source: 'excel_import'
 *   },
 *   {
 *     name: '李四', 
 *     phone: '13900139000',
 *     source: 'excel_import'
 *   }
 * ], {
 *   skipDuplicateCheck: false,
 *   autoDetectSource: true,
 *   defaultSource: { id: 'excel', name: 'Excel导入' }
 * })
 * 
 * console.log(`导入成功: ${importResult.successCount}`)
 * console.log(`导入失败: ${importResult.failureCount}`)
 * console.log(`重复客资: ${importResult.duplicateCount}`)
 * ```
 */
export function batchImportLeads(
  leads: CreateLeadRequest[],
  options?: {
    skipDuplicateCheck?: boolean
    autoDetectSource?: boolean
    defaultSource?: PredefinedSource
  }
): Promise<{
  successCount: number
  failureCount: number
  duplicateCount: number
  results: {
    success: Lead[]
    failures: {
      index: number
      data: CreateLeadRequest
      error: string
    }[]
    duplicates: {
      index: number
      data: CreateLeadRequest
      existingLead: Lead
    }[]
  }
}> {
  return http.post('/leads/batch-import', { leads, options })
}

/**
 * 导出客资数据接口
 * 根据查询条件导出客资数据为Excel或CSV文件
 * 
 * @param {LeadQueryParams} [params] - 可选的查询参数，用于筛选要导出的客资
 * @param {'excel' | 'csv'} [format='excel'] - 导出格式，默认为Excel
 * @returns {Promise<Blob>} 文件数据流，可用于下载
 * @throws {Error} 导出失败时抛出错误
 * @complexity O(n) - n为导出客资数量，涉及数据查询和文件生成
 * @flow 应用筛选条件 -> 查询客资数据 -> 生成导出文件 -> 返回文件流
 * 
 * @example
 * ```typescript
 * const fileBlob = await exportLeads({
 *   auditStatus: 'APPROVED',
 *   source: 'website',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * }, 'excel')
 * 
 * // 触发文件下载
 * const url = URL.createObjectURL(fileBlob)
 * const link = document.createElement('a')
 * link.href = url
 * link.download = 'leads-export.xlsx'
 * link.click()
 * ```
 */
export function exportLeads(
  params?: LeadQueryParams,
  format: 'excel' | 'csv' = 'excel'
): Promise<Blob> {
  return http.get('/leads/export', {
    params: { ...params, format },
    responseType: 'blob'
  })
}

/**
 * 获取客资统计信息接口
 * 获取客资的统计分析数据，包括数量分布、转化率、来源分析和趋势数据
 * 
 * @param {Object} [params] - 可选的统计查询参数
 * @param {string} [params.dateFrom] - 统计开始日期
 * @param {string} [params.dateTo] - 统计结束日期
 * @param {string} [params.salespersonId] - 指定销售人员ID
 * @param {string} [params.source] - 指定来源筛选
 * @param {string} [params.auditStatus] - 指定审核状态筛选
 * @returns {Promise<Object>} 客资统计数据，包含多维度分析结果
 * @throws {Error} 获取失败时抛出错误
 * @complexity O(n) - n为统计时间范围内的客资数量，涉及聚合计算
 * @flow 构建统计查询 -> 聚合计算各项指标 -> 生成趋势数据 -> 计算转化率 -> 返回统计结果
 * 
 * @example
 * ```typescript
 * const statistics = await getLeadStatistics({
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31',
 *   salespersonId: 'sales-123'
 * })
 * 
 * console.log(`总客资数: ${statistics.totalCount}`)
 * console.log(`待审核: ${statistics.pendingCount}`)
 * console.log(`已通过: ${statistics.approvedCount}`)
 * console.log(`转化率: ${statistics.conversionRate}%`)
 * 
 * // 来源分布分析
 * statistics.sourceBreakdown.forEach(item => {
 *   console.log(`${item.source.name}: ${item.count}个 (${item.percentage}%)`)
 * })
 * 
 * // 每日趋势数据
 * statistics.dailyTrend.forEach(day => {
 *   console.log(`${day.date}: 新增${day.count}，通过${day.approved}，拒绝${day.rejected}`)
 * })
 * ```
 */
export function getLeadStatistics(params?: {
  dateFrom?: string
  dateTo?: string
  salespersonId?: string
  source?: string
  auditStatus?: string
}): Promise<{
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  conversionRate: number
  sourceBreakdown: {
    source: PredefinedSource
    count: number
    percentage: number
  }[]
  auditStatusBreakdown: {
    status: string
    count: number
    percentage: number
  }[]
  dailyTrend: {
    date: string
    count: number
    approved: number
    rejected: number
  }[]
}> {
  return http.get('/leads/statistics', { params })
}

/**
 * 客资管理 API 接口集合
 * 导出对象包含所有客资相关的API函数，便于统一调用和管理
 * 
 * @namespace leadApi
 */
export const leadApi = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
  checkDuplicateLead,
  detectLeadSource,
  validateLeadSource,
  validateReferralCode,
  getSourceSuggestions,
  batchImportLeads,
  exportLeads,
  getLeadStatistics
}