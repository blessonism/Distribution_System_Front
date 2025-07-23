<template>
  <!-- 任务详情对话框 -->
  <Dialog :open="open" @update:open="handleDialogOpenChange">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col task-detail-dialog">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText class="h-4 w-4 text-primary" />
          </div>
          <div>
            <span>任务详情</span>
            <p class="text-sm text-muted-foreground font-normal">
              {{ task?.id || '加载中...' }}
            </p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <!-- 对话框内容区 -->
      <div class="flex-1 overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="loading" class="p-6">
          <div class="space-y-4">
            <div class="animate-pulse">
              <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div class="animate-pulse">
              <div class="h-20 bg-muted rounded"></div>
            </div>
            <div class="animate-pulse space-y-2">
              <div class="h-4 bg-muted rounded"></div>
              <div class="h-4 bg-muted rounded w-5/6"></div>
              <div class="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="p-6">
          <div class="text-center py-8">
            <AlertCircle class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p class="text-sm text-muted-foreground">{{ error }}</p>
            <Button
              variant="outline"
              size="sm"
              @click="handleRefresh"
              class="mt-3"
            >
              重新加载
            </Button>
          </div>
        </div>

        <!-- 任务详情内容 -->
        <div v-else-if="task" class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <!-- 左列：基本信息 -->
          <div class="space-y-6">
            <!-- 任务状态 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">任务状态</Label>
                <Badge :variant="getStatusVariant(task.status)">
                  {{ getStatusDisplay(task.status).label }}
                </Badge>
              </div>

              <!-- 状态时间线 -->
              <div class="space-y-2 ml-1">
                <div class="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div class="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span>提交时间：{{ formatDateTime(task.submittedAt) }}</span>
                </div>
                <div
                  v-if="task.auditedAt"
                  class="flex items-center space-x-2 text-xs text-muted-foreground"
                >
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="task.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'"
                  ></div>
                  <span>审核时间：{{ formatDateTime(task.auditedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- 代理信息 -->
            <div class="space-y-3">
              <Label class="text-sm font-medium">代理信息</Label>
              <Card>
                <CardContent class="p-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-muted-foreground">姓名</span>
                      <span class="text-sm font-medium">{{ task.agentName }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-muted-foreground">代理ID</span>
                      <span class="text-sm font-mono">{{ task.agentId }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-muted-foreground">等级</span>
                      <Badge variant="outline">{{ task.agentLevel }}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- 审核信息 -->
            <div v-if="task.auditorName || task.auditComment" class="space-y-3">
              <Label class="text-sm font-medium">审核信息</Label>
              <Card>
                <CardContent class="p-4 space-y-3">
                  <div v-if="task.auditorName" class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">审核员</span>
                    <span class="text-sm font-medium">{{ task.auditorName }}</span>
                  </div>
                  <div v-if="task.auditComment" class="space-y-2">
                    <Label class="text-xs text-muted-foreground">审核意见</Label>
                    <p class="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                      {{ task.auditComment }}
                    </p>
                  </div>
                  <div v-if="task.rewardAmount" class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">奖励金额</span>
                    <span class="text-sm font-medium text-green-600">
                      ¥{{ task.rewardAmount.toFixed(2) }}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <!-- 右列：推广内容和历史 -->
          <div class="space-y-6">
            <!-- 推广内容 -->
            <div class="space-y-3">
              <Label class="text-sm font-medium">推广内容</Label>
              <Card>
                <CardContent class="p-4 space-y-3">
                  <!-- 平台和类型 -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {{ getPlatformDisplay(task.platform) }}
                      </Badge>
                      <Badge
                        :variant="task.contentType === 'live_person' ? 'default' : 'outline'"
                      >
                        {{ getContentTypeDisplay(task.contentType) }}
                      </Badge>
                    </div>
                    <div v-if="task.viewCount" class="text-xs text-muted-foreground">
                      {{ formatNumber(task.viewCount) }} 次曝光
                    </div>
                  </div>

                  <!-- 内容预览 -->
                  <div v-if="task.contentPreview" class="relative">
                    <img
                      :src="task.contentPreview"
                      :alt="task.contentDescription"
                      class="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                      @click="openImagePreview(task.contentPreview)"
                      @error="handleImageError"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      class="absolute top-2 right-2 h-6 w-6 p-0"
                      @click="openImagePreview(task.contentPreview)"
                    >
                      <Expand class="h-3 w-3" />
                    </Button>
                  </div>

                  <!-- 内容描述 -->
                  <div v-if="task.contentDescription" class="space-y-2">
                    <Label class="text-xs text-muted-foreground">内容描述</Label>
                    <p class="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                      {{ task.contentDescription }}
                    </p>
                  </div>

                  <!-- 内容链接 -->
                  <div class="space-y-2">
                    <Label class="text-xs text-muted-foreground">推广链接</Label>
                    <div class="flex items-center space-x-2">
                      <div class="flex-1 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                        {{ task.contentUrl }}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        @click="copyToClipboard(task.contentUrl)"
                        class="h-8 w-8 p-0"
                      >
                        <Copy class="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        @click="openExternalLink(task.contentUrl)"
                        class="h-8 w-8 p-0"
                      >
                        <ExternalLink class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- 审核历史 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">审核历史</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="refreshHistory"
                  :disabled="historyLoading"
                  class="h-6 text-xs"
                >
                  <RotateCcw class="h-3 w-3 mr-1" :class="{ 'animate-spin': historyLoading }" />
                  刷新
                </Button>
              </div>

              <!-- 历史记录加载状态 -->
              <div v-if="historyLoading" class="space-y-2">
                <div v-for="i in 3" :key="i" class="animate-pulse">
                  <div class="h-16 bg-muted rounded"></div>
                </div>
              </div>

              <!-- 历史记录列表 -->
              <div v-else-if="history.length > 0" class="space-y-2">
                <Card
                  v-for="record in history"
                  :key="record.id"
                  class="border-l-4"
                  :class="{
                    'border-l-green-500': record.action === 'approve',
                    'border-l-red-500': record.action === 'reject',
                    'border-l-blue-500': record.auditorName === '系统'
                  }"
                >
                  <CardContent class="p-3">
                    <div class="flex items-start justify-between">
                      <div class="space-y-1">
                        <div class="flex items-center space-x-2">
                          <Badge
                            :variant="record.action === 'approve' ? 'default' : 'destructive'"
                            class="text-xs"
                          >
                            {{ record.action === 'approve' ? '通过' : '拒绝' }}
                          </Badge>
                          <span class="text-xs text-muted-foreground">
                            {{ record.auditorName }}
                          </span>
                        </div>
                        <p v-if="record.comment" class="text-xs text-muted-foreground">
                          {{ record.comment }}
                        </p>
                      </div>
                      <span class="text-xs text-muted-foreground">
                        {{ formatDateTime(record.auditedAt) }}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <!-- 无历史记录 -->
              <div v-else class="text-center py-4">
                <p class="text-sm text-muted-foreground">暂无审核历史</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对话框底部操作区 -->
      <DialogFooter v-if="task && canAudit" class="flex space-x-2 footer-actions">
        <Button
          variant="outline"
          @click="handleClose"
          class="action-button"
        >
          关闭
        </Button>
        <Button
          variant="destructive"
          @click="handleReject"
          :disabled="loading || task.status !== 'PENDING_MANUAL_AUDIT'"
          class="action-button"
        >
          <XCircle class="h-4 w-4 mr-1" />
          拒绝
        </Button>
        <Button
          variant="default"
          @click="handleApprove"
          :disabled="loading || task.status !== 'PENDING_MANUAL_AUDIT'"
          class="action-button"
        >
          <CheckCircle class="h-4 w-4 mr-1" />
          通过
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 图片预览对话框 -->
  <Dialog v-model:open="imagePreviewOpen">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>内容预览</DialogTitle>
      </DialogHeader>
      <div class="flex justify-center">
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          alt="内容预览"
          class="max-w-full max-h-96 object-contain"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Expand,
  RotateCcw,
  FileText
} from 'lucide-vue-next'
import type { PromotionTask } from '@/types/promotion'
import { 
  getStatusDisplay, 
  getPlatformDisplay, 
  getContentTypeDisplay 
} from '@/types/promotion'
import { usePromotionAuditHistory } from '@/composables/usePromotionAudit'

// Props 定义
interface Props {
  open: boolean
  taskId?: string | null
  task?: PromotionTask | null
  loading?: boolean
  error?: string | null
  canAudit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canAudit: false
})

// Emits 定义
interface Emits {
  'update:open': [value: boolean]
  close: []
  refresh: [taskId: string]
  approve: [taskId: string]
  reject: [taskId: string]
}

const emit = defineEmits<Emits>()

// 使用审核历史 composable
const { loadHistory, getTaskHistory, isHistoryLoading } = usePromotionAuditHistory()

// 响应式数据
const imagePreviewOpen = ref(false)
const previewImageUrl = ref<string | null>(null)

// 历史记录相关
const history = computed(() => {
  return props.taskId ? getTaskHistory(props.taskId).value : []
})

const historyLoading = computed(() => {
  return props.taskId ? isHistoryLoading(props.taskId).value : false
})

// 监听任务ID变化，加载审核历史
watch(
  () => props.taskId,
  (newTaskId) => {
    if (newTaskId && props.open) {
      loadHistory(newTaskId)
      console.log('[TaskDetailSidebar] 加载审核历史:', newTaskId)
    }
  },
  { immediate: true }
)

// 监听侧栏打开状态
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.taskId) {
      loadHistory(props.taskId)
    }
  }
)

