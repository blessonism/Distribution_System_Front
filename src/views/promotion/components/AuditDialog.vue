<template>
  <Dialog :open="open" @update:open="handleDialogClose">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <div 
            class="h-8 w-8 rounded-full flex items-center justify-center"
            :class="{
              'bg-green-100': auditType === 'approve',
              'bg-red-100': auditType === 'reject'
            }"
          >
            <CheckCircle 
              v-if="auditType === 'approve'" 
              class="h-4 w-4 text-green-600" 
            />
            <XCircle 
              v-else 
              class="h-4 w-4 text-red-600" 
            />
          </div>
          <span>
            {{ auditType === 'approve' ? '审核通过' : '审核拒绝' }}
          </span>
        </DialogTitle>
        <DialogDescription>
          {{ getDialogDescription() }}
        </DialogDescription>
      </DialogHeader>

      <!-- 加载状态 -->
      <div v-if="loading" class="py-6">
        <div class="flex items-center justify-center space-x-2">
          <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span class="text-sm text-muted-foreground">操作处理中...</span>
        </div>
      </div>

      <!-- 表单内容 -->
      <div v-else class="space-y-6">
        <!-- 任务基本信息 -->
        <div v-if="task" class="space-y-3">
          <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <Badge :variant="getStatusVariant(task.status)">
                  {{ getStatusDisplay(task.status).label }}
                </Badge>
                <Badge variant="secondary">
                  {{ getPlatformDisplay(task.platform) }}
                </Badge>
              </div>
              <p class="text-sm font-medium">{{ task.agentName }}</p>
              <p class="text-xs text-muted-foreground">任务ID: {{ task.id }}</p>
            </div>
            <div class="text-right space-y-1">
              <p class="text-sm text-muted-foreground">提交时间</p>
              <p class="text-xs">{{ formatDateTime(task.submittedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- 审核表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 奖励金额 (仅通过时显示) -->
          <div v-if="auditType === 'approve'" class="space-y-2">
            <Label for="reward-amount" class="text-sm font-medium">
              奖励金额 *
            </Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id="reward-amount"
                v-model.number="formData.rewardAmount"
                type="number"
                step="0.01"
                min="0"
                max="10000"
                placeholder="0.00"
                class="pl-8"
                :class="{ 'border-red-500': errors.rewardAmount }"
                @input="validateRewardAmount"
              />
            </div>
            <div class="flex items-center justify-between">
              <p v-if="errors.rewardAmount" class="text-xs text-red-600">
                {{ errors.rewardAmount }}
              </p>
              <div class="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>推荐范围: </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="setRewardAmount(1)"
                  class="h-5 px-2 text-xs"
                >
                  ¥1.00
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="setRewardAmount(5)"
                  class="h-5 px-2 text-xs"
                >
                  ¥5.00
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="setRewardAmount(10)"
                  class="h-5 px-2 text-xs"
                >
                  ¥10.00
                </Button>
              </div>
            </div>
          </div>

          <!-- 审核意见 -->
          <div class="space-y-2">
            <Label for="audit-comment" class="text-sm font-medium">
              审核意见
              <span v-if="auditType === 'reject'" class="text-red-600">*</span>
            </Label>
            <Textarea
              id="audit-comment"
              v-model="formData.comment"
              :placeholder="getCommentPlaceholder()"
              :rows="4"
              :maxlength="500"
              :class="{ 'border-red-500': errors.comment }"
              @input="validateComment"
            />
            <div class="flex items-center justify-between">
              <p v-if="errors.comment" class="text-xs text-red-600">
                {{ errors.comment }}
              </p>
              <span class="text-xs text-muted-foreground">
                {{ formData.comment.length }}/500
              </span>
            </div>
          </div>

          <!-- 快速填充模板 (仅拒绝时显示) -->
          <div v-if="auditType === 'reject'" class="space-y-2">
            <Label class="text-sm font-medium">常用拒绝原因</Label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                v-for="template in rejectTemplates"
                :key="template.id"
                type="button"
                variant="outline"
                size="sm"
                @click="useRejectTemplate(template.content)"
                class="justify-start text-xs h-8"
              >
                {{ template.label }}
              </Button>
            </div>
          </div>

          <!-- 通过模板 (仅通过时显示) -->
          <div v-if="auditType === 'approve'" class="space-y-2">
            <Label class="text-sm font-medium">快速意见</Label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                v-for="template in approveTemplates"
                :key="template.id"
                type="button"
                variant="outline"
                size="sm"
                @click="useApproveTemplate(template.content)"
                class="justify-start text-xs h-8"
              >
                {{ template.label }}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          @click="handleCancel"
          :disabled="loading"
        >
          取消
        </Button>
        <Button
          type="button"
          :variant="auditType === 'approve' ? 'default' : 'destructive'"
          @click="handleSubmit"
          :disabled="loading || !isFormValid"
          class="min-w-20"
        >
          <div v-if="loading" class="flex items-center space-x-2">
            <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>处理中</span>
          </div>
          <div v-else class="flex items-center space-x-1">
            <CheckCircle v-if="auditType === 'approve'" class="h-4 w-4" />
            <XCircle v-else class="h-4 w-4" />
            <span>{{ auditType === 'approve' ? '确认通过' : '确认拒绝' }}</span>
          </div>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast/use-toast'
import { CheckCircle, XCircle } from 'lucide-vue-next'
import type { PromotionTask, AuditRequest } from '@/types/promotion'
import { 
  getStatusDisplay, 
  getPlatformDisplay 
} from '@/types/promotion'

// Props 定义
interface Props {
  open: boolean
  task?: PromotionTask | null
  auditType: 'approve' | 'reject'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits 定义
interface Emits {
  'update:open': [value: boolean]
  close: []
  submit: [request: AuditRequest]
  cancel: []
}

const emit = defineEmits<Emits>()

// 表单数据
interface FormData {
  comment: string
  rewardAmount: number | null
}

const formData = ref<FormData>({
  comment: '',
  rewardAmount: null
})

// 表单验证错误
interface FormErrors {
  comment: string
  rewardAmount: string
}

const errors = ref<FormErrors>({
  comment: '',
  rewardAmount: ''
})

// 拒绝原因模板
const rejectTemplates = [
  { id: 1, label: '内容不符合规范', content: '推广内容不符合平台规范要求，请修改后重新提交。' },
  { id: 2, label: '图片质量问题', content: '推广图片质量不佳或内容不清晰，请使用高质量图片。' },
  { id: 3, label: '链接无效', content: '推广链接无法正常访问，请检查链接有效性后重新提交。' },
  { id: 4, label: '信息不完整', content: '推广信息填写不完整，请补充完整信息后重新提交。' },
  { id: 5, label: '违反政策', content: '推广内容违反相关政策规定，不予通过。' },
  { id: 6, label: '重复提交', content: '该推广任务已存在，请勿重复提交。' }
]

// 通过意见模板
const approveTemplates = [
  { id: 1, label: '内容优质', content: '推广内容质量优秀，符合要求，予以通过。' },
  { id: 2, label: '格式规范', content: '推广格式规范，信息完整，审核通过。' },
  { id: 3, label: '效果良好', content: '推广效果预期良好，审核通过并给予奖励。' },
  { id: 4, label: '创意突出', content: '推广创意突出，具有良好的宣传效果。' }
]

// 计算属性
const isFormValid = computed(() => {
  if (props.auditType === 'reject') {
    return formData.value.comment.trim().length > 0 && !errors.value.comment
  } else {
    return formData.value.rewardAmount !== null && 
           formData.value.rewardAmount > 0 && 
           !errors.value.rewardAmount
  }
})

// 方法
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDING_MACHINE_AUDIT':
      return 'secondary'
    case 'PENDING_MANUAL_AUDIT':
      return 'default'
    case 'APPROVED':
      return 'default'
    case 'REJECTED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getDialogDescription = () => {
  if (!props.task) return ''
  
  if (props.auditType === 'approve') {
    return `确认通过 ${props.task.agentName} 的推广任务，并设置奖励金额。`
  } else {
    return `确认拒绝 ${props.task.agentName} 的推广任务，请填写详细的拒绝原因。`
  }
}

const getCommentPlaceholder = () => {
  if (props.auditType === 'approve') {
    return '请填写审核意见（可选）...'
  } else {
    return '请详细说明拒绝原因（必填）...'
  }
}

// 表单验证
const validateComment = () => {
  errors.value.comment = ''
  
  if (props.auditType === 'reject' && formData.value.comment.trim().length === 0) {
    errors.value.comment = '拒绝时必须填写拒绝原因'
    return
  }
  
  if (formData.value.comment.length > 500) {
    errors.value.comment = '审核意见不能超过500个字符'
    return
  }
}

const validateRewardAmount = () => {
  errors.value.rewardAmount = ''
  
  if (props.auditType === 'approve') {
    if (formData.value.rewardAmount === null || formData.value.rewardAmount === 0) {
      errors.value.rewardAmount = '通过时必须设置奖励金额'
      return
    }
    
    if (formData.value.rewardAmount < 0) {
      errors.value.rewardAmount = '奖励金额不能为负数'
      return
    }
    
    if (formData.value.rewardAmount > 10000) {
      errors.value.rewardAmount = '奖励金额不能超过10000元'
      return
    }
  }
}

const validateForm = () => {
  validateComment()
  if (props.auditType === 'approve') {
    validateRewardAmount()
  }
  
  return !errors.value.comment && !errors.value.rewardAmount
}

// 模板使用
const useRejectTemplate = (content: string) => {
  formData.value.comment = content
  validateComment()
}

const useApproveTemplate = (content: string) => {
  formData.value.comment = content
  validateComment()
}

const setRewardAmount = (amount: number) => {
  formData.value.rewardAmount = amount
  validateRewardAmount()
}

// 事件处理
const handleDialogClose = (value: boolean) => {
  if (!value) {
    emit('update:open', false)
    emit('close')
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
  handleDialogClose(false)
}

const handleSubmit = () => {
  if (!validateForm()) {
    toast({
      title: '表单验证失败',
      description: '请检查并完善表单信息',
      variant: 'destructive'
    })
    return
  }
  
  if (!props.task) {
    toast({
      title: '提交失败',
      description: '任务信息丢失，请刷新后重试',
      variant: 'destructive'
    })
    return
  }
  
  const request: AuditRequest = {
    taskId: props.task.id,
    action: props.auditType,
    comment: formData.value.comment.trim() || undefined,
    rewardAmount: props.auditType === 'approve' ? formData.value.rewardAmount! : undefined
  }
  
  emit('submit', request)
}

const resetForm = () => {
  formData.value = {
    comment: '',
    rewardAmount: null
  }
  
  errors.value = {
    comment: '',
    rewardAmount: ''
  }
}

// 监听对话框状态
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    // 对话框打开时重置表单
    resetForm()
    
    // 设置默认奖励金额
    if (props.auditType === 'approve') {
      formData.value.rewardAmount = 1.00
    }
    
    await nextTick()
    
    // 自动聚焦到第一个输入框
    const firstInput = document.querySelector('#reward-amount, #audit-comment') as HTMLElement
    if (firstInput) {
      firstInput.focus()
    }
  }
})

// 监听审核类型变化
watch(() => props.auditType, () => {
  resetForm()
  if (props.auditType === 'approve') {
    formData.value.rewardAmount = 1.00
  }
})
</script>

<style scoped>
/* 表单样式增强 */
.border-red-500 {
  border-color: rgb(239 68 68);
}

/* 按钮悬停效果 */
.button-hover {
  transition: all 0.2s ease-in-out;
}

.button-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 输入框焦点样式 */
input:focus,
textarea:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 表单验证错误动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.border-red-500 {
  animation: shake 0.3s ease-in-out;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>