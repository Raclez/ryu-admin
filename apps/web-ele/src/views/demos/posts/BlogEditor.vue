<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useRouter ,useRoute} from 'vue-router';
import { useCategoryStore } from '#/store/category'
import {useTagStore} from "#/store/tag";

import {
  Document,
  Download,
  Grid,
  Delete,
  Plus,
  Position,
  Setting,
  Timer,
  View, Close,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
// 导入 md-editor-v3
import { MdEditor, MdPreview } from 'md-editor-v3';

import {getPostsDetail, savePosts} from '#/api/core/posts.js';

import 'md-editor-v3/lib/style.css';
import ResourceSelector from "#/components/ResourceSelector.vue";

// 路由
const router = useRouter();
const route = useRoute();
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
// 编辑器主题
const editorTheme = ref('dark'); // 默认使用暗色主题

// md-editor-v3 工具栏配置
const toolbars = [
  'bold',
  'italic',
  'strikethrough',
  'quote',
  'unorderedList',
  'orderedList',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'revoke',
  'next',
  'save',
  'fullscreen',
  'underline',
  'title',
  'task',
  'mermaid',
  'preview',
];

// 状态变量
const content = ref(`## 脚手架文件结构

\`\`\`lua
├─ node_modules
├─ public
│  ├─ favicon.ico: 页签图标
│  └─ index.html: 主页面
├─ src
│  ├─ assets: 存放静态资源
│  │  └─ logo.png
│  ├─ component: 存放组件
│  │  └─ HelloWorld.vue
│  ├─ App.vue: 汇总所有组件
│  └─ main.js: 入口文件
├─ .gitignore: git版本管制忽略的配置
├─ babel.config.js: babel的配置文件
├─ package.json: 应用包配置文件
├─ README.md: 应用描述文件
└─ package-lock.json: 包版本控制文件
\`\`\`
`);
const isPreviewMode = ref(false);
const settingsDialogVisible = ref(false);
const inputTagVisible = ref(false);
const newTag = ref('');
const tagInput = ref(null);
const catalog = ref([]); // 用于存储目录结构

const resourceDialogVisible = ref(false)

// 博客设置
const blogSettings = ref({
  title: '',
  categoryId: '',
  tagsIds: [],
  excerpt: '',
  visibility: 'public',
  password: '',
  isPublishImmediately: true,
  scheduleTime: null,
  allowComment: true,
  slug: '',
  seoTitle: '',
  seoDescription: '',
  coverImageId: null,
  sort: 0,
  isSticky: false,
  isOriginal: true,
  sourceUrl: '',
  license: 'cc-by-4.0',
});
// 获取标签名称
const getTagName = (tagId) => {
  return tagStore.tags.find(t => t.id === tagId)?.name || tagId
}

const postId = ref(route.params?.id || '')
const fetchPostDetail = async () => {
  if (postId.value) {
    const res = await getPostsDetail(postId.value)
    blogSettings.value = {
      ...res,
      scheduleTime: res.scheduleTime ? dayjs(res.scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null
    }
    content.value = res.content
  }
}


const openResourceSelector = async () => {
  resourceDialogVisible.value = true
}

const handleResourceSelect = (resource) => {
  blogSettings.value.coverImageId = resource.id
  blogSettings.value.coverImageUrl = resource.filePath
  resourceDialogVisible.value = false
}

const removeCover = () => {
  blogSettings.value.coverImageId = null
  blogSettings.value.coverImageUrl = ''
}



// 光标位置
const cursorPosition = reactive({
  line: 1,
  column: 0,
});

// 计算属性：字数统计
const wordCount = computed(() => {
  const text = content.value || '';
  return {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
  };
});

// 方法
const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value;
};

const openSettings = () => {
  settingsDialogVisible.value = true;
};

const saveSettings = () => {
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请输入文章标题');
    return;
  }

  settingsDialogVisible.value = false;
  ElMessage.success('设置已保存');
};

const saveDraft = async () => {
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请先设置文章标题');
    await handleSubmit(false)
    settingsDialogVisible.value = true;
    return;
  }

  ElMessage.success('草稿已保存');
};

