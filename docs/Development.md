**可直接放到项目仓库里的详细开发文档（Markdown 格式）**
内容涵盖：

* 系统简介
* 技术选型
* 项目结构
* 功能说明（用户端 + 管理端）
* API 设计
* 数据库设计（Prisma）
* 开发流程
* 部署方案
* 测试策略
* 错误处理与日志记录
* 性能优化
* 安全措施
* 国际化与本地化
* 代码规范与最佳实践

---

# 开发文档（Development Guide）

# 1. 系统概述

本系统是一个基于 **Next.js 全栈框架** 构建的：

* **用户会员系统**
* **付费订阅系统**
* **订单管理**
* **后台运营管理系统（Admin）**

采用前后端一体化架构，通过 Next.js 的 Server Components 与 API Routes 提供后端能力，并使用 MySQL 作为核心数据库。

---

# 2. 技术选型

## 2.1 前端

* **Next.js 14+/15+（App Router）**
* **React 18**
* **TypeScript**
* TailwindCSS / Ant Design（可任选）
* React Hook Form + Zod（表单校验）
* SWR / React Query（可选：前端数据管理）

## 2.2 后端（同属于 Next.js）

* Next.js API Routes / Server Actions
* next-auth（Auth.js）鉴权体系
* RBAC（基于 User.role）

## 2.3 数据库 & ORM

* **MySQL**
* **Prisma ORM**
* Prisma Migrate（数据库迁移）

## 2.4 支付系统（可选其一或多个）

* Stripe（国际）
* 支付宝当面付/网页支付
* 微信支付（Native/JSAPI）

## 2.5 系统基础设施

* Session：NextAuth
* 日志：console / 接第三方平台
* 部署：

  * Vercel（推荐）
  * Node.js 服务器（PM2 + Nginx）
  * MySQL 云数据库（阿里云/腾讯云/PlanetScale）

---

# 3. 项目结构

推荐的目录结构如下：

```text
project-root
├─ app/
│  ├─ (public)/                     # 用户端页面
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ pricing/page.tsx
│  │  ├─ checkout/page.tsx
│  │  └─ account/
│  │      ├─ layout.tsx
│  │      ├─ subscription/page.tsx
│  │      └─ orders/page.tsx
│  │
│  ├─ admin/                        # 管理端页面
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ users/page.tsx
│  │  ├─ orders/page.tsx
│  │  └─ plans/page.tsx
│  │
│  └─ api/                          # 后端 API
│     ├─ auth/[...nextauth]/route.ts
│     ├─ membership/
│     │   └─ plans/route.ts
│     ├─ order/
│     │   └─ create/route.ts
│     ├─ user/
│     │   ├─ subscription/route.ts
│     │   └─ orders/route.ts
│     ├─ admin/
│     │   ├─ users/route.ts
│     │   ├─ orders/route.ts
│     │   └─ subscriptions/route.ts
│     └─ payment/
│         ├─ callback/route.ts
│         └─ query/route.ts
│
├─ lib/
│  ├─ db.ts                         # Prisma Client
│  ├─ auth.ts                       # 登录与权限工具
│  ├─ config.ts                     # 全局配置
│  ├─ services/                     # 业务层
│  │   ├─ authService.ts
│  │   ├─ orderService.ts
│  │   ├─ membershipService.ts
│  │   ├─ paymentService.ts
│  │   └─ adminService.ts
│  ├─ repositories/                 # 数据访问层
│  └─ utils/                        # 公共工具
│      ├─ idGenerator.ts
│      ├─ logger.ts
│      └─ validators.ts
│
├─ prisma/
│  └─ schema.prisma                 # 数据库模型文件
│
├─ middleware.ts                    # 管理端 RBAC 控制
├─ .env.local
├─ package.json
└─ README.md
```

---

# 4. 功能说明

## 4.1 用户端功能

| 功能                | 描述                                 |
| ----------------- | ---------------------------------- |
| 邮箱注册              | 用户以邮箱 + 密码注册账号，需通过验证邮件激活        |
| 邮箱验证              | 用户点击邮箱中的验证链接，完成邮箱地址真实性校验      |
| 登录                | 通过邮箱 + 密码登录系统，未验证邮箱的用户禁止登录      |
| 忘记密码（邮箱找回）       | 用户输入邮箱，接收重置密码链接，通过邮箱完成密码重置     |
| 套餐展示（Pricing）     | 查询所有可用会员套餐                       |
| 下单购买              | 创建订单 → 调用支付接口                    |
| 支付回调结果处理          | 支付成功后更新订单与订阅                     |
| 我的订阅              | 查看当前套餐、到期时间、是否自动续费             |
| 我的订单              | 查看历史订单列表                         |
| 修改自动续费（可选）        | 用户可取消自动续费                        |

