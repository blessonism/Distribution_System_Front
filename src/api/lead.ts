import { http } from '@/utils/request'
import type { Lead } from '@/types/lead'

/**
 * 获取客资列表
 * @param params 查询参数
 */
export function getLeads(params?: any): Promise<{ list: Lead[]; total: number }> {
  return http.get('/leads/all', { params })
}

/**
 * 为客资分配销售
 * @param leadId 客资ID
 * @param salespersonId 销售ID
 */
export function assignLead(leadId: string, salespersonId: string): Promise<null> {
  return http.put(`/leads/${leadId}/assign`, { salespersonId })
}

/**
 * 更新客资状态
 * @param leadId 客资ID
 * @param status 新的状态
 */
export function updateLeadStatus(leadId: string, status: string): Promise<null> {
  return http.put(`/leads/${leadId}/status`, { status })
}

/**
 * 创建新客资
 * @param leadData 客资数据
 */
export function createLead(leadData: Partial<Lead>): Promise<Lead> {
  return http.post('/leads/create', leadData)
}

/**
 * 更新客资信息
 * @param leadId 客资ID
 * @param leadData 更新的客资数据
 */
export function updateLead(leadId: string, leadData: Partial<Lead>): Promise<Lead> {
  return http.put(`/leads/${leadId}`, leadData)
} 