const handleSubmit = async (isPublish = true) => {

  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请先设置文章标题');
    settingsDialogVisible.value = true;
    return;
  }
  try {
    const baseData = {
      title: blogSettings.value.title,
      content: content.value,
      excerpt: blogSettings.value.excerpt,
      categoryId: blogSettings.value.categoryId,
      tagIds: blogSettings.value.tagIds,
      scheduleTime: blogSettings.value.scheduleTime,
      allowComment: blogSettings.value.allowComment,
      seoTitle: blogSettings.value.seoTitle,
      seoDescription: blogSettings.value.seoDescription,
      isSticky: blogSettings.value.isSticky,
      isOriginal: blogSettings.value.isOriginal,
      visibility: blogSettings.value.visibility,
      coverImageId: blogSettings.value.coverImageId,
      isPublishImmediately: blogSettings.value.isPublishImmediately,
      sort: blogSettings.value.sort,
      password: blogSettings.value.password,
      slug: blogSettings.value.slug,
    }

    const postData = postId.value
      ? {
        id: postId.value,
        ...baseData,
      }
      : {
        ...baseData,
        // 新建时需要添加的字段

      }

    if (postId.value) {
      await updatePosts(postData)
      ElMessage.success('文章更新成功！')
    } else {
      await savePosts(postData)
      ElMessage.success('文章创建成功！')
    }

    if (isPublish) {
      await router.push('/posts/page')
    }
  } catch (error) {
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

const goToVersionHistory = () => {
  router.push('/posts/postVersion');
  // if (router.value) {
  //   router.push('/posts/postVersion')
  // } else {
  //   ElMessage({
  //     message: '正在跳转到版本历史页面...',
  //     type: 'info'
  //   })
  //   // 实际项目中可以使用 window.location.href = '/version-history'
  // }
};

const showTagInput = () => {
  inputTagVisible.value = true;
  nextTick(() => {
    tagInput.value.focus();
  });
};

const confirmTag = () => {
  const value = newTag.value.trim();
  if (value && !blogSettings.value.tagsIds.includes(value)) {
    blogSettings.value.tagsIds.push(value);
  }
  newTag.value = '';
  inputTagVisible.value = false;
};

const removeTag = (tag) => {
  blogSettings.value.tagsIds = blogSettings.value.tagsIds.filter((t) => t !== tag);
};

const handleSuccessChange = (file) => {
  if (file.code === 200) {
    ElMessage.success('封面图片上传成功');
    blogSettings.value.coverImageId = file.data.id;
    console.log('上传成功', blogSettings.value.coverImageId);
  } else {
    ElMessage.error('封面图片上传失败');
  }
};

// 更新标题
const updateTitleFromEditor = (event) => {
  blogSettings.value.title = event.target.innerText;
};

// 获取目录结构
const onGetCatalog = (data) => {
  catalog.value = data;
};

// 内容变化处理
const onChange = (value) => {
  content.value = value;
  updateCursorPosition();
};

// 更新光标位置 - 通过md-editor-v3的API实现
const updateCursorPosition = () => {
  // 在实际应用中，可以通过md-editor-v3的API获取光标位置
  // 这里简单模拟一下
  cursorPosition.line = content.value.split('\n').length;
  cursorPosition.column = 0;
};

// 生命周期钩子
onMounted(async () => {
  if (postId.value) {
    await fetchPostDetail()
  }
});
</script>

<template>
  <div class="blog-editor-container">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="title-area">
        <span class="editor-icon">
          <el-icon><Document /></el-icon>
        </span>
        <span class="editor-title">文章</span>
      </div>
      <div class="editor-tools">
        <el-tooltip content="使用 md-editor-v3 编辑器" placement="bottom">
          <el-button link>
            <el-icon><Grid /></el-icon>
            <span>Markdown</span>
          </el-button>
        </el-tooltip>
        <el-button link @click="goToVersionHistory">
          <el-icon><Timer /></el-icon>
          <span>版本历史</span>
        </el-button>
        <el-button link @click="togglePreview">
          <el-icon><View /></el-icon>
          <span>预览</span>
        </el-button>
        <el-button link @click="saveDraft">
          <el-icon><Download /></el-icon>
          <span>保存</span>
        </el-button>
        <el-button link @click="openSettings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-button>
        <el-button type="primary"  @click="handleSubmit(true)" class="publish-btn">
          <el-icon><Position /></el-icon>
          <span>{{ postId ? '更新发布' : '发布' }}</span>
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <div v-if="isPreviewMode" class="preview-container">
        <!--        <div class="preview-heading">-->
        <!--          <el-icon><View /></el-icon>-->
        <!--          <span>{{ blogSettings.title }}</span>-->
        <!--        </div>-->
        <div class="divider"></div>
        <div class="preview-content">
          <MdPreview :model-value="content" />
        </div>
      </div>
      <div v-else class="edit-container">
        <!--        <div class="editor-titleline">-->
        <!--          <span class="heading-mark"># </span>-->
        <!--          <span class="title-content" contenteditable @input="updateTitleFromEditor($event)" @blur="updateTitleFromEditor($event)">{{ blogSettings.title || 'vue笔记' }}</span>-->
        <!--        </div>-->
        <div class="editor-content">
          <MdEditor
            v-model="content"
            @on-get-catalog="onGetCatalog"
            @on-change="onChange"
            :theme="editorTheme"
            code-theme="github"
            class="md-editor"
            preview-theme="github"
            show-code-row-number
            auto-detect-code
            :code-mirror-options="{
              // 底层codemirror配置
              lineWrapping: true, // 代码自动换行
              autoCloseBrackets: true, // 自动补全括号
            }"
            :toolbars="toolbars"
          />
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="editor-statusbar">
      <div class="editor-info">
        Markdown {{ wordCount.characters }} 字符 {{ wordCount.words }} 词
        {{ wordCount.lines }} 行
      </div>
      <div class="position-info">
        Ln {{ cursorPosition.line }}, Col {{ cursorPosition.column }}
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="settingsDialogVisible"
      title="文章设置"
      width="650px"
      custom-class="blog-settings-dialog"
      :close-on-click-modal="false"
    >
      <el-tabs>
        <el-tab-pane label="基本设置">
          <el-form
            :model="blogSettings"
            label-width="100px"
            label-position="left"
            size="default"
          >
            <el-form-item label="文章标题" required>
              <el-input
                v-model="blogSettings.title"
                placeholder="请输入文章标题"
              />
            </el-form-item>

            <el-form-item label="分类" required>
              <el-select
                v-model="blogSettings.categoryId"
                placeholder="请选择分类"
                style="width: 100%"
                @click="categoryStore.fetchCategories()"
              >
                <el-option
                  v-for="item in categoryStore.categories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="标签">
              <div class="tag-wrapper">
                <el-tag
                  v-for="tagId in blogSettings.tagsIds"
                  :key="tagId"
                  closable
                  @close="removeTag(tagId)"
                  class="tag-item"
                >
                  {{ getTagName(tagId) }}
                </el-tag>
                <el-input
                  v-if="inputTagVisible"
                  ref="tagInput"
                  v-model="newTag"
                  class="tag-input"
                  size="small"
                  @keyup.enter="confirmTag"
                  @blur="confirmTag"
                />
                <el-button
                  v-else
                  class="button-new-tag"
                  size="small"
                  @click="showTagInput"
                >
                  + 新标签
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="摘要">
              <el-input
                v-model="blogSettings.excerpt"
                type="textarea"
                :rows="3"
                placeholder="请输入文章摘要（可选）"
                :maxlength="300"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="发布设置">
          <el-form
            :model="blogSettings"
            label-width="100px"
            label-position="left"
            size="default"
          >
            <el-form-item label="访问权限">
              <el-radio-group v-model="blogSettings.visibility">
                <el-radio label="public">公开</el-radio>
                <el-radio label="private">私密</el-radio>
                <el-radio label="password">密码访问</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="blogSettings.visibility === 'password'"
              label="访问密码"
            >
              <el-input
                v-model="blogSettings.password"
                placeholder="请设置访问密码"
                show-password
              />
            </el-form-item>

            <el-form-item label="发布时间">
              <el-radio-group v-model="blogSettings.isPublishImmediately">
                <el-radio label="true">立即发布</el-radio>
                <el-radio label="false">定时发布</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="blogSettings.isPublishImmediately === 'false'"
              label="定时时间"
            >
              <el-date-picker
                v-model="blogSettings.scheduleTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="允许评论">
              <el-switch v-model="blogSettings.allowComment" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="SEO设置">
          <el-form
            :model="blogSettings"
            label-width="100px"
            label-position="left"
            size="default"
          >
            <el-form-item label="URL别名">
              <el-input
                v-model="blogSettings.slug"
                placeholder="自定义URL路径（可选）"
              >
                <template #prepend>/blog/</template>
              </el-input>
            </el-form-item>

            <el-form-item label="SEO标题">
              <el-input
                v-model="blogSettings.seoTitle"
                placeholder="SEO标题（可选，默认使用文章标题）"
              />
            </el-form-item>

            <el-form-item label="SEO描述">
              <el-input
                v-model="blogSettings.seoDescription"
                type="textarea"
                :rows="3"
                placeholder="搜索引擎优化描述（可选）"
                :maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-dialog
              v-model="resourceDialogVisible"
              title="选择封面图片"
              width="80%"
            >
              <ResourceSelector
                @select="handleResourceSelect"
                file-type="image"
              />
            </el-dialog>
            <el-form-item label="封面图片">
              <div
                class="cover-container"
                @click="openResourceSelector"
              >
                <div class="cover-wrapper">
                  <img
                    v-if="blogSettings.coverImageUrl"
                    :src="blogSettings.coverImageUrl"
                    class="cover-image"
                  >
                  <div v-else class="empty-cover">
                    <el-icon><Plus /></el-icon>
                    <span>点击选择封面</span>
                  </div>
                  <div
                    v-if="blogSettings.coverImageUrl"
                    class="remove-btn"
                    @click.stop="removeCover"
                  >
                    <el-icon><Close /></el-icon>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="高级选项">
          <el-form
            :model="blogSettings"
            label-width="100px"
            label-position="left"
            size="default"
          >
            <el-form-item label="文章排序">
              <el-input-number
                v-model="blogSettings.sort"
                :min="0"
                :max="999"
                placeholder="数字越小越靠前"
              />
            </el-form-item>

            <el-form-item label="文章置顶">
              <el-switch v-model="blogSettings.isSticky" />
            </el-form-item>

            <el-form-item label="原创声明">
              <el-switch v-model="blogSettings.isOriginal" />
            </el-form-item>

            <el-form-item v-if="!blogSettings.isOriginal" label="转载来源">
              <el-input
                v-model="blogSettings.sourceUrl"
                placeholder="请输入原文链接"
              />
            </el-form-item>

            <el-form-item label="版权协议">
              <el-select
                v-model="blogSettings.license"
                placeholder="请选择版权协议"
                style="width: 100%"
              >
                <el-option label="保留所有权利" value="all-rights-reserved" />
                <el-option label="知识共享署名 4.0" value="cc-by-4.0" />
                <el-option
                  label="知识共享署名-相同方式共享 4.0"
                  value="cc-by-sa-4.0"
                />
                <el-option
                  label="知识共享署名-非商业性使用 4.0"
                  value="cc-by-nc-4.0"
                />
                <el-option label="公共领域" value="public-domain" />
              </el-select>
            </el-form-item>

            <el-form-item label="主题">
              <el-select
                v-model="editorTheme"
                placeholder="选择编辑器主题"
                style="width: 100%"
              >
                <el-option label="默认主题" value="light" />
                <el-option label="暗色主题" value="dark" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.blog-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #2d2d2d; /* 深色背景 */
  color: #e0e0e0; /* 浅色文字 */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #333333; /* 深色背景 */
  border-bottom: 1px solid #444444;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  color: #ffffff;
}

