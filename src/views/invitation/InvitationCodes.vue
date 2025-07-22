<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
  

    <!-- 权限检查 -->
    <div v-if="!hasInvitationPermission" class="text-center py-12">
      <Shield class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">无访问权限</h3>
      <p class="text-muted-foreground">
        您当前的角色 ({{ permissions.roleDisplayName }}) 无法使用邀请功能。邀请功能仅对超级管理员、销售总监、销售组长和销售人员开放。
      </p>
    </div>

    <!-- 主要内容区域 -->
    <div v-else class="space-y-6">
      <!-- 邀请码组件 -->
      <MyInvitationCode
        :codes="invitationCodes"
        :allowed-target-roles="allowedTargetRoles"
        :loading="loading"
        @copy-code="handleCopyCode"
        @copy-link="handleCopyLink"
        @share-link="handleShareLink"
        @request-new-code="handleRequestNewCode"
      />
      
      <!-- 统计概览 -->
      <InvitationStatistics
        :stats="invitationStats"
        :recent-invites="recentInvites"
        :active-codes-count="activeCodesCount"
        :total-codes-count="totalCodesCount"
        :loading="loading"
        @time-range-change="handleTimeRangeChange"
        @export="handleExportStatistics"
        @view-all-history="$router.push('/invitation/history')"
      />

      <!-- 快速操作区域 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">快速操作</CardTitle>
          <CardDescription>常用的邀请管理操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 查看邀请历史 -->
            <Button 
              variant="outline" 
              class="flex flex-col items-center space-y-2 h-auto py-4"
              @click="$router.push('/invitation/history')"
            >
              <History class="w-6 h-6" />
              <span class="text-sm">邀请历史</span>
            </Button>
            
            <!-- 邀请统计 -->
            <Button 
              variant="outline" 
              class="flex flex-col items-center space-y-2 h-auto py-4"
              @click="scrollToStatistics"
            >
              <BarChart3 class="w-6 h-6" />
              <span class="text-sm">查看统计</span>
            </Button>
            
            <!-- 批量分享 -->
            <Button 
              variant="outline" 
              class="flex flex-col items-center space-y-2 h-auto py-4"
              @click="handleBulkShare"
              :disabled="invitationCodes.length === 0"
            >
              <Share2 class="w-6 h-6" />
              <span class="text-sm">批量分享</span>
            </Button>
            
            <!-- 导出数据 -->
            <Button 
              v-can="'export_invitation_history'"
              variant="outline" 
              class="flex flex-col items-center space-y-2 h-auto py-4"
              @click="handleExportAllData"
            >
              <Download class="w-6 h-6" />
              <span class="text-sm">导出数据</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 批量分享弹窗 -->
    <Dialog v-model:open="bulkShareDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量分享邀请码</DialogTitle>
          <DialogDescription>
            将所有邀请码生成为一个分享文本
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>分享内容</Label>
            <Textarea
              v-model="bulkShareContent"
              readonly
              rows="8"
              class="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="bulkShareDialogOpen = false">
            关闭
          </Button>
          <Button @click="copyBulkShareContent">
            <Copy class="w-4 h-4 mr-1" />
            复制全部
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast/use-toast'
import InvitationStatistics from '@/components/business/InvitationStatistics.vue'
import MyInvitationCode from '@/components/business/MyInvitationCode.vue'
import { 
  RefreshCw,
  Shield,
  UserPlus,
  History,
  BarChart3,
  Share2,
  Download,
  Copy
} from 'lucide-vue-next'
import { useInvitationStore } from '@/store/invitation'
import { useUserStore } from '@/store/user'
import { useInvitationPermissions } from '@/composables/usePermission'
import type { InvitationCode, InvitationStats, InvitationRecord } from '@/types/invitation'
import type { UserRole } from '@/types/api'
import { generateInvitationLink, getRoleDisplayName } from '@/api/invitation'

// 路由和状态管理
const router = useRouter()
const invitationStore = useInvitationStore()
const userStore = useUserStore()

// 权限管理
const permissions = useInvitationPermissions()

// 响应式数据
const loading = ref(false)
const codeActionLoading = reactive<Record<string, boolean>>({})
const bulkShareDialogOpen = ref(false)
const bulkShareContent = ref('')
const currentTimeRange = ref('month')

// 计算属性
const hasInvitationPermission = computed(() => permissions.value.canAccessInvitation)

const invitationCodes = computed(() => invitationStore.invitationCodes)

const invitationStats = computed(() => invitationStore.invitationStats)

const recentInvites = computed(() => {
  // 获取最近的5条邀请记录
  return invitationStore.invitationHistory.slice(0, 5)
})

const activeCodesCount = computed(() => {
  return invitationCodes.value.filter(code => code.status === 'active').length
})

const totalCodesCount = computed(() => invitationCodes.value.length)

const allowedTargetRoles = computed(() => permissions.value.allowedTargetRoles)

// 页面加载
onMounted(async () => {
  await loadPageData()
})

