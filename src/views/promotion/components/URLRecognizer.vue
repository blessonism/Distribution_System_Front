<template>
  <div class="url-recognizer">
    <!-- 标签 -->
    <Label 
      :for="inputId" 
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
      :class="{ 'text-red-600 dark:text-red-400': hasError }"
    >
      推广内容链接
      <span class="text-red-500 ml-1">*</span>
    </Label>

    <!-- URL输入框 -->
    <div class="mt-1 relative">
      <Input
        :id="inputId"
        v-model="inputUrl"
        type="url"
        placeholder="请输入推广内容链接，如：https://www.douyin.com/video/..."
        :disabled="disabled"
        :class="{ 
          'border-red-500 focus:border-red-500 focus:ring-red-500': hasError,
          'pr-10': isRecognizing
        }"
        @input="handleUrlInput"
        @blur="handleUrlBlur"
        @paste="handleUrlPaste"
      />
      
      <!-- 识别中的加载指示器 -->
      <div 
        v-if="isRecognizing" 
        class="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <svg 
          class="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            class="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4"
          />
          <path 
            class="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>

    <!-- 识别结果显示 -->
    <div v-if="showRecognitionResult && recognitionResult" class="mt-3">
      <!-- 成功识别 -->
      <div 
        v-if="recognitionResult.platform" 
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="text-sm font-medium text-green-800 dark:text-green-200">
                识别成功
              </p>
              <Badge 
                variant="secondary" 
                :class="getConfidenceBadgeClass(recognitionResult.confidence)"
              >
                {{ Math.round(recognitionResult.confidence * 100) }}%
              </Badge>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <div 
                class="w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                :style="{ backgroundColor: getPlatformColor(recognitionResult.platform) }"
              >
                {{ getPlatformIcon(recognitionResult.platform) }}
              </div>
              <span class="text-sm font-medium text-green-700 dark:text-green-300">
                {{ getPlatformDisplayName(recognitionResult.platform) }}
              </span>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400">
              {{ getConfidenceText(recognitionResult.confidence) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <Button
              v-if="!autoApplied"
              variant="outline"
              size="sm"
              @click="applyRecognitionResult"
              class="text-xs"
            >
              应用到平台选择
            </Button>
            <div v-else class="text-xs text-green-600 dark:text-green-400 font-medium">
              已自动应用
            </div>
          </div>
        </div>
      </div>

      <!-- 识别失败 -->
      <div 
        v-else 
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              无法识别平台
            </p>
            <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
              请检查链接是否正确，或手动选择推广平台
            </p>
            <!-- 建议平台 -->
            <div v-if="recognitionResult.suggestions.length > 0" class="mt-2">
              <p class="text-xs text-yellow-700 dark:text-yellow-300 mb-1">建议平台：</p>
              <div class="flex flex-wrap gap-1">
                <Button
                  v-for="platform in recognitionResult.suggestions"
                  :key="platform"
                  variant="outline"
                  size="sm"
                  @click="applySuggestion(platform)"
                  class="text-xs h-6"
                >
                  <div class="flex items-center gap-1">
                    <div 
                      class="w-3 h-3 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                      :style="{ backgroundColor: getPlatformColor(platform) }"
                    >
                      {{ getPlatformIcon(platform) }}
                    </div>
                    <span>{{ getPlatformDisplayName(platform) }}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息 */
    <div v-if="hasError" class="mt-1">
      <p class="text-sm text-red-600 dark:text-red-400">
        {{ errorMessage }}
      </p>
    </div>

    <!-- 帮助文本 */
    <div v-if="helpText && !hasError" class="mt-1">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ helpText }}
      </p>
    </div>

    <!-- URL格式提示 -->
    <div v-if="showFormatHint && !hasError && !recognitionResult" class="mt-2">
      <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          支持的链接格式：
        </p>
        <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-black flex items-center justify-center text-xs font-bold text-white">抖</div>
            <span>douyin.com、dy.com、iesdouyin.com</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-orange-600 flex items-center justify-center text-xs font-bold text-white">快</div>
            <span>kuaishou.com、ks.com、kwai.com</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-red-600 flex items-center justify-center text-xs font-bold text-white">小</div>
            <span>xiaohongshu.com、xhs.com、redbook.com</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import type { PromotionPlatform, URLRecognitionResult } from '@/types/promotion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  /** 当前URL值 */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string | null
  /** 帮助文本 */
  helpText?: string
  /** 输入框ID */
  inputId?: string
  /** 是否正在识别 */
  recognizing?: boolean
  /** 识别结果 */
  recognitionResult?: URLRecognitionResult | null
  /** 是否显示识别结果 */
  showRecognitionResult?: boolean
  /** 是否显示格式提示 */
  showFormatHint?: boolean
  /** 是否自动应用识别结果 */
  autoApply?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'blur', value: string): void
  (e: 'paste', value: string): void
  (e: 'recognize', url: string): void
  (e: 'apply-recognition', platform: PromotionPlatform): void
  (e: 'apply-suggestion', platform: PromotionPlatform): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  error: null,
  helpText: '',
  inputId: 'url-recognizer',
  recognizing: false,
  recognitionResult: null,
  showRecognitionResult: true,
  showFormatHint: true,
  autoApply: false
})

