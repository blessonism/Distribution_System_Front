<!--
/**
 * @fileoverview 用户表单对话框组件
 * 基于Vue 3 Composition API构建的用户管理表单对话框，提供用户创建和编辑功能
 * 支持完整的用户信息录入、角色权限配置、表单验证和数据持久化
 * 集成shadcn-vue对话框组件和响应式布局设计，确保最佳用户体验
 * 
 * @component UserFormDialog
 * @author Frontend Team
 * @since 1.0.0
 * @version 1.2.0
 * 
 * @description
 * UserFormDialog是用户管理系统的核心表单组件，提供以下主要功能：
 * - 📝 完整的用户信息表单，包含基础信息、角色权限和业务配置
 * - ⚡ 双模式支持，统一处理用户创建和编辑操作
 * - ✅ 实时表单验证，确保数据的完整性和合规性
 * - 🔐 角色权限配置，支持多层级用户权限管理
 * - 💰 佣金比例设置，支持个性化佣金策略配置
 * - 📱 响应式设计，适配不同屏幕尺寸的设备
 * - 🔄 智能表单重置，确保状态管理的正确性
 * 
 * @usage
 * ```vue
 * <template>
 *   <UserFormDialog
 *     :open="showDialog"
 *     :user="editingUser"
 *     @update:open="showDialog = $event"
 *     @success="handleSuccess"
 *   />
 * </template>
 * ```
 * 
 * @example
 * ```typescript
 * // 创建新用户
 * const showCreateDialog = () => {
 *   editingUser.value = null
 *   showDialog.value = true
 * }
 * 
 * // 编辑现有用户
 * const showEditDialog = (user: User) => {
 *   editingUser.value = user
 *   showDialog.value = true
 * }
 * 
 * // 处理成功回调
 * const handleSuccess = () => {
 *   refreshUserList()
 *   showDialog.value = false
 * }
 * ```
 */
