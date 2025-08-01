import { http } from '@/utils/request'
import type { PaginatedResponse } from '@/types/api'
import type {
  InvitationCode,
  InvitationRecord,
  InvitationStats,
  ValidateCodeRequest,
  ValidateCodeResponse,
  HistoryQueryParams,
  StatsQueryParams,
  GenerateCodeRequest,
  GenerateCodeResponse,
  ExportHistoryParams
} from '@/types/invitation'
import { withInvitationRetry, createInvitationRetryMechanism, getAdaptiveRetryConfig } from '@/utils/retryMechanism'

/**
 * 邀请系统相关 API 接口模块
 * 提供完整的邀请码管理功能，包括生成、验证、历史记录、统计分析等
 * 集成重试机制以提高系统可靠性和用户体验
 * 
 * @namespace invitationApi
 */

/**
 * 创建带重试功能的邀请API实例
 * 为所有邀请相关操作提供统一的重试机制和错误处理
 * 
 * @returns {Object} 包含所有邀请API方法的对象，每个方法都具备重试能力
 * @complexity O(1) - 工厂函数创建成本
 * @flow 创建重试包装器 -> 定义API方法 -> 配置重试策略 -> 返回API实例
 * 
 * @example
 * ```typescript
 * const inviteApi = createRetryableInvitationApi()
 * const codes = await inviteApi.getCodes()
 * ```
 */
