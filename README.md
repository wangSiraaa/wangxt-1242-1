# 图书馆古籍修复排程系统

## 项目简介

这是一个完整的图书馆古籍修复排程管理系统，实现了在借阅限制、修复工序和专家评审之间的严格控制机制。系统采用现代化的全栈技术栈，提供了完整的古籍修复流程管理功能。

## 核心业务功能

### 1. 修复申请流程
- 馆员提交古籍修复申请
- 系统自动生成申请编号（RES-YYYYMMDD-0001 格式）
- 自动创建三道修复工序（脱酸、补纸、装帧）

### 2. 修复工序管理
- **脱酸**：使用碱性溶液去除纸张酸性物质
- **补纸**：使用合适的补纸材料修复破损页面
- **装帧**：重新装订书籍，包括线装、包角等工艺
- 材料批号强制验证，缺失无法提交工序完成

### 3. 专家评审机制
- 珍贵等级为「珍贵」和「国宝级」的古籍必须经过专家评审
- 评审决定包括通过、驳回两种结果
- 评审意见决定古籍是否可重新开放阅览

### 4. 借阅限制控制
- 支持多种限制类型：完全限制、仅阅览室内、监督下阅览、仅数字版
- 限制状态实时更新，防止违规借阅
- 支持限制的启用和停用管理

### 5. 照片档案管理
- 修复前后照片强制上传
- 开放阅览前自动检查照片完整性
- 支持多图上传和图片分类管理

### 6. 材料库存管理
- 修复材料入库管理
- 批号追踪和有效期管理
- 库存预警机制
- 材料使用关联到具体工序

## 技术栈

### 后端技术栈
- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL 16
- **ORM**: TypeORM 0.3.x
- **验证**: class-validator + class-transformer
- **API 文档**: Swagger/OpenAPI
- **事务管理**: TypeORM 事务

### 前端技术栈
- **框架**: SvelteKit 2.x
- **UI 组件库**: Skeleton UI 2.x
- **样式**: Tailwind CSS 3.x
- **状态管理**: Svelte Stores
- **HTTP 客户端**: Axios
- **图标**: Lucide Svelte

### 数据库特性
- **枚举类型**: 9 个 PostgreSQL ENUM 类型定义业务状态
- **触发器**: 3 个 PL/pgSQL 触发器实现业务规则约束
- **业务规则**:
  - 珍贵古籍评审强制验证触发器
  - 材料批号验证触发器
  - 照片完整性检查触发器

## 项目结构

```
.
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── controllers/        # 控制器层（8个控制器）
│   │   ├── services/           # 服务层（7个服务）
│   │   ├── entities/           # 实体类（9个实体）
│   │   ├── dto/                # 数据传输对象
│   │   └── main.ts             # 应用入口
│   └── package.json
├── frontend/                   # SvelteKit 前端
│   ├── src/
│   │   ├── routes/             # 页面路由（12个页面）
│   │   ├── lib/                # 工具库
│   │   ├── stores/             # 状态管理
│   │   └── types/              # TypeScript 类型
│   └── package.json
├── database/
│   └── init.sql                # 数据库初始化脚本
├── docker-compose.yml          # Docker 配置
└── package.json                # 根目录配置（npm workspaces）
```

## 数据库设计

### 核心数据表

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `users` | 用户表 | id, username, name, role, email |
| `ancient_books` | 古籍档案表 | id, title, code, rarity_level, status |
| `materials` | 材料库存表 | id, name, batch_number, stock, expiry_date |
| `restoration_requests` | 修复申请表 | id, request_no, book_id, status, priority |
| `restoration_steps` | 修复工序表 | id, request_id, step_type, status, material_batch |
| `book_images` | 图片索引表 | id, book_id, image_type, file_path |
| `expert_reviews` | 专家评审表 | id, request_id, expert_id, decision, comments |
| `borrowing_restrictions` | 借阅限制表 | id, book_id, restriction_type, status |
| `borrowing_records` | 借阅记录表 | id, book_id, user_id, borrow_date, return_date |

### 枚举类型

1. `user_role` - 用户角色：`librarian`, `restorer`, `expert`, `admin`
2. `rarity_level` - 珍贵等级：`general`, `rare`, `precious`, `national_treasure`
3. `request_status` - 申请状态：9 种状态流转
4. `step_type` - 工序类型：`deacidification`, `paper_mending`, `binding`
5. `step_status` - 工序状态：`pending`, `in_progress`, `completed`
6. `image_type` - 图片类型：`cover`, `inside_page`, `before_restoration`, `after_restoration`, `detail`
7. `material_type` - 材料类型：`paper`, `adhesive`, `thread`, `consumable`, `tool`
8. `material_status` - 材料状态：`in_stock`, `low_stock`, `out_of_stock`, `expired`
9. `restriction_type` - 限制类型：`full`, `reading_room_only`, `supervised`, `digital_only`