---

## 4.2 管理端功能

| 模块       | 功能                             |
| -------- | -------------------------------- |
| 用户管理     | 查看用户、搜索、查看订阅信息                 |
| 订单管理     | 查看订单、筛选、导出                     |
| 套餐管理     | 增删改查套餐内容                       |
| 人工修改订阅   | 管理员可手动更新用户订阅                   |
| 退款处理     | 通过支付 API 触发退款                  |
| 操作日志     | 记录所有后台修改行为                     |
| 数据统计     | 付费趋势/收入趋势                      |
| 管理员申请审核  | 超级管理员对管理员申请进行审核，通过/拒绝         |
| 管理员管理    | 查看所有管理员及其审批状态，必要时禁用/降级管理员账号 |

---

## 4.3 管理员角色与审批流程

为保证后台操作安全，系统对管理员采用**多角色 + 审批状态**的方式进行控制：

- **角色（UserRole）**
  - `USER`：普通用户，无后台权限。
  - `ADMIN`：已审核通过的管理员，具备日常运营管理能力（用户/订单/套餐等）。
  - `SUPER_ADMIN`：超级管理员，拥有最高权限，可审批管理员、管理系统配置、紧急处理等。
- **管理员审批状态（AdminStatus）**
  - `NONE`：非管理员（默认状态）。
  - `PENDING`：已提交管理员申请，等待超级管理员审核。
  - `APPROVED`：审核通过，可以正常使用后台管理功能。
  - `REJECTED`：审核被拒绝。

典型流程：

1. 普通用户在专门入口（如 `/admin/register` 或个人中心）提交管理员申请，状态从 `NONE` → `PENDING`。
2. 超级管理员在后台查看待审核列表，对申请进行**通过/拒绝**：
   - 通过：用户 `role` 设为 `ADMIN`，`adminStatus` 设为 `APPROVED`。
   - 拒绝：`adminStatus` 设为 `REJECTED`，`role` 可保持 `USER`。
3. 中间件与前端菜单会根据 `role` + `adminStatus` 控制访问：
   - 仅 `SUPER_ADMIN` 与 `ADMIN + APPROVED` 可以访问真正的管理功能页面；
   - `PENDING` 用户登录后台时仅看到“等待审核”提示页；
   - `REJECTED` 用户看到被拒绝提示，可联系超级管理员。

---

# 5. API 设计

## 5.1 用户端 API

### （1）注册（邮箱 + 密码）

**POST `/api/auth/register`**

请求：

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

说明：

- 创建新用户，`email` 唯一，密码在后端进行哈希存储（如 bcrypt）
- 创建成功后生成邮箱验证 token，并发送验证邮件，用户暂时处于“未验证”状态

---

### （2）邮箱验证

**POST `/api/auth/verify-email`**

请求：

```json
{
  "token": "email-verification-token"
}
```

说明：

- 根据 `token` 查找对应记录，校验是否存在、是否过期
- 若校验通过，更新用户 `emailVerified` 字段，并作废该 token

---

### （3）登录（邮箱 + 密码）

**POST `/api/auth/login`**

请求：

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

说明：

- 校验邮箱和密码是否匹配
- 仅当 `emailVerified` 非空（已验证邮箱）时允许登录
- 通过 NextAuth / Session 体系颁发会话

---

### （4）忘记密码（申请重置）

**POST `/api/auth/forgot-password`**

请求：

```json
{
  "email": "user@example.com"
}
```

说明：

- 如果该邮箱对应的用户存在，则生成一次性密码重置 token（短期有效，如 30 分钟）
- 向邮箱发送重置密码链接（如 `/reset-password?token=xxx`）
- 出于安全考虑，即使邮箱不存在，也统一返回“如果该邮箱存在，我们已发送邮件”类提示

---

### （5）重置密码

**POST `/api/auth/reset-password`**

请求：

```json
{
  "token": "password-reset-token",
  "newPassword": "NewPassword123!"
}
```

说明：

- 根据 `token` 查找对应用户并检查是否过期
- 更新用户密码哈希并作废 token

---

### （6）获取套餐列表

**GET `/api/membership/plans`**

响应：

```json
[
  {
    "id": 1,
    "name": "Pro",
    "price": 1999,
    "billingCycle": "MONTHLY",
    "features": { "maxProjects": 10 }
  }
]
```

