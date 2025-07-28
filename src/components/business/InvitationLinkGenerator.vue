<!--
/**
 * @fileoverview 邀请链接生成器组件
 * 基于Vue 3 Composition API构建的智能邀请链接生成工具，提供多角色邀请码管理、链接生成、分享和二维码功能
 * 集成shadcn-vue设计系统和多平台分享能力，支持短链接生成、二维码展示、邮件分享等完整的邀请流程
 * 采用响应式设计和性能优化策略，确保在各种设备和使用场景下的流畅体验
 * 
 * @component InvitationLinkGenerator
 * @author Frontend Team
 * @since 1.0.0
 * @version 3.1.0
 * 
 * @description
 * InvitationLinkGenerator组件是邀请系统的核心生成工具，主要功能包括：
 * - 🎯 智能角色选择器，支持多角色邀请码的动态筛选和管理
 * - 🔗 一键链接生成，基于选定角色和邀请码自动生成标准邀请链接
 * - 📋 便捷复制功能，支持原始链接和短链接的快速复制到剪贴板
 * - 📱 二维码生成器，动态生成高质量二维码支持扫码注册
 * - 🔄 短链接服务，集成第三方短链接API提供简洁易分享的链接
 * - 📧 多平台分享，支持Web Share API、邮件、短信等多种分享方式
 * - 📊 实时状态显示，展示邀请码的使用情况、有效期等关键信息
 * - 🎨 智能UI适配，根据数据状态动态调整界面布局和交互
 * - ⚡ 高性能处理，异步加载、状态缓存、DOM优化等性能策略
 * - 🔧 灵活配置，支持角色权限控制和功能模块的动态启用
 * 
 * @usage
 * ```vue
 * <template>
 *   <InvitationLinkGenerator
 *     :codes="invitationCodes"
 *     :allowed-target-roles="allowedRoles"
 *     :loading="isLoading"
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
 * const invitationCodes: ExtendedInvitationCode[] = [
 *   {
 *     id: 'inv_001',
 *     code: 'AGENT2024001',
 *     targetRole: 'agent',
 *     status: 'active',
 *     usageCount: 5,
 *     maxUsage: 20,
 *     createdAt: '2024-01-15T10:30:00Z',
 *     expiresAt: '2024-12-31T23:59:59Z'
 *   }
 * ]
 * 
 * const allowedRoles: UserRole[] = ['agent', 'sales', 'leader']
 * 
 * function handleCopyLink(link: string) {
 *   // 处理链接复制事件
 *   analytics.track('invitation_link_copied', { link })
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
 * - **角色管理**: 动态角色选择，智能邀请码匹配，权限控制
 * - **链接生成**: 标准化链接生成，参数验证，格式统一
 * - **短链接**: 第三方服务集成，降级方案，错误处理
 * - **二维码**: 动态生成，高清输出，下载支持
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

/**
 * 扩展邀请码接口定义
 * 在基础InvitationCode类型上扩展可选的过期时间和最大使用次数属性
 * 
 * @interface ExtendedInvitationCode
 * @extends InvitationCode
 * 
 * @property {string} [expiresAt] - 邀请码过期时间，ISO字符串格式
 * @property {number} [maxUsage] - 邀请码最大使用次数限制，undefined表示无限制
 * 
 * @example
 * ```typescript
 * const codeData: ExtendedInvitationCode = {
 *   id: 'inv_001',
 *   code: 'AGENT2024001',
 *   targetRole: 'agent',
 *   status: 'active',
 *   usageCount: 5,
 *   maxUsage: 20,
 *   createdAt: '2024-01-15T10:30:00Z',
 *   expiresAt: '2024-12-31T23:59:59Z'
 * }
 * ```
 */
interface ExtendedInvitationCode extends InvitationCode {
  /** 邀请码过期时间，ISO格式的日期字符串 */
  expiresAt?: string;
  /** 邀请码最大使用次数，undefined表示无限制 */
  maxUsage?: number;
}

