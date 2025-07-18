<!-- 仪表盘页面 -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">仪表盘</h1>
      <Button variant="outline" size="sm" @click="refreshData" class="flex items-center gap-2">
        <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新数据
      </Button>
    </div>

    <!-- 关键指标总览卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div v-for="(metric, index) in keyMetrics" :key="index" 
           class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <h3 class="text-sm text-gray-500 font-medium">{{ metric.title }}</h3>
          <div :class="`p-2 rounded-full ${metric.trend === 'up' ? 'bg-green-100' : metric.trend === 'down' ? 'bg-red-100' : 'bg-blue-100'}`">
            <component :is="metric.icon" 
                       class="h-4 w-4"
                       :class="metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-blue-600'" />
          </div>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-semibold">{{ metric.value }}</p>
          <div class="flex items-center mt-1 text-sm">
            <component :is="metric.trend === 'up' ? 'TrendingUpIcon' : metric.trend === 'down' ? 'TrendingDownIcon' : 'MinusIcon'" 
                       class="h-3 w-3 mr-1"
                       :class="metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-blue-600'" />
            <span :class="metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-blue-600'">
              {{ metric.trendValue }}%
            </span>
            <span class="text-gray-400 ml-1">与昨日相比</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速访问卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card class="hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex flex-col items-center justify-center">
          <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <UsersIcon class="h-6 w-6 text-blue-600" />
          </div>
          <h3 class="font-semibold mb-1">代理管理</h3>
          <p class="text-sm text-gray-500 text-center mb-4">管理和查看所有代理信息</p>
          <Button @click="navigateTo('/agent/list')">进入管理</Button>
        </CardContent>
      </Card>
      
      <Card class="hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex flex-col items-center justify-center">
          <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <TargetIcon class="h-6 w-6 text-green-600" />
          </div>
          <h3 class="font-semibold mb-1">客资管理</h3>
          <p class="text-sm text-gray-500 text-center mb-4">管理和分配客资信息</p>
          <Button @click="navigateTo('/lead/list')">进入管理</Button>
        </CardContent>
      </Card>
      
      <Card class="hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex flex-col items-center justify-center">
          <div class="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <DollarSignIcon class="h-6 w-6 text-orange-600" />
          </div>
          <h3 class="font-semibold mb-1">成交管理</h3>
          <p class="text-sm text-gray-500 text-center mb-4">管理和查看所有成交记录</p>
          <Button @click="navigateTo('/deal/list')">进入管理</Button>
        </CardContent>
      </Card>
      
      <Card class="hover:shadow-md transition-shadow">
        <CardContent class="p-6 flex flex-col items-center justify-center">
          <div class="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <SettingsIcon class="h-6 w-6 text-purple-600" />
          </div>
          <h3 class="font-semibold mb-1">系统设置</h3>
          <p class="text-sm text-gray-500 text-center mb-4">配置系统参数和规则</p>
          <Button @click="navigateTo('/settings/level')">进入设置</Button>
        </CardContent>
      </Card>
    </div>

    <!-- 待处理事项 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>待处理事项</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                  <MegaphoneIcon class="h-5 w-5" />
                </div>
                <div>
                  <h4 class="font-medium">推广审核</h4>
                  <p class="text-sm text-gray-500">{{ dashboardData.pending?.promotionAuditCount || 0 }} 条待审核</p>
                </div>
              </div>
              <Button variant="outline" size="sm" @click="navigateTo('/promotion/audit')">查看</Button>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <UsersIcon class="h-5 w-5" />
                </div>
                <div>
                  <h4 class="font-medium">客资分配</h4>
                  <p class="text-sm text-gray-500">{{ dashboardData.pending?.leadAssignCount || 0 }} 条待分配</p>
                </div>
              </div>
              <Button variant="outline" size="sm" @click="navigateTo('/lead/list')">查看</Button>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                  <CheckCircleIcon class="h-5 w-5" />
                </div>
                <div>
                  <h4 class="font-medium">成交确认</h4>
                  <p class="text-sm text-gray-500">{{ dashboardData.pending?.dealConfirmCount || 12 }} 条待确认</p>
                </div>
              </div>
              <Button variant="outline" size="sm" @click="navigateTo('/deal/list')">查看</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>今日数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-gray-500">新增客资</p>
              <p class="text-2xl font-bold">{{ dashboardData.today?.leadCount || 0 }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">新增成交</p>
              <p class="text-2xl font-bold">{{ dashboardData.today?.dealCount || 0 }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">成交金额</p>
              <p class="text-2xl font-bold text-green-600">¥{{ dashboardData.today?.salesAmount?.toLocaleString() || 0 }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">转化率</p>
              <p class="text-2xl font-bold">{{ dashboardData.today?.leadCount ? ((dashboardData.today.dealCount / dashboardData.today.leadCount) * 100).toFixed(1) : 0 }}%</p>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-100">
            <h4 class="text-sm font-medium mb-2">本月累计</h4>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">客资数</p>
                <p class="text-lg font-semibold">{{ dashboardData.thisMonth?.leadCount || 0 }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">成交数</p>
                <p class="text-lg font-semibold">{{ dashboardData.thisMonth?.dealCount || 0 }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">成交金额</p>
                <p class="text-lg font-semibold">¥{{ dashboardData.thisMonth?.salesAmount?.toLocaleString() || 0 }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 客资状态分布 -->
    <Card>
      <CardHeader>
        <CardTitle>客资状态分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2 text-center">
          <div v-for="(item, index) in chartData.leadStatusDistribution" :key="index" 
               class="p-3 rounded-lg" :class="getStatusColor(item.status).bg">
            <p class="text-lg font-bold" :class="getStatusColor(item.status).text">{{ item.count }}</p>
            <p class="text-sm font-medium">{{ getLeadStatusText(item.status) }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 数据图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 代理数量趋势图 -->
      <Card>
        <CardHeader>
          <CardTitle>代理数量趋势</CardTitle>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="changeAgentTrendPeriod('week')" :class="{ 'bg-primary/10': agentTrendPeriod === 'week' }">本周</Button>
            <Button variant="outline" size="sm" @click="changeAgentTrendPeriod('month')" :class="{ 'bg-primary/10': agentTrendPeriod === 'month' }">本月</Button>
            <Button variant="outline" size="sm" @click="changeAgentTrendPeriod('year')" :class="{ 'bg-primary/10': agentTrendPeriod === 'year' }">全年</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="h-64">
            <canvas ref="agentTrendChart"></canvas>
          </div>
        </CardContent>
      </Card>

      <!-- 客资来源分布 -->
      <Card>
        <CardHeader>
          <CardTitle>客资获取渠道分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64">
            <canvas ref="leadSourceChart"></canvas>
          </div>
          <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" @click="navigateTo('/lead/list')">查看详情</Button>
          </div>
        </CardContent>
      </Card>

      <!-- 成交金额统计图 -->
      <Card>
        <CardHeader>
          <CardTitle>成交金额统计</CardTitle>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="changeDealPeriod('week')" :class="{ 'bg-primary/10': dealPeriod === 'week' }">本周</Button>
            <Button variant="outline" size="sm" @click="changeDealPeriod('month')" :class="{ 'bg-primary/10': dealPeriod === 'month' }">本月</Button>
            <Button variant="outline" size="sm" @click="changeDealPeriod('year')" :class="{ 'bg-primary/10': dealPeriod === 'year' }">全年</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="h-64">
            <canvas ref="dealAmountChart"></canvas>
          </div>
        </CardContent>
      </Card>

      <!-- 代理等级分布 -->
      <Card>
        <CardHeader>
          <CardTitle>代理等级分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-64">
            <canvas ref="agentLevelChart"></canvas>
          </div>
          <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" @click="navigateTo('/agent/list')">查看详情</Button>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- 最近交易 -->
    <Card>
      <CardHeader>
        <CardTitle>最近交易</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left font-medium text-gray-500 pb-2">客户信息</th>
                <th class="text-left font-medium text-gray-500 pb-2">产品</th>
                <th class="text-left font-medium text-gray-500 pb-2">金额</th>
                <th class="text-left font-medium text-gray-500 pb-2">时间</th>
                <th class="text-left font-medium text-gray-500 pb-2">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(deal, index) in recentDeals" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3">{{ deal.contactInfo }}</td>
                <td class="py-3">{{ deal.productName }}</td>
                <td class="py-3 font-medium">¥{{ deal.amount.toLocaleString() }}</td>
                <td class="py-3 text-gray-500">{{ formatDate(deal.dealDate) }}</td>
                <td class="py-3">
                  <Badge :variant="getStatusVariant(deal.status)">
                    {{ getStatusText(deal.status) }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" @click="navigateTo('/deal/list')">查看全部</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUpIcon, TrendingDownIcon, MinusIcon, UsersIcon, 
  TargetIcon, DollarSignIcon, PercentIcon, BarChartIcon, 
  MegaphoneIcon, CheckCircleIcon, RefreshCwIcon, SettingsIcon
} from 'lucide-vue-next'
import request from '@/utils/request'
import Chart from 'chart.js/auto'

// 加载状态
const loading = ref(false)

// 图表引用
const agentTrendChart = ref<HTMLCanvasElement | null>(null)
const leadSourceChart = ref<HTMLCanvasElement | null>(null)
const dealAmountChart = ref<HTMLCanvasElement | null>(null)
const agentLevelChart = ref<HTMLCanvasElement | null>(null)

// 图表实例
let agentTrendChartInstance: Chart | null = null
let leadSourceChartInstance: Chart | null = null
let dealAmountChartInstance: Chart | null = null
let agentLevelChartInstance: Chart | null = null

// 图表周期
const agentTrendPeriod = ref('month')
const dealPeriod = ref('month')

// 仪表盘数据
const dashboardData = ref<any>({
  today: {
    leadCount: 0,
    dealCount: 0,
    salesAmount: 0,
  },
  thisWeek: {
    leadCount: 0,
    dealCount: 0,
    salesAmount: 0,
  },
  thisMonth: {
    leadCount: 0,
    dealCount: 0,
    salesAmount: 0,
  },
  pending: {
    promotionAuditCount: 0,
    leadAssignCount: 0,
    dealConfirmCount: 0,
  }
})

// 图表数据
const chartData = ref<any>({
  agentTrend: [],
  leadSourceDistribution: [],
  dealAmountStats: [],
  agentLevelDistribution: [],
  leadStatusDistribution: []
})

// 最近交易数据
const recentDeals = ref([
  {
    contactInfo: 'wx_user123',
    productName: 'AI课程-高级版',
    amount: 3999,
    dealDate: new Date(),
    status: 'paid'
  },
  {
    contactInfo: 'wx_user456',
    productName: 'AI就业-VIP班',
    amount: 8999,
    dealDate: new Date(Date.now() - 86400000),
    status: 'pending'
  },
  {
    contactInfo: '13900001234',
    productName: 'AI工具-年度套餐',
    amount: 1299,
    dealDate: new Date(Date.now() - 2 * 86400000),
    status: 'paid'
  },
  {
    contactInfo: 'wx_user789',
    productName: 'AI课程-基础版',
    amount: 1999,
    dealDate: new Date(Date.now() - 3 * 86400000),
    status: 'refunded'
  },
  {
    contactInfo: '13800009876',
    productName: 'AI就业-标准班',
    amount: 6999,
    dealDate: new Date(Date.now() - 4 * 86400000),
    status: 'paid'
  }
])

// 关键指标数据
const keyMetrics = ref([
  { 
    title: '总有效代理量', 
    value: '33',
    icon: UsersIcon,
    trend: 'up',
    trendValue: 5.2
  },
  { 
    title: '当日有效代理数量', 
    value: '35',
    icon: UsersIcon,
    trend: 'up',
    trendValue: 12.5
  },
  { 
    title: '当日代理客资数量', 
    value: '7',
    icon: TargetIcon,
    trend: 'down',
    trendValue: 3.8
  },
  { 
    title: '有效客资数量', 
    value: '2',
    icon: TargetIcon,
    trend: 'same',
    trendValue: 0
  },
  { 
    title: '客资返现费用', 
    value: '¥12',
    icon: DollarSignIcon,
    trend: 'down',
    trendValue: 15.4
  },
])

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    loading.value = true
    const response = await request.get('/dashboard/stats')
    dashboardData.value = response
    updateKeyMetrics()
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取图表数据
const fetchChartData = async () => {
  try {
    loading.value = true
    const response = await request.get('/dashboard/charts')
    chartData.value = response
    renderCharts()
  } catch (error) {
    console.error('获取图表数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 更新关键指标
const updateKeyMetrics = () => {
  if (dashboardData.value) {
    // 这里根据实际数据更新关键指标
    keyMetrics.value[0].value = dashboardData.value.today?.agentCount || '33'
    keyMetrics.value[2].value = dashboardData.value.today?.leadCount || '7'
    keyMetrics.value[3].value = dashboardData.value.today?.validLeadCount || '2'
    keyMetrics.value[4].value = '¥' + (dashboardData.value.today?.commissionAmount || 12)
  }
}

// 刷新所有数据
const refreshData = () => {
  fetchDashboardStats()
  fetchChartData()
}

// 格式化日期
const formatDate = (date: Date) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 获取状态对应的徽章样式
const getStatusVariant = (status: string): 'default' | 'outline' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'refunded':
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

// 获取状态对应的文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '已支付'
    case 'pending':
      return '待支付'
    case 'refunded':
      return '已退款'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

// 获取客资状态对应的文本
const getLeadStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    '未添加': '未添加',
    '已成交': '已成交',
    '未回复': '未回复',
    '已流失': '已流失',
    '考虑中': '考虑中',
    '周内给答复': '周内给答复',
    'pending': '待处理',
    'closed': '已关闭',
    'unresponsive': '无响应',
    'lost': '已流失',
    'considering': '考虑中',
    'follow_up': '跟进中'
  }
  return statusMap[status] || status
}

// 获取客资状态对应的颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string, text: string }> = {
    '未添加': { bg: 'bg-gray-100', text: 'text-gray-600' },
    '已成交': { bg: 'bg-green-100', text: 'text-green-600' },
    '未回复': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    '已流失': { bg: 'bg-red-100', text: 'text-red-600' },
    '考虑中': { bg: 'bg-blue-100', text: 'text-blue-600' },
    '周内给答复': { bg: 'bg-purple-100', text: 'text-purple-600' },
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    'closed': { bg: 'bg-green-100', text: 'text-green-600' },
    'unresponsive': { bg: 'bg-gray-100', text: 'text-gray-600' },
    'lost': { bg: 'bg-red-100', text: 'text-red-600' },
    'considering': { bg: 'bg-blue-100', text: 'text-blue-600' },
    'follow_up': { bg: 'bg-purple-100', text: 'text-purple-600' }
  }
  
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-600' }
}

// 渲染所有图表
const renderCharts = () => {
  renderAgentTrendChart()
  renderLeadSourceChart()
  renderDealAmountChart()
  renderAgentLevelChart()
}

// 渲染代理数量趋势图
const renderAgentTrendChart = () => {
  if (!agentTrendChart.value) return
  
  // 销毁旧图表
  if (agentTrendChartInstance) {
    agentTrendChartInstance.destroy()
  }
  
  const ctx = agentTrendChart.value.getContext('2d')
  if (!ctx || !chartData.value.agentTrend) return
  
  const data = chartData.value.agentTrend
  
  agentTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((item: any) => item.date),
      datasets: [
        {
          label: '代理总数',
          data: data.map((item: any) => item.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '活跃代理',
          data: data.map((item: any) => item.activeCount),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        }
      }
    }
  })
}

// 渲染客资来源分布图
const renderLeadSourceChart = () => {
  if (!leadSourceChart.value) return
  
  // 销毁旧图表
  if (leadSourceChartInstance) {
    leadSourceChartInstance.destroy()
  }
  
  const ctx = leadSourceChart.value.getContext('2d')
  if (!ctx || !chartData.value.leadSourceDistribution) return
  
  const data = chartData.value.leadSourceDistribution
  
  leadSourceChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map((item: any) => item.source),
      datasets: [
        {
          data: data.map((item: any) => item.value),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
      },
    }
  })
}

// 渲染成交金额统计图
const renderDealAmountChart = () => {
  if (!dealAmountChart.value) return
  
  // 销毁旧图表
  if (dealAmountChartInstance) {
    dealAmountChartInstance.destroy()
  }
  
  const ctx = dealAmountChart.value.getContext('2d')
  if (!ctx || !chartData.value.dealAmountStats) return
  
  const data = chartData.value.dealAmountStats
  
  dealAmountChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((item: any) => item.month),
      datasets: [
        {
          label: '成交金额',
          data: data.map((item: any) => item.amount),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '¥' + (Number(value) / 10000).toFixed(1) + 'w'
            }
          }
        }
      }
    }
  })
}

