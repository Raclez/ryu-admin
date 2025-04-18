# Features 目录结构规范

本目录包含应用程序的主要功能模块，每个模块按业务功能进行组织。

## 目录结构

```
features/
├── article/              # 文章管理模块
│   ├── index.vue         # 模块入口
│   ├── ArticleList.vue   # 文章列表
│   ├── ArticleEditor.vue # 文章编辑器
│   └── ArticleHistory.vue # 版本历史
├── category/             # 分类管理模块
│   ├── index.vue         # 模块入口
│   └── CategoryList.vue  # 分类列表
├── tag/                  # 标签管理模块
│   ├── index.vue         # 模块入口
│   └── TagList.vue       # 标签列表
...
```

## 命名规范

1. **目录命名**: 使用小写字母，描述该模块的业务功能

- 示例: `article`、`category`、`tag`

2. **文件命名**: 使用PascalCase（大驼峰）

- 示例: `ArticleList.vue`、`ArticleEditor.vue`

3. **组件命名规则**:

- 入口组件: `index.vue`
- 列表页: `[Module]List.vue`
- 详情页: `[Module]Detail.vue`
- 编辑页: `[Module]Editor.vue` 或 `[Module]Form.vue`

## 路由结构

路由路径应与目录结构保持一致:

```
/article/list          -> ArticleList.vue
/article/edit/:id?     -> ArticleEditor.vue
/article/history/:id   -> ArticleHistory.vue
/category/list         -> CategoryList.vue 
/tag/list              -> TagList.vue
```

## 模块结构

每个功能模块应包含以下部分:

1. **index.vue**: 作为模块入口，负责异步加载子组件
2. **列表组件**: 展示数据列表，提供搜索、筛选功能
3. **表单组件**: 用于新增或编辑数据
4. **详情组件**: 展示数据详细信息（可选）

## 代码风格

1. 使用 Vue 3 Composition API
2. 使用 TypeScript 进行类型定义
3. 遵循 Element Plus 设计规范
4. 使用 Pinia 进行状态管理 
