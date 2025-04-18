<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import {useRoute, useRouter} from 'vue-router';

import {useAccessStore} from '@vben/stores';

import {
  Check as CheckIcon,
  CircleCheck,
  CircleClose,
  Close as CloseIcon,
  Delete,
  Document,
  Edit,
  Filter,
  InfoFilled,
  Key,
  Loading,
  Lock,
  Plus,
  Refresh,
  Search,
  Upload,
  UploadFilled,
  View,
} from '@element-plus/icons-vue';
import {useWindowSize} from '@vueuse/core';
import {ElMessage, ElMessageBox} from 'element-plus';

import {batchDeletePosts, getPostsPage} from '#/api/core/posts.js';
import {useCategoryStore} from '#/store/category';

defineOptions({
  name: 'PostsList',
});

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

const loading = ref(false);
const previewDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const uploadRef = ref<any>(null);
const uploading = ref(false);
const uploadStatus = ref('');
const previewBlog = reactive({
  title: '',
  content: '',
  summary: '',
  tags: '',
});
const uploadPercentage = ref(0);
const mdFileList = ref<any[]>([]);

// 筛选条件显示状态
const showFilter = ref(false);
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  // 保存筛选器状态到localStorage
  try {
    localStorage.setItem(
      'blog_filter_status',
      JSON.stringify(showFilter.value),
    );
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('blog_filter_status');
    if (status !== null) {
      showFilter.value = JSON.parse(status);
    }
  } catch (error) {
    console.error('获取存储的筛选器状态出错:', error);
  }
};

const categoryStore = useCategoryStore();
const background = ref(true);
const disabled = ref(false);
const singlePage = ref(false);

const visibilityMap = {
  public: {
    label: '公开访问',
    shortLabel: '公开',
    color: '#67c23a',
    icon: View,
  },
  private: {
    label: '私密文章',
    shortLabel: '私密',
    color: '#f56c6c',
    icon: Lock,
  },
  password: {
    label: '密码访问',
    shortLabel: '密码',
    color: '#e6a23c',
    icon: Key,
  },
};

/**
 * 解析Markdown内容
 */
