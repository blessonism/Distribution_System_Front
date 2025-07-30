<template>
  <div
    class="flex items-center p-4 hover:bg-gray-50/50 transition-colors"
    :class="{ 'bg-gray-50': selected }"
  >
    <!-- 选择框 -->
    <div class="flex items-center mr-4">
      <input
        type="checkbox"
        :checked="selected"
        @change="$emit('select')"
        class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
      />
    </div>

    <!-- 任务信息 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between mb-2">
        <!-- 左侧：基本信息 -->
        <div class="flex items-center space-x-3">
          <Badge :variant="getStatusVariant(task.status)" class="whitespace-nowrap">
            {{ getStatusDisplay(task.status).label }}
          </Badge>
          <Badge variant="secondary" class="whitespace-nowrap">
            {{ getPlatformDisplay(task.platform) }}
          </Badge>
          <Badge 
            :variant="task.contentType === 'live_person' ? 'default' : 'outline'"
            class="whitespace-nowrap"
          >
            {{ getContentTypeDisplay(task.contentType) }}
          </Badge>
        </div>

        <!-- 右侧：时间信息 -->
        <div class="text-right text-xs text-muted-foreground">
          <div>提交: {{ formatDate(task.submittedAt) }}</div>
          <div v-if="task.auditedAt">
            审核: {{ formatDate(task.auditedAt) }}
          </div>
        </div>
      </div>

      <!-- 任务详情行 -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <!-- 任务ID和代理信息 -->
        <div class="md:col-span-3 space-y-1">
          <div class="font-medium text-sm truncate">{{ task.agentName }}</div>
          <div class="text-xs text-muted-foreground font-mono">{{ task.id }}</div>
          <div class="text-xs text-muted-foreground">{{ task.agentLevel }}</div>
        </div>

        <!-- 内容预览 -->
        <div class="md:col-span-4 space-y-1">
          <div v-if="task.contentDescription" class="text-sm line-clamp-2">
            {{ task.contentDescription }}
          </div>
          <div v-if="task.contentUrl" class="text-xs text-muted-foreground truncate">
            <a 
              :href="task.contentUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:text-primary hover:underline"
            >
              {{ task.contentUrl }}
            </a>
          </div>
          <div v-if="task.viewCount" class="text-xs text-muted-foreground">
            {{ formatNumber(task.viewCount) }} 次曝光
          </div>
        </div>

        <!-- 审核信息 -->
        <div class="md:col-span-3 space-y-1">
          <div v-if="task.auditorName" class="text-sm">
            审核员: {{ task.auditorName }}
          </div>
          <div v-if="task.auditComment" class="text-xs text-muted-foreground line-clamp-2">
            {{ task.auditComment }}
          </div>
          <div v-if="task.rewardAmount" class="text-xs text-green-600 font-medium">
            奖励: ¥{{ task.rewardAmount.toFixed(2) }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="md:col-span-2 flex items-center justify-end space-x-2">
          <Button
            v-if="canViewDetail"
            variant="ghost"
            size="sm"
            @click="$emit('viewDetail')"
            class="h-8 px-2"
          >
            <Eye class="h-3 w-3 mr-1" />
            详情
          </Button>
          
          <div v-if="canAudit && task.status === 'PENDING_MANUAL_AUDIT'" class="flex space-x-1">
            <Button
              variant="default"
              size="sm"
              @click="$emit('approve', task.id)"
              class="h-8 px-2"
            >
              <CheckCircle class="h-3 w-3 mr-1" />
              通过
            </Button>
            <Button
              variant="destructive"
              size="sm"
              @click="$emit('reject', task.id)"
              class="h-8 px-2"
            >
              <XCircle class="h-3 w-3 mr-1" />
              拒绝
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle, XCircle } from 'lucide-vue-next'
import type { PromotionTask } from '@/types/promotion'
import { 
  getStatusDisplay, 
  getPlatformDisplay, 
  getContentTypeDisplay 
} from '@/types/promotion'

// Props 定义
interface Props {
  task: PromotionTask
  selected: boolean
  canAudit: boolean
  canViewDetail: boolean
}

defineProps<Props>()

// Emits 定义
interface Emits {
  select: []
  viewDetail: []
  approve: [taskId: string]
  reject: [taskId: string]
}

defineEmits<Emits>()

// 工具方法
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
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
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 悬停效果 */
.hover\:bg-muted\/30:hover {
  background-color: rgba(var(--muted) / 0.3);
}

/* 选中状态 */
.bg-blue-50 {
  background-color: rgb(239 246 255);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .md\:col-span-3,
  .md\:col-span-4,
  .md\:col-span-2 {
    grid-column: span 12 / span 12;
  }
  
  .md\:col-span-12 {
    display: block;
  }
  
  .md\:col-span-12 > div {
    margin-bottom: 0.5rem;
  }
}

/* 链接悬停效果 */
a:hover {
  text-decoration: underline;
}

/* 按钮组间距调整 */
.space-x-1 > * + * {
  margin-left: 0.25rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}
</style>