const createRetryableInvitationApi = () => {
  return {
    /**
     * 获取当前用户的邀请码列表接口
     * 根据用户角色返回对应数量的邀请码（总监3个，组长2个，销售1个）
     * 
     * @returns {Promise<InvitationCode[]>} 当前用户的邀请码列表
     * @throws {Error} 获取失败时抛出错误（权限不足、系统错误等）
     * @complexity O(1) - 单次数据库查询，按用户ID索引
     * @flow 验证用户权限 -> 查询用户角色 -> 获取对应邀请码 -> 返回列表数据
     * 
     * @example
     * ```typescript
     * const myCodes = await invitationApi.getCodes()
     * console.log(`我有 ${myCodes.length} 个邀请码`)
     * myCodes.forEach(code => {
     *   console.log(`${code.code} - ${code.status} (剩余: ${code.remainingUses}次)`)
     * })
     * ```
     */
    getCodes: withInvitationRetry(async (): Promise<InvitationCode[]> => {
      const response = await http.get<InvitationCode[]>('/invitation/codes')
      return response
    }),

    /**
     * 生成新的邀请码接口（如果支持重新生成功能）
     * 为指定角色创建新的邀请码，支持不同角色的邀请权限控制
     * 
     * @param {GenerateCodeRequest['targetRole']} targetRole - 目标角色（销售、组长、总监等）
     * @returns {Promise<GenerateCodeResponse>} 生成的邀请码信息
     * @throws {Error} 生成失败时抛出错误（权限不足、配额超限等）
     * @complexity O(1) - 单次数据库插入操作
     * @flow 验证生成权限 -> 检查配额限制 -> 生成唯一码 -> 保存到数据库 -> 返回结果
     * 
     * @example
     * ```typescript
     * const newCode = await invitationApi.generateCode('sales')
     * console.log(`生成新邀请码: ${newCode.code}，有效期: ${newCode.expiresAt}`)
     * ```
     */
    generateCode: withInvitationRetry(async (targetRole: GenerateCodeRequest['targetRole']): Promise<GenerateCodeResponse> => {
      const response = await http.post<GenerateCodeResponse>('/invitation/codes', { targetRole })
      return response
    }),

    /**
     * 验证邀请码有效性接口（关键操作，使用自适应重试配置）
     * 验证邀请码是否有效、未过期且可使用，是注册流程的关键环节
     * 
     * @param {string} code - 要验证的邀请码字符串
     * @returns {Promise<ValidateCodeResponse>} 验证结果，包含有效性和相关信息
     * @throws {Error} 验证失败时抛出错误（邀请码无效、已过期、权限不匹配等）
     * @complexity O(1) - 单次数据库查询加验证逻辑
     * @flow 查询邀请码 -> 检查有效性 -> 验证使用权限 -> 检查使用次数 -> 返回验证结果
     * 
     * @example
     * ```typescript
     * try {
     *   const validation = await invitationApi.validateCode('INVITE123')
     *   if (validation.valid) {
     *     console.log(`邀请码有效，目标角色: ${validation.targetRole}`)
     *     // 继续注册流程
     *   }
     * } catch (error) {
     *   console.error('邀请码验证失败:', error.message)
     * }
     * ```
     */
    validateCode: async (code: string): Promise<ValidateCodeResponse> => {
      const retryMechanism = createInvitationRetryMechanism()
      const adaptiveConfig = await getAdaptiveRetryConfig()
      
      const result = await retryMechanism.execute(async () => {
        return await http.post<ValidateCodeResponse>('/invitation/validate', code)
      }, adaptiveConfig)

      if (result.success) {
        return result.data!
      } else {
        console.error('[邀请API] 验证邀请码失败:', result.error, result.context)
        throw result.error
      }
    },

    /**
     * 获取邀请历史记录接口
     * 查询用户的邀请历史，支持分页、筛选和排序功能
     * 
     * @param {HistoryQueryParams} [params] - 可选的查询参数，包含分页和筛选条件
     * @returns {Promise<PaginatedResponse<InvitationRecord>>} 分页的邀请记录列表
     * @throws {Error} 查询失败时抛出错误
     * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页
     * @flow 构建查询条件 -> 数据库查询 -> 应用筛选 -> 分页处理 -> 返回结果
     * 
     * @example
     * ```typescript
     * const history = await invitationApi.getHistory({
     *   page: 1,
     *   pageSize: 20,
     *   status: 'success',
     *   startDate: '2024-01-01',
     *   endDate: '2024-12-31'
     * })
     * console.log(`共 ${history.total} 条记录，当前页 ${history.data.length} 条`)
     * ```
     */
    getHistory: withInvitationRetry(async (params?: HistoryQueryParams): Promise<PaginatedResponse<InvitationRecord>> => {
      const response = await http.get<PaginatedResponse<InvitationRecord>>('/invitation/history', { params })
      return response
    }),

    /**
     * 获取邀请统计信息接口
     * 获取邀请相关的统计数据，包括成功率、使用情况等指标
     * 
     * @param {StatsQueryParams} [params] - 可选的统计查询参数，如时间范围等
     * @returns {Promise<InvitationStats>} 邀请统计数据对象
     * @throws {Error} 获取失败时抛出错误
     * @complexity O(n) - n为统计时间范围内的记录数量
     * @flow 构建统计查询 -> 聚合计算 -> 生成统计指标 -> 返回统计结果
     * 
     * @example
     * ```typescript
     * const stats = await invitationApi.getStats({
     *   startDate: '2024-01-01',
     *   endDate: '2024-12-31'
     * })
     * console.log(`总邀请: ${stats.totalInvitations}, 成功率: ${stats.successRate}%`)
     * ```
     */
    getStats: withInvitationRetry(async (params?: StatsQueryParams): Promise<InvitationStats> => {
      const response = await http.get<InvitationStats>('/invitation/stats', { params })
      return response
    }),

    /**
     * 导出邀请历史数据接口（导出操作不重试，避免重复导出）
     * 根据筛选条件导出邀请历史数据为Excel或CSV文件
     * 
     * @param {ExportHistoryParams} [params] - 可选的导出参数，包含筛选和格式设置
     * @returns {Promise<Blob>} 文件数据流，可用于下载
     * @throws {Error} 导出失败时抛出错误
     * @complexity O(n) - n为导出记录数量，涉及数据查询和文件生成
     * @flow 应用筛选条件 -> 查询历史数据 -> 生成导出文件 -> 返回文件流
     * 
     * @example
     * ```typescript
     * const fileBlob = await invitationApi.exportHistory({
     *   format: 'excel',
     *   startDate: '2024-01-01',
     *   endDate: '2024-12-31',
     *   status: 'success'
     * })
     * 
     * // 触发下载
     * const url = URL.createObjectURL(fileBlob)
     * const link = document.createElement('a')
     * link.href = url
     * link.download = 'invitation-history.xlsx'
     * link.click()
     * ```
     */
    exportHistory: async (params?: ExportHistoryParams): Promise<Blob> => {
      try {
        const response = await http.get('/invitation/export', {
          params,
          responseType: 'blob'
        })
        return response
      } catch (error) {
        console.error('[邀请API] 导出邀请历史失败:', error)
        throw error
      }
    },

    /**
     * 重新激活邀请码接口
     * 激活已停用的邀请码，使其重新可用
     * 
     * @param {string} codeId - 要激活的邀请码ID
     * @returns {Promise<InvitationCode>} 激活后的邀请码信息
     * @throws {Error} 激活失败时抛出错误（邀请码不存在、权限不足等）
     * @complexity O(1) - 单次数据库更新操作
     * @flow 验证邀请码存在 -> 检查操作权限 -> 更新状态 -> 返回更新后信息
     * 
     * @example
     * ```typescript
     * const reactivatedCode = await invitationApi.reactivateCode('code-123')
     * console.log(`邀请码已激活: ${reactivatedCode.code}`)
     * ```
     */
    reactivateCode: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.put<InvitationCode>(`/invitation/codes/${codeId}/reactivate`)
      return response
    }),

    /**
     * 停用邀请码接口
     * 停用指定的邀请码，使其暂时无法使用
     * 
     * @param {string} codeId - 要停用的邀请码ID
     * @returns {Promise<InvitationCode>} 停用后的邀请码信息
     * @throws {Error} 停用失败时抛出错误（邀请码不存在、权限不足等）
     * @complexity O(1) - 单次数据库更新操作
     * @flow 验证邀请码存在 -> 检查操作权限 -> 更新状态 -> 返回更新后信息
     * 
     * @example
     * ```typescript
     * const deactivatedCode = await invitationApi.deactivateCode('code-123')
     * console.log(`邀请码已停用: ${deactivatedCode.code}`)
     * ```
     */
    deactivateCode: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.put<InvitationCode>(`/invitation/codes/${codeId}/deactivate`)
      return response
    }),

    /**
     * 获取指定邀请码的详细信息接口
     * 查询单个邀请码的完整信息，包括使用情况、有效期等
     * 
     * @param {string} codeId - 邀请码的唯一标识符
     * @returns {Promise<InvitationCode>} 邀请码的详细信息
     * @throws {Error} 获取失败时抛出错误（邀请码不存在、权限不足等）
     * @complexity O(1) - 单次数据库主键查询
     * @flow 验证邀请码ID -> 权限检查 -> 查询详细信息 -> 返回结果
     * 
     * @example
     * ```typescript
     * const codeDetails = await invitationApi.getCodeDetails('code-123')
     * console.log(`邀请码: ${codeDetails.code}`)
     * console.log(`状态: ${codeDetails.status}`)
     * console.log(`剩余使用次数: ${codeDetails.remainingUses}`)
     * ```
     */
    getCodeDetails: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.get<InvitationCode>(`/invitation/codes/${codeId}`)
      return response
    }),

    /**
     * 获取邀请码的使用记录接口
     * 查询指定邀请码的所有使用历史记录，支持分页查询
     * 
     * @param {string} codeId - 邀请码ID
     * @param {Omit<HistoryQueryParams, 'role'>} [params] - 查询参数，排除role字段
     * @returns {Promise<PaginatedResponse<InvitationRecord>>} 分页的使用记录列表
     * @throws {Error} 查询失败时抛出错误
     * @complexity O(n) - n为该邀请码的使用记录数量
     * @flow 验证邀请码存在 -> 构建查询条件 -> 分页查询使用记录 -> 返回结果
     * 
     * @example
     * ```typescript
     * const usageHistory = await invitationApi.getCodeUsageHistory('code-123', {
     *   page: 1,
     *   pageSize: 10,
     *   startDate: '2024-01-01'
     * })
     * console.log(`该邀请码共被使用 ${usageHistory.total} 次`)
     * ```
     */
    getCodeUsageHistory: withInvitationRetry(async (
      codeId: string, 
      params?: Omit<HistoryQueryParams, 'role'>
    ): Promise<PaginatedResponse<InvitationRecord>> => {
      const response = await http.get<PaginatedResponse<InvitationRecord>>(
        `/invitation/codes/${codeId}/usage`, 
        { params }
      )
      return response
    }),

    /**
     * 批量获取邀请记录详情接口
     * 一次性获取多个邀请记录的详细信息，提高查询效率
     * 
     * @param {string[]} recordIds - 邀请记录ID数组
     * @returns {Promise<InvitationRecord[]>} 邀请记录详情列表
     * @throws {Error} 获取失败时抛出错误
     * @complexity O(n) - n为请求的记录数量，批量数据库查询
     * @flow 验证记录ID列表 -> 批量查询数据库 -> 组装记录信息 -> 返回结果列表
     * 
     * @example
     * ```typescript
     * const records = await invitationApi.getBatchRecords([
     *   'record-123', 'record-456', 'record-789'
     * ])
     * records.forEach(record => {
     *   console.log(`${record.inviterName} 邀请了 ${record.inviteeName}`)
     * })
     * ```
     */
    getBatchRecords: withInvitationRetry(async (recordIds: string[]): Promise<InvitationRecord[]> => {
      const response = await http.post<InvitationRecord[]>('/invitation/records/batch', { recordIds })
      return response
    })
  }
}

