export type PersonnelRole = 'director' | 'manager' | 'sales' | 'agent';

export interface TreeNodeData {
  id: string;
  name: string;
  role: PersonnelRole;
  phone: string;
  parentId: string | null;
  children?: TreeNodeData[];
  hasChildren: boolean;
  isLoading?: boolean;
} 