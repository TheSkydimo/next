## Membership App（Next.js + Prisma）

一个基于 **Next.js App Router** 与 **Prisma** 构建的会员/订阅示例应用，内置：

- **邮箱注册 + 激活**
- **账号登录（JWT + HttpOnly Cookie）**
- **忘记密码 / 重置密码（验证码）**
- **会员套餐 / 订阅 / 订单基础模型**

本仓库适合作为 **SaaS 会员系统起步模板** 或你自己项目的后端/业务层参考实现。

---

## 技术栈

- **框架**：Next.js `^15.x`（App Router，`app/` 目录）
- **语言**：TypeScript
- **前端**：React（支持服务端组件，页面目前为最小骨架，可按需扩展）
- **ORM**：Prisma（使用 `@prisma/adapter-better-sqlite3` 连接 SQLite）
- **数据库**：SQLite（默认文件 `dev.db`，可通过 `DATABASE_URL` 替换）
- **认证**：自定义 JWT（`jsonwebtoken`）+ HttpOnly Cookie
- **安全**：`bcryptjs` 做密码哈希；邮箱验证码 + 过期时间校验
- **校验**：Zod（参数校验、错误结构化）
- **邮件**：Nodemailer（支持真实 SMTP，也支持开发环境控制台输出）
- **日志**：简单结构化日志封装（`lib/utils/logger.ts`）

---

## 快速开始

### 1. 环境要求

- **Node.js**：建议 `>= 18`
- **包管理工具**：`npm`（默认，亦可改用 pnpm/yarn）
- **操作系统**：本说明以 **Windows PowerShell** 为例（与你当前环境一致）。

### 2. 安装依赖

在项目根目录执行（PowerShell）：

```powershell
npm install
```

### 3. 初始化数据库

项目默认使用 SQLite 数据库，文件为仓库根目录下的 `dev.db`。Prisma 已配置好 `@prisma/adapter-better-sqlite3`：

- Prisma schema：`prisma/schema.prisma`
- 生成的 Client 输出目录：`app/generated/prisma`

如果你已经有迁移（本仓库中已包含 `prisma/migrations`），可以执行：

```powershell
npx prisma migrate deploy
```

如需从头生成迁移（自行修改模型后）：

```powershell
npx prisma migrate dev --name init
```

> 默认连接字符串：`DATABASE_URL` 未配置时为 `file:./dev.db`（见 `lib/db.ts`）。

### 4. 配置环境变量

在项目根目录创建 `.env` 文件（或 `.env.local`），常用变量如下：

```env
# 数据库（可选，不配则使用 dev.db）
DATABASE_URL="file:./dev.db"

# JWT 签名密钥（必须配置，否则登录 / 激活相关逻辑会报错）
AUTH_SECRET="请替换为一个足够随机的长字符串"

# 发信地址（可选）
EMAIL_FROM="Membership App <noreply@skydimo.com>"

# SMTP 邮件配置（开发阶段可先不配，控制台会模拟输出邮件内容）
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"
SMTP_SECURE="false" # 为 "true" 且端口 465 时使用 SSL
```

说明：

- `AUTH_SECRET`：用于 `lib/utils/jwt.ts` 中签发/验证 JWT，是整个认证体系的核心密钥。
- `SMTP_*`：用于 `lib/services/emailService.ts` 发送邮件；未配置时，在非生产环境会回退为 **控制台输出模式**，方便本地调试。

### 5. 启动开发服务器

```powershell
npm run dev
```

默认访问地址：`http://localhost:3000`

初始页面 `app/page.tsx` 会显示：

> Membership App 初始化成功（请按开发文档继续开发）

---

## 核心功能概览

### 用户认证与账号安全

- **注册**：`POST /api/auth/register`
  - 使用 Zod 校验请求体（`registerInputSchema`）。
  - 创建用户记录（`authService.registerUser`）。
  - 生成邮箱验证码（10 分钟有效），写入 `User.verificationCode / verificationExpiresAt`。
  - 通过 `emailService.sendVerificationEmail` 发送验证码（开发环境下输出到控制台）。

- **邮箱激活**：`POST /api/auth/verify-email`
  - 校验邮箱和验证码是否存在、是否过期、是否已激活。
  - 激活成功后：
    - 设置 `isEmailVerified = true`、`emailVerifiedAt`。
    - 清空 `verificationCode` 与 `verificationExpiresAt`。
    - 自动签发 JWT 并写入 `auth_token` HttpOnly Cookie。

- **登录**：`POST /api/auth/login`
  - 使用 Zod 校验请求体。
  - 使用 `authService.authenticateUser` 进行密码校验（`bcryptjs`）。
  - 成功后签发 JWT（`signAuthToken`），同样写入 `auth_token` Cookie。
  - 在开发环境内置一个开发用管理员账号（`admin@example.com`，见 `authService.ensureDevAdminUser`）。

- **忘记密码（申请重置）**：`POST /api/auth/forgot-password`
  - 根据邮箱查找用户，生成验证码和过期时间，写回用户记录。
  - 使用 `sendVerificationEmail` 发送验证码（或控制台输出）。
  - 为防止枚举用户，即使邮箱不存在也返回统一成功提示。

- **重置密码**：`POST /api/auth/reset-password`
  - 使用 Zod 校验请求体（邮箱 + 激活码 + 新密码）。
  - 使用 `authService.resetPasswordWithCode`：
    - 校验验证码存在、未过期、码值匹配。
    - 更新密码哈希，并清空验证码字段。
  - 成功后重新签发 JWT，自动登录。

