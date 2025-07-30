/**
 * 角色菜单配置
 * 定义不同角色用户的默认路由路径
 */

export type UserRole = 
  | 'super_admin' 
  | 'director' 
  | 'leader' 
  | 'sales' 
  | 'agent'
  | string

/**
 * 角色默认路径映射
 */
const roleDefaultPaths: Record<string, string> = {
  super_admin: '/dashboard',
  director: '/dashboard', 
  leader: '/dashboard',
  sales: '/dashboard',
  agent: '/lead/list', // 代理角色默认跳转到客资列表
  default: '/dashboard'
}

/**
 * 获取用户角色对应的默认首页路径
 * @param role 用户角色
 * @returns 默认路径
 */
export function getUserDefaultPath(role: UserRole): string {
  return roleDefaultPaths[role] || roleDefaultPaths.default
}

/**
 * 检查角色是否为高级管理角色
 * @param role 用户角色
 * @returns 是否为高级角色
 */
export function isHighLevelRole(role: UserRole): boolean {
  return ['super_admin', 'director', 'leader', 'sales'].includes(role)
}