import { defineStore } from 'pinia'
import { agentApi } from '@/api/agent'
import type { Agent, AgentQueryParams, CreateAgentParams, UpdateAgentParams, AgentPerformance, AgentStatus, AgentCategory, AgentLevel, AgentPerformanceQueryParams } from '@/types/agent'

// 列表状态接口定义
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

// 缓存管理
interface CacheItem<T> {
  data: T;
  expireAt: number;
}

class AgentCache {
  private detailCache: Map<string, CacheItem<Agent>> = new Map();
  private performanceCache: Map<string, CacheItem<AgentPerformance>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 缓存有效期：5分钟
  
  // 获取代理详情缓存
  getAgentDetail(id: string): Agent | null {
    const cachedItem = this.detailCache.get(id);
    if (cachedItem && Date.now() < cachedItem.expireAt) {
      console.log(`[Cache] 使用代理详情缓存: ${id}`);
      return cachedItem.data;
    }
    return null;
  }
  
  // 设置代理详情缓存
  setAgentDetail(id: string, data: Agent): void {
    console.log(`[Cache] 设置代理详情缓存: ${id}`);
    this.detailCache.set(id, {
      data,
      expireAt: Date.now() + this.CACHE_TTL
    });
  }
  
  // 获取业绩数据缓存
  getAgentPerformance(id: string, period?: string): AgentPerformance | null {
    const cacheKey = `${id}-${period || 'default'}`;
    const cachedItem = this.performanceCache.get(cacheKey);
    if (cachedItem && Date.now() < cachedItem.expireAt) {
      console.log(`[Cache] 使用业绩数据缓存: ${cacheKey}`);
      return cachedItem.data;
    }
    return null;
  }
  
  // 设置业绩数据缓存
  setAgentPerformance(id: string, data: AgentPerformance, period?: string): void {
    const cacheKey = `${id}-${period || 'default'}`;
    console.log(`[Cache] 设置业绩数据缓存: ${cacheKey}`);
    this.performanceCache.set(cacheKey, {
      data,
      expireAt: Date.now() + this.CACHE_TTL
    });
  }
  
  // 清除指定代理的指定周期业绩缓存
  clearPerformanceCache(id: string, period?: string): void {
    const cacheKey = period ? `${id}-${period}` : id;
    this.performanceCache.delete(cacheKey);
    console.log(`[Cache] 清除代理业绩数据缓存: ${cacheKey}`);
  }

  // 清除指定代理的所有缓存
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
  
  // 清除所有缓存
  clearAllCache(): void {
    console.log('[Cache] 清除所有缓存');
    this.detailCache.clear();
    this.performanceCache.clear();
  }
}

// 代理状态接口定义
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
    // 获取当前代理列表
    getAgentList: (state) => state.agentList,
    
    // 获取当前代理详情
    getAgentDetail: (state) => state.agentDetail,
    
    // 获取代理业绩数据
    getAgentPerformance: (state) => state.agentPerformance,
    
    // 获取列表状态
    getListState: (state) => state.listState,
    
    // 获取筛选条件
    getFilters: (state) => state.listState.filters,
    
    // 获取分页信息
    getPagination: (state) => state.listState.pagination,
    
    // 获取选中的代理
    getSelectedAgents: (state) => state.listState.selectedAgents,
    
    // 获取加载状态
    getLoadingState: (state) => state.loading,
  },
  
  actions: {
    // 获取代理列表
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
    
    // 获取代理详情
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
    
    // 获取代理业绩数据
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
    
    // 创建代理
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
    
    // 更新代理信息
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
    
    // 删除代理
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
    
    // 批量删除代理
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
    
    // 更新列表筛选条件
    updateFilters(filters: Partial<typeof this.listState.filters>) {
      this.listState.filters = { ...this.listState.filters, ...filters };
      // 更新筛选条件后重置到第一页
      this.listState.pagination.page = 1;
    },
    
    // 更新分页信息
    updatePagination(pagination: Partial<typeof this.listState.pagination>) {
      this.listState.pagination = { ...this.listState.pagination, ...pagination };
    },
    
    // 选择/取消选择代理
    toggleSelectAgent(id: string) {
      const index = this.listState.selectedAgents.indexOf(id);
      if (index === -1) {
        this.listState.selectedAgents.push(id);
      } else {
        this.listState.selectedAgents.splice(index, 1);
      }
    },
    
    // 选择所有当前页面的代理
    selectAllAgents() {
      const currentPageIds = this.agentList.map(agent => agent.id);
      // 使用Set去重
      const combinedIds = [...new Set([...this.listState.selectedAgents, ...currentPageIds])];
      this.listState.selectedAgents = combinedIds;
    },
    
    // 取消选择所有代理
    deselectAllAgents() {
      this.listState.selectedAgents = [];
    },
    
    // 仅取消选择当前页面的代理
    deselectCurrentPageAgents() {
      const currentPageIds = new Set(this.agentList.map(agent => agent.id));
      this.listState.selectedAgents = this.listState.selectedAgents.filter(id => !currentPageIds.has(id));
    },
    
    // 重置列表状态
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
    
    // 强制刷新代理数据（忽略缓存）
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