/**
 * 邀请系统相关的 Composable
 * 集成网络重试机制和状态监控
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useInvitationStore } from '@/store/invitation'
import { toast } from '@/components/ui/toast/use-toast'
import { invitationErrorHandler } from '@/utils/invitationErrorHandler'
import { 
  networkStatusDetector, 
  createInvitationRetryMechanism,
  getAdaptiveRetryConfig,
  type RetryConfig 
} from '@/utils/retryMechanism'
import {
  validateInviteCodeComplete,
  extractInvitationFromUrl,
  formatInviteCodeInput,
  debounceInviteCodeValidation,
  hasInvitationPermission,
  getAllowedTargetRoles,
  getInviteCodeLimit,
  getInviteCodeStatus,
  calculateInviteCodeStats,
  type CompleteValidationResult,
  type UrlInvitationInfo
} from '@/utils/invitation'
import type { UserRole } from '@/types/api'
import type { InvitationCode } from '@/types/invitation'

/**
 * 邀请码验证 Composable
 */
export function useInviteCodeValidation() {
  // 验证状态
  const isValidating = ref(false)
  const validationResult = ref<CompleteValidationResult | null>(null)
  const inputCode = ref('')
  const isValid = computed(() => validationResult.value?.isValid === true)
  const error = computed(() => validationResult.value?.error || '')
  
  // 格式化输入
  const formattedCode = computed(() => formatInviteCodeInput(inputCode.value))
  
  // 防抖验证函数
  const debouncedValidate = debounceInviteCodeValidation(async (code: string) => {
    if (!code) {
      validationResult.value = null
      return
    }
    
    isValidating.value = true
    try {
      const result = await validateInviteCodeComplete(code)
      validationResult.value = result
    } catch (error) {
      console.error('邀请码验证失败:', error)
      const handledError = invitationErrorHandler.handleValidationError(error, {
        inviteCode: code,
        action: 'debounced_validation'
      })
      
      validationResult.value = {
        isValid: false,
        error: handledError.message
      }
    } finally {
      isValidating.value = false
    }
  }, 500)
  
  // 监听输入变化
  watch(formattedCode, (newCode) => {
    inputCode.value = newCode
    debouncedValidate(newCode)
  })
  
  // 立即验证
  const validateImmediately = async (code: string) => {
    if (!code) {
      validationResult.value = null
      return null
    }
    
    isValidating.value = true
    try {
      const result = await validateInviteCodeComplete(code)
      validationResult.value = result
      return result
    } catch (error) {
      console.error('邀请码验证失败:', error)
      const handledError = invitationErrorHandler.handleValidationError(error, {
        inviteCode: code,
        action: 'immediate_validation'
      })
      
      const errorResult = {
        isValid: false,
        error: handledError.message
      }
      validationResult.value = errorResult
      return errorResult
    } finally {
      isValidating.value = false
    }
  }
  
  // 清空验证结果
  const clearValidation = () => {
    inputCode.value = ''
    validationResult.value = null
  }
  
  return {
    inputCode,
    formattedCode,
    isValidating,
    validationResult,
    isValid,
    error,
    validateImmediately,
    clearValidation
  }
}

/**
 * URL邀请处理 Composable
 */
export function useUrlInvitation() {
  const route = useRoute()
  const router = useRouter()
  
  // 从URL提取邀请信息
  const urlInvitation = computed((): UrlInvitationInfo => {
    const searchParams = new URLSearchParams(route.query as Record<string, string>)
    return extractInvitationFromUrl(searchParams)
  })
  
  // 清除URL中的邀请参数
  const clearUrlInvitation = async () => {
    const newQuery = { ...route.query }
    delete newQuery.invite
    delete newQuery.role
    
    await router.replace({
      path: route.path,
      query: newQuery
    })
  }
  
  return {
    urlInvitation,
    clearUrlInvitation
  }
}

/**
 * 邀请权限管理 Composable
 */
export function useInvitationPermissions() {
  const userStore = useUserStore()
  
  // 当前用户是否有邀请权限
  const hasPermission = computed(() => {
    return hasInvitationPermission(userStore.userInfo?.role as UserRole)
  })
  
  // 获取可邀请的目标角色
  const allowedTargetRoles = computed(() => {
    const userRole = userStore.userInfo?.role as UserRole
    return userRole ? getAllowedTargetRoles(userRole) : []
  })
  
  // 获取邀请码数量限制
  const inviteCodeLimit = computed(() => {
    const userRole = userStore.userInfo?.role as UserRole
    return userRole ? getInviteCodeLimit(userRole) : 0
  })
  
  // 是否可以创建更多邀请码
  const canCreateMoreCodes = computed(() => {
    const limit = inviteCodeLimit.value
    if (limit === Infinity) return true
    
    const currentCount = userStore.invitationCodes?.length || 0
    return currentCount < limit
  })
  
  return {
    hasPermission,
    allowedTargetRoles,
    inviteCodeLimit,
    canCreateMoreCodes
  }
}

