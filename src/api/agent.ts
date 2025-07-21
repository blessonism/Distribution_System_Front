import { http } from '@/utils/request';
import type { Agent, AgentQueryParams, CreateAgentParams, UpdateAgentParams, AgentPerformance, AgentPerformanceQueryParams } from '@/types/agent';

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
  getAgentPerformance: (id: string, params?: AgentPerformanceQueryParams): Promise<AgentPerformance> => {
    console.log('[API] 调用获取业绩数据:', id, params);
    return http.get(`/agents/${id}/performance`, { params })
      .then(response => {
        console.log('[API] 获取到的原始业绩数据:', response);
        // 确保response中有trendData
        if (!response.trendData && params?.includeTrend) {
          console.error('[API] 响应缺少trendData属性!');
        }
        return response;
      })
      .catch(error => {
        console.error('[API] 获取业绩数据失败:', error);
        throw error;
      });
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