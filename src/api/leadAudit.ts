/**
 * 客资审核系统相关 API 接口模块
 * 提供完整的客资审核流程管理功能，包括审核操作、权限控制、统计分析和质量监控
 * 支持单个和批量审核、审核记录管理、工作台数据和提醒设置
 * 
 * @namespace leadAuditApi
 */

import { http } from '@/utils/request'
import type { 
  Lead,
  LeadAuditStatus 
} from '@/types/lead'
import type {
  LeadAuditRecord,
  AuditDecision,
  AuditQueryParams,
  BatchAuditRequest,
  BatchAuditResult,
  AuditStatistics,
  AuditPermissionCheck,
  AuditContext
} from '@/types/leadAudit'
import type { ApiListResponse } from '@/types/api'
import type { UserRole } from '@/types/user'

/**
 * 获取待审核客资列表接口
 * 获取当前用户有权限审核的待审核客资列表，支持筛选和分页
 * 
 * @param {AuditQueryParams} [params] - 可选查询参数，包含分页、筛选、排序条件
 * @returns {Promise<ApiListResponse<Lead>>} 分页的待审核客资列表
 * @throws {Error} 查询失败时抛出错误（权限不足、参数错误等）
 * @complexity O(n) - n为查询结果数量，涉及权限过滤和数据库查询
 * @flow 验证审核权限 -> 构建查询条件 -> 应用权限过滤 -> 分页查询 -> 返回待审核列表
 * 
 * @example
 * ```typescript
 * const pendingLeads = await getPendingLeads({
 *   page: 1,
 *   pageSize: 20,
 *   priority: 'urgent',
 *   source: 'website',
 *   submittedAfter: '2024-01-01',
 *   sortBy: 'submittedAt',
 *   sortOrder: 'asc'
 * })
 * console.log(`待审核客资: ${pendingLeads.total} 条`)
 * ```
 */
export function getPendingLeads(params?: AuditQueryParams): Promise<ApiListResponse<Lead>> {
  return http.get('/leads/audit/pending', { params })
}

/**
 * 获取所有可审核客资列表接口（基于权限）
 * 根据用户角色和权限获取所有状态的可审核客资列表
 * 
 * @param {AuditQueryParams} [params] - 可选查询参数，包含分页、筛选、排序条件
 * @returns {Promise<ApiListResponse<Lead>>} 分页的可审核客资列表
 * @throws {Error} 查询失败时抛出错误
 * @complexity O(n) - n为查询结果数量，涉及复杂的权限计算
 * @flow 计算用户审核范围 -> 构建权限查询 -> 数据库查询 -> 应用筛选 -> 返回客资列表
 * 
 * @example
 * ```typescript
 * const auditableLeads = await getAuditableLeads({
 *   page: 1,
 *   pageSize: 50,
 *   auditStatus: ['PENDING_AUDIT', 'REVIEWED'],
 *   assignedTo: 'sales-123'
 * })
 * console.log(`可审核客资: ${auditableLeads.total} 条`)
 * ```
 */
export function getAuditableLeads(params?: AuditQueryParams): Promise<ApiListResponse<Lead>> {
  return http.get('/leads/audit/all', { params })
}

/**
 * 审核单个客资接口
 * 对指定客资执行审核操作，支持通过或拒绝，并记录审核上下文
 * 
 * @param {string} leadId - 客资的唯一标识符
 * @param {AuditDecision} decision - 审核决定，包含审核动作和相关信息
 * @param {Partial<AuditContext>} [context] - 可选的审核上下文信息，如审核备注、优先级等
 * @returns {Promise<Lead>} 审核后的客资信息对象
 * @throws {Error} 审核失败时抛出错误（客资不存在、权限不足、状态冲突等）
 * @complexity O(1) - 单次审核操作加状态更新和历史记录
 * @flow 验证审核权限 -> 检查客资状态 -> 执行审核逻辑 -> 更新客资状态 -> 记录审核历史 -> 返回结果
 * 
 * @example
 * ```typescript
 * // 通过审核
 * const approvedLead = await auditLead('lead-123', {
 *   action: 'APPROVE',
 *   reason: '客资信息完整，符合审核标准',
 *   priority: 'normal'
 * }, {
 *   notes: '优质客资，建议优先跟进',
 *   tags: ['高价值', '意向强烈']
 * })
 * 
 * // 拒绝审核
 * const rejectedLead = await auditLead('lead-456', {
 *   action: 'REJECT',
 *   reason: '客资信息不完整，缺少联系方式',
 *   priority: 'low'
 * }, {
 *   notes: '需要补充完整联系方式后重新提交'
 * })
 * ```
 */
