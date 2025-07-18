import { http } from '@/utils/request';
import type { Agent, AgentQueryParams, CreateAgentParams, UpdateAgentParams, AgentPerformance } from '@/types/agent';

interface AgentListResponse {
  data: Agent[];
  total: number;
}

export const agentApi = {
  // 获取代理列表
  getAgentList: (params: AgentQueryParams): Promise<AgentListResponse> => {
    return http.get('/agents', { params });
  },

  // 获取单个代理详情
  getAgent: (id: string): Promise<Agent> => {
    return http.get(`/agents/${id}`);
  },

  // 获取代理业绩数据
  getAgentPerformance: (id: string): Promise<AgentPerformance> => {
    return http.get(`/agents/${id}/performance`);
  },

  // 创建代理
  createAgent: (data: CreateAgentParams): Promise<Agent> => {
    return http.post('/agents', data);
  },

  // 更新代理
  updateAgent: (id: string, data: UpdateAgentParams): Promise<Agent> => {
    return http.put(`/agents/${id}`, data);
  },

  // 删除代理
  deleteAgent: (id: string): Promise<void> => {
    return http.delete(`/agents/${id}`);
  },

  // 批量删除代理
  batchDeleteAgents: (ids: string[]): Promise<void> => {
    return http.post('/agents/batch-delete', { ids });
  },

  // 导出代理数据
  exportAgents: (params: Partial<AgentQueryParams>): Promise<Blob> => {
    return http.get('/agents/export', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });
  }
}; 