# 图书馆古籍修复排程系统 - 快速启动指南

## 📋 环境要求

- **Docker** >= 20.10.0 (用于运行 PostgreSQL 数据库)
- **Node.js** >= 18.0.0 (推荐 18.x 或 20.x LTS)
- **npm** >= 9.0.0
- **jq** (可选，用于运行 API 测试脚本)

---

## 🚀 快速启动（推荐）

### 方式一：一键启动脚本

```bash
# 1. 给脚本添加执行权限
chmod +x start.sh

# 2. 一键启动所有服务
./start.sh
```

脚本会自动完成以下步骤：
1. ✅ 检查环境依赖
2. ✅ 启动 PostgreSQL 数据库（端口 5432）
3. ✅ 自动执行数据库初始化脚本
4. ✅ 安装所有 npm 依赖
5. ✅ 启动后端服务（端口 3001）
6. ✅ 启动前端服务（端口 5173）

---

### 方式二：分步手动启动

#### 第 1 步：启动数据库

```bash
# 启动 PostgreSQL 容器
docker-compose up -d postgres

# 等待数据库初始化完成（约 10-15 秒）
sleep 10

# 验证数据库是否就绪
docker exec ancient-book-db pg_isready -U librarian -d ancient_books
```

数据库初始化脚本 `database/init.sql` 会自动执行，创建所有表、触发器和初始测试数据。

#### 第 2 步：安装依赖

```bash
# 安装所有依赖（根目录 + 后端 + 前端）
npm run install:all
```

或者分别安装：
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
npm --prefix backend install

# 安装前端依赖
npm --prefix frontend install
```

#### 第 3 步：启动后端服务

```bash
# 后端开发模式（带热重载）
npm run dev:backend

# 或直接进入目录
cd backend && npm run start:dev
```

后端服务启动后：
- API 地址: http://localhost:3001/api
- Swagger 文档: http://localhost:3001/api

#### 第 4 步：启动前端服务

```bash
# 前端开发模式（带热重载）
npm run dev:frontend

# 或直接进入目录
cd frontend && npm run dev
```

前端服务启动后：
- 访问地址: http://localhost:5173

---

### 方式三：同时启动前后端

```bash
# 使用 concurrently 同时启动前后端
npm run dev
```

---

## 🔑 测试账号

系统已预置以下测试账号（初始数据在 `database/init.sql` 中）：

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 系统管理员 | `admin` | `admin123` | 系统管理、用户管理 |
| 馆员 | `librarian1` | `lib123` | 提交修复申请、借阅管理 |
| 修复师 | `restorer1` | `res123` | 执行修复工序 |
| 修复师 | `restorer2` | `res123` | 执行修复工序 |
| 专家 | `expert1` | `exp123` | 珍贵古籍评审 |
| 专家 | `expert2` | `exp123` | 珍贵古籍评审 |

---

## 📚 预置测试数据

### 古籍档案

| 编号 | 书名 | 作者 | 朝代 | 珍贵等级 | 馆藏位置 |
|------|------|------|------|----------|----------|
| BOOK001 | 永乐大典 | 解缙 | 明 | 国宝级 | 特藏室A-01 |
| BOOK002 | 四库全书 | 纪昀 | 清 | 珍贵 | 特藏室A-02 |
| BOOK003 | 本草纲目 | 李时珍 | 明 | 善本 | 古籍室B-03 |
| BOOK004 | 红楼梦 | 曹雪芹 | 清 | 善本 | 古籍室B-05 |
| BOOK005 | 唐诗三百首 | 蘅塘退士 | 清 | 普通 | 阅览区C-01 |
| BOOK006 | 资治通鉴 | 司马光 | 宋 | 珍贵 | 特藏室A-03 |

### 修复材料

| 编号 | 名称 | 批号 | 类型 | 数量 |
|------|------|------|------|------|
| MAT001 | 脱酸剂 | BATCH-2024-001 | chemical | 50L |
| MAT002 | 宣纸 | BATCH-2024-002 | paper | 200张 |
| MAT003 | 糨糊 | BATCH-2024-003 | adhesive | 30kg |
| MAT004 | 棉线 | BATCH-2024-004 | binding | 100轴 |

---

## 🧪 主链路测试

### API 自动化测试

```bash
# 给测试脚本添加执行权限
chmod +x test-main-flow.sh