export function auditLead(
  leadId: string, 
  decision: AuditDecision,
  context?: Partial<AuditContext>
): Promise<Lead> {
  const requestData = {
    decision,
    context: {
      timestamp: new Date().toISOString(),
      ...context
    }
  }
  
  return http.put(`/leads/${leadId}/audit`, requestData)
}

/**
 * 批量审核客资接口
 * 同时对多个客资执行审核操作，提高审核效率和一致性
 * 
 * @param {BatchAuditRequest} request - 批量审核请求数据，包含客资列表和统一审核信息
 * @returns {Promise<BatchAuditResult>} 批量审核结果，包含成功、失败的详细信息
 * @throws {Error} 批量审核失败时抛出错误（权限不足、部分失败等）
 * @complexity O(n) - n为批量审核的客资数量，支持并行处理
 * @flow 验证批量权限 -> 预检查所有客资 -> 并行执行审核 -> 汇总处理结果 -> 返回批量结果
 * 
 * @example
 * ```typescript
 * const batchResult = await batchAuditLeads({
 *   leadIds: ['lead-123', 'lead-456', 'lead-789'],
 *   decision: {
 *     action: 'APPROVE',
 *     reason: '批量审核通过，客资质量良好'
 *   },
 *   batchContext: {
 *     batchId: 'batch-001',
 *     notes: '批量处理高质量客资'
 *   }
 * })
 * 
 * console.log(`成功: ${batchResult.successCount}, 失败: ${batchResult.failureCount}`)
 * batchResult.failures.forEach(failure => {
 *   console.log(`客资 ${failure.leadId} 失败: ${failure.reason}`)
 * })
 * ```
 */
export function batchAuditLeads(request: BatchAuditRequest): Promise<BatchAuditResult> {
  return http.post('/leads/audit/batch', request)
}

/**
 * 获取客资的审核记录接口
 * 查询指定客资的完整审核历史，包括所有审核节点和操作记录
 * 
 * @param {string} leadId - 客资的唯一标识符
 * @returns {Promise<LeadAuditRecord[]>} 审核记录列表，按时间倒序排列
 * @throws {Error} 获取失败时抛出错误（客资不存在、权限不足等）
 * @complexity O(n) - n为该客资的审核记录数量
 * @flow 验证客资存在 -> 查询审核历史 -> 关联审核员信息 -> 按时间排序 -> 返回记录列表
 * 
 * @example
 * ```typescript
 * const auditRecords = await getAuditRecords('lead-123')
 * console.log(`该客资共有 ${auditRecords.length} 条审核记录`)
 * 
 * auditRecords.forEach((record, index) => {
 *   console.log(`第${index + 1}次审核:`)
 *   console.log(`  时间: ${record.auditTime}`)
 *   console.log(`  审核员: ${record.auditorName}`)
 *   console.log(`  动作: ${record.action}`)
 *   console.log(`  结果: ${record.result}`)
 *   if (record.notes) console.log(`  备注: ${record.notes}`)
 * })
 * ```
 */
export function getAuditRecords(leadId: string): Promise<LeadAuditRecord[]> {
  return http.get(`/leads/${leadId}/audit-records`)
}

/**
 * 获取审核记录列表接口（支持查询和分页）
 * 查询审核记录列表，支持多维度筛选、分页和排序功能
 * 
 * @param {AuditQueryParams} [params] - 可选的查询参数，包含分页、筛选、排序条件
 * @returns {Promise<ApiListResponse<LeadAuditRecord>>} 分页的审核记录列表
 * @throws {Error} 查询失败时抛出错误（权限不足、参数错误等）
 * @complexity O(n) - n为查询结果数量，涉及数据库查询和权限过滤
 * @flow 构建查询条件 -> 应用权限过滤 -> 数据库查询 -> 分页处理 -> 返回审核记录列表
 * 
 * @example
 * ```typescript
 * const auditRecords = await getAuditRecordsList({
 *   page: 1,
 *   pageSize: 20,
 *   auditorId: 'auditor-123',
 *   action: 'APPROVE',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   sortBy: 'auditTime',
 *   sortOrder: 'desc'
 * })
 * 
 * console.log(`共 ${auditRecords.total} 条审核记录`)
 * auditRecords.list.forEach(record => {
 *   console.log(`${record.leadName} - ${record.action} - ${record.auditTime}`)
 * })
 * ```
 */
