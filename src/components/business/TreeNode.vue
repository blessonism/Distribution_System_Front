<template>
  <div class="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
    <div @click="toggle" class="w-6 text-center">
      <ChevronRight
        v-if="node.hasChildren"
        :class="['h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90']"
      />
    </div>

    <div @click="selectNode" class="flex-1 flex items-center space-x-2">
      <Avatar size="sm">
        <AvatarImage :src="getAvatarUrl(node.role)" />
        <AvatarFallback>{{ node.name.charAt(0) }}</AvatarFallback>
      </Avatar>
      <div>
        <p class="font-medium text-sm">{{ node.name }}</p>
        <p class="text-xs text-muted-foreground">{{ roleMap[node.role] }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import type { TreeNodeData, PersonnelRole } from '@/types/personnel';
import { ChevronRight } from 'lucide-vue-next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const props = defineProps<{
  node: TreeNodeData;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', node: TreeNodeData): void;
  (e: 'select', node: TreeNodeData): void;
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

const toggle = () => {
  if (props.node.hasChildren) {
    emit('toggle', props.node);
  }
};

const selectNode = () => {
  emit('select', props.node);
};
</script> 