const parseMdContent = (content: string, fileName: string) => {
  // 重置预览对象
  Object.assign(previewBlog, {
    title: '',
    content: '',
    summary: '',
    tags: '',
  });

  // 保存完整内容
  previewBlog.content = content;

  // 提取标题 (第一个#后的内容)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    previewBlog.title = titleMatch[1].trim();
  } else {
    // 如果没找到标题，使用文件名
    previewBlog.title = fileName.replace(/\.md$/, '');
  }

  // 提取标签 (#标签 格式)
  const tagMatches = content.match(/(?:^|\s)#(\w+)/g) || [];
  const tags = tagMatches.map((tag: string) => tag.trim().slice(1));
  previewBlog.tags = tags.join(', ');

  // 提取摘要 (第一个非标题段落)
  const paragraphs = content.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    if (
      paragraph &&
      !paragraph.trim().startsWith('#') &&
      paragraph.trim().length > 0
    ) {
      previewBlog.summary =
        paragraph.length > 200 ? `${paragraph.slice(0, 200)}...` : paragraph;
      break;
    }
  }

  // 解析YAML前置元数据 (如果有)
  if (content.startsWith('---')) {
    const endYaml = content.indexOf('---', 3);
    if (endYaml > 0) {
      const yamlContent = content.substring(3, endYaml).trim();

      // 提取标题
      const yamlTitleMatch = yamlContent.match(/title:\s*(.+)$/m);
      if (yamlTitleMatch && yamlTitleMatch[1]) {
        previewBlog.title = yamlTitleMatch[1]
          .trim()
          .replace(/^["'](.+)["']$/, '$1'); // 移除引号
      }

      // 提取标签
      const yamlTagsMatch = yamlContent.match(/tags:\s*(.+)$/m);
      if (yamlTagsMatch && yamlTagsMatch[1]) {
        let yamlTags = yamlTagsMatch[1].trim();

        // 处理数组格式 [tag1, tag2]
        if (yamlTags.startsWith('[') && yamlTags.endsWith(']')) {
          yamlTags = yamlTags.substring(1, yamlTags.length - 1);
        }

        previewBlog.tags = yamlTags;
      }
    }
  }
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const completedUploads = ref(0);

// 显示上传对话框
const showUploadDialog = () => {
  uploadDialogVisible.value = true;
  mdFileList.value = [];
  uploadPercentage.value = 0;
  uploadStatus.value = '';
  completedUploads.value = 0;
};

// 触发文件选择对话框
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 处理拖拽上传
const handleFileDrop = (e: DragEvent) => {
  if (!e.dataTransfer) return;

  const files = e.dataTransfer.files;
  if (files.length === 0) return;

  // 过滤.md文件
  const mdFiles = [...files].filter((file) => file.name.endsWith('.md'));
  if (mdFiles.length === 0) {
    ElMessage.warning('请上传.md格式的文件');
    return;
  }

  // 添加到文件列表
  const fileList = mdFiles.map((file) => ({
    raw: file,
    name: file.name,
    size: file.size,
    status: '',
  }));

  // 合并文件列表，避免重复
  const existingNames = new Set(mdFileList.value.map((f) => f.name));
  const newFiles = fileList.filter((f) => !existingNames.has(f.name));
  mdFileList.value = [...mdFileList.value, ...newFiles];
};

// 处理文件变化
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  // 转换为数组并添加到文件列表
  const fileList = [...target.files].map((file) => ({
    raw: file,
    name: file.name,
    size: file.size,
    status: '',
  }));

  // 合并文件列表，避免重复
  const existingNames = new Set(mdFileList.value.map((f) => f.name));
  const newFiles = fileList.filter((f) => !existingNames.has(f.name));
  mdFileList.value = [...mdFileList.value, ...newFiles];

  // 重置文件输入框，允许选择相同文件
  target.value = '';
};

// 移除文件
const removeFile = (index: number) => {
  mdFileList.value.splice(index, 1);
};

// 清空所有文件
const clearFiles = () => {
  mdFileList.value = [];
};

// 开始上传
const submitUpload = async () => {
  if (mdFileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }

  uploading.value = true;
  uploadStatus.value = '';
  uploadPercentage.value = 0;
  completedUploads.value = 0;

  // 为每个文件设置初始状态
  mdFileList.value.forEach((file) => {
    file.status = 'uploading';
    file.percentage = 0;
  });

  // 使用Promise.all同时上传多个文件
  const uploadPromises = mdFileList.value.map((file, index) =>
    uploadSingleFile(file.raw, index),
  );

  try {
    await Promise.all(uploadPromises);

    // 检查是否都上传成功
    const allSuccess = mdFileList.value.every(
      (file) => file.status === 'success',
    );
    if (allSuccess) {
      uploadStatus.value = 'success';
      ElMessage.success('所有文件上传完成');
      setTimeout(() => {
        fetchData(); // 刷新列表数据
        uploading.value = false;
        uploadDialogVisible.value = false;
      }, 1500);
    } else {
      uploadStatus.value = 'exception';
      ElMessage.warning('部分文件上传失败，请检查');
      uploading.value = false;
    }
  } catch {
    uploadStatus.value = 'exception';
    ElMessage.error('上传过程发生错误');
    uploading.value = false;
  }
};

// 上传单个文件
const uploadSingleFile = async (file: File, index: number) => {
  return new Promise((resolve, reject) => {
    const accessStore = useAccessStore(); // 新增访问令牌存储
    const authToken = `Bearer ${accessStore.accessToken}`; // 格式化令牌

    // 创建XMLHttpRequest
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        mdFileList.value[index].percentage = Math.floor(
          (e.loaded / e.total) * 100,
        );

        // 更新总体上传进度
        updateTotalProgress();
      }
    });

    // 设置请求完成的回调
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        mdFileList.value[index].status = 'success';
        completedUploads.value++;
        updateTotalProgress();
        resolve(xhr.responseText);
      } else {
        mdFileList.value[index].status = 'error';
        mdFileList.value[index].error = `错误 (${xhr.status})`;
        completedUploads.value++;
        updateTotalProgress();
        reject(new Error(`上传失败: ${xhr.status}`));
      }
    });

    // 设置请求错误的回调
    xhr.onerror = function () {
      mdFileList.value[index].status = 'error';
      mdFileList.value[index].error = '网络错误';
      completedUploads.value++;
      updateTotalProgress();
      reject(new Error('网络错误'));
    };

    // 准备FormData
    const formData = new FormData();
    formData.append('files', file);

    // 打开连接并发送请求
    xhr.open('POST', 'http://localhost:7200/ryu-content/posts/upload-md', true);
    // 添加认证头  // 新增认证头设置
    xhr.setRequestHeader('Authorization', authToken);
    xhr.send(formData);
  });
};

