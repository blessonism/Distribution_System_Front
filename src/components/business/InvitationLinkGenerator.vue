<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center space-x-2">
        <Link class="w-5 h-5" />
        <span>邀请链接生成器</span>
      </CardTitle>
      <CardDescription>
        为不同角色生成专属的邀请链接，支持多种分享方式
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- 角色选择 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">选择邀请角色</Label>
        <Select v-model="selectedRole" @update:model-value="handleRoleChange">
          <SelectTrigger class="w-full">
            <!-- 自定义显示选中的角色 -->
            <template v-if="selectedRole">
              {{ getDisplayRoleLabel(selectedRole) }}
            </template>
            <SelectValue v-else placeholder="请选择要邀请的角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="role in availableRoles" 
              :key="role.value" 
              :value="role.value"
            >
              <div class="flex items-center space-x-2">
                <Badge variant="outline" class="text-xs">
                  {{ role.label }}
                </Badge>
                <span>{{ role.description }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 邀请码选择 -->
      <div v-if="selectedRole && matchingCodes.length > 0" class="space-y-2">
        <Label class="text-sm font-medium">选择邀请码</Label>
        <Select v-model="selectedCodeId" @update:model-value="handleCodeChange">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="请选择邀请码" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="code in matchingCodes" 
              :key="code.id" 
              :value="code.id"
            >
              <div class="flex items-center justify-between w-full">
                <span class="font-mono">{{ code.code }}</span>
                <div class="flex items-center space-x-2">
                  <Badge 
                    :variant="code.status === 'active' ? 'default' : 'secondary'" 
                    class="text-xs"
                  >
                    {{ code.status === 'active' ? '正常' : '停用' }}
                  </Badge>
                  <span class="text-xs text-muted-foreground">
                    已用{{ code.usageCount }}次
                  </span>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 链接预览区域 -->
      <div v-if="generatedLink" class="space-y-4">
        <Separator />
        
        <!-- 生成的链接 -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">生成的邀请链接</Label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 p-3 bg-muted/50 rounded-md text-sm break-all select-all">
              {{ generatedLink }}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              @click="copyGeneratedLink"
              :disabled="loading"
            >
              <Copy class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- 短链接（如果支持） -->
        <div v-if="shortLink" class="space-y-2">
          <Label class="text-sm font-medium">短链接</Label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 p-3 bg-muted/50 rounded-md text-sm select-all">
              {{ shortLink }}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              @click="copyShortLink"
              :disabled="loading"
            >
              <Copy class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- 链接信息 -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-muted/25 rounded-md">
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">邀请角色</p>
            <p class="font-medium">{{ getRoleDisplayName(selectedRole!) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">邀请码</p>
            <p class="font-mono">{{ selectedCode?.code }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">有效期</p>
            <p>{{ getExpiryDisplay(selectedCode) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">使用情况</p>
            <p>{{ getUsageDisplay(selectedCode) }}</p>
          </div>
        </div>
      </div>

      <!-- 无可用邀请码提示 -->
      <div v-else-if="selectedRole && matchingCodes.length === 0" class="text-center py-8">
        <AlertCircle class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 class="font-medium mb-2">暂无可用邀请码</h3>
        <p class="text-sm text-muted-foreground mb-4">
          您还没有用于邀请 {{ getRoleDisplayName(selectedRole) }} 的邀请码
        </p>
        <Button variant="outline" @click="$emit('requestNewCode', selectedRole)">
          <Plus class="w-4 h-4 mr-2" />
          申请邀请码
        </Button>
      </div>
    </CardContent>

    <CardFooter v-if="generatedLink" class="flex flex-wrap gap-2">
      <!-- 分享操作 -->
      <Button 
        size="sm" 
        variant="outline" 
        @click="shareViaWebShare"
        :disabled="loading"
      >
        <Share2 class="w-4 h-4 mr-1" />
        分享
      </Button>
      
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
        @click="shareViaEmail"
        :disabled="loading"
      >
        <Mail class="w-4 h-4 mr-1" />
        邮件
      </Button>
      
      <Button 
        size="sm" 
        variant="outline" 
        @click="shareViaSMS"
        :disabled="loading"
      >
        <MessageSquare class="w-4 h-4 mr-1" />
        短信
      </Button>

      <!-- 生成短链接 -->
      <Button 
        v-if="!shortLink"
        size="sm" 
        variant="outline" 
        @click="generateShortLink"
        :disabled="loading"
      >
        <Zap class="w-4 h-4 mr-1" />
        短链接
      </Button>
    </CardFooter>

    <!-- 二维码弹窗 -->
    <Dialog v-model:open="qrCodeDialogOpen" @update:open="val => !val && handleDialogClose()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请二维码</DialogTitle>
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
            <p class="font-medium">{{ getDisplayRoleLabel(selectedRole!) }}</p>
            <p class="text-xs text-muted-foreground break-all px-2">{{ shortLink || generatedLink }}</p>
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
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast/use-toast'
import { 
  Link,
  Copy, 
  Share2, 
  QrCode, 
  Mail,
  MessageSquare,
  Zap,
  Download,
  AlertCircle,
  Plus
} from 'lucide-vue-next'
import type { InvitationCode } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { generateInvitationLink, getRoleDisplayName } from '@/api/invitation'

// 扩展InvitationCode类型，添加缺失的属性
interface ExtendedInvitationCode extends InvitationCode {
  expiresAt?: string;
  maxUsage?: number;
}

// Props 定义
interface Props {
  codes: ExtendedInvitationCode[]
  allowedTargetRoles: UserRole[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits 定义
interface Emits {
  copyLink: [link: string]
  shareLink: [link: string, roleName: string]
  requestNewCode: [targetRole: UserRole]
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedRole = ref<UserRole>()
const selectedCodeId = ref<string>()
const generatedLink = ref('')
const shortLink = ref('')
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

// 监听二维码准备状态
watch(qrCodeDialogOpen, async (isOpen) => {
  if (isOpen && !qrCodeLoading.value) {
    await prepareQRCode()
  }
})

// 计算属性
const availableRoles = computed(() => {
  const roleLabels: Record<UserRole, { label: string; description: string }> = {
    super_admin: { label: '超管', description: '系统管理员' },
    director: { label: '总监', description: '销售部门' },
    leader: { label: '组长', description: '销售团队' },
    sales: { label: '销售', description: '销售人员' },
    agent: { label: '代理', description: '外部代理' }
  }

  return props.allowedTargetRoles.map(role => ({
    value: role,
    label: roleLabels[role].label,
    description: roleLabels[role].description
  }))
})

const matchingCodes = computed(() => {
  if (!selectedRole.value) return []
  return props.codes.filter(code => 
    code.targetRole === selectedRole.value && 
    code.status === 'active'
  )
})

const selectedCode = computed(() => {
  if (!selectedCodeId.value) return null
  return matchingCodes.value.find(code => code.id === selectedCodeId.value) || null
})

// 方法
const generateLink = () => {
  if (!selectedRole.value || !selectedCode.value) {
    generatedLink.value = ''
    return
  }
  
  generatedLink.value = generateInvitationLink(
    selectedCode.value.code,
    selectedRole.value
  )
}

const handleRoleChange = () => {
  selectedCodeId.value = undefined
  shortLink.value = ''
  if (matchingCodes.value.length === 1) {
    selectedCodeId.value = matchingCodes.value[0].id
  }
}

const handleCodeChange = () => {
  shortLink.value = ''
  generateLink()
}

// 监听器
watch([selectedRole, selectedCodeId], () => {
  generateLink()
}, { immediate: true })

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

const copyGeneratedLink = async () => {
  const success = await copyToClipboard(generatedLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请链接已复制到剪贴板',
    })
    emit('copyLink', generatedLink.value)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const copyShortLink = async () => {
  const success = await copyToClipboard(shortLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '短链接已复制到剪贴板',
    })
    emit('copyLink', shortLink.value)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const shareViaWebShare = () => {
  const link = shortLink.value || generatedLink.value
  const roleName = getRoleDisplayName(selectedRole.value!)
  
  emit('shareLink', link, roleName)
  
  if (navigator.share) {
    navigator.share({
      title: `${roleName}邀请`,
      text: `邀请您加入我们的系统，成为${roleName}`,
      url: link
    }).catch(error => {
      console.log('分享取消或失败:', error)
    })
  } else {
    copyGeneratedLink()
  }
}

const shareViaEmail = () => {
  const link = shortLink.value || generatedLink.value
  const roleName = getRoleDisplayName(selectedRole.value!)
  const subject = encodeURIComponent(`${roleName}邀请`)
  const body = encodeURIComponent(
    `您好！\n\n邀请您加入我们的系统，成为${roleName}。\n\n请点击以下链接完成注册：\n${link}\n\n感谢您的参与！`
  )
  
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const shareViaSMS = () => {
  const link = shortLink.value || generatedLink.value
  const roleName = getRoleDisplayName(selectedRole.value!)
  const message = encodeURIComponent(
    `邀请您加入系统成为${roleName}，点击链接注册：${link}`
  )
  
  window.open(`sms:?body=${message}`)
}

const generateShortLink = async () => {
  // 这里可以集成短链接服务，如 bit.ly, tinyurl 等
  // 暂时使用模拟实现
  try {
    const response = await fetch('/api/short-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: generatedLink.value
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      shortLink.value = data.shortUrl
      toast({
        title: '短链接生成成功',
        description: '已生成便于分享的短链接',
      })
    }
  } catch (error) {
    console.error('短链接生成失败:', error)
    // 降级方案：生成一个简化的链接显示
    const baseUrl = window.location.origin
    const shortCode = selectedCode.value?.code.slice(-6) || 'unknown'
    shortLink.value = `${baseUrl}/i/${shortCode}`
    
    toast({
      title: '短链接生成失败',
      description: '已生成本地短链接',
      variant: 'destructive',
    })
  }
}

// 预先生成二维码图像
const prepareQRCode = async (): Promise<boolean> => {
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    // 检查链接是否有效
    const linkToEncode = shortLink.value || generatedLink.value
    if (!linkToEncode) {
      console.error('没有可用的链接来生成二维码')
      qrCodeError.value = true
      qrCodeLoading.value = false
      return false
    }
    
    console.log('开始生成二维码，链接:', linkToEncode)
    
    // 异步加载二维码库
    const QRCodeModule = await import('qrcode')
    const QRCode = QRCodeModule.default
    
    // 创建离屏canvas
    const canvas = document.createElement('canvas')
    
    // 生成二维码
    await QRCode.toCanvas(canvas, linkToEncode, {
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
  if (!selectedRole.value || !generatedLink.value) {
    toast({
      title: '无法生成二维码',
      description: '请先选择角色和邀请码',
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
    const roleName = getRoleDisplayName(selectedRole.value!)
    link.download = `invitation-link-${selectedRole.value}-qr.png`
    link.href = qrCodeImageUrl.value
    link.click()
    
    toast({
      title: '下载成功',
      description: '二维码已保存到本地',
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

// 获取角色的简短显示标签
const getDisplayRoleLabel = (role: UserRole): string => {
  const roleLabelsMap: Record<UserRole, string> = {
    super_admin: '超级管理员',
    director: '总监',
    leader: '组长',
    sales: '销售',
    agent: '代理'
  }
  return roleLabelsMap[role] || role
}

const getExpiryDisplay = (code: ExtendedInvitationCode | null) => {
  if (!code) return '-'
  if (!code.expiresAt) return '永久有效'
  
  const expiry = new Date(code.expiresAt)
  const now = new Date()
  
  if (expiry < now) {
    return '已过期'
  }
  
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '1天后过期'
  } else if (diffDays <= 30) {
    return `${diffDays}天后过期`
  } else {
    return expiry.toLocaleDateString('zh-CN')
  }
}

const getUsageDisplay = (code: ExtendedInvitationCode | null) => {
  if (!code) return '-'
  
  if (!code.maxUsage) {
    return `已用${code.usageCount}次`
  }
  
  const remaining = code.maxUsage - code.usageCount
  return `${code.usageCount}/${code.maxUsage}次 (剩余${remaining}次)`
}
</script>

<style scoped>
/* 选择文本样式 */
.select-all {
  user-select: all;
  -webkit-user-select: all;
  -moz-user-select: all;
  -ms-user-select: all;
}

/* 卡片样式 */
.card {
  transition: all 0.2s ease-in-out;
}

/* 响应式按钮布局 */
@media (max-width: 640px) {
  .card-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .card-footer button {
    width: 100%;
  }
}
</style>