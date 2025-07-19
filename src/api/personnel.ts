import request from '@/utils/request'
import type { TreeNodeData } from '@/types/personnel'
import type { ApiResponse } from '@/types/api'

/**
 * 根据父节点ID获取子节点列表
 * @param parentId 父节点ID，如果为空则获取顶层节点
 * @returns 
 */
export function getPersonnelChildren(parentId: string | null = null): Promise<ApiResponse<TreeNodeData[]>> {
  return request({
    url: '/api/users/hierarchy',
    method: 'get',
    params: { parentId }
  })
} 