// 方法
const handleDialogOpenChange = (isOpen: boolean) => {
  if (!isOpen) {
    emit('update:open', false)
    emit('close')
  }
}

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}

const handleRefresh = () => {
  if (props.taskId) {
    emit('refresh', props.taskId)
  }
}

const refreshHistory = async () => {
  if (props.taskId) {
    try {
      await loadHistory(props.taskId, true) // 强制刷新
      console.log('[TaskDetailSidebar] 审核历史刷新成功')
    } catch (error) {
      console.error('[TaskDetailSidebar] 审核历史刷新失败:', error)
      toast({
        title: '刷新失败',
        description: '无法加载最新的审核历史',
        variant: 'destructive'
      })
    }
  }
}

const handleApprove = () => {
  if (props.taskId) {
    emit('approve', props.taskId)
  }
}

const handleReject = () => {
  if (props.taskId) {
    emit('reject', props.taskId)
  }
}

const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  imagePreviewOpen.value = true
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij7ml6DmjIHliqDovb3lm77niYc8L3RleHQ+PC9zdmc+'
}

const openExternalLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast({
      title: '复制成功',
      description: '链接已复制到剪贴板',
      variant: 'default'
    })
  } catch (error) {
    console.error('复制失败:', error)
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive'
    })
  }
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
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
</script>

