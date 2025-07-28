/**
 * @fileoverview 代理管理状态管理Store
 * 基于Pinia的代理管理系统状态存储，提供完整的代理生命周期管理和缓存机制
 * 包含代理CRUD操作、业绩数据管理、高级筛选、分页控制、批量操作和智能缓存优化等核心功能
 * 集成多层缓存策略、选择管理、状态同步和错误处理机制，为代理管理提供统一的数据层
 * 
 * @module store/agent
 * @author Frontend Team
 * @since 1.0.0
 */

import { defineStore } from 'pinia'
import { agentApi } from '@/api/agent'
import type { Agent, AgentQueryParams, CreateAgentParams, UpdateAgentParams, AgentPerformance, AgentStatus, AgentCategory, AgentLevel, AgentPerformanceQueryParams } from '@/types/agent'

/**
 * 代理列表状态接口
 * 定义代理列表管理的完整状态结构，包含筛选条件、分页信息和选择状态
 * 
 * @interface AgentListState
 */
export interface AgentListState {
  filters: {
    keyword: string;
    status: string;
    category: string;
    level: string;
    isAdded: boolean;
    isPosting: boolean;
    isIntercept: boolean;
    isAttracting: boolean;
    isInGroup: boolean;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  selectedAgents: string[];  // 选中的代理ID列表
}

/**
 * 缓存项接口
 * 定义缓存数据的结构，包含数据和过期时间
 * 
 * @interface CacheItem
 * @template T - 缓存数据的类型
 */
interface CacheItem<T> {
  data: T;
  expireAt: number;
}

/**
 * 代理缓存管理类
 * 提供代理详情和业绩数据的智能缓存机制，支持TTL过期和精细化缓存控制
 * 
 * @class AgentCache
 * @example
 * ```typescript
 * const cache = new AgentCache()
 * 
 * // 设置代理详情缓存
 * cache.setAgentDetail('agent123', agentData)
 * 
 * // 获取缓存数据
 * const cached = cache.getAgentDetail('agent123')
 * 
 * // 清除指定代理缓存
 * cache.clearAgentCache('agent123')
 * ```
 */
class AgentCache {
  private detailCache: Map<string, CacheItem<Agent>> = new Map();
  private performanceCache: Map<string, CacheItem<AgentPerformance>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 缓存有效期：5分钟
  
  /**
   * 获取代理详情缓存
   * 从缓存中获取指定代理的详情数据，检查过期时间
   * 
   * @complexity O(1) - 哈希表查找，常数时间复杂度
   * @flow 缓存查找 → 过期检查 → 数据返回或null
   * 
   * @param {string} id - 代理ID
   * @returns {Agent | null} 缓存的代理数据或null
   * 
   * @example
   * ```typescript
   * const cached = cache.getAgentDetail('agent123')
   * if (cached) {
   *   console.log('使用缓存数据')
   * } else {
   *   console.log('缓存不存在或已过期')
   * }
   * ```
   */
  getAgentDetail(id: string): Agent | null {
    const cachedItem = this.detailCache.get(id);
    if (cachedItem && Date.now() < cachedItem.expireAt) {
      console.log(`[Cache] 使用代理详情缓存: ${id}`);
      return cachedItem.data;
    }
    return null;
  }
  
  /**
   * 设置代理详情缓存
   * 将代理详情数据存储到缓存中，并设置过期时间
   * 
   * @complexity O(1) - 哈希表插入，常数时间复杂度
   * @flow 过期时间计算 → 缓存数据构建 → 缓存存储 → 日志记录
   * 
   * @param {string} id - 代理ID
   * @param {Agent} data - 要缓存的代理数据
   * 
   * @example
   * ```typescript
   * cache.setAgentDetail('agent123', {
   *   id: 'agent123',
   *   name: '张三',
   *   status: 'ACTIVE'
   * })
   * ```
   */
  setAgentDetail(id: string, data: Agent): void {
    console.log(`[Cache] 设置代理详情缓存: ${id}`);
    this.detailCache.set(id, {
      data,
      expireAt: Date.now() + this.CACHE_TTL
    });
  }
  
