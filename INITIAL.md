- [ ] # 🎯 前端项目初始功能需求 (initial.md)

  ## 功能需求:

  - 构建一个基于 **Vue 3 + shadcn-vue + Tailwind CSS** 的现代化、高度可定制的 Web 管理后台
  - 支持多角色权限控制（super_admin / director / leader / sales / agent）的动态路由系统
  - 实现客资管理、成交录入、推广审核、佣金查看、系统配置等全流程业务功能
  - 提供响应式设计，支持桌面端和平板端的最佳体验
  - 集成高性能数据表格解决方案，支持大数据量的展示、筛选、排序和操作

  ## 核心技术栈:

  - **前端框架**: Vue 3 + Composition API + `<script setup>` 语法
  - **UI 组件**: shadcn-vue (组件源代码所有权，高度可定制)
  - **样式方案**: Tailwind CSS (utility-first CSS 框架)
  - **数据表格**: TanStack Table (Vue) (headless 表格逻辑库)
  - **构建工具**: Vite + TypeScript
  - **状态管理**: Pinia
  - **路由**: Vue Router 4 (支持动态路由)
  - **HTTP 客户端**: Axios (统一封装)
  - **开发规范**: ESLint + Prettier

  ## 技术文档参考:

  - Vue 3 官方文档: https://vuejs.org/guide/
  - shadcn-vue 官方文档: https://www.shadcn-vue.com/
  - Tailwind CSS 文档: https://tailwindcss.com/docs
  - TanStack Table Vue 文档: https://tanstack.com/table/v8/docs/adapters/vue-table
  - Pinia 文档: https://pinia.vuejs.org/

  ## 项目初始化步骤:

  ### 1. 基础项目搭建

  ```bash
  # 使用 Vite 创建 Vue 3 + TypeScript 项目
  npm create vue@latest admin-web -- --typescript --router --pinia --eslint --prettier
  
  # 进入项目目录
  cd admin-web
  
  # 安装 Tailwind CSS
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  
  # 初始化 shadcn-vue
  npx shadcn-vue@latest init
  
  # 安装必要依赖
  npm install axios @tanstack/vue-table class-variance-authority clsx tailwind-merge
  npm install -D @types/node
  ```

  ### 2. 核心组件添加

  ```bash
  # 添加基础 UI 组件 (通过 shadcn-vue CLI)
  npx shadcn-vue@latest add button
  npx shadcn-vue@latest add input
  npx shadcn-vue@latest add card
  npx shadcn-vue@latest add table
  npx shadcn-vue@latest add dialog
  npx shadcn-vue@latest add form
  npx shadcn-vue@latest add toast
  npx shadcn-vue@latest add dropdown-menu
  npx shadcn-vue@latest add select
  npx shadcn-vue@latest add avatar
  npx shadcn-vue@latest add badge
  npx shadcn-vue@latest add separator
  ```

  ## 核心功能模块规划:

  ### 📊 仪表盘模块 (`views/dashboard/`)

  - **数据概览页 (**`DashboardIndex.vue`**)**

  - 关键业务指标卡片（今日成交、本月客资、待审核任务等）
  - 趋势图表（销售额走势、转化率分析）
  - 快捷操作入口

  - **所需接口**: `GET /api/dashboard/stats`

  ### 👥 用户管理模块 (`views/user/`)

  - **用户列表页 (**`UserList.vue`**)**

  - 基于 `DataTable.vue` 业务组件的用户展示
  - 支持按角色、状态筛选
  - 用户新增、编辑、角色分配功能

  - **所需接口**: `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`

  ### 🎯 客资管理模块 (`views/lead/`)

  - **客资列表页 (**`LeadList.vue`**)**

  - 高级筛选（状态、归属销售、提交时间）
  - 客资分配、状态更新操作
  - 批量操作功能

  - **所需接口**: `GET /api/leads/all`, `PUT /api/leads/{id}/assign`, `PUT /api/leads/{id}/status`

  ### 💰 成交管理模块 (`views/deal/`)

  - **成交列表页 (**`DealList.vue`**)**

  - 成交记录展示与查询
  - 数据导出功能

  - **成交录入弹窗 (**`DealCreateModal.vue`**)**

  - 销售角色专用的成交录入表单

  - **所需接口**: `GET /api/deals/all`, `POST /api/deals/create`

  ### 📈 推广管理模块 (`views/promotion/`)

  - **推广审核页 (**`PromotionAudit.vue`**)**

  - 待审核推广任务列表
  - 审核操作（通过/驳回）及奖励设置

  - **所需接口**: `GET /api/promotions/pending`, `PUT /api/promotions/{id}/audit`

  ### ⚙️ 系统配置模块 (`views/settings/`)

  - **等级规则配置 (**`LevelConfig.vue`**)**

  - 代理等级设置表单
  - 佣金比例和晋升条件配置

  - **商品管理 (**`ProductManagement.vue`**)**

  - 商品信息的 CRUD 操作

  - **所需接口**: `GET /api/config/levels`, `PUT /api/config/levels`, `GET /api/products`, `POST /api/products`

  ## 关键业务组件设计:

  ### 🏗️ DataTable.vue (核心业务组件)

  这是整个项目最重要的可复用组件，位于 `src/components/business/DataTable.vue`

  **设计要求:**

  - 内部集成 `TanStack Table` 处理表格逻辑
  - 使用 `shadcn-vue` 的 `Table` 组件作为 UI 层
  - 支持配置化的列定义、筛选器、操作按钮
  - 内置分页、排序、加载状态
  - 支持行选择和批量操作

  **核心 Props:**

  ```typescript
  interface DataTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    loading?: boolean
    pagination?: PaginationConfig
    onRefresh?: () => void
    onRowAction?: (action: string, row: T) => void
  }
  ```

  ### 🎨 PageHeader.vue (共享组件)

  标准化的页面头部组件，位于 `src/components/shared/PageHeader.vue`

  **功能特性:**

  - 面包屑导航
  - 页面标题和描述
  - 右侧操作按钮区域
  - 统一的页面间距和样式

  ## 权限与路由设计:

  ### 🔐 角色权限矩阵

  | 功能模块 | super_admin | director | leader  | sales   | agent |
  | -------- | ----------- | -------- | ------- | ------- | ----- |
  | 仪表盘   | ✅           | ✅        | ✅       | ✅       | ❌     |
  | 用户管理 | ✅           | ✅        | ✅(组内) | ❌       | ❌     |
  | 客资管理 | ✅           | ✅        | ✅(组内) | ✅(个人) | ❌     |
  | 成交录入 | ✅           | ✅        | ✅       | ✅       | ❌     |
  | 推广审核 | ✅           | ✅        | ✅       | ❌       | ❌     |
  | 系统配置 | ✅           | ❌        | ❌       | ❌       | ❌     |

  ### 🛣️ 动态路由实现流程

  1. 用户登录成功后，调用 `GET /api/user/profile` 获取角色信息
  2. 根据角色权限过滤路由表（定义在 `router/routes.ts`）
  3. 使用 `router.addRoute()` 动态注册可访问的路由
  4. 在组件级别通过 `v-if` 控制按钮和操作的显示

  ## 开发环境配置:

  ### 📁 环境变量 (.env.development)

  ```bash
  # API 基础地址
  VITE_API_BASE_URL=http://localhost:8080/api
  
  # 应用标题
  VITE_APP_TITLE=分销系统管理后台
  
  # 是否启用 Mock 数据
  VITE_USE_MOCK=true
  ```

  ### 🎨 Tailwind 主题配置 (tailwind.config.js)

  ```javascript
  module.exports = {
    content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))"
          }
        }
      }
    }
  }
  ```

  ## 📋 开发检查清单

  开发新功能时，请检查：

  - 是否严格遵循了项目的目录结构规范？
  - 新增的 UI 组件是否通过 `shadcn-vue` CLI 添加？
  - 是否优先复用了现有的 `business` 或 `shared` 组件？
  - 样式是否完全使用 Tailwind CSS 工具类实现？
  - API 请求是否使用了统一封装的 `request.ts`？
  - 页面权限控制是否正确配置？
  - TypeScript 类型定义是否完整？
  - 是否遵循了 Git 提交规范？

  ## 🚀 预期交付物

  1. **完整的项目基础架构** - 包含路由、状态管理、API 封装等
  2. **高度可复用的 DataTable 组件** - 支撑所有列表页面的核心组件
  3. **权限控制完整实现** - 基于角色的动态路由和元素级权限
  4. **所有核心业务页面** - 用户、客资、成交、推广、配置管理
  5. **响应式设计** - 适配桌面端和平板端
  6. **完整的开发文档** - 包含组件使用说明和开发规范
