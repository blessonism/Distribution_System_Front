<template>
  <div class="task-submit-page">
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
                  <span class="text-gray-900 dark:text-gray-100 font-medium">
                    提交任务
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <!-- 操作按钮 -->
          <div class="flex items-center space-x-3">
            <Button
              variant="outline"
              @click="goToTaskList"
              class="flex items-center gap-2"
            >
              <ListIcon class="w-4 h-4" />
              我的任务
            </Button>
            <Button
              variant="outline"
              @click="refreshPage"
              :disabled="isSubmitting"
            >
              <RefreshCwIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：表单区域 -->
        <div class="lg:col-span-2">
          <!-- 提交限制检查 -->
          <SubmissionLimitGuard
            ref="submissionGuardRef"
            :auto-check="true"
            @limit-updated="handleLimitUpdated"
            @can-submit-changed="handleCanSubmitChanged"
          />

          <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <!-- 组件加载状态 -->
            <div v-if="!isComponentMounted" class="flex justify-center items-center py-12">
              <div class="text-center">
                <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <p class="text-sm text-gray-500 dark:text-gray-400">正在加载表单...</p>
              </div>
            </div>

            <!-- 表单组件 -->
            <TaskSubmitForm
              v-else
              :can-submit="canSubmitBasedOnLimit"
              @submit-success="handleSubmitSuccess"
              @submit-error="handleSubmitError"
            />
          </div>
        </div>

        <!-- 右侧：帮助信息和统计 -->
        <div class="space-y-6">
          <!-- 快速统计 -->
          <div v-if="canViewStats" class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              我的统计
            </h3>
            <div v-if="statsLoading" class="flex justify-center py-4">
              <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <div v-else-if="stats" class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">总提交数</span>
                <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ stats.totalSubmitted }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">待审核</span>
                <span class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{{ stats.pendingAudit }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">已通过</span>
                <span class="text-lg font-semibold text-green-600 dark:text-green-400">{{ stats.approved }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">已拒绝</span>
                <span class="text-lg font-semibold text-red-600 dark:text-red-400">{{ stats.rejected }}</span>
              </div>
              <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">总奖励</span>
                  <span class="text-lg font-semibold text-blue-600 dark:text-blue-400">¥{{ stats.totalReward }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 提交指南 -->
          <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              提交指南
            </h3>
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">准备推广链接</p>
                  <p>确保链接有效且可访问，支持抖音、快手、小红书平台</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">填写详细描述</p>
                  <p>详细描述推广内容，包括主要卖点和目标受众</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">等待审核</p>
                  <p>提交后1-3个工作日内会有审核结果反馈</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 常见问题 -->
          <div class="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              常见问题
            </h3>
            <div class="space-y-3">
              <details class="group">
                <summary class="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span>支持哪些平台？</span>
                  <ChevronDownIcon class="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  目前支持抖音、快手、小红书三大主流短视频和社交平台。
                </p>
              </details>
              <details class="group">
                <summary class="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span>审核需要多长时间？</span>
                  <ChevronDownIcon class="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  一般情况下，审核会在1-3个工作日内完成。复杂内容可能需要更长时间。
                </p>
              </details>
              <details class="group">
                <summary class="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span>如何提高通过率？</span>
                  <ChevronDownIcon class="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  确保内容真实有效，描述详细准确，遵守平台规范和相关法律法规。
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示对话框 -->
    <Dialog v-model:open="showSuccessDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <CheckCircleIcon class="w-5 h-5 text-green-600" />
            提交成功
          </DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            您的推广任务已成功提交，任务ID：<span class="font-mono font-medium">{{ submittedTaskId }}</span>
          </p>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            我们将在1-3个工作日内完成审核，请耐心等待。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showSuccessDialog = false">
            继续提交
          </Button>
          <Button @click="goToTaskList">
            查看我的任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePromotionStore } from '@/store/promotion'
import { useUserStore } from '@/store/user'
import TaskSubmitForm from './components/TaskSubmitForm.vue'
import SubmissionLimitGuard from '@/components/promotion/SubmissionLimitGuard.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  ListIcon, 
  RefreshCwIcon, 
  ChevronDownIcon, 
  CheckCircleIcon 
} from 'lucide-vue-next'
import { toast } from '@/components/ui/toast/use-toast'
import type { SubmissionLimitCheck } from '@/types/reward'

const router = useRouter()
const promotionStore = usePromotionStore()
const userStore = useUserStore()

// 响应式状态
const showSuccessDialog = ref(false)
const submittedTaskId = ref('')

// 提交限制相关状态
const submissionGuardRef = ref<InstanceType<typeof SubmissionLimitGuard> | null>(null)
const canSubmitBasedOnLimit = ref(false)
const currentSubmissionLimit = ref<SubmissionLimitCheck | null>(null)

// 权限检查 - 统一用户状态访问，添加空值检查
const canSubmitTask = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return false
    }
    return ['agent', 'super_admin', 'director', 'leader'].includes(userRole)
  } catch (error) {
    console.error('[TaskSubmit] 权限检查失败:', error)
    return false
  }
})