---

### （7）创建订单

**POST `/api/order/create`**

请求：

```json
{
  "planId": 1
}
```

响应：

```json
{
  "orderNo": "202401010001",
  "paymentUrl": "https://pay.example.com/xx"
}
```

---

### （8）查询我的订阅

**GET `/api/user/subscription`**

---

### （9）申请成为管理员

**POST `/api/admin/register`**

说明：

- 已登录的普通用户通过该接口申请成为管理员
- 创建/更新用户的管理员相关字段：
  - `adminStatus = PENDING`
  - `adminRequestedAt = now()`
- 超级管理员后续可在后台对该申请进行审批

---

## 5.2 支付回调接口

**POST `/api/payment/callback`**

处理第三方平台异步回调，完成：

* 验签
* 更新订单状态
* 更新用户订阅

---

## 5.3 管理端 API（admin 需权限）

### （1）获取用户列表

**GET `/api/admin/users`**

---

### （2）获取订单列表

**GET `/api/admin/orders`**

---

### （3）新增套餐

**POST `/api/membership/plans`**

---

### （4）获取待审核管理员列表

**GET `/api/admin/admin-candidates`**

说明：

- 返回 `adminStatus = PENDING` 的用户列表（仅超级管理员可调用）
- 用于后台“管理员审批”页面展示

---

### （5）审批管理员申请

**POST `/api/admin/admin-approval`**

请求示例：

```json
{
  "userId": 123,
  "action": "approve",
  "reason": "经验符合要求"
}
```

说明：

- 仅 `SUPER_ADMIN` 可以调用
- 当 `action = "approve"`：
  - 将目标用户 `role` 更新为 `ADMIN`
  - 将 `adminStatus` 更新为 `APPROVED`
  - 记录 `adminApprovedAt`、`adminApprovedBy`
- 当 `action = "reject"`：
  - 将 `adminStatus` 更新为 `REJECTED`
  - 记录 `adminRejectedAt`，可选记录拒绝原因（日志表中）

---

# 6. 数据库设计（Prisma 模型）

完整模型示例（可直接使用），已包含邮箱验证与密码重置所需字段与 Token 表：

```prisma
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  passwordHash String
  username     String?
  role         UserRole     @default(USER)

  /// 管理员审批状态（普通用户为 NONE）
  adminStatus      AdminStatus  @default(NONE)
  adminRequestedAt DateTime?    // 提交管理员申请时间
  adminApprovedAt  DateTime?    // 审核通过时间
  adminRejectedAt  DateTime?    // 审核拒绝时间
  adminApprovedBy  Int?         // 审核人（通常是 SUPER_ADMIN 的用户 ID）

  /// 邮箱验证时间（null 表示尚未验证）
  emailVerified DateTime?

  /// 关联的邮箱验证 token 记录
  emailTokens   EmailVerificationToken[]

  /// 关联的密码重置 token 记录
  resetTokens   PasswordResetToken[]

  subscriptions UserSubscription[]
  orders        Order[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum UserRole {
  USER
  ADMIN
}

enum AdminStatus {
  NONE
  PENDING
  APPROVED
  REJECTED
}

model MembershipPlan {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  price       Int
  currency    String
  billingCycle BillingCycle
  features    Json?
  isActive    Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

model UserSubscription {
  id         Int       @id @default(autoincrement())
  user       User      @relation(fields: [userId], references: [id])
  userId     Int
  plan       MembershipPlan @relation(fields: [planId], references: [id])
  planId     Int

  status     SubscriptionStatus
  startAt    DateTime
  endAt      DateTime
  autoRenew  Boolean   @default(false)

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  EXPIRED
}

model Order {
  id             Int       @id @default(autoincrement())
  orderNo        String    @unique
  user           User      @relation(fields: [userId], references: [id])
  userId         Int
  plan           MembershipPlan @relation(fields: [planId], references: [id])
  planId         Int

  amount         Int
  currency       String
  status         OrderStatus
  paymentChannel PaymentChannel
  paymentId      String?

  createdAt      DateTime  @default(now())
  paidAt         DateTime?
  updatedAt      DateTime  @updatedAt
}

enum OrderStatus {
  PENDING
  PAID
  CANCELED
  REFUNDED
}

enum PaymentChannel {
  ALIPAY
  WECHAT
  STRIPE
  PAYPAL
}

/// 邮箱验证 token 表
model EmailVerificationToken {
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  token      String   @unique   // 建议存储哈希值，而非明文 token
  expiresAt  DateTime

  createdAt  DateTime @default(now())
}

/// 密码重置 token 表
model PasswordResetToken {
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  token      String   @unique   // 建议存储哈希值，而非明文 token
  expiresAt  DateTime

  createdAt  DateTime @default(now())
}
```

