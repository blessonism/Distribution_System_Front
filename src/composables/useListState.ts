/**
 * @fileoverview 列表状态管理组合式API模块
 * 提供代理列表页面的状态管理功能，包括URL同步、导航状态保存、筛选和分页管理
 * 
 * @module composables/useListState
 * @requires vue
 * @requires vue-router
 * @requires @/store/agent
 * @requires @/types/agent
 */

import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgentStore } from '@/store/agent'
import type { AgentStatus, AgentCategory, AgentLevel } from '@/types/agent'

/**
 * 管理代理列表状态的组合式API
 * 实现URL参数与Store状态的双向同步，支持列表状态保存和恢复
 * 
 * @function useListState
 * @returns {Object} 列表状态管理相关的方法和状态
 * @complexity O(1) - 各个状态管理操作均为常数时间复杂度
 * @flow 初始化路由监听 -> URL状态同步 -> 提供状态管理方法
 * 
 * 核心功能：
 * 1. URL参数与Store状态的双向同步
 * 2. 详情页导航与返回列表的状态保存
 * 3. 筛选条件和分页状态的持久化
 * 4. 列表状态的保存与恢复机制
 * 
 * @example
 * ```typescript
 * // 在代理列表组件中使用
 * const {
 *   navigateToDetail,
 *   navigateBackToList,
 *   applyFilters,
 *   resetFilters,
 *   updatePagination
 * } = useListState()
 * 
 * // 导航到详情页并保持列表状态
 * const handleRowClick = (agent) => {
 *   navigateToDetail(agent.id, true)
 * }
 * 
 * // 应用筛选条件
 * const handleFilter = (filters) => {
 *   applyFilters(filters)
 * }
 * ```
 */
