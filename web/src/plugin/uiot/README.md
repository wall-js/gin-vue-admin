# Uni GVA Plugin

Uni 用户控制台和 CMS 管理插件，扩展自 gin-vue-admin (GVA)。

## 目录结构

```
uni/
├── console/          # 用户控制台
│   ├── api/
│   │   └── console.js    # 用户控制台 API 接口
│   ├── view/
│   │   └── index.vue     # 站点管理页面
│   └── form/
├── cms/              # CMS 管理
│   ├── api/
│   │   └── cms.js        # CMS 管理 API 接口
│   ├── view/
│   │   ├── page.vue      # 页面管理
│   │   └── post.vue      # 文章管理
│   └── form/
└── assets/
    └── icons/
```

## 功能模块

### Console (用户控制台)

- 站点管理：创建、查看、删除站点
- 快速跳转到页面/文章管理

### CMS (内容管理)

- 页面管理：创建、编辑、发布/取消发布页面
- 文章管理：创建、编辑、发布/取消发布文章
- 分类管理
- 标签管理
- 模板管理
- 媒体管理
- 菜单管理

## 集成步骤

### 1. 配置后端 API 路由

确保 go-zero CMS 服务的 API 路由已正确配置，并与前端 API 调用匹配。

### 2. 注册菜单

在 GVA 后台管理系统中添加菜单项，指向插件页面：

```
菜单路径示例：
- /layout/uni/console     -> plugin/uni/console/view/index.vue
- /layout/uni/cms/page    -> plugin/uni/cms/view/page.vue
- /layout/uni/cms/post    -> plugin/uni/cms/view/post.vue
```

### 3. 配置 API 权限

在 GVA 的 API 管理中注册所需的接口，并分配给相应角色。

## API 接口

所有 API 调用通过 `@/utils/request` 发起，默认前缀为 `/api/v1/cms`。

### Console API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /user/getUserProfile | 获取用户资料 |
| PUT | /user/updateUserProfile | 更新用户资料 |
| POST | /user/ChangePassword | 修改密码 |
| GET | /cms/sites | 获取站点列表 |
| POST | /cms/sites | 创建站点 |
| GET | /cms/pages | 获取页面列表 |
| POST | /cms/pages | 创建页面 |
| PUT | /cms/pages | 更新页面 |
| DELETE | /cms/pages | 删除页面 |
| GET | /cms/posts | 获取文章列表 |
| POST | /cms/posts | 创建文章 |
| PUT | /cms/posts | 更新文章 |
| DELETE | /cms/posts | 删除文章 |
| GET | /cms/categories | 获取分类列表 |
| POST | /cms/categories | 创建分类 |
| GET | /cms/media | 获取媒体列表 |
| POST | /cms/media | 上传媒体 |
| DELETE | /cms/media | 删除媒体 |

### CMS API

包含页面、文章、分类、标签、模板、媒体、菜单的完整 CRUD 操作。

## 国际化

支持中文 (zh) 和英文 (en)。翻译文件位于 GVA 的：
- `src/locales/zh.json` - 中文翻译
- `src/locales/en.json` - 英文翻译

所有翻译键以 `plugins.uiot.*` 为前缀。

## 依赖

- Vue 3 (Composition API)
- Element Plus
- vue-i18n
- GVA 核心组件 (RichEdit, etc.)
