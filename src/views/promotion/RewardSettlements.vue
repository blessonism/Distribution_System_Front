<template>
  <div class="reward-settlements-page">
    <!-- 页面头部 -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">奖励结算</h1>
            <p class="mt-1 text-sm text-gray-600">
              查看您的推广奖励结算记录，每周结算一次
            </p>
          </div>
          <!-- 刷新按钮 -->
          <Button 
            @click="refreshData" 
            :disabled="settlementsLoading"
            variant="outline"
            size="sm"
          >
            <RefreshCwIcon :class="['w-4 h-4 mr-2', settlementsLoading ? 'animate-spin' : '']" />
            刷新
          </Button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- 奖励统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- 总收益 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <TrendingUpIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">总收益</p>
              <p class="text-2xl font-semibold text-gray-900">
                ¥{{ statistics.totalEarnings.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 本周收益 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CalendarIcon class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">本周收益</p>
              <p class="text-2xl font-semibold text-gray-900">
                ¥{{ statistics.currentWeekEarnings.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 本周任务 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FileTextIcon class="h-8 w-8 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">本周通过</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ statistics.thisWeekApprovedCount }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ reachedWeeklyThreshold ? '已达标' : `还差${10 - statistics.thisWeekApprovedCount}条` }}
              </p>
            </div>
          </div>
        </div>

        <!-- 二次审核奖励 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <StarIcon class="h-8 w-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">二次审核</p>
              <p class="text-2xl font-semibold text-gray-900">
                {{ statistics.secondAuditBonusCount }}
              </p>
              <p class="text-xs text-gray-500 mt-1">已获得奖励</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 结算规则说明 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <InfoIcon class="w-4 h-4 mr-2" />
          结算规则
        </h3>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 基础奖励：每条通过初审的推广帖子价值1元</li>
          <li>• 结算周期：按自然周（周一到周日）进行结算</li>
          <li>• 结算门槛：一个自然周内累计通过审核的帖子必须≥10条才能触发结算</li>
          <li>• 二次审核：曝光量达到300+的帖子可申请二次审核，通过后获得4元额外奖励（立即发放）</li>
        </ul>
      </div>

      <!-- 本周预览 -->
      <div v-if="settlementPreview" class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <EyeIcon class="w-5 h-5 mr-2" />
          本周结算预览
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">通过任务数</p>
            <p class="text-xl font-semibold text-gray-900">{{ settlementPreview.approvedTasksCount }}</p>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">基础奖励</p>
            <p class="text-xl font-semibold text-gray-900">¥{{ settlementPreview.baseRewardAmount.toFixed(2) }}</p>
          </div>
          <div class="text-center p-4 rounded-lg" :class="settlementPreview.isQualified ? 'bg-green-50' : 'bg-red-50'">
            <p class="text-sm" :class="settlementPreview.isQualified ? 'text-green-600' : 'text-red-600'">
              结算状态
            </p>
            <p class="text-xl font-semibold" :class="settlementPreview.isQualified ? 'text-green-900' : 'text-red-900'">
              {{ settlementPreview.isQualified ? '可结算' : '未达标' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 结算记录表格 -->
      <div class="bg-white shadow-sm rounded-lg border">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">结算记录</h3>
        </div>
        
        <DataTable
          :data="settlements"
          :columns="settlementColumns"
          :loading="settlementsLoading"
          :pagination="true"
          :total-items="settlementsPagination.total"
          :page-size="settlementsPagination.pageSize"
          :current-page="settlementsPagination.page"
          @page-change="handlePageChange"
          empty-text="暂无结算记录"
        >
          <template #toolbar>
            <!-- 筛选器可以在这里添加 -->
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRewardStore } from '@/store/reward'
import { useUserStore } from '@/store/user'
import DataTable from '@/components/business/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUpIcon,
  CalendarIcon,
  FileTextIcon,
  StarIcon,
  InfoIcon,
  EyeIcon,
  RefreshCwIcon
} from 'lucide-vue-next'

// ==================== Store ====================
const rewardStore = useRewardStore()
const userStore = useUserStore()

// ==================== 状态管理 ====================
const settlements = computed(() => rewardStore.settlements)
const settlementsLoading = computed(() => rewardStore.settlementsLoading)
const settlementsPagination = computed(() => rewardStore.settlementsPagination)
const statistics = computed(() => rewardStore.statistics)
const statisticsLoading = computed(() => rewardStore.statisticsLoading)
const settlementPreview = computed(() => rewardStore.settlementPreview)
const reachedWeeklyThreshold = computed(() => rewardStore.reachedWeeklyThreshold)

// ==================== 表格列定义 ====================
const settlementColumns = computed(() => [
  {
    id: 'settlementWeek',
    accessorKey: 'settlementWeek',
    header: '结算周期',
    cell: ({ row }: any) => {
      const settlement = row.original
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium' }, settlement.settlementWeek),
        h('div', { class: 'text-xs text-gray-500' }, 
          `${settlement.weekStartDate} ~ ${settlement.weekEndDate}`
        )
      ])
    }
  },
  {
    id: 'taskCount',
    accessorKey: 'approvedTasksCount',
    header: '通过任务',
    align: 'center',
    cell: ({ row }: any) => {
      const settlement = row.original
      return h('div', { class: 'text-center' }, [
        h('div', { class: 'font-semibold' }, settlement.approvedTasksCount),
        h('div', { class: 'text-xs text-gray-500' }, '条')
      ])
    }
  },
  {
    id: 'baseReward',
    accessorKey: 'baseRewardAmount',
    header: '基础奖励',
    align: 'center',
    cell: ({ row }: any) => {
      const amount = row.original.baseRewardAmount
      return h('div', { class: 'text-center' }, [
        h('span', {
          class: 'font-medium text-green-600'
        }, `¥${amount.toFixed(2)}`)
      ])
    }
  },
  {
    id: 'bonusReward',
    accessorKey: 'bonusRewardAmount',
    header: '额外奖励',
    align: 'center',
    cell: ({ row }: any) => {
      const amount = row.original.bonusRewardAmount
      return h('div', { class: 'text-center' }, [
        h('span', {
          class: amount > 0 ? 'font-medium text-purple-600' : 'text-gray-500'
        }, amount > 0 ? `¥${amount.toFixed(2)}` : '¥0.00')
      ])
    }
  },
  {
    id: 'totalReward',
    accessorKey: 'totalRewardAmount',
    header: '总奖励',
    align: 'center',
    cell: ({ row }: any) => {
      const amount = row.original.totalRewardAmount
      return h('div', { class: 'text-center' }, [
        h('span', {
          class: 'font-semibold text-blue-600 text-lg'
        }, `¥${amount.toFixed(2)}`)
      ])
    }
  },
  {
    id: 'status',
    accessorKey: 'settlementStatus',
    header: '状态',
    align: 'center',
    cell: ({ row }: any) => {
      const status = row.original.settlementStatus
      const statusConfig = {
        PENDING: { label: '计算中', variant: 'secondary' as const, class: 'bg-gray-100 text-gray-800' },
        QUALIFIED: { label: '已达标', variant: 'default' as const, class: 'bg-green-100 text-green-800' },
        SETTLED: { label: '已结算', variant: 'default' as const, class: 'bg-blue-100 text-blue-800' },
        FAILED: { label: '未达标', variant: 'destructive' as const, class: 'bg-red-100 text-red-800' }
      }
      const config = statusConfig[status as keyof typeof statusConfig]
      
      return h('div', { class: 'flex flex-col items-center gap-1' }, [
        h(Badge, { 
          variant: config.variant,
          class: config.class
        }, () => config.label),
        status === 'SETTLED' && row.original.settlementDate 
          ? h('div', { class: 'text-xs text-gray-500' }, 
              new Date(row.original.settlementDate).toLocaleDateString('zh-CN')
            )
          : null
      ])
    }
  }
])