export function useListState() {
  const agentStore = useAgentStore()
  const route = useRoute()
  const router = useRouter()
  
  // 是否已从URL同步过状态，防止初始化时触发多次同步
  const hasSyncedFromURL = ref(false)
  
  /**
   * 从URL同步状态到Store
   * 将URL查询参数解析并同步到Pinia状态管理中，支持筛选条件和分页信息的恢复
   * 
   * @function syncStateFromURL
   * @returns {void}
   * @complexity O(1) - 常数时间的状态同步操作
   * @flow 检查URL参数 -> 解析筛选条件 -> 解析分页信息 -> 更新Store状态
   * 
   * @example
   * ```typescript
   * // URL: /agents?keyword=test&status=active&page=2
   * syncStateFromURL()
   * // Store中的状态会同步为: { filters: { keyword: 'test', status: 'active' }, pagination: { page: 2 } }
   * ```
   */
  const syncStateFromURL = () => {
    if (!route.query || Object.keys(route.query).length === 0) return
    
    const query = route.query
    
    // 同步筛选条件
    const filters: Record<string, any> = {}
    
    if (query.keyword) filters.keyword = query.keyword as string
    if (query.status) filters.status = query.status as string
    if (query.category) filters.category = query.category as string
    if (query.level) filters.level = query.level as string
    
    // 布尔值需要特殊处理
    if (query.isAdded) filters.isAdded = query.isAdded === 'true'
    if (query.isPosting) filters.isPosting = query.isPosting === 'true'
    if (query.isIntercept) filters.isIntercept = query.isIntercept === 'true'
    if (query.isAttracting) filters.isAttracting = query.isAttracting === 'true'
    if (query.isInGroup) filters.isInGroup = query.isInGroup === 'true'
    
    // 同步分页
    const pagination: Record<string, any> = {}
    if (query.page) pagination.page = parseInt(query.page as string)
    if (query.pageSize) pagination.pageSize = parseInt(query.pageSize as string)
    
    // 更新Store
    if (Object.keys(filters).length > 0) {
      agentStore.updateFilters(filters)
    }
    
    if (Object.keys(pagination).length > 0) {
      agentStore.updatePagination(pagination)
    }
    
    hasSyncedFromURL.value = true
  }
  
  /**
   * 从Store同步状态到URL
   * 将Pinia中的状态同步到URL查询参数，实现状态的持久化保存
   * 
   * @function syncStateToURL
   * @returns {void}
   * @complexity O(1) - 常数时间的URL更新操作
   * @flow 获取Store状态 -> 构建查询参数 -> 更新URL -> 避免触发新导航
   * 
   * @example
   * ```typescript
   * // Store状态: { filters: { keyword: 'test' }, pagination: { page: 2 } }
   * syncStateToURL()
   * // URL会更新为: /agents?keyword=test&page=2
   * ```
   */
  const syncStateToURL = () => {
    const listState = agentStore.getListState
    const query: Record<string, string> = {}
    
    // 只保存非空值
    if (listState.filters.keyword) query.keyword = listState.filters.keyword
    if (listState.filters.status) query.status = listState.filters.status
    if (listState.filters.category) query.category = listState.filters.category
    if (listState.filters.level) query.level = listState.filters.level
    
    // 布尔值转字符串
    if (listState.filters.isAdded) query.isAdded = 'true'
    if (listState.filters.isPosting) query.isPosting = 'true'
    if (listState.filters.isIntercept) query.isIntercept = 'true'
    if (listState.filters.isAttracting) query.isAttracting = 'true'
    if (listState.filters.isInGroup) query.isInGroup = 'true'
    
    // 分页信息
    query.page = listState.pagination.page.toString()
    query.pageSize = listState.pagination.pageSize.toString()
    
    // 更新URL，不触发新的导航
    router.replace({ query })
  }
  
  /**
   * 导航到详情页，保留当前列表状态
   * 先将当前列表状态同步到URL，然后导航到详情页，支持状态恢复
   * 
   * @param {string} id - 代理ID，用于详情页路由参数
   * @param {boolean} keepQueryParams - 是否在详情页URL中保留查询参数，默认false
   * @returns {void}
   * @complexity O(1) - 导航操作为常数时间复杂度
   * @flow 同步状态到URL -> 构建导航参数 -> 执行路由跳转
   * 
   * @example
   * ```typescript
   * // 导航到详情页，不保留查询参数
   * navigateToDetail('agent123')
   * 
   * // 导航到详情页，保留查询参数便于返回时恢复状态
   * navigateToDetail('agent123', true)
   * ```
   */
  const navigateToDetail = (id: string, keepQueryParams = false) => {
    // 先同步状态到URL
    syncStateToURL()
    
    // 导航到详情页
    if (keepQueryParams) {
      // 保留查询参数，添加来源标记
      router.push({
        name: 'AgentDetail',
        params: { id },
        query: { 
          ...route.query,
          from: 'list' 
        }
      })
    } else {
      // 只添加来源标记
      router.push({
        name: 'AgentDetail',
        params: { id },
        query: { from: 'list' }
      })
    }
  }
  
  /**
   * 返回列表页，恢复之前的状态
   * 智能判断返回方式，优先使用浏览器历史记录以保持状态连续性
   * 
   * @function navigateBackToList
   * @returns {void}
   * @complexity O(1) - 路由跳转为常数时间操作
   * @flow 检查来源标记 -> 选择返回方式 -> 执行导航
   * 
   * @example
   * ```typescript
   * // 在详情页组件中使用
   * const handleBack = () => {
   *   navigateBackToList() // 会保持列表页的筛选和分页状态
   * }
   * ```
   */
  const navigateBackToList = () => {
    // 判断是否从列表页进入详情页
    const fromList = route.query.from === 'list'
    
    if (fromList) {
      // 使用router.back()返回上一页，保留历史状态
      router.back()
    } else {
      // 直接导航到列表页，状态会根据URL参数重新加载
      router.push({ name: 'AgentList' })
    }
  }
  
  /**
   * 应用筛选条件
   * 更新Store中的筛选条件并同步到URL，实现筛选状态的持久化
   * 
   * @param {Record<string, any>} filters - 筛选条件对象，包含各种筛选字段
   * @returns {void}
   * @complexity O(1) - 筛选条件更新为常数时间操作
   * @flow 更新Store筛选条件 -> 同步状态到URL
   * 
   * @example
   * ```typescript
   * // 应用筛选条件
   * applyFilters({
   *   keyword: '测试代理',
   *   status: 'active',
   *   category: 'premium',
   *   isAdded: true
   * })
   * ```
   */
  const applyFilters = (filters: Record<string, any>) => {
    agentStore.updateFilters(filters)
    syncStateToURL()
  }
  
  /**
   * 重置所有筛选条件
   * 清空Store中的筛选条件和分页状态，并同步到URL
   * 
   * @function resetFilters
   * @returns {void}
   * @complexity O(1) - 状态重置为常数时间操作
   * @flow 重置Store状态 -> 同步状态到URL
   * 
   * @example
   * ```typescript
   * // 重置所有筛选条件
   * resetFilters()
   * // Store中的筛选条件会被清空，分页重置为第1页
   * ```
   */
  const resetFilters = () => {
    agentStore.resetListState()
    syncStateToURL()
  }
  
  /**
   * 更新分页
   * 更新Store中的分页信息并同步到URL，支持页码和每页条数的设置
   * 
   * @param {number} page - 页码，从1开始
   * @param {number} [pageSize] - 每页条数，可选参数
   * @returns {void}
   * @complexity O(1) - 分页更新为常数时间操作
   * @flow 构建分页参数 -> 更新Store分页 -> 同步状态到URL
   * 
   * @example
   * ```typescript
   * // 更新到第2页
   * updatePagination(2)
   * 
   * // 更新到第3页，每页显示50条
   * updatePagination(3, 50)
   * ```
   */
  const updatePagination = (page: number, pageSize?: number) => {
    const pagination: Record<string, number> = { page }
    if (pageSize) pagination.pageSize = pageSize
    
    agentStore.updatePagination(pagination)
    syncStateToURL()
  }
  
  // 监听路由变化，从URL同步状态
  // 当路由变化时自动从URL恢复列表状态，确保状态的一致性
  watch(() => route.fullPath, () => {
    if (route.name === 'AgentList') {
      // 仅当首次加载或路由参数变化时同步
      if (!hasSyncedFromURL.value || route.query) {
        syncStateFromURL()
      }
    }
  }, { immediate: true })
  
  return {
    syncStateFromURL,
    syncStateToURL,
    navigateToDetail,
    navigateBackToList,
    applyFilters,
    resetFilters,
    updatePagination
  }
} 