const canViewStats = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    if (!userRole || !userStore.userInfo) {
      return false
    }
    return ['agent', 'super_admin', 'director', 'leader'].includes(userRole)
  } catch (error) {
    console.error('[TaskSubmit] 统计权限检查失败:', error)
    return false
  }
})

// 计算属性
const stats = computed(() => promotionStore.agentTaskStats)
const statsLoading = computed(() => promotionStore.agentStatsLoading)
const isSubmitting = computed(() => promotionStore.submissionLoading)

// 组件状态管理
const isComponentMounted = ref(false)
const abortController = ref<AbortController | null>(null)

// 页面初始化
onMounted(async () => {
  try {
    isComponentMounted.value = true
    abortController.value = new AbortController()

    // 权限检查
    if (!canSubmitTask.value) {
      if (isComponentMounted.value) {
        toast({
          title: '权限不足',
          description: '您没有权限访问任务提交功能',
          variant: 'destructive'
        })
        router.push('/dashboard')
      }
      return
    }

    // 加载代理任务统计（如果有权限且组件仍然挂载）
    if (canViewStats.value && isComponentMounted.value) {
      try {
        await promotionStore.loadAgentTaskStats()
      } catch (error) {
        // 只有在组件仍然挂载时才显示错误
        if (isComponentMounted.value) {
          console.error('[TaskSubmit] 加载统计数据失败:', error)
        }
      }
    }
  } catch (error) {
    if (isComponentMounted.value) {
      console.error('[TaskSubmit] 组件初始化失败:', error)
    }
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  try {
    isComponentMounted.value = false

    // 取消所有未完成的请求
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }

    // 清理其他资源
    console.log('[TaskSubmit] 组件清理完成')
  } catch (error) {
    console.error('[TaskSubmit] 组件清理失败:', error)
  }
})

// 处理提交限制更新
const handleLimitUpdated = (limitCheck: SubmissionLimitCheck) => {
  if (!isComponentMounted.value) return
  
  try {
    currentSubmissionLimit.value = limitCheck
    console.log('[TaskSubmit] 提交限制已更新:', limitCheck)
  } catch (error) {
    console.error('[TaskSubmit] 处理限制更新失败:', error)
  }
}

// 处理提交能力变更
const handleCanSubmitChanged = (canSubmit: boolean) => {
  if (!isComponentMounted.value) return
  
  try {
    canSubmitBasedOnLimit.value = canSubmit
    console.log('[TaskSubmit] 提交能力已更新:', canSubmit)
  } catch (error) {
    console.error('[TaskSubmit] 处理提交能力变更失败:', error)
  }
}

// 处理提交成功
const handleSubmitSuccess = async (taskId: string) => {
  if (!isComponentMounted.value) return

  try {
    submittedTaskId.value = taskId
    showSuccessDialog.value = true

    // 记录任务提交到限制系统
    if (submissionGuardRef.value) {
      try {
        await submissionGuardRef.value.recordSubmission()
        console.log('[TaskSubmit] 任务提交已记录到限制系统')
      } catch (error) {
        console.error('[TaskSubmit] 记录任务提交失败:', error)
        // 不影响主流程，只记录错误
      }
    }

    // 刷新统计数据（如果组件仍然挂载）
    if (isComponentMounted.value) {
      promotionStore.loadAgentTaskStats().catch(error => {
        if (isComponentMounted.value) {
          console.error('[TaskSubmit] 刷新统计数据失败:', error)
        }
      })
    }
  } catch (error) {
    if (isComponentMounted.value) {
      console.error('[TaskSubmit] 处理提交成功失败:', error)
    }
  }
}

// 处理提交错误
const handleSubmitError = (error: string) => {
  if (!isComponentMounted.value) return

  try {
    toast({
      title: '提交失败',
      description: error,
      variant: 'destructive'
    })
  } catch (err) {
    console.error('[TaskSubmit] 显示错误提示失败:', err)
  }
}

// 跳转到任务列表
const goToTaskList = () => {
  if (!isComponentMounted.value) return

  try {
    router.push('/promotion/my-tasks')
  } catch (error) {
    console.error('[TaskSubmit] 路由跳转失败:', error)
  }
}

// 刷新页面
const refreshPage = async () => {
  if (!isComponentMounted.value) return

  try {
    // 刷新统计数据
    await promotionStore.loadAgentTaskStats()

    if (isComponentMounted.value) {
      toast({
        title: '刷新成功',
        description: '数据已更新',
        variant: 'default'
      })
    }
  } catch (error) {
    if (isComponentMounted.value) {
      console.error('[TaskSubmit] 刷新失败:', error)
      toast({
        title: '刷新失败',
        description: '无法更新数据，请稍后重试',
        variant: 'destructive'
      })
    }
  }
}
</script>

<style scoped>
.task-submit-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-950;
}

/* 自定义details样式 */
details {
  @apply border-b border-gray-200 dark:border-gray-700 pb-3;
}

details:last-child {
  @apply border-b-0;
}

details summary {
  @apply list-none;
}

details summary::-webkit-details-marker {
  @apply hidden;
}
</style>
