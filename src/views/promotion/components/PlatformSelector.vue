<template>
  <div class="platform-selector">
    <!-- 标签 -->
    <Label 
      :for="inputId" 
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
      :class="{ 'text-red-600 dark:text-red-400': hasError }"
    >
      推广平台
      <span class="text-red-500 ml-1">*</span>
    </Label>

    <!-- 选择器 -->
    <div class="mt-1 space-y-3">
      <!-- 手动选择 -->
      <Select 
        :value="selectedPlatform" 
        @update:value="handlePlatformChange"
        :disabled="disabled"
      >
        <SelectTrigger 
          :id="inputId"
          class="w-full"
          :class="{ 
            'border-red-500 focus:border-red-500 focus:ring-red-500': hasError,
            'opacity-50 cursor-not-allowed': disabled
          }"
        >
          <SelectValue placeholder="请选择推广平台">
            <div v-if="selectedPlatform" class="flex items-center gap-2">
              <div 
                class="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                :style="{ backgroundColor: getPlatformColor(selectedPlatform) }"
              >
                {{ getPlatformIcon(selectedPlatform) }}
              </div>
              <span>{{ getPlatformDisplayName(selectedPlatform) }}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="platform in availablePlatforms" 
            :key="platform.value"
            :value="platform.value"
          >
            <div class="flex items-center gap-2">
              <div 
                class="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                :style="{ backgroundColor: platform.color }"
              >
                {{ platform.icon }}
              </div>
              <span>{{ platform.label }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- 自动识别结果显示 -->
      <div 
        v-if="showAutoRecognition && autoRecognitionResult" 
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3"
      >
        <div class="flex items-start gap-2">
          <div class="flex-shrink-0 mt-0.5">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
              自动识别结果
            </p>
            <div class="mt-1 flex items-center gap-2">
              <div 
                class="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white"
                :style="{ backgroundColor: getPlatformColor(autoRecognitionResult.platform) }"
              >
                {{ getPlatformIcon(autoRecognitionResult.platform) }}
              </div>
              <span class="text-sm text-blue-700 dark:text-blue-300">
                {{ getPlatformDisplayName(autoRecognitionResult.platform) }}
              </span>
              <Badge 
                variant="secondary" 
                class="text-xs"
                :class="getConfidenceBadgeClass(autoRecognitionResult.confidence)"
              >
                {{ Math.round(autoRecognitionResult.confidence * 100) }}%
              </Badge>
            </div>
            <p class="mt-1 text-xs text-blue-600 dark:text-blue-400">
              {{ getConfidenceText(autoRecognitionResult.confidence) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <Button
              v-if="autoRecognitionResult.platform !== selectedPlatform"
              variant="outline"
              size="sm"
              @click="applyAutoRecognition"
              class="text-xs"
            >
              应用
            </Button>
            <div v-else class="text-xs text-green-600 dark:text-green-400 font-medium">
              已应用
            </div>
          </div>
        </div>
      </div>

      <!-- 建议平台 -->
      <div 
        v-if="showSuggestions && suggestions.length > 0" 
        class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3"
      >
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          建议平台
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="platform in suggestions"
            :key="platform"
            variant="outline"
            size="sm"
            @click="handlePlatformChange(platform)"
            class="text-xs"
            :class="{ 'bg-blue-50 border-blue-300': platform === selectedPlatform }"
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

    <!-- 错误信息 -->
    <div v-if="hasError" class="mt-1">
      <p class="text-sm text-red-600 dark:text-red-400">
        {{ errorMessage }}
      </p>
    </div>

    <!-- 帮助文本 -->
    <div v-if="helpText && !hasError" class="mt-1">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ helpText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue'
import type { PromotionPlatform, URLRecognitionResult } from '@/types/promotion'
import { getPlatformDisplayInfo } from '@/utils/platformRecognition'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  /** 当前选中的平台 */
  modelValue?: PromotionPlatform | null
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string | null
  /** 帮助文本 */
  helpText?: string
  /** 输入框ID */
  inputId?: string
  /** 自动识别结果 */
  autoRecognitionResult?: URLRecognitionResult | null
  /** 是否显示自动识别结果 */
  showAutoRecognition?: boolean
  /** 建议平台列表 */
  suggestions?: PromotionPlatform[]
  /** 是否显示建议 */
  showSuggestions?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: PromotionPlatform | null): void
  (e: 'change', value: PromotionPlatform | null): void
  (e: 'apply-auto-recognition', platform: PromotionPlatform): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
  error: null,
  helpText: '',
  inputId: 'platform-selector',
  autoRecognitionResult: null,
  showAutoRecognition: true,
  suggestions: () => [],
  showSuggestions: true
})

const emit = defineEmits<Emits>()

// 可用平台列表
const availablePlatforms = computed(() => [
  {
    value: 'douyin' as PromotionPlatform,
    label: '抖音',
    icon: '抖',
    color: '#000000'
  },
  {
    value: 'kuaishou' as PromotionPlatform,
    label: '快手',
    icon: '快',
    color: '#FF6600'
  },
  {
    value: 'xiaohongshu' as PromotionPlatform,
    label: '小红书',
    icon: '小',
    color: '#FF2442'
  }
])

// 当前选中的平台
const selectedPlatform = computed(() => props.modelValue)

// 是否有错误
const hasError = computed(() => !!props.error)

// 错误信息
const errorMessage = computed(() => props.error)

// 获取平台显示名称
const getPlatformDisplayName = (platform: PromotionPlatform): string => {
  const platformInfo = availablePlatforms.value.find(p => p.value === platform)
  return platformInfo?.label || platform
}

// 获取平台图标
const getPlatformIcon = (platform: PromotionPlatform): string => {
  const platformInfo = availablePlatforms.value.find(p => p.value === platform)
  return platformInfo?.icon || platform.charAt(0).toUpperCase()
}

// 获取平台颜色
const getPlatformColor = (platform: PromotionPlatform): string => {
  const platformInfo = availablePlatforms.value.find(p => p.value === platform)
  return platformInfo?.color || '#6B7280'
}

// 获取置信度徽章样式
const getConfidenceBadgeClass = (confidence: number): string => {
  if (confidence >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

// 获取置信度文本
const getConfidenceText = (confidence: number): string => {
  if (confidence >= 0.9) return '识别置信度很高'
  if (confidence >= 0.7) return '识别置信度较高'
  if (confidence >= 0.5) return '识别置信度一般'
  return '识别置信度较低'
}

// 处理平台变化
const handlePlatformChange = (platform: PromotionPlatform | null) => {
  emit('update:modelValue', platform)
  emit('change', platform)
}

// 应用自动识别结果
const applyAutoRecognition = () => {
  if (props.autoRecognitionResult?.platform) {
    handlePlatformChange(props.autoRecognitionResult.platform)
    emit('apply-auto-recognition', props.autoRecognitionResult.platform)
  }
}
</script>

<style scoped>
.platform-selector {
  @apply w-full;
}
</style>