export function getAuditRecordsList(params?: AuditQueryParams): Promise<ApiListResponse<LeadAuditRecord>> {
  return http.get('/leads/audit/records', { params })
}

/**
 * 获取审核统计信息接口
 * 获取指定条件下的审核统计数据，包括审核效率、通过率等指标
 * 
 * @param {Object} [params] - 可选的统计查询参数
 * @param {string} [params.dateFrom] - 统计开始日期（YYYY-MM-DD格式）
 * @param {string} [params.dateTo] - 统计结束日期（YYYY-MM-DD格式）
 * @param {string} [params.auditorId] - 指定审核员ID，用于个人统计
 * @param {UserRole} [params.auditorRole] - 指定审核员角色，用于角色统计
 * @param {string[]} [params.teamIds] - 指定团队ID列表，用于团队统计
 * @returns {Promise<AuditStatistics>} 审核统计数据对象
 * @throws {Error} 获取失败时抛出错误（权限不足、参数错误等）
 * @complexity O(n) - n为统计时间范围内的审核记录数量，涉及聚合计算
 * @flow 构建统计查询条件 -> 聚合计算审核数据 -> 生成统计指标 -> 计算效率指标 -> 返回统计结果
 * 
 * @example
 * ```typescript
 * // 获取指定时间范围的整体统计
 * const overallStats = await getAuditStatistics({
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * })
 * console.log(`总审核数: ${overallStats.totalAuditCount}`)
 * console.log(`通过率: ${overallStats.approvalRate}%`)
 * console.log(`平均审核时长: ${overallStats.avgAuditTime}分钟`)
 * 
 * // 获取特定审核员的统计
 * const auditorStats = await getAuditStatistics({
 *   auditorId: 'auditor-123',
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * })
 * console.log(`个人审核数: ${auditorStats.totalAuditCount}`)
 * ```
 */
export function getAuditStatistics(params?: {
  dateFrom?: string
  dateTo?: string
  auditorId?: string
  auditorRole?: UserRole
  teamIds?: string[]
}): Promise<AuditStatistics> {
  return http.get('/leads/audit/statistics', { params })
}

/**
 * 检查用户的审核权限接口
 * 验证指定用户对特定客资的审核权限，用于权限控制和UI显示
 * 
 * @param {string} userId - 要检查权限的用户ID
 * @param {string[]} [leadIds] - 可选的客资ID列表，不提供则检查整体权限
 * @returns {Promise<AuditPermissionCheck>} 权限检查结果，包含详细的权限信息
 * @throws {Error} 检查失败时抛出错误（用户不存在、系统错误等）
 * @complexity O(n) - n为客资数量，涉及权限规则计算
 * @flow 查询用户信息 -> 获取用户角色权限 -> 检查客资权限 -> 计算权限范围 -> 返回权限结果
 * 
 * @example
 * ```typescript
 * // 检查用户整体审核权限
 * const generalPermission = await checkAuditPermission('user-123')
 * console.log(`可以审核: ${generalPermission.canAudit}`)
 * console.log(`权限范围: ${generalPermission.scope}`)
 * 
 * // 检查用户对特定客资的权限
 * const specificPermission = await checkAuditPermission('user-123', ['lead-456', 'lead-789'])
 * console.log(`可审核客资: ${specificPermission.allowedLeadIds}`)
 * console.log(`限制原因: ${specificPermission.restrictions}`)
 * 
 * if (specificPermission.canAudit) {
 *   console.log('用户有权限审核指定客资')
 * } else {
 *   console.log(`无权限原因: ${specificPermission.reason}`)
 * }
 * ```
 */
export function checkAuditPermission(
  userId: string, 
  leadIds?: string[]
): Promise<AuditPermissionCheck> {
  return http.post('/leads/audit/check-permission', { userId, leadIds })
}

