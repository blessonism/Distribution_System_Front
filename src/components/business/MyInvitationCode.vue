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
    <Dialog v-model:open="qrCodeDialogOpen">
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

const showQRCode = async () => {
  if (!selectedRole.value || !generatedLink.value) {
    toast({
      title: '无法生成二维码',
      description: '请先选择角色',
      variant: 'destructive',
    })
    return
  }

  qrCodeDialogOpen.value = true
  qrCodeLoading.value = true
  qrCodeError.value = false
  
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
    await nextTick()
    
    // 异步加载二维码库
    const QRCode = (await import('qrcode')).default
    const container = document.getElementById('qr-code-container')
    
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
  const canvas = document.querySelector('#qr-code-container canvas') as HTMLCanvasElement
  if (canvas) {
    const link = document.createElement('a')
    const roleName = getRoleDisplayName(selectedRole.value!)
    link.download = `invitation-${selectedRole.value}-qr.png`
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