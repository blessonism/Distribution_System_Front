<!--
/**
 * @fileoverview 我的邀请码组件
 * 基于Vue 3 Composition API构建的个人邀请码管理组件，提供邀请码选择、链接生成、分享和二维码功能
 * 集成shadcn-vue设计系统和动态二维码生成，支持多角色邀请码管理、短链接生成、多平台分享等完整功能
 * 采用响应式设计和性能优化策略，确保在各种设备和网络环境下的流畅体验
 * 
 * @component MyInvitationCode
 * @author Frontend Team
 * @since 1.0.0
 * @version 2.4.0
 * 
 * @description
 * MyInvitationCode组件是个人邀请系统的核心管理界面，主要功能包括：
 * - 🎯 智能角色选择器，支持多角色邀请码的动态筛选和自动匹配
 * - 📋 便捷的邀请码和链接展示，支持一键复制到剪贴板
 * - 🔗 自动链接生成功能，基于选定角色和邀请码生成标准邀请链接
 * - 📱 高质量二维码生成器，支持动态生成、预览、下载功能
 * - 🔄 智能短链接服务，集成API提供简洁易分享的链接
 * - 📧 多平台分享支持，包括Web Share API、邮件、短信等分享方式
 * - 🎨 优雅的空状态处理，当无可用邀请码时提供申请引导
 * - ⚡ 高性能处理，异步库加载、内存管理、DOM优化等性能策略
 * - 📱 响应式设计，完美适配移动端和桌面端显示
 * - 🔧 智能错误处理，提供完善的降级方案和用户反馈
 * 
 * @usage
 * ```vue
 * <template>
 *   <MyInvitationCode
 *     :codes="availableCodes"
 *     :allowed-target-roles="allowedRoles"
 *     :loading="isLoading"
 *     @copy-code="handleCopyCode"
 *     @copy-link="handleCopyLink"
 *     @share-link="handleShareLink"
 *     @request-new-code="handleRequestNewCode"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 基础使用示例
 * const availableCodes: InvitationCode[] = [
 *   {
 *     id: 'inv_001',
 *     code: 'AGENT2024001',
 *     targetRole: 'agent',
 *     status: 'active',
 *     usageCount: 5
 *   }
 * ]
 * 
 * const allowedRoles: UserRole[] = ['agent', 'sales', 'leader']
 * 
 * function handleCopyCode(code: string) {
 *   // 处理邀请码复制事件
 *   analytics.track('invitation_code_copied', { code })
 * }
 * 
 * function handleShareLink(link: string, roleName: string) {
 *   // 处理链接分享事件
 *   analytics.track('invitation_shared', { role: roleName, platform: 'web' })
 * }
 * 
 * function handleRequestNewCode(targetRole: UserRole) {
 *   // 处理新邀请码申请
 *   createNewInvitationCode(targetRole)
 * }
 * ```
 * 
 * @dependencies
 * - shadcn-vue: UI组件库，提供Card、Select、Dialog等基础组件
 * - lucide-vue-next: 图标库，提供Link、Copy、Share2等操作图标
 * - qrcode: 二维码生成库，动态加载用于生成邀请链接二维码
 * - Vue 3 Composition API: 响应式状态管理
 * 
 * @features
 * - **角色管理**: 动态角色选择，自动邀请码匹配，权限控制
 * - **链接生成**: 标准化链接生成，参数验证，格式统一
 * - **短链接**: API集成短链接服务，降级方案，错误处理
 * - **二维码**: 动态生成，高清输出，下载支持，内存管理
 * - **多平台分享**: Web Share API、邮件、短信，兼容性处理
 * - **状态管理**: 邀请码状态，使用统计，有效期展示
 * - **用户体验**: 智能提示，空状态处理，加载反馈
 * - **响应式布局**: 移动端优化，自适应设计，触摸友好
 * - **性能优化**: 异步加载，内存管理，渲染优化
 * - **错误处理**: 完善的错误边界，用户友好的错误提示
 */