/**
 * 邀请系统 API 接口实例（带重试功能）
 * 主要的邀请API实例，所有业务代码应使用此实例进行邀请相关操作
 */
export const invitationApi = createRetryableInvitationApi()

// 导出默认对象以便解构使用
export default invitationApi

// 导出常用方法的别名，便于单独导入
export const validateCode = invitationApi.validateCode
export const getCodes = invitationApi.getCodes
export const generateCode = invitationApi.generateCode
export const getHistory = invitationApi.getHistory
export const getStats = invitationApi.getStats

/**
 * 邀请系统错误处理工具函数
 * 将后端返回的错误码转换为用户友好的中文错误信息
 * 
 * @param {any} error - 错误对象，可能来自axios或自定义错误
 * @returns {string} 用户友好的中文错误信息
 * @complexity O(1) - 基于错误码的直接映射查找
 * @flow 提取错误码 -> 查询映射表 -> 返回友好信息或默认消息
 * 
 * @example
 * ```typescript
 * try {
 *   await invitationApi.validateCode('invalid_code')
 * } catch (error) {
 *   const friendlyMessage = handleInvitationError(error)
 *   showErrorMessage(friendlyMessage) // "邀请码无效或不存在"
 * }
 * ```
 */
export const handleInvitationError = (error: any): string => {
  // 使用统一的错误处理工具
  const { handleApiError } = require('@/utils/errorCodeMapping')
  return handleApiError(error)
}