  /**
   * 获取业绩数据缓存
   * 从缓存中获取指定代理和时间周期的业绩数据
   * 
   * @complexity O(1) - 哈希表查找，常数时间复杂度
   * @flow 缓存键构建 → 缓存查找 → 过期检查 → 数据返回或null
   * 
   * @param {string} id - 代理ID
   * @param {string} [period] - 时间周期标识
   * @returns {AgentPerformance | null} 缓存的业绩数据或null
   * 
   * @example
   * ```typescript
   * const performance = cache.getAgentPerformance('agent123', 'month')
   * if (performance) {
   *   console.log(`业绩: ${performance.totalSales}`)
   * }
   * ```
   */
  getAgentPerformance(id: string, period?: string): AgentPerformance | null {
    const cacheKey = `${id}-${period || 'default'}`;
    const cachedItem = this.performanceCache.get(cacheKey);
    if (cachedItem && Date.now() < cachedItem.expireAt) {
      console.log(`[Cache] 使用业绩数据缓存: ${cacheKey}`);
      return cachedItem.data;
    }
    return null;
  }
  
  /**
   * 设置业绩数据缓存
   * 将业绩数据存储到缓存中，支持多时间周期的独立缓存
   * 
   * @complexity O(1) - 哈希表插入，常数时间复杂度
   * @flow 缓存键构建 → 过期时间计算 → 缓存数据构建 → 缓存存储
   * 
   * @param {string} id - 代理ID
   * @param {AgentPerformance} data - 要缓存的业绩数据
   * @param {string} [period] - 时间周期标识
   * 
   * @example
   * ```typescript
   * cache.setAgentPerformance('agent123', {
   *   totalSales: 50000,
   *   commissionsEarned: 5000
   * }, 'month')
   * ```
   */
  setAgentPerformance(id: string, data: AgentPerformance, period?: string): void {
    const cacheKey = `${id}-${period || 'default'}`;
    console.log(`[Cache] 设置业绩数据缓存: ${cacheKey}`);
    this.performanceCache.set(cacheKey, {
      data,
      expireAt: Date.now() + this.CACHE_TTL
    });
  }
  
  /**
   * 清除指定代理的业绩缓存
   * 清除指定代理和时间周期的业绩缓存数据
   * 
   * @complexity O(1) - 哈希表删除，常数时间复杂度
   * @flow 缓存键构建 → 缓存删除 → 日志记录
   * 
   * @param {string} id - 代理ID
   * @param {string} [period] - 时间周期标识，未提供则使用代理ID
   * 
   * @example
   * ```typescript
   * // 清除特定周期的业绩缓存
   * cache.clearPerformanceCache('agent123', 'month')
   * 
   * // 清除默认周期的业绩缓存
   * cache.clearPerformanceCache('agent123')
   * ```
   */
  clearPerformanceCache(id: string, period?: string): void {
    const cacheKey = period ? `${id}-${period}` : id;
    this.performanceCache.delete(cacheKey);
    console.log(`[Cache] 清除代理业绩数据缓存: ${cacheKey}`);
  }

