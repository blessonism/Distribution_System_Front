<template>
  <div class="agent-detail-container">
    <!-- 添加返回按钮 -->
    <div class="mb-4 flex items-center">
      <Button variant="outline" size="sm" class="flex items-center gap-2" @click="$router.push('/agent/list')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-arrow-left"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
        返回代理列表
      </Button>
    </div>

    <Card class="mb-4">
      <CardHeader class="pb-0">
        <CardTitle>代理基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col md:flex-row gap-6 pt-4">
          <!-- 代理头像和基本信息 -->
          <div class="flex flex-col items-center md:w-1/4">
            <div class="h-32 w-32 mb-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="h-24 w-24 text-primary/70">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold">{{ agent.name || '暂无数据' }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <Badge :variant="getStatusVariant(agent.status)">
                {{ getStatusText(agent.status) }}
              </Badge>
              <Badge variant="outline">{{ agent.level || '暂无等级' }}</Badge>
            </div>
          </div>

          <!-- 代理详细信息 -->
          <div class="md:w-3/4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">手机号码</h4>
                  <p class="font-medium">{{ agent.phone || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" x2="8" y1="2" y2="4"></line><line x1="16" x2="16" y1="2" y2="4"></line></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">微信名称</h4>
                  <p class="font-medium">{{ agent.wechatName || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">代理类型</h4>
                  <p class="font-medium">{{ getCategoryDescription(agent.category) }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">添加日期</h4>
                  <p class="font-medium">{{ agent.addedDate || agent.createdAt || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">推荐人/推荐码</h4>
                  <p class="font-medium">{{ agent.referrer || '暂无数据' }}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M21 15V6"></path><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path><path d="M12 12H3"></path><path d="M16 6H3"></path><path d="M12 18H3"></path></svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">小红书账号</h4>
                  <p class="font-medium">{{ agent.redBookAccount || '暂无数据' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="mb-4">
      <CardHeader>
        <CardTitle>代理状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div class="flex items-center">
            <Badge :variant="agent.isAdded ? 'default' : 'outline'" class="mr-2">
              {{ agent.isAdded ? '是' : '否' }}
            </Badge>
            <span>已添加</span>
          </div>
          <div class="flex items-center">
            <Badge :variant="agent.isPosting ? 'default' : 'outline'" class="mr-2">
              {{ agent.isPosting ? '是' : '否' }}
            </Badge>
            <span>发帖</span>
          </div>
          <div class="flex items-center">
            <Badge :variant="agent.isIntercept ? 'default' : 'outline'" class="mr-2">
              {{ agent.isIntercept ? '是' : '否' }}
            </Badge>
            <span>截流</span>
          </div>
          <div class="flex items-center">
            <Badge :variant="agent.isAttracting ? 'default' : 'outline'" class="mr-2">
              {{ agent.isAttracting ? '是' : '否' }}
            </Badge>
            <span>引流获客</span>
          </div>
          <div class="flex items-center">
            <Badge :variant="agent.isInGroup ? 'default' : 'outline'" class="mr-2">
              {{ agent.isInGroup ? '是' : '否' }}
            </Badge>
            <span>进群</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="mb-4">
      <CardHeader>
        <CardTitle>业绩数据</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">有效客资数</h3>
            <p class="text-2xl font-bold">{{ performance?.validClients || 0 }}</p>
          </div>
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">成交金额</h3>
            <p class="text-2xl font-bold">¥{{ performance?.totalRevenue || 0 }}</p>
          </div>
          <div class="bg-muted/20 p-4 rounded-lg">
            <h3 class="font-medium text-sm">提成金额</h3>
            <p class="text-2xl font-bold">¥{{ performance?.commission || 0 }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>备注信息</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{{ agent.notes || '暂无备注' }}</p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { agentApi } from '@/api/agent'
import type { Agent, AgentPerformance } from '@/types/agent'
import { AgentCategory, AgentStatus } from '@/types/agent'
import { Button } from '@/components/ui/button'

const route = useRoute()
const agent = ref<Agent>({
  id: '',
  name: '',
  wechatName: '',
  phone: '',
  category: '',
  level: '',
  addedDate: '',
  createdAt: '',
  updatedAt: '',
  referrer: '',
  referralCode: '',
  isAdded: false,
  isPosting: false,
  isIntercept: false,
  isAttracting: false,
  isInGroup: false,
  notes: '',
  redBookAccount: '',
  status: '',
})

const performance = ref<AgentPerformance | null>(null)

// 获取代理类型详细描述
const getCategoryDescription = (category: string | AgentCategory): string => {
  if (!category) return '暂无数据'
  
  switch (category) {
    case AgentCategory.A:
      return 'A类（执行力强，能主动完成任务)'
    case AgentCategory.B:
      return 'B类（被动催促型，需要适当督促）'
    case AgentCategory.C: 
      return 'C类（引导从事型，需要详细指导）'
    case AgentCategory.D:
      return 'D类（沉默代理型，活跃度低）'
    default:
      return category as string
  }
}

// 获取代理详情
const fetchAgentDetail = async () => {
  try {
    const id = route.params.id as string
    const agentData = await agentApi.getAgent(id)
    agent.value = agentData
    fetchAgentPerformance(id)
  } catch (error) {
    console.error('获取代理详情失败:', error)
    // 如果API获取失败，使用模拟数据
    useMockData()
  }
}

// 获取代理业绩数据
const fetchAgentPerformance = async (id: string) => {
  try {
    const performanceData = await agentApi.getAgentPerformance(id)
    performance.value = performanceData
  } catch (error) {
    console.error('获取代理业绩失败:', error)
  }
}

// 使用模拟数据
const useMockData = () => {
  const id = route.params.id as string
  agent.value = {
    id,
    name: '张三',
    wechatName: 'wx_zhangsan',
    phone: '13800138000',
    category: 'A',
    level: 'SV3',
    addedDate: '2023-06-15',
    createdAt: '2023-06-15',
    updatedAt: '2023-06-15',
    referrer: '李四',
    referralCode: '',
    isAdded: true,
    isPosting: true,
    isIntercept: true,
    isAttracting: true,
    isInGroup: true,
    notes: '表现良好，积极参与活动',
    redBookAccount: 'redbook_zhangsan',
    status: 'active',
  }
  
  performance.value = {
    clientsTotal: 42,
    validClients: 25,
    invalidClients: 10,
    pendingClients: 7,
    closedDeals: 15,
    totalRevenue: 35000,
    commission: 2450,
    baseSalary: 1000,
    performance: 1450,
    periodStart: '2023-01-01',
    periodEnd: '2023-12-31',
  }
}

// 根据状态获取Badge变体
const getStatusVariant = (status: string | AgentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline'
  
  switch (status) {
    case AgentStatus.ACTIVE:
      return 'default'
    case AgentStatus.PENDING:
      return 'secondary'
    case AgentStatus.BLOCKED:
      return 'destructive'
    case AgentStatus.INACTIVE:
      return 'outline'
    default:
      return 'outline'
  }
}

// 获取状态文本
const getStatusText = (status: string | AgentStatus): string => {
  if (!status) return '未知状态'
  
  switch (status) {
    case AgentStatus.ACTIVE:
      return '活跃'
    case AgentStatus.PENDING:
      return '待审核'
    case AgentStatus.BLOCKED:
      return '已封禁'
    case AgentStatus.INACTIVE:
      return '非活跃'
    default:
      return status as string
  }
}

onMounted(() => {
  fetchAgentDetail()
})
</script> 

<style scoped>
.agent-detail-container {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 