// 更新总体上传进度
const updateTotalProgress = () => {
  if (mdFileList.value.length === 0) return;

  // 计算总进度百分比 (已完成文件 + 进行中文件的进度百分比之和) / 总文件数
  const totalPercent =
    mdFileList.value.reduce((sum, file) => {
      return file.status === 'success' || file.status === 'error'
        ? sum + 100
        : sum + (file.percentage || 0);
    }, 0) / mdFileList.value.length;

  uploadPercentage.value = Math.floor(totalPercent);

  // 如果所有文件都处理完毕，设置最终状态
  if (completedUploads.value === mdFileList.value.length) {
    const allSuccess = mdFileList.value.every(
      (file) => file.status === 'success',
    );
    uploadStatus.value = allSuccess ? 'success' : 'exception';
  }
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
};

const getVisibilityLabel = (type: string) =>
  visibilityMap[type as keyof typeof visibilityMap]?.label || '未知';
const getVisibilityShortLabel = (type: string) =>
  visibilityMap[type as keyof typeof visibilityMap]?.shortLabel || '未知';
const getVisibilityColor = (type: string) =>
  visibilityMap[type as keyof typeof visibilityMap]?.color;
const getVisibilityIcon = (type: string) =>
  visibilityMap[type as keyof typeof visibilityMap]?.icon;

const selections = ref<any[]>([]);

const handleSelectionChange = (selectedRows: any[]) => {
  selections.value = selectedRows;
};