### 管理员相关（示例逻辑）

- `authService` 中提供针对管理员的专用重置流程：
  - `issueAdminPasswordResetCode`
  - `resetAdminPasswordWithCode`
- 仅当用户 `role = ADMIN` 时可使用这些接口，便于你在 **管理端** 实现单独的找回/重置逻辑。

### 会员 / 订阅 / 订单模型

Prisma 模型位于 `prisma/schema.prisma`：

- `User`：用户基础信息、角色、邮箱验证状态及验证码字段。
- `MembershipPlan`：会员套餐（名称、描述、价格、计费周期、是否可用等）。
- `UserSubscription`：用户订阅记录（开始/结束时间、状态、是否自动续费等）。
- `Order`：订单记录（金额、币种、支付渠道、支付单号、状态等）。

> 当前项目已经有会员领域的核心数据结构，实际的套餐展示、订阅页面和支付回调逻辑可以按需自行扩展在 `app/` 与 `app/api/` 下。

---

## 目录结构

关键目录说明：

```text
app/
  layout.tsx                # 根布局（设置 html 语言等）
  page.tsx                  # 首页：初始化成功提示
  api/
    auth/
      register/route.ts     # 注册接口
      login/route.ts        # 登录接口
      forgot-password/route.ts
      reset-password/route.ts
      verify-email/route.ts

lib/
  config.ts                 # 全局配置（如 appName）
  db.ts                     # Prisma Client + SQLite 适配器封装
  services/
    authService.ts          # 认证与账号相关业务逻辑
    emailService.ts         # 邮件发送封装（Nodemailer 单例）
    membershipService.ts    # 会员/套餐相关服务（预留）
    orderService.ts         # 订单相关服务（预留）
    subscriptionService.ts  # 订阅相关服务（预留）
  utils/
    authValidators.ts       # 使用 Zod 定义的认证输入校验
    codeGenerator.ts        # 验证码生成工具
    captcha.ts              # 图形验证码等扩展点
    idGenerator.ts          # ID/订单号生成工具
    jwt.ts                  # JWT 签发与验证
    logger.ts               # 统一日志封装

prisma/
  schema.prisma             # Prisma 数据模型
  migrations/               # 数据库迁移记录

docs/
  Development.md            # 更全面的开发文档与设计说明（推荐阅读）
```

该结构遵循：

- **高内聚、低耦合**：
  - 数据访问集中在 `lib/db.ts` + Prisma Client。
  - 业务逻辑集中在 `lib/services/*`。
  - 工具函数统一放在 `lib/utils/*`。
- **UI 与核心逻辑分离**：
  - `app/` 负责页面与 API 路由。
  - 所有可复用逻辑下沉到 `lib/services` 与 `lib/utils`，便于测试与复用。

---

## 架构与设计原则

- **SOLID / SRP / DRY**：
  - 每个 Service 专注一类业务（认证、邮件、订单、订阅等）。
  - 公共逻辑统一抽取（例如 JWT、日志、验证码生成）。
  - 避免在 API Route 中写复杂业务逻辑，而是调用 Service。
- **分层设计**：
  - **API 层**：`app/api/**/route.ts` → 只负责解析请求、调用服务、返回统一响应。
  - **业务层**：`lib/services/**` → 纯业务逻辑，可单元测试。
  - **基础设施层**：`lib/db.ts`、`lib/utils/**` → ORM、工具、日志等。
- **错误处理**：
  - 错误尽量使用 **错误码 + 文案** 的结构化形式返回，例如：
    - `code: "INVALID_CREDENTIALS"`
    - `code: "VERIFICATION_EXPIRED"`
  - 统一在 API 层捕获异常并映射为 HTTP 状态码。

更完整的设计、API 规划、测试策略等，请参考 `docs/Development.md`。

---

## 常见开发任务

### 添加新的业务接口

1. 在 `lib/services/` 中创建或扩展对应的 Service，编写纯业务逻辑。
2. 在 `lib/utils/` 中编写 Zod 校验 Schema（如有必要）。
3. 在 `app/api/.../route.ts` 中：
   - 解析并校验请求体。
   - 调用 Service。
   - 返回统一格式的 JSON 响应。

### 扩展前端页面

1. 在 `app/` 下对应目录创建 `page.tsx` 等文件。
2. 使用 Next.js App Router 能力（布局、服务端组件等）组织页面。
3. 通过 `fetch`/`axios`/`react-query` 等方式调用后端 API。

---

## 部署建议

本项目初始主要面向 **本地开发与原型验证**：

- 若要部署生产环境，推荐：
  - 将数据库迁移到 **云数据库或本地生产 SQLite 文件**，并配置 `DATABASE_URL`。
  - 使用持久的 `AUTH_SECRET` 并妥善保管。
  - 为 `SMTP_*` 配置真实的邮件服务。
  - 部署方式可参考：
    - Vercel
    - 自建 Node.js（`npm run build` + `npm start` 或使用 PM2）

---

## 贡献与定制

- 你可以在此基础上：
  - 增加管理后台页面（例如在 `app/admin` 下）。
  - 接入各类支付渠道（支付宝、微信、Stripe 等），并在 `Order`、`UserSubscription` 上补充支付回调逻辑。
  - 扩展更多角色/权限控制。
- 欢迎根据你的实际业务需求自由裁剪，保持：
  - **核心逻辑可测试、可复用**
  - **UI 与业务解耦**
  - **配置通过环境变量注入**

---

## License

可根据你的实际项目选择合适的开源协议（如 MIT），并在此处声明。


