<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- 待审核任务数 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">待审核任务</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ formatNumber(stats?.totalPending || 0) }}</p>
              <Badge 
                :variant="getPendingBadgeVariant(stats?.totalPending || 0)" 
                class="text-xs"
              >
                {{ getPendingStatusText(stats?.totalPending || 0) }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              需要人工审核的任务
            </p>
          </div>
          <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock class="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 今日已审核 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">今日已审核</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ formatNumber(stats?.todayAudited || 0) }}</p>
              <Badge 
                variant="outline" 
                class="text-xs"
              >
                {{ getTodayProgress() }}
              </Badge>
            </div>
            <div class="flex items-center space-x-2 mt-1">
              <span class="text-xs text-green-600">
                通过 {{ formatNumber(stats?.todayApproved || 0) }}
              </span>
              <span class="text-xs text-muted-foreground">|</span>
              <span class="text-xs text-red-600">
                拒绝 {{ formatNumber(stats?.todayRejected || 0) }}
              </span>
            </div>
          </div>
          <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle class="h-6 w-6 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 审核通过率 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-muted-foreground">审核通过率</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ formatPercentage(stats?.approvalRate || 0) }}</p>
              <Badge 
                :variant="getApprovalRateBadgeVariant(stats?.approvalRate || 0)" 
                class="text-xs"
              >
                {{ getApprovalRateText(stats?.approvalRate || 0) }}
              </Badge>
            </div>
            <div class="mt-2">
              <Progress 
                :value="(stats?.approvalRate || 0) * 100" 
                class="h-2"
                :class="getProgressColorClass(stats?.approvalRate || 0)"
              />
            </div>
          </div>
          <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center ml-4">
            <TrendingUp class="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 平均审核时间 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">平均审核时间</p>
            <div class="flex items-baseline space-x-2">
              <p class="text-2xl font-bold">{{ formatAuditTime(stats?.avgAuditTime || 0) }}</p>
              <Badge 
                :variant="getAuditTimeBadgeVariant(stats?.avgAuditTime || 0)" 
                class="text-xs"
              >
                {{ getAuditTimeText(stats?.avgAuditTime || 0) }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              任务提交到审核完成
            </p>
          </div>
          <div class="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Timer class="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 今日奖励发放 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg col-span-1 md:col-span-2">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-muted-foreground">今日奖励发放</p>
            <div class="flex items-baseline space-x-3">
              <p class="text-3xl font-bold text-emerald-600">
                ¥{{ formatCurrency(stats?.rewardAmountToday || 0) }}
              </p>
              <div class="flex items-center space-x-2">
                <Badge variant="secondary" class="text-xs">
                  平均 ¥{{ formatCurrency(getAvgRewardPerTask()) }}/任务
                </Badge>
              </div>
            </div>
            <div class="flex items-center space-x-4 mt-2">
              <div class="flex items-center space-x-1">
                <div class="h-2 w-2 bg-emerald-500 rounded-full"></div>
                <span class="text-xs text-muted-foreground">
                  基础奖励 {{ formatNumber((stats?.todayApproved || 0) * 1) }} 元
                </span>
              </div>
              <div class="flex items-center space-x-1">
                <div class="h-2 w-2 bg-amber-500 rounded-full"></div>
                <span class="text-xs text-muted-foreground">
                  额外奖励 {{ formatCurrency((stats?.rewardAmountToday || 0) - (stats?.todayApproved || 0) * 1) }} 元
                </span>
              </div>
            </div>
          </div>
          <div class="h-16 w-16 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign class="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 平台分布统计 -->
    <Card class="overflow-hidden transition-shadow hover:shadow-lg col-span-1 md:col-span-2">
      <CardContent class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">平台分布</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              @click="$emit('viewPlatformStats')"
              class="text-xs"
            >
              查看详情
              <ArrowUpRight class="ml-1 h-3 w-3" />
            </Button>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="platform in platformData" 
              :key="platform.platform"
              class="flex items-center justify-between group"
            >
              <div class="flex items-center space-x-3">
                <div 
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: platform.color }"
                ></div>
                <span class="text-sm font-medium">{{ platform.name }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-muted-foreground">
                  {{ formatNumber(platform.count) }}
                </span>
                <div class="w-16 bg-muted rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300 group-hover:opacity-80"
                    :style="{ 
                      width: `${platform.percentage}%`, 
                      backgroundColor: platform.color 
                    }"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground w-8 text-right">
                  {{ Math.round(platform.percentage) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- 数据刷新提示 -->
  <div v-if="loading" class="mt-4 flex items-center justify-center">
    <div class="flex items-center space-x-2 text-sm text-muted-foreground">
      <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
      <span>数据加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Timer, 
  DollarSign,
  ArrowUpRight
} from 'lucide-vue-next'
import type { AuditStats } from '@/types/promotion'
import { getPlatformDisplay } from '@/types/promotion'

// Props 定义
interface Props {
  stats?: AuditStats | null
  loading?: boolean
  platformStats?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformStats: () => ({})
})

