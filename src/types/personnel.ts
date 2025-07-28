/**
 * @fileoverview 人员管理类型定义
 * 定义分销系统中人员管理相关的核心类型接口和枚举
 * 包含组织架构树形结构、角色权限体系和人员层级关系等完整功能模块
 * 支持多层级组织架构管理、动态树形展示和权限控制等高级功能
 * 
 * @module types/personnel
 * @author Frontend Team
 * @since 1.0.0
 */

/**
 * 人员角色类型枚举
 * 定义分销系统中不同层级的人员角色，用于权限控制和组织架构管理
 * 
 * @typedef {'director' | 'manager' | 'sales' | 'agent'} PersonnelRole
 * 
 * 角色说明：
 * - director: 总监级别 - 最高管理权限，可管理所有下级人员和业务
 * - manager: 经理级别 - 中层管理权限，管理销售团队和代理商
 * - sales: 销售人员 - 一线销售权限，负责客户开发和维护
 * - agent: 代理商 - 合作伙伴权限，推广产品获取佣金
 * 
 * @example
 * ```typescript
 * const topRole: PersonnelRole = 'director'
 * const teamLead: PersonnelRole = 'manager'
 * const frontline: PersonnelRole = 'sales'
 * const partner: PersonnelRole = 'agent'
 * 
 * // 角色权限检查
 * function hasManagementPermission(role: PersonnelRole): boolean {
 *   return ['director', 'manager'].includes(role)
 * }
 * 
 * // 角色层级比较
 * function isHigherRole(role1: PersonnelRole, role2: PersonnelRole): boolean {
 *   const hierarchy = { director: 4, manager: 3, sales: 2, agent: 1 }
 *   return hierarchy[role1] > hierarchy[role2]
 * }
 * ```
 */
export type PersonnelRole = 'director' | 'manager' | 'sales' | 'agent';

/**
 * 树形节点数据接口
 * 定义组织架构树形结构中单个节点的完整信息，支持动态加载和层级展示
 * 用于构建多层级组织架构管理界面和权限控制体系
 * 
 * @interface TreeNodeData
 * 
 * @complexity O(1) - 单个节点数据结构，常数时间复杂度访问
 * @flow 数据加载 → 节点渲染 → 子节点展开 → 权限验证 → 交互响应
 * 
 * @example
 * ```typescript
 * const rootNode: TreeNodeData = {
 *   id: 'director_001',
 *   name: '张总监',
 *   role: 'director',
 *   phone: '13800138000',
 *   parentId: null,
 *   hasChildren: true,
 *   children: [
 *     {
 *       id: 'manager_001',
 *       name: '李经理',
 *       role: 'manager',
 *       phone: '13800138001',
 *       parentId: 'director_001',
 *       hasChildren: true,
 *       children: undefined,
 *       isLoading: false
 *     }
 *   ]
 * }
 * 
 * // 树形结构遍历
 * function findNodeById(root: TreeNodeData, targetId: string): TreeNodeData | null {
 *   if (root.id === targetId) return root
 *   if (root.children) {
 *     for (const child of root.children) {
 *       const found = findNodeById(child, targetId)
 *       if (found) return found
 *     }
 *   }
 *   return null
 * }
 * 
 * // 计算节点层级
 * function getNodeLevel(node: TreeNodeData, root: TreeNodeData): number {
 *   let level = 0
 *   let current = node
 *   while (current.parentId && current.parentId !== root.id) {
 *     level++
 *     current = findNodeById(root, current.parentId) || current
 *   }
 *   return level
 * }
 * 
 * // 获取节点路径
 * function getNodePath(node: TreeNodeData, root: TreeNodeData): string[] {
 *   const path: string[] = []
 *   let current = node
 *   while (current) {
 *     path.unshift(current.name)
 *     if (!current.parentId) break
 *     current = findNodeById(root, current.parentId) || current
 *   }
 *   return path
 * }
 * ```
 */
export interface TreeNodeData {
  /** 节点唯一标识ID */
  id: string;
  /** 人员姓名 */
  name: string;
  /** 人员角色类型 */
  role: PersonnelRole;
  /** 联系电话 */
  phone: string;
  /** 父节点ID，根节点为null */
  parentId: string | null;
  /** 子节点数组，未加载时为undefined */
  children?: TreeNodeData[];
  /** 是否有子节点，用于显示展开图标 */
  hasChildren: boolean;
  /** 是否正在加载子节点，用于显示加载状态 */
  isLoading?: boolean;
} 