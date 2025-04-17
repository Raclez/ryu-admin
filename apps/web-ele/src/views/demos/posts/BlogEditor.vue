<script setup lang="ts">
import type {Themes, ToolbarNames} from 'md-editor-v3';
// 导入 markdown 编辑器及其类型
import {MdEditor, MdPreview} from 'md-editor-v3';

/**
 * 博客编辑组件
 *
 * 功能：
 * 1. Markdown编辑器集成
 * 2. 博客信息设置（标题、分类、标签等）
 * 3. 版权协议设置
 * 4. 发布时间控制
 * 5. 预览功能
 */
import {computed, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

// 导入ElementPlus图标
import {
  Close,
  Document,
  Download,
  Grid,
  Plus,
  Position,
  Setting,
  Timer,
  View,
} from '@element-plus/icons-vue';
// 导入时间处理库和防抖函数
import dayjs from 'dayjs';
import {ElMessage} from 'element-plus';
import {debounce} from 'lodash-es';

// 导入 API 服务
import {getPostsDetail, savePosts, updatePosts} from '#/api/core/posts.js';
// 导入资源选择器组件
import ResourceSelector from '#/components/ResourceSelector.vue';
import {useCategoryStore} from '#/store/category';
import {useTagStore} from '#/store/tag';

import 'md-editor-v3/lib/style.css';

// ====================== 基础配置与状态管理 ======================

// 路由和状态管理
const router = useRouter();
const route = useRoute();
const categoryStore = useCategoryStore();
const tagStore = useTagStore();

// 编辑器主题配置
const editorTheme = ref<Themes>('dark'); // 默认使用暗色主题

// 工具栏配置项
const toolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
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
  'preview',
];

// 初始化默认内容
const defaultContent = ``;

// ====================== 编辑器状态变量 ======================

const content = ref(defaultContent); // 编辑器内容
const isPreviewMode = ref(false); // 预览模式标识
const settingsDialogVisible = ref(false); // 设置对话框显示状态
const catalog = ref([]); // 目录结构
const resourceDialogVisible = ref(false); // 资源选择对话框显示状态
const TagsHasLoaded = ref(false); // 标签加载状态

// ====================== 分类与标签处理 ======================

/**
 * 分类加载处理
 * @param visible 下拉框可见状态
 */
const handleCategorySelectVisible = async (visible: boolean) => {
  if (visible) {
    try {
      await categoryStore.fetchAllCategories();
    } catch {
      ElMessage.error('分类加载失败');
    }
  }
};

/**
 * 标签选择处理
 * @param visible 下拉框可见状态
 */
const handleTagSelectVisible = async (visible: boolean) => {
  if (visible) {
    try {
      await tagStore.fetchAllTags();
    } catch {
      ElMessage.error('标签加载失败');
    }
  }
};

/**
 * 获取标签名称
 * @param tagId 标签ID
 * @returns 标签名称或ID
 */
const getTagName = (tagId: number | string) => {
  return tagStore.tags.find((t) => t.id === tagId)?.name || tagId;
};

// ====================== 博客设置数据 ======================

/**
 * 博客设置数据对象
 * 集中管理博客所有可配置信息
 */
const blogSettings = ref({
  // 基本信息
  title: '', // 标题
  categoryId: '', // 分类ID
  tagsIds: [] as (number | string)[], // 标签ID数组
  excerpt: '', // 摘要

  // 访问控制
  visibility: 'public', // 访问权限：public/private/password
  password: '', // 访问密码(当visibility为password时使用)

  // 发布控制
  isPublishImmediately: true, // 是否立即发布
  scheduleTime: null, // 计划发布时间

  // SEO相关
  slug: '', // URL别名
  seoTitle: '', // SEO标题
  seoDescription: '', // SEO描述
  coverImageId: null, // 封面图片ID
  coverImageUrl: '', // 封面图片URL

  // 高级选项
  sort: 0, // 排序值
  isSticky: false, // 是否置顶
  isOriginal: true, // 是否原创
  sourceUrl: '', // 转载来源
  license: 'cc-by-4.0', // 版权协议
  allowComment: true, // 允许评论
});

// ====================== 文章数据处理 ======================

// 文章ID
const postId = ref<string>((route.params?.id as string) || '');

/**
 * 获取博客详情
 * 包含分类和标签的回显处理
 */
