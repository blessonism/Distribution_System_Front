<template>
  <div class="task-detail-page">
    <!-- 页面头部 -->
    <div class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- 面包屑导航 -->
          <nav class="flex" aria-label="Breadcrumb">
            <ol class="flex items-center space-x-2">
              <li>
                <div class="flex items-center">
                  <router-link 
                    to="/promotion" 
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    推广管理
                  </router-link>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <router-link 
                    :to="backRoute" 
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {{ backTitle }}
                  </router-link>
                </div>
              </li>
              <li>
                <div class="flex items-center">
                  <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-gray-900 dark:text-gray-100 font-medium">
                    任务详情
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <!-- 操作按钮 -->
          <div class="flex items-center space-x-3">
            <Button
              variant="outline"
              @click="goBack"
              class="flex items-center gap-2"
            >
              <ArrowLeftIcon class="w-4 h-4" />
              返回
            </Button>
            <Button
              v-if="task?.contentUrl"
              variant="outline"
              @click="openOriginalLink"
              class="flex items-center gap-2"
            >
              <ExternalLinkIcon class="w-4 h-4" />
              查看原链接
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            加载失败
          </h3>
          <p class="text-sm text-red-600 dark:text-red-400 mb-4">
            {{ error }}
          </p>
          <Button @click="loadTaskDetail" variant="outline">
            重新加载
          </Button>
        </div>
      </div>

      <!-- 任务详情内容 -->
      <div v-else-if="task" class="space-y-6">
        <!-- 任务基本信息 -->
        <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                任务 #{{ task.id }}
              </h1>
              <div class="flex items-center gap-4">
                <Badge :variant="getStatusVariant(task.status)">
                  {{ getStatusText(task.status) }}
                </Badge>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  提交时间：{{ formatDate(task.submittedAt) }}
                </span>
              </div>
            </div>
            <div v-if="task.rewardAmount" class="text-right">
              <p class="text-sm text-gray-500 dark:text-gray-400">奖励金额</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                ¥{{ task.rewardAmount }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">基本信息</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">推广平台</dt>
                  <dd class="mt-1 flex items-center gap-2">
                    <div 
                      class="w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                      :style="{ backgroundColor: getPlatformColor(task.platform) }"
                    >
                      {{ getPlatformIcon(task.platform) }}
                    </div>
                    <span class="text-sm text-gray-900 dark:text-gray-100">
                      {{ getPlatformName(task.platform) }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">内容类型</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ getContentTypeName(task.contentType) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">推广链接</dt>
                  <dd class="mt-1">
                    <a 
                      :href="task.contentUrl" 
                      target="_blank" 
                      class="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {{ task.contentUrl }}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">审核信息</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">审核状态</dt>
                  <dd class="mt-1">
                    <Badge :variant="getStatusVariant(task.status)">
                      {{ getStatusText(task.status) }}
                    </Badge>
                  </dd>
                </div>
                <div v-if="task.auditedAt">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">审核时间</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(task.auditedAt) }}
                  </dd>
                </div>
                <div v-if="task.auditorName">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">审核人员</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ task.auditorName }}
                  </dd>
                </div>
                <div v-if="task.auditComment">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">审核备注</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {{ task.auditComment }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- 内容描述 -->
        <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">内容描述</h3>
          <div class="prose dark:prose-invert max-w-none">
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ task.contentDescription }}</p>
          </div>
        </div>

        <!-- 操作历史 -->
        <div v-if="task.auditHistory && task.auditHistory.length > 0" class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">操作历史</h3>
          <div class="space-y-4">
            <div 
              v-for="(history, index) in task.auditHistory" 
              :key="index"
              class="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {{ index + 1 }}
                </span>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ history.action }}
                  </span>
                  <Badge :variant="getStatusVariant(history.status)">
                    {{ getStatusText(history.status) }}
                  </Badge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  操作人：{{ history.operatorName }} | 时间：{{ formatDate(history.createdAt) }}
                </p>
                <p v-if="history.comment" class="text-sm text-gray-700 dark:text-gray-300">
                  {{ history.comment }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { usePromotionStore } from '@/store/promotion'
import type { PromotionTask } from '@/types/promotion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const promotionStore = usePromotionStore()

// 响应式状态
const task = ref<PromotionTask | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 计算属性 - 统一用户状态访问，添加空值检查
const backRoute = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return '/promotion'
    }
    return userRole === 'agent' ? '/promotion/my-tasks' : '/promotion/audit'
  } catch (error) {
    console.error('[TaskDetail] 返回路由计算失败:', error)
    return '/promotion'
  }
})

const backTitle = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return '推广管理'
    }
    return userRole === 'agent' ? '我的任务' : '推广审核'
  } catch (error) {
    console.error('[TaskDetail] 返回标题计算失败:', error)
    return '推广管理'
  }
})

// 页面初始化
onMounted(() => {
  loadTaskDetail()
})

// 方法
const loadTaskDetail = async () => {
  const taskId = route.params.id as string
  if (!taskId) {
    error.value = '任务ID无效'
    return
  }

  loading.value = true
  error.value = null

  try {
    task.value = await promotionStore.loadTaskDetail(taskId)
  } catch (err) {
    console.error('加载任务详情失败:', err)
    error.value = err instanceof Error ? err.message : '加载任务详情失败'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push(backRoute.value)
}

const openOriginalLink = () => {
  if (task.value?.contentUrl) {
    window.open(task.value.contentUrl, '_blank')
  }
}

// 辅助方法
const getStatusVariant = (status: string) => {
  const variants = {
    PENDING: 'secondary' as const,
    APPROVED: 'default' as const,
    REJECTED: 'destructive' as const
  }
  return variants[status as keyof typeof variants] || 'secondary'
}

const getStatusText = (status: string) => {
  const texts = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝'
  }
  return texts[status as keyof typeof texts] || status
}

const getPlatformName = (platform: string) => {
  const names = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书'
  }
  return names[platform as keyof typeof names] || platform
}

const getPlatformIcon = (platform: string) => {
  const icons = {
    douyin: '抖',
    kuaishou: '快',
    xiaohongshu: '小'
  }
  return icons[platform as keyof typeof icons] || platform.charAt(0).toUpperCase()
}

const getPlatformColor = (platform: string) => {
  const colors = {
    douyin: '#000000',
    kuaishou: '#FF6600',
    xiaohongshu: '#FF2442'
  }
  return colors[platform as keyof typeof colors] || '#6B7280'
}

const getContentTypeName = (type: string) => {
  const names = {
    video: '视频内容',
    image: '图片内容',
    article: '文章内容'
  }
  return names[type as keyof typeof names] || type
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-detail-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-950;
}
</style>