const emit = defineEmits<Emits>()

// 内部URL状态
const inputUrl = ref(props.modelValue)
const autoApplied = ref(false)

// 计算属性
const hasError = computed(() => !!props.error)
const errorMessage = computed(() => props.error)
const isRecognizing = computed(() => props.recognizing)

// 同步外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputUrl.value) {
    inputUrl.value = newValue
  }
})

// 监听识别结果，自动应用
watch(() => props.recognitionResult, (result) => {
  if (result?.platform && props.autoApply && !autoApplied.value) {
    emit('apply-recognition', result.platform)
    autoApplied.value = true
  }
}, { immediate: true })

// 重置自动应用状态
watch(() => inputUrl.value, () => {
  autoApplied.value = false
})

// 获取平台显示信息的辅助函数
const getPlatformDisplayName = (platform: PromotionPlatform): string => {
  const names = {
    douyin: '抖音',
    kuaishou: '快手',
    xiaohongshu: '小红书'
  }
  return names[platform] || platform
}

const getPlatformIcon = (platform: PromotionPlatform): string => {
  const icons = {
    douyin: '抖',
    kuaishou: '快',
    xiaohongshu: '小'
  }
  return icons[platform] || platform.charAt(0).toUpperCase()
}

const getPlatformColor = (platform: PromotionPlatform): string => {
  const colors = {
    douyin: '#000000',
    kuaishou: '#FF6600',
    xiaohongshu: '#FF2442'
  }
  return colors[platform] || '#6B7280'
}

const getConfidenceBadgeClass = (confidence: number): string => {
  if (confidence >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const getConfidenceText = (confidence: number): string => {
  if (confidence >= 0.9) return '识别置信度很高，建议直接使用'
  if (confidence >= 0.7) return '识别置信度较高，可以使用'
  if (confidence >= 0.5) return '识别置信度一般，请确认后使用'
  return '识别置信度较低，建议手动选择'
}

// 事件处理
const handleUrlInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  inputUrl.value = value
  emit('update:modelValue', value)
  emit('input', value)
  
  // 触发识别
  if (value.trim().length > 10) {
    emit('recognize', value)
  }
}

const handleUrlBlur = () => {
  emit('blur', inputUrl.value)
}

const handleUrlPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || ''
  emit('paste', pastedText)
  
  // 延迟触发识别，等待粘贴完成
  setTimeout(() => {
    if (pastedText.trim().length > 10) {
      emit('recognize', pastedText)
    }
  }, 100)
}

const applyRecognitionResult = () => {
  if (props.recognitionResult?.platform) {
    emit('apply-recognition', props.recognitionResult.platform)
    autoApplied.value = true
  }
}

const applySuggestion = (platform: PromotionPlatform) => {
  emit('apply-suggestion', platform)
}
</script>

<style scoped>
.url-recognizer {
  @apply w-full;
}
</style>
