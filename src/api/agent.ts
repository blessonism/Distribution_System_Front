import { http } from '@/utils/request';
import type { Agent, AgentQueryParams, CreateAgentParams, UpdateAgentParams, AgentPerformance, AgentPerformanceQueryParams } from '@/types/agent';

/**
 * 代理列表响应接口
 * @interface AgentListResponse
 */
interface AgentListResponse {
  data: Agent[];
  total: number;
}

/**
 * 代理管理相关 API 接口模块
 * 提供完整的代理CRUD操作，包括业绩查询、批量操作和数据导出
 * 
 * @namespace agentApi
 */
export const agentApi = {
  /**
   * 获取代理列表接口
   * 支持分页查询、搜索筛选和排序功能，获取代理基本信息列表
   * 
   * @param {AgentQueryParams} params - 查询参数，包含分页、筛选、排序等条件
   * @returns {Promise<AgentListResponse>} 代理列表响应，包含代理数据和总数
   * @throws {Error} 查询失败时抛出错误
   * @complexity O(n) - n为查询结果数量，涉及数据库查询和分页计算
   * @flow 构建查询条件 -> 数据库查询 -> 应用筛选和排序 -> 分页处理 -> 返回结果
   * 
   * @example
   * ```typescript
   * const agentList = await agentApi.getAgentList({
   *   page: 1,
   *   pageSize: 20,
   *   keyword: 'agent',
   *   status: 'active',
   *   level: 'premium',
   *   sortBy: 'performance',
   *   sortOrder: 'desc'
   * })
   * console.log(`共找到 ${agentList.total} 个代理`)
   * ```
   */
  getAgentList: (params: AgentQueryParams): Promise<AgentListResponse> => {
    return http.get('/agents', { params });
  },

  /**
   * 获取单个代理详情接口
   * 根据代理ID获取完整的代理信息，包括基本信息、联系方式、层级关系等
   * 
   * @param {string} id - 代理唯一标识符
   * @returns {Promise<Agent>} 代理详细信息对象
   * @throws {Error} 代理不存在或获取失败时抛出错误
   * @complexity O(1) - 单次数据库主键查询
   * @flow 验证代理ID -> 数据库查询 -> 关联数据获取 -> 返回代理信息
   * 
   * @example
   * ```typescript
   * const agent = await agentApi.getAgent('agent-123')
   * console.log(`代理名称: ${agent.name}, 等级: ${agent.level}`)
   * ```
   */
  getAgent: (id: string): Promise<Agent> => {
    return http.get(`/agents/${id}`);
  },

  /**
   * 获取代理业绩数据接口
   * 获取指定代理的业绩统计信息，支持趋势数据和时间范围查询
   * 
   * @param {string} id - 代理ID
   * @param {AgentPerformanceQueryParams} [params] - 可选的业绩查询参数，包含时间范围和趋势设置
   * @returns {Promise<AgentPerformance>} 代理业绩数据，包含统计信息和可选的趋势数据
   * @throws {Error} 获取失败时抛出错误（代理不存在、数据计算失败等）
   * @complexity O(n) - n为查询时间范围内的记录数量，涉及聚合计算
   * @flow 验证代理存在 -> 构建时间查询条件 -> 聚合计算业绩 -> 生成趋势数据 -> 返回结果
   * 
   * @example
   * ```typescript
   * const performance = await agentApi.getAgentPerformance('agent-123', {
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   includeTrend: true,
   *   granularity: 'month'
   * })
   * console.log(`总业绩: ${performance.totalRevenue}，趋势: ${performance.trendData?.length} 个数据点`)
   * ```
   */
  getAgentPerformance: async (id: string, params?: AgentPerformanceQueryParams): Promise<AgentPerformance> => {
    console.log('[API] 调用获取业绩数据:', id, params);
    const response = await http.get(`/agents/${id}/performance`, { params })
    console.log('[API] 获取到的原始业绩数据:', response);

    // 确保response中有trendData
    if (!response.trendData && params?.includeTrend) {
      console.error('[API] 响应缺少trendData属性!');
    }

    return response;
  },

  /**
   * 创建代理接口
   * 创建新的代理账户，包含代理信息验证和层级关系设置
   * 
   * @param {CreateAgentParams} data - 新代理数据，包含名称、联系方式、层级等信息
   * @returns {Promise<Agent>} 创建成功的代理信息
   * @throws {Error} 创建失败时抛出错误（数据验证失败、代理名称重复等）
   * @complexity O(1) - 单次数据库插入加唯一性检查
   * @flow 数据验证 -> 唯一性检查 -> 层级关系设置 -> 数据库插入 -> 返回代理信息
   * 
   * @example
   * ```typescript
   * const newAgent = await agentApi.createAgent({
   *   name: '新代理',
   *   email: 'agent@example.com',
   *   phone: '13800138000',
   *   level: 'standard',
   *   parentAgentId: 'parent-123'
   * })
   * console.log(`代理创建成功: ${newAgent.id}`)
   * ```
   */
  createAgent: (data: CreateAgentParams): Promise<Agent> => {
    return http.post('/agents', data);
  },

  /**
   * 更新代理接口
   * 更新指定代理的信息，支持部分字段更新，包括层级调整
   * 
   * @param {string} id - 要更新的代理ID
   * @param {UpdateAgentParams} data - 更新数据，只需包含要修改的字段
   * @returns {Promise<Agent>} 更新后的代理信息
   * @throws {Error} 更新失败时抛出错误（代理不存在、数据验证失败、权限不足等）
   * @complexity O(1) - 单次数据库更新操作
   * @flow 验证代理存在 -> 数据验证 -> 权限检查 -> 层级关系更新 -> 数据库更新 -> 返回更新结果
   * 
   * @example
   * ```typescript
   * const updatedAgent = await agentApi.updateAgent('agent-123', {
   *   name: '更新后的代理名',
   *   level: 'premium',
   *   status: 'active'
   * })
   * console.log(`代理信息已更新: ${updatedAgent.name}`)
   * ```
   */
  updateAgent: (id: string, data: UpdateAgentParams): Promise<Agent> => {
    return http.put(`/agents/${id}`, data);
  },

  /**
   * 删除代理接口
   * 软删除指定代理，保留数据但标记为已删除状态，同时处理下级代理关系
   * 
   * @param {string} id - 要删除的代理ID
   * @returns {Promise<void>} 删除操作无返回值
   * @throws {Error} 删除失败时抛出错误（代理不存在、有下级代理、权限不足等）
   * @complexity O(n) - n为下级代理数量，需要处理层级关系调整
   * @flow 验证代理存在 -> 检查下级代理 -> 处理层级关系 -> 软删除操作 -> 清理相关数据
   * 
   * @example
   * ```typescript
   * await agentApi.deleteAgent('agent-123')
   * console.log('代理已删除')
   * ```
   */
  deleteAgent: (id: string): Promise<void> => {
    return http.delete(`/agents/${id}`);
  },

  /**
   * 批量删除代理接口
   * 同时软删除多个代理，提高批量操作效率，处理复杂的层级关系调整
   * 
   * @param {string[]} ids - 要删除的代理ID数组
   * @returns {Promise<void>} 批量删除操作无返回值
   * @throws {Error} 删除失败时抛出错误（部分代理不存在、层级冲突、权限不足等）
   * @complexity O(n*m) - n为代理数量，m为平均下级代理数量，复杂的层级关系处理
   * @flow 验证代理ID列表 -> 分析层级依赖 -> 批量权限检查 -> 处理层级重组 -> 批量软删除
   * 
   * @example
   * ```typescript
   * await agentApi.batchDeleteAgents(['agent-123', 'agent-456', 'agent-789'])
   * console.log('批量删除完成')
   * ```
   */
  batchDeleteAgents: (ids: string[]): Promise<void> => {
    return http.post('/agents/batch-delete', { ids });
  },

  /**
   * 导出代理数据接口
   * 根据筛选条件导出代理数据为Excel文件，包含完整的代理信息和业绩统计
   * 
   * @param {Partial<AgentQueryParams>} params - 导出筛选条件，可选的查询参数
   * @returns {Promise<Blob>} Excel文件数据流，可用于下载
   * @throws {Error} 导出失败时抛出错误（查询失败、文件生成失败等）
   * @complexity O(n) - n为导出代理数量，涉及数据查询和Excel文件生成
   * @flow 应用筛选条件 -> 查询代理数据 -> 关联业绩信息 -> 生成Excel文件 -> 返回文件流
   * 
   * @example
   * ```typescript
   * const fileBlob = await agentApi.exportAgents({
   *   status: 'active',
   *   level: 'premium',
   *   createTimeStart: '2024-01-01',
   *   createTimeEnd: '2024-12-31'
   * })
   * 
   * // 创建下载链接
   * const url = URL.createObjectURL(fileBlob)
   * const link = document.createElement('a')
   * link.href = url
   * link.download = 'agents.xlsx'
   * link.click()
   * ```
   */
  exportAgents: (params: Partial<AgentQueryParams>): Promise<Blob> => {
    return http.get('/agents/export', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });
  }
}; 