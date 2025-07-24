import { http } from '@/utils/request'
import type {
  PromotionTask,
  AuditRequest,
  AuditHistory,
  AuditStats,
  AuditFilterParams,
  BatchAuditRequest,
  TaskSubmissionRequest,
  AgentTaskFilterParams,
  AgentTaskStats,
  URLRecognitionResult
} from '@/types/promotion'
import type { PaginatedResponse } from '@/types/api'

/**
 * 推广审核相关 API 接口
 */
export const promotionAuditApi = {
  /**
   * 获取审核任务列表
   * @param params - 筛选和分页参数
   */
  getAuditList: async (params: AuditFilterParams): Promise<PaginatedResponse<PromotionTask>> => {
    try {
      const response = await http.get<PaginatedResponse<PromotionTask>>('/promotion/audit/list', { params })
      return response
    } catch (error) {
      console.error('[推广审核API] 获取审核列表失败:', error)
      throw error
    }
  },

  /**
   * 获取任务详情
   * @param taskId - 任务ID
   */
  getTaskDetail: async (taskId: string): Promise<PromotionTask> => {
    try {
      const response = await http.get<PromotionTask>(`/promotion/audit/task/${taskId}`)
      return response
    } catch (error) {
      console.error('[推广审核API] 获取任务详情失败:', error)
      throw error
    }
  },

  /**
   * 执行审核操作
   * @param request - 审核请求数据
   */
  auditTask: async (request: AuditRequest): Promise<PromotionTask> => {
    try {
      const response = await http.post<PromotionTask>('/promotion/audit/execute', request)
      return response
    } catch (error) {
      console.error('[推广审核API] 执行审核操作失败:', error)
      throw error
    }
  },

  /**
   * 批量审核操作 (V2功能)
   * @param requests - 批量审核请求数据
   */
  batchAudit: async (requests: BatchAuditRequest): Promise<PromotionTask[]> => {
    try {
      const response = await http.post<PromotionTask[]>('/promotion/audit/batch', requests)
      return response
    } catch (error) {
      console.error('[推广审核API] 批量审核操作失败:', error)
      throw error
    }
  },

  /**
   * 获取审核历史记录
   * @param taskId - 任务ID
   */
  getAuditHistory: async (taskId: string): Promise<AuditHistory[]> => {
    try {
      const response = await http.get<AuditHistory[]>(`/promotion/audit/history/${taskId}`)
      return response
    } catch (error) {
      console.error('[推广审核API] 获取审核历史失败:', error)
      throw error
    }
  },

  /**
   * 获取审核统计数据
   * @param dateRange - 可选的时间范围筛选
   */
  getAuditStats: async (dateRange?: { startDate: string; endDate: string }): Promise<AuditStats> => {
    try {
      const response = await http.get<AuditStats>('/promotion/audit/stats', { 
        params: dateRange 
      })
      return response
    } catch (error) {
      console.error('[推广审核API] 获取审核统计失败:', error)
      throw error
    }
  },

  /**
   * 导出审核数据
   * @param params - 筛选参数
   */
  exportAuditData: async (params: AuditFilterParams): Promise<Blob> => {
    try {
      const response = await http.get('/promotion/audit/export', {
        params,
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('[推广审核API] 导出审核数据失败:', error)
      throw error
    }
  },

  /**
   * 获取当前用户可审核的任务统计
   */
  getMyAuditStats: async (): Promise<{
    pendingCount: number;
    todayAudited: number;
    thisWeekAudited: number;
  }> => {
    try {
      const response = await http.get<{
        pendingCount: number;
        todayAudited: number;
        thisWeekAudited: number;
      }>('/promotion/audit/my-stats')
      return response
    } catch (error) {
      console.error('[推广审核API] 获取个人审核统计失败:', error)
      throw error
    }
  },

  /**
   * 检查任务是否可以审核（权限和状态检查）
   * @param taskId - 任务ID
   */
  checkAuditPermission: async (taskId: string): Promise<{
    canAudit: boolean;
    reason?: string;
    taskStatus: string;
  }> => {
    try {
      const response = await http.get<{
        canAudit: boolean;
        reason?: string;
        taskStatus: string;
      }>(`/promotion/audit/check-permission/${taskId}`)
      return response
    } catch (error) {
      console.error('[推广审核API] 检查审核权限失败:', error)
      throw error
    }
  },

  // ==================== 代理任务提交相关API ====================

  /**
   * 代理提交推广任务
   * @param request - 任务提交请求数据
   */
  submitTask: async (request: TaskSubmissionRequest): Promise<PromotionTask> => {
    try {
      const response = await http.post<PromotionTask>('/promotion/task/submit', request)
      console.log('[推广任务API] 提交任务成功:', response.id)
      return response
    } catch (error) {
      console.error('[推广任务API] 提交任务失败:', error)
      throw error
    }
  },

  /**
   * 获取代理的任务列表
   * @param params - 筛选和分页参数
   */
  getAgentTaskList: async (params: AgentTaskFilterParams): Promise<PaginatedResponse<PromotionTask>> => {
    try {
      const response = await http.get<PaginatedResponse<PromotionTask>>('/promotion/task/agent-list', { params })
      console.log('[推广任务API] 获取代理任务列表成功:', response.list.length, '条')
      return response
    } catch (error) {
      console.error('[推广任务API] 获取代理任务列表失败:', error)
      throw error
    }
  },

  /**
   * 获取代理任务统计
   */
  getAgentTaskStats: async (): Promise<AgentTaskStats> => {
    try {
      const response = await http.get<AgentTaskStats>('/promotion/task/agent-stats')
      console.log('[推广任务API] 获取代理统计成功:', response)
      return response
    } catch (error) {
      console.error('[推广任务API] 获取代理统计失败:', error)
      throw error
    }
  },

  /**
   * 识别URL对应的平台
   * @param url - 要识别的URL
   */
  recognizePlatform: async (url: string): Promise<URLRecognitionResult> => {
    try {
      const response = await http.post<URLRecognitionResult>('/promotion/task/recognize-platform', { url })
      console.log('[推广任务API] 平台识别成功:', response.platform)
      return response
    } catch (error) {
      console.error('[推广任务API] 平台识别失败:', error)
      throw error
    }
  }
}

// 导出默认对象以便解构使用
export default promotionAuditApi

/**
 * 推广审核错误处理工具函数
 * @param error - 错误对象
 * @returns 用户友好的错误信息
 */
export const handlePromotionAuditError = (error: any): string => {
  const errorMap: Record<string, string> = {
    // 权限相关错误
    'AUDIT_001': '您没有审核权限',
    'AUDIT_002': '您只能审核指定范围内的任务',
    'AUDIT_003': '该任务已被其他审核员处理',
    'AUDIT_004': '该任务当前状态不允许审核',
    'AUDIT_005': '您无法审核自己提交的任务',

    // 数据验证错误
    'AUDIT_101': '审核意见不能为空',
    'AUDIT_102': '审核意见长度不能超过200字符',
    'AUDIT_103': '奖励金额必须大于0',
    'AUDIT_104': '奖励金额超出范围限制',
    'AUDIT_105': '任务ID格式不正确',

    // 业务逻辑错误
    'AUDIT_201': '任务不存在或已被删除',
    'AUDIT_202': '任务状态异常，无法执行审核',
    'AUDIT_203': '审核操作超时，请重新尝试',
    'AUDIT_204': '批量审核任务数量超出限制',
    'AUDIT_205': '审核历史记录获取失败',

    // 系统错误
    'AUDIT_301': '审核系统暂时不可用',
    'AUDIT_302': '数据导出功能暂时不可用',
    'AUDIT_303': '统计数据计算异常',
    'AUDIT_304': '审核记录保存失败',

    // 文件处理错误
    'AUDIT_401': '推广内容链接无效',
    'AUDIT_402': '推广内容预览生成失败',
    'AUDIT_403': '导出文件生成失败',
    'AUDIT_404': '文件大小超出限制'
  }

  // 提取错误码
  const errorCode = error?.response?.data?.code || error?.code || error?.message

  // 如果有对应的错误映射，返回友好信息
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode]
  }

  // 检查HTTP状态码
  const status = error?.response?.status
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未登录或登录已过期'
    case 403:
      return '没有权限访问此功能'
    case 404:
      return '请求的资源不存在'
    case 409:
      return '数据冲突，请刷新后重试'
    case 422:
      return '数据验证失败'
    case 429:
      return '操作过于频繁，请稍后重试'
    case 500:
      return '服务器内部错误，请稍后重试'
    case 502:
      return '服务暂时不可用'
    case 503:
      return '服务维护中，请稍后重试'
    default:
      return error?.response?.data?.message || error?.message || '操作失败，请重试'
  }
}

