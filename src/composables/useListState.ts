import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgentStore } from '@/store/agent'
import type { AgentStatus, AgentCategory, AgentLevel } from '@/types/agent'

/**
 * 管理代理列表状态的Composable函数
 * 
 * 实现功能：
 * 1. URL参数与Store状态的同步
 * 2. 详情页导航与返回列表的状态保存
 * 3. 列表状态的保存与恢复
 */
export function useListState() {
  const agentStore = useAgentStore()
  const route = useRoute()
  const router = useRouter()
  
  // 是否已从URL同步过状态，防止初始化时触发多次同步
  const hasSyncedFromURL = ref(false)
  
  /**
   * 从URL同步状态到Store
   * 将URL查询参数同步到Pinia状态管理中
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
   * 将Pinia中的状态同步到URL查询参数
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
   * @param id 代理ID
   * @param keepQueryParams 是否在详情页URL中保留查询参数
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
   * @param filters 筛选条件
   */
  const applyFilters = (filters: Record<string, any>) => {
    agentStore.updateFilters(filters)
    syncStateToURL()
  }
  
  /**
   * 重置所有筛选条件
   */
  const resetFilters = () => {
    agentStore.resetListState()
    syncStateToURL()
  }
  
  /**
   * 更新分页
   * @param page 页码
   * @param pageSize 每页条数
   */
  const updatePagination = (page: number, pageSize?: number) => {
    const pagination: Record<string, number> = { page }
    if (pageSize) pagination.pageSize = pageSize
    
    agentStore.updatePagination(pagination)
    syncStateToURL()
  }
  
  // 监听路由变化，从URL同步状态
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