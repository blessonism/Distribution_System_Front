<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>申请二次审核</DialogTitle>
        <DialogDescription>
          当推广内容曝光量达到300+时，可申请二次审核获得4元额外奖励
        </DialogDescription>
      </DialogHeader>
      
      <!-- 资格检查结果 -->
      <div v-if="eligibilityResult && !eligibilityResult.eligible" class="mb-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <XCircleIcon class="w-4 h-4 text-red-500" />
            <span class="text-sm text-red-700">{{ eligibilityResult.reason }}</span>
          </div>
        </div>
      </div>

      <!-- 已有申请提示 -->
      <div v-if="eligibilityResult?.hasExistingRequest" class="mb-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <InfoIcon class="w-4 h-4 text-blue-500" />
            <span class="text-sm text-blue-700">
              该任务已有二次审核申请（状态：{{ getStatusText(eligibilityResult.existingRequestStatus) }}）
            </span>
          </div>
        </div>
      </div>
      
      <!-- 申请表单 -->
      <form v-if="canShowForm" @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 当前曝光量 -->
        <div>
          <Label for="viewCount" class="text-sm font-medium">
            当前曝光量 <span class="text-red-500">*</span>
          </Label>
          <Input
            id="viewCount"
            v-model.number="form.currentViewCount"
            type="number"
            :min="300"
            placeholder="请输入当前曝光量"
            required
            :disabled="submitting"
            class="mt-1"
          />
          <p class="text-xs text-gray-500 mt-1">需要达到300以上才能申请二次审核</p>
        </div>
        
        <!-- 截图证明 -->
        <div>
          <Label for="proof" class="text-sm font-medium">
            曝光量截图证明
          </Label>
          <Input
            id="proof"
            v-model="form.proofScreenshot"
            type="url"
            placeholder="请粘贴曝光量截图链接"
            :disabled="submitting"
            class="mt-1"
          />
          <p class="text-xs text-gray-500 mt-1">可选，提供截图可提高审核通过率</p>
        </div>

        <!-- 奖励说明 -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <CheckCircleIcon class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-green-700">
              <p class="font-medium">奖励说明</p>
              <ul class="mt-1 space-y-1">
                <li>• 二次审核通过后将获得4元额外奖励</li>
                <li>• 奖励将立即发放，不受周结算门槛限制</li>
                <li>• 审核结果将在1-2个工作日内通知</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- 表单按钮 -->
        <DialogFooter class="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            @click="handleCancel"
            :disabled="submitting"
          >
            取消
          </Button>
          <Button 
            type="submit" 
            :disabled="!canSubmit || submitting"
            class="min-w-[100px]"
          >
            {{ submitting ? '提交中...' : '申请二次审核' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRewardStore } from '@/store/reward'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast/use-toast'
import { 
  XCircleIcon, 
  InfoIcon, 
  CheckCircleIcon 
} from 'lucide-vue-next'

// ==================== Props & Emits ====================
interface Props {
  taskId: string
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success', request: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ==================== Store ====================
const rewardStore = useRewardStore()

// ==================== 状态管理 ====================
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const form = ref({
  currentViewCount: 300,
  proofScreenshot: ''
})

const submitting = ref(false)
const checkingEligibility = ref(false)
const eligibilityResult = ref<{
  eligible: boolean
  reason?: string
  hasExistingRequest: boolean
  existingRequestStatus?: string
} | null>(null)

// ==================== 计算属性 ====================
const canSubmit = computed(() => {
  return form.value.currentViewCount >= 300 && 
         eligibilityResult.value?.eligible === true
})

const canShowForm = computed(() => {
  return eligibilityResult.value?.eligible === true
})

// ==================== 方法 ====================

/**
 * 检查二次审核资格
 */
const checkEligibility = async () => {
  if (!props.taskId) return
  
  checkingEligibility.value = true
  try {
    eligibilityResult.value = await rewardStore.checkSecondAuditEligibility(props.taskId)
  } catch (error) {
    console.error('检查二次审核资格失败:', error)
    // 使用统一的错误处理工具
    const { showErrorToast } = await import('@/utils/errorCodeMapping')
    showErrorToast(error, '检查失败')
  } finally {
    checkingEligibility.value = false
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status?: string) => {
  const statusMap = {
    'PENDING': '审核中',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝'
  }
  return statusMap[status as keyof typeof statusMap] || status || '未知'
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  submitting.value = true
  try {
    const request = await rewardStore.requestSecondAudit(
      props.taskId,
      form.value.currentViewCount,
      form.value.proofScreenshot || undefined
    )
    
    toast({
      title: '申请成功',
      description: '二次审核申请已提交，我们将在1-2个工作日内完成审核'
    })
    
    emit('success', request)
    handleCancel()
  } catch (error: any) {
    console.error('申请二次审核失败:', error)
    // 使用统一的错误处理工具
    const { showErrorToast } = await import('@/utils/errorCodeMapping')
    showErrorToast(error, '申请失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 处理取消
 */
const handleCancel = () => {
  // 重置表单
  form.value = {
    currentViewCount: 300,
    proofScreenshot: ''
  }
  eligibilityResult.value = null
  emit('cancel')
  emit('update:open', false)
}

/**
 * 重置表单状态
 */
const resetForm = () => {
  form.value = {
    currentViewCount: 300,
    proofScreenshot: ''
  }
  eligibilityResult.value = null
  submitting.value = false
  checkingEligibility.value = false
}

// ==================== 监听器 ====================

// 监听对话框打开状态
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetForm()
    checkEligibility()
  }
})

// 监听taskId变化
watch(() => props.taskId, (newTaskId) => {
  if (newTaskId && props.open) {
    resetForm()
    checkEligibility()
  }
})
</script>

<style scoped>
/* 组件特定样式 */
.form-section {
  @apply space-y-2;
}

.form-field {
  @apply space-y-1;
}

.form-hint {
  @apply text-xs text-gray-500;
}

.reward-info {
  @apply bg-green-50 border border-green-200 rounded-lg p-3;
}

.eligibility-warning {
  @apply bg-red-50 border border-red-200 rounded-lg p-3;
}

.existing-request-info {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-3;
}
</style>