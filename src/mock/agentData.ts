import { MockMethod } from 'vite-plugin-mock'
import { AgentStatus, AgentCategory, AgentLevel } from '@/types/agent'
import mockjs from 'mockjs'
import dayjs from 'dayjs'

// 从mockjs中获取Random
const { Random } = mockjs

// 生成代理数据
const generateAgents = (count: number) => {
  const agents = []
  const statuses = Object.values(AgentStatus)
  const categories = Object.values(AgentCategory)
  const levels = Object.values(AgentLevel)

  for (let i = 0; i < count; i++) {
    const createdAt = Random.datetime('yyyy-MM-dd HH:mm:ss')
    const updatedAt = dayjs(createdAt).add(Random.integer(1, 30), 'day').format('YYYY-MM-DD HH:mm:ss')
    const addedDate = Random.boolean() ? dayjs(createdAt).format('YYYY-MM-DD') : ''

    // 生成更合理的中文备注
    const noteTemplates = [
      '客户对我们的产品很感兴趣，后续需要持续跟进。',
      '已经介绍了主要产品功能，客户反馈良好。',
      '需要提供更多的价格优惠方案，客户比较关注成本问题。',
      '客户希望能够在下周安排一次详细的产品演示。',
      '初次沟通顺利，客户表示会考虑我们的方案。',
      '客户目前已有合作伙伴，但对我们的服务也很感兴趣。',
      '需要提供更详细的产品资料和案例分析。',
      '客户反馈我们的方案比较符合他们的需求，正在内部讨论。',
      '已安排下次跟进时间，客户态度积极。',
      '客户表示近期会做决定，需要持续保持联系。'
    ]
    
    const notes = Random.boolean() ? Random.pick(noteTemplates) : ''

    const agent = {
      id: `agent_${i + 1}`,
      name: Random.cname(),
      phone: Random.integer(13000000000, 19999999999).toString(),
      wechatName: Random.string('lower', 5, 10),
      redBookAccount: Random.boolean() ? `redbook_${Random.word(5, 8)}` : '',
      referrer: Random.boolean() ? Random.cname() : '',
      referralCode: Random.boolean() ? Random.string('lower', 5) : '',
      category: Random.pick(categories),
      level: Random.pick(levels),
      status: Random.pick(statuses),
      isAdded: Random.boolean(),
      isPosting: Random.boolean(),
      isIntercept: Random.boolean(),
      isAttracting: Random.boolean(),
      isInGroup: Random.boolean(),
      notes,
      addedDate,
      createdAt,
      updatedAt,
      
      // 添加权限相关字段
      groupId: `group_${Random.integer(1, 5)}`,
      groupName: `${Random.cword(2, 4)}组`,
      managerId: `manager_${Random.integer(1, 10)}`,
      managerName: Random.cname(),
    }

    agents.push(agent)
  }

  return agents
}

// 生成趋势数据
const generateTrendData = (period: string) => {
  // 根据周期生成不同数量的数据点
  let dataPoints = 30
  let format = 'MM-DD'
  
  switch (period) {
    case 'day':
      dataPoints = 24
      format = 'HH:mm'
      break
    case 'week':
      dataPoints = 7
      format = 'ddd'
      break
    case 'month':
      dataPoints = 30
      format = 'MM-DD'
      break
    case 'quarter':
      dataPoints = 12
      format = 'MM-DD'
      break
    case 'year':
      dataPoints = 12
      format = 'YYYY-MM'
      break
  }
  
  const labels: string[] = []
  const revenue: number[] = []
  const clients: number[] = []
  const commission: number[] = []
  
  // 生成起始日期
  let startDate = dayjs()
  
  if (period === 'day') {
    startDate = startDate.subtract(24, 'hour')
    // 生成24小时的数据
    for (let i = 0; i < dataPoints; i++) {
      const date = startDate.add(i, 'hour')
      labels.push(date.format(format))
      revenue.push(Random.integer(1000, 5000))
      clients.push(Random.integer(1, 10))
      commission.push(Random.integer(100, 500))
    }
  } else if (period === 'week') {
    startDate = startDate.subtract(7, 'day')
    // 生成7天的数据
    for (let i = 0; i < dataPoints; i++) {
      const date = startDate.add(i, 'day')
      labels.push(date.format(format))
      revenue.push(Random.integer(5000, 20000))
      clients.push(Random.integer(5, 30))
      commission.push(Random.integer(500, 2000))
    }
  } else if (period === 'month') {
    startDate = startDate.subtract(30, 'day')
    // 生成30天的数据
    for (let i = 0; i < dataPoints; i++) {
      const date = startDate.add(i, 'day')
      labels.push(date.format(format))
      revenue.push(Random.integer(8000, 30000))
      clients.push(Random.integer(10, 50))
      commission.push(Random.integer(800, 3000))
    }
  } else if (period === 'quarter') {
    startDate = startDate.subtract(12, 'week')
    // 生成12周的数据
    for (let i = 0; i < dataPoints; i++) {
      const date = startDate.add(i, 'week')
      labels.push(date.format(format))
      revenue.push(Random.integer(30000, 100000))
      clients.push(Random.integer(40, 200))
      commission.push(Random.integer(3000, 10000))
    }
  } else if (period === 'year') {
    startDate = startDate.subtract(12, 'month')
    // 生成12个月的数据
    for (let i = 0; i < dataPoints; i++) {
      const date = startDate.add(i, 'month')
      labels.push(date.format(format))
      revenue.push(Random.integer(100000, 500000))
      clients.push(Random.integer(100, 500))
      commission.push(Random.integer(10000, 50000))
    }
  }
  
  return {
    labels,
    revenue,
    clients,
    commission
  }
}