.title-area {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.editor-icon {
  margin-right: 8px;
}

.editor-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.publish-btn {
  border-radius: 4px;
  padding: 6px 16px;
}

.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  background-color: #2d2d2d; /* 深色背景 */
}

.edit-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-titleline {
  padding: 16px 16px 8px;
  display: flex;
  align-items: baseline;
  font-size: 28px;
  font-weight: 700;
  border-bottom: 1px dashed #444444;
  background-color: #333333; /* 深色背景 */
  color: #ffffff;
}

.heading-mark {
  color: #909399;
  margin-right: 4px;
}

.title-content {
  outline: none;
  flex: 1;
}

.editor-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.md-editor {
  height: 100%;
  border: none;
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #2d2d2d; /* 深色背景 */
}

.preview-heading {
  padding: 12px 16px;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #333333; /* 深色背景 */
  color: #ffffff;
}

.divider {
  height: 1px;
  background-color: #444444;
  margin: 0;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: #2d2d2d; /* 深色背景 */
}

.editor-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 4px 16px;
  background-color: #333333; /* 深色背景 */
  border-top: 1px solid #444444;
  font-size: 12px;
  color: #aaaaaa;
}

/* 标签样式 */
.tag-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin-right: 0;
  margin-bottom: 0;
}

.tag-input {
  width: 100px;
  margin-right: 0;
}

