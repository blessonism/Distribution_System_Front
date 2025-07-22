<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center space-x-2">
            <BarChart3 class="w-5 h-5" />
            <span>邀请统计</span>
          </CardTitle>
          <CardDescription>
            查看您的邀请效果和团队发展数据
          </CardDescription>
        </div>
        
        <!-- 时间范围选择器 -->
        <div class="flex items-center space-x-2">
          <Label class="text-sm">时间范围</Label>
          <Select v-model="selectedTimeRange" @update:model-value="handleTimeRangeChange">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 总邀请数 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-blue-100 rounded-full">
                <Users class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">总邀请数</p>
                <p class="text-2xl font-bold">{{ stats?.totalInvites || 0 }}</p>
              </div>
            </div>
            <div class="mt-2 flex items-center text-xs">
              <TrendingUp class="w-3 h-3 text-green-500 mr-1" />
              <span class="text-green-500">+{{ monthlyGrowth }}%</span>
              <span class="text-muted-foreground ml-1">较上月</span>
            </div>
          </CardContent>
        </Card>

        <!-- 本月邀请 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-green-100 rounded-full">
                <Calendar class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">本月邀请</p>
                <p class="text-2xl font-bold">{{ stats?.monthlyInvites || 0 }}</p>
              </div>
            </div>
            <div class="mt-2 flex items-center text-xs">
              <Target class="w-3 h-3 text-blue-500 mr-1" />
              <span class="text-muted-foreground">{{ monthlyProgress }}% 完成月度目标</span>
            </div>
          </CardContent>
        </Card>

        <!-- 转化率 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-purple-100 rounded-full">
                <Percent class="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">转化率</p>
                <p class="text-2xl font-bold">{{ formatPercentage(stats?.conversionRate || 0) }}%</p>
              </div>
            </div>
            <div class="mt-2 flex items-center text-xs">
              <div class="w-3 h-3 rounded-full mr-1" :class="conversionRateColor"></div>
              <span class="text-muted-foreground">{{ conversionRateStatus }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- 活跃邀请码 -->
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center space-x-2">
              <div class="p-2 bg-orange-100 rounded-full">
                <Hash class="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">活跃邀请码</p>
                <p class="text-2xl font-bold">{{ activeCodesCount }}</p>
              </div>
            </div>
            <div class="mt-2 flex items-center text-xs">
              <span class="text-muted-foreground">共 {{ totalCodesCount }} 个邀请码</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 图表区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 角色分布饼图 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">角色分布</CardTitle>
            <CardDescription>按角色统计邀请人数</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="roleDistributionData.length > 0" class="space-y-4">
              <!-- 简化版饼图展示 -->
              <div class="grid grid-cols-2 gap-4">
                <div 
                  v-for="item in roleDistributionData" 
                  :key="item.role"
                  class="text-center"
                >
                  <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
                       :style="{ backgroundColor: item.color }">
                    {{ item.count }}
                  </div>
                  <p class="text-sm font-medium">{{ item.label }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatPercentage(item.percentage) }}%</p>
                </div>
              </div>
              
              <!-- 详细列表 -->
              <div class="space-y-2 pt-4 border-t">
                <div 
                  v-for="item in roleDistributionData" 
                  :key="item.role"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
                    <span class="text-sm">{{ item.label }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-medium">{{ item.count }}</span>
                    <span class="text-xs text-muted-foreground ml-1">({{ formatPercentage(item.percentage) }}%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <PieChart class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">暂无邀请数据</p>
            </div>
          </CardContent>
        </Card>

        <!-- 邀请趋势图 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">邀请趋势</CardTitle>
            <CardDescription>最近{{ trendPeriod }}的邀请情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="trendData.length > 0" class="space-y-4">
              <!-- 简化版趋势图 -->
              <div class="h-32 flex items-end space-x-1">
                <div 
                  v-for="(item, index) in trendData" 
                  :key="index"
                  class="flex-1 bg-blue-500 rounded-t min-h-[4px] relative group"
                  :style="{ height: `${(item.value / maxTrendValue) * 100}%` }"
                >
                  <!-- 悬停提示 -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {{ item.label }}: {{ item.value }}人
                  </div>
                </div>
              </div>
              
              <!-- X轴标签 -->
              <div class="flex justify-between text-xs text-muted-foreground">
                <span v-for="(item, index) in trendData" :key="index">
                  {{ item.shortLabel }}
                </span>
              </div>
              
              <!-- 统计信息 -->
              <div class="grid grid-cols-2 gap-4 pt-4 border-t">
                <div class="text-center">
                  <p class="text-lg font-semibold">{{ trendTotal }}</p>
                  <p class="text-xs text-muted-foreground">总计</p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-semibold">{{ trendAverage }}</p>
                  <p class="text-xs text-muted-foreground">日均</p>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-8">
              <TrendingUp class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">暂无趋势数据</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 最近邀请 -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base">最近邀请</CardTitle>
              <CardDescription>最新的邀请记录</CardDescription>
            </div>
            <Button variant="outline" size="sm" @click="$emit('viewAllHistory')">
              查看全部
              <ArrowRight class="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="recentInvites.length > 0" class="space-y-3">
            <div 
              v-for="invite in recentInvites" 
              :key="invite.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <!-- 头像占位 -->
                <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User class="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div>
                  <p class="font-medium">{{ invite.inviteeName }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ getRoleDisplayName(invite.actualRole) }} • {{ formatRelativeTime(invite.registeredAt) }}
                  </p>
                </div>
              </div>
              
              <div class="text-right">
                <Badge :variant="invite.status === 'completed' ? 'default' : 'secondary'">
                  {{ invite.status === 'completed' ? '已完成' : '等待中' }}
                </Badge>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <UserCheck class="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm text-muted-foreground">暂无最近邀请</p>
          </div>
        </CardContent>
      </Card>
    </CardContent>

    <!-- 导出弹窗 -->
    <Dialog v-model:open="exportDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导出统计数据</DialogTitle>
          <DialogDescription>
            选择要导出的数据范围和格式
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>导出格式</Label>
            <Select v-model="exportFormat">
              <SelectTrigger>
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF 报告</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label>数据范围</Label>
            <Select v-model="exportRange">
              <SelectTrigger>
                <SelectValue placeholder="选择范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">当前时间范围</SelectItem>
                <SelectItem value="all">全部数据</SelectItem>
                <SelectItem value="custom">自定义范围</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="exportDialogOpen = false">
            取消
          </Button>
          <Button @click="handleExportConfirm" :disabled="loading">
            <Download class="w-4 h-4 mr-1" />
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import { 
  BarChart3,
  Users,
  Calendar,
  Percent,
  Hash,
  TrendingUp,
  Target,
  PieChart,
  User,
  UserCheck,
  ArrowRight,
  Download
} from 'lucide-vue-next'
import type { InvitationStats, InvitationRecord, StatsQueryParams } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { getRoleDisplayName } from '@/api/invitation'

// Props 定义
interface Props {
  stats: InvitationStats | null
  recentInvites: InvitationRecord[]
  activeCodesCount: number
  totalCodesCount: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits 定义
interface Emits {
  timeRangeChange: [timeRange: string]
  export: [params: { format: string; range: string; timeRange: string }]
  viewAllHistory: []
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedTimeRange = ref('month')
const exportDialogOpen = ref(false)
const exportFormat = ref('excel')
const exportRange = ref('current')

// 计算属性
const monthlyGrowth = computed(() => {
  // 模拟计算月度增长率
  if (!props.stats) return 0
  const current = props.stats.monthlyInvites
  const previous = Math.max(1, current - Math.floor(Math.random() * 10))
  return Math.round(((current - previous) / previous) * 100)
})

const monthlyProgress = computed(() => {
  // 模拟月度目标完成度
  if (!props.stats) return 0
  const target = 50 // 假设月度目标50人
  return Math.min(100, Math.round((props.stats.monthlyInvites / target) * 100))
})

const conversionRateColor = computed(() => {
  const rate = props.stats?.conversionRate || 0
  if (rate >= 70) return 'bg-green-500'
  if (rate >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
})

const conversionRateStatus = computed(() => {
  const rate = props.stats?.conversionRate || 0
  if (rate >= 70) return '转化良好'
  if (rate >= 40) return '转化一般'
  return '需要改进'
})

const roleDistributionData = computed(() => {
  if (!props.stats?.roleBreakdown) return []
  
  const colors = {
    director: '#3B82F6',
    leader: '#10B981', 
    sales: '#F59E0B',
    agent: '#8B5CF6',
    super_admin: '#EF4444'
  }
  
  const total = Object.values(props.stats.roleBreakdown).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(props.stats.roleBreakdown)
    .filter(([, count]) => count > 0)
    .map(([role, count]) => ({
      role: role as UserRole,
      label: getRoleDisplayName(role as UserRole),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: colors[role as keyof typeof colors] || '#6B7280'
    }))
    .sort((a, b) => b.count - a.count)
})

const trendData = computed(() => {
  // 模拟趋势数据生成
  const days = getTrendDays()
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    
    data.push({
      label: date.toLocaleDateString('zh-CN'),
      shortLabel: date.getDate().toString(),
      value: Math.floor(Math.random() * 10) + 1
    })
  }
  
  return data
})

const trendPeriod = computed(() => {
  switch (selectedTimeRange.value) {
    case 'week': return '7天'
    case 'month': return '30天'
    case 'quarter': return '90天'
    case 'year': return '365天'
    default: return '30天'
  }
})

const maxTrendValue = computed(() => {
  return Math.max(...trendData.value.map(item => item.value), 1)
})

const trendTotal = computed(() => {
  return trendData.value.reduce((sum, item) => sum + item.value, 0)
})

const trendAverage = computed(() => {
  const total = trendTotal.value
  const days = trendData.value.length
  return days > 0 ? Math.round(total / days) : 0
})

// 监听器
watch(selectedTimeRange, (newRange) => {
  emit('timeRangeChange', newRange)
})

// 方法
const getTrendDays = () => {
  switch (selectedTimeRange.value) {
    case 'week': return 7
    case 'month': return 30
    case 'quarter': return 90
    case 'year': return 365
    default: return 30
  }
}

const formatPercentage = (value: number) => {
  return Math.round(value * 100) / 100
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  
  if (diffDays > 0) {
    return `${diffDays}天前`
  } else if (diffHours > 0) {
    return `${diffHours}小时前`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`
  } else {
    return '刚刚'
  }
}

const handleTimeRangeChange = () => {
  // 已通过 watch 处理
}

const handleExportConfirm = () => {
  emit('export', {
    format: exportFormat.value,
    range: exportRange.value,
    timeRange: selectedTimeRange.value
  })
  
  exportDialogOpen.value = false
  
  toast({
    title: '导出已开始',
    description: '正在生成统计报告，请稍候...',
  })
}
</script>

<style scoped>
/* 卡片悬停效果 */
.card {
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 趋势图柱状条动画 */
.trend-bar {
  transition: height 0.3s ease-in-out;
}

/* 响应式网格布局 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 颜色渐变 */
.gradient-bg {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
}

/* 数字动画 */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.count-animation {
  animation: countUp 0.5s ease-out;
}
</style>