---

# 7. 开发流程

建议按以下迭代步骤开发：

### 第 1 阶段：环境搭建

* `create-next-app`
* 配置 TypeScript / ESLint
* 接入 MySQL / Prisma
* 创建基础表结构并跑 `prisma migrate`

### 第 2 阶段：用户端基础

* `/pricing` 页面从 API 拉套餐
* `/checkout` 页面模拟下单（先不接支付）

### 第 3 阶段：订单与订阅逻辑

* 创建订单 → 写入数据库
* 模拟支付回调 → 更新订阅表
* `/account/subscription` 页面能显示数据

### 第 4 阶段：接入真实支付（支付宝/微信/Stripe）

* 创建支付二维码 / 链接
* 支付回调落库
* 加签验签
* 自动续费逻辑

### 第 5 阶段：管理端开发

* 管理员登录
* 套餐管理页面
* 用户管理
* 订单管理
* 数据统计（折线图 / 饼图）

---

# 8. 部署方案

## 8.1 Next.js 应用

### 推荐：**Vercel**

* 支持 Server Actions & Edge Functions
* CI/CD 自动化

### 或：Node 部署

使用 PM2：

```bash
npm run build
pm2 start npm --name "next-app" -- start
```

使用 Nginx 做反向代理：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

---

## 8.2 MySQL 部署

可选：

* 阿里云 RDS
* 腾讯云 CynosDB
* PlanetScale（国外，免费限量）
* Docker 自建：

```bash
docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8
```

---

# 9. 安全 & 审计

* 所有修改订阅的后台操作必须记录操作日志
* 所有金额相关参数都必须在后端计算，不能信任前端
* 支付回调必须使用签名验证
* 管理端必须做 RBAC 鉴权
* 用户密码存储必须使用 bcrypt + salt

---

# 10. 测试策略

建议至少覆盖单元测试、集成测试与端到端测试（E2E），确保关键业务（下单、支付回调、订阅更新、管理员操作）可回归。

## 10.1 单元测试

* 使用 Jest + ts-jest 或 Vitest 作为测试框架
* 针对 `lib/services/`、`lib/repositories/` 中的纯函数/业务逻辑进行单元测试
* 对下列核心逻辑重点编写测试：
  * 订单金额计算（不能信任前端传参）
  * 订阅状态流转（`ACTIVE` / `CANCELED` / `EXPIRED`）
  * 支付回调验签逻辑（签名正确/错误/重放攻击场景）

示例目录结构：

```text
__tests__/
  ├─ services/
  │  ├─ orderService.test.ts
  │  ├─ membershipService.test.ts
  │  └─ paymentService.test.ts
  └─ utils/
     └─ validators.test.ts
```

## 10.2 接口/集成测试

* 可使用 Supertest / Node Fetch 直接调用 Next.js API Route，验证：
  * 请求参数校验是否生效（缺失字段、非法值）
  * 鉴权逻辑（未登录/普通用户/管理员）
  * 数据库读写是否符合预期
* 对如下接口建议编写集成测试：
  * `/api/order/create`
  * `/api/payment/callback`
  * `/api/user/subscription`
  * `/api/admin/*`

## 10.3 端到端测试（E2E）

* 可选工具：Playwright / Cypress
* 重点场景：
  * 用户从 `/pricing` 选择套餐 → `/checkout` → 模拟支付成功 → `/account/subscription` 能看到更新后的订阅
  * 管理员登录后台后，能看到最新订单列表与用户订阅信息

## 10.4 测试环境与数据

* 使用独立的测试数据库（例如 `my_app_test`），通过 `.env.test` 指定
* 通过 Prisma 的 `prisma migrate reset` 在测试前重置 schema，并插入基础测试数据
* 建议在 CI 中自动执行全部测试，阻止有问题的 PR 合并

---

# 11. 错误处理与日志记录

## 11.1 错误处理原则

* 前端不直接暴露后端具体错误信息（尤其是数据库/支付/内部实现细节）
* 后端统一使用结构化错误响应：`{ code, message, details? }`
* 所有跨服务调用（支付平台、第三方 API）必须捕获异常，避免未捕获异常导致 500

## 11.2 Next.js 端错误处理

* 页面级错误：
  * 使用 `error.tsx`、`not-found.tsx` 处理通用错误与 404