/**
 * 获取用户可审核的客资范围接口
 * 根据用户角色和权限配置，获取用户可以审核的客资范围和限制条件
 * 
 * @param {string} userId - 用户的唯一标识符
 * @param {UserRole} userRole - 用户的角色类型，影响审核权限范围
 * @returns {Promise<Object>} 审核范围信息，包含权限边界和限制规则
 * @throws {Error} 获取失败时抛出错误（用户不存在、角色配置错误等）
 * @complexity O(1) - 基于用户角色的权限规则查询
 * @flow 验证用户和角色 -> 查询角色权限配置 -> 计算审核范围 -> 应用业务规则 -> 返回范围信息
 * 
 * @example
 * ```typescript
 * const auditScope = await getAuditScope('user-123', 'AUDIT_LEADER')
 * 
 * if (auditScope.canAuditAll) {
 *   console.log('用户可以审核所有客资')
 * } else {
 *   console.log('用户审核权限受限:')
 *   
 *   if (auditScope.allowedLeadIds) {
 *     console.log(`可审核客资: ${auditScope.allowedLeadIds.length} 个`)
 *   }
 *   
 *   if (auditScope.allowedSalesIds) {
 *     console.log(`可审核销售: ${auditScope.allowedSalesIds.length} 个`)
 *   }
 *   
 *   if (auditScope.teamIds) {
 *     console.log(`可审核团队: ${auditScope.teamIds.join(', ')}`)
 *   }
 *   
 *   if (auditScope.restrictions) {
 *     console.log(`限制条件: ${auditScope.restrictions.join(', ')}`)
 *   }
 * }
 * ```
 */
export function getAuditScope(userId: string, userRole: UserRole): Promise<{
  canAuditAll: boolean
  allowedLeadIds?: string[]
  allowedSalesIds?: string[]
  teamIds?: string[]
  restrictions?: string[]
}> {
  return http.get('/leads/audit/scope', { 
    params: { userId, userRole } 
  })
}

/**
 * 撤销审核接口（仅限特定权限）
 * 撤销已完成的审核操作，将客资状态回退到审核前状态
 * 
 * @param {string} leadId - 要撤销审核的客资ID
 * @param {string} reason - 撤销审核的原因说明，必填字段
 * @returns {Promise<Lead>} 撤销后的客资信息对象
 * @throws {Error} 撤销失败时抛出错误（权限不足、客资状态不允许、原因为空等）
 * @complexity O(1) - 单次状态回退操作加历史记录
 * @flow 验证撤销权限 -> 检查客资状态 -> 执行状态回退 -> 记录撤销日志 -> 返回更新后客资
 * 
 * @example
 * ```typescript
 * try {
 *   const revokedLead = await revokeAudit('lead-123', '审核标准发生变更，需重新审核')
 *   console.log(`客资 ${revokedLead.name} 的审核已撤销`)
 *   console.log(`当前状态: ${revokedLead.auditStatus}`)
 * } catch (error) {
 *   if (error.code === 'INSUFFICIENT_PERMISSION') {
 *     console.error('您没有撤销审核的权限')
 *   } else if (error.code === 'INVALID_STATUS') {
 *     console.error('当前客资状态不允许撤销审核')
 *   } else {
 *     console.error('撤销失败:', error.message)
 *   }
 * }
 * ```
 */
export function revokeAudit(leadId: string, reason: string): Promise<Lead> {
  return http.put(`/leads/${leadId}/audit/revoke`, { reason })
}

/**
 * 获取审核工作台数据接口
 * 为审核员提供个性化的工作台数据，包括待办任务、统计信息和快捷操作
 * 
 * @param {string} auditorId - 审核员的唯一标识符
 * @returns {Promise<Object>} 工作台数据对象，包含各类统计指标和任务列表
 * @throws {Error} 获取失败时抛出错误（审核员不存在、权限不足等）
 * @complexity O(n) - n为审核员相关的记录数量，涉及多维度数据聚合
 * @flow 验证审核员身份 -> 查询待审核任务 -> 计算统计指标 -> 获取最近审核记录 -> 组装工作台数据
 * 
 * @example
 * ```typescript
 * const workbenchData = await getAuditWorkbench('auditor-123')
 * 
 * console.log('=== 审核工作台 ===')
 * console.log(`待审核任务: ${workbenchData.pendingCount} 个`)
 * console.log(`今日已审核: ${workbenchData.todayAudited} 个`)
 * console.log(`本周已审核: ${workbenchData.weeklyAudited} 个`)
 * console.log(`平均审核时长: ${workbenchData.avgAuditTime} 分钟`)
 * 
 * console.log('\n=== 个人统计 ===')
 * console.log(`通过率: ${workbenchData.myStatistics.approvalRate}%`)
 * console.log(`拒绝率: ${workbenchData.myStatistics.rejectionRate}%`)
 * console.log(`总审核数: ${workbenchData.myStatistics.totalAudited}`)
 * 
 * console.log('\n=== 紧急任务 ===')
 * workbenchData.urgentLeads.forEach(lead => {
 *   console.log(`- ${lead.name} (${lead.phone}) - 等待时间: ${lead.waitingTime}`)
 * })
 * 
 * console.log('\n=== 最近审核 ===')
 * workbenchData.recentAudits.slice(0, 5).forEach(audit => {
 *   console.log(`- ${audit.leadName} - ${audit.action} - ${audit.auditTime}`)
 * })
 * ```
 */