-->

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ user ? '编辑用户' : '新增用户' }}</DialogTitle>
        <DialogDescription>
          {{ user ? '修改用户信息' : '创建新的用户账号' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit">
        <div class="grid gap-4 py-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="username">用户名 *</Label>
              <Input
                id="username"
                v-model="form.username"
                placeholder="请输入用户名"
                :disabled="!!user"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="email">邮箱 *</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="phone">手机号 *</Label>
              <Input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="请输入手机号"
                required
              />
            </div>
            
            <div class="space-y-2" v-if="!user">
              <Label for="password">密码 *</Label>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          <!-- 角色和权限 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="role">角色 *</Label>
              <Select v-model="form.role" required>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">超级管理员</SelectItem>
                  <SelectItem value="director">总监</SelectItem>
                  <SelectItem value="leader">主管</SelectItem>
                  <SelectItem value="sales">销售</SelectItem>
                  <SelectItem value="agent">代理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <Label for="status">状态</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue placeholder="选择用户状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="banned">封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- 等级和佣金 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="level">等级</Label>
              <Input
                id="level"
                v-model.number="form.level"
                type="number"
                min="1"
                max="10"
                placeholder="用户等级"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="commission_rate">佣金比例 (%)</Label>
              <Input
                id="commission_rate"
                v-model.number="form.commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="佣金比例"
              />
            </div>
          </div>

          <!-- 上级用户 -->
          <div class="space-y-2">
            <Label for="parent_id">上级用户</Label>
            <Input
              id="parent_id"
              v-model="form.parent_id"
              placeholder="上级用户ID（可选）"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleCancel">
            取消
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ user ? '保存修改' : '创建用户' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
/**
 * @fileoverview UserFormDialog组件的核心逻辑实现
 * 使用Vue 3 Composition API实现用户表单的完整功能，包括双模式操作和数据管理
 */
import { ref, reactive, watch, nextTick } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/user'
import { userApi } from '@/api/user'
import { useToast } from '@/components/ui/toast/use-toast'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * 组件属性接口定义
 * 定义UserFormDialog组件的输入属性
 * 
 * @interface Props
 * 
 * @property {boolean} open - 对话框显示状态控制
 * @property {User | null} [user] - 编辑模式下的用户数据，null时为创建模式
 * 
 * @example
 * ```typescript
 * // 创建模式
 * const createProps: Props = {
 *   open: true,
 *   user: null
 * }
 * 
 * // 编辑模式
 * const editProps: Props = {
 *   open: true,
 *   user: {
 *     id: 'user_001',
 *     username: 'admin',
 *     email: 'admin@example.com',
 *     role: 'super_admin'
 *   }
 * }
 * ```
 */
interface Props {
  /** 对话框显示状态 */
  open: boolean
  /** 编辑的用户数据，null时为创建模式 */
  user?: User | null
}

/**
 * 组件事件定义
 * 定义UserFormDialog组件对外发出的事件
 * 
 * @events
 * 
 * @event update:open - 更新对话框显示状态，支持v-model双向绑定
 * @event success - 操作成功事件，用于通知父组件刷新数据
 * 
 * @example
 * ```typescript
 * // 事件处理示例
 * function handleOpenChange(open: boolean) {
 *   showDialog.value = open
 * }
 * 
 * function handleSuccess() {
 *   // 刷新用户列表
 *   await refreshUserList()
 *   // 显示成功提示
 *   toast({ title: '操作成功' })
 * }
 * ```
 */
interface Emits {
  /** 更新对话框显示状态 */
  'update:open': [value: boolean]
  /** 操作成功通知 */
  success: []
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
})

const emit = defineEmits<Emits>()
const { toast } = useToast()

/**
 * 组件状态管理
 * 管理表单提交的加载状态
 */
const loading = ref(false)

/**
 * 默认表单数据模板
 * 定义表单字段的初始值和默认配置
 * 
 * @const defaultForm
 * @type {Object}
 * 
 * @property {string} username - 用户名，创建时必填
 * @property {string} email - 邮箱地址，必填字段
 * @property {string} phone - 手机号码，必填字段
 * @property {string} password - 密码，创建时必填
 * @property {'sales'} role - 默认角色为销售
 * @property {'active'} status - 默认状态为正常
 * @property {number} level - 默认等级为1
 * @property {number} commission_rate - 默认佣金比例为0
 * @property {string} parent_id - 上级用户ID，可选
 * 
 * @example
 * ```typescript
 * // 重置表单到默认状态
 * Object.assign(form, defaultForm)
 * 
 * // 获取默认角色
 * const defaultRole = defaultForm.role // 'sales'
 * ```
 */
const defaultForm = {
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'sales' as const,
  status: 'active' as const,
  level: 1,
  commission_rate: 0,
  parent_id: '',
}

/**
 * 响应式表单数据
 * 管理用户输入的所有表单字段，支持双向数据绑定
 * 
 * @reactive form
 * @type {typeof defaultForm}
 * 
 * @example
 * ```typescript
 * // 设置表单数据
 * form.username = 'admin'
 * form.email = 'admin@example.com'
 * form.role = 'super_admin'
 * 
 * // 获取表单数据
 * const formData = {
 *   username: form.username,
 *   email: form.email,
 *   phone: form.phone
 * }
 * ```
 */
const form = reactive({ ...defaultForm })

/**
 * 重置表单数据
 * 将表单恢复到默认状态，清除所有用户输入
 * 
 * @function resetForm
 * @returns {void}
 * 
 * @complexity O(1) - 对象赋值操作，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 在对话框关闭时重置表单
 * watch(() => props.open, (isOpen) => {
 *   if (!isOpen) {
 *     resetForm()
 *   }
 * })
 * 
 * // 手动重置表单
 * resetForm()
 * ```
 */
const resetForm = () => {
  Object.assign(form, defaultForm)
}

/**
 * 设置表单数据
 * 将用户数据填充到表单中，用于编辑模式的数据回显
 * 
 * @function setFormData
 * @param {User} user - 要编辑的用户数据对象
 * @returns {void}
 * 
 * @complexity O(1) - 直接属性赋值，常数时间复杂度
 * @flow 用户数据 → 表单字段映射 → 数据回显 → 编辑就绪
 * 
 * @example
 * ```typescript
 * // 编辑用户时设置表单数据
 * const editUser: User = {
 *   id: 'user_001',
 *   username: 'admin',
 *   email: 'admin@example.com',
 *   phone: '13800138000',
 *   role: 'super_admin',
 *   status: 'active',
 *   level: 10,
 *   commission_rate: 5.5,
 *   parent_id: 'parent_001'
 * }
 * 
 * setFormData(editUser)
 * // 表单将显示用户的当前信息
 * ```
 */
const setFormData = (user: User) => {
  form.username = user.username
  form.email = user.email
  form.phone = user.phone
  form.role = user.role
  form.status = user.status
  form.level = user.level
  form.commission_rate = user.commission_rate
  form.parent_id = user.parent_id || ''
  form.password = '' // 编辑时不显示密码
}

// 监听用户数据变化
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      setFormData(newUser)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 监听弹窗打开状态
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.user) {
      nextTick(() => {
        setFormData(props.user)
      })
    } else if (isOpen && !props.user) {
      nextTick(() => {
        resetForm()
      })
    }
  }
)

