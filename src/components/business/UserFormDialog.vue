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

interface Props {
  open: boolean
  user?: User | null
}

interface Emits {
  'update:open': [value: boolean]
  success: []
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
})

const emit = defineEmits<Emits>()
const { toast } = useToast()

const loading = ref(false)

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

const form = reactive({ ...defaultForm })

// 重置表单
const resetForm = () => {
  Object.assign(form, defaultForm)
}

// 设置表单数据
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

const handleSubmit = async () => {
  loading.value = true
  try {
    if (props.user) {
      // 编辑用户
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
      // 创建用户
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
    toast({
      title: props.user ? '修改失败' : '创建失败',
      description: error.message || '操作失败，请重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:open', false)
}
</script>