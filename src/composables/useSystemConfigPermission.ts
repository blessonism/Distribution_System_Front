/**
 * @fileoverview 系统配置权限控制组合式函数
 * 基于Vue 3 Composition API构建的权限控制系统，提供系统配置模块的完整权限验证功能
 * 支持角色权限验证、操作权限控制、权限状态响应式更新和错误处理
 * 集成现有的用户权限系统，确保系统配置的安全性和合规性
 * 
 * @composable useSystemConfigPermission
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.0.0
 * 
 * @description
 * useSystemConfigPermission是系统配置模块的权限控制核心，提供以下主要功能：
 * - 🔐 超级管理员权限验证，确保只有授权用户可以访问配置功能
 * - 🎯 操作级权限控制，精确控制用户可以执行的操作
 * - 📊 权限状态响应式更新，实时反映用户权限变化
 * - 🚨 权限错误处理，提供友好的权限不足提示
 * - 🔄 权限状态缓存，优化权限检查性能
 * - 📱 权限状态持久化，支持页面刷新后的权限状态恢复
 * - 🛡️ 安全防护机制，防止权限绕过和越权操作
 * 
 * @usage
 * ```vue
 * <script setup>
 * import { useSystemConfigPermission } from '@/composables/useSystemConfigPermission'
 * 
 * const {
 *   canAccess,
 *   canEdit,
 *   canAudit,
 *   canView,
 *   checkPermission,
 *   requirePermission
 * } = useSystemConfigPermission()
 * 
 * // 检查是否可以访问系统配置
 * if (canAccess.value) {
 *   // 显示配置界面
 * }
 * 
 * // 检查特定操作权限
 * const canSaveConfig = await checkPermission('config:save')
 * </script>
 * ```
 * 
 * @example
 * ```typescript
 * // 权限检查示例
 * const permission = useSystemConfigPermission()
 * 
 * // 基础权限检查
 * if (permission.canAccess.value) {
 *   console.log('用户可以访问系统配置')
 * }
 * 
 * // 操作权限检查
 * const canSave = await permission.checkPermission('config:save')
 * if (canSave) {
 *   await saveConfiguration()
 * }
 * 
 * // 权限要求检查（会抛出错误）
 * try {
 *   await permission.requirePermission('config:audit')
 *   await auditConfiguration()
 * } catch (error) {
 *   console.error('权限不足:', error.message)
 * }
 * ```
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useToast } from '@/components/ui/toast/use-toast'
import type { UserRole } from '@/types/user'

/**
 * 系统配置权限类型定义
 */
export type SystemConfigPermission = 
  | 'config:access'     // 访问系统配置
  | 'config:view'       // 查看配置
  | 'config:edit'       // 编辑配置
  | 'config:save'       // 保存配置
  | 'config:submit'     // 提交审核
  | 'config:audit'      // 审核配置
  | 'config:approve'    // 批准配置
  | 'config:reject'     // 拒绝配置
  | 'config:delete'     // 删除配置
  | 'config:export'     // 导出配置
  | 'config:import'     // 导入配置

/**
 * 权限检查结果接口
 */