/**
 * 处理表单提交
 * 根据当前模式执行用户创建或更新操作，包含完整的错误处理和用户反馈
 * 
 * @async
 * @function handleSubmit
 * @returns {Promise<void>}
 * 
 * @complexity O(1) - API调用操作，常数时间复杂度（不考虑网络延迟）
 * @flow 表单验证 → 数据组装 → API调用 → 状态更新 → 用户反馈
 * 
 * @example
 * ```typescript
 * // 用户点击提交按钮时自动调用
 * // 创建模式示例
 * const createUserFlow = async () => {
 *   // 表单数据会被组装为CreateUserRequest
 *   // API调用：userApi.createUser(createData)
 *   // 成功时发出success事件
 * }
 * 
 * // 编辑模式示例  
 * const updateUserFlow = async () => {
 *   // 表单数据会被组装为UpdateUserRequest
 *   // API调用：userApi.updateUser(userId, updateData)
 *   // 成功时发出success事件
 * }
 * ```
 */
const handleSubmit = async () => {
  loading.value = true
  try {
    if (props.user) {
      // 编辑用户模式
      const updateData: UpdateUserRequest = {
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        level: form.level,
        commission_rate: form.commission_rate,
        parent_id: form.parent_id || undefined,
      }
      await userApi.updateUser(props.user.id, updateData)
      toast({
        title: '修改成功',
        description: '用户信息已更新',
      })
    } else {
      // 创建用户模式
      const createData: CreateUserRequest = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        status: form.status,
        level: form.level,
        commission_rate: form.commission_rate,
        parent_id: form.parent_id || undefined,
      }
      await userApi.createUser(createData)
      toast({
        title: '创建成功',
        description: '新用户已创建',
      })
    }
    emit('success')
    emit('update:open', false)
  } catch (error: any) {
    // 使用统一的错误处理工具
    const { showErrorToast } = await import('@/utils/errorCodeMapping')
    showErrorToast(error, props.user ? '修改失败' : '创建失败')
  } finally {
    loading.value = false
  }
}

/**
 * 处理取消操作
 * 关闭对话框，不保存任何更改
 * 
 * @function handleCancel
 * @returns {void}
 * 
 * @complexity O(1) - 简单事件发出，常数时间复杂度
 * 
 * @example
 * ```typescript
 * // 用户点击取消按钮时调用
 * handleCancel()
 * // 对话框将关闭，表单数据不会被保存
 * ```
 */
const handleCancel = () => {
  emit('update:open', false)
}
</script>