### 业务规则触发器

1. **珍贵古籍评审触发器** (`trg_precious_book_review`)
   - 触发时机：更新 `restoration_requests` 状态为 `completed` 时
   - 验证逻辑：珍贵等级为 `precious` 或 `national_treasure` 的古籍必须有已通过的专家评审记录
   - 违反操作：抛出异常，阻止状态更新

2. **材料批号验证触发器** (`trg_material_batch_validation`)
   - 触发时机：更新 `restoration_steps` 状态为 `completed` 时
   - 验证逻辑：工序完成时 `material_batch` 字段不能为空
   - 违反操作：抛出异常，阻止工序完成

3. **照片完整性检查触发器** (`trg_image_completeness_check`)
   - 触发时机：更新 `restoration_requests` 状态为 `completed` 时
   - 验证逻辑：检查是否存在 `before_restoration` 和 `after_restoration` 类型的图片
   - 违反操作：发出警告（NOTICE），允许继续但记录警告

## 状态机设计

修复申请状态流转：

```
           ┌─────────────┐
           │   pending   │  待提交
           └──────┬──────┘
                  │  提交申请
           ┌──────▼──────┐
           │  submitted  │  已提交
           └──────┬──────┘
                  │  开始修复
           ┌──────▼──────┐
           │ in_progress │  修复中
           └──────┬──────┘
                  │  三道工序完成
    ┌──────────────▼──────────────┐
    │      steps_completed        │  工序完成
    └──────────────┬──────────────┘
                  │  提交专家评审
           ┌──────▼──────┐
           │review_pending│  待评审
           └──────┬──────┘
           ┌──────┴──────┐
           │             │
    ┌──────▼─────┐  ┌────▼────────┐
    │review_     │  │review_      │
    │approved    │  │rejected     │
    │(评审通过)  │  │(评审驳回)   │
    └──────┬─────┘  └─────────────┘
           │  完成修复
           ▼
    ┌─────────────┐
    │  completed  │  已完成
    └─────────────┘
```

## API 接口

### 古籍档案接口
- `GET /api/ancient-books` - 获取古籍列表（支持筛选、搜索）
- `GET /api/ancient-books/:id` - 获取古籍详情
- `POST /api/ancient-books` - 新增古籍档案
- `PUT /api/ancient-books/:id` - 更新古籍信息
- `DELETE /api/ancient-books/:id` - 删除古籍档案

### 修复申请接口
- `GET /api/restoration-requests` - 获取申请列表（支持筛选）
- `GET /api/restoration-requests/:id` - 获取申请详情（含工序、图片、评审）
- `POST /api/restoration-requests` - 提交修复申请（自动创建工序）
- `POST /api/restoration-requests/:id/submit-review` - 提交专家评审
- `PUT /api/restoration-requests/:id` - 更新申请信息
- `DELETE /api/restoration-requests/:id` - 取消申请

### 修复工序接口
- `GET /api/restoration-steps` - 获取工序列表（支持按申请筛选）
- `GET /api/restoration-steps/:id` - 获取工序详情
- `POST /api/restoration-steps/:id/start` - 开始工序（更新状态为 in_progress）
- `POST /api/restoration-steps/:id/complete` - 完成工序（验证材料批号）
- `PUT /api/restoration-steps/:id` - 更新工序信息（材料、批号、备注）

### 专家评审接口
- `GET /api/expert-reviews` - 获取评审列表（支持按状态筛选）
- `POST /api/expert-reviews` - 提交评审意见（验证珍贵古籍规则）
- `GET /api/expert-reviews/:id` - 获取评审详情

### 图片管理接口
- `GET /api/book-images` - 获取图片列表（支持按古籍或申请筛选）
- `POST /api/book-images/upload` - 上传古籍照片（multipart/form-data）
- `GET /api/book-images/:filename` - 获取图片文件
- `DELETE /api/book-images/:id` - 删除图片

### 材料管理接口
- `GET /api/materials` - 获取材料列表（库存预警标识）
- `GET /api/materials/:id` - 获取材料详情
- `POST /api/materials` - 新增材料入库
- `PUT /api/materials/:id` - 更新材料信息
- `DELETE /api/materials/:id` - 删除材料

### 借阅限制接口
- `GET /api/borrowing-restrictions` - 获取限制列表
- `POST /api/borrowing-restrictions` - 添加借阅限制
- `PUT /api/borrowing-restrictions/:id` - 更新限制信息
- `DELETE /api/borrowing-restrictions/:id` - 移除限制

