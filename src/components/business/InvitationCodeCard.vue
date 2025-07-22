<template>
  <Card class="w-full">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-lg">{{ roleName }}</CardTitle>
          <CardDescription class="text-sm text-muted-foreground mt-1">
            {{ roleDescription }}
          </CardDescription>
        </div>
        <Badge :variant="codeStatus.variant" class="ml-2">
          {{ codeStatus.text }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- 邀请码展示 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">邀请码</Label>
        <div class="flex items-center space-x-2">
          <div class="flex-1 p-3 bg-muted/50 rounded-md font-mono text-sm select-all">
            {{ invitationCode.code }}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            @click="copyCode"
            :disabled="loading"
          >
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 邀请链接 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">邀请链接</Label>
        <div class="flex items-center space-x-2">
          <div class="flex-1 p-3 bg-muted/50 rounded-md text-sm text-muted-foreground truncate select-all">
            {{ invitationLink }}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            @click="copyLink"
            :disabled="loading"
          >
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 使用统计 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">使用情况</Label>
          <span class="text-sm text-muted-foreground">
            {{ usageStats.used }}/{{ usageStats.remaining === 'unlimited' ? '∞' : usageStats.remaining + usageStats.used }}
          </span>
        </div>
        
        <!-- 进度条 -->
        <div class="space-y-2">
          <Progress 
            :value="usageStats.percentage" 
            class="w-full"
            :class="{
              'progress-success': usageStats.percentage < 70,
              'progress-warning': usageStats.percentage >= 70 && usageStats.percentage < 90,
              'progress-danger': usageStats.percentage >= 90
            }"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>已使用 {{ usageStats.used }} 次</span>
            <span v-if="usageStats.remaining !== 'unlimited'">
              剩余 {{ usageStats.remaining }} 次
            </span>
            <span v-else>
              无限制
            </span>
          </div>
        </div>
      </div>

      <!-- 创建时间 -->
      <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>创建时间</span>
        <span>{{ formatDate(invitationCode.createdAt) }}</span>
      </div>
    </CardContent>

    <CardFooter class="pt-3 flex justify-between">
      <!-- 左侧操作按钮 -->
      <div class="flex space-x-2">
        <Button 
          size="sm" 
          variant="outline"
          @click="showQRCode"
          :disabled="loading"
        >
          <QrCode class="w-4 h-4 mr-1" />
          二维码
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          @click="shareLink"
          :disabled="loading"
        >
          <Share2 class="w-4 h-4 mr-1" />
          分享
        </Button>
      </div>

      <!-- 右侧状态操作 -->
      <div class="flex space-x-2">
        <Button 
          v-if="invitationCode.status === 'inactive'"
          size="sm" 
          variant="default"
          @click="reactivateCode"
          :disabled="loading"
        >
          <Play class="w-4 h-4 mr-1" />
          启用
        </Button>
        <Button 
          v-else
          size="sm" 
          variant="secondary"
          @click="deactivateCode"
          :disabled="loading"
        >
          <Pause class="w-4 h-4 mr-1" />
          停用
        </Button>
      </div>
    </CardFooter>

    <!-- 二维码弹窗 -->
    <Dialog v-model:open="qrCodeDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请码二维码</DialogTitle>
          <DialogDescription>
            扫描二维码或分享给其他人快速注册
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex flex-col items-center space-y-4 py-4">
          <!-- 二维码占位区域 -->
          <div 
            id="qr-code-container" 
            class="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/25"
          >
            <div v-if="qrCodeLoading" class="flex flex-col items-center space-y-2">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span class="text-sm text-muted-foreground">生成中...</span>
            </div>
            <div v-else-if="qrCodeError" class="text-center text-sm text-muted-foreground">
              <AlertCircle class="w-8 h-8 mx-auto mb-2" />
              <p>二维码生成失败</p>
            </div>
          </div>
          
          <!-- 邀请信息 -->
          <div class="text-center space-y-1">
            <p class="font-medium">{{ roleName }}</p>
            <p class="text-sm text-muted-foreground break-all">{{ invitationCode.code }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="qrCodeDialogOpen = false">
            关闭
          </Button>
          <Button @click="downloadQRCode" :disabled="qrCodeLoading || qrCodeError">
            <Download class="w-4 h-4 mr-1" />
            下载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import { 
  Copy, 
  QrCode, 
  Share2, 
  Play, 
  Pause, 
  Download,
  AlertCircle 
} from 'lucide-vue-next'
import type { InvitationCode } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { generateInvitationLink, getRoleDisplayName } from '@/api/invitation'

// Props 定义
interface Props {
  invitationCode: InvitationCode
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits 定义
interface Emits {
  copy: [code: string]
  copyLink: [link: string]
  reactivate: [codeId: string]
  deactivate: [codeId: string]
  share: [link: string, roleName: string]
}

const emit = defineEmits<Emits>()

// 响应式数据
const qrCodeDialogOpen = ref(false)
const qrCodeLoading = ref(false)
const qrCodeError = ref(false)

// 计算属性
const roleName = computed(() => getRoleDisplayName(props.invitationCode.targetRole))

const roleDescription = computed(() => {
  const descriptions: Record<UserRole, string> = {
    super_admin: '系统超级管理员邀请码',
    director: '销售总监邀请码',
    leader: '销售组长邀请码', 
    sales: '销售人员邀请码',
    agent: '代理邀请码'
  }
  return descriptions[props.invitationCode.targetRole] || '未知角色邀请码'
})

const invitationLink = computed(() => {
  return generateInvitationLink(
    props.invitationCode.code,
    props.invitationCode.targetRole
  )
})

const codeStatus = computed(() => {
  if (props.invitationCode.status === 'active') {
    return {
      text: '正常',
      variant: 'default' as const
    }
  } else {
    return {
      text: '已停用',
      variant: 'secondary' as const
    }
  }
})

const usageStats = computed(() => {
  const used = props.invitationCode.usageCount
  const maxUsage = props.invitationCode.maxUsage
  
  if (!maxUsage) {
    return {
      used,
      remaining: 'unlimited' as const,
      percentage: Math.min((used / 100) * 100, 100) // 无限制时，以100为基准显示进度
    }
  }
  
  const remaining = Math.max(maxUsage - used, 0)
  const percentage = maxUsage > 0 ? (used / maxUsage) * 100 : 0
  
  return {
    used,
    remaining,
    percentage: Math.min(percentage, 100)
  }
})

// 方法
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error('降级复制方案也失败:', fallbackError)
      return false
    }
  }
}

