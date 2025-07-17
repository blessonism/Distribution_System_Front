- [ ] # 分销系统 Web 管理后台前端开发指南

  ## 1. 项目概览

  **项目名称：** 分销系统 - Web 管理后台 

  **目标用户：** 系统管理员、销售总监、销售组长、销售人员 

  **核心目标：** 为不同角色的运营和管理人员提供一个数据驱动、操作便捷的后台工作台，实现对用户、客资、成交、佣金、推广任务的全流程管理与监控。

  ## 2. 技术选型与架构

  为确保项目的高性能、可维护性和开发效率，我们采用以下技术栈：

  - **核心框架：** [Vue 3](https://vuejs.org/) (使用 `<script setup>` 语法)
  - **UI 组件**: `shadcn-vue`
  - **样式**: **Tailwind CSS**
  - **数据表格**: **TanStack Table (Vue)**(用于处理复杂表格逻辑)
  - **构建工具**: Vite
  - **状态管理**: Pinia
  - **路由**: Vue Router4
  - **HTTP 请求库：** [Axios](https://axios-http.com/)
  - **编程语言：** [TypeScript](https://www.typescriptlang.org/)
  - **代码规范：** ESLint + Prettier

  ### **前端核心架构图**

  *(架构图保持不变，其分层思想是通用的)*

  ```plain
  +--------------------------+
  |      浏览器 (Browser)     |
  +--------------------------+
               |
  +--------------------------+
  |   Vue 3 应用 (main.ts)    |
  +--------------------------+
               |
  +--------------------------+
  | Vue Router (权限路由守卫)  |
  +--------------------------+
               |
  +------------------------------------------------+
  |          布局 (Layouts)                         |
  |  +------------------+  +---------------------+  |
  |  |  侧边栏 (Sidebar)  |  |   头部 (Header)     |  |
  |  +------------------+  |                     |  |
  |                      |   主内容区 (Views)    |  |
  |                      |                     |  |
  |                      +---------------------+  |
  +------------------------------------------------+
               |
  +------------------------------------------------+
  |       视图/页面 (Views) & 组件 (Components)      |
  +------------------------------------------------+
               |               |
  +--------------------------+ +--------------------------+
  |  状态管理 (Pinia)         | |  API 请求层 (Axios)       |
  |  (用户信息、Token、权限)  | |  (请求/响应拦截器)        |
  +--------------------------+ +--------------------------+
                                         |
  +------------------------------------------------+
  |                 后端 API 服务                  |
  +------------------------------------------------+
  ```

  ## 3. 项目目录结构规范 (shadcn-vue 特化版)

  请遵循以下目录结构来组织代码，以保证项目清晰和可维护性。

  ```bash
  admin-web/
  ├── public/                 # 静态资源
  ├── src/
  │   ├── api/                # API 请求模块 (按业务划分)
  │   ├── assets/             # 静态资源 (CSS, 字体等)
  │   │   └── css/
  │   │       └── globals.css # 全局基础样式
  │   ├── components/
  │   │   ├── ui/             # 【shadcn-vue】组件存放目录 (由CLI生成和管理)
  │   │   ├── business/       # 【新增】业务组件，如 DataTable.vue
  │   │   └── shared/         # 【新增】共享的通用组件，如 PageHeader.vue
  │   ├── composables/        # Vue 3 Composition API 逻辑复用
  │   │   └── useDataTable.ts # 例如，封装TanStack Table的逻辑
  │   ├── layouts/            # 页面布局组件
  │   │   └── MainLayout.vue
  │   ├── router/             # 路由配置
  │   ├── store/              # Pinia 状态管理
  │   ├── types/              # TypeScript 类型定义
  │   ├── utils/              # 工具函数
  │   │   ├── request.ts      # Axios 封装
  │   │   └── cn.ts           # 【shadcn-vue】样式合并工具函数
  │   ├── views/              # 页面级组件 (按业务模块划分)
  │   │   ├── dashboard/
  │   │   ├── login/
  │   │   └── user/
  │   │       └── UserList.vue
  │   ├── App.vue             # 根组件
  │   └── main.ts             # 应用入口文件
  ├── .env.development        # 开发环境变量
  ├── .env.production         # 生产环境变量
  ├── components.json         # 【shadcn-vue】配置文件
  ├── tailwind.config.js      # Tailwind CSS 配置文件
  ├── package.json
  └── tsconfig.json
  ```

  ## 4. 核心模块与开发任务拆解

  | 核心模块       | 主要页面/组件                   | 开发核心职责                                                 | 主要依赖 API (后端需提供)                                    |
  | -------------- | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
  | **登录与权限** | `views/login/Login.vue`         | 使用 `shadcn-vue` 的 `Card`, `Input`, `Button` 构建登录表单。 | `POST /api/auth/login`                                       |
  |                | `router/index.ts`               | **动态路由生成**：根据用户角色从后端获取权限，过滤并注册可访问的路由。 | `GET /api/user/profile`                                      |
  | **仪表盘**     | `views/dashboard/Index.vue`     | 使用 `Card` 组件展示KPIs。可集成图表库（如`echarts`）并封装成业务组件。 | `GET /api/dashboard/stats`                                   |
  | **用户管理**   | `views/user/UserList.vue`       | **关键任务**：构建一个可复用的 `DataTable.vue` 业务组件，内部集成 `TanStack Table` 和 `shadcn-vue` 的 `Table` 组件，实现搜索、分页、排序和操作。 | `GET /api/users` `POST /api/users` `PUT /api/users/{id}`     |
  | **客资管理**   | `views/lead/LeadList.vue`       | 复用 `DataTable.vue` 组件，定制列定义和筛选条件，实现客资分配、状态更新等。 | `GET /api/leads/all` `PUT /api/leads/{id}/assign`            |
  | **成交管理**   | `views/deal/DealList.vue`       | 复用 `DataTable.vue` 组件展示成交记录。使用 `Dialog` 组件实现成交录入弹窗。 | `GET /api/deals/all` `POST /api/deals/create`                |
  | **推广审核**   | `views/promotion/AuditList.vue` | 复用 `DataTable.vue` 组件，在操作列中加入“通过”/“驳回”按钮，并调用审核接口。 | `GET /api/promotions/pending` `PUT /api/promotions/{id}/audit` |
  | **系统配置**   | `views/settings/LevelRule.vue`  | 使用 `Table` 和 `Input` 组件，实现可编辑表格或表单，用于配置代理等级规则。 | `GET /api/config/levels` `PUT /api/config/levels`            |

  ## 5. 关键架构设计说明

  ### a. 路由与权限控制 (RBAC)

  *(此部分逻辑保持不变，是后台系统的通用核心)*

  采用**动态路由**方案。流程如下：

  1. **路由定义**：在 `router/` 中定义所有路由，并添加 `meta: { roles: [...] }` 声明权限。
  2. **登录流程**：用户登录成功后，将 `token` 存入 Pinia 和本地存储。
  3. **权限获取**：在路由守卫 `router.beforeEach` 中，调用 `GET /api/user/profile` 获取用户角色。
  4. **路由过滤与动态添加**：根据角色过滤路由表，并使用 `router.addRoute()` 动态添加。

  ### b. API 请求封装 (`utils/request.ts`)

  *(此部分逻辑保持不变)*

  必须封装统一的 Axios 实例。

  - **请求拦截器**：自动附加 `Authorization: Bearer {token}`。
  - **响应拦截器**：

  - **业务成功**：直接返回 `response.data.data`。
  - **业务失败**：使用 `shadcn-vue` 的 `Toast` 组件（需先添加）弹出全局错误提示。
  - **Token 失效 (401)**：清除本地 `token` 和 Pinia 用户信息，强制跳转到登录页。

  ### c. shadcn-vue 与 Tailwind CSS 使用规范

  - **组件添加**：**绝不手动创建** `ui` **目录下的组件**。始终使用 CLI 命令 `npx shadcn-vue@latest add [component]` 添加组件。这能确保所有依赖和配置正确。
  - **组件所有权**：添加到项目中的组件源代码位于 `src/components/ui`，你可以**直接修改它们**以满足项目特定的视觉或功能需求。
  - **样式定制**：主要通过 **Tailwind CSS 的工具类**进行样式定制。全局颜色、字体等变量在 `tailwind.config.js` 和 `src/assets/css/globals.css` 中配置。
  - **业务组件封装**：对于频繁使用的组合，如一个带标题和操作按钮的页面容器，应封装成业务组件存放在 `src/components/business/` 或 `shared/` 目录下。`DataTable.vue` **是最重要的业务组件**。

  ## 6. 开发流程与规范

  *(此部分规范保持不变)*

  1. **Git 分支管理**：遵循 `Git Flow` (`develop` -> `feature/xxx` -> PR)。
  2. **代码风格**：遵循 ESLint 和 Prettier 规范。
  3. **Commit 规范**：遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
  4. **API 对接**：先确认 Swagger 文档，再开发。可使用 Mock 工具并行开发。

  ## 7. 交付清单

  - 一个功能完整的、基于 **Vue 3 + shadcn-vue + Tailwind CSS** 的 Web 管理后台应用。
  - 实现基于角色的动态路由权限控制。
  - 所有核心业务模块的 CRUD 功能，特别是基于 `TanStack Table` 的高性能数据表格。
  - 清晰、可维护、符合上述规范的代码。
  - 完整的项目文档和环境变量配置说明。
