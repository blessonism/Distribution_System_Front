<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">成交管理</h1>
        <p class="text-gray-600">管理成交记录信息</p>
      </div>
      <Button>新增成交</Button>
    </div>

    <!-- 搜索和筛选 -->
    <Card>
      <CardContent class="pt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>客户姓名</Label>
            <Input placeholder="搜索客户姓名" />
          </div>
          <div>
            <Label>成交状态</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>成交时间</Label>
            <Input type="date" />
          </div>
          <div class="flex items-end">
            <Button variant="outline" class="w-full">搜索</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 成交列表 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center py-8 text-gray-500">
          <p>成交列表功能开发中...</p>
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