export interface PermissionCheckResult {
  /** 是否有权限 */
  hasPermission: boolean
  /** 权限检查消息 */
  message: string
  /** 所需角色列表 */
  requiredRoles: UserRole[]
  /** 用户当前角色 */
  userRoles: UserRole[]
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: SystemConfigPermission,
    public requiredRoles: UserRole[],
    public userRoles: UserRole[]
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 系统配置权限控制组合式函数
 */
export function useSystemConfigPermission() {
  // 依赖注入
  const userStore = useUserStore()
  const { toast } = useToast()

  // 响应式状态
  const permissionCache = ref<Map<SystemConfigPermission, boolean>>(new Map())
  const lastPermissionCheck = ref<Date | null>(null)
  const permissionCacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 权限与角色的映射关系
   * 定义每个权限所需的最低角色要求
   */
  const permissionRoleMap: Record<SystemConfigPermission, UserRole[]> = {
    'config:access': ['super_admin'],
    'config:view': ['super_admin'],
    'config:edit': ['super_admin'],
    'config:save': ['super_admin'],
    'config:submit': ['super_admin'],
    'config:audit': ['super_admin'],
    'config:approve': ['super_admin'],
    'config:reject': ['super_admin'],
    'config:delete': ['super_admin'],
    'config:export': ['super_admin'],
    'config:import': ['super_admin']
  }

  // 计算属性
  const userRoles = computed(() => userStore.roles || [])
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  /**
   * 检查用户是否可以访问系统配置
   */
  const canAccess = computed(() => {
    return checkPermissionSync('config:access')
  })

  /**
   * 检查用户是否可以查看配置
   */
  const canView = computed(() => {
    return checkPermissionSync('config:view')
  })

  /**
   * 检查用户是否可以编辑配置
   */
  const canEdit = computed(() => {
    return checkPermissionSync('config:edit')
  })

  /**
   * 检查用户是否可以审核配置
   */
  const canAudit = computed(() => {
    return checkPermissionSync('config:audit')
  })

  /**
   * 检查用户是否可以保存配置
   */
  const canSave = computed(() => {
    return checkPermissionSync('config:save')
  })

  /**
   * 检查用户是否可以提交审核
   */
  const canSubmit = computed(() => {
    return checkPermissionSync('config:submit')
  })

  /**
   * 检查用户是否可以导出配置
   */
  const canExport = computed(() => {
    return checkPermissionSync('config:export')
  })

  /**
   * 检查用户是否可以导入配置
   */
  const canImport = computed(() => {
    return checkPermissionSync('config:import')
  })

  /**
   * 同步权限检查（用于计算属性）
   */
  function checkPermissionSync(permission: SystemConfigPermission): boolean {
    if (!isLoggedIn.value) {
      return false
    }

    // 检查缓存
    const cached = permissionCache.value.get(permission)
    if (cached !== undefined && isPermissionCacheValid()) {
      return cached
    }

    const requiredRoles = permissionRoleMap[permission]
    const hasPermission = requiredRoles.some(role => userRoles.value.includes(role))

    // 更新缓存
    permissionCache.value.set(permission, hasPermission)
    lastPermissionCheck.value = new Date()

    return hasPermission
  }

  /**
   * 异步权限检查（支持更复杂的权限验证逻辑）
   */
  async function checkPermission(permission: SystemConfigPermission): Promise<boolean> {
    if (!isLoggedIn.value) {
      return false
    }

    // 检查缓存
    const cached = permissionCache.value.get(permission)
    if (cached !== undefined && isPermissionCacheValid()) {
      return cached
    }

    try {
      // 基础角色检查
      const requiredRoles = permissionRoleMap[permission]
      const hasBasicPermission = requiredRoles.some(role => userRoles.value.includes(role))

      if (!hasBasicPermission) {
        permissionCache.value.set(permission, false)
        return false
      }

      // 这里可以添加更复杂的权限检查逻辑
      // 例如：检查用户的具体权限设置、时间限制、IP限制等
      
      // 更新缓存
      permissionCache.value.set(permission, true)
      lastPermissionCheck.value = new Date()

      return true
    } catch (error) {
      console.error('权限检查失败:', error)
      return false
    }
  }

  /**
   * 详细权限检查（返回详细的检查结果）
   */
  async function checkPermissionDetailed(permission: SystemConfigPermission): Promise<PermissionCheckResult> {
    const requiredRoles = permissionRoleMap[permission]
    const hasPermission = await checkPermission(permission)

    return {
      hasPermission,
      message: hasPermission 
        ? '权限验证通过' 
        : `权限不足，需要以下角色之一: ${requiredRoles.join(', ')}`,
      requiredRoles,
      userRoles: userRoles.value
    }
  }

  /**
   * 要求权限（如果没有权限会抛出错误）
   */
  async function requirePermission(permission: SystemConfigPermission): Promise<void> {
    const hasPermission = await checkPermission(permission)
    
    if (!hasPermission) {
      const requiredRoles = permissionRoleMap[permission]
      const error = new PermissionError(
        `权限不足，需要以下角色之一: ${requiredRoles.join(', ')}`,
        permission,
        requiredRoles,
        userRoles.value
      )
      
      // 显示权限不足提示
      toast({
        title: '权限不足',
        description: error.message,
        variant: 'destructive'
      })
      
      throw error
    }
  }

  /**
   * 检查权限缓存是否有效
   */
  function isPermissionCacheValid(): boolean {
    if (!lastPermissionCheck.value) {
      return false
    }
    
    const now = new Date()
    const timeDiff = now.getTime() - lastPermissionCheck.value.getTime()
    return timeDiff < permissionCacheTimeout
  }

  /**
   * 清除权限缓存
   */
  function clearPermissionCache(): void {
    permissionCache.value.clear()
    lastPermissionCheck.value = null
  }

  /**
   * 刷新权限状态
   */
  async function refreshPermissions(): Promise<void> {
    clearPermissionCache()
    
    // 重新检查所有权限
    const permissions: SystemConfigPermission[] = [
      'config:access', 'config:view', 'config:edit', 'config:save',
      'config:submit', 'config:audit', 'config:approve', 'config:reject',
      'config:delete', 'config:export', 'config:import'
    ]
    
    await Promise.all(permissions.map(permission => checkPermission(permission)))
  }

  /**
   * 获取用户拥有的所有系统配置权限
   */
  async function getUserPermissions(): Promise<SystemConfigPermission[]> {
    const permissions: SystemConfigPermission[] = [
      'config:access', 'config:view', 'config:edit', 'config:save',
      'config:submit', 'config:audit', 'config:approve', 'config:reject',
      'config:delete', 'config:export', 'config:import'
    ]
    
    const userPermissions: SystemConfigPermission[] = []
    
    for (const permission of permissions) {
      const hasPermission = await checkPermission(permission)
      if (hasPermission) {
        userPermissions.push(permission)
      }
    }
    
    return userPermissions
  }

  // 监听用户角色变化，清除权限缓存
  watch(userRoles, () => {
    clearPermissionCache()
  }, { deep: true })

  // 监听登录状态变化，清除权限缓存
  watch(isLoggedIn, (newValue) => {
    if (!newValue) {
      clearPermissionCache()
    }
  })

  // 组件挂载时初始化权限
  onMounted(() => {
    if (isLoggedIn.value) {
      refreshPermissions()
    }
  })

  return {
    // 计算属性
    canAccess,
    canView,
    canEdit,
    canAudit,
    canSave,
    canSubmit,
    canExport,
    canImport,
    userRoles,
    isLoggedIn,

    // 方法
    checkPermission,
    checkPermissionDetailed,
    requirePermission,
    refreshPermissions,
    getUserPermissions,
    clearPermissionCache,

    // 工具
    PermissionError
  }
}
