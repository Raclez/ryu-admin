<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';

// 导入图标组件
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
import {ElMessage} from 'element-plus';
import debounce from 'lodash-es/debounce';
import {MdEditor, MdPreview} from 'md-editor-v3';

import {getPostsDetail, savePosts, updatePosts} from '#/api/core/posts';
import ResourceSelector from '#/components/ResourceSelector.vue';
import {useCategoryStore} from '#/store/category';
import {useTagStore} from '#/store/tag';

import 'md-editor-v3/lib/style.css';

// ====================== 路由与状态 ======================
const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const tagStore = useTagStore();

// 获取文章ID（编辑模式时存在）
const postId = computed(() => route.params.id as string);

// ====================== 编辑器配置 ======================
// 编辑器主题
const editorTheme = ref('dark');

// 编辑器配置
const editorConfig = reactive({
  style: {
    height: 'calc(100vh - 100px)',
    width: '100%',
  },
});

// 工具栏配置（最小化常用工具集）
const toolbars = [
  'bold',
  'italic',
  'strikethrough',
  'heading',
  'quote',
  'ul',
  'ol',
  'table',
  'link',
  'image',
  'code',
  'codeBlock',
  'save',
  'undo',
  'redo',
  'prettier',
  'pageFullscreen',
  'fullscreen',
  'preview',
];

// ====================== 编辑器状态 ======================
// Markdown内容
const content = ref('');

// 文章目录
const catalog = ref([]);

// 统计信息
const wordCount = reactive({
  characters: 0,
  words: 0,
  lines: 0,
});

// 光标位置
const cursorPosition = reactive({
  line: 1,
  column: 0,
});

// 界面状态
const isPreviewMode = ref(false);
const settingsDialogVisible = ref(false);
const resourceDialogVisible = ref(false);

// ====================== 文章设置 ======================
// 文章基本设置
const blogSettings = ref({
  title: '',
  excerpt: '',
  categoryId: undefined,
  tagsIds: [] as number[],
  allowComment: true,
  seoTitle: '',
  seoDescription: '',
  isSticky: false,
  isOriginal: true,
  visibility: 'public',
  coverImageId: null as null | number,
  coverImageUrl: '',
  isPublishImmediately: true,
  scheduleTime: null as null | string,
  sort: 0,
  password: '',
  slug: '',
  license: 'cc-by-4.0',
  sourceUrl: '',
});

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

// ====================== 分类与标签处理 ======================

/**
 * 分类加载处理
 * @param visible 下拉框可见状态
 */
const handleCategorySelectVisible = async (visible: boolean) => {
  if (visible && categoryStore.allCategories.length === 0) {
    await categoryStore.fetchAllCategories();
  }
};

/**
 * 标签选择处理
 * @param visible 下拉框可见状态
 */
