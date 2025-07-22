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
    <Dialog v-model:open="qrCodeDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请链接二维码</DialogTitle>
          <DialogDescription>
            扫描二维码快速访问邀请链接
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex flex-col items-center space-y-4 py-4">
          <!-- 二维码 -->
          <div 
            id="link-qr-code-container" 
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
          
          <!-- 链接信息 -->
          <div class="text-center space-y-1 max-w-full">
            <p class="font-medium">{{ getRoleDisplayName(selectedRole!) }}</p>
            <p class="text-xs text-muted-foreground break-all px-2">{{ shortLink || generatedLink }}</p>
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
import { computed, ref, watch, nextTick } from 'vue'
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

const showQRCode = async () => {
  qrCodeDialogOpen.value = true
  qrCodeLoading.value = true
  qrCodeError.value = false
  
  try {
    await nextTick()
    
    const QRCode = (await import('qrcode')).default
    const container = document.getElementById('link-qr-code-container')
    
    if (container) {
      container.innerHTML = ''
      
      const canvas = document.createElement('canvas')
      const linkToEncode = shortLink.value || generatedLink.value
      
      await QRCode.toCanvas(canvas, linkToEncode, {
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
  const canvas = document.querySelector('#link-qr-code-container canvas') as HTMLCanvasElement
  if (canvas) {
    const link = document.createElement('a')
    const roleName = getRoleDisplayName(selectedRole.value!)
    link.download = `invitation-link-${selectedRole.value}-qr.png`
    link.href = canvas.toDataURL()
    link.click()
    
    toast({
      title: '下载成功',
      description: '二维码已保存到本地',
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

const getExpiryDisplay = (code: InvitationCode | null) => {
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

const getUsageDisplay = (code: InvitationCode | null) => {
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