* API Route 错误：
  * 统一封装响应工具函数，例如：

```ts
// 伪代码，仅为示意
return NextResponse.json(
  { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
  { status: 404 }
);
```

## 11.3 日志记录

* 在 `lib/utils/logger.ts` 中封装统一日志工具，禁止在业务代码中到处散落 `console.log`
* 至少区分以下级别：
  * `info`：正常业务流程日志（如用户下单）
  * `warn`：可疑但未导致失败的情况（如重复回调）
  * `error`：真实错误（如验签失败、数据库连接失败）
* 对关键信息打点：
  * 订单创建/支付成功/退款
  * 管理员在后台对订阅/订单的修改
* 可选接入第三方日志/告警平台（如 Sentry、阿里云日志服务等）

---

# 12. 性能优化

## 12.1 前端性能

* 合理使用 Next.js 的 Server Components，减少前端 JS 体积
* 对营销/展示页开启静态生成（SSG），减轻服务器压力
* 使用 `next/image` 处理图片，自动压缩与懒加载
* 对体积较大的组件使用 `next/dynamic` 按需加载（如图表库）

## 12.2 数据库性能

* 对常用查询字段添加索引：
  * `Order.orderNo`
  * `Order.userId`
  * `UserSubscription.userId`
* 禁止在高频接口中做 N+1 查询，推荐在 Prisma 中使用 `include` 一次性加载所需关联数据
* 对统计类接口（如收入趋势）考虑：
  * 使用物化视图 / 定时任务将结果写入统计表
  * 或限制查询时间范围（如仅支持最近 90 天）

## 12.3 缓存

* 对变更频率较低的数据（如套餐列表）可：
  * 使用 Next.js Route Handler 的缓存能力
  * 或在前端使用 SWR/React Query 做客户端缓存
* 对管理端统计数据可增加简单缓存（如 5 分钟），降低数据库压力

---

# 13. 国际化与本地化

## 13.1 语言策略

* 推荐最少支持：简体中文（`zh-CN`）与英文（`en-US`）
* UI 文案统一从文案文件中读取，避免硬编码在组件内

## 13.2 技术方案

* 推荐使用：
  * `next-intl` 或 `next-i18next` 进行路由级国际化
* 建议目录结构示例：

```text
app/
  ├─ (public)/
  └─ [locale]/
      ├─ layout.tsx
      └─ page.tsx
locales/
  ├─ en/
  │  ├─ common.json
  │  └─ pricing.json
  └─ zh-CN/
     ├─ common.json
     └─ pricing.json
```

## 13.3 时间与金额格式

* 时间与日期使用 `Intl.DateTimeFormat` 或 dayjs/moment，并根据 locale 格式化
* 金额展示统一使用 `Intl.NumberFormat`，确保货币符号与千分位格式正确

---

# 14. 代码规范与最佳实践

## 14.1 代码风格

* 使用 ESLint + Prettier 统一代码风格
* 在 `package.json` 中添加：
  * `lint`、`lint:fix`、`format` 等脚本
* 推荐在 Git Hook（如 Husky + lint-staged）中强制执行 `lint` 与 `format`

## 14.2 架构与设计原则

* 遵循 **SOLID、DRY、SRP** 等原则：
  * 单一职责：一个模块/函数只做一类事情
  * 不重复（DRY）：公共逻辑抽取到 `lib/services/`、`lib/utils/`
  * 通过接口/抽象降低耦合，提升可测试性
* 前端页面以展示与交互为主，将核心业务逻辑下沉到 `lib/services/`，方便复用与测试

## 14.3 目录与命名约定

* 组件命名使用 `PascalCase`，文件名与导出的主组件保持一致
* 服务/仓储类文件使用明确业务含义的命名，如：
  * `orderService.ts`、`paymentService.ts`
  * `orderRepository.ts`、`userRepository.ts`
* API Route 命名与 RESTful 风格保持一致，路径简洁、语义清晰

## 14.4 Git 提交规范

* 推荐使用约定式提交（Conventional Commits），如：
  * `feat: add subscription renewal feature`
  * `fix: correct payment callback signature verification`
  * `chore: update dependencies`

---

# 15. 附录：订单流程时序图（简化）

```
用户 → Next.js: 创建订单请求
Next.js → DB: 写入订单（PENDING）
Next.js → 支付平台: 创建支付
用户 → 支付平台: 扫码/付款
支付平台 → Next.js: 回调通知
Next.js → DB: 更新订单(PAID)、更新订阅
Next.js → 用户端: 显示支付成功
```

---