### 业务规则验证接口
- `GET /api/business-rules/validate-precious-review/:requestId` - 验证珍贵古籍评审
- `GET /api/business-rules/validate-material-batch/:stepId` - 验证材料批号
- `GET /api/business-rules/validate-images/:requestId` - 验证照片完整性

## 前端页面

| 页面路径 | 功能说明 |
|----------|----------|
| `/` | 首页仪表盘 - 统计卡片、流程进度、库存预警、近期申请 |
| `/books` | 古籍档案管理 - 列表、搜索、新增、编辑 |
| `/books/[id]` | 古籍详情 - 基本信息、修复记录、图片档案、借阅历史 |
| `/requests` | 修复申请管理 - 状态统计、申请列表、提交申请 |
| `/requests/[id]` | 申请详情 - 工序管理、照片展示、流程进度、评审记录 |
| `/steps` | 工序管理 - 三道工序登记、开始、完成、材料批号验证 |
| `/reviews` | 专家评审 - 待评审/已评审区分、珍贵古籍标识、评审模态框 |
| `/images` | 图片管理 - 多图上传、照片网格展示、完整性检查表 |
| `/materials` | 材料管理 - 库存预警、批号管理、有效期提醒 |
| `/borrowing` | 借阅限制 - 限制列表、古籍状态卡片、借阅记录 |
| `/settings` | 系统设置 - 用户管理、业务规则配置、通知设置 |

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 16（或使用 Docker）
- Docker（可选，用于快速启动数据库）

### 方式一：使用 Docker 启动数据库

```bash
# 1. 启动 PostgreSQL 服务
docker-compose up -d

# 2. 安装依赖
npm install

# 3. 启动后端（端口 3000）
npm run dev:backend

# 4. 启动前端（端口 5173）
npm run dev:frontend

# 或者同时启动前后端
npm run dev
```

### 方式二：使用本地 PostgreSQL

1. 创建数据库：
```sql
CREATE DATABASE ancient_book_restoration;
CREATE USER admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE ancient_book_restoration TO admin;
```

2. 执行初始化脚本：
```bash
psql -U admin -d ancient_book_restoration -f database/init.sql
```

3. 修改 `backend/.env` 配置：
```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/ancient_book_restoration
```

4. 启动应用：
```bash
npm install
npm run dev
```

### 访问地址

- 前端应用：http://localhost:5173
- 后端 API：http://localhost:3000
- API 文档：http://localhost:3000/api

### 初始测试数据

数据库初始化脚本包含以下测试数据：

#### 用户账号
| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| librarian1 | password123 | 馆员 | 负责提交修复申请 |
| restorer1 | password123 | 修复师 | 负责执行修复工序 |
| expert1 | password123 | 专家 | 负责珍贵古籍评审 |
| admin1 | password123 | 管理员 | 系统管理员 |

#### 古籍样本
| 编号 | 名称 | 珍贵等级 |
|------|------|----------|
| GJ-001 | 《永乐大典》残卷 | national_treasure（国宝级） |
| GJ-002 | 《四库全书》抄本 | precious（珍贵） |
| GJ-003 | 《本草纲目》刻本 | rare（善本） |

#### 材料库存
| 材料名称 | 批号 | 库存 |
|----------|------|------|
| 古籍修复专用纸 | MAT-2024-001 | 100 张 |
| 淀粉粘合剂 | MAT-2024-002 | 50 瓶 |
| 真丝装订线 | MAT-2024-003 | 200 米 |
| 脱酸处理液 | MAT-2024-004 | 30 升 |
| 修复工具套装 | MAT-2024-005 | 10 套 |

## 业务规则验证机制

系统采用三层验证机制确保业务规则严格执行：

### 第一层：数据库触发器（最底层）
- PL/pgSQL 触发器在数据库层面强制约束
- 即使绕过应用层也无法违反规则
- 适用于最核心、最严格的业务规则

### 第二层：应用层服务（业务逻辑层）
- NestJS 服务层在操作前执行验证
- 提供友好的错误信息和业务提示
- 适用于复杂的业务逻辑判断

### 第三层：DTO 验证（接口层）
- class-validator 在请求进入时验证参数
- 提供快速的参数校验反馈
- 适用于基础的数据格式验证

### 验证示例 - 珍贵古籍评审

**场景**：尝试将一本「国宝级」古籍的修复申请标记为完成，但未经过专家评审

