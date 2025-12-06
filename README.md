# CloudFlare 图床应用

基于 CloudFlare Workers 和 R2 存储构建的现代化图床应用，整合了 CloudFlare-ImgBed 后端和 runtuimgbed 前端。

## 功能特性

- 🚀 **高性能**：基于 CloudFlare Workers 边缘计算
- 💾 **低成本存储**：使用 CloudFlare R2 对象存储
- 🎨 **现代化界面**：暗夜风格响应式设计
- 🔐 **安全认证**：管理员登录保护
- 📱 **移动友好**：完全响应式设计
- 🔍 **智能搜索**：支持图片名称搜索
- 📋 **批量操作**：支持多文件上传和批量管理

## 项目结构

```
imgbed_cloudflare/
├── src/                    # 后端源代码
│   ├── index.js           # Worker 入口文件
│   ├── middleware/        # 中间件
│   │   └── auth.js        # 认证中间件
│   ├── upload/           # 上传相关
│   │   └── upload.js     # 文件上传处理
│   ├── api/              # API 接口
│   │   ├── admin-login.js # 登录接口
│   │   └── manage/       # 管理接口
│   │       ├── list.js   # 文件列表
│   │       └── delete.js # 文件删除
│   └── file/             # 文件访问
│       └── file.js       # 文件服务
├── index.html            # 前端界面
├── package.json          # 项目依赖
├── wrangler.toml         # CloudFlare 配置
├── .env.example          # 环境变量示例
└── README.md            # 项目文档
```

## 快速开始

### 方式一：GitHub + Cloudflare 自动部署（推荐）

#### 1. 创建 GitHub 仓库
- 在 GitHub 上创建新的仓库
- 将项目代码推送到仓库

#### 2. 配置 GitHub Secrets
在仓库的 Settings > Secrets and variables > Actions 中添加以下 secrets：

- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token（需要 `Account:Workers Scripts:Edit` 权限）
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID

#### 3. 配置环境变量
复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

- `CF_ACCOUNT_ID`: CloudFlare 账户 ID
- `R2_ACCESS_KEY_ID`: R2 访问密钥 ID
- `R2_SECRET_ACCESS_KEY`: R2 访问密钥
- `R2_BUCKET_NAME`: R2 存储桶名称（默认：imgbed-bucket）
- `ADMIN_USERNAME`: 管理员用户名（可选，默认：admin）
- `ADMIN_PASSWORD`: 管理员密码（可选，默认：admin123）

#### 4. 创建 R2 存储桶
在 CloudFlare Dashboard 中创建 R2 存储桶：

1. 登录 CloudFlare Dashboard
2. 进入 R2 存储页面
3. 创建新存储桶，命名为 `imgbed-bucket`
4. 生成 R2 API 令牌

#### 5. 自动部署
每次推送到 `main` 或 `master` 分支时，GitHub Actions 会自动部署到 Cloudflare Workers

### 方式二：手动部署

#### 1. 环境准备
确保您已安装：
- Node.js (版本 16 或更高)
- Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. 安装依赖

```bash
cd imgbed_cloudflare
npm install
```

#### 3. 配置环境变量
复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

- `CF_ACCOUNT_ID`: CloudFlare 账户 ID
- `R2_ACCESS_KEY_ID`: R2 访问密钥 ID
- `R2_SECRET_ACCESS_KEY`: R2 访问密钥
- `R2_BUCKET_NAME`: R2 存储桶名称（默认：imgbed-bucket）
- `ADMIN_USERNAME`: 管理员用户名（可选，默认：admin）
- `ADMIN_PASSWORD`: 管理员密码（可选，默认：admin123）

#### 4. 创建 R2 存储桶
在 CloudFlare Dashboard 中创建 R2 存储桶：

1. 登录 CloudFlare Dashboard
2. 进入 R2 存储页面
3. 创建新存储桶，命名为 `imgbed-bucket`
4. 生成 R2 API 令牌

#### 5. 本地开发

```bash
npm run dev
```

应用将在 http://localhost:8787 启动。

#### 6. 部署到 CloudFlare

```bash
# 登录 Wrangler
wrangler login

# 部署到生产环境
npm run deploy
```

## API 接口

### 认证接口

**POST /api/login**
- 请求体：`{ "username": "admin", "password": "admin123" }`
- 响应：`{ "success": true, "token": "...", "message": "登录成功" }`

### 上传接口

**POST /upload**
- 认证：需要 Bearer Token
- 请求体：multipart/form-data，包含文件字段
- 响应：`[{ "src": "https://...", "alt": "filename.jpg", "size": 1024, "type": "image/jpeg" }]`

### 管理接口

**GET /api/manage/list**
- 参数：`count` (数量), `page` (页码), `search` (搜索关键词)
- 响应：文件列表和分页信息

**DELETE /api/manage/delete**
- 参数：`id` (文件ID)
- 响应：删除结果

### 文件访问

**GET /file/{filename}**
- 直接访问上传的图片文件

## 前端功能

### 登录页面
- 管理员身份验证
- 安全的令牌管理

### 上传页面
- 拖拽上传支持
- 多文件批量上传
- 实时进度显示
- 文件类型和大小验证

### 图片库
- 缩略图预览
- 智能搜索功能
- 文件信息显示
- 一键复制链接
- 图片删除功能

## 技术栈

### 后端
- **CloudFlare Workers**: 边缘计算平台
- **itty-router**: 轻量级路由库
- **AWS SDK S3**: R2 存储操作

### 前端
- **原生 HTML/CSS/JavaScript**: 无框架依赖
- **响应式设计**: 移动端适配
- **现代 API**: 使用 Fetch API 和 Clipboard API

## 配置说明

### 文件大小限制
- 单文件最大：100MB
- 支持格式：JPG, PNG, GIF, WebP

### 缓存策略
- 图片文件：1年缓存
- API 响应：无缓存

### 安全设置
- CORS 支持：允许所有域名
- 认证方式：Bearer Token
- 文件访问：公开可读

## 故障排除

### 常见问题

1. **上传失败**
   - 检查 R2 存储桶权限
   - 验证环境变量配置
   - 检查文件大小和格式限制

2. **认证失败**
   - 确认令牌有效
   - 检查请求头格式

3. **图片无法访问**
   - 验证文件是否存在
   - 检查存储桶配置

### 日志查看

```bash
# 查看 Worker 日志
wrangler tail
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 基础上传和管理功能
- 现代化前端界面
- CloudFlare Workers + R2 集成