/**
 * 审核操作验证函数
 * @param request - 审核请求
 * @returns 验证结果
 */
export const validateAuditRequest = (request: AuditRequest): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = []

  // 检查任务ID
  if (!request.taskId || request.taskId.trim().length === 0) {
    errors.push('任务ID不能为空')
  }

  // 检查审核动作
  if (!request.action || !['approve', 'reject'].includes(request.action)) {
    errors.push('审核动作必须是通过或拒绝')
  }

  // 拒绝时必须填写审核意见
  if (request.action === 'reject') {
    if (!request.comment || request.comment.trim().length === 0) {
      errors.push('拒绝时必须填写审核意见')
    } else if (request.comment.length > 200) {
      errors.push('审核意见长度不能超过200字符')
    }
  }

  // 通过时检查奖励金额
  if (request.action === 'approve' && request.rewardAmount !== undefined) {
    if (request.rewardAmount <= 0) {
      errors.push('奖励金额必须大于0')
    } else if (request.rewardAmount > 100) { // 假设最大奖励100元
      errors.push('奖励金额不能超过100元')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 格式化审核状态显示
 * @param status - 审核状态
 * @returns 格式化的状态信息
 */
export const formatAuditStatus = (status: string): {
  text: string;
  color: string;
  icon?: string;
} => {
  const statusMap: Record<string, { text: string; color: string; icon?: string }> = {
    'PENDING_MACHINE_AUDIT': {
      text: '待机审',
      color: 'blue',
      icon: 'robot'
    },
    'PENDING_MANUAL_AUDIT': {
      text: '待人工审核',
      color: 'orange',
      icon: 'clock'
    },
    'APPROVED': {
      text: '已通过',
      color: 'green',
      icon: 'check'
    },
    'REJECTED': {
      text: '已拒绝',
      color: 'red',
      icon: 'x'
    }
  }

  return statusMap[status] || {
    text: '未知状态',
    color: 'gray',
    icon: 'question'
  }
}

/**
 * 审核操作权限检查
 * @param userRole - 用户角色
 * @param operation - 操作类型
 * @returns 是否有权限
 */
export const checkAuditOperationPermission = (
  userRole: string,
  operation: 'view' | 'audit' | 'export' | 'stats'
): boolean => {
  const permissions: Record<string, string[]> = {
    view: ['super_admin', 'director', 'leader'],
    audit: ['super_admin', 'director', 'leader'],
    export: ['super_admin', 'director'],
    stats: ['super_admin', 'director', 'leader']
  }

  return permissions[operation]?.includes(userRole) || false
}

/**
 * 统一的推广任务API导出
 * 包含审核相关和代理任务相关的所有API方法
 */
export const promotionTaskApi = {
  // 继承所有审核相关API
  ...promotionAuditApi,

  // 为了保持向后兼容，也可以通过别名访问代理任务API
  agent: {
    submitTask: promotionAuditApi.submitTask,
    getTaskList: promotionAuditApi.getAgentTaskList,
    getStats: promotionAuditApi.getAgentTaskStats,
    recognizePlatform: promotionAuditApi.recognizePlatform
  }
}