<template>
  <div class="task-submit-form">
    <!-- 错误边界 -->
    <div v-if="componentError" class="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            组件加载失败
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {{ componentError }}
          </div>
          <div class="mt-3">
            <button
              @click="retryComponent"
              class="bg-red-100 dark:bg-red-800 px-3 py-1 rounded text-sm text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单标题 -->
    <div v-else class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        提交推广任务
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        请填写推广内容信息，系统将自动识别平台类型
      </p>
    </div>

    <!-- 表单内容 -->
    <form v-if="!componentError && isComponentReady" @submit.prevent="handleSubmit" class="space-y-6">
      <!-- URL识别组件 -->
      <URLRecognizer
        :model-value="safeFormData.contentUrl"
        @update:model-value="(value) => updateField('contentUrl', value)"
        :recognizing="urlRecognition?.recognizing?.value || false"
        :recognition-result="urlRecognition?.result?.value || null"
        :error="safeFormErrors.contentUrl || null"
        :auto-apply="true"
        @recognize="handleUrlRecognize"
        @apply-recognition="handleApplyRecognition"
        @apply-suggestion="handleApplySuggestion"
      />

      <!-- 平台选择器 -->
      <PlatformSelector
        :model-value="safeFormData.platform"
        @update:model-value="(value) => updateField('platform', value)"
        :auto-recognition-result="urlRecognition?.result?.value || null"
        :error="safeFormErrors.platform || null"
        help-text="如果自动识别不准确，请手动选择正确的平台"
        @apply-auto-recognition="handleApplyRecognition"
      />

      <!-- 内容类型选择 -->
      <div class="space-y-2">
        <Label 
          for="content-type" 
          class="text-sm font-medium text-gray-700 dark:text-gray-300"
          :class="{ 'text-red-600 dark:text-red-400': safeFormErrors.contentType }"
        >
          内容类型
          <span class="text-red-500 ml-1">*</span>
        </Label>
        <Select
          :model-value="safeFormData.contentType"
          @update:model-value="(value) => updateField('contentType', value)"
        >
          <SelectTrigger
            id="content-type"
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': safeFormErrors.contentType }"
          >
            <SelectValue placeholder="请选择内容类型">
              <span v-if="safeFormData.contentType">
                {{ getContentTypeDisplayName(safeFormData.contentType) }}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="type in contentTypes" 
              :key="type.value"
              :value="type.value"
            >
              <div class="flex items-center gap-2">
                <component :is="type.icon" class="w-4 h-4" />
                <span>{{ type.label }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="safeFormErrors.contentType" class="text-sm text-red-600 dark:text-red-400">
          {{ safeFormErrors.contentType }}
        </p>
      </div>

      <!-- 内容描述 -->
      <div class="space-y-2">
        <Label
          for="content-description"
          class="text-sm font-medium text-gray-700 dark:text-gray-300"
          :class="{ 'text-red-600 dark:text-red-400': safeFormErrors.contentDescription }"
        >
          内容描述
          <span class="text-red-500 ml-1">*</span>
        </Label>
        <Textarea
          id="content-description"
          :model-value="safeFormData.contentDescription"
          @update:model-value="(value) => updateField('contentDescription', value)"
          placeholder="请详细描述推广内容，包括主要卖点、目标受众等（10-500字符）"
          rows="4"
          :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': safeFormErrors.contentDescription }"
        />
        <div class="flex justify-between items-center">
          <p v-if="safeFormErrors.contentDescription" class="text-sm text-red-600 dark:text-red-400">
            {{ safeFormErrors.contentDescription }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {{ (safeFormData.contentDescription || '').length }}/500
          </p>
        </div>
      </div>

      <!-- 提交错误信息 -->
      <div v-if="safeSubmissionError" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              提交失败
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ safeSubmissionError }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          @click="handleReset"
          :disabled="safeIsSubmitting"
        >
          重置表单
        </Button>
        <Button
          type="submit"
          :disabled="!safeIsFormValid || safeIsSubmitting"
          class="min-w-[100px]"
        >
          <div v-if="safeIsSubmitting" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>提交中...</span>
          </div>
          <span v-else>提交任务</span>
        </Button>
      </div>
    </form>

    <!-- 表单提示 -->
    <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            提交须知
          </h3>
          <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <ul class="list-disc list-inside space-y-1">
              <li>请确保推广内容链接有效且可访问</li>
              <li>内容描述应真实准确，便于审核员理解</li>
              <li>提交后将进入审核流程，请耐心等待</li>
              <li>审核结果将在1-3个工作日内反馈</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, ref, onMounted, onErrorCaptured } from 'vue'
import type { PromotionPlatform, PromotionContentType } from '@/types/promotion'
import { useTaskSubmission } from '@/composables/useTaskSubmission'
import { useURLRecognition } from '@/composables/useURLRecognition'
import URLRecognizer from './URLRecognizer.vue'
import PlatformSelector from './PlatformSelector.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { VideoIcon, ImageIcon, FileTextIcon } from 'lucide-vue-next'

interface Emits {
  (e: 'submit-success', taskId: string): void
  (e: 'submit-error', error: string): void
}

const emit = defineEmits<Emits>()

