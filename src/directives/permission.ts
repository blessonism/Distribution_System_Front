/**
 * Vue权限控制指令
 * 用于在模板中自动隐藏或禁用无权限的元素
 */
import type { Directive, App } from 'vue'
import type { UserRole } from '@/types/api'
import { InvitationPermissionController, PermissionCheck } from '@/utils/permissionControl'
import { useUserStore } from '@/store/user'

/**
 * 权限指令选项接口
 */
export interface PermissionDirectiveOptions {
  /** 操作类型 */
  operation?: string
  /** 目标角色（用于邀请权限检查） */
  targetRole?: UserRole
  /** 权限检查失败时的行为 */
  fallback?: 'hide' | 'disable' | 'readonly'
  /** 自定义权限检查函数 */
  customCheck?: (userRole: UserRole) => boolean
  /** 权限不足时的提示信息 */
  tooltip?: string
}

/**
 * 权限检查函数
 */
function checkPermission(
  userRole: UserRole | undefined,
  options: PermissionDirectiveOptions
): boolean {
  if (!userRole) {
    return false
  }

  // 使用自定义检查函数
  if (options.customCheck) {
    return options.customCheck(userRole)
  }

  // 检查操作权限
  if (options.operation) {
    const result = InvitationPermissionController.checkOperationPermission(userRole, options.operation)
    if (!result.hasPermission) {
      return false
    }
  }

  // 检查邀请权限
  if (options.targetRole) {
    const result = InvitationPermissionController.checkInvitationPermission(userRole, options.targetRole)
    if (!result.hasPermission) {
      return false
    }
  }

  return true
}

/**
 * 应用权限控制效果
 */
function applyPermissionEffect(
  el: HTMLElement,
  hasPermission: boolean,
  options: PermissionDirectiveOptions
): void {
  const fallback = options.fallback || 'hide'

  if (hasPermission) {
    // 恢复元素状态
    el.style.display = ''
    el.removeAttribute('disabled')
    el.removeAttribute('readonly')
    el.classList.remove('permission-denied')
    
    // 移除权限相关的属性
    el.removeAttribute('data-permission-denied')
    el.removeAttribute('title')
  } else {
    // 应用权限限制
    el.setAttribute('data-permission-denied', 'true')
    el.classList.add('permission-denied')

    // 添加提示信息
    if (options.tooltip) {
      el.setAttribute('title', options.tooltip)
    }

    switch (fallback) {
      case 'hide':
        el.style.display = 'none'
        break
      case 'disable':
        if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
          ;(el as HTMLInputElement | HTMLButtonElement).disabled = true
        } else {
          el.style.opacity = '0.5'
          el.style.pointerEvents = 'none'
        }
        break
      case 'readonly':
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          ;(el as HTMLInputElement).readOnly = true
        } else {
          el.style.opacity = '0.7'
          el.style.pointerEvents = 'none'
        }
        break
    }
  }
}

/**
 * 解析指令值
 */
function parseDirectiveValue(value: any): PermissionDirectiveOptions {
  if (typeof value === 'string') {
    return { operation: value }
  }
  
  if (typeof value === 'object' && value !== null) {
    return value
  }
  
  return {}
}

/**
 * v-permission 指令定义
 */
export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    const options = parseDirectiveValue(binding.value)
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    const hasPermission = checkPermission(userRole, options)
    applyPermissionEffect(el, hasPermission, options)
  },

  updated(el: HTMLElement, binding) {
    const options = parseDirectiveValue(binding.value)
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    const hasPermission = checkPermission(userRole, options)
    applyPermissionEffect(el, hasPermission, options)
  }
}

/**
 * v-can 指令 - 简化的权限检查指令
 * 用法: v-can="'operation'" 或 v-can="{ operation: 'xxx', targetRole: 'xxx' }"
 */
export const canDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    if (!userRole) {
      el.style.display = 'none'
      return
    }

    let hasPermission = false

    if (typeof binding.value === 'string') {
      // 简单操作权限检查
      const result = InvitationPermissionController.checkOperationPermission(userRole, binding.value)
      hasPermission = result.hasPermission
    } else if (typeof binding.value === 'object') {
      // 复杂权限检查
      const options = binding.value as PermissionDirectiveOptions
      hasPermission = checkPermission(userRole, options)
    }

    if (!hasPermission) {
      el.style.display = 'none'
    }
  },

  updated(el: HTMLElement, binding) {
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    if (!userRole) {
      el.style.display = 'none'
      return
    }

    let hasPermission = false

    if (typeof binding.value === 'string') {
      const result = InvitationPermissionController.checkOperationPermission(userRole, binding.value)
      hasPermission = result.hasPermission
    } else if (typeof binding.value === 'object') {
      const options = binding.value as PermissionDirectiveOptions
      hasPermission = checkPermission(userRole, options)
    }

    el.style.display = hasPermission ? '' : 'none'
  }
}

/**
 * v-role 指令 - 基于角色的显示控制
 * 用法: v-role="'admin'" 或 v-role="['admin', 'director']"
 */
export const roleDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    if (!userRole) {
      el.style.display = 'none'
      return
    }

    const allowedRoles = Array.isArray(binding.value) ? binding.value : [binding.value]
    const hasRole = allowedRoles.includes(userRole)
    
    if (!hasRole) {
      el.style.display = 'none'
    }
  },

  updated(el: HTMLElement, binding) {
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role as UserRole
    
    if (!userRole) {
      el.style.display = 'none'
      return
    }

    const allowedRoles = Array.isArray(binding.value) ? binding.value : [binding.value]
    const hasRole = allowedRoles.includes(userRole)
    
    el.style.display = hasRole ? '' : 'none'
  }
}

/**
 * 安装权限指令插件
 */
export function installPermissionDirectives(app: App): void {
  app.directive('permission', permissionDirective)
  app.directive('can', canDirective)
  app.directive('role', roleDirective)
}

/**
 * 权限指令工具函数
 */
export const PermissionDirectiveUtils = {
  /**
   * 检查元素是否被权限限制
   */
  isPermissionDenied(el: HTMLElement): boolean {
    return el.getAttribute('data-permission-denied') === 'true'
  },

  /**
   * 清除权限限制
   */
  clearPermissionRestriction(el: HTMLElement): void {
    el.style.display = ''
    el.removeAttribute('disabled')
    el.removeAttribute('readonly')
    el.classList.remove('permission-denied')
    el.removeAttribute('data-permission-denied')
    el.removeAttribute('title')
    el.style.opacity = ''
    el.style.pointerEvents = ''
  },

  /**
   * 手动应用权限检查
   */
  applyPermissionCheck(
    el: HTMLElement,
    userRole: UserRole,
    options: PermissionDirectiveOptions
  ): void {
    const hasPermission = checkPermission(userRole, options)
    applyPermissionEffect(el, hasPermission, options)
  }
}

/**
 * 默认导出
 */
export default {
  install: installPermissionDirectives
}