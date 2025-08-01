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
 * 推广审核系统相关 API 接口模块
 * 提供完整的推广任务管理、审核流程和代理任务提交功能
 * 包含审核权限控制、批量操作、数据统计和错误处理
 * 
 * @namespace promotionAuditApi
 */
export const promotionAuditApi = {
  /**
   * 获取审核任务列表接口
   * 支持多维度筛选和分页查询，用于审核员查看待处理任务
   * 
   * @param {AuditFilterParams} params - 筛选和分页参数，包含状态、时间范围、关键词等
   * @returns {Promise<PaginatedResponse<PromotionTask>>} 分页的审核任务列表
   * @throws {Error} 查询失败时抛出错误（权限不足、参数错误等）
   * @complexity O(n) - n为查询结果数量，涉及数据库查询和权限过滤
   * @flow 验证审核权限 -> 构建查询条件 -> 应用权限过滤 -> 分页查询 -> 返回结果
   * 
   * @example
   * ```typescript
   * const auditList = await promotionAuditApi.getAuditList({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'PENDING_MANUAL_AUDIT',
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   keyword: '推广内容关键词'
   * })
   * console.log(`共 ${auditList.total} 个待审核任务`)
   * ```
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
   * 获取任务详情接口
   * 获取指定推广任务的完整信息，包括提交内容、审核历史等
   * 
   * @param {string} taskId - 任务的唯一标识符
   * @returns {Promise<PromotionTask>} 任务的详细信息对象
   * @throws {Error} 获取失败时抛出错误（任务不存在、权限不足等）
   * @complexity O(1) - 单次数据库主键查询加关联数据获取
   * @flow 验证任务权限 -> 查询任务基础信息 -> 关联审核历史 -> 返回完整信息
   * 
   * @example
   * ```typescript
   * const taskDetail = await promotionAuditApi.getTaskDetail('task-123')
   * console.log(`任务标题: ${taskDetail.title}`)
   * console.log(`提交时间: ${taskDetail.submittedAt}`)
   * console.log(`当前状态: ${taskDetail.auditStatus}`)
   * ```
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
   * 执行审核操作接口
   * 对指定任务执行通过或拒绝的审核操作，支持审核意见和奖励设置
   * 
   * @param {AuditRequest} request - 审核请求数据，包含任务ID、审核动作、意见等
   * @returns {Promise<PromotionTask>} 审核后的任务信息
   * @throws {Error} 审核失败时抛出错误（权限不足、状态冲突、数据验证失败等）
   * @complexity O(1) - 单次审核操作加状态更新
   * @flow 验证审核权限 -> 检查任务状态 -> 执行审核逻辑 -> 更新任务状态 -> 记录审核历史
   * 
   * @example
   * ```typescript
   * // 通过审核并设置奖励
   * const approvedTask = await promotionAuditApi.auditTask({
   *   taskId: 'task-123',
   *   action: 'approve',
   *   comment: '内容符合规范，质量良好',
   *   rewardAmount: 50
   * })
   * 
   * // 拒绝审核
   * const rejectedTask = await promotionAuditApi.auditTask({
   *   taskId: 'task-456',
   *   action: 'reject',
   *   comment: '推广内容不符合平台规范'
   * })
   * ```
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
   * 批量审核操作接口（V2功能）
   * 同时对多个任务执行审核操作，提高审核效率
   * 
   * @param {BatchAuditRequest} requests - 批量审核请求数据，包含多个任务的审核信息
   * @returns {Promise<PromotionTask[]>} 批量审核后的任务列表
   * @throws {Error} 批量审核失败时抛出错误（部分任务失败、权限不足等）
   * @complexity O(n) - n为批量审核的任务数量，串行或并行处理
   * @flow 验证批量权限 -> 逐个验证任务状态 -> 批量执行审核 -> 记录操作日志 -> 返回结果
   * 
   * @example
   * ```typescript
   * const batchResult = await promotionAuditApi.batchAudit({
   *   tasks: [
   *     { taskId: 'task-123', action: 'approve', rewardAmount: 30 },
   *     { taskId: 'task-456', action: 'reject', comment: '不符合规范' }
   *   ],
   *   batchComment: '批量审核操作'
   * })
   * console.log(`批量审核完成，处理 ${batchResult.length} 个任务`)
   * ```
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
   * 获取审核历史记录接口
   * 查询指定任务的完整审核历史，包括所有审核节点和操作记录
   * 
   * @param {string} taskId - 任务ID
   * @returns {Promise<AuditHistory[]>} 审核历史记录列表，按时间倒序排列
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(n) - n为该任务的审核历史记录数量
   * @flow 验证任务存在 -> 查询审核历史 -> 关联审核员信息 -> 按时间排序 -> 返回记录
   * 
   * @example
   * ```typescript
   * const auditHistory = await promotionAuditApi.getAuditHistory('task-123')
   * auditHistory.forEach(record => {
   *   console.log(`${record.auditorName} 在 ${record.auditTime} 执行了 ${record.action}`)
   *   if (record.comment) console.log(`审核意见: ${record.comment}`)
   * })
   * ```
   */
  getAuditHistory: async (taskId: string): Promise<AuditHistory[]> => {
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[推广审核API] 使用模拟数据获取审核历史，taskId:', taskId)

      // 导入模拟数据生成函数
      const { generateMockAuditHistory } = await import('@/mock/promotionData')
      const mockHistory = generateMockAuditHistory(taskId)

      console.log('[推广审核API] 生成审核历史记录:', mockHistory.length, '条')
      return mockHistory

      // 如果需要真实API，取消注释下面的代码
      // const response = await http.get<AuditHistory[]>(`/promotion/audit/history/${taskId}`)
      // return response

    } catch (error) {
      console.error('[推广审核API] 获取审核历史失败:', error)
      throw error
    }
  },

  /**
   * 获取审核统计数据接口
   * 获取指定时间范围内的审核统计信息，用于数据分析和报表展示
   * 
   * @param {Object} [dateRange] - 可选的时间范围筛选
   * @param {string} dateRange.startDate - 开始日期（YYYY-MM-DD格式）
   * @param {string} dateRange.endDate - 结束日期（YYYY-MM-DD格式）
   * @returns {Promise<AuditStats>} 审核统计数据对象
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(n) - n为统计时间范围内的审核记录数量
   * @flow 构建时间查询条件 -> 聚合统计计算 -> 生成统计指标 -> 返回统计结果
   * 
   * @example
   * ```typescript
   * const stats = await promotionAuditApi.getAuditStats({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * })
   * console.log(`总审核数: ${stats.totalAudited}`)
   * console.log(`通过率: ${stats.approvalRate}%`)
   * console.log(`平均审核时长: ${stats.avgAuditTime}小时`)
   * ```
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
   * 导出审核数据接口
   * 根据筛选条件导出审核数据为Excel文件，便于离线分析
   * 
   * @param {AuditFilterParams} params - 筛选参数，决定导出数据的范围
   * @returns {Promise<Blob>} Excel文件数据流，可用于下载
   * @throws {Error} 导出失败时抛出错误
   * @complexity O(n) - n为导出数据的记录数量
   * @flow 应用筛选条件 -> 查询符合条件的数据 -> 生成Excel文件 -> 返回文件流
   * 
   * @example
   * ```typescript
   * const fileBlob = await promotionAuditApi.exportAuditData({
   *   status: 'APPROVED',
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * })
   * 
   * // 触发文件下载
   * const url = URL.createObjectURL(fileBlob)
   * const link = document.createElement('a')
   * link.href = url
   * link.download = 'audit-data.xlsx'
   * link.click()
   * ```
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
   * 获取当前用户可审核的任务统计接口
   * 获取当前登录用户的个人审核工作统计信息
   * 
   * @returns {Promise<Object>} 个人审核统计数据
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 基于用户ID的统计查询
   * @flow 获取当前用户信息 -> 查询个人相关任务 -> 计算统计指标 -> 返回统计结果
   * 
   * @example
   * ```typescript
   * const myStats = await promotionAuditApi.getMyAuditStats()
   * console.log(`待审核任务: ${myStats.pendingCount}`)
   * console.log(`今日已审核: ${myStats.todayAudited}`)
   * console.log(`本周已审核: ${myStats.thisWeekAudited}`)
   * ```
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
   * 检查任务是否可以审核接口（权限和状态检查）
   * 在执行审核操作前进行预检查，避免无效操作
   * 
   * @param {string} taskId - 要检查的任务ID
   * @returns {Promise<Object>} 检查结果，包含是否可审核、原因和任务状态
   * @throws {Error} 检查失败时抛出错误
   * @complexity O(1) - 单次权限和状态检查
   * @flow 查询任务信息 -> 检查用户权限 -> 验证任务状态 -> 返回检查结果
   * 
   * @example
   * ```typescript
   * const checkResult = await promotionAuditApi.checkAuditPermission('task-123')
   * if (checkResult.canAudit) {
   *   console.log('可以执行审核操作')
   * } else {
   *   console.log(`无法审核，原因: ${checkResult.reason}`)
   * }
   * console.log(`任务状态: ${checkResult.taskStatus}`)
   * ```
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
   * 代理提交推广任务接口
   * 代理用户提交新的推广任务等待审核
   * 
   * @param {TaskSubmissionRequest} request - 任务提交请求数据，包含推广内容、平台等信息
   * @returns {Promise<PromotionTask>} 提交成功的任务信息
   * @throws {Error} 提交失败时抛出错误（数据验证失败、权限不足、重复提交等）
   * @complexity O(1) - 单次任务创建和数据验证
   * @flow 验证提交权限 -> 数据验证 -> 重复检查 -> 创建任务记录 -> 触发审核流程
   * 
   * @example
   * ```typescript
   * const newTask = await promotionAuditApi.submitTask({
   *   title: '产品推广活动',
   *   description: '新产品发布推广',
   *   platform: 'weibo',
   *   contentUrl: 'https://weibo.com/post/123',
   *   tags: ['产品推广', '新品发布'],
   *   expectedReward: 80
   * })
   * console.log(`任务提交成功，ID: ${newTask.id}`)
   * ```
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
   * 获取代理的任务列表接口
   * 代理用户查看自己提交的所有推广任务
   * 
   * @param {AgentTaskFilterParams} params - 筛选和分页参数
   * @returns {Promise<PaginatedResponse<PromotionTask>>} 分页的代理任务列表
   * @throws {Error} 查询失败时抛出错误
   * @complexity O(n) - n为代理的任务数量
   * @flow 验证代理权限 -> 构建用户筛选条件 -> 查询任务列表 -> 分页处理 -> 返回结果
   * 
   * @example
   * ```typescript
   * const myTasks = await promotionAuditApi.getAgentTaskList({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'PENDING_MANUAL_AUDIT',
   *   platform: 'weibo'
   * })
   * console.log(`我提交了 ${myTasks.total} 个任务`)
   * ```
   */
  getAgentTaskList: async (params: AgentTaskFilterParams): Promise<PaginatedResponse<PromotionTask>> => {
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[推广任务API] 使用模拟数据获取代理任务列表，参数:', params)

      // 导入模拟数据生成函数
      const { generateMockAgentTaskList } = await import('@/mock/promotionData')
      const mockResponse = generateMockAgentTaskList(params)

      console.log('[推广任务API] 生成代理任务列表成功:', mockResponse.list.length, '条')
      return mockResponse

      // 如果需要真实API，取消注释下面的代码
      // const response = await http.get<PaginatedResponse<PromotionTask>>('/promotion/task/agent-list', { params })
      // console.log('[推广任务API] 获取代理任务列表成功:', response.list.length, '条')
      // return response

    } catch (error) {
      console.error('[推广任务API] 获取代理任务列表失败:', error)
      throw error
    }
  },

  /**
   * 获取代理任务统计接口
   * 获取代理用户的任务提交和审核统计信息
   * 
   * @returns {Promise<AgentTaskStats>} 代理任务统计数据
   * @throws {Error} 获取失败时抛出错误
   * @complexity O(1) - 基于代理用户的统计查询
   * @flow 获取当前代理信息 -> 查询任务统计 -> 计算各状态数量 -> 返回统计结果
   * 
   * @example
   * ```typescript
   * const agentStats = await promotionAuditApi.getAgentTaskStats()
   * console.log(`总提交任务: ${agentStats.totalSubmitted}`)
   * console.log(`已通过任务: ${agentStats.approved}`)
   * console.log(`待审核任务: ${agentStats.pending}`)
   * console.log(`总奖励金额: ${agentStats.totalReward}`)
   * ```
   */
  getAgentTaskStats: async (): Promise<AgentTaskStats> => {
    try {
      // 临时使用模拟数据，避免API 404错误
      console.log('[推广任务API] 使用模拟数据获取代理统计')

      // 导入模拟数据生成函数
      const { generateMockAgentTaskStats } = await import('@/mock/promotionData')
      const mockStats = generateMockAgentTaskStats()

      console.log('[推广任务API] 生成代理统计成功:', mockStats)
      return mockStats

      // 如果需要真实API，取消注释下面的代码
      // const response = await http.get<AgentTaskStats>('/promotion/task/agent-stats')
      // console.log('[推广任务API] 获取代理统计成功:', response)
      // return response

    } catch (error) {
      console.error('[推广任务API] 获取代理统计失败:', error)
      throw error
    }
  },

  /**
   * 识别URL对应的平台接口
   * 智能识别推广链接所属的平台类型，辅助任务分类
   * 
   * @param {string} url - 要识别的URL链接
   * @returns {Promise<URLRecognitionResult>} 平台识别结果
   * @throws {Error} 识别失败时抛出错误
   * @complexity O(1) - URL模式匹配和平台识别
   * @flow URL格式验证 -> 平台模式匹配 -> 内容预览提取 -> 返回识别结果
   * 
   * @example
   * ```typescript
   * const recognition = await promotionAuditApi.recognizePlatform('https://weibo.com/u/123456789/post/abc')
   * console.log(`识别平台: ${recognition.platform}`) // "weibo"
   * console.log(`平台名称: ${recognition.platformName}`) // "微博"
   * if (recognition.contentPreview) {
   *   console.log(`内容预览: ${recognition.contentPreview}`)
   * }
   * ```
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
 * 将后端返回的错误码转换为用户友好的中文错误信息
 * 
 * @param {any} error - 错误对象，可能来自axios或自定义错误
 * @returns {string} 用户友好的中文错误信息
 * @complexity O(1) - 基于错误码的直接映射查找
 * @flow 提取错误码 -> 查询错误映射表 -> 检查HTTP状态码 -> 返回友好信息
 * 
 * @example
 * ```typescript
 * try {
 *   await promotionAuditApi.auditTask(invalidRequest)
 * } catch (error) {
 *   const friendlyMessage = handlePromotionAuditError(error)
 *   showErrorNotification(friendlyMessage) // "您没有审核权限"
 * }
 * ```
 */