// 错误边界状态
const componentError = ref<string | null>(null)
const isComponentReady = ref(false)

// 组件初始化
onMounted(() => {
  try {
    isComponentReady.value = true
    console.log('[TaskSubmitForm] 组件初始化成功')
  } catch (error) {
    componentError.value = error instanceof Error ? error.message : '组件初始化失败'
    console.error('[TaskSubmitForm] 组件初始化失败:', error)
  }
})

// 错误捕获
onErrorCaptured((error) => {
  componentError.value = error.message || '组件运行时错误'
  console.error('[TaskSubmitForm] 捕获到错误:', error)
  return false // 阻止错误继续传播
})

// 重试组件
const retryComponent = () => {
  componentError.value = null
  isComponentReady.value = false

  setTimeout(() => {
    try {
      isComponentReady.value = true
    } catch (error) {
      componentError.value = error instanceof Error ? error.message : '重试失败'
    }
  }, 100)
}

// 使用任务提交逻辑（添加错误处理）
let taskSubmissionComposable: any = null
let urlRecognitionComposable: any = null

try {
  taskSubmissionComposable = useTaskSubmission({
    enableAutoRecognition: true,
    autoRedirectOnSuccess: false, // 由父组件处理跳转
    showSuccessToast: true,
    showErrorToast: true
  })

  urlRecognitionComposable = useURLRecognition({
    autoRecognize: true,
    debounceDelay: 500
  })
} catch (error) {
  componentError.value = '初始化业务逻辑失败'
  console.error('[TaskSubmitForm] 业务逻辑初始化失败:', error)
}

// 安全访问composable，提供默认值
const {
  formData,
  isFormValid,
  formErrors,
  isSubmitting,
  submissionError,
  updateField,
  resetForm,
  submitTask
} = taskSubmissionComposable || {}

const urlRecognition = urlRecognitionComposable || {
  recognizing: ref(false),
  result: ref(null),
  setInputUrl: () => {},
  reset: () => {}
}

// 创建安全的响应式引用
const safeFormData = computed(() => formData?.value || {
  platform: null,
  contentType: null,
  contentUrl: '',
  contentDescription: ''
})

const safeFormErrors = computed(() => formErrors?.value || {})
const safeIsFormValid = computed(() => isFormValid?.value || false)
const safeIsSubmitting = computed(() => isSubmitting?.value || false)
const safeSubmissionError = computed(() => submissionError?.value || null)

// 内容类型选项
const contentTypes = computed(() => [
  {
    value: 'video' as PromotionContentType,
    label: '视频内容',
    icon: VideoIcon
  },
  {
    value: 'image' as PromotionContentType,
    label: '图片内容',
    icon: ImageIcon
  },
  {
    value: 'article' as PromotionContentType,
    label: '文章内容',
    icon: FileTextIcon
  }
])

// 获取内容类型显示名称
const getContentTypeDisplayName = (type: PromotionContentType): string => {
  try {
    if (!type || typeof type !== 'string') {
      return ''
    }
    const typeInfo = contentTypes.value?.find(t => t.value === type)
    return typeInfo?.label || type
  } catch (error) {
    console.error('[TaskSubmitForm] 获取内容类型显示名称失败:', error)
    return ''
  }
}

// 处理URL识别
const handleUrlRecognize = (url: string) => {
  try {
    if (!urlRecognition || !urlRecognition.setInputUrl) {
      console.warn('[TaskSubmitForm] URL识别功能不可用')
      return
    }
    urlRecognition.setInputUrl(url)
  } catch (error) {
    console.error('[TaskSubmitForm] URL识别失败:', error)
  }
}

// 处理应用识别结果
const handleApplyRecognition = (platform: PromotionPlatform) => {
  try {
    if (!updateField) {
      console.warn('[TaskSubmitForm] 表单更新功能不可用')
      return
    }
    updateField('platform', platform)
  } catch (error) {
    console.error('[TaskSubmitForm] 应用识别结果失败:', error)
  }
}

// 处理应用建议平台
const handleApplySuggestion = (platform: PromotionPlatform) => {
  try {
    if (!updateField) {
      console.warn('[TaskSubmitForm] 表单更新功能不可用')
      return
    }
    updateField('platform', platform)
  } catch (error) {
    console.error('[TaskSubmitForm] 应用建议平台失败:', error)
  }
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (!submitTask) {
      throw new Error('提交功能不可用')
    }

    const success = await submitTask()
    if (success) {
      // 获取最新提交的任务ID（这里简化处理）
      const taskId = `TASK_${Date.now()}`
      emit('submit-success', taskId)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '提交失败'
    console.error('[TaskSubmitForm] 表单提交失败:', error)
    emit('submit-error', errorMessage)
  }
}

// 处理表单重置
const handleReset = () => {
  try {
    if (resetForm) {
      resetForm()
    }
    if (urlRecognition && urlRecognition.reset) {
      urlRecognition.reset()
    }
  } catch (error) {
    console.error('[TaskSubmitForm] 表单重置失败:', error)
  }
}
</script>

<style scoped>
.task-submit-form {
  @apply max-w-2xl mx-auto;
}
</style>