// ==================== 方法 ====================

/**
 * 加载数据
 */
const loadData = async () => {
  if (!userStore.userInfo?.id) {
    console.warn('用户信息未加载')
    return
  }

  try {
    const agentId = userStore.userInfo.id
    
    // 并行加载多个数据
    await Promise.all([
      rewardStore.fetchRewardSettlements({ agentId }),
      rewardStore.fetchRewardStatistics(agentId),
      rewardStore.previewWeeklySettlement(agentId)
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

/**
 * 刷新数据
 */
const refreshData = async () => {
  await loadData()
}

/**
 * 处理分页变更
 */
const handlePageChange = (page: number) => {
  rewardStore.updateSettlementsPage(page)
  if (userStore.userInfo?.id) {
    rewardStore.fetchRewardSettlements({ 
      agentId: userStore.userInfo.id,
      page 
    })
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  // 等待用户信息加载
  if (!userStore.userInfo?.id) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  await loadData()
})
</script>

<style scoped>
.reward-settlements-page {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* 统计卡片样式优化 */
.stats-card {
  @apply bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md;
}

.stats-icon {
  @apply h-8 w-8 flex-shrink-0;
}

.stats-label {
  @apply text-sm font-medium text-gray-500;
}

.stats-value {
  @apply text-2xl font-semibold text-gray-900;
}

.stats-subtitle {
  @apply text-xs text-gray-500 mt-1;
}

/* 结算预览样式 */
.preview-item {
  @apply text-center p-4 rounded-lg;
}

.preview-item.qualified {
  @apply bg-green-50;
}

.preview-item.not-qualified {
  @apply bg-red-50;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .stats-value {
    @apply text-xl;
  }
  
  .preview-item {
    @apply p-3;
  }
}
</style>