export function getAuditWorkbench(auditorId: string): Promise<{
  pendingCount: number
  todayAudited: number
  weeklyAudited: number
  avgAuditTime: number
  recentAudits: LeadAuditRecord[]
  urgentLeads: Lead[]
  myStatistics: {
    approvalRate: number
    rejectionRate: number
    totalAudited: number
  }
}> {
  return http.get(`/leads/audit/workbench/${auditorId}`)
}

/**
 * 导出审核记录接口
 * 根据查询条件导出审核记录数据为Excel或CSV文件
 * 
 * @param {AuditQueryParams} [params] - 可选的查询参数，用于筛选要导出的审核记录
 * @param {'excel' | 'csv'} [format='excel'] - 导出格式，默认为Excel格式
 * @returns {Promise<Blob>} 文件数据流，可用于下载
 * @throws {Error} 导出失败时抛出错误（权限不足、数据量过大等）
 * @complexity O(n) - n为导出记录数量，涉及数据查询和文件生成
 * @flow 应用筛选条件 -> 查询审核记录 -> 格式化数据 -> 生成导出文件 -> 返回文件流
 * 
 * @example
 * ```typescript
 * // 导出指定时间范围的审核记录为Excel
 * const excelBlob = await exportAuditRecords({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   auditorId: 'auditor-123',
 *   action: 'APPROVE'
 * }, 'excel')
 * 
 * // 触发Excel文件下载
 * const url = URL.createObjectURL(excelBlob)
 * const link = document.createElement('a')
 * link.href = url
 * link.download = `audit-records-${new Date().toISOString().split('T')[0]}.xlsx`
 * link.click()
 * URL.revokeObjectURL(url)
 * 
 * // 导出为CSV格式
 * const csvBlob = await exportAuditRecords({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * }, 'csv')
 * 
 * console.log('审核记录导出完成')
 * ```
 */
export function exportAuditRecords(
  params?: AuditQueryParams,
  format: 'excel' | 'csv' = 'excel'
): Promise<Blob> {
  return http.get('/leads/audit/export', {
    params: { ...params, format },
    responseType: 'blob'
  })
}

/**
 * 获取审核质量报告接口
 * 生成详细的审核质量分析报告，包括准确性、一致性和效率评估
 * 
 * @param {Object} [params] - 可选的报告生成参数
 * @param {string} [params.dateFrom] - 报告开始日期（YYYY-MM-DD格式）
 * @param {string} [params.dateTo] - 报告结束日期（YYYY-MM-DD格式）
 * @param {string[]} [params.auditorIds] - 指定审核员ID列表，用于特定人员分析
 * @param {boolean} [params.includeDetails] - 是否包含详细分析数据，默认false
 * @returns {Promise<Object>} 审核质量报告对象，包含全面的质量评估数据
 * @throws {Error} 获取失败时抛出错误（参数错误、权限不足等）
 * @complexity O(n*m) - n为审核记录数量，m为分析维度数量，涉及复杂的质量计算
 * @flow 构建报告查询 -> 聚合审核数据 -> 计算质量指标 -> 生成趋势分析 -> 提供改进建议 -> 返回报告
 * 
 * @example
 * ```typescript
 * const qualityReport = await getAuditQualityReport({
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31',
 *   auditorIds: ['auditor-123', 'auditor-456'],
 *   includeDetails: true
 * })
 * 
 * console.log('=== 审核质量报告 ===')
 * console.log(`报告生成时间: ${qualityReport.generatedAt}`)
 * 
 * // 整体质量评估
 * const overall = qualityReport.overallQuality
 * console.log(`\n=== 整体质量 ===`)
 * console.log(`准确性: ${overall.accuracy}%`)
 * console.log(`一致性: ${overall.consistency}%`)
 * console.log(`效率: ${overall.efficiency}%`)
 * console.log(`综合评分: ${overall.score}分`)
 * 
 * // 审核员个人表现
 * console.log(`\n=== 审核员表现 ===`)
 * qualityReport.auditorPerformance.forEach(perf => {
 *   console.log(`${perf.auditorName}:`)
 *   console.log(`  审核数量: ${perf.auditedCount}`)
 *   console.log(`  准确率: ${perf.accuracy}%`)
 *   console.log(`  平均用时: ${perf.avgTime}分钟`)
 *   console.log(`  质量评分: ${perf.qualityScore}分`)
 *   if (perf.issues && perf.issues.length > 0) {
 *     console.log(`  发现问题: ${perf.issues.join(', ')}`)
 *   }
 * })
 * 
 * // 质量趋势
 * console.log(`\n=== 质量趋势 ===`)
 * qualityReport.qualityTrends.slice(-7).forEach(trend => {
 *   console.log(`${trend.date}: 准确率${trend.accuracy}%, 平均时长${trend.avgTime}分钟, 审核量${trend.volume}`)
 * })
 * 
 * // 改进建议
 * console.log(`\n=== 改进建议 ===`)
 * qualityReport.recommendations.forEach((rec, index) => {
 *   console.log(`${index + 1}. ${rec}`)
 * })
 * ```
 */
