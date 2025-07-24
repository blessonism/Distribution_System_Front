<template>
  <div class="task-stats-cards">
    <!-- 加载状态 -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="i in 4" 
        :key="i"
        class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 总提交数 -->
      <Card class="relative overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                总提交数
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ stats?.totalSubmitted || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                本月 {{ stats?.thisMonthSubmitted || 0 }} 个
              </p>
            </div>
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileTextIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <!-- 装饰性背景 -->
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full opacity-20"></div>
        </CardContent>
      </Card>

      <!-- 待审核数 -->
      <Card class="relative overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                待审核
              </p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ stats?.pendingAudit || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                等待处理中
              </p>
            </div>
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <ClockIcon class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <!-- 装饰性背景 -->
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-50 dark:bg-yellow-900/10 rounded-full opacity-20"></div>
        </CardContent>
      </Card>

      <!-- 已通过数 -->
      <Card class="relative overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                已通过
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ stats?.approved || 0 }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                本月 {{ stats?.thisMonthApproved || 0 }} 个
              </p>
            </div>
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <!-- 装饰性背景 -->
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-full opacity-20"></div>
        </CardContent>
      </Card>

      <!-- 总奖励金额 -->
      <Card class="relative overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                总奖励
              </p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ¥{{ formatCurrency(stats?.totalReward || 0) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                累计收益
              </p>
            </div>
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <CoinsIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <!-- 装饰性背景 -->
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full opacity-20"></div>
        </CardContent>
      </Card>
    </div>

    <!-- 详细统计信息 -->
    <div v-if="!loading && showDetails" class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 通过率统计 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-medium">通过率统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- 总通过率 -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">总通过率</span>
                <span class="text-sm font-medium">{{ approvalRate }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-green-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${approvalRate}%` }"
                ></div>
              </div>
            </div>

            <!-- 本月通过率 -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">本月通过率</span>
                <span class="text-sm font-medium">{{ thisMonthApprovalRate }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${thisMonthApprovalRate}%` }"
                ></div>
              </div>
            </div>

            <!-- 拒绝数量 -->
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">已拒绝</span>
                <span class="text-sm font-medium text-red-600 dark:text-red-400">
                  {{ stats?.rejected || 0 }} 个
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 平台分布 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg font-medium">平台分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div 
              v-for="platform in platformDistribution" 
              :key="platform.name"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div 
                  class="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                  :style="{ backgroundColor: platform.color }"
                >
                  {{ platform.icon }}
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ platform.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ platform.count }}</span>
                <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300"
                    :style="{ 
                      width: `${platform.percentage}%`,
                      backgroundColor: platform.color 
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 操作按钮 -->
    <div v-if="!loading" class="mt-6 flex justify-center">
      <Button
        variant="outline"
        @click="toggleDetails"
        class="flex items-center gap-2"
      >
        <ChevronDownIcon 
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': showDetails }"
        />
        {{ showDetails ? '收起详情' : '查看详情' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue'
import type { AgentTaskStats } from '@/types/promotion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  CoinsIcon,
  ChevronDownIcon
} from 'lucide-vue-next'

interface Props {
  /** 统计数据 */
  stats?: AgentTaskStats | null
  /** 是否加载中 */
  loading?: boolean
  /** 平台分布数据 */
  platformStats?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  stats: null,
  loading: false,
  platformStats: () => ({})
})

// 响应式状态
const showDetails = ref(false)

// 计算属性
const approvalRate = computed(() => {
  if (!props.stats || props.stats.totalSubmitted === 0) return 0
  return Math.round((props.stats.approved / props.stats.totalSubmitted) * 100)
})

const thisMonthApprovalRate = computed(() => {
  if (!props.stats || props.stats.thisMonthSubmitted === 0) return 0
  return Math.round((props.stats.thisMonthApproved / props.stats.thisMonthSubmitted) * 100)
})

const platformDistribution = computed(() => {
  const total = Object.values(props.platformStats).reduce((sum, count) => sum + count, 0)
  
  return [
    {
      name: '抖音',
      icon: '抖',
      color: '#000000',
      count: props.platformStats.douyin || 0,
      percentage: total > 0 ? Math.round(((props.platformStats.douyin || 0) / total) * 100) : 0
    },
    {
      name: '快手',
      icon: '快',
      color: '#FF6600',
      count: props.platformStats.kuaishou || 0,
      percentage: total > 0 ? Math.round(((props.platformStats.kuaishou || 0) / total) * 100) : 0
    },
    {
      name: '小红书',
      icon: '小',
      color: '#FF2442',
      count: props.platformStats.xiaohongshu || 0,
      percentage: total > 0 ? Math.round(((props.platformStats.xiaohongshu || 0) / total) * 100) : 0
    }
  ]
})

// 方法
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}
</script>

<style scoped>
.task-stats-cards {
  @apply w-full;
}
</style>