1. **接口层**：验证请求参数格式正确
2. **服务层**：`BusinessRulesService.validatePreciousBookReview()` 检查是否有通过的评审记录
3. **数据库层**：触发器 `trg_precious_book_review` 再次验证，确保数据一致性
4. **结果**：抛出 `ForbiddenException`，错误信息：「珍贵古籍必须通过专家评审才能完成修复流程」

## 开发指南

### 后端开发

```bash
# 进入后端目录
cd backend

# 创建新模块
nest g module modules/[module-name]

# 创建新控制器
nest g controller controllers/[controller-name]

# 创建新服务
nest g service services/[service-name]

# 构建生产版本
npm run build

# 运行单元测试
npm run test
```

### 前端开发

```bash
# 进入前端目录
cd frontend

# 创建新页面
# 在 src/routes 下创建对应的目录和 +page.svelte 文件

# 创建新组件
# 在 src/lib/components 下创建 .svelte 组件

# 类型定义
# 在 src/types/index.ts 中添加类型

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 数据库修改

1. 修改 `database/init.sql` 添加新的表或字段
2. 在 `backend/src/entities/` 下创建或更新实体类
3. 在 `backend/src/dto/` 下创建或更新 DTO
4. 重新执行初始化脚本（开发环境）

## 部署说明

### 生产环境构建

```bash
# 安装依赖
npm ci

# 构建后端
cd backend && npm run build && cd ..

# 构建前端
cd frontend && npm run build && cd ..
```

### 环境变量配置

#### 后端环境变量（backend/.env）
```env
# 数据库连接
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# 服务端口
PORT=3000

# JWT 配置（待实现）
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### 前端环境变量（frontend/.env）
```env
# API 地址（生产环境）
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Docker 部署

```bash
# 构建镜像
docker build -t ancient-book-restoration:latest .

# 运行容器
docker run -p 3000:3000 -p 5173:5173 \
  -e DATABASE_URL=postgresql://... \
  ancient-book-restoration:latest
```

## 安全说明

### 已实现的安全措施
1. **SQL 注入防护**：使用 TypeORM 参数化查询，避免拼接 SQL
2. **XSS 防护**：Svelte 自动转义模板内容
3. **业务规则强制**：数据库触发器确保规则不被绕过
4. **文件上传安全**：限制文件类型和大小，避免恶意文件上传

### 待实现的安全功能
1. **用户认证授权**：JWT + 基于角色的访问控制（RBAC）
2. **API 限流**：防止暴力破解和滥用
3. **操作审计日志**：记录关键操作的用户和时间
4. **数据加密**：敏感字段数据库加密存储
5. **CSRF 防护**：跨站请求伪造防护

## 性能优化建议

1. **数据库索引**：
   - `ancient_books(code)` - 古籍编号查询
   - `restoration_requests(book_id, status)` - 按古籍和状态筛选
   - `restoration_steps(request_id, step_type)` - 工序查询
   - `book_images(book_id, image_type)` - 图片查询

2. **缓存策略**：
   - 枚举类型和常量化数据缓存
   - 高频查询结果缓存
   - 图片 CDN 缓存

3. **前端优化**：
   - 路由级代码分割
   - 图片懒加载
   - 列表虚拟滚动（大数据量时）

## 后续开发计划

### 优先级 1（核心功能）
- [ ] 用户认证和权限控制（JWT + RBAC）
- [ ] 登录页面和路由守卫
- [ ] 操作审计日志
- [ ] 完整的单元测试和 E2E 测试

### 优先级 2（增强功能）
- [ ] 消息通知系统（邮件、站内信）
- [ ] 修复流程超时提醒
- [ ] 数据统计和报表导出
- [ ] 移动端响应式优化

### 优先级 3（扩展功能）
- [ ] 古籍数字化管理（OCR、全文检索）
- [ ] 修复师工作量统计
- [ ] 材料采购建议
- [ ] 多语言支持（中英双语）

## 常见问题

### Q: 如何重置数据库？
```bash
docker-compose down -v
docker-compose up -d
psql -U admin -d ancient_book_restoration -f database/init.sql
```

### Q: 前端无法调用后端 API？
检查 `frontend/vite.config.ts` 中的代理配置，确保后端端口正确。

### Q: 材料批号验证不生效？
确保数据库触发器已正确创建，查看 `database/init.sql` 中的触发器定义。

### Q: 如何修改业务规则？
- 数据库层：修改 `database/init.sql` 中的触发器函数
- 应用层：修改 `backend/src/services/business-rules.service.ts`

## 技术支持

如有问题，请查看：
1. 后端日志：控制台输出
2. 前端日志：浏览器开发者工具
3. 数据库日志：`docker logs postgres-db`

## 许可证

MIT License
