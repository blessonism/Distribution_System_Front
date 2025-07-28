import request from '@/utils/request'
import type { TreeNodeData } from '@/types/personnel'
import type { ApiResponse } from '@/types/api'
import type { AxiosResponse } from 'axios'

/**
 * 人员层级管理相关 API 接口模块
 * 提供人员组织架构的树形结构查询功能
 * 
 * @namespace personnelApi
 */

/**
 * 根据父节点ID获取子节点列表接口
 * 用于构建人员组织架构的树形结构，支持懒加载方式逐级获取节点数据
 * 
 * @param {string | null} [parentId=null] - 父节点ID，如果为null或undefined则获取顶层根节点
 * @returns {Promise<AxiosResponse<ApiResponse<TreeNodeData[]>>>} 返回包含子节点数据的API响应
 * @throws {Error} 查询失败时抛出错误（父节点不存在、权限不足等）
 * @complexity O(n) - n为当前层级的子节点数量，单层查询复杂度
 * @flow 验证父节点权限 -> 查询直接子节点 -> 计算节点状态 -> 返回树形数据
 * 
 * @example
 * ```typescript
 * // 获取根节点（顶层部门）
 * const rootResponse = await getPersonnelChildren(null)
 * const rootNodes = rootResponse.data.data
 * 
 * // 获取指定部门的子部门和人员
 * const childResponse = await getPersonnelChildren('dept-123')
 * const childNodes = childResponse.data.data
 * 
 * // 树形结构展示
 * rootNodes.forEach(node => {
 *   console.log(`${node.name} (${node.type}) - 子节点数: ${node.childCount}`)
 * })
 * ```
 */
export function getPersonnelChildren(parentId: string | null = null): Promise<AxiosResponse<ApiResponse<TreeNodeData[]>>> {
  return request({
    url: '/api/users/hierarchy',
    method: 'get',
    params: { parentId }
  })
} 