.button-new-tag {
  height: 32px;
  padding-top: 0;
  padding-bottom: 0;
}

/* 封面图片提示 */
.cover-tip {
  font-size: 12px;
  color: #aaaaaa;
  margin-top: 8px;
}

/* 对话框样式 */
:deep(.blog-settings-dialog) {
  border-radius: 8px;
  background-color: #333333; /* 深色背景 */
  color: #e0e0e0;
}

:deep(.blog-settings-dialog .el-dialog__header) {
  border-bottom: 1px solid #444444;
  padding: 16px 20px;
  color: #ffffff;
}

:deep(.blog-settings-dialog .el-dialog__body) {
  padding: 20px;
  background-color: #333333; /* 深色背景 */
}

:deep(.blog-settings-dialog .el-dialog__footer) {
  border-top: 1px solid #444444;
  padding: 16px 20px;
  background-color: #333333; /* 深色背景 */
}

/* 自定义md-editor-v3样式 */
:deep(.md-editor-v3) {
  --md-bk-color: #2d2d2d !important;
  --md-border-color: #444444 !important;
}

/* 修改样式部分 */
.cover-container {
  cursor: pointer;
  transition: all 0.3s;
  max-width: 100%;
  margin: 8px 0;

  &:hover {
    opacity: 0.9;
  }
}

.cover-wrapper {
  position: relative;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.empty-cover {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 32px;
  }
}

.remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0;

  .el-icon {
    color: white;
    font-size: 18px;
  }

  &:hover {
    background: rgba(255, 0, 0, 0.8);
    transform: scale(1.1);
  }
}

.cover-wrapper:hover .remove-btn {
  opacity: 1;
}


</style>