const handleTagSelectVisible = async (visible: boolean) => {
  if (visible && tagStore.allTags.length === 0) {
    await tagStore.fetchAllTags();
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
 * 获取博客详情
 * 包含分类和标签的回显处理
 */
const fetchPostDetail = async () => {
  try {
    const result = await getPostsDetail(postId.value);

    if (!result) {
      ElMessage.error('文章不存在或已删除');
      return;
    }

    // 填充文章内容
    content.value = result.content || '';

    // 填充文章设置
    blogSettings.value = {
      title: result.title || '',
      excerpt: result.excerpt || '',
      categoryId: result.categoryId,
      tagsIds: result.tags?.map((tag) => tag.id) || [],
      allowComment: result.allowComment ?? true,
      seoTitle: result.seoTitle || '',
      seoDescription: result.seoDescription || '',
      isSticky: result.isSticky ?? false,
      isOriginal: result.isOriginal ?? true,
      visibility: result.visibility || 'public',
      coverImageId: result.coverImageId,
      coverImageUrl: result.coverImageUrl || '',
      isPublishImmediately: !result.scheduleTime,
      scheduleTime: result.scheduleTime,
      sort: result.sort || 0,
      password: result.password || '',
      slug: result.slug || '',
      license: result.license || 'cc-by-4.0',
      sourceUrl: result.sourceUrl || '',
    };

    // 更新字数统计
    updateWordCount();
  } catch (error) {
    console.error('获取文章详情失败:', error);
    ElMessage.error('获取文章详情失败');
  }
};

// ====================== 资源管理功能 ======================

/**
 * 打开资源选择器
 */
const openResourceSelector = () => {
  resourceDialogVisible.value = true;
};

/**
 * 处理资源选择
 * @param resource 选中的资源对象
 */
const handleResourceSelect = (resource: any) => {
  if (resource) {
    blogSettings.value.coverImageId = resource.id;
    blogSettings.value.coverImageUrl = resource.url;
  }
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
 * 获取目录结构
 * @param data 编辑器生成的目录数据
 */
const onGetCatalog = (data: any) => {
  catalog.value = data;
};

/**
 * 防抖处理内容变化事件
 * 避免频繁更新和重绘
 */
const onChangeMd = debounce((value: string) => {
  content.value = value;
  updateWordCount();
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
 */
const saveDraft = async () => {
  if (!blogSettings.value.title.trim()) {
    ElMessage.warning('请先设置文章标题');
    settingsDialogVisible.value = true;
    return;
  }

  try {
    await handleSubmit(false);
    ElMessage.success('草稿已保存');
  } catch {
    // 错误处理已在handleSubmit中完成
  }
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

  router.push(`/article/history/${postId.value}`);
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
      ? {id: postId.value, ...baseData}
      : {...baseData};

    // 提交到服务器
    if (postId.value) {
      await updatePosts(postData);
      ElMessage.success('文章更新成功！');
    } else {
      const result = await savePosts(postData);
      // 更新文章ID，以便后续操作
      if (result?.id) {
        router.replace(`/article/edit/${result.id}`);
      }
      ElMessage.success('文章创建成功！');
    }

    // 发布后跳转到列表页
    if (isPublish) {
      await router.push('/article/list');
    }
  } catch (error: any) {
    ElMessage.error(`操作失败: ${error.message || '未知错误'}`);
    throw error; // 向上抛出错误，让调用者处理
  }
};

// ====================== 数据统计 ======================

/**
 * 更新字数统计
 */
const updateWordCount = () => {
  const text = content.value;
  wordCount.characters = text.length;
  wordCount.words = text.split(/\s+/).filter(Boolean).length;
  wordCount.lines = text.split('\n').length;
};

// ====================== 生命周期钩子 ======================

/**
 * 组件挂载时执行初始化
 */
onMounted(async () => {
  try {
    // 初始化数据
    if (postId.value) {
      // 编辑模式：加载文章详情
      await fetchPostDetail();
    } else {
      // 新建模式：预加载分类
      await categoryStore.fetchAllCategories();
      // 初始化字数统计
      updateWordCount();
    }
  } catch (error) {
    console.error('初始化数据失败:', error);
    ElMessage.error('数据加载失败');
  }
});
</script>

<template>
  <div class="article-editor-container">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="title-area">
        <span class="editor-icon">
          <el-icon><Document/></el-icon>
        </span>
        <span class="editor-title">文章</span>
      </div>
      <div class="editor-tools">
        <el-tooltip content="使用 md-editor-v3 编辑器" placement="bottom">
          <el-button link>
            <el-icon>
              <Grid/>
            </el-icon>
            <span>Markdown</span>
          </el-button>
        </el-tooltip>
        <el-button link @click="goToVersionHistory">
          <el-icon>
            <Timer/>
          </el-icon>
          <span>版本历史</span>
        </el-button>
        <el-button link @click="togglePreview">
          <el-icon>
            <View/>
          </el-icon>
          <span>预览</span>
        </el-button>
        <el-button link @click="saveDraft">
          <el-icon>
            <Download/>
          </el-icon>
          <span>保存</span>
        </el-button>
        <el-button link @click="openSettings">
          <el-icon>
            <Setting/>
          </el-icon>
          <span>设置</span>
        </el-button>
        <el-button
          class="publish-btn"
          type="primary"
          @click="handleSubmit(true)"
        >
          <el-icon>
            <Position/>
          </el-icon>
          <span>{{ postId ? '更新发布' : '发布' }}</span>
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <div v-if="isPreviewMode" class="preview-container">
        <div class="divider"></div>
        <div class="preview-content">
          <MdPreview :model-value="content"/>
        </div>
      </div>
      <div v-else class="edit-container">
        <div class="editor-content">
          <MdEditor
            v-model="content"
            :code-mirror-options="{
              lineWrapping: true,
              autoCloseBrackets: true,
            }"
            :no-preview-touch-bottom="true"
            :preview-lazy="true"
            :preview-renderer="{
              cdn: 'https://cdn.jsdelivr.net/npm/katex@0.16.7/dist',
            }"
            :style="editorConfig.style"
            :theme="editorTheme"
            :toolbars="toolbars"
            auto-detect-code
            class="md-editor"
            code-theme="github"
            preview-theme="github"
            show-code-row-number
            @on-get-catalog="onGetCatalog"
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
      :close-on-click-modal="false"
      custom-class="article-settings-dialog"
      title="文章设置"
      width="650px"
    >
      <el-tabs>
        <!-- 基本设置选项卡 -->
        <el-tab-pane label="基本设置">
          <el-form
            :model="blogSettings"
            label-position="left"
            label-width="100px"
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
                :maxlength="300"
                :rows="3"
                placeholder="请输入文章摘要（可选）"
                show-word-limit
                type="textarea"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 发布设置选项卡 -->
        <el-tab-pane label="发布设置">
          <el-form
            :model="blogSettings"
            label-position="left"
            label-width="100px"
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
                placeholder="选择日期时间"
                style="width: 100%"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>

            <el-form-item label="允许评论">
              <el-switch v-model="blogSettings.allowComment"/>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- SEO设置选项卡 -->
        <el-tab-pane label="SEO设置">
          <el-form
            :model="blogSettings"
            label-position="left"
            label-width="100px"
            size="default"
          >
            <el-form-item label="URL别名">
              <el-input
                v-model="blogSettings.slug"
                placeholder="自定义URL路径（可选）"
              >
                <template #prepend>/article/</template>
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
                :maxlength="200"
                :rows="3"
                placeholder="搜索引擎优化描述（可选）"
                show-word-limit
                type="textarea"
              />
            </el-form-item>

            <el-form-item label="封面图片">
              <div class="cover-container" @click="openResourceSelector">
                <div class="cover-wrapper">
                  <img
                    v-if="blogSettings.coverImageUrl"
                    :src="blogSettings.coverImageUrl"
                    alt="文章封面"
                    class="cover-image"
                  />
                  <div v-else class="empty-cover">
                    <el-icon>
                      <Plus/>
                    </el-icon>
                    <span>点击选择封面</span>
                  </div>
                  <div
                    v-if="blogSettings.coverImageUrl"
                    class="remove-btn"
                    @click.stop="removeCover"
                  >
                    <el-icon>
                      <Close/>
                    </el-icon>
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
            label-position="left"
            label-width="100px"
            size="default"
          >
            <el-form-item label="文章排序">
              <el-input-number
                v-model="blogSettings.sort"
                :max="999"
                :min="0"
                placeholder="数字越小越靠前"
              />
            </el-form-item>

            <el-form-item label="文章置顶">
              <el-switch v-model="blogSettings.isSticky"/>
            </el-form-item>

            <el-form-item label="原创声明">
              <el-switch v-model="blogSettings.isOriginal"/>
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
                <el-option label="保留所有权利" value="all-rights-reserved"/>
                <el-option label="知识共享署名 4.0" value="cc-by-4.0"/>
                <el-option
                  label="知识共享署名-相同方式共享 4.0"
                  value="cc-by-sa-4.0"
                />
                <el-option
                  label="知识共享署名-非商业性使用 4.0"
                  value="cc-by-nc-4.0"
                />
                <el-option label="公共领域" value="public-domain"/>
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
.article-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #2d2d2d;
  color: #e0e0e0;
}

/**
 * 顶部工具栏样式
 */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #333333;
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
  background-color: #2d2d2d;
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
  background-color: #2d2d2d;
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
  background-color: #2d2d2d;
}