/**
 * 邀请链接生成工具函数
 * 根据邀请码和目标角色生成完整的邀请注册链接
 * 
 * @param {string} code - 邀请码字符串
 * @param {string} targetRole - 目标用户角色
 * @param {string} [baseUrl] - 可选的基础URL，默认使用当前域名
 * @returns {string} 完整的邀请链接URL
 * @complexity O(1) - 简单的字符串拼接操作
 * @flow 获取基础URL -> 拼接邀请参数 -> 返回完整链接
 * 
 * @example
 * ```typescript
 * const inviteLink = generateInvitationLink('INVITE123', 'sales')
 * console.log(inviteLink) // "https://example.com/login?invite=INVITE123&role=sales"
 * 
 * // 使用自定义域名
 * const customLink = generateInvitationLink('INVITE123', 'sales', 'https://custom.domain.com')
 * ```
 */
export const generateInvitationLink = (
  code: string, 
  targetRole: string, 
  baseUrl?: string
): string => {
  const base = baseUrl || window.location.origin
  return `${base}/login?invite=${code}&role=${targetRole}`
}

/**
 * 角色名称映射工具函数
 * 将英文角色代码转换为中文显示名称
 * 
 * @param {string} role - 英文角色代码（如 'director', 'leader', 'sales'）
 * @returns {string} 中文角色显示名称
 * @complexity O(1) - 哈希表查找操作
 * @flow 查询角色映射表 -> 返回中文名称或原值
 * 
 * @example
 * ```typescript
 * console.log(getRoleDisplayName('director')) // "销售总监"
 * console.log(getRoleDisplayName('leader'))   // "销售组长"
 * console.log(getRoleDisplayName('sales'))    // "销售"
 * console.log(getRoleDisplayName('unknown'))  // "unknown" (未知角色返回原值)
 * ```
 */
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'director': '销售总监',
    'leader': '销售组长', 
    'sales': '销售',
    'agent': '代理'
  }
  return roleMap[role] || role
}