const copyCode = async () => {
  const success = await copyToClipboard(props.invitationCode.code)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请码已复制到剪贴板',
      variant: 'default',
    })
    emit('copy', props.invitationCode.code)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const copyLink = async () => {
  const success = await copyToClipboard(invitationLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请链接已复制到剪贴板',
      variant: 'default',
    })
    emit('copyLink', invitationLink.value)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const reactivateCode = () => {
  emit('reactivate', props.invitationCode.id)
}

const deactivateCode = () => {
  emit('deactivate', props.invitationCode.id)
}

const shareLink = () => {
  emit('share', invitationLink.value, roleName.value)
  
  // 如果支持 Web Share API，使用原生分享
  if (navigator.share) {
    navigator.share({
      title: `${roleName.value}邀请`,
      text: `邀请您加入系统，成为${roleName.value}`,
      url: invitationLink.value
    }).catch(error => {
      console.log('分享取消或失败:', error)
    })
  } else {
    // 否则复制链接
    copyLink()
  }
}

const showQRCode = async () => {
  qrCodeDialogOpen.value = true
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    // 等待 DOM 更新
    await nextTick()
    
    // 动态导入 QR 码库（假设使用 qrcode 库）
    const QRCode = (await import('qrcode')).default
    const container = document.getElementById('qr-code-container')
    
    if (container) {
      // 清空容器
      container.innerHTML = ''
      
      // 生成二维码
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, invitationLink.value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      container.appendChild(canvas)
      qrCodeLoading.value = false
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    qrCodeError.value = true
    qrCodeLoading.value = false
    
    toast({
      title: '二维码生成失败',
      description: '请稍后重试或直接分享链接',
      variant: 'destructive',
    })
  }
}

const downloadQRCode = () => {
  const canvas = document.querySelector('#qr-code-container canvas') as HTMLCanvasElement
  if (canvas) {
    const link = document.createElement('a')
    link.download = `invitation-${props.invitationCode.targetRole}-${props.invitationCode.code}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    toast({
      title: '下载成功',
      description: '二维码已保存到本地',
      variant: 'default',
    })
  }
}
</script>

<style scoped>
/* 进度条颜色自定义 */
:deep(.progress-success .progress-indicator) {
  background-color: hsl(var(--success));
}

:deep(.progress-warning .progress-indicator) {
  background-color: hsl(var(--warning));
}

:deep(.progress-danger .progress-indicator) {
  background-color: hsl(var(--destructive));
}

/* 选择文本样式 */
.select-all {
  user-select: all;
  -webkit-user-select: all;
  -moz-user-select: all;
  -ms-user-select: all;
}

/* 卡片悬停效果 */
.card {
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>