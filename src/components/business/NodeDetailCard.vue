<template>
  <Card v-if="node" class="w-full">
    <CardHeader>
      <CardTitle>人员详情</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center space-x-4">
        <Avatar size="lg">
          <AvatarImage :src="getAvatarUrl(node.role)" />
          <AvatarFallback>{{ node.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <div>
          <p class="text-xl font-bold">{{ node.name }}</p>
          <p class="text-muted-foreground">{{ roleMap[node.role] }}</p>
        </div>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex">
          <p class="w-20 text-muted-foreground">ID:</p>
          <p>{{ node.id }}</p>
        </div>
        <div class="flex">
          <p class="w-20 text-muted-foreground">联系电话:</p>
          <p>{{ node.phone }}</p>
        </div>
        <div v-if="node.parentId" class="flex">
          <p class="w-20 text-muted-foreground">上级ID:</p>
          <p>{{ node.parentId }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
  <Card v-else class="w-full h-64 flex items-center justify-center">
    <p class="text-muted-foreground">请在左侧选择一个节点查看详情</p>
  </Card>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const props = defineProps<{
  node: TreeNodeData | null;
}>();

const roleMap: Record<PersonnelRole, string> = {
  director: '销售总监',
  manager: '销售组长',
  sales: '销售',
  agent: '代理',
};

const getAvatarUrl = (role: PersonnelRole) => {
  //
  return '';
};
</script> 