// 渲染代理等级分布图
const renderAgentLevelChart = () => {
  if (!agentLevelChart.value) return
  
  // 销毁旧图表
  if (agentLevelChartInstance) {
    agentLevelChartInstance.destroy()
  }
  
  const ctx = agentLevelChart.value.getContext('2d')
  if (!ctx || !chartData.value.agentLevelDistribution) return
  
  const data = chartData.value.agentLevelDistribution
  
  agentLevelChartInstance = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: data.map((item: any) => item.level),
      datasets: [
        {
          data: data.map((item: any) => item.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(245, 158, 11, 0.7)',
          ],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
      },
    }
  })
}

// 切换代理趋势图周期
const changeAgentTrendPeriod = (period: string) => {
  agentTrendPeriod.value = period
  // 这里可以重新获取数据并更新图表
  renderAgentTrendChart()
}

// 切换成交金额图周期
const changeDealPeriod = (period: string) => {
  dealPeriod.value = period
  // 这里可以重新获取数据并更新图表
  renderDealAmountChart()
}

// 路由实例
const router = useRouter()

// 页面导航函数
const navigateTo = (path: string) => {
  console.log('[Dashboard] 导航到:', path)
  router.push(path)
}

// 生命周期钩子
onMounted(() => {
  fetchDashboardStats()
  fetchChartData()
})

// 清理图表实例
onUnmounted(() => {
  if (agentTrendChartInstance) agentTrendChartInstance.destroy()
  if (leadSourceChartInstance) leadSourceChartInstance.destroy()
  if (dealAmountChartInstance) dealAmountChartInstance.destroy()
  if (agentLevelChartInstance) agentLevelChartInstance.destroy()
})
</script>