  /**
   * 清除指定代理的所有缓存
   * 清除代理的详情缓存和所有时间周期的业绩缓存
   * 
   * @complexity O(n) - n为该代理的业绩缓存数量，需要遍历查找
   * @flow 详情缓存删除 → 业绩缓存键查找 → 批量删除 → 统计日志
   * 
   * @param {string} id - 代理ID
   * 
   * @example
   * ```typescript
   * // 清除代理的所有缓存数据
   * cache.clearAgentCache('agent123')
   * ```
   */
  clearAgentCache(id: string): void {
    // 清除详情缓存
    this.detailCache.delete(id);
    
    // 清除所有周期的业绩缓存
    const keysToDelete: string[] = [];
    this.performanceCache.forEach((_, key) => {
      if (key === id || key.startsWith(`${id}-`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.performanceCache.delete(key));
    
    console.log(`[Cache] 清除代理所有缓存: ${id}, 共 ${keysToDelete.length + 1} 项`);
  }
  
  /**
   * 清除所有缓存
   * 清空详情和业绩数据的所有缓存
   * 
   * @complexity O(1) - Map.clear()为常数时间复杂度
   * @flow 详情缓存清空 → 业绩缓存清空 → 日志记录
   * 
   * @example
   * ```typescript
   * // 清除所有缓存（通常在登出或系统重置时使用）
   * cache.clearAllCache()
   * ```
   */
  clearAllCache(): void {
    console.log('[Cache] 清除所有缓存');
    this.detailCache.clear();
    this.performanceCache.clear();
  }
}

/**
 * 代理Store状态接口
 * 定义代理管理系统的完整状态结构，包含数据、状态、加载状态和缓存管理
 * 
 * @interface AgentState
 */
interface AgentState {
  // 代理数据
  agentList: Agent[];
  agentDetail: Agent | null;
  agentPerformance: AgentPerformance | null;
  totalItems: number;
  
  // 列表状态
  listState: AgentListState;
  
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    performance: boolean;
    action: boolean;
  };
  
  // 缓存管理
  cache: AgentCache;
}

/**
 * 代理管理Store
 * 提供完整的代理管理状态和操作方法，支持CRUD、业绩分析、缓存优化和批量操作
 * 
 * @store useAgentStore
 * @example
 * ```typescript
 * import { useAgentStore } from '@/store/agent'
 * 
 * const agentStore = useAgentStore()
 * 
 * // 获取代理列表
 * await agentStore.fetchAgentList()
 * 
 * // 获取代理详情
 * const agent = await agentStore.fetchAgentDetail('agent123')
 * 
 * // 创建新代理
 * const newAgent = await agentStore.createAgent({
 *   name: '张三',
 *   email: 'zhangsan@example.com',
 *   category: 'PREMIUM'
 * })
 * ```
 */
export const useAgentStore = defineStore('agent', {
  state: (): AgentState => ({
    // 代理数据
    agentList: [],
    agentDetail: null,
    agentPerformance: null,
    totalItems: 0,
    
    // 列表状态
    listState: {
      filters: {
        keyword: '',
        status: '',
        category: '',
        level: '',
        isAdded: false,
        isPosting: false,
        isIntercept: false,
        isAttracting: false,
        isInGroup: false,
      },
      pagination: {
        page: 1,
        pageSize: 10,
      },
      selectedAgents: [],
    },
    
    // 加载状态
    loading: {
      list: false,
      detail: false,
      performance: false,
      action: false,
    },
    
    // 缓存管理
    cache: new AgentCache(),
  }),
  
  getters: {
    /**
     * 获取当前代理列表
     * 返回当前加载的代理列表数据
     * 
     * @complexity O(1) - 直接返回状态中的数组引用
     * @returns {Agent[]} 代理列表数组
     */
    getAgentList: (state) => state.agentList,
    
    /**
     * 获取当前代理详情
     * 返回当前查看的代理详情数据
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {Agent | null} 代理详情对象或null
     */
    getAgentDetail: (state) => state.agentDetail,
    
    /**
     * 获取代理业绩数据
     * 返回当前加载的代理业绩数据
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {AgentPerformance | null} 业绩数据对象或null
     */
    getAgentPerformance: (state) => state.agentPerformance,
    
    /**
     * 获取列表状态
     * 返回列表管理的完整状态信息
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {AgentListState} 列表状态对象
     */
    getListState: (state) => state.listState,
    
    /**
     * 获取筛选条件
     * 返回当前的筛选条件配置
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {object} 筛选条件对象
     */
    getFilters: (state) => state.listState.filters,
    
    /**
     * 获取分页信息
     * 返回当前的分页配置信息
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {object} 分页信息对象
     */
    getPagination: (state) => state.listState.pagination,
    
    /**
     * 获取选中的代理ID列表
     * 返回当前选中的代理ID数组
     * 
     * @complexity O(1) - 直接返回状态中的数组引用
     * @returns {string[]} 选中的代理ID数组
     */
    getSelectedAgents: (state) => state.listState.selectedAgents,
    
    /**
     * 获取加载状态
     * 返回各个操作的加载状态信息
     * 
     * @complexity O(1) - 直接返回状态中的对象引用
     * @returns {object} 加载状态对象
     */
    getLoadingState: (state) => state.loading,
  },
  
  actions: {
    /**
     * 获取代理列表
     * 从服务器获取代理列表数据，支持筛选、分页和排序
     * 
     * @complexity O(1) - API调用为常数时间，实际取决于网络和服务器响应
     * @flow 参数构建 → 筛选条件应用 → API调用 → 数据更新 → 错误处理
     * 
     * @returns {Promise<any>} API响应数据
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * // 获取代理列表
     * try {
     *   const response = await agentStore.fetchAgentList()
     *   console.log(`获取到 ${response.data.length} 个代理`)
     * } catch (error) {
     *   console.error('获取代理列表失败:', error.message)
     * }
     * ```
     */
    async fetchAgentList() {
      this.loading.list = true;
      try {
        const { page, pageSize } = this.listState.pagination;
        
        // 构建查询参数
        const queryParams: AgentQueryParams = {
          page,
          pageSize,
          keyword: this.listState.filters.keyword || undefined,
          status: this.listState.filters.status as AgentStatus || undefined,
          category: this.listState.filters.category as AgentCategory || undefined,
          level: this.listState.filters.level as AgentLevel || undefined,
        };
        
        // 添加布尔值筛选条件
        if (this.listState.filters.isAdded) queryParams.isAdded = true;
        if (this.listState.filters.isPosting) queryParams.isPosting = true;
        if (this.listState.filters.isIntercept) queryParams.isIntercept = true;
        if (this.listState.filters.isAttracting) queryParams.isAttracting = true;
        if (this.listState.filters.isInGroup) queryParams.isInGroup = true;
        
        const response = await agentApi.getAgentList(queryParams);
        this.agentList = response.data;
        this.totalItems = response.total;
        return response;
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        // 触发全局错误通知
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取代理详情
     * 获取指定代理的详细信息，支持智能缓存机制
     * 
     * @complexity O(1) - 缓存命中时为常数时间，API调用为常数时间
     * @flow 缓存检查 → 数据返回或API调用 → 数据更新 → 缓存设置
     * 
     * @param {string} id - 代理ID
     * @returns {Promise<Agent>} 代理详情对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const agent = await agentStore.fetchAgentDetail('agent123')
     *   console.log(`代理名称: ${agent.name}`)
     *   console.log(`代理状态: ${agent.status}`)
     * } catch (error) {
     *   console.error('获取代理详情失败:', error.message)
     * }
     * ```
     */
    async fetchAgentDetail(id: string) {
      this.loading.detail = true;
      try {
        // 尝试从缓存中获取
        const cachedData = this.cache.getAgentDetail(id);
        if (cachedData) {
          this.agentDetail = cachedData;
          this.loading.detail = false;
          return cachedData;
        }
        
        const agentData = await agentApi.getAgent(id);
        this.agentDetail = agentData;
        
        // 缓存数据
        this.cache.setAgentDetail(id, agentData);
        
        return agentData;
      } catch (error) {
        console.error('Failed to fetch agent detail:', error);
        // 触发全局错误通知
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 获取代理业绩数据
     * 获取指定代理的业绩数据，支持时间周期筛选和缓存
     * 
     * @complexity O(1) - 缓存命中时为常数时间，API调用为常数时间
     * @flow 周期参数处理 → 缓存检查 → 数据返回或API调用 → 缓存设置
     * 
     * @param {string} id - 代理ID
     * @param {AgentPerformanceQueryParams} [params] - 业绩查询参数
     * @returns {Promise<AgentPerformance>} 业绩数据对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * // 获取月度业绩数据
     * const performance = await agentStore.fetchAgentPerformance('agent123', {
     *   period: 'month',
     *   includeTrend: true
     * })
     * console.log(`总销售额: ${performance.totalSales}`)
     * console.log(`佣金收入: ${performance.commissionsEarned}`)
     * ```
     */
    async fetchAgentPerformance(id: string, params?: AgentPerformanceQueryParams) {
      this.loading.performance = true;
      try {
        const period = params?.period || 'default';
        
        // 尝试从缓存中获取
        const cachedData = this.cache.getAgentPerformance(id, period);
        if (cachedData) {
          this.agentPerformance = cachedData;
          this.loading.performance = false;
          return cachedData;
        }
        
        const performanceData = await agentApi.getAgentPerformance(id, params);
        this.agentPerformance = performanceData;
        
        // 缓存数据
        this.cache.setAgentPerformance(id, performanceData, period);
        
        return performanceData;
      } catch (error) {
        console.error('Failed to fetch agent performance:', error);
        // 触发全局错误通知
        throw error;
      } finally {
        this.loading.performance = false;
      }
    },
    
    /**
     * 创建代理
     * 创建新的代理记录并添加到列表中
     * 
     * @complexity O(1) - API调用和列表操作为常数时间
     * @flow 数据验证 → API调用 → 列表更新 → 计数增加
     * 
     * @param {CreateAgentParams} data - 新代理的数据
     * @returns {Promise<Agent>} 创建成功的代理对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const newAgent = await agentStore.createAgent({
     *     name: '李四',
     *     email: 'lisi@example.com',
     *     category: 'STANDARD',
     *     level: 'JUNIOR'
     *   })
     *   console.log('代理创建成功:', newAgent.id)
     * } catch (error) {
     *   console.error('创建代理失败:', error.message)
     * }
     * ```
     */
    async createAgent(data: CreateAgentParams) {
      this.loading.action = true;
      try {
        const newAgent = await agentApi.createAgent(data);
        // 添加到列表头部
        this.agentList = [newAgent, ...this.agentList];
        this.totalItems += 1;
        return newAgent;
      } catch (error) {
        console.error('Failed to create agent:', error);
        // 触发全局错误通知
        throw error;
      } finally {
        this.loading.action = false;
      }
    },
    
    /**
     * 更新代理信息
     * 更新指定代理的信息并同步到本地状态和缓存
     * 
     * @complexity O(n) - n为代理列表长度，需要查找目标代理
     * @flow API调用 → 详情更新 → 列表同步 → 缓存清理
     * 
     * @param {string} id - 要更新的代理ID
     * @param {UpdateAgentParams} data - 更新的数据
     * @returns {Promise<Agent>} 更新后的代理对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const updatedAgent = await agentStore.updateAgent('agent123', {
     *     status: 'INACTIVE',
     *     level: 'SENIOR'
     *   })
     *   console.log('代理更新成功:', updatedAgent.status)
     * } catch (error) {
     *   console.error('更新代理失败:', error.message)
     * }
     * ```
     */
    async updateAgent(id: string, data: UpdateAgentParams) {
      this.loading.action = true;
      try {
        const updatedAgent = await agentApi.updateAgent(id, data);
        
        // 更新本地存储的数据
        if (this.agentDetail && this.agentDetail.id === id) {
          this.agentDetail = updatedAgent;
        }
        
        // 更新列表中的数据
        const index = this.agentList.findIndex(agent => agent.id === id);
        if (index !== -1) {
          this.agentList[index] = updatedAgent;
        }
        
        // 清除缓存
        this.cache.clearAgentCache(id);
        
        return updatedAgent;
      } catch (error) {
        console.error('Failed to update agent:', error);
        // 触发全局错误通知
        throw error;
      } finally {
        this.loading.action = false;
      }
    },
    
    /**
     * 删除代理
     * 删除指定的代理记录并清理相关状态和缓存
     * 
     * @complexity O(n) - n为代理列表长度，需要过滤操作
     * @flow API调用 → 列表过滤 → 详情清理 → 选择清理 → 缓存清理
     * 
     * @param {string} id - 要删除的代理ID
     * @returns {Promise<boolean>} 删除成功返回true，失败返回false
     * 
     * @example
     * ```typescript
     * const success = await agentStore.deleteAgent('agent123')
     * if (success) {
     *   console.log('代理删除成功')
     * } else {
     *   console.log('代理删除失败')
     * }
     * ```
     */
    async deleteAgent(id: string) {
      this.loading.action = true;
      try {
        await agentApi.deleteAgent(id);
        
        // 从列表中移除
        this.agentList = this.agentList.filter(agent => agent.id !== id);
        this.totalItems -= 1;
        
        // 如果当前详情页是该代理，清空详情
        if (this.agentDetail && this.agentDetail.id === id) {
          this.agentDetail = null;
          this.agentPerformance = null;
        }
        
        // 从选中列表中移除
        this.listState.selectedAgents = this.listState.selectedAgents.filter(agentId => agentId !== id);
        
        // 清除缓存
        this.cache.clearAgentCache(id);
        
        return true;
      } catch (error) {
        console.error('Failed to delete agent:', error);
        // 触发全局错误通知
        return false;
      } finally {
        this.loading.action = false;
      }
    },
    
    /**
     * 批量删除代理
     * 同时删除多个代理记录并清理相关状态和缓存
     * 
     * @complexity O(n) - n为代理列表长度，需要过滤操作
     * @flow 参数检查 → API调用 → 列表过滤 → 详情清理 → 选择清空 → 批量缓存清理
     * 
     * @param {string[]} ids - 要删除的代理ID数组
     * @returns {Promise<boolean>} 删除成功返回true，失败返回false
     * 
     * @example
     * ```typescript
     * const selectedIds = agentStore.getSelectedAgents
     * const success = await agentStore.batchDeleteAgents(selectedIds)
     * if (success) {
     *   console.log(`成功删除 ${selectedIds.length} 个代理`)
     * }
     * ```
     */
    async batchDeleteAgents(ids: string[]) {
      if (!ids.length) return false;
      
      this.loading.action = true;
      try {
        await agentApi.batchDeleteAgents(ids);
        
        // 从列表中移除
        this.agentList = this.agentList.filter(agent => !ids.includes(agent.id));
        this.totalItems -= ids.length;
        
        // 如果当前详情页的代理在删除列表中，清空详情
        if (this.agentDetail && ids.includes(this.agentDetail.id)) {
          this.agentDetail = null;
          this.agentPerformance = null;
        }
        
        // 清空选中的代理
        this.listState.selectedAgents = [];
        
        // 清除缓存
        ids.forEach(id => this.cache.clearAgentCache(id));
        
        return true;
      } catch (error) {
        console.error('Failed to delete agents:', error);
        // 触发全局错误通知
        return false;
      } finally {
        this.loading.action = false;
      }
    },
    
    /**
     * 更新列表筛选条件
     * 更新筛选条件并重置到第一页
     * 
     * @complexity O(1) - 常数时间复杂度，对象合并操作
     * @flow 筛选条件合并 → 页码重置
     * 
     * @param {Partial<object>} filters - 新的筛选条件
     * 
     * @example
     * ```typescript
     * // 设置状态和关键词筛选
     * agentStore.updateFilters({
     *   status: 'ACTIVE',
     *   keyword: '张三',
     *   category: 'PREMIUM'
     * })
     * ```
     */
    updateFilters(filters: Partial<typeof this.listState.filters>) {
      this.listState.filters = { ...this.listState.filters, ...filters };
      // 更新筛选条件后重置到第一页
      this.listState.pagination.page = 1;
    },
    
    /**
     * 更新分页信息
     * 更新分页参数，如页码和页大小
     * 
     * @complexity O(1) - 常数时间复杂度，对象合并操作
     * @flow 分页参数合并
     * 
     * @param {Partial<object>} pagination - 新的分页参数
     * 
     * @example
     * ```typescript
     * // 跳转到第3页
     * agentStore.updatePagination({ page: 3 })
     * 
     * // 修改页大小为20
     * agentStore.updatePagination({ pageSize: 20 })
     * ```
     */
    updatePagination(pagination: Partial<typeof this.listState.pagination>) {
      this.listState.pagination = { ...this.listState.pagination, ...pagination };
    },
    
    /**
     * 切换代理选择状态
     * 如果代理已选中则取消选择，未选中则添加到选择列表
     * 
     * @complexity O(n) - n为选中列表长度，需要查找操作
     * @flow 选择状态检查 → 添加或移除操作
     * 
     * @param {string} id - 要切换的代理ID
     * 
     * @example
     * ```typescript
     * // 切换代理的选择状态
     * agentStore.toggleSelectAgent('agent123')
     * ```
     */
    toggleSelectAgent(id: string) {
      const index = this.listState.selectedAgents.indexOf(id);
      if (index === -1) {
        this.listState.selectedAgents.push(id);
      } else {
        this.listState.selectedAgents.splice(index, 1);
      }
    },
    
    /**
     * 选择所有当前页面的代理
     * 将当前页面的所有代理添加到选择列表中
     * 
     * @complexity O(n) - n为当前页面代理数量，需要映射和去重操作
     * @flow 当前页面ID提取 → 与现有选择合并 → 去重处理
     * 
     * @example
     * ```typescript
     * // 选择当前页面的所有代理
     * agentStore.selectAllAgents()
     * console.log(`已选择 ${agentStore.getSelectedAgents.length} 个代理`)
     * ```
     */
    selectAllAgents() {
      const currentPageIds = this.agentList.map(agent => agent.id);
      // 使用Set去重
      const combinedIds = [...new Set([...this.listState.selectedAgents, ...currentPageIds])];
      this.listState.selectedAgents = combinedIds;
    },
    
    /**
     * 取消选择所有代理
     * 清空所有已选择的代理
     * 
     * @complexity O(1) - 常数时间复杂度，数组重置
     * @flow 选择列表清空
     * 
     * @example
     * ```typescript
     * agentStore.deselectAllAgents()
     * console.log(agentStore.getSelectedAgents.length) // 0
     * ```
     */
    deselectAllAgents() {
      this.listState.selectedAgents = [];
    },
    
    /**
     * 取消选择当前页面的代理
     * 仅从选择列表中移除当前页面显示的代理
     * 
     * @complexity O(n) - n为当前页面代理数量，需要过滤操作
     * @flow 当前页面ID集合构建 → 选择列表过滤
     * 
     * @example
     * ```typescript
     * // 只取消当前页面的代理选择，保留其他页面的选择
     * agentStore.deselectCurrentPageAgents()
     * ```
     */
    deselectCurrentPageAgents() {
      const currentPageIds = new Set(this.agentList.map(agent => agent.id));
      this.listState.selectedAgents = this.listState.selectedAgents.filter(id => !currentPageIds.has(id));
    },
    
    /**
     * 重置列表状态
     * 将列表状态重置为初始值，包括筛选、分页和选择
     * 
     * @complexity O(1) - 常数时间复杂度，状态重置
     * @flow 筛选条件重置 → 分页重置 → 选择清空
     * 
     * @example
     * ```typescript
     * agentStore.resetListState()
     * console.log('列表状态已重置')
     * ```
     */
    resetListState() {
      this.listState = {
        filters: {
          keyword: '',
          status: '',
          category: '',
          level: '',
          isAdded: false,
          isPosting: false,
          isIntercept: false,
          isAttracting: false,
          isInGroup: false,
        },
        pagination: {
          page: 1,
          pageSize: 10,
        },
        selectedAgents: [],
      };
    },
    
    /**
     * 强制刷新代理数据
     * 忽略缓存，强制从服务器重新获取代理详情和业绩数据
     * 
     * @complexity O(1) - 两个API调用的复杂度
     * @flow 缓存清理 → 详情重新获取 → 业绩数据重新获取
     * 
     * @param {string} id - 代理ID
     * @param {AgentPerformanceQueryParams} [performanceParams] - 业绩查询参数
     * @returns {Promise<Agent | null>} 刷新后的代理详情对象
     * @throws {Error} 当API调用失败时抛出错误
     * 
     * @example
     * ```typescript
     * try {
     *   const agent = await agentStore.forceRefresh('agent123', {
     *     period: 'month',
     *     includeTrend: true
     *   })
     *   console.log('代理数据已强制刷新')
     * } catch (error) {
     *   console.error('刷新失败:', error.message)
     * }
     * ```
     */
    async forceRefresh(id: string, performanceParams?: AgentPerformanceQueryParams) {
      try {
        // 清除所有相关缓存
        this.cache.clearAgentCache(id);
        
        // 重新获取代理详情
        await this.fetchAgentDetail(id);
        
        // 如果提供了业绩参数，重新获取业绩数据
        if (performanceParams) {
          await this.fetchAgentPerformance(id, performanceParams);
        } else {
          // 默认也获取业绩数据，包含趋势
          await this.fetchAgentPerformance(id, {
            period: 'month',
            includeTrend: true
          });
        }
        
        return this.agentDetail;
      } catch (error) {
        console.error('Failed to refresh agent data:', error);
        throw error;
      }
    },
  },
}); 