export function getAuditQualityReport(params?: {
  dateFrom?: string
  dateTo?: string
  auditorIds?: string[]
  includeDetails?: boolean
}): Promise<{
  overallQuality: {
    accuracy: number
    consistency: number
    efficiency: number
    score: number
  }
  auditorPerformance: {
    auditorId: string
    auditorName: string
    auditedCount: number
    accuracy: number
    avgTime: number
    qualityScore: number
    issues?: string[]
  }[]
  qualityTrends: {
    date: string
    accuracy: number
    avgTime: number
    volume: number
  }[]
  recommendations: string[]
  generatedAt: string
}> {
  return http.get('/leads/audit/quality-report', { params })
}

/**
 * 设置审核提醒接口
 * 配置审核系统的自动提醒设置，包括邮件、短信提醒和升级机制
 * 
 * @param {Object} settings - 提醒设置配置对象
 * @param {boolean} settings.enableEmailReminder - 是否启用邮件提醒
 * @param {boolean} settings.enableSmsReminder - 是否启用短信提醒
 * @param {number} settings.reminderInterval - 提醒间隔时间（小时）
 * @param {number} settings.urgentThreshold - 紧急提醒阈值（小时）
 * @param {boolean} settings.escalationEnabled - 是否启用升级机制
 * @param {number} settings.escalationThreshold - 升级触发阈值（小时）
 * @returns {Promise<void>} 设置操作无返回值
 * @throws {Error} 设置失败时抛出错误（权限不足、参数验证失败等）
 * @complexity O(1) - 单次配置更新操作
 * @flow 验证设置权限 -> 验证参数有效性 -> 更新提醒配置 -> 保存设置到数据库
 * 
 * @example
 * ```typescript
 * await setAuditReminders({
 *   enableEmailReminder: true,
 *   enableSmsReminder: false,
 *   reminderInterval: 2, // 每2小时提醒一次
 *   urgentThreshold: 4, // 超过4小时未审核标记为紧急
 *   escalationEnabled: true,
 *   escalationThreshold: 8 // 超过8小时自动升级给上级
 * })
 * 
 * console.log('审核提醒设置已更新')
 * ```
 */
export function setAuditReminders(settings: {
  enableEmailReminder: boolean
  enableSmsReminder: boolean
  reminderInterval: number // 小时
  urgentThreshold: number // 小时
  escalationEnabled: boolean
  escalationThreshold: number // 小时
}): Promise<void> {
  return http.put('/leads/audit/reminders', settings)
}