// 生成100个代理数据
const agents = generateAgents(100)

// 导出生成的代理数据，确保setupMock.ts可以使用
export const realAgentsData = agents;

// 定义mock接口
const mockAgentApis: MockMethod[] = [
  {
    url: '/api/agents',
    method: 'get',
    response: ({ query }) => {
      const { page = 1, pageSize = 10, keyword, status, category, level, isAdded, isPosting, isIntercept, isAttracting, isInGroup } = query
      
      let filteredAgents = [...agents]
      
      // 应用筛选条件
      if (keyword) {
        const regex = new RegExp(keyword, 'i')
        filteredAgents = filteredAgents.filter(agent => 
          regex.test(agent.name) || 
          regex.test(agent.phone) || 
          regex.test(agent.wechatName)
        )
      }
      
      if (status) {
        filteredAgents = filteredAgents.filter(agent => agent.status === status)
      }
      
      if (category) {
        filteredAgents = filteredAgents.filter(agent => agent.category === category)
      }
      
      if (level) {
        filteredAgents = filteredAgents.filter(agent => agent.level === level)
      }
      
      // 布尔值筛选
      if (isAdded !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isAdded === (isAdded === 'true'))
      }
      
      if (isPosting !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isPosting === (isPosting === 'true'))
      }
      
      if (isIntercept !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isIntercept === (isIntercept === 'true'))
      }
      
      if (isAttracting !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isAttracting === (isAttracting === 'true'))
      }
      
      if (isInGroup !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isInGroup === (isInGroup === 'true'))
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + parseInt(pageSize)
      const paginatedAgents = filteredAgents.slice(start, end)
      
      return {
        code: 0,
        message: 'success',
        data: paginatedAgents,
        total: filteredAgents.length,
      }
    },
  },
  
  {
    url: '/api/agents/:id',
    method: 'get',
    response: ({ params }) => {
      const { id } = params
      const agent = agents.find(item => item.id === id)
      
      if (!agent) {
        return {
          code: 404,
          message: 'Agent not found',
          data: null,
        }
      }
      
      return {
        code: 0,
        message: 'success',
        data: agent,
      }
    },
  },
  
  {
    url: '/api/agents/:id/performance',
    method: 'get',
    response: ({ params, query }) => {
      const { id } = params
      const { period = 'month', includeTrend = false } = query
      const agent = agents.find(item => item.id === id)
      
      if (!agent) {
        return {
          code: 404,
          message: 'Agent not found',
          data: null,
        }
      }
      
      // 生成基础业绩数据
      const performanceData = {
        clientsTotal: Random.integer(30, 200),
        validClients: Random.integer(20, 100),
        invalidClients: Random.integer(5, 50),
        pendingClients: Random.integer(5, 50),
        closedDeals: Random.integer(10, 80),
        totalRevenue: Random.integer(50000, 500000),
        commission: Random.integer(5000, 50000),
        baseSalary: Random.integer(5000, 15000),
        performance: Random.integer(0, 10000),
        periodStart: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        periodEnd: dayjs().format('YYYY-MM-DD'),
      }
      
      // 添加趋势数据
      if (includeTrend === 'true' || includeTrend === true) {
        performanceData.trendData = generateTrendData(period)
      }
      
      return {
        code: 0,
        message: 'success',
        data: performanceData,
      }
    },
  },
  
  {
    url: '/api/agents',
    method: 'post',
    response: ({ body }) => {
      const newAgent = {
        id: `agent_${agents.length + 1}`,
        ...body,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      
      agents.push(newAgent)
      
      return {
        code: 0,
        message: 'success',
        data: newAgent,
      }
    },
  },
  
  {
    url: '/api/agents/:id',
    method: 'put',
    response: ({ params, body }) => {
      const { id } = params
      const index = agents.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: 404,
          message: 'Agent not found',
          data: null,
        }
      }
      
      const updatedAgent = {
        ...agents[index],
        ...body,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      
      agents[index] = updatedAgent
      
      return {
        code: 0,
        message: 'success',
        data: updatedAgent,
      }
    },
  },
  
  {
    url: '/api/agents/:id',
    method: 'delete',
    response: ({ params }) => {
      const { id } = params
      const index = agents.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: 404,
          message: 'Agent not found',
          data: null,
        }
      }
      
      agents.splice(index, 1)
      
      return {
        code: 0,
        message: 'success',
      }
    },
  },
  
  {
    url: '/api/agents/batch-delete',
    method: 'post',
    response: ({ body }) => {
      const { ids } = body
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          code: 400,
          message: 'Invalid request',
          data: null,
        }
      }
      
      ids.forEach(id => {
        const index = agents.findIndex(item => item.id === id)
        if (index !== -1) {
          agents.splice(index, 1)
        }
      })
      
      return {
        code: 0,
        message: 'success',
      }
    },
  },
  
  {
    url: '/api/agents/export',
    method: 'get',
    response: () => {
      // 模拟导出文件，返回一个空Blob
      return new Blob(['mock export data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    },
  },
]

// 默认导出mock接口
export default mockAgentApis 