const fetchPostDetail = async () => {
  if (postId.value) {
    try {
      const res = await getPostsDetail(postId.value);

      // 预加载分类和标签数据以确保表单可用
      await Promise.all([
        categoryStore.fetchAllCategories(),
        tagStore.fetchAllTags(),
      ]);

      // 设置博客数据，处理数据兼容性
      blogSettings.value = {
        ...res,
        tagsIds: res.tagIds || [], // 确保标签IDs存在
        categoryId: res.categoryId || '', // 确保分类ID存在
        coverImageUrl: res.coverImageUrl || '', // 确保封面URL存在
        license: res.license || 'cc-by-4.0', // 确保版权协议存在
        isPublishImmediately: !res.scheduleTime, // 根据是否有计划时间判断发布类型
        // 格式化计划发布时间为易读格式
        scheduleTime: res.scheduleTime
          ? dayjs(res.scheduleTime).format('YYYY-MM-DD HH:mm:ss')
          : null,
      };

      // 设置编辑器内容
      content.value = res.content || '';
      TagsHasLoaded.value = true;
    } catch (error: any) {
      ElMessage.error(`加载文章失败: ${error.message}`);
    }
  }

  if (!postId.value) {
    content.value = defaultContent;
  }
};

// ====================== 资源管理功能 ======================

/**
 * 打开资源选择器
 */
const openResourceSelector = async () => {
  resourceDialogVisible.value = true;
};

/**
 * 处理资源选择
 * @param resource 选中的资源对象
 */
const handleResourceSelect = (resource: any) => {
  blogSettings.value.coverImageId = resource.id;
  blogSettings.value.coverImageUrl = resource.filePath;
  resourceDialogVisible.value = false;
};

/**
 * 移除封面图片
 */
const removeCover = () => {
  blogSettings.value.coverImageId = null;
  blogSettings.value.coverImageUrl = '';
};

/**
 * 处理封面图片上传成功
 */
const handleSuccessChange = (file: any) => {
  if (file.code === 200) {
    ElMessage.success('封面图片上传成功');
    blogSettings.value.coverImageId = file.data.id;
  } else {
    ElMessage.error('封面图片上传失败');
  }
};

// ====================== 编辑器状态管理 ======================

/**
 * 光标位置信息
 */
const cursorPosition = reactive({
  line: 1,
  column: 0,
});

/**
 * 计算属性：文本统计信息
 * 提供字符数、单词数、行数等统计
 */
const wordCount = computed(() => {
  const text = content.value || '';
  return {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
  };
});

/**
 * 获取目录结构
 * @param data 编辑器生成的目录数据
 */
const onGetCatalog = (data: any) => {
  catalog.value = data;
};

/**
 * 编辑器配置对象
 * 设置延迟渲染等性能优化参数
 */
const editorConfig = {
  lazy: true, // 启用延迟渲染提高性能
  lazyTime: 500, // 延迟渲染时间(毫秒)
  noMermaid: false, // 是否禁用mermaid渲染
  sanitize: false, // 是否开启XSS过滤
  style: {
    height: '100%',
    boxShadow: 'none',
  },
};

/**
 * 防抖处理内容变化事件
 * 避免频繁更新和重绘
 */
const onChangeMd = debounce((value: string) => {
  content.value = value;
  updateCursorPosition();
}, 300);

/**
 * 更新编辑器光标位置
 */
const updateCursorPosition = () => {
  // 简单实现，实际项目中可通过编辑器API获取
  cursorPosition.line = content.value.split('\n').length;
  cursorPosition.column = 0;
};

// ====================== 用户交互功能 ======================

/**
 * 切换预览模式
 */
const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value;
};

/**
 * 打开设置对话框
 */
const openSettings = () => {
  settingsDialogVisible.value = true;
};

/**
 * 保存设置
 * 验证必要字段并关闭设置对话框
 */
const saveSettings = () => {
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请输入文章标题');
    return;
  }

  settingsDialogVisible.value = false;
  ElMessage.success('设置已保存');
};

/**
 * 保存草稿
 * 将文章保存但不发布
 */
const saveDraft = async () => {
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请先设置文章标题');
    await handleSubmit(false);
    settingsDialogVisible.value = true;
    return;
  }

  ElMessage.success('草稿已保存');
};

/**
 * 直接在编辑器中更新标题
 */
const updateTitleFromEditor = (event: any) => {
  blogSettings.value.title = event.target.innerText;
};

/**
 * 跳转到版本历史页面
 */
const goToVersionHistory = () => {
  if (!postId.value) {
    ElMessage.warning('请先保存文章，然后才能查看版本历史');
    return;
  }

  router.push(`/posts/historyVersion/${postId.value}`);
};

// ====================== 数据提交与保存 ======================

/**
 * 提交文章数据（保存或发布）
 * @param isPublish 是否在保存后返回列表
 */