/**
 * 获取审核提醒设置接口
 * 获取当前系统的审核提醒配置信息
 * 
 * @returns {Promise<Object>} 当前的提醒设置配置对象
 * @throws {Error} 获取失败时抛出错误（权限不足、系统错误等）
 * @complexity O(1) - 单次配置查询操作
 * @flow 验证查询权限 -> 查询当前配置 -> 返回设置信息
 * 
 * @example
 * ```typescript
 * const currentSettings = await getAuditReminders()
 * 
 * console.log('当前审核提醒设置:')
 * console.log(`邮件提醒: ${currentSettings.enableEmailReminder ? '启用' : '禁用'}`)
 * console.log(`短信提醒: ${currentSettings.enableSmsReminder ? '启用' : '禁用'}`)
 * console.log(`提醒间隔: ${currentSettings.reminderInterval} 小时`)
 * console.log(`紧急阈值: ${currentSettings.urgentThreshold} 小时`)
 * console.log(`升级机制: ${currentSettings.escalationEnabled ? '启用' : '禁用'}`)
 * console.log(`升级阈值: ${currentSettings.escalationThreshold} 小时`)
 * console.log(`最后更新: ${currentSettings.lastUpdated}`)
 * ```
 */
export function getAuditReminders(): Promise<{
  enableEmailReminder: boolean
  enableSmsReminder: boolean
  reminderInterval: number
  urgentThreshold: number
  escalationEnabled: boolean
  escalationThreshold: number
  lastUpdated: string
}> {
  return http.get('/leads/audit/reminders')
}

/**
 * 标记客资为紧急审核接口
 * 将指定客资标记为紧急状态，优先处理并发送紧急通知
 * 
 * @param {string} leadId - 要标记为紧急的客资ID
 * @param {string} reason - 标记为紧急的原因说明，必填字段
 * @returns {Promise<Lead>} 标记后的客资信息对象
 * @throws {Error} 标记失败时抛出错误（客资不存在、权限不足、原因为空等）
 * @complexity O(1) - 单次状态更新和通知发送
 * @flow 验证操作权限 -> 检查客资状态 -> 更新紧急标记 -> 发送紧急通知 -> 返回更新后客资
 * 
 * @example
 * ```typescript
 * const urgentLead = await markAsUrgent('lead-123', 'VIP客户，需要优先处理')
 * console.log(`客资 ${urgentLead.name} 已标记为紧急`)
 * console.log(`优先级: ${urgentLead.priority}`)
 * console.log(`紧急原因: ${urgentLead.urgentReason}`)
 * ```
 */
export function markAsUrgent(leadId: string, reason: string): Promise<Lead> {
  return http.put(`/leads/${leadId}/mark-urgent`, { reason })
}

/**
 * 取消紧急标记接口
 * 移除客资的紧急状态标记，恢复正常优先级
 * 
 * @param {string} leadId - 要取消紧急标记的客资ID
 * @returns {Promise<Lead>} 取消标记后的客资信息对象
 * @throws {Error} 取消失败时抛出错误（客资不存在、权限不足等）
 * @complexity O(1) - 单次状态更新操作
 * @flow 验证操作权限 -> 检查客资状态 -> 移除紧急标记 -> 更新优先级 -> 返回更新后客资
 * 
 * @example
 * ```typescript
 * const normalLead = await unmarkAsUrgent('lead-123')
 * console.log(`客资 ${normalLead.name} 的紧急标记已取消`)
 * console.log(`当前优先级: ${normalLead.priority}`)
 * ```
 */
export function unmarkAsUrgent(leadId: string): Promise<Lead> {
  return http.put(`/leads/${leadId}/unmark-urgent`)
}

/**
 * 获取审核历史趋势接口
 * 分析指定时间范围内的审核历史数据，生成趋势分析和统计摘要
 * 
 * @param {Object} [params] - 可选的查询参数
 * @param {string} [params.dateFrom] - 分析开始日期（YYYY-MM-DD格式）
 * @param {string} [params.dateTo] - 分析结束日期（YYYY-MM-DD格式）
 * @param {'day' | 'week' | 'month'} [params.granularity] - 时间粒度，默认为天
 * @param {string} [params.auditorId] - 指定审核员ID，用于个人趋势分析
 * @returns {Promise<Object>} 审核趋势分析结果，包含时间序列数据和统计摘要
 * @throws {Error} 获取失败时抛出错误（参数错误、权限不足等）
 * @complexity O(n) - n为指定时间范围内的时间点数量，涉及时间序列聚合
 * @flow 构建时间查询 -> 按时间粒度聚合数据 -> 计算趋势指标 -> 生成统计摘要 -> 返回分析结果
 * 
 * @example
 * ```typescript
 * const auditTrends = await getAuditTrends({
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31',
 *   granularity: 'week',
 *   auditorId: 'auditor-123'
 * })
 * 
 * console.log('=== 审核趋势分析 ===')
 * console.log(`分析期间: ${auditTrends.summary.totalPeriods} 个周期`)
 * console.log(`日均审核量: ${auditTrends.summary.avgDailyVolume}`)
 * console.log(`峰值审核量: ${auditTrends.summary.peakVolume} (${auditTrends.summary.peakDate})`)
 * console.log(`整体趋势: ${auditTrends.summary.trendDirection}`)
 * 
 * console.log('\n=== 时间序列数据 ===')
 * auditTrends.trends.forEach(period => {
 *   console.log(`${period.period}:`)
 *   console.log(`  总审核: ${period.totalAudited}`)
 *   console.log(`  通过: ${period.approved} (${(period.approved/period.totalAudited*100).toFixed(1)}%)`)
 *   console.log(`  拒绝: ${period.rejected} (${(period.rejected/period.totalAudited*100).toFixed(1)}%)`)
 *   console.log(`  平均时长: ${period.avgTime}分钟`)
 *   console.log(`  效率指标: ${period.efficiency}`)
 * })
 * ```
 */