// Emits 定义
interface Emits {
  refresh: []
  viewPlatformStats: []
  viewDetailStats: []
}

const emit = defineEmits<Emits>()

// 数字格式化
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 百分比格式化
const formatPercentage = (rate: number): string => {
  return `${Math.round(rate * 100)}%`
}

// 货币格式化
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2)
}

// 审核时间格式化
const formatAuditTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  } else {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  }
}

// 待审核任务状态
const getPendingBadgeVariant = (count: number) => {
  if (count === 0) return 'secondary'
  if (count > 50) return 'destructive'
  if (count > 20) return 'default'
  return 'secondary'
}

const getPendingStatusText = (count: number): string => {
  if (count === 0) return '已清空'
  if (count > 50) return '较多'
  if (count > 20) return '正常'
  return '较少'
}

// 今日进度
const getTodayProgress = (): string => {
  const total = (props.stats?.todayApproved || 0) + (props.stats?.todayRejected || 0)
  if (total === 0) return '暂无'
  
  const hour = new Date().getHours()
  if (hour < 12) return '上午'
  if (hour < 18) return '下午'
  return '晚间'
}

// 通过率状态
const getApprovalRateBadgeVariant = (rate: number) => {
  if (rate >= 0.9) return 'default'
  if (rate >= 0.7) return 'secondary'
  return 'destructive'
}

const getApprovalRateText = (rate: number): string => {
  if (rate >= 0.9) return '优秀'
  if (rate >= 0.7) return '良好'
  if (rate >= 0.5) return '一般'
  return '偏低'
}

const getProgressColorClass = (rate: number): string => {
  if (rate >= 0.9) return 'progress-success'
  if (rate >= 0.7) return 'progress-warning'
  return 'progress-danger'
}

// 审核时间状态
const getAuditTimeBadgeVariant = (minutes: number) => {
  if (minutes <= 30) return 'default'
  if (minutes <= 120) return 'secondary'
  return 'destructive'
}

const getAuditTimeText = (minutes: number): string => {
  if (minutes <= 30) return '快速'
  if (minutes <= 120) return '正常'
  return '较慢'
}

// 平均每任务奖励
const getAvgRewardPerTask = (): number => {
  const approvedCount = props.stats?.todayApproved || 0
  const totalReward = props.stats?.rewardAmountToday || 0
  
  if (approvedCount === 0) return 0
  return totalReward / approvedCount
}

// 平台数据处理
const platformData = computed(() => {
  const stats = props.platformStats || {}
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0)
  
  const colors = {
    douyin: '#ff6b6b',
    kuaishou: '#4ecdc4', 
    xiaohongshu: '#ff8cc8'
  }
  
  return Object.entries(stats).map(([platform, count]) => ({
    platform,
    name: getPlatformDisplay(platform as any),
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
    color: colors[platform as keyof typeof colors] || '#94a3b8'
  })).sort((a, b) => b.count - a.count)
})

// 计算属性
const hasData = computed(() => !!props.stats)
const isEmpty = computed(() => !props.loading && !hasData.value)
</script>

<style scoped>
/* 进度条颜色自定义 */
:deep(.progress-success .progress-indicator) {
  background-color: hsl(142 76% 36%);
}

:deep(.progress-warning .progress-indicator) {
  background-color: hsl(32 95% 44%);
}

:deep(.progress-danger .progress-indicator) {
  background-color: hsl(0 84% 60%);
}

/* 卡片悬停效果 */
.card {
  transition: all 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-1px);
}

/* 动画效果 */
@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

.animate-pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

/* 数字变化动画 */
@keyframes number-change {
  0% { opacity: 0.7; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

.number-animate {
  animation: number-change 0.3s ease-out;
}
</style>