# 运行完整主链路测试
./test-main-flow.sh
```

测试脚本会自动执行以下流程：
1. 获取测试用户（馆员、修复师、专家）
2. 查询珍贵古籍
3. 馆员创建修复申请
4. 提交申请（自动创建三道工序）
5. 修复师依次开始/完成三道工序（验证材料批号）
6. 检查珍贵古籍是否自动进入专家评审
7. 专家评审通过
8. 上传修复前后照片
9. 验证照片完整性
10. 完成修复流程

### 手动测试步骤

#### 1. 创建修复申请

1. 打开 http://localhost:5173
2. 使用 `librarian1` / `lib123` 登录
3. 进入"古籍管理"，选择一本珍贵古籍（如《四库全书》）
4. 点击"申请修复"，填写申请理由
5. 提交申请

#### 2. 执行修复工序

1. 使用 `restorer1` / `res123` 登录
2. 进入"修复工序"，查看待办工序
3. 点击"开始"脱酸工序
4. 填写材料批号（如 BATCH-2024-001），点击"完成"
5. 依次完成补纸和装帧工序

**注意**：每道工序完成时必须填写材料批号，否则无法提交。

#### 3. 专家评审

1. 使用 `expert1` / `exp123` 登录
2. 进入"专家评审"，查看待评审申请
3. 填写评审意见，选择"通过"并勾选"可开放阅览"

#### 4. 上传照片档案

1. 回到修复申请详情页
2. 进入"照片档案"标签页
3. 上传修复前照片和修复后照片
4. 确认照片类型正确标记

#### 5. 完成修复

1. 所有工序完成、评审通过、照片齐全后
2. 点击"完成修复"
3. 系统自动验证所有业务规则
4. 古籍状态更新为"可借阅"或"限制阅览"

---

## 🔧 业务规则验证

系统通过三重机制（数据库触发器 + 应用层服务 + DTO验证）确保以下业务规则：

### ✅ 珍贵古籍强制评审
- 珍贵等级为 `precious`（珍贵）或 `national_treasure`（国宝级）的古籍
- 必须经过专家评审通过才能完成修复流程
- 数据库触发器和应用层双重验证

### ✅ 材料批号必填
- 每道修复工序完成时必须填写 `material_batch`（材料批号）
- 缺少批号直接抛出异常，无法完成工序
- 数据库层和应用层双重检查

### ✅ 工序顺序执行
- 三道工序（脱酸 → 补纸 → 装帧）必须按顺序执行
- 前一道工序未完成时，无法开始下一道

### ✅ 修复照片档案
- 完成修复流程前必须上传：
  - `before_restoration`（修复前照片）
  - `after_restoration`（修复后照片）
- 照片不完整无法标记修复完成

### ✅ 自动状态流转
- 提交申请 → 自动创建三道工序
- 所有工序完成 → 珍贵古籍自动进入 `review_pending` 状态
- 评审通过 + 照片齐全 → 可完成修复流程

---

## 📡 API 接口说明

### 核心接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/restoration-requests` | 创建修复申请 |
| PUT | `/api/restoration-requests/:id/status` | 更新申请状态 |
| GET | `/api/restoration-steps?requestId=:id` | 查询申请的工序列表 |
| PUT | `/api/restoration-steps/:id/start` | 开始工序 |
| PUT | `/api/restoration-steps/:id/complete` | 完成工序（需材料批号） |
| POST | `/api/expert-reviews` | 提交专家评审 |
| POST | `/api/book-images` | 上传照片记录 |
| GET | `/api/book-images/check/:requestId` | 检查修复照片完整性 |

### 请求示例 - 完成工序

```bash
curl -X PUT http://localhost:3001/api/restoration-steps/{step-id}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "performedById": "{restorer-id}",
    "materialBatch": "BATCH-2024-001",
    "notes": "脱酸处理完成"
  }'
```

---

## 🐛 常见问题

### 1. 数据库启动失败
```bash
# 查看容器日志
docker logs ancient-book-db

# 重启数据库
docker-compose down && docker-compose up -d postgres
```

### 2. 端口被占用
```bash
# 查看端口占用
lsof -i :5432  # PostgreSQL
lsof -i :3001  # 后端
lsof -i :5173  # 前端

# 或修改对应配置文件中的端口号
```

### 3. 依赖安装失败
```bash
# 清理缓存后重新安装
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf package-lock.json backend/package-lock.json frontend/package-lock.json
npm run install:all
```

### 4. 数据库连接失败
确认 `.env` 配置与 `docker-compose.yml` 一致：
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=librarian
DB_PASSWORD=restoration2024
DB_DATABASE=ancient_books
```

### 5. 前端 API 代理不生效
检查 `frontend/vite.config.ts` 中的代理配置：
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',  // 确保与后端端口一致
    changeOrigin: true,
  },
}
```

---

## 📁 项目结构

```
.
├── database/
│   └── init.sql              # 数据库初始化脚本（表结构 + 触发器 + 初始数据）
├── backend/                   # NestJS 后端
│   ├── src/
│   │   ├── controllers/       # API 控制器
│   │   ├── services/          # 业务逻辑服务
│   │   ├── entities/          # TypeORM 实体类
│   │   ├── dto/               # 数据传输对象
│   │   └── main.ts            # 应用入口
│   └── package.json
├── frontend/                  # SvelteKit 前端
│   ├── src/
│   │   ├── routes/            # 页面路由
│   │   ├── lib/               # 工具库、API、枚举
│   │   ├── stores/            # 状态管理
│   │   └── types/             # TypeScript 类型定义
│   └── package.json
├── docker-compose.yml         # PostgreSQL 容器配置
├── start.sh                   # 一键启动脚本
├── test-main-flow.sh          # 主链路 API 测试脚本
└── package.json               # 根目录配置（npm workspaces）
```

---

## 🎯 技术栈

**后端**
- NestJS 10.x + TypeScript
- TypeORM 0.3.x + PostgreSQL 16
- class-validator + class-transformer
- Swagger/OpenAPI 自动文档

**前端**
- SvelteKit 2.x + Vite 5.x
- Skeleton UI + Tailwind CSS
- Axios HTTP 客户端
- Lucide Svelte 图标库

**数据库**
- PostgreSQL 16 Alpine
- PL/pgSQL 触发器实现业务规则
- 自定义 ENUM 类型

---

## 🛑 停止服务

```bash
# 停止所有服务（Ctrl+C 停止前端和后端后）
docker-compose down

# 或使用脚本（如果 start.sh 仍在运行）
# 按 Ctrl+C 即可自动停止所有服务
```

---

## 📞 技术支持

如遇到问题，请检查：
1. 🔍 终端错误日志
2. 📋 数据库容器日志: `docker logs ancient-book-db`
3. 🌐 API 文档: http://localhost:3001/api
4. 📖 Swagger 接口调试工具

---

**祝您使用愉快！** 🎉