// 批量删除
const handleBatchDelete = () => {
  if (selections.value.length === 0) return;

  ElMessageBox.confirm(
    `确定要删除选中的 ${selections.value.length} 个博客吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        loading.value = true;
        const ids = selections.value.map((item) => item.id);
        await batchDeletePosts(ids);

        ElMessage.success('批量删除成功');
        selections.value = [];
        await fetchData();
      } catch (error) {
        console.error('批量删除失败', error);
        ElMessage.error('批量删除失败');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

const router = useRouter();
const route = useRoute();

interface FilterState {
  title: string;
  categoryId: string;
  publishTimeRange: any[];
}

// 从localStorage获取保存的过滤条件
const getStoredFilters = (): FilterState => {
  try {
    const storedFilters = localStorage.getItem('blog_filters');
    if (storedFilters) {
      return JSON.parse(storedFilters);
    }
  } catch (error) {
    console.error('获取存储的过滤条件出错:', error);
  }
  return {
    title: '',
    categoryId: '',
    publishTimeRange: [],
  };
};

const filters = ref<FilterState>(getStoredFilters());

// 监听并保存过滤条件到localStorage
watch(
  filters,
  (newVal) => {
    try {
      localStorage.setItem('blog_filters', JSON.stringify(newVal));
    } catch (error) {
      console.error('保存过滤条件出错:', error);
    }
  },
  {deep: true},
);

const tableData = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 从localStorage获取保存的分页设置
const getStoredPagination = () => {
  try {
    const pagination = localStorage.getItem('blog_pagination');
    if (pagination) {
      const {page, size} = JSON.parse(pagination);
      currentPage.value = page || 1;
      pageSize.value = size || 10;
    }
  } catch (error) {
    console.error('获取存储的分页设置出错:', error);
  }
};

// 保存分页设置到localStorage
const savePagination = () => {
  try {
    localStorage.setItem(
      'blog_pagination',
      JSON.stringify({
        page: currentPage.value,
        size: pageSize.value,
      }),
    );
  } catch (error) {
    console.error('保存分页设置出错:', error);
  }
};

// 监听分页变化
watch(
  [currentPage, pageSize],
  () => {
    savePagination();
  },
  {deep: true},
);

const fetchData = async () => {
  try {
    loading.value = true;
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      categoryId: filters.value.categoryId,
      title: filters.value.title,
    };
    const res = await getPostsPage(params);
    tableData.value = res.records;
    total.value = res.total;
    currentPage.value = res.current;
    pageSize.value = res.size;
    savePagination();
  } catch (error) {
    console.error('数据加载失败:', error);
    ElMessage.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  filters.value = {
    title: '',
    categoryId: '',
    publishTimeRange: [],
  };
  currentPage.value = 1;
  fetchData();
};

const handleSizeChange = async (val: number) => {
  pageSize.value = val;
  await fetchData();
};

const handleCurrentChange = async (val: number) => {
  currentPage.value = val;
  await fetchData();
};

const addBlog = () => {
  router.push('/article/edit');
};

const editBlog = (row: any) => {
  router.push(`/article/edit/${row.id}`);
};

const deleteBlog = async (row: any) => {
  try {
    loading.value = true;
    await batchDeletePosts([row.id]);
    ElMessage.success('删除成功');
    await fetchData();
  } catch {
    ElMessage.error('删除失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 格式化数字（添加千位分隔符）
const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '0';
  return num.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 计算排序百分比
const getSortPercentage = (sort: number): number => {
  if (sort === undefined || sort === null) return 0;
  return Math.min(100, Math.max(0, sort));
};

// 获取排序颜色
const getSortColor = (sort: number): string => {
  if (sort <= 20) return '#909399'; // 灰色
  if (sort <= 50) return '#409EFF'; // 蓝色
  if (sort <= 80) return '#E6A23C'; // 橙色
  return '#F56C6C'; // 红色
};

// 创建防抖函数
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timer: null | number = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay) as unknown as number;
  };
};

// 防抖处理的查询函数
const debouncedFetchData = debounce(fetchData, 300);

// 监听过滤条件变化，自动查询
watch(
  () => [filters.value.title, filters.value.categoryId],
  () => {
    currentPage.value = 1; // 重置为第一页
    debouncedFetchData();
  },
  {deep: true},
);

onMounted(async () => {
  getStoredPagination();
  getStoredFilterStatus();
  await fetchData();
  // 加载分类数据
  await categoryStore.fetchAllCategories();
});

// 组件卸载前保存状态
onBeforeUnmount(() => {
  savePagination();
});
</script>

<template>
  <div class="blog-list">
    <el-card
      v-show="showFilter"
      :class="{ 'filter-card-slide': showFilter }"
      class="filter-card mb-4"
    >
      <el-form :inline="true" :model="filters" class="filter-container">
        <el-form-item class="form-item">
          <el-input
            v-model="filters.title"
            clearable
            placeholder="标题"
            prefix-icon="Search"
            size="large"
          />
        </el-form-item>

        <el-form-item class="form-item">
          <el-select
            v-model="filters.categoryId"
            clearable
            placeholder="选择分类"
            size="large"
            @click="categoryStore.fetchAllCategories()"
          >
            <el-option
              v-for="item in categoryStore.allCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="form-item">
          <el-date-picker
            v-model="filters.publishTimeRange"
            end-placeholder="结束日期"
            range-separator="至"
            size="large"
            start-placeholder="开始日期"
            type="daterange"
            value-format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button
              :icon="Search"
              :loading="loading"
              type="primary"
              @click="fetchData"
            >
              查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="reset">
              重置
            </el-button>
            <el-button
              :disabled="loading"
              :icon="Plus"
              type="success"
              @click="addBlog"
            >
              添加博客
            </el-button>
            <el-button
              :disabled="loading"
              :icon="Upload"
              type="primary"
              @click="showUploadDialog"
            >
              导入MD文件
            </el-button>

            <div v-show="selections.length > 0" class="batch-actions">
              <el-button
                :disabled="loading"
                :icon="Delete"
                type="danger"
                @click="handleBatchDelete"
              >
                批量删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-loading="loading"
      class="table-card"
      element-loading-background="rgba(0, 0, 0, 0.1)"
      element-loading-text="加载中..."
    >
      <div class="table-header">
        <div class="table-title">博客列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button
              :icon="Filter"
              circle
              text
              type="primary"
              @click="toggleFilter"
            />
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button
              :icon="Search"
              circle
              text
              type="primary"
              @click="showFilter = true"
            />
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button
              :icon="Refresh"
              :loading="loading"
              circle
              text
              type="primary"
              @click="fetchData"
            />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        :data="tableData"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          :reserve-selection="true"
          type="selection"
          width="55"
        />
        <el-table-column
          align="center"
          label="标题"
          min-width="150"
          prop="title"
          show-overflow-tooltip
        />
        <el-table-column
          :show-overflow-tooltip="true"
          align="center"
          label="分类名称"
          min-width="120"
          prop="categoryName"
        />
        <el-table-column
          align="center"
          label="摘要"
          min-width="200"
          prop="excerpt"
          show-overflow-tooltip
        />
        <el-table-column
          :class-name="isMobile ? 'hidden-xs-only' : ''"
          align="center"
          label="是否原创"
          prop="isOriginal"
          width="100"
        >
          <template #default="{ row }">
            <el-switch
              :active-icon="CheckIcon"
              :inactive-icon="CloseIcon"
              :model-value="row.isOriginal"
              active-color="#13ce66"
              disabled
              inactive-color="#ff4949"
              inline-prompt
            />
          </template>
        </el-table-column>
        <el-table-column
          :class-name="isMobile ? 'hidden-xs-only' : ''"
          align="center"
          label="允许评论"
          prop="allowComment"
          width="100"
        >
          <template #default="{ row }">
            <el-badge
              :type="row.allowComment ? 'success' : 'danger'"
              :value="row.allowComment ? '允许' : '禁止'"
              class="comment-badge"
            />
          </template>
        </el-table-column>
        <el-table-column
          :class-name="isMobile ? 'hidden-xs-only' : ''"
          align="center"
          label="访问权限"
          prop="visibility"
          width="100"
        >
          <template #default="{ row }">
            <div class="visibility-cell">
              <el-tooltip
                :content="getVisibilityLabel(row.visibility)"
                placement="top"
              >
                <div
                  :style="{
                    backgroundColor: `${getVisibilityColor(row.visibility)}20`,
                  }"
                  class="visibility-icon-wrapper"
                >
                  <el-icon :color="getVisibilityColor(row.visibility)">
                    <component :is="getVisibilityIcon(row.visibility)"/>
                  </el-icon>
                </div>
              </el-tooltip>
              <span class="visibility-text">{{
                  getVisibilityShortLabel(row.visibility)
                }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                {
                  0: 'info',
                  1: 'success',
                  2: 'warning',
                  3: 'danger',
                }[row.status]
              "
              effect="dark"
              round
            >
              {{
                {
                  0: '待发布',
                  1: '已发布',
                  2: '草稿',
                  3: '已归档',
                }[row.status]
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :class-name="isMobile ? 'hidden-xs-only' : ''"
          align="center"
          label="浏览量"
          prop="views"
          width="100"
        >
          <template #default="{ row }">
            <div class="views-cell">
              <el-icon>
                <View/>
              </el-icon>
              <span class="views-count">{{ formatNumber(row.views) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :class-name="isMobile ? 'hidden-xs-only' : ''"
          align="center"
          label="排序"
          prop="sort"
          width="80"
        >
          <template #default="{ row }">
            <el-progress
              :color="getSortColor(row.sort)"
              :percentage="getSortPercentage(row.sort)"
              :show-text="false"
              :stroke-width="10"
              class="sort-progress"
            />
            <span
              :style="{
                color: row.sort > 50 ? '#e6a23c' : '#409eff',
                fontWeight: row.sort > 50 ? 'bold' : 'normal',
              }"
              class="sort-value"
            >{{ row.sort }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :class-name="isMobile ? 'hidden-sm-and-down' : ''"
          align="center"
          label="创建时间"
          prop="createTime"
          width="180"
        />
        <el-table-column
          :class-name="isMobile ? 'hidden-md-and-down' : ''"
          align="center"
          label="修改时间"
          prop="updateTime"
          width="180"
        />
        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑博客" placement="top">
                <el-button
                  :disabled="loading"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="editBlog(scope.row)"
                />
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该博客吗？"
                @confirm="deleteBlog(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="loading"
                    :icon="Delete"
                    circle
                    class="action-button delete-button"
                    size="small"
                    type="danger"
                  />
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :background="background"
          :disabled="disabled"
          :hide-on-single-page="singlePage"
          :page-sizes="[10, 20, 30, 40]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          size="default"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>

    <!-- MD文件上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="!uploading"
      title="导入Markdown文件"
      width="800px"
    >
      <div class="upload-main">
        <div class="upload-left">
          <div
            class="drop-zone"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <div class="drop-content">
              <el-icon class="upload-icon">
                <UploadFilled/>
              </el-icon>
              <h3 class="upload-title">将文件拖到此处</h3>
              <div class="upload-divider">
                <span>或</span>
              </div>
              <el-button plain type="primary">选择MD文件</el-button>
              <div class="upload-tips">支持.md文件格式，单个文件不超过5MB</div>
              <input
                ref="fileInputRef"
                accept=".md"
                class="hidden-input"
                multiple
                type="file"
                @change="handleFileChange"
              />
            </div>
          </div>

          <div v-if="mdFileList.length > 0" class="upload-actions">
            <div class="upload-stat">已选择 {{ mdFileList.length }} 个文件</div>
            <div class="action-group">
              <el-button
                :disabled="uploading"
                plain
                size="small"
                type="danger"
                @click="clearFiles"
              >
                清空
              </el-button>
              <el-button
                :disabled="mdFileList.length === 0 || uploading"
                :loading="uploading"
                size="small"
                type="primary"
                @click="submitUpload"
              >
                开始上传
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="mdFileList.length > 0" class="upload-right">
          <div class="file-list-header">文件列表</div>
          <el-scrollbar class="file-scrollbar" height="400px">
            <transition-group class="file-list" name="file-list" tag="div">
              <div
                v-for="(file, index) in mdFileList"
                :key="file.name"
                :class="{
                  uploading: file.status === 'uploading',
                  success: file.status === 'success',
                  error: file.status === 'error',
                }"
                class="file-item"
              >
                <div class="file-icon">
                  <el-icon v-if="file.status === ''" size="24">
                    <Document/>
                  </el-icon>
                  <el-icon
                    v-else-if="file.status === 'success'"
                    class="success-icon"
                    size="24"
                  >
                    <CircleCheck/>
                  </el-icon>
                  <el-icon
                    v-else-if="file.status === 'error'"
                    class="error-icon"
                    size="24"
                  >
                    <CircleClose/>
                  </el-icon>
                  <el-progress
                    v-else-if="file.status === 'uploading'"
                    :percentage="file.percentage || 0"
                    :stroke-width="4"
                    :width="36"
                    class="progress-circle"
                    type="circle"
                  />
                </div>
                <div class="file-content">
                  <div :title="file.name" class="file-name">
                    {{ file.name }}
                  </div>
                  <div class="file-info">
                    <span class="file-size">{{
                        formatFileSize(file.size)
                      }}</span>
                  </div>
                </div>
                <div class="file-status-wrapper">
                  <span
                    v-if="file.status === 'uploading'"
                    class="file-status uploading"
                  >
                    <el-icon><Loading/></el-icon> {{ file.percentage }}%
                  </span>
                  <span
                    v-else-if="file.status === 'success'"
                    class="file-status success"
                  >
                    <el-icon><CircleCheck/></el-icon> 上传成功
                  </span>
                  <span
                    v-else-if="file.status === 'error'"
                    class="file-status error"
                  >
                    <el-icon><CircleClose/></el-icon>
                    {{ file.error || '上传失败' }}
                  </span>
                  <span v-else class="file-status pending">
                    <el-icon><InfoFilled/></el-icon> 待上传
                  </span>
                </div>
                <div class="file-actions">
                  <el-button
                    v-if="file.status !== 'uploading'"
                    :disabled="uploading"
                    :icon="Delete"
                    circle
                    size="small"
                    text
                    type="danger"
                    @click="removeFile(index)"
                  />
                </div>
              </div>
            </transition-group>
          </el-scrollbar>

          <div v-if="uploading" class="upload-progress-bar">
            <div class="progress-header">
              <span>总体上传进度</span>
              <span class="progress-percent">{{ uploadPercentage }}%</span>
            </div>
            <el-progress
              :percentage="uploadPercentage"
              :show-text="false"
              :status="uploadStatus"
              :stroke-width="8"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button
            v-if="!uploading"
            type="primary"
            @click="uploadDialogVisible = false"
          >完成</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.blog-list {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.filter-card-slide {
  animation: slide-down 0.3s ease;
}

@keyframes slide-down {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 15px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 5px;
}

.table-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.form-item {
  margin-bottom: 0;
  margin-right: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.inline-upload {
  display: inline-block;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 15px 0;
}

.responsive-table {
  width: 100%;
  overflow-x: auto;
}

.el-input,
.el-select,
.el-date-editor {
  width: 220px;
}

@media (max-width: 768px) {
  .blog-list {
    padding: 10px;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;
  }

  .el-input,
  .el-select,
  .el-date-editor {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .batch-actions {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }

  .pagination-container {
    padding: 10px 0;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-actions {
    align-self: flex-end;
  }
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

.views-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.views-count {
  font-weight: 500;
  color: var(--el-color-primary);
}

.comment-badge :deep(.el-badge__content) {
  padding: 0 6px;
  border-radius: 10px;
  font-weight: normal;
  font-size: 12px;
}

.sort-progress {
  width: 80%;
  margin: 0 auto;
}

.sort-value {
  display: block;
  text-align: center;
  margin-top: 3px;
  font-size: 12px;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-button {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: scale(1);
  transition: all 0.2s ease-in-out;
}

.action-button:hover {
  transform: scale(1.1);
}

.edit-button {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.delete-button {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.visibility-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.visibility-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  padding: 2px;
}

.visibility-text {
  font-size: 12px;
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 15px 20px;
}

:deep(.el-backtop) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: #fff;
}

/* 表格行hover效果 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-color-primary-light-9) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表头样式 */
:deep(.el-table__header) {
  font-weight: bold;
  background-color: var(--el-color-info-light-9);
}

:deep(.el-table__header th) {
  background-color: var(--el-color-info-light-9);
  color: var(--el-text-color-primary);
}

/* 按钮hover效果 */
.table-actions .el-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

/* 上传对话框样式 */
.upload-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.upload-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.drop-zone {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  border: 2px dashed var(--el-color-primary-light-5);
  transition: all 0.3s;
  cursor: pointer;
  padding: 30px 0;
}

.drop-zone:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.1);
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.upload-title {
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.upload-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.upload-tips {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.upload-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.upload-stat {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.action-group {
  display: flex;
  gap: 10px;
}

.upload-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.file-list-header {
  font-size: 18px;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.file-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  width: 100%;
}

.file-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px dashed var(--el-border-color);
  position: relative;
}

.file-item.uploading {
  border-color: var(--el-color-primary);
  background-color: rgba(64, 158, 255, 0.1);
}

.file-item.success {
  border-color: var(--el-color-success);
  background-color: rgba(103, 194, 58, 0.1);
}

.file-item.error {
  border-color: var(--el-color-danger);
  background-color: rgba(245, 108, 108, 0.1);
}

.file-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 50px;
  margin-right: 10px;
}

.file-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: calc(100% - 260px);
  margin-right: auto;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 100%;
}

.file-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-size {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.file-status-wrapper {
  display: flex;
  align-items: center;
  min-width: 120px;
  white-space: nowrap;
  justify-content: flex-end;
  margin-right: 10px;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
  background-color: rgba(0, 0, 0, 0.04);
}

.file-status.uploading {
  color: var(--el-color-primary);
  font-weight: 500;
  background-color: rgba(64, 158, 255, 0.1);
}

.file-status.success {
  color: var(--el-color-success);
  font-weight: 500;
  background-color: rgba(103, 194, 58, 0.1);
}

.file-status.error {
  color: var(--el-color-danger);
  font-weight: 500;
  background-color: rgba(245, 108, 108, 0.1);
}

.file-status.pending {
  color: var(--el-color-info);
  font-weight: 500;
  background-color: rgba(144, 147, 153, 0.1);
}

.file-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.upload-progress-bar {
  margin-top: 20px;
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 14px;
}

.progress-percent {
  font-size: 14px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hidden-input {
  display: none;
}

.success-icon {
  color: var(--el-color-success);
}

.error-icon {
  color: var(--el-color-danger);
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 文件列表动画 */
.file-list-enter-active,
.file-list-leave-active {
  transition: all 0.3s ease;
}

.file-list-enter-from,
.file-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.file-list-move {
  transition: transform 0.3s ease;
}

.file-scrollbar {
  width: 100%;
}

.file-status-wrapper {
  display: flex;
  align-items: center;
  padding: 0 10px;
  white-space: nowrap;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-status.pending {
  color: var(--el-color-info);
  font-weight: 500;
}

@media (max-width: 768px) {
  .upload-main {
    flex-direction: column;
  }

  .upload-left,
  .upload-right {
    width: 100%;
    margin-bottom: 20px;
  }

  .file-item {
    flex-wrap: wrap;
  }

  .file-content {
    width: calc(100% - 60px);
  }

  .file-status-wrapper {
    width: 100%;
    justify-content: flex-start;
    margin-top: 10px;
    padding-left: 60px;
  }

  .file-actions {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>