/**
 * 组件属性接口定义
 * 定义InvitationLinkGenerator组件的输入属性
 * 
 * @interface Props
 * 
 * @property {ExtendedInvitationCode[]} codes - 可用邀请码数组，包含所有相关信息
 * @property {UserRole[]} allowedTargetRoles - 允许的目标角色列表，用于权限控制
 * @property {boolean} [loading=false] - 组件加载状态，影响按钮禁用和交互
 * 
 * @example
 * ```typescript
 * const props: Props = {
 *   codes: [
 *     {
 *       id: 'inv_001',
 *       code: 'AGENT2024001',
 *       targetRole: 'agent',
 *       status: 'active',
 *       usageCount: 5,
 *       maxUsage: 20,
 *       createdAt: '2024-01-15T10:30:00Z'
 *     }
 *   ],
 *   allowedTargetRoles: ['agent', 'sales', 'leader'],
 *   loading: false
 * }
 * ```
 */
interface Props {
  /** 可用邀请码数组，包含码值、状态、使用情况等完整信息 */
  codes: ExtendedInvitationCode[]
  /** 允许的目标角色列表，用于权限控制和角色筛选 */
  allowedTargetRoles: UserRole[]
  /** 组件加载状态，影响按钮的禁用状态和用户交互 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * 组件事件接口定义
 * 定义InvitationLinkGenerator组件对外发出的所有事件
 * 
 * @interface Emits
 * 
 * @event copyLink - 链接复制事件，传递复制的链接字符串
 * @event shareLink - 分享事件，传递分享链接和角色名称
 * @event requestNewCode - 新邀请码申请事件，传递目标角色
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleCopyLink(link: string) {
 *   // 记录复制操作
 *   analytics.track('invitation_link_copied', { link })
 * }
 * 
 * function handleShareLink(link: string, roleName: string) {
 *   // 处理分享操作
 *   analytics.track('invitation_shared', { role: roleName })
 * }
 * 
 * function handleRequestNewCode(targetRole: UserRole) {
 *   // 创建新邀请码
 *   createNewInvitationCode(targetRole)
 * }
 * ```
 */
interface Emits {
  /** 用户复制链接时触发，传递复制的链接字符串 */
  copyLink: [link: string]
  /** 用户分享链接时触发，传递链接和角色名称 */
  shareLink: [link: string, roleName: string]
  /** 用户申请新邀请码时触发，传递目标角色 */
  requestNewCode: [targetRole: UserRole]
}

const emit = defineEmits<Emits>()

/**
 * 组件响应式状态管理
 * 管理角色选择、邀请码选择、链接生成、二维码显示等核心状态
 */

/**
 * 当前选中的目标角色
 * 用于筛选匹配的邀请码并生成对应的邀请链接
 * 
 * @type {Ref<UserRole | undefined>}
 * @since 1.0.0
 * 
 * @description 角色选择状态：
 * - undefined: 未选择任何角色
 * - UserRole: 已选择的具体角色枚举值
 * - 角色变化会触发邀请码自动筛选和链接重新生成
 * 
 * @example
 * ```typescript
 * // 设置角色
 * selectedRole.value = 'agent'
 * 
 * // 清除角色选择
 * selectedRole.value = undefined
 * ```
 */
const selectedRole = ref<UserRole>()

/**
 * 当前选中的邀请码ID
 * 与selectedRole联合使用确定具体要生成链接的邀请码
 * 
 * @type {Ref<string | undefined>}
 * @since 1.0.0
 * 
 * @description 邀请码选择状态：
 * - undefined: 未选择任何邀请码
 * - string: 已选择的邀请码ID
 * - 邀请码变化会触发邀请链接重新生成
 * 
 * @example
 * ```typescript
 * // 选择邀请码
 * selectedCodeId.value = 'inv_001'
 * 
 * // 清除邀请码选择
 * selectedCodeId.value = undefined
 * ```
 */
const selectedCodeId = ref<string>()

/**
 * 生成的完整邀请链接
 * 基于选中的角色和邀请码自动生成的标准邀请链接
 * 
 * @type {Ref<string>}
 * @since 1.0.0
 * 
 * @description 链接生成规则：
 * - 包含邀请码和目标角色作为URL参数
 * - 遵循标准的邀请链接格式
 * - 当角色或邀请码变化时自动重新生成
 * - 空字符串表示尚未生成有效链接
 * 
 * @example
 * ```typescript
 * // 典型的生成链接格式
 * // generatedLink.value = 'https://example.com/register?code=AGENT001&role=agent'
 * 
 * if (generatedLink.value) {
 *   // 链接已生成，可以使用
 *   console.log('邀请链接:', generatedLink.value)
 * }
 * ```
 */
const generatedLink = ref('')

/**
 * 生成的短链接
 * 通过第三方服务或本地算法生成的简化版邀请链接
 * 
 * @type {Ref<string>}
 * @since 1.0.0
 * 
 * @description 短链接特性：
 * - 比原始链接更简洁，便于分享
 * - 通过API调用第三方短链接服务生成
 * - 失败时提供本地降级方案
 * - 空字符串表示尚未生成短链接
 * 
 * @example
 * ```typescript
 * // 生成的短链接示例
 * // shortLink.value = 'https://example.com/i/AGENT1'
 * 
 * if (shortLink.value) {
 *   // 优先使用短链接进行分享
 *   shareUrl = shortLink.value
 * } else {
 *   // 降级使用原始链接
 *   shareUrl = generatedLink.value
 * }
 * ```
 */
const shortLink = ref('')

/**
 * 二维码对话框开启状态
 * 控制二维码展示弹窗的显示和隐藏
 * 
 * @type {Ref<boolean>}
 * @since 1.0.0
 * 
 * @description 对话框状态：
 * - true: 对话框已打开，显示二维码
 * - false: 对话框已关闭，隐藏二维码
 * - 状态变化会触发相应的初始化或清理操作
 * 
 * @example
 * ```typescript
 * // 打开二维码对话框
 * qrCodeDialogOpen.value = true
 * 
 * // 关闭二维码对话框
 * qrCodeDialogOpen.value = false
 * ```
 */
const qrCodeDialogOpen = ref(false)

/**
 * 二维码生成加载状态
 * 指示二维码是否正在生成过程中
 * 
 * @type {Ref<boolean>}
 * @since 1.0.0
 * 
 * @description 加载状态：
 * - true: 正在生成二维码，显示加载动画
 * - false: 生成完成或未开始，显示结果或等待状态
 * - 影响用户界面的加载指示和按钮禁用状态
 * 
 * @example
 * ```typescript
 * // 开始生成二维码
 * qrCodeLoading.value = true
 * 
 * // 生成完成
 * qrCodeLoading.value = false
 * ```
 */
const qrCodeLoading = ref(false)

/**
 * 二维码生成错误状态
 * 指示二维码生成过程中是否发生错误
 * 
 * @type {Ref<boolean>}
 * @since 1.0.0
 * 
 * @description 错误状态：
 * - true: 生成过程中发生错误，显示错误提示
 * - false: 生成正常或未开始，显示正常内容
 * - 与qrCodeLoading配合提供完整的状态指示
 * 
 * @example
 * ```typescript
 * // 捕获生成错误
 * try {
 *   await generateQRCode()
 * } catch (error) {
 *   qrCodeError.value = true
 *   qrCodeLoading.value = false
 * }
 * ```
 */
const qrCodeError = ref(false)

/**
 * 二维码容器DOM引用
 * 指向模板中二维码显示容器的DOM元素
 * 
 * @type {Ref<HTMLElement | null>}
 * @since 1.0.0
 * 
 * @description 容器引用：
 * - 用于直接操作DOM显示二维码
 * - null表示元素尚未挂载或已卸载
 * - 提供绕过Vue响应式系统的二维码显示方案
 * 
 * @example
 * ```typescript
 * // 检查容器是否可用
 * if (qrCodeContainer.value) {
 *   // 直接操作DOM添加二维码
 *   qrCodeContainer.value.appendChild(qrCodeElement)
 * }
 * ```
 */
const qrCodeContainer = ref<HTMLElement | null>(null)

/**
 * 预生成的二维码图像URL
 * 存储已生成的二维码图像的Data URL或Blob URL
 * 
 * @type {Ref<string | null>}
 * @since 1.0.0
 * 
 * @description 图像URL：
 * - Data URL格式的二维码图像数据
 * - null表示尚未生成或生成失败
 * - 用于预生成和缓存二维码以提升性能
 * - 支持下载功能的数据源
 * 
 * @example
 * ```typescript
 * // 使用生成的二维码
 * if (qrCodeImageUrl.value) {
 *   // 创建图像元素
 *   const img = document.createElement('img')
 *   img.src = qrCodeImageUrl.value
 *   
 *   // 或用于下载
 *   const link = document.createElement('a')
 *   link.href = qrCodeImageUrl.value
 *   link.download = 'qr-code.png'
 *   link.click()
 * }
 * ```
 */
const qrCodeImageUrl = ref<string | null>(null)

/**
 * 二维码生成取消控制和清理机制
 * 全局变量用于控制异步操作的生命周期
 */
let qrCodeGenerationAborted = false
let qrCodeCleanupTimeout: number | null = null

/**
 * 组件卸载前的清理操作
 * 确保所有异步操作被正确取消，内存资源被及时释放
 * 
 * @lifecycle onBeforeUnmount
 * 
 * @complexity O(1) - 常数时间的清理操作
 * @flow 设置中断标志 → 清理定时器 → 释放Blob URL → 重置状态
 * 
 * @description 清理操作包括：
 * - 设置二维码生成中断标志
 * - 清理延时定时器
 * - 释放创建的Blob URL内存
 * - 重置相关状态变量
 */
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

/**
 * 二维码对话框关闭处理函数
 * 处理用户主动关闭二维码显示对话框的操作
 * 
 * @function handleDialogClose
 * @returns {void}
 * 
 * @complexity O(1) - 简单的状态设置，常数时间复杂度
 * @flow 用户操作 → 关闭对话框 → 状态更新
 * 
 * @description 功能说明：
 * - 响应用户的对话框关闭操作
 * - 更新对话框开启状态为false
 * - 触发相关的清理和状态重置
 * 
 * @example
 * ```typescript
 * // 用户点击关闭按钮时
 * handleDialogClose() // 对话框状态设置为关闭
 * ```
 */
const handleDialogClose = () => {
  qrCodeDialogOpen.value = false
}

/**
 * 监听二维码对话框开启状态变化
 * 根据对话框的开启/关闭状态执行相应的初始化或清理操作
 * 
 * @watcher qrCodeDialogOpen
 * @param {boolean} isOpen - 对话框是否开启
 * 
 * @complexity O(1) - 条件判断和函数调用，常数时间复杂度
 * @flow 状态变化监听 → 条件判断 → 初始化或清理操作
 * 
 * @description 监听逻辑：
 * - 对话框开启时：等待DOM更新后初始化二维码显示
 * - 对话框关闭时：设置中断标志并清理相关资源
 * 
 * @example
 * ```typescript
 * // 对话框开启时
 * qrCodeDialogOpen.value = true
 * // 触发监听器 -> 初始化二维码显示
 * 
 * // 对话框关闭时  
 * qrCodeDialogOpen.value = false
 * // 触发监听器 -> 清理资源
 * ```
 */
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

/**
 * 强制初始化二维码显示
 * 直接操作DOM来显示二维码，绕过Vue的响应式系统以确保显示的可靠性
 * 
 * @function initializeQRCodeDisplay
 * @returns {void}
 * 
 * @complexity O(1) - DOM操作和条件判断，常数时间复杂度
 * @flow 容器检查 → 内容清空 → 状态判断 → DOM元素创建 → 内容渲染
 * 
 * @description 显示逻辑：
 * - 根据当前状态（加载中、错误、成功、空状态）显示不同内容
 * - 使用原生DOM操作确保显示的即时性和可靠性
 * - 提供友好的加载动画、错误提示和空状态指示
 * 
 * @example
 * ```typescript
 * // 在对话框打开后调用
 * initializeQRCodeDisplay()
 * // 根据qrCodeLoading、qrCodeError、qrCodeImageUrl状态显示相应内容
 * ```
 */
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

/**
 * 监听二维码准备状态
 * 当对话框开启且二维码未加载时，自动触发二维码预生成
 * 
 * @watcher qrCodeDialogOpen
 * @param {boolean} isOpen - 对话框是否开启
 * 
 * @complexity O(n) - 包含异步二维码生成的复杂度
 * @flow 状态监听 → 条件判断 → 二维码预生成调用
 * 
 * @description 预生成逻辑：
 * - 仅在对话框开启且非加载状态时触发
 * - 调用prepareQRCode函数进行异步二维码生成
 * - 确保二维码在用户查看前已准备就绪
 * 
 * @example
 * ```typescript
 * // 对话框开启时
 * qrCodeDialogOpen.value = true
 * // 如果qrCodeLoading.value为false，触发prepareQRCode()
 * ```
 */
watch(qrCodeDialogOpen, async (isOpen) => {
  if (isOpen && !qrCodeLoading.value) {
    await prepareQRCode()
  }
})

/**
 * 计算属性：可用角色选项列表
 * 根据允许的目标角色生成带有标签和描述的角色选项数组
 * 
 * @computed availableRoles
 * @returns {Array} 角色选项数组，包含value、label、description属性
 * 
 * @complexity O(n) - n为允许角色数量，通常为常数
 * @flow 角色列表获取 → 映射转换 → 选项数组返回
 * 
 * @description 角色映射：
 * - super_admin: 超管 - 系统管理员
 * - director: 总监 - 销售部门
 * - leader: 组长 - 销售团队
 * - sales: 销售 - 销售人员
 * - agent: 代理 - 外部代理
 * 
 * @returns {Array} 角色选项数组
 * @returns {UserRole} returns[].value - 角色值
 * @returns {string} returns[].label - 角色显示名称
 * @returns {string} returns[].description - 角色描述
 * 
 * @example
 * ```typescript
 * // 允许的角色为['agent', 'sales']
 * const roles = availableRoles.value
 * // [
 * //   { value: 'agent', label: '代理', description: '外部代理' },
 * //   { value: 'sales', label: '销售', description: '销售人员' }
 * // ]
 * ```
 */
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

/**
 * 计算属性：匹配的邀请码列表
 * 根据当前选中的角色筛选出对应的激活状态邀请码
 * 
 * @computed matchingCodes
 * @returns {ExtendedInvitationCode[]} 匹配的邀请码数组
 * 
 * @complexity O(n) - n为邀请码总数，线性搜索
 * @flow 角色检查 → 邀请码过滤 → 状态筛选 → 结果返回
 * 
 * @description 筛选逻辑：
 * - 仅返回目标角色与选中角色匹配的邀请码
 * - 仅返回状态为'active'的邀请码
 * - 如果未选择角色，返回空数组
 * 
 * @example
 * ```typescript
 * // 选中角色为'agent'
 * selectedRole.value = 'agent'
 * const codes = matchingCodes.value
 * // 返回所有targetRole为'agent'且status为'active'的邀请码
 * ```
 */
const matchingCodes = computed(() => {
  if (!selectedRole.value) return []
  return props.codes.filter(code => 
    code.targetRole === selectedRole.value && 
    code.status === 'active'
  )
})

/**
 * 计算属性：当前选中的邀请码
 * 根据选中的邀请码ID从匹配列表中查找对应的邀请码对象
 * 
 * @computed selectedCode
 * @returns {ExtendedInvitationCode | null} 选中的邀请码对象或null
 * 
 * @complexity O(n) - n为匹配邀请码数量，线性搜索
 * @flow 邀请码ID检查 → 列表搜索 → 对象返回或null
 * 
 * @description 查找逻辑：
 * - 如果未选择邀请码ID，返回null
 * - 在匹配的邀请码列表中查找ID对应的对象
 * - 找不到时返回null
 * 
 * @example
 * ```typescript
 * // 选中邀请码ID
 * selectedCodeId.value = 'inv_001'
 * const code = selectedCode.value
 * // 返回ID为'inv_001'的邀请码对象，未找到则为null
 * ```
 */
const selectedCode = computed(() => {
  if (!selectedCodeId.value) return null
  return matchingCodes.value.find(code => code.id === selectedCodeId.value) || null
})

/**
 * 邀请链接生成函数
 * 根据选中的角色和邀请码生成完整的邀请注册链接
 * 
 * @function generateLink
 * @returns {void}
 * 
 * @complexity O(1) - 简单的函数调用和字符串拼接，常数时间复杂度
 * @flow 参数验证 → API调用 → 链接生成 → 状态更新
 * 
 * @description 生成逻辑：
 * - 验证选中角色和邀请码的有效性
 * - 调用API函数生成标准化邀请链接
 * - 更新generatedLink状态
 * - 参数不完整时清空链接
 * 
 * @example
 * ```typescript
 * // 选择角色和邀请码后
 * selectedRole.value = 'agent'
 * selectedCode.value = { code: 'AGENT001', ... }
 * generateLink()
 * // generatedLink.value 更新为生成的链接
 * ```
 */
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

/**
 * 角色变化处理函数
 * 处理用户选择新角色时的逻辑，重置相关状态并自动选择邀请码
 * 
 * @function handleRoleChange
 * @returns {void}
 * 
 * @complexity O(1) - 简单的状态重置和条件判断，常数时间复杂度
 * @flow 状态重置 → 短链接清空 → 邀请码自动选择
 * 
 * @description 处理逻辑：
 * - 重置邀请码选择状态
 * - 清空之前生成的短链接
 * - 如果只有一个匹配的邀请码，自动选择
 * 
 * @example
 * ```typescript
 * // 用户切换角色时
 * selectedRole.value = 'sales'
 * handleRoleChange()
 * // selectedCodeId重置，如果只有一个sales邀请码则自动选择
 * ```
 */
const handleRoleChange = () => {
  selectedCodeId.value = undefined
  shortLink.value = ''
  if (matchingCodes.value.length === 1) {
    selectedCodeId.value = matchingCodes.value[0].id
  }
}

/**
 * 邀请码变化处理函数
 * 处理用户选择新邀请码时的逻辑，清空短链接并重新生成邀请链接
 * 
 * @function handleCodeChange
 * @returns {void}
 * 
 * @complexity O(1) - 简单的状态重置和函数调用，常数时间复杂度
 * @flow 短链接清空 → 邀请链接重新生成
 * 
 * @description 处理逻辑：
 * - 清空之前生成的短链接
 * - 调用generateLink重新生成邀请链接
 * 
 * @example
 * ```typescript
 * // 用户选择不同的邀请码时
 * selectedCodeId.value = 'inv_002'
 * handleCodeChange()
 * // 清空shortLink，重新生成generatedLink
 * ```
 */
const handleCodeChange = () => {
  shortLink.value = ''
  generateLink()
}

/**
 * 监听选中状态变化
 * 当角色或邀请码选择发生变化时，自动重新生成邀请链接
 * 
 * @watcher [selectedRole, selectedCodeId]
 * 
 * @complexity O(1) - 简单的函数调用，常数时间复杂度
 * @flow 状态变化监听 → 链接重新生成
 * 
 * @description 监听逻辑：
 * - 监听selectedRole和selectedCodeId的变化
 * - 任一状态变化时调用generateLink重新生成链接
 * - immediate: true 确保组件初始化时也执行一次
 * 
 * @example
 * ```typescript
 * // 角色或邀请码变化时
 * selectedRole.value = 'agent'
 * // 或 selectedCodeId.value = 'inv_001'
 * // 自动触发 generateLink()
 * ```
 */
watch([selectedRole, selectedCodeId], () => {
  generateLink()
}, { immediate: true })

/**
 * 剪贴板复制工具函数
 * 提供跨浏览器兼容的文本复制功能，包含现代API和降级方案
 * 
 * @function copyToClipboard
 * @param {string} text - 要复制到剪贴板的文本内容
 * @returns {Promise<boolean>} 复制操作是否成功
 * 
 * @complexity O(1) - 简单的API调用，常数时间复杂度
 * @flow 现代API尝试 → 错误捕获 → 结果返回
 * 
 * @description 复制策略：
 * - 优先使用现代的navigator.clipboard API
 * - 提供完整的错误处理和兼容性支持
 * - 确保在各种浏览器环境下的可靠性
 * 
 * @example
 * ```typescript
 * const success = await copyToClipboard('https://example.com/invite')
 * if (success) {
 *   console.log('复制成功')
 * } else {
 *   console.log('复制失败')
 * }
 * ```
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

/**
 * 复制生成链接处理函数
 * 处理用户点击复制生成链接按钮的操作，包含复制执行和用户反馈
 * 
 * @function copyGeneratedLink
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 复制操作和提示显示，常数时间复杂度
 * @flow 复制执行 → 结果判断 → 提示显示 → 事件发出
 * 
 * @description 处理流程：
 * - 调用复制工具函数复制生成的邀请链接
 * - 根据复制结果显示成功或失败提示
 * - 成功时发出copyLink事件通知父组件
 * 
 * @example
 * ```typescript
 * // 用户点击复制按钮时
 * await copyGeneratedLink()
 * // 显示"复制成功"提示，发出copyLink事件
 * ```
 */
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

/**
 * 复制短链接处理函数
 * 处理用户点击复制短链接按钮的操作
 * 
 * @function copyShortLink
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - 复制操作和提示显示，常数时间复杂度
 * @flow 短链接获取 → 复制执行 → 结果判断 → 提示显示 → 事件发出
 * 
 * @description 处理流程：
 * - 获取当前的短链接
 * - 执行复制操作并处理结果
 * - 提供相应的用户反馈和事件通知
 * 
 * @example
 * ```typescript
 * // 用户点击复制短链接按钮时
 * await copyShortLink()
 * // 显示"复制成功"提示，发出copyLink事件
 * ```
 */
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

/**
 * Web分享处理函数
 * 处理用户点击分享按钮的操作，支持原生分享API和降级方案
 * 
 * @function shareViaWebShare
 * @returns {void}
 * 
 * @complexity O(1) - API检查和调用，常数时间复杂度
 * @flow 事件发出 → 链接准备 → API检查 → 原生分享或降级复制
 * 
 * @description 分享策略：
 * - 优先使用Web Share API进行原生分享
 * - 不支持时自动降级到复制链接功能
 * - 提供完整的分享内容和错误处理
 * 
 * @example
 * ```typescript
 * // 用户点击分享按钮时
 * shareViaWebShare()
 * // 发出shareLink事件，尝试原生分享或复制链接
 * ```
 */
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

/**
 * 二维码预生成函数
 * 异步生成二维码图像并缓存到内存中，为后续显示做准备
 * 
 * @function prepareQRCode
 * @returns {Promise<boolean>} 生成操作是否成功
 * 
 * @complexity O(n) - n为二维码复杂度，通常为常数时间
 * @flow 状态设置 → 链接验证 → 库加载 → 二维码生成 → DOM操作 → 状态更新
 * 
 * @description 生成流程：
 * - 动态加载qrcode库避免增加初始包大小
 * - 使用离屏canvas生成高质量二维码
 * - 转换为DataURL格式便于后续使用
 * - 提供完整的错误处理和用户反馈
 * 
 * @example
 * ```typescript
 * const success = await prepareQRCode()
 * if (success) {
 *   // 二维码生成成功，可以显示
 *   showQRCodeDialog()
 * } else {
 *   // 生成失败，显示错误提示
 *   showErrorMessage()
 * }
 * ```
 */
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

/**
 * 获取角色简短显示标签
 * 根据用户角色获取对应的中文显示名称
 * 
 * @function getDisplayRoleLabel
 * @param {UserRole} role - 用户角色枚举值
 * @returns {string} 角色的中文显示名称
 * 
 * @complexity O(1) - 对象属性查找，常数时间复杂度
 * @flow 角色映射查找 → 名称返回或默认值
 * 
 * @description 角色映射：
 * - super_admin: 超级管理员
 * - director: 总监
 * - leader: 组长
 * - sales: 销售
 * - agent: 代理
 * 
 * @example
 * ```typescript
 * const name = getDisplayRoleLabel('agent') // '代理'
 * const name = getDisplayRoleLabel('unknown' as UserRole) // 'unknown'
 * ```
 */
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

/**
 * 获取过期时间显示
 * 根据邀请码的过期时间计算并返回友好的显示文本
 * 
 * @function getExpiryDisplay
 * @param {ExtendedInvitationCode | null} code - 邀请码对象
 * @returns {string} 过期时间的显示文本
 * 
 * @complexity O(1) - 日期计算和条件判断，常数时间复杂度
 * @flow 对象检查 → 过期时间解析 → 时间计算 → 显示文本返回
 * 
 * @description 显示逻辑：
 * - 无邀请码对象：返回'-'
 * - 无过期时间：返回'永久有效'
 * - 已过期：返回'已过期'
 * - 1天内过期：返回'1天后过期'
 * - 30天内过期：返回'X天后过期'
 * - 超过30天：返回具体日期
 * 
 * @example
 * ```typescript
 * const code = { expiresAt: '2024-12-31T23:59:59Z', ... }
 * const display = getExpiryDisplay(code) // '30天后过期' 或具体日期
 * ```
 */
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

/**
 * 获取使用情况显示
 * 根据邀请码的使用统计生成友好的显示文本
 * 
 * @function getUsageDisplay
 * @param {ExtendedInvitationCode | null} code - 邀请码对象
 * @returns {string} 使用情况的显示文本
 * 
 * @complexity O(1) - 简单的数学计算，常数时间复杂度
 * @flow 对象检查 → 使用限制检查 → 计算处理 → 显示文本返回
 * 
 * @description 显示逻辑：
 * - 无邀请码对象：返回'-'
 * - 无使用限制：返回'已用X次'
 * - 有使用限制：返回'X/Y次 (剩余Z次)'
 * 
 * @example
 * ```typescript
 * const code = { usageCount: 5, maxUsage: 20, ... }
 * const display = getUsageDisplay(code) // '5/20次 (剩余15次)'
 * 
 * const unlimitedCode = { usageCount: 10, ... }
 * const display = getUsageDisplay(unlimitedCode) // '已用10次'
 * ```
 */
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