// 方法
const loadPageData = async () => {
  if (!hasInvitationPermission.value) {
    return
  }

  loading.value = true
  try {
    // 并行加载所有必要的数据
    await Promise.all([
      invitationStore.fetchInvitationCodes(),
      invitationStore.fetchInvitationStats({ timeRange: currentTimeRange.value }),
      invitationStore.fetchInvitationHistory({ page: 1, pageSize: 5 })
    ])
  } catch (error) {
    console.error('加载页面数据失败:', error)
    toast({
      title: '加载失败',
      description: '加载页面数据时发生错误，请刷新页面重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  await loadPageData()
  toast({
    title: '刷新成功',
    description: '页面数据已更新',
  })
}

const handleCopyCode = (code: string) => {
  toast({
    title: '复制成功',
    description: `邀请码 ${code} 已复制到剪贴板`,
  })
}

const handleCopyLink = (link: string) => {
  toast({
    title: '复制成功',
    description: '邀请链接已复制到剪贴板',
  })
}

const handleReactivateCode = async (codeId: string) => {
  codeActionLoading[codeId] = true
  try {
    // 这里调用API重新激活邀请码
    // await invitationStore.reactivateCode(codeId)
    
    toast({
      title: '激活成功',
      description: '邀请码已重新激活',
    })
    
    // 重新加载邀请码数据
    await invitationStore.fetchInvitationCodes()
  } catch (error) {
    console.error('激活邀请码失败:', error)
    toast({
      title: '激活失败',
      description: '激活邀请码时发生错误，请稍后重试',
      variant: 'destructive',
    })
  } finally {
    codeActionLoading[codeId] = false
  }
}

const handleDeactivateCode = async (codeId: string) => {
  codeActionLoading[codeId] = true
  try {
    // 这里调用API停用邀请码
    // await invitationStore.deactivateCode(codeId)
    
    toast({
      title: '停用成功',
      description: '邀请码已停用',
    })
    
    // 重新加载邀请码数据
    await invitationStore.fetchInvitationCodes()
  } catch (error) {
    console.error('停用邀请码失败:', error)
    toast({
      title: '停用失败',
      description: '停用邀请码时发生错误，请稍后重试',
      variant: 'destructive',
    })
  } finally {
    codeActionLoading[codeId] = false
  }
}

const handleShareCode = (link: string, roleName: string) => {
  toast({
    title: '分享准备完成',
    description: `${roleName}邀请链接准备完成`,
  })
}

const handleShareLink = (link: string, roleName: string) => {
  toast({
    title: '分享准备完成',
    description: `${roleName}邀请链接准备完成`,
  })
}

const handleRequestNewCode = (targetRole: UserRole) => {
  toast({
    title: '申请已提交',
    description: `已提交${getRoleDisplayName(targetRole)}邀请码的申请`,
  })
}

const handleTimeRangeChange = async (timeRange: string) => {
  currentTimeRange.value = timeRange
  try {
    await invitationStore.fetchInvitationStats({ timeRange })
  } catch (error) {
    console.error('更新统计数据失败:', error)
  }
}

const handleExportStatistics = (params: { format: string; range: string; timeRange: string }) => {
  // 这里实现统计数据导出逻辑
  toast({
    title: '导出已开始',
    description: `正在生成${params.format.toUpperCase()}格式的统计报告`,
  })
}

const scrollToStatistics = () => {
  // 滚动到统计组件
  const statisticsElement = document.querySelector('.invitation-statistics')
  if (statisticsElement) {
    statisticsElement.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleBulkShare = () => {
  if (invitationCodes.value.length === 0) {
    toast({
      title: '无可分享内容',
      description: '您暂无可分享的邀请码',
      variant: 'destructive',
    })
    return
  }

  // 生成批量分享内容
  const shareLines: string[] = [
    '🎉 邀请您加入我们的系统！',
    '',
    '请选择适合您的角色进行注册：',
    ''
  ]

  invitationCodes.value.forEach(code => {
    if (code.status === 'active') {
      const roleName = getRoleDisplayName(code.targetRole)
      const link = generateInvitationLink(code.code, code.targetRole)
      shareLines.push(`📋 ${roleName}`)
      shareLines.push(`邀请码: ${code.code}`)
      shareLines.push(`链接: ${link}`)
      shareLines.push('')
    }
  })

  shareLines.push('感谢您的参与！')

  bulkShareContent.value = shareLines.join('\n')
  bulkShareDialogOpen.value = true
}

const copyBulkShareContent = async () => {
  try {
    await navigator.clipboard.writeText(bulkShareContent.value)
    toast({
      title: '复制成功',
      description: '批量分享内容已复制到剪贴板',
    })
    bulkShareDialogOpen.value = false
  } catch (error) {
    toast({
      title: '复制失败',
      description: '请手动选择复制',
      variant: 'destructive',
    })
  }
}

const handleExportAllData = () => {
  // 这里实现全部数据导出逻辑
  toast({
    title: '导出已开始',
    description: '正在准备导出所有邀请数据',
  })
}

// 移除了handleGenerateNewCode函数
</script>

<style scoped>
/* 页面样式 */
.invitation-statistics {
  scroll-margin-top: 2rem;
}

/* 卡片网格响应式布局 */
@media (max-width: 1024px) {
  .grid-cols-1.lg\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* 快速操作按钮样式 */
.quick-action-btn {
  transition: all 0.2s ease-in-out;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
}

/* 统计卡片动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
</style>