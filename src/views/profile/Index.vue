<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold">个人设置</h1>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <!-- 左侧个人信息卡片 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex flex-col items-center">
          <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span class="text-3xl font-medium text-blue-600">
              {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
            </span>
          </div>
          <h2 class="text-xl font-semibold mb-1">{{ userStore.userInfo?.username || '用户' }}</h2>
          <p class="text-gray-500 mb-4">{{ getRoleName(userStore.userInfo?.role) }}</p>
          <div class="w-full border-t border-gray-100 pt-4 mt-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-600">用户ID</span>
              <span class="font-medium">{{ userStore.userInfo?.id || '-' }}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-600">手机号码</span>
              <span class="font-medium">{{ userStore.userInfo?.phone || '-' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">邮箱</span>
              <span class="font-medium">{{ userStore.userInfo?.email || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧设置区域 -->
      <div class="md:col-span-2">
        <!-- 个人信息设置 -->
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>个人信息设置</CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="updateProfile">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label for="username" class="mb-1.5">用户名</Label>
                  <Input id="username" v-model="profile.username" :disabled="true" />
                </div>
                <div>
                  <Label for="role" class="mb-1.5">角色</Label>
                  <Input id="role" :value="getRoleName(userStore.userInfo?.role)" disabled />
                </div>
                <div>
                  <Label for="phone" class="mb-1.5">手机号码</Label>
                  <Input id="phone" v-model="profile.phone" placeholder="请输入手机号码" />
                </div>
                <div>
                  <Label for="email" class="mb-1.5">邮箱</Label>
                  <Input id="email" v-model="profile.email" placeholder="请输入邮箱" />
                </div>
              </div>
              <Button type="submit" :disabled="updating">保存修改</Button>
            </form>
          </CardContent>
        </Card>

        <!-- 修改密码 -->
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="updatePassword">
              <div class="space-y-4 mb-4">
                <div>
                  <Label for="currentPassword" class="mb-1.5">当前密码</Label>
                  <Input id="currentPassword" v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" />
                </div>
                <div>
                  <Label for="newPassword" class="mb-1.5">新密码</Label>
                  <Input id="newPassword" v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
                </div>
                <div>
                  <Label for="confirmPassword" class="mb-1.5">确认新密码</Label>
                  <Input id="confirmPassword" v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
                  <p v-if="passwordMismatch" class="text-red-500 text-sm mt-1">两次输入的密码不一致</p>
                </div>
              </div>
              <Button type="submit" variant="outline" :disabled="updatingPassword">修改密码</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useToast } from '@/components/ui/toast/use-toast'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const userStore = useUserStore()
const { toast } = useToast()

const profile = ref({
  username: '',
  email: '',
  phone: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const updating = ref(false)
const updatingPassword = ref(false)

// 计算密码是否匹配
const passwordMismatch = computed(() => {
  return passwordForm.value.newPassword !== passwordForm.value.confirmPassword && 
         passwordForm.value.confirmPassword !== ''
})

// 获取用户角色名称
const getRoleName = (role?: string) => {
  const roleMap: Record<string, string> = {
    'super_admin': '超级管理员',
    'director': '主管',
    'leader': '组长',
    'sales': '销售'
  }
  return role ? (roleMap[role] || role) : '未知角色'
}

// 获取用户信息
const fetchUserProfile = () => {
  if (userStore.userInfo) {
    profile.value = {
      username: userStore.userInfo.username || '',
      email: userStore.userInfo.email || '',
      phone: userStore.userInfo.phone || ''
    }
  }
}

// 更新个人信息
const updateProfile = async () => {
  if (!userStore.userInfo?.id) {
    toast({
      title: '更新失败',
      description: '用户信息不完整',
      variant: 'destructive'
    })
    return
  }
  
  try {
    updating.value = true
    await userStore.updateUserInfo({
      id: userStore.userInfo.id,
      email: profile.value.email,
      phone: profile.value.phone
    })
    
    toast({
      title: '更新成功',
      description: '个人信息已更新'
    })
  } catch (error) {
    toast({
      title: '更新失败',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive'
    })
  } finally {
    updating.value = false
  }
}

// 更新密码
const updatePassword = async () => {
  // 验证密码
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast({
      title: '密码错误',
      description: '两次输入的新密码不一致',
      variant: 'destructive'
    })
    return
  }
  
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    toast({
      title: '密码错误',
      description: '请填写完整的密码信息',
      variant: 'destructive'
    })
    return
  }
  
  try {
    updatingPassword.value = true
    
    // 这里应该调用实际的API
    // 示例代码，根据实际API进行修改
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 清空表单
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    toast({
      title: '更新成功',
      description: '密码已修改'
    })
  } catch (error) {
    toast({
      title: '修改失败',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive'
    })
  } finally {
    updatingPassword.value = false
  }
}

onMounted(() => {
  fetchUserProfile()
})
</script> 