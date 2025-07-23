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
    <Dialog v-model:open="qrCodeDialogOpen" @update:open="val => !val && handleDialogClose()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请码二维码</DialogTitle>
          <DialogDescription>
            扫描二维码或分享给其他人快速注册
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex flex-col items-center space-y-4 py-4">
          <!-- 二维码 -->
          <div 
            ref="qrCodeContainer"
            class="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/25"
          >
            <!-- 强制使用DOM操作显示二维码，不依赖Vue的响应式系统 -->
            <!-- 此处内容将由JavaScript动态添加 -->
          </div>
          
          <!-- 链接信息 -->
          <div class="text-center space-y-1 max-w-full">
            <p class="font-medium">{{ roleName }}</p>
            <p class="text-xs text-muted-foreground break-all px-2">{{ invitationLink }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="handleDialogClose()">
            关闭
          </Button>
          <Button @click="downloadQRCode" :disabled="qrCodeLoading || qrCodeError || !qrCodeImageUrl">
            <Download class="w-4 h-4 mr-1" />
            下载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onBeforeUnmount, watch } from 'vue'
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

// 扩展InvitationCode类型，添加缺失的属性
interface ExtendedInvitationCode extends InvitationCode {
  maxUsage?: number;
  expiresAt?: string;
}

// Props 定义
interface Props {
  invitationCode: ExtendedInvitationCode
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
const qrCodeContainer = ref<HTMLElement | null>(null)
const qrCodeImageUrl = ref<string | null>(null) // 存储预渲染的二维码图像URL

// 取消标记和清理函数
let qrCodeGenerationAborted = false
let qrCodeCleanupTimeout: number | null = null

// 在组件卸载前清理
onBeforeUnmount(() => {
  qrCodeGenerationAborted = true
  
  // 清理定时器
  if (qrCodeCleanupTimeout) {
    clearTimeout(qrCodeCleanupTimeout)
  }
  
  // 清理图像URL
  if (qrCodeImageUrl.value) {
    URL.revokeObjectURL(qrCodeImageUrl.value)
    qrCodeImageUrl.value = null
  }
})

// 监听对话框关闭事件
const handleDialogClose = () => {
  qrCodeDialogOpen.value = false
}

// 监听对话框打开状态
watch(qrCodeDialogOpen, async (isOpen) => {
  if (isOpen) {
    // 对话框打开时，强制初始化二维码显示
    await nextTick()
    initializeQRCodeDisplay()
  } else {
    // 对话框关闭时
    qrCodeGenerationAborted = true
    
    // 清理DOM
    if (qrCodeCleanupTimeout) {
      clearTimeout(qrCodeCleanupTimeout)
    }
  }
})

// 强制初始化二维码显示
const initializeQRCodeDisplay = () => {
  if (!qrCodeContainer.value || !qrCodeImageUrl.value) return
  
  try {
    // 清空容器
    qrCodeContainer.value.innerHTML = ''
    
    // 根据当前状态显示不同内容
    if (qrCodeLoading.value) {
      // 显示加载动画
      const loadingDiv = document.createElement('div')
      loadingDiv.className = 'flex flex-col items-center space-y-2'
      
      const spinner = document.createElement('div')
      spinner.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary'
      
      const text = document.createElement('span')
      text.className = 'text-sm text-muted-foreground'
      text.textContent = '生成中...'
      
      loadingDiv.appendChild(spinner)
      loadingDiv.appendChild(text)
      qrCodeContainer.value.appendChild(loadingDiv)
    } else if (qrCodeError.value) {
      // 显示错误信息
      const errorDiv = document.createElement('div')
      errorDiv.className = 'text-center text-sm text-muted-foreground'
      
      const errorIcon = document.createElement('div')
      errorIcon.className = 'w-8 h-8 mx-auto mb-2'
      errorIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      
      const errorText = document.createElement('p')
      errorText.textContent = '二维码生成失败'
      
      errorDiv.appendChild(errorIcon)
      errorDiv.appendChild(errorText)
      qrCodeContainer.value.appendChild(errorDiv)
    } else if (qrCodeImageUrl.value) {
      // 显示二维码图像
      const img = document.createElement('img')
      img.src = qrCodeImageUrl.value
      img.alt = '邀请二维码'
      img.className = 'w-full h-full object-contain'
      qrCodeContainer.value.appendChild(img)
      
      console.log('二维码图像已强制显示到DOM')
    } else {
      // 显示未能显示二维码的信息
      const emptyDiv = document.createElement('div')
      emptyDiv.className = 'text-center text-sm text-muted-foreground'
      
      const emptyIcon = document.createElement('div')
      emptyIcon.className = 'w-8 h-8 mx-auto mb-2'
      emptyIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      
      const emptyText = document.createElement('p')
      emptyText.textContent = '未能显示二维码'
      
      emptyDiv.appendChild(emptyIcon)
      emptyDiv.appendChild(emptyText)
      qrCodeContainer.value.appendChild(emptyDiv)
    }
  } catch (error) {
    console.error('初始化二维码显示失败:', error)
  }
}

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

// 预先生成二维码图像
const prepareQRCode = async (): Promise<boolean> => {
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    // 检查链接是否有效
    if (!invitationLink.value) {
      console.error('没有可用的链接来生成二维码')
      qrCodeError.value = true
      qrCodeLoading.value = false
      return false
    }
    
    console.log('开始生成二维码，链接:', invitationLink.value)
    
    // 异步加载二维码库
    const QRCodeModule = await import('qrcode')
    const QRCode = QRCodeModule.default
    
    // 创建离屏canvas
    const canvas = document.createElement('canvas')
    
    // 生成二维码
    await QRCode.toCanvas(canvas, invitationLink.value, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    console.log('二维码已生成到canvas')
    
    // 直接使用canvas的dataURL，避免使用Blob URL
    const dataUrl = canvas.toDataURL('image/png')
    console.log('二维码已转换为dataURL')
    
    // 更新状态
    qrCodeImageUrl.value = dataUrl
    
    // 强制DOM更新
    await nextTick()
    
    // 直接将二维码显示到容器中
    if (qrCodeContainer.value) {
      // 清空容器
      qrCodeContainer.value.innerHTML = ''
      
      // 创建图像元素
      const img = document.createElement('img')
      img.src = dataUrl
      img.alt = '邀请二维码'
      img.className = 'w-full h-full object-contain'
      
      // 添加到容器
      qrCodeContainer.value.appendChild(img)
      console.log('二维码已直接添加到DOM')
    }
    
    // 确保状态更新
    qrCodeLoading.value = false
    console.log('加载状态已设置为false')
    
    return true
  } catch (error) {
    console.error('生成二维码失败:', error)
    qrCodeError.value = true
    qrCodeLoading.value = false
    
    // 显示错误提示
    toast({
      title: '二维码生成失败',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    
    return false
  }
}

const showQRCode = async () => {
  if (!invitationLink) {
    toast({
      title: '无法生成二维码',
      description: '邀请链接不可用',
      variant: 'destructive',
    })
    return
  }

  // 重置状态
  qrCodeImageUrl.value = null
  qrCodeError.value = false
  qrCodeGenerationAborted = false
  qrCodeLoading.value = true
  
  console.log('开始准备二维码')
  
  const success = await prepareQRCode()
  console.log('二维码准备结果:', success, '加载状态:', qrCodeLoading.value)
  
  if (success) {
    // 成功生成二维码后打开对话框
    qrCodeDialogOpen.value = true
    
    // 等待对话框DOM更新后强制初始化二维码显示
    await nextTick()
    console.log('对话框已打开，开始强制初始化二维码显示')
    initializeQRCodeDisplay()
    console.log('二维码显示初始化完成')
  } else {
    toast({
      title: '二维码生成失败',
      description: '请稍后重试',
      variant: 'destructive',
    })
  }
}

const downloadQRCode = () => {
  if (!qrCodeImageUrl.value) return
  
  try {
    const link = document.createElement('a')
    link.download = `invitation-${props.invitationCode.targetRole}-${props.invitationCode.code}.png`
    link.href = qrCodeImageUrl.value
    link.click()
    
    toast({
      title: '下载成功',
      description: '二维码已保存到本地',
      variant: 'default',
    })
  } catch (error) {
    console.error('下载二维码失败:', error)
    toast({
      title: '下载失败',
      description: '无法保存二维码，请稍后重试',
      variant: 'destructive',
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