export function getAuditTrends(params?: {
  dateFrom?: string
  dateTo?: string
  granularity?: 'day' | 'week' | 'month'
  auditorId?: string
}): Promise<{
  trends: {
    period: string
    totalAudited: number
    approved: number
    rejected: number
    avgTime: number
    efficiency: number
  }[]
  summary: {
    totalPeriods: number
    avgDailyVolume: number
    peakVolume: number
    peakDate: string
    trendDirection: 'up' | 'down' | 'stable'
  }
}> {
  return http.get('/leads/audit/trends', { params })
}

/**
 * 预览审核影响接口（审核前的影响分析）
 * 在执行审核操作前预览可能产生的影响，包括奖励计算、状态变化和通知范围
 * 
 * @param {string} leadId - 要预览审核影响的客资ID
 * @param {AuditDecision} decision - 预期的审核决定
 * @returns {Promise<Object>} 审核影响预览结果，包含详细的影响分析
 * @throws {Error} 预览失败时抛出错误（客资不存在、决定无效等）
 * @complexity O(1) - 基于规则的影响计算，不涉及实际状态变更
 * @flow 加载客资信息 -> 应用审核规则 -> 计算奖励影响 -> 分析状态变化 -> 确定通知范围 -> 返回预览结果
 * 
 * @example
 * ```typescript
 * const impactPreview = await previewAuditImpact('lead-123', {
 *   action: 'APPROVE',
 *   reason: '客资信息完整，通过审核'
 * })
 * 
 * console.log('=== 审核影响预览 ===')
 * 
 * // 奖励影响
 * if (impactPreview.rewardImpact?.willCreateReward) {
 *   console.log(`将创建奖励: ${impactPreview.rewardImpact.estimatedAmount}元`)
 *   console.log(`受影响代理: ${impactPreview.rewardImpact.affectedAgents?.join(', ')}`)
 * } else {
 *   console.log('此次审核不会产生奖励')
 * }
 * 
 * // 状态变化
 * console.log(`状态变化: ${impactPreview.statusChange.from} → ${impactPreview.statusChange.to}`)
 * 
 * // 通知影响
 * console.log(`通知接收人: ${impactPreview.notifications.recipients.length} 人`)
 * console.log(`通知渠道: ${impactPreview.notifications.channels.join(', ')}`)
 * 
 * // 警告信息
 * if (impactPreview.warnings && impactPreview.warnings.length > 0) {
 *   console.log('\n⚠️ 注意事项:')
 *   impactPreview.warnings.forEach(warning => {
 *     console.log(`- ${warning}`)
 *   })
 * }
 * ```
 */
export function previewAuditImpact(leadId: string, decision: AuditDecision): Promise<{
  rewardImpact?: {
    willCreateReward: boolean
    estimatedAmount?: number
    affectedAgents?: string[]
  }
  statusChange: {
    from: LeadAuditStatus
    to: LeadAuditStatus
  }
  notifications: {
    recipients: string[]
    channels: string[]
  }
  warnings?: string[]
}> {
  return http.post(`/leads/${leadId}/audit/preview`, { decision })
}

// 导出leadAuditApi对象，包含所有API函数
export const leadAuditApi = {
  getPendingLeads,
  getAuditableLeads,
  auditLead,
  batchAuditLeads,
  getAuditRecords,
  getAuditRecordsList,
  getAuditStatistics,
  checkAuditPermission,
  revokeAudit
}