export const handlePromotionAuditError = (error: any): string => {
  // 使用统一的错误处理工具
  const { handleApiError } = require('@/utils/errorCodeMapping')
  return handleApiError(error)
}

/**
 * 审核操作验证函数
 * 在提交审核请求前验证数据的完整性和有效性
 * 
 * @param {AuditRequest} request - 审核请求对象
 * @returns {Object} 验证结果，包含是否有效和错误列表
 * @complexity O(1) - 固定的验证规则检查
 * @flow 检查必填字段 -> 验证数据格式 -> 业务规则检查 -> 返回验证结果
 * 
 * @example
 * ```typescript
 * const auditRequest = {
 *   taskId: 'task-123',
 *   action: 'approve',
 *   rewardAmount: 50
 * }
 * 
 * const validation = validateAuditRequest(auditRequest)
 * if (!validation.isValid) {
 *   console.error('验证失败:', validation.errors.join(', '))
 * } else {
 *   // 执行审核操作
 *   await promotionAuditApi.auditTask(auditRequest)
 * }
 * ```
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
 * 格式化审核状态显示工具函数
 * 将审核状态代码转换为用户友好的显示信息，包含文本、颜色和图标
 * 
 * @param {string} status - 审核状态代码
 * @returns {Object} 格式化的状态信息，包含显示文本、颜色和图标
 * @complexity O(1) - 哈希表查找操作
 * @flow 查询状态映射表 -> 返回格式化信息或默认值
 * 
 * @example
 * ```typescript
 * const statusInfo = formatAuditStatus('PENDING_MANUAL_AUDIT')
 * console.log(statusInfo.text)  // "待人工审核"
 * console.log(statusInfo.color) // "orange"
 * console.log(statusInfo.icon)  // "clock"
 * 
 * // 在UI中使用
 * const StatusBadge = ({ status }) => {
 *   const { text, color, icon } = formatAuditStatus(status)
 *   return <Badge color={color} icon={icon}>{text}</Badge>
 * }
 * ```
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
 * 审核操作权限检查工具函数
 * 根据用户角色检查是否有权限执行特定的审核操作
 * 
 * @param {string} userRole - 用户角色代码
 * @param {'view' | 'audit' | 'export' | 'stats'} operation - 操作类型
 * @returns {boolean} 是否有权限执行该操作
 * @complexity O(1) - 权限表查找操作
 * @flow 查询权限配置表 -> 检查角色权限 -> 返回权限结果
 * 
 * @example
 * ```typescript
 * const userRole = 'leader' // 销售组长
 * 
 * const canView = checkAuditOperationPermission(userRole, 'view')     // true
 * const canAudit = checkAuditOperationPermission(userRole, 'audit')   // true  
 * const canExport = checkAuditOperationPermission(userRole, 'export') // false
 * const canStats = checkAuditOperationPermission(userRole, 'stats')   // true
 * 
 * // 在组件中使用
 * if (checkAuditOperationPermission(currentUser.role, 'audit')) {
 *   showAuditButton()
 * }
 * ```
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
 * 统一的推广任务API导出对象
 * 包含审核相关和代理任务相关的所有API方法，提供统一访问入口
 * 
 * @namespace promotionTaskApi
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