-->

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center space-x-2">
        <Link class="w-5 h-5" />
        <span>我的邀请码</span>
      </CardTitle>
      <CardDescription>
        查看并分享您的专属邀请码，邀请更多用户加入系统
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- 角色选择 -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">选择邀请角色</Label>
        <Select v-model="selectedRole" @update:model-value="handleRoleChange">
          <SelectTrigger class="w-full">
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

      <!-- 邀请码展示区域 -->
      <div v-if="selectedRole && selectedCode" class="space-y-4">
        <!-- 邀请码 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">邀请码</Label>
            <Badge variant="outline">{{ getRoleDisplayName(selectedRole) }}</Badge>
          </div>
          <div class="flex items-center space-x-2">
            <div class="flex-1 p-3 bg-muted/50 rounded-md font-mono text-sm select-all">
              {{ selectedCode.code }}
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
              {{ generatedLink }}
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

        <!-- 短链接显示（如果已生成） -->
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

    <CardFooter v-if="selectedRole && selectedCode" class="flex flex-wrap gap-2">
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
            <p class="font-medium">{{ getRoleDisplayName(selectedRole!) }}</p>
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
import { computed, ref, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { http } from '@/utils/request'

// Props 定义
interface Props {
  codes: InvitationCode[]
  allowedTargetRoles: UserRole[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits 定义
interface Emits {
  copyCode: [code: string]
  copyLink: [link: string]
  shareLink: [link: string, roleName: string]
  requestNewCode: [targetRole: UserRole]
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedRole = ref<UserRole>()
const generatedLink = ref('')
const shortLink = ref('')
const qrCodeDialogOpen = ref(false)
const qrCodeLoading = ref(false)
const qrCodeError = ref(false)
const qrCodeContainer = ref<HTMLElement | null>(null)
const qrCodeImageUrl = ref<string | null>(null) // 存储预渲染的二维码图像URL
const isDev = ref(process.env.NODE_ENV === 'development') // 开发环境标志

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
  if (!selectedRole.value || matchingCodes.value.length === 0) return null
  // 默认选择第一个可用的邀请码
  return matchingCodes.value[0]
})

// 方法
const handleRoleChange = () => {
  shortLink.value = ''
  generateLink()
}

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

// 监听器
watch(selectedRole, () => {
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

const copyCode = async () => {
  if (!selectedCode.value) return
  
  const success = await copyToClipboard(selectedCode.value.code)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请码已复制到剪贴板',
      variant: 'default',
    })
    emit('copyCode', selectedCode.value.code)
  } else {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const copyLink = async () => {
  if (!generatedLink.value) return
  
  const success = await copyToClipboard(generatedLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '邀请链接已复制到剪贴板',
      variant: 'default',
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
  if (!shortLink.value) return
  
  const success = await copyToClipboard(shortLink.value)
  if (success) {
    toast({
      title: '复制成功',
      description: '短链接已复制到剪贴板',
      variant: 'default',
    })
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
  if (!link) return
  
  const roleName = getRoleDisplayName(selectedRole.value!)
  
  // 如果支持 Web Share API，使用原生分享
  if (navigator.share) {
    navigator.share({
      title: `${roleName}邀请`,
      text: `邀请您加入系统，成为${roleName}`,
      url: link
    }).catch(error => {
      console.log('分享取消或失败:', error)
    })
  } else {
    // 否则复制链接
    copyLink()
  }
  
  emit('shareLink', link, roleName)
}

const shareViaEmail = () => {
  const link = shortLink.value || generatedLink.value
  if (!link || !selectedRole.value) return
  
  const roleName = getRoleDisplayName(selectedRole.value)
  const subject = encodeURIComponent(`${roleName}邀请`)
  const body = encodeURIComponent(
    `您好！\n\n邀请您加入我们的系统，成为${roleName}。\n\n请点击以下链接完成注册：\n${link}\n\n感谢您的参与！`
  )
  
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const shareViaSMS = () => {
  const link = shortLink.value || generatedLink.value
  if (!link || !selectedRole.value) return
  
  const roleName = getRoleDisplayName(selectedRole.value)
  const message = encodeURIComponent(
    `邀请您加入系统成为${roleName}，点击链接注册：${link}`
  )
  
  window.open(`sms:?body=${message}`)
}

const generateShortLink = async () => {
  if (!generatedLink.value) return
  
  try {
    const response = await http.post('/short-link', {
      url: generatedLink.value
    })
    
    // 从响应中获取短链接
    shortLink.value = response.shortUrl
    
    toast({
      title: '短链接生成成功',
      description: '已生成便于分享的短链接',
    })
  } catch (error) {
    console.error('短链接生成失败:', error)
    // 降级方案：生成一个简化的链接显示
    if (selectedCode.value) {
      const baseUrl = window.location.origin
      const shortCode = selectedCode.value.code.slice(-6)
      shortLink.value = `${baseUrl}/i/${shortCode}`
      
      toast({
        title: '短链接生成失败', 
        description: '已生成本地短链接',
        variant: 'destructive',
      })
    }
  }
}

// 分离二维码生成逻辑到独立函数
const generateQRCode = async () => {
  if (!selectedRole.value || !generatedLink.value || qrCodeGenerationAborted) {
    return
  }
  
  // 尝试立即生成短链接（如果没有）
  if (!shortLink.value) {
    try {
      await generateShortLink()
    } catch (e) {
      // 捕获错误但不阻止二维码生成，会使用长链接作为后备
      console.warn('生成短链接失败，将使用原始链接生成二维码')
    }
  }
  
  try {
    // 异步加载二维码库
    const QRCodeModule = await import('qrcode')
    
    // 检查是否已取消或对话框已关闭
    if (qrCodeGenerationAborted || !qrCodeDialogOpen.value) {
      return
    }
    
    const QRCode = QRCodeModule.default
    
    // 等待下一个渲染周期，确保DOM已更新
    await nextTick()
    
    // 再次检查容器
    const container = qrCodeContainer.value
    if (!container || !container.isConnected || qrCodeGenerationAborted) {
      return
    }
    
    // 安全地清空容器
    try {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    } catch (error) {
      console.error('清空容器失败:', error)
      return
    }
    
    // 创建canvas元素
    const canvas = document.createElement('canvas')
    const linkToEncode = shortLink.value || generatedLink.value
    
    try {
      // 生成二维码
      await QRCode.toCanvas(canvas, linkToEncode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // 最后一次检查
      if (qrCodeGenerationAborted || !container.isConnected || !qrCodeDialogOpen.value) {
        return
      }
      
      // 安全地添加到DOM
      try {
        container.appendChild(canvas)
        qrCodeLoading.value = false
      } catch (appendError) {
        console.error('添加二维码到DOM失败:', appendError)
        qrCodeError.value = true
        qrCodeLoading.value = false
      }
    } catch (qrError) {
      if (!qrCodeGenerationAborted) {
        console.error('生成二维码失败:', qrError)
        qrCodeError.value = true
        qrCodeLoading.value = false
      }
    }
  } catch (error) {
    if (!qrCodeGenerationAborted) {
      console.error('二维码库加载失败:', error)
      qrCodeError.value = true
      qrCodeLoading.value = false
      
      toast({
        title: '二维码生成失败',
        description: '请稍后重试或直接分享链接',
        variant: 'destructive',
      })
    }
  }
}

// 预先生成二维码图像
const prepareQRCode = async (): Promise<boolean> => {
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    // 尝试立即生成短链接（如果没有）
    if (!shortLink.value) {
      try {
        await generateShortLink()
      } catch (e) {
        console.warn('生成短链接失败，将使用原始链接生成二维码', e)
      }
    }
    
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
      description: '请先选择角色',
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
    link.download = `invitation-${selectedRole.value}-qr.png`
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
</script>

<style scoped>
/* 选择文本样式 */
.select-all {
  user-select: all;
  -webkit-user-select: all;
  -moz-user-select: all;
  -ms-user-select: all;
}
</style> 