<style scoped>
/* 对话框动画增强 */
.task-detail-dialog {
  animation: dialog-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center;
}

/* 对话框进入动画 */
@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 对话框退出动画 */
:global([data-state="closed"]) .task-detail-dialog {
  animation: dialog-exit 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialog-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

/* 遮罩层动画增强 */
:global([data-radix-dialog-overlay]) {
  animation: overlay-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlay-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:global([data-state="closed"][data-radix-dialog-overlay]) {
  animation: overlay-exit 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes overlay-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 文本截断 */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Safari */
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 内容区域动画 */
.task-detail-dialog .grid {
  animation: content-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

@keyframes content-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片悬停效果 */
.card {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

/* 图片悬停效果 */
img {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

img:hover {
  transform: scale(1.02);
}

/* 按钮悬停效果 */
.button {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Badge 动画 */
.badge {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 底部操作区动画 */
.footer-actions {
  animation: footer-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

@keyframes footer-slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 操作按钮动画 */
.action-button {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateZ(0); /* 启用硬件加速 */
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载状态动画优化 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .grid-cols-1.lg\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }

  /* 移动端动画调整 */
  .task-detail-dialog {
    animation-duration: 0.25s;
  }

  @keyframes dialog-enter {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes dialog-exit {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-2px);
    }
  }
}
</style>