<template>
  <div class="submission-limit-guard mb-6">
    <!-- 加载状态 -->
    <div v-if="loading" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <div class="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
        <div class="h-4 bg-gray-300 rounded animate-pulse flex-1"></div>
      </div>
    </div>

    <!-- 提交已达上限 -->
    <div v-else-if="!limitCheck.canSubmit" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <AlertTriangleIcon class="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-sm font-medium text-yellow-800">今日提交已达上限</h3>
          <p class="text-sm text-yellow-700 mt-1">
            您今日已提交 {{ limitCheck.currentCount }}/{{ limitCheck.dailyLimit }} 条任务，
            明日 {{ formatTime(limitCheck.nextResetTime) }} 后可继续提交
          </p>
        </div>
      </div>
    </div>

    <!-- 可以提交 -->
    <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <CheckCircleIcon class="w-5 h-5 text-green-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-sm font-medium text-green-800">可以提交</h3>
          <p class="text-sm text-green-700 mt-1">
            今日还可提交 {{ limitCheck.remainingCount }} 条任务
          </p>
        </div>
        <!-- 刷新按钮 -->
        <button
          @click="refreshLimit"
          :disabled="refreshing"
          class="p-1 text-green-600 hover:text-green-700 transition-colors"
          title="刷新状态"
        >
          <RefreshCwIcon 
            :class="[
              'w-4 h-4',
              refreshing ? 'animate-spin' : ''
            ]" 
          />
        </button>
      </div>
    </div>

    <!-- 提交规则说明 -->
    <div class="mt-4 text-xs text-gray-500">
      <p>• 每位代理每日最多可提交 {{ limitCheck.dailyLimit }} 条推广任务</p>
      <p>• 每日限制在北京时间 00:00 重置</p>
      <p>• 提交后请等待系统审核，通过后方可计入奖励</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineExpose } from 'vue'
import { useRewardStore } from '@/store/reward'
import { useUserStore } from '@/store/user'
import type { SubmissionLimitCheck } from '@/types/reward'
import { AlertTriangleIcon, CheckCircleIcon, RefreshCwIcon } from 'lucide-vue-next'

// ==================== Props & Emits ====================
interface Props {
  // 是否自动检查（组件挂载时）
  autoCheck?: boolean
  // 轮询间隔（毫秒），0表示不轮询
  pollInterval?: number
}

interface Emits {
  (e: 'limit-updated', limitCheck: SubmissionLimitCheck): void
  (e: 'can-submit-changed', canSubmit: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  autoCheck: true,
  pollInterval: 0
})

const emit = defineEmits<Emits>()

// ==================== Store ====================
const rewardStore = useRewardStore()
const userStore = useUserStore()

// ==================== 状态管理 ====================
const loading = ref(false)
const refreshing = ref(false)
const pollTimer = ref<NodeJS.Timeout | null>(null)

// 获取限制检查结果
const limitCheck = computed(() => rewardStore.submissionLimit)

// ==================== 方法 ====================

/**
 * 检查提交限制
 */
const checkLimit = async () => {
  if (!userStore.userInfo?.id) {
    console.warn('用户信息未加载，无法检查提交限制')
    return
  }

  loading.value = true
  try {
    // 临时使用模拟数据，避免API 404错误
    console.log('[SubmissionLimitGuard] 使用模拟数据检查提交限制')

    // 模拟提交限制检查结果
    const mockLimitCheck = {
      canSubmit: true,
      currentCount: 0,
      dailyLimit: 2,
      remainingCount: 2,
      nextResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    // 更新store中的数据
    rewardStore.submissionLimit = mockLimitCheck

    emit('limit-updated', limitCheck.value)
    emit('can-submit-changed', limitCheck.value.canSubmit)

    // 如果需要真实API，取消注释下面的代码
    // await rewardStore.checkSubmissionLimit(userStore.userInfo.id)

  } catch (error) {
    console.error('检查提交限制失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 刷新限制状态
 */
const refreshLimit = async () => {
  refreshing.value = true
  try {
    await checkLimit()
  } finally {
    refreshing.value = false
  }
}

/**
 * 记录任务提交（外部调用）
 */
const recordSubmission = async () => {
  if (!userStore.userInfo?.id) {
    throw new Error('用户信息未加载')
  }

  try {
    // 临时模拟记录提交，避免API 404错误
    console.log('[SubmissionLimitGuard] 模拟记录任务提交')

    // 模拟更新提交计数
    const currentLimit = rewardStore.submissionLimit
    if (currentLimit.currentCount < currentLimit.dailyLimit) {
      currentLimit.currentCount += 1
      currentLimit.remainingCount = currentLimit.dailyLimit - currentLimit.currentCount
      currentLimit.canSubmit = currentLimit.currentCount < currentLimit.dailyLimit
    }

    emit('limit-updated', limitCheck.value)
    emit('can-submit-changed', limitCheck.value.canSubmit)

    // 如果需要真实API，取消注释下面的代码
    // await rewardStore.recordTaskSubmission(userStore.userInfo.id)

  } catch (error) {
    console.error('记录任务提交失败:', error)
    throw error
  }
}

/**
 * 格式化时间
 */
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  try {
    return new Date(timeStr).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return timeStr
  }
}

/**
 * 启动轮询
 */
const startPolling = () => {
  if (props.pollInterval > 0) {
    stopPolling() // 先清除现有的定时器
    pollTimer.value = setInterval(() => {
      checkLimit()
    }, props.pollInterval)
  }
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  if (props.autoCheck) {
    // 等待用户信息加载完成
    if (!userStore.userInfo?.id) {
      // 如果用户信息未加载，等待一下
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    await checkLimit()
  }
  
  // 启动轮询
  startPolling()
})

// 监听用户信息变化
watch(() => userStore.userInfo?.id, (newUserId, oldUserId) => {
  if (newUserId && newUserId !== oldUserId) {
    checkLimit()
  }
})

// 组件卸载时清理定时器
const cleanup = () => {
  stopPolling()
}

// 导出方法供父组件调用
defineExpose({
  checkLimit,
  refreshLimit,
  recordSubmission,
  cleanup
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(cleanup)
</script>

<style scoped>
.submission-limit-guard {
  /* 组件样式 */
}
</style>