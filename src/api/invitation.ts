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
 * 创建带重试功能的邀请API实例
 */
const createRetryableInvitationApi = () => {
  return {
    /**
     * 获取当前用户的邀请码列表
     * 根据用户角色返回对应数量的邀请码（总监3个，组长2个，销售1个）
     */
    getCodes: withInvitationRetry(async (): Promise<InvitationCode[]> => {
      const response = await http.get<InvitationCode[]>('/invitation/codes')
      return response
    }),

    /**
     * 生成新的邀请码（如果支持重新生成功能）
     * @param targetRole - 目标角色
     */
    generateCode: withInvitationRetry(async (targetRole: GenerateCodeRequest['targetRole']): Promise<GenerateCodeResponse> => {
      const response = await http.post<GenerateCodeResponse>('/invitation/codes', { targetRole })
      return response
    }),

    /**
     * 验证邀请码有效性（关键操作，使用自适应重试配置）
     * @param code - 邀请码
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
     * 获取邀请历史记录
     * @param params - 查询参数
     */
    getHistory: withInvitationRetry(async (params?: HistoryQueryParams): Promise<PaginatedResponse<InvitationRecord>> => {
      const response = await http.get<PaginatedResponse<InvitationRecord>>('/invitation/history', { params })
      return response
    }),

    /**
     * 获取邀请统计信息
     * @param params - 查询参数
     */
    getStats: withInvitationRetry(async (params?: StatsQueryParams): Promise<InvitationStats> => {
      const response = await http.get<InvitationStats>('/invitation/stats', { params })
      return response
    }),

    /**
     * 导出邀请历史数据（导出操作不重试，避免重复导出）
     * @param params - 导出参数
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
     * 重新激活邀请码
     * @param codeId - 邀请码ID
     */
    reactivateCode: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.put<InvitationCode>(`/invitation/codes/${codeId}/reactivate`)
      return response
    }),

    /**
     * 停用邀请码
     * @param codeId - 邀请码ID
     */
    deactivateCode: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.put<InvitationCode>(`/invitation/codes/${codeId}/deactivate`)
      return response
    }),

    /**
     * 获取指定邀请码的详细信息
     * @param codeId - 邀请码ID
     */
    getCodeDetails: withInvitationRetry(async (codeId: string): Promise<InvitationCode> => {
      const response = await http.get<InvitationCode>(`/invitation/codes/${codeId}`)
      return response
    }),

    /**
     * 获取邀请码的使用记录
     * @param codeId - 邀请码ID
     * @param params - 查询参数
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
     * 批量获取邀请记录详情
     * @param recordIds - 邀请记录ID数组
     */
    getBatchRecords: withInvitationRetry(async (recordIds: string[]): Promise<InvitationRecord[]> => {
      const response = await http.post<InvitationRecord[]>('/invitation/records/batch', { recordIds })
      return response
    })
  }
}

/**
 * 邀请系统 API 接口实例（带重试功能）
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
 * @param error - 错误对象
 * @returns 用户友好的错误信息
 */
export const handleInvitationError = (error: any): string => {
  const errorMap: Record<string, string> = {
    'INVITE_001': '邀请码无效或不存在',
    'INVITE_002': '邀请码已过期',
    'INVITE_003': '您的角色无法使用此邀请码',
    'INVITE_004': '不能使用自己的邀请码',
    'INVITE_005': '您没有邀请权限',
    'INVITE_006': '邀请码使用次数已达上限',
    'INVITE_007': '邀请码不存在',
    'INVITE_008': '此邀请码已被您使用过',
  }
  
  // 提取错误码
  const errorCode = error?.response?.data?.code || error?.code || error?.message
  
  // 如果有对应的错误映射，返回友好信息
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode]
  }
  
  // 返回默认错误信息
  return error?.response?.data?.message || error?.message || '操作失败，请重试'
}

/**
 * 邀请链接生成工具函数
 * @param code - 邀请码
 * @param targetRole - 目标角色
 * @param baseUrl - 基础URL（可选，默认使用当前域名）
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
 * @param role - 用户角色
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