const handleSubmit = async (isPublish = true) => {
  // 标题验证
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请先设置文章标题');
    settingsDialogVisible.value = true;
    return;
  }

  try {
    // 构建提交数据
    const baseData = {
      title: blogSettings.value.title,
      content: content.value,
      excerpt: blogSettings.value.excerpt,
      categoryId: blogSettings.value.categoryId,
      tagIds: blogSettings.value.tagsIds,
      // 处理发布时间逻辑：立即发布时清空计划时间
      scheduleTime: blogSettings.value.isPublishImmediately
        ? null
        : blogSettings.value.scheduleTime,
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
      license: blogSettings.value.license,
      sourceUrl: blogSettings.value.sourceUrl,
    };

    // 区分新建和更新操作
    const postData = postId.value
      ? {
        id: postId.value,
        ...baseData,
      }
      : {
        ...baseData,
      };

    // 提交到服务器
    if (postId.value) {
      await updatePosts(postData);
      ElMessage.success('文章更新成功！');
    } else {
      await savePosts(postData);
      ElMessage.success('文章创建成功！');
    }

    // 发布后跳转到列表页
    if (isPublish) {
      await router.push('/posts/page');
    }
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message}`);
  }
};

// ====================== 生命周期钩子 ======================

/**
 * 组件挂载时执行
 * 根据编辑/新建模式加载不同数据
 */
onMounted(async () => {
  try {
    // 初始化数据
    if (postId.value) {
      // 编辑模式：加载详情
      await fetchPostDetail();
    } else {
      // 新建模式：预加载分类
      await categoryStore.fetchAllCategories();
    }
  } catch {
    ElMessage.error('数据加载失败');
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
        <el-button
          class="publish-btn"
          type="primary"
          @click="handleSubmit(true)"
        >
          <el-icon><Position /></el-icon>
          <span>{{ postId ? '更新发布' : '发布' }}</span>
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <div v-if="isPreviewMode" class="preview-container">
        <div class="divider"></div>
        <div class="preview-content">
          <MdPreview :model-value="content" />
        </div>
      </div>
      <div v-else class="edit-container">
        <div class="editor-content">
          <MdEditor
            v-model="content"
            @on-get-catalog="onGetCatalog"
            :no-preview-touch-bottom="true"
            :theme="editorTheme"
            code-theme="github"
            class="md-editor"
            preview-theme="github"
            show-code-row-number
            auto-detect-code
            :code-mirror-options="{
              lineWrapping: true, // 代码自动换行
              autoCloseBrackets: true, // 自动补全括号
            }"
            :toolbars="toolbars"
            :preview-lazy="true"
            :preview-renderer="{
              cdn: 'https://cdn.jsdelivr.net/npm/katex@0.16.7/dist', // 使用CDN加速
            }"
            :style="editorConfig.style"
            @on-change="onChangeMd"
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
        <!-- 基本设置选项卡 -->
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
                @visible-change="handleCategorySelectVisible"
              >
                <el-option
                  v-for="item in categoryStore.allCategories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="标签">
              <el-select
                v-model="blogSettings.tagsIds"
                :loading="tagStore.loading"
                allow-create
                default-first-option
                filterable
                multiple
                placeholder="请选择或创建标签"
                style="width: 100%"
                @visible-change="handleTagSelectVisible"
              >
                <el-option
                  v-for="item in tagStore.allTags"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
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

        <!-- 发布设置选项卡 -->
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
                <el-radio :label="true">立即发布</el-radio>
                <el-radio :label="false">定时发布</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="!blogSettings.isPublishImmediately"
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

        <!-- SEO设置选项卡 -->
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

            <el-form-item label="封面图片">
              <div class="cover-container" @click="openResourceSelector">
                <div class="cover-wrapper">
                  <img
                    v-if="blogSettings.coverImageUrl"
                    :src="blogSettings.coverImageUrl"
                    class="cover-image"
                  />
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

        <!-- 高级选项选项卡 -->
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

            <!-- 版权协议可视化展示 -->
            <el-form-item label="版权展示">
              <div class="license-preview">
                <template v-if="blogSettings.license === 'cc-by-4.0'">
                  <div class="license-item">
                    <span>知识共享署名 4.0 国际许可协议</span>
                    <div class="license-icons">
                      <img
                        alt="CC BY 4.0"
                        src="https://licensebuttons.net/l/by/4.0/88x31.png"
                        title="知识共享署名 4.0 国际许可协议"
                      />
                    </div>
                  </div>
                </template>
                <template v-else-if="blogSettings.license === 'cc-by-sa-4.0'">
                  <div class="license-item">
                    <span>知识共享署名-相同方式共享 4.0 国际许可协议</span>
                    <div class="license-icons">
                      <img
                        alt="CC BY-SA 4.0"
                        src="https://licensebuttons.net/l/by-sa/4.0/88x31.png"
                        title="知识共享署名-相同方式共享 4.0 国际许可协议"
                      />
                    </div>
                  </div>
                </template>
                <template v-else-if="blogSettings.license === 'cc-by-nc-4.0'">
                  <div class="license-item">
                    <span>知识共享署名-非商业性使用 4.0 国际许可协议</span>
                    <div class="license-icons">
                      <img
                        alt="CC BY-NC 4.0"
                        src="https://licensebuttons.net/l/by-nc/4.0/88x31.png"
                        title="知识共享署名-非商业性使用 4.0 国际许可协议"
                      />
                    </div>
                  </div>
                </template>
                <template v-else-if="blogSettings.license === 'public-domain'">
                  <div class="license-item">
                    <span>公共领域</span>
                    <div class="license-icons">
                      <img
                        alt="Public Domain"
                        src="https://licensebuttons.net/p/zero/1.0/88x31.png"
                        title="公共领域"
                      />
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="license-item">
                    <span>保留所有权利</span>
                    <div class="license-icons">
                      <span>© 版权所有</span>
                    </div>
                  </div>
                </template>
              </div>
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

    <!-- 资源选择对话框 -->
    <el-dialog v-model="resourceDialogVisible" title="选择封面图片" width="80%">
      <ResourceSelector file-type="image" @select="handleResourceSelect"/>
    </el-dialog>
  </div>
</template>

<style scoped>
/**
 * 编辑器容器样式
 */
.blog-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #2d2d2d; /* 深色背景 */
  color: #e0e0e0; /* 浅色文字 */
}

/**
 * 顶部工具栏样式
 */
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

/**
 * 编辑器主体样式
 */
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

.editor-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.md-editor {
  height: 100%;
  border: none;
}

/**
 * 预览模式样式
 */
.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #2d2d2d; /* 深色背景 */
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

/**
 * 底部状态栏样式
 */
.editor-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 4px 16px;
  background-color: #333333; /* 深色背景 */
  border-top: 1px solid #444444;
  font-size: 12px;
  color: #aaaaaa;
}

/**
 * 设置对话框样式
 */
:deep(.blog-settings-dialog) {
  border-radius: 8px;
  background-color: #333333; /* 深色背景 */
  color: #e0e0e0;
}

:deep(.blog-settings-dialog .el-dialog__header) {
  border-bottom: 1px solid #444444;
  padding: 16px 20px;
  margin-right: 0;
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

:deep(.blog-settings-dialog .el-form-item__label) {
  color: #e0e0e0;
}

:deep(.blog-settings-dialog .el-tabs__item) {
  color: #b0b0b0;
}

:deep(.blog-settings-dialog .el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.blog-settings-dialog .el-tabs__nav-wrap::after) {
  background-color: #444444;
}

:deep(.blog-settings-dialog .el-select .el-input__wrapper) {
  background-color: #2d2d2d;
  box-shadow: 0 0 0 1px #555 inset;
}

:deep(.blog-settings-dialog .el-input__wrapper) {
  background-color: #2d2d2d;
  box-shadow: 0 0 0 1px #555 inset;
}

:deep(.blog-settings-dialog .el-input__inner) {
  color: #e0e0e0;
}

:deep(.blog-settings-dialog .el-textarea__inner) {
  background-color: #2d2d2d;
  color: #e0e0e0;
  border-color: #555;
}

:deep(.blog-settings-dialog .el-radio__label) {
  color: #e0e0e0;
}

/**
 * 自定义md-editor-v3样式
 */
:deep(.md-editor-v3) {
  --md-bk-color: #2d2d2d !important;
  --md-border-color: #444444 !important;
}

/**
 * 封面图片样式
 */
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
  border: 2px dashed #555;
  border-radius: 8px;
  overflow: hidden;
  background-color: #2d2d2d;
  min-height: 200px;
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
  color: #aaaaaa;

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

/**
 * 优化 Markdown 编辑器样式
 */
:deep(.md-editor-v3 .md-editor-preview) {
  padding: 16px 24px;
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.7;
}

:deep(.md-editor-v3 .md-editor-preview h1),
:deep(.md-editor-v3 .md-editor-preview h2),
:deep(.md-editor-v3 .md-editor-preview h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

:deep(.md-editor-v3 .md-editor-preview code) {
  background-color: #2a2a2a;
  border-radius: 3px;
  padding: 2px 5px;
}

:deep(.md-editor-v3 .md-editor-preview pre) {
  margin: 16px 0;
  border-radius: 6px;
}

:deep(.md-editor-v3 .md-editor-preview img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px 0;
  background-color: #444;
  border-radius: 6px;
}

:deep(.md-editor-v3 .md-editor-preview-lazy-loading) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #aaa;
}

/**
 * 版权协议展示样式
 */
.license-preview {
  background-color: #2a2a2a;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.license-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.license-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.license-icons img {
  height: 31px;
}
</style>