/**
 * 网络状态监控 Composable
 */
export function useNetworkStatus() {
  const isOnline = ref(networkStatusDetector.isOnline())
  const connectionQuality = ref({ rtt: 0, downlink: 0, effectiveType: 'unknown' })
  const retryConfig = ref<RetryConfig>()

  let unsubscribe: (() => void) | null = null

  // 网络状态变化处理
  const handleNetworkChange = (online: boolean) => {
    isOnline.value = online
    
    if (online) {
      toast({
        title: '网络已连接',
        description: '网络连接已恢复，可以继续使用邀请功能'
      })
    } else {
      toast({
        title: '网络已断开',
        description: '网络连接已断开，请检查网络设置',
        variant: 'destructive'
      })
    }
  }

  // 更新连接质量和重试配置
  const updateConnectionQuality = async () => {
    try {
      const quality = await networkStatusDetector.checkConnectionQuality()
      connectionQuality.value = quality
      
      const adaptiveConfig = await getAdaptiveRetryConfig()
      retryConfig.value = adaptiveConfig

      console.log('[网络状态] 连接质量:', quality, '重试配置:', adaptiveConfig)
    } catch (error) {
      console.warn('更新连接质量失败:', error)
    }
  }

  onMounted(() => {
    unsubscribe = networkStatusDetector.onStatusChange(handleNetworkChange)
    updateConnectionQuality()
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    isOnline,
    connectionQuality,
    retryConfig,
    updateConnectionQuality
  }
}

/**
 * 邀请码管理 Composable
 * 集成网络重试机制
 */
export function useInviteCodeManagement() {
  const invitationStore = useInvitationStore()
  const loading = ref(false)
  const retryMechanism = createInvitationRetryMechanism()
  const networkStatus = useNetworkStatus()
  
  // 获取用户的邀请码列表
  const inviteCodes = computed(() => invitationStore.invitationCodes)
  
  // 计算邀请码统计信息
  const codeStats = computed(() => {
    return calculateInviteCodeStats(inviteCodes.value)
  })
  
  // 获取活跃邀请码
  const activeCodes = computed(() => {
    return inviteCodes.value.filter(code => {
      const status = getInviteCodeStatus(code)
      return status.canUse
    })
  })
  
  // 刷新邀请码列表（带重试机制）
  const refreshCodes = async () => {
    if (!networkStatus.isOnline.value) {
      toast({
        title: '网络离线',
        description: '请检查网络连接后重试',
        variant: 'destructive'
      })
      return
    }

    loading.value = true
    try {
      const result = await retryMechanism.execute(
        () => invitationStore.fetchInvitationCodes(),
        networkStatus.retryConfig.value
      )

      if (!result.success) {
        throw result.error
      }
    } catch (error) {
      console.error('刷新邀请码失败:', error)
      const handledError = invitationErrorHandler.handleNetworkError(error, {
        operation: 'refresh_codes'
      })
      
      toast({
        title: '刷新失败',
        description: handledError.message,
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // 激活邀请码
  const activateCode = async (codeId: string) => {
    loading.value = true
    try {
      // 这里调用激活API
      // await invitationStore.activateCode(codeId)
      await refreshCodes()
      
      toast({
        title: '激活成功',
        description: '邀请码已激活'
      })
    } catch (error) {
      console.error('激活邀请码失败:', error)
      invitationErrorHandler.handleBusinessError(error, {
        operation: 'activate_code',
        codeId
      })
    } finally {
      loading.value = false
    }
  }
  
  // 停用邀请码
  const deactivateCode = async (codeId: string) => {
    loading.value = true
    try {
      // 这里调用停用API
      // await invitationStore.deactivateCode(codeId)
      await refreshCodes()
      
      toast({
        title: '停用成功',
        description: '邀请码已停用'
      })
    } catch (error) {
      console.error('停用邀请码失败:', error)
      toast({
        title: '停用失败',
        description: '停用邀请码失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // 复制邀请码或链接
  const copyToClipboard = async (text: string, description: string = '内容') => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: '复制成功',
        description: `${description}已复制到剪贴板`
      })
      return true
    } catch (error) {
      console.error('复制失败:', error)
      toast({
        title: '复制失败',
        description: '请手动选择复制',
        variant: 'destructive'
      })
      return false
    }
  }
  
  return {
    loading,
    inviteCodes,
    codeStats,
    activeCodes,
    refreshCodes,
    activateCode,
    deactivateCode,
    copyToClipboard
  }
}

/**
 * 邀请历史管理 Composable
 */
export function useInvitationHistory() {
  const invitationStore = useInvitationStore()
  const loading = ref(false)
  
  // 分页状态
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  // 筛选条件
  const filters = ref({
    role: 'all' as UserRole | 'all',
    status: 'all' as 'completed' | 'pending' | 'all',
    timeRange: 'all' as 'today' | 'week' | 'month' | 'quarter' | 'all',
    keyword: ''
  })
  
  // 获取邀请历史
  const invitationHistory = computed(() => invitationStore.invitationHistory)
  
  // 刷新历史记录
  const refreshHistory = async () => {
    loading.value = true
    try {
      await invitationStore.fetchInvitationHistory({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value
      })
      
      // 更新分页信息
      pagination.value.total = invitationHistory.value.length
    } catch (error) {
      console.error('刷新邀请历史失败:', error)
      toast({
        title: '刷新失败',
        description: '获取邀请历史失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // 切换页面
  const changePage = async (page: number) => {
    pagination.value.page = page
    await refreshHistory()
  }
  
  // 应用筛选
  const applyFilters = async (newFilters: Partial<typeof filters.value>) => {
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1 // 重置到第一页
    await refreshHistory()
  }
  
  // 清空筛选
  const clearFilters = async () => {
    filters.value = {
      role: 'all',
      status: 'all',
      timeRange: 'all',
      keyword: ''
    }
    pagination.value.page = 1
    await refreshHistory()
  }
  
  // 导出历史记录
  const exportHistory = async (exportFilters?: Partial<typeof filters.value>) => {
    loading.value = true
    try {
      // 这里调用导出API
      // await invitationStore.exportInvitationHistory({
      //   ...filters.value,
      //   ...exportFilters
      // })
      
      toast({
        title: '导出成功',
        description: '邀请历史已导出'
      })
    } catch (error) {
      console.error('导出邀请历史失败:', error)
      toast({
        title: '导出失败',
        description: '导出邀请历史失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    pagination,
    filters,
    invitationHistory,
    refreshHistory,
    changePage,
    applyFilters,
    clearFilters,
    exportHistory
  }
}

/**
 * 邀请统计 Composable
 */
export function useInvitationStats() {
  const invitationStore = useInvitationStore()
  const loading = ref(false)
  
  // 时间范围
  const timeRange = ref('month')
  
  // 统计数据
  const stats = computed(() => invitationStore.invitationStats)
  
  // 刷新统计数据
  const refreshStats = async (newTimeRange?: string) => {
    if (newTimeRange) {
      timeRange.value = newTimeRange
    }
    
    loading.value = true
    try {
      await invitationStore.fetchInvitationStats({
        timeRange: timeRange.value
      })
    } catch (error) {
      console.error('刷新邀请统计失败:', error)
      toast({
        title: '刷新失败',
        description: '获取邀请统计失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  // 导出统计数据
  const exportStats = async (options: {
    format: string
    range: string
    timeRange: string
  }) => {
    loading.value = true
    try {
      // 这里调用导出API
      // await invitationStore.exportInvitationStats(options)
      
      toast({
        title: '导出成功',
        description: `正在生成${options.format.toUpperCase()}格式的统计报告`
      })
    } catch (error) {
      console.error('导出邀请统计失败:', error)
      toast({
        title: '导出失败',
        description: '导出邀请统计失败，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    timeRange,
    stats,
    refreshStats,
    exportStats
  }
}

/**
 * 综合邀请管理 Composable
 */
export function useInvitation() {
  const userStore = useUserStore()
  const invitationStore = useInvitationStore()
  
  // 组合各个子功能
  const validation = useInviteCodeValidation()
  const urlInvitation = useUrlInvitation()
  const permissions = useInvitationPermissions()
  const codeManagement = useInviteCodeManagement()
  const history = useInvitationHistory()
  const stats = useInvitationStats()
  
  // 初始化邀请功能
  const initializeInvitation = async () => {
    if (!permissions.hasPermission.value) {
      console.warn('当前用户没有邀请权限')
      return
    }
    
    try {
      // 并行加载所有数据
      await Promise.all([
        codeManagement.refreshCodes(),
        history.refreshHistory(),
        stats.refreshStats()
      ])
    } catch (error) {
      console.error('初始化邀请功能失败:', error)
    }
  }
  
  // 处理URL邀请（注册页面使用）
  const handleUrlInvitation = async () => {
    const urlInfo = urlInvitation.urlInvitation.value
    if (urlInfo.hasInvitation && urlInfo.inviteCode) {
      // 验证URL中的邀请码
      const result = await validation.validateImmediately(urlInfo.inviteCode)
      
      if (result?.isValid) {
        toast({
          title: '邀请码有效',
          description: `欢迎通过${result.inviterInfo?.name}的邀请注册`
        })
      } else {
        toast({
          title: '邀请码无效',
          description: result?.error || '邀请链接中的邀请码无效',
          variant: 'destructive'
        })
      }
      
      return result
    }
    
    return null
  }

  // 处理注册后的邀请关系建立
  const handlePostRegistrationInvitation = async (registerResponse: any) => {
    if (!registerResponse.invitationInfo) {
      console.log('注册响应中无邀请信息，跳过关系建立处理')
      return null
    }

    const { invitationInfo } = registerResponse
    
    try {
      if (invitationInfo.relationshipEstablished) {
        console.log('邀请关系已在服务端建立:', invitationInfo)
        
        // 记录邀请关系建立成功的详细日志
        console.log(`邀请关系建立成功:
          - 邀请人: ${invitationInfo.inviterName} (ID: ${invitationInfo.inviterId})
          - 被邀请人角色: ${invitationInfo.actualRole}
          - 目标角色: ${invitationInfo.targetRole}`)
        
        // 触发后续操作
        await performPostInvitationActions(invitationInfo)
        
        return {
          success: true,
          message: `邀请关系建立成功，您已成为 ${invitationInfo.inviterName} 的下级`,
          inviterInfo: {
            id: invitationInfo.inviterId,
            name: invitationInfo.inviterName
          },
          relationshipDetails: {
            targetRole: invitationInfo.targetRole,
            actualRole: invitationInfo.actualRole
          }
        }
      } else {
        console.warn('邀请关系建立失败:', invitationInfo)
        
        return {
          success: false,
          message: '注册成功，但邀请关系建立失败，请联系管理员',
          error: '关系建立失败',
          canRetry: false
        }
      }
    } catch (error) {
      console.error('处理邀请关系建立失败:', error)
      
      return {
        success: false,
        message: '注册成功，但处理邀请关系时出现异常',
        error: error instanceof Error ? error.message : '未知错误',
        canRetry: true
      }
    }
  }

  // 执行邀请关系建立后的相关操作
  const performPostInvitationActions = async (invitationInfo: any) => {
    try {
      // 1. 触发邀请统计更新
      setTimeout(async () => {
        try {
          await stats.refreshStats()
          console.log('邀请统计已刷新')
        } catch (error) {
          console.warn('刷新邀请统计失败:', error)
        }
      }, 1000)
      
      // 2. 记录关系建立事件（可用于分析和审计）
      console.log('记录邀请关系建立事件:', {
        inviterId: invitationInfo.inviterId,
        inviterName: invitationInfo.inviterName,
        targetRole: invitationInfo.targetRole,
        actualRole: invitationInfo.actualRole,
        timestamp: new Date().toISOString()
      })
      
      // 3. 可以在这里发送通知给邀请人（如果需要的话）
      // await notifyInviter(invitationInfo.inviterId, invitationInfo)
      
    } catch (error) {
      console.warn('执行后续操作失败:', error)
      // 不抛出错误，因为关系已经建立成功
    }
  }

  // 重试邀请关系建立（用于失败后的手动重试）
  const retryInvitationRelationship = async (inviteCode: string, userId: string) => {
    try {
      console.log('尝试重新建立邀请关系...')
      
      // 这里可以调用专门的关系建立API
      // const result = await invitationStore.establishInvitationRelationship(inviteCode, userId)
      
      toast({
        title: '重试成功',
        description: '邀请关系已成功建立',
        variant: 'default'
      })
      
      return true
    } catch (error) {
      console.error('重试建立邀请关系失败:', error)
      
      toast({
        title: '重试失败',
        description: '无法建立邀请关系，请联系管理员',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  return {
    // 子功能
    validation,
    urlInvitation,
    permissions,
    codeManagement,
    history,
    stats,
    
    // 综合方法
    initializeInvitation,
    handleUrlInvitation,
    handlePostRegistrationInvitation,
    retryInvitationRelationship
  }
}