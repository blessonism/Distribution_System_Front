<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">推广审核</h1>
        <p class="text-gray-600">审核推广任务和奖励</p>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <Card>
      <CardContent class="pt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>任务名称</Label>
            <Input placeholder="搜索任务名称" />
          </div>
          <div>
            <Label>推广人</Label>
            <Input placeholder="搜索推广人" />
          </div>
          <div>
            <Label>审核状态</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-end">
            <Button variant="outline" class="w-full">搜索</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 审核列表 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center py-8 text-gray-500">
          <p>推广审核功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
</script>