/**
 * 底部状态栏样式
 */
.editor-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 4px 16px;
  background-color: #333333;
  border-top: 1px solid #444444;
  font-size: 12px;
  color: #aaaaaa;
}

/**
 * 设置对话框样式
 */
:deep(.article-settings-dialog) {
  border-radius: 8px;
  background-color: #333333;
  color: #e0e0e0;
}

:deep(.article-settings-dialog .el-dialog__header) {
  border-bottom: 1px solid #444444;
  padding: 16px 20px;
  margin-right: 0;
  color: #ffffff;
}

:deep(.article-settings-dialog .el-dialog__body) {
  padding: 20px;
  background-color: #333333;
}

:deep(.article-settings-dialog .el-dialog__footer) {
  border-top: 1px solid #444444;
  padding: 16px 20px;
  background-color: #333333;
}

:deep(.article-settings-dialog .el-form-item__label) {
  color: #e0e0e0;
}

:deep(.article-settings-dialog .el-tabs__item) {
  color: #b0b0b0;
}

:deep(.article-settings-dialog .el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.article-settings-dialog .el-tabs__nav-wrap::after) {
  background-color: #444444;
}

:deep(.article-settings-dialog .el-select .el-input__wrapper) {
  background-color: #2d2d2d;
  box-shadow: 0 0 0 1px #555 inset;
}

:deep(.article-settings-dialog .el-input__wrapper) {
  background-color: #2d2d2d;
  box-shadow: 0 0 0 1px #555 inset;
}

:deep(.article-settings-dialog .el-input__inner) {
  color: #e0e0e0;
}

:deep(.article-settings-dialog .el-textarea__inner) {
  background-color: #2d2d2d;
  color: #e0e0e0;
  border-color: #555;
}

:deep(.article-settings-dialog .el-radio__label) {
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
