<script setup>
import { computed, nextTick, onMounted, ref, watch ,onBeforeUnmount} from 'vue';

import {
  ArrowDown,
  CopyDocument,
  Delete,
  Document,
  Download,
  Edit,
  Files,
  Grid,
  Headset,
  List,
  MoreFilled,
  Plus,
  Search,
  Setting,
  Upload,
  UploadFilled,
  VideoCamera,
  VideoPlay,
  View,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import StorageManagement from '#/components/StorageManagement.vue';
import {getResourceGroups} from "#/api/core/resourceGroup.js";
import {requestClient} from "#/api/request.js";
import {getFilesGroup} from "#/api/core/resource.js";

// 状态变量
const searchKeyword = ref('');
const searchTags = ref([]);
const viewMode = ref('grid');
const currentPage = ref(1);
const pageSize = ref(20);
const activeTabName = ref('all');
const loading = ref(false);
const resourceDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const storageManagementVisible = ref(false);
const newGroupDialogVisible = ref(false);
const newVersionDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const inputTagVisible = ref(false);
const inputTagValue = ref('');
const currentResource = ref(null);
const previewResource = ref(null);
const uploadFileList = ref([]);
const uploadingFiles = ref([]);
const versionFileList = ref([]);
const selectedVersionIndex = ref(0);
const uploading = ref(false);
const uploadingVersion = ref(false);

// 表单数据
const uploadOptions = ref({
  storage: '',
  group: 'uncategorized',
  access: 'read',
  versionPolicy: 'new',
  versionTag: '',
  description: '',
});

const versionForm = ref({
  tag: '',
  description: '',
});

const newGroupForm = ref({
  name: '',
  description: '',
});

// 过滤和排序相关
 const totals=ref(0);
const currentStorageFilter = ref('all');
const currentTypeFilter = ref('all');
const currentSortType = ref('default');

// 数据源
const resources = ref([]);
const resourceGroups = ref([]);
const storagePolicies = ref([]);

// 计算属性
const currentStorageLabel = computed(() => {
  if (currentStorageFilter.value === 'all') return '全部';
  const policy = storagePolicies.value.find(
    (p) => p.id === currentStorageFilter.value,
  );
  return policy ? policy.name : '全部';
});

const currentTypeLabel = computed(() => {
  const types = {
    all: '全部',
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    other: '其他',
  };
  return types[currentTypeFilter.value] || '全部';
});

const currentSortLabel = computed(() => {
  const sorts = {
    default: '默认',
    'time-desc': '上传时间 ↓',
    'time-asc': '上传时间 ↑',
    'name-asc': '文件名 A-Z',
    'name-desc': '文件名 Z-A',
    'size-desc': '文件大小 ↓',
    'size-asc': '文件大小 ↑',
  };
  return sorts[currentSortType.value] || '默认';
});

const filteredResources = computed(() => {
  let results = [...resources.value];

  // // 分组过滤
  // if (activeTabName.value !== 'all') {
  //   results = results.filter((item) => item.groupName === activeTabName.value);
  // }

  // // 存储策略过滤
  // if (currentStorageFilter.value !== 'all') {
  //   results = results.filter(
  //     (item) => item.storage === currentStorageFilter.value,
  //   );
  // }

  // 文件类型过滤
  if (currentTypeFilter.value !== 'all') {
    results = results.filter((item) => item.type === currentTypeFilter.value);
  }

  // 搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        (item.description &&
          item.description.toLowerCase().includes(keyword)) ||
        (item.tags &&
          item.tags.some((tag) => tag.toLowerCase().includes(keyword))),
    );
  }

  // 搜索标签过滤
  if (searchTags.value.length > 0) {
    searchTags.value.forEach((tag) => {
      switch (tag.type) {
        case 'group': {
          results = results.filter((item) => item.group === tag.value);

          break;
        }
        case 'storage': {
          results = results.filter((item) => item.storage === tag.value);

          break;
        }
        case 'tag': {
          results = results.filter(
            (item) => item.tags && item.tags.includes(tag.value),
          );

          break;
        }
        case 'type': {
          results = results.filter((item) => item.type === tag.value);

          break;
        }
        // No default
      }
    });
  }

  // 排序
  if (currentSortType.value !== 'default') {
    results.sort((a, b) => {
      switch (currentSortType.value) {
        case 'name-asc': {
          return a.name.localeCompare(b.name);
        }
        case 'name-desc': {
          return b.name.localeCompare(a.name);
        }
        case 'size-asc': {
          return a.size - b.size;
        }
        case 'size-desc': {
          return b.size - a.size;
        }
        case 'time-asc': {
          return new Date(a.uploadTime) - new Date(b.uploadTime);
        }
        case 'time-desc': {
          return new Date(b.uploadTime) - new Date(a.uploadTime);
        }
        default: {
          return 0;
        }
      }
    });
  }

  return results;
});

const paginatedResources = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredResources.value.slice(start, end);
});

const hasUsageData = computed(() => {
  return (
    currentResource.value &&
    (currentResource.value.downloads ||
      currentResource.value.references ||
      currentResource.value.lastAccessed)
  );
});

// DOM引用
const tagInputRef = ref(null);
const versionHistorySection = ref(null);

// 生命周期钩子
onMounted(() => {
  fetchData();
  initResourceGroups();
});

// 监听器
watch(activeTabName, (newVal) => {
  console.log('activeTabName changed:', newVal)
  if (newVal === 'new') {
    showNewGroupDialog();
  }
  // 切换标签后重置页码
  currentPage.value = 1;
  fetchData()
});

watch(inputTagVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      tagInputRef.value?.focus();
    });
  }
});

// 初始化数据
const fetchData = async () => {
  loading.value = true;
  var params;
  try {
    const { value: activeTab } = activeTabName
    const { value: current } = currentPage
    const { value: size } = pageSize

    const params = {
      currentPage: current,
      pageSize: size,
      ...(!['new', 'all', 'uncategorized'].includes(activeTab) && { groupId: activeTab })
    }
    console.log('获取资源列表参数:', params)
    const response = await getFilesGroup(params);

    resources.value = response.records;
    currentPage.value = response.current;
    pageSize.value = response.size;
    totals.value = response.total;

  } catch (error) {
    console.error('获取资源列表失败:', error);
    ElMessage.error('获取资源列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const initResourceGroups = async () => {
  try {
    resourceGroups.value = await getResourceGroups();
  } catch (error) {
    console.error('获取资源分组失败:', error);
  }
};

// 工具方法
const formatFileSize = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFileTypeLabel = (type) => {
  const types = {
    Image: '图片',
    Video: '视频',
    Audio: '音频',
    Document: '文档',
    Other: '其他',
  };
  return types[type] || '未知';
};

const getFileTypeTagType = (type) => {
  const types = {
    Image: 'success',
    Video: 'warning',
    Audio: 'info',
    Document: 'primary',
    Other: '',
  };
  return types[type] || '';
};

const getFileTypeIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'Picture';
  if (mimeType.startsWith('video/')) return 'VideoCamera';
  if (mimeType.startsWith('audio/')) return 'Headset';
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  )
    return 'Document';
  return 'Files';
};

const getStorageName = (storageId) => {
  const storage = storagePolicies.value.find((p) => p.id === storageId);
  return storage ? storage.name : '未知';
};

const isPreviewableDocument = (resource) => {
  // 检查是否是可以在iframe中预览的文档类型
  const previewableExtensions = ['.pdf', '.txt', '.html', '.htm'];
  return (
    resource.type === 'Document' &&
    previewableExtensions.some((ext) =>
      resource.name.toLowerCase().endsWith(ext),
    )
  );
};

const getDocumentPreviewUrl = (resource) => {
  // 如果是PDF等可预览文档，返回预览URL
  if (resource.type === 'Document' && resource.url) {
    // 对于一些浏览器可以直接预览的文档类型，直接返回URL
    return resource.url;
  }
  // 如果需要特殊的预览服务，可以构建预览URL
  return `/api/preview?url=${encodeURIComponent(resource.url)}`;
};

// 事件处理函数
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return;

  // 添加搜索标签
  const newTag = {
    type: 'keyword',
    label: '关键词',
    value: searchKeyword.value.trim(),
  };

  // 避免重复添加相同的标签
  if (
    !searchTags.value.some(
      (tag) => tag.type === newTag.type && tag.value === newTag.value,
    )
  ) {
    searchTags.value.push(newTag);
  }

  searchKeyword.value = '';
  currentPage.value = 1;
};

const removeSearchTag = (tag) => {
  const index = searchTags.value.findIndex(
    (t) => t.type === tag.type && t.value === tag.value,
  );
  if (index !== -1) {
    searchTags.value.splice(index, 1);
  }
};

const handleTabChange = (tab) => {
  // tab切换的处理已在watch中处理
};

const handleSaveFilter = (command) => {
  currentStorageFilter.value = command;
  currentPage.value = 1;
};

const handleTypeFilter = (command) => {
  currentTypeFilter.value = command;
  currentPage.value = 1;
};

const handleSortChange = (command) => {
  currentSortType.value = command;
  currentPage.value = 1;
};

const handleSizeChange = async (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  await fetchData();
};

const handleCurrentChange =async (val) => {
  currentPage.value = val;
 await fetchData();
};

const handleUpload = () => {
  uploadDialogVisible.value = true;
  uploadFileList.value = [];
  uploadingFiles.value = [];

  // 重置上传选项
  uploadOptions.value = {
    storage:
      storagePolicies.value.length > 0 ? storagePolicies.value[0].id : '',
    group:
      activeTabName.value === 'all' ? 'uncategorized' : activeTabName.value,
    access: 'public',
    versionPolicy: 'new',
    versionTag: '',
    description: '',
  };
};

const beforeUpload = (file) => {
  // 可以在这里添加文件类型和大小的验证
  const isValidSize = file.size / 1024 / 1024 < 100; // 例如限制100MB

  if (!isValidSize) {
    ElMessage.error('文件大小不能超过100MB!');
    return false;
  }

  return true;
};

const handleFileChange = (file, fileList) => {
  uploadFileList.value = fileList;
};

const handleFileRemove = (file, fileList) => {
  uploadFileList.value = fileList;
  // 从上传中的文件列表中也移除
  const index = uploadingFiles.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    uploadingFiles.value.splice(index, 1);
  }
};

const customUpload = async ({ file }) => {

  const formData = new FormData()
  // 添加文件和其他参数
  formData.append('file', file.raw || file)
  formData.append('storage', uploadOptions.value.storage)
  formData.append('group', uploadOptions.value.group)
  formData.append('access', uploadOptions.value.access)
  formData.append('versionPolicy', uploadOptions.value.versionPolicy)
  formData.append('versionTag', uploadOptions.value.versionTag)
  formData.append('description', uploadOptions.value.description)

  const uploadingFile = uploadingFiles.value.find((f) => f.uid === file.uid);
  if (uploadingFile) {
    uploadingFile.status = 'uploading';
    uploadingFile.percentage = 0;

    try {
      const response = await requestClient.post('/ryu-files/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            uploadingFile.percentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            )
          }
        }
      })

      uploadingFile.percentage = 100
      uploadingFile.status = 'success'
    } catch (error) {
      uploadingFile.status = 'fail'
      ElMessage.error(`文件 ${file.name} 上传失败: ${error.message}`)
    }
  }
};

const submitUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择需要上传的文件');
    return;
  }

  uploading.value = true;

  try {
    // 复制文件列表到上传中文件列表
    uploadingFiles.value = uploadFileList.value.map((file) => ({
      ...file,
      percentage: 0,
      status: 'waiting',
    }));

    // 执行上传
    const uploadPromises = uploadFileList.value.map((file) => {
      return customUpload({ file: file.raw || file });
    });

    await Promise.all(uploadPromises);

    // 检查是否所有文件都上传成功
    const allSuccess = uploadingFiles.value.every(f => f.status === 'success')

    if (allSuccess) {
      ElMessage.success('所有文件上传成功');
      await fetchData();
      uploadDialogVisible.value = false;
    } else {
      ElMessage.warning('部分文件上传失败，请查看详情');
    }
  } catch (error) {
    console.error('批量上传失败:', error);
    ElMessage.error('上传过程中发生错误');
  } finally {
    uploading.value = false;
  }
};

const showStorageManagement = () => {
  storageManagementVisible.value = true;
};

const handleStoragePoliciesUpdate = (updatedPolicies) => {
  storagePolicies.value = updatedPolicies;
};

const handleResourceClick = (resource) => {
  // currentResource.value = JSON.parse(JSON.stringify(resource));
  // selectedVersionIndex.value = 0;
  // resourceDialogVisible.value = true;
  showPreview(resource) // 新增预览触发
};

const copyResourceUrl = (resource) => {
  navigator.clipboard
    .writeText(resource.filePath)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
};

const editResource = (resource) => {
  currentResource.value = JSON.parse(JSON.stringify(resource));
  selectedVersionIndex.value = 0;
  resourceDialogVisible.value = true;
};

const showVersions = (resource) => {
  currentResource.value = JSON.parse(JSON.stringify(resource));
  selectedVersionIndex.value = 0;
  resourceDialogVisible.value = true;

  // 滚动到版本历史部分
  nextTick(() => {
    scrollToVersionHistory();
  });
};

const deleteResource = (resource) => {
  ElMessageBox.confirm('确定要删除此资源吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // 这里替换为实际的删除API调用
        await deleteResourceFromAPI(resource.id);

        ElMessage.success('资源已成功删除');

        // 刷新资源列表
        await fetchData();

        // 如果是在详情对话框中删除，关闭对话框
        if (resourceDialogVisible.value) {
          resourceDialogVisible.value = false;
        }
      } catch (error) {
        console.error('删除资源失败:', error);
        ElMessage.error('删除资源失败，请稍后重试');
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

const downloadResource = (resource) => {
  // 创建一个临时链接并触发下载
  const link = document.createElement('a');
  link.href = resource.url;
  link.download = resource.name;
  document.body.append(link);
  link.click();
  link.remove();

  // 记录下载次数
  trackResourceDownload(resource.id);
};

const saveResourceChanges = async () => {
  if (!currentResource.value) return;

  try {
    // 这里替换为实际的更新API调用
    await updateResourceFromAPI(currentResource.value);

    ElMessage.success('资源更新成功');

    // 刷新资源列表
    await fetchData();

    // 关闭对话框
    resourceDialogVisible.value = false;
  } catch (error) {
    console.error('更新资源失败:', error);
    ElMessage.error('更新资源失败，请稍后重试');
  }
};

// 标签相关操作
const showTagInput = () => {
  inputTagVisible.value = true;
};

const handleInputConfirm = () => {
  if (inputTagValue.value && currentResource.value) {
    if (!currentResource.value.tags) {
      currentResource.value.tags = [];
    }

    if (!currentResource.value.tags.includes(inputTagValue.value)) {
      currentResource.value.tags.push(inputTagValue.value);
    }
  }

  inputTagVisible.value = false;
  inputTagValue.value = '';
};

const removeTag = (tag) => {
  if (currentResource.value && currentResource.value.tags) {
    const index = currentResource.value.tags.indexOf(tag);
    if (index !== -1) {
      currentResource.value.tags.splice(index, 1);
    }
  }
};

const showPreview = (resource) => {
  previewResource.value = resource
  previewDialogVisible.value = true
}
// 在组件卸载时清除预览URL
onBeforeUnmount(() => {
  if (previewResource.value?.url.startsWith('blob:')) {
    URL.revokeObjectURL(previewResource.value.url)
  }
})

// 分组相关操作
const showNewGroupDialog = () => {
  activeTabName.value =
    activeTabName.value === 'new' ? 'all' : activeTabName.value;
  newGroupDialogVisible.value = true;
  newGroupForm.value = {
    name: '',
    description: '',
  };
};

const createNewGroup = async () => {
  if (!newGroupForm.value.name.trim()) {
    ElMessage.warning('分组名称不能为空');
    return;
  }

  try {
    // 这里替换为实际的API调用
    const response = await createGroupFromAPI(newGroupForm.value);
    const newGroup = response?.data || {
      id: `group-${Date.now()}`,
      name: newGroupForm.value.name,
      description: newGroupForm.value.description,
    };

    resourceGroups.value.push(newGroup);
    ElMessage.success('分组创建成功');

    // 关闭对话框并切换到新分组
    newGroupDialogVisible.value = false;
    activeTabName.value = newGroup.id;
  } catch (error) {
    console.error('创建分组失败:', error);
    ElMessage.error('创建分组失败，请稍后重试');
  }
};

// 版本相关操作
const switchVersion = (index) => {
  if (!currentResource.value || !currentResource.value.versions) return;

  selectedVersionIndex.value = index;
  const version = currentResource.value.versions[index];

  // 更新当前资源的URL为选择的版本URL
  if (version && version.url) {
    currentResource.value.previewUrl = version.url;
  }
};

const scrollToVersionHistory = () => {
  nextTick(() => {
    versionHistorySection.value?.scrollIntoView({ behavior: 'smooth' });
  });
};

const uploadNewVersion = () => {
  if (!currentResource.value) return;

  versionFileList.value = [];
  versionForm.value = {
    tag: `v${(currentResource.value.versions?.length || 0) + 1}`,
    description: '',
  };

  newVersionDialogVisible.value = true;
};

const beforeUploadVersion = (file) => {
  // 检查文件类型是否与当前资源匹配
  if (currentResource.value) {
    // 文件类型验证逻辑
  }

  // 文件大小验证
  const isValidSize = file.size / 1024 / 1024 < 100; // 例如限制100MB

  if (!isValidSize) {
    ElMessage.error('文件大小不能超过100MB!');
    return false;
  }

  return true;
};

const handleVersionFileChange = (file, fileList) => {
  versionFileList.value = fileList.slice(-1); // 只保留最新的一个文件
};

const uploadVersionFile = async ({ file }) => {
  if (!currentResource.value || !file) return;

  uploadingVersion.value = true;

  try {
    // 这里替换为实际的上传API调用
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceId', currentResource.value.id);
    formData.append('tag', versionForm.value.tag);
    formData.append('description', versionForm.value.description);

    await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟上传

    // 更新资源列表
    await fetchData();

    // 刷新当前资源详情
    const updatedResource = resources.value.find(
      (r) => r.id === currentResource.value.id,
    );
    if (updatedResource) {
      currentResource.value = JSON.parse(JSON.stringify(updatedResource));
      selectedVersionIndex.value = 0; // 切换到最新版本
    }

    ElMessage.success('新版本上传成功');
    newVersionDialogVisible.value = false;
  } catch (error) {
    console.error('上传新版本失败:', error);
    ElMessage.error('上传新版本失败，请稍后重试');
  } finally {
    uploadingVersion.value = false;
  }
};

const submitNewVersion = () => {
  if (versionFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }

  uploadVersionFile({ file: versionFileList.value[0].raw });
};

const downloadVersion = (version) => {
  if (!version || !version.url) return;

  const link = document.createElement('a');
  link.href = version.url;
  link.download = version.name || currentResource.value.name;
  document.body.append(link);
  link.click();
  link.remove();
};

const copyVersionUrl = (version) => {
  if (!version || !version.url) return;

  navigator.clipboard
    .writeText(version.url)
    .then(() => {
      ElMessage.success('版本链接已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
};

const deleteVersion = (version, index) => {
  if (!currentResource.value || !version) return;

  ElMessageBox.confirm('确定要删除此版本吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // 这里替换为实际的删除API调用
        await deleteVersionFromAPI(currentResource.value.id, version.id);

        ElMessage.success('版本已成功删除');

        // 刷新资源列表
        await fetchData();

        // 刷新当前资源详情
        const updatedResource = resources.value.find(
          (r) => r.id === currentResource.value.id,
        );
        if (updatedResource) {
          currentResource.value = JSON.parse(JSON.stringify(updatedResource));
          selectedVersionIndex.value = 0; // 重置到最新版本
        }
      } catch (error) {
        console.error('删除版本失败:', error);
        ElMessage.error('删除版本失败，请稍后重试');
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// API 模拟函数
const fetchResourcesFromAPI = async () => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockResources() });
    }, 300);
  });
};

const fetchStoragePoliciesFromAPI = async () => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockStoragePolicies() });
    }, 200);
  });
};

const fetchResourceGroupsFromAPI = async () => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockResourceGroups() });
    }, 200);
  });
};

const updateResourceFromAPI = async (resource) => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

const deleteResourceFromAPI = async (resourceId) => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

const deleteVersionFromAPI = async (resourceId, versionId) => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

const createGroupFromAPI = async (groupData) => {
  // 实际项目中替换为真实API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          id: `group-${Date.now()}`,
          name: groupData.name,
          description: groupData.description,
        },
      });
    }, 300);
  });
};

const trackResourceDownload = async (resourceId) => {
  // 实际项目中替换为真实API调用
  console.log('记录下载:', resourceId);
};

// 模拟数据
const mockResources = () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: '1',
      name: 'sample-image.jpg',
      type: 'image',
      url: 'https://example.com/sample-image.jpg',
      size: 1024 * 1024 * 2.5, // 2.5MB
      uploadTime: now.toISOString(),
      storage: 'local',
      group: 'uncategorized',
      tags: ['示例', '图片'],
      description: '这是一张示例图片',
      versions: [
        {
          id: 'v1',
          url: 'https://example.com/sample-image.jpg',
          tag: 'v1.0',
          createTime: now.toISOString(),
          size: 1024 * 1024 * 2.5,
          author: '张三',
        },
      ],
      downloads: 15,
      references: 3,
      lastAccessed: yesterday.toISOString(),
    },
    {
      id: '2',
      name: 'presentation.pdf',
      type: 'document',
      url: 'https://example.com/presentation.pdf',
      size: 1024 * 1024 * 5, // 5MB
      uploadTime: yesterday.toISOString(),
      storage: 'oss',
      group: 'documents',
      tags: ['文档', 'PDF'],
      description: '项目演示文档',
      versions: [
        {
          id: 'v2',
          url: 'https://example.com/presentation.pdf',
          tag: 'v2.0',
          createTime: yesterday.toISOString(),
          size: 1024 * 1024 * 5,
          author: '李四',
        },
      ],
    },
    // 可以继续添加更多示例资源...
  ];
};

const mockStoragePolicies = () => {
  return [
    {
      id: 'local',
      name: '本地存储',
      type: 'local',
      config: {
        path: '/data/uploads',
      },
    },
    {
      id: 'oss',
      name: '阿里云OSS',
      type: 'oss',
      config: {
        region: 'oss-cn-beijing',
        bucket: 'my-bucket',
      },
    },
    {
      id: 'cos',
      name: '腾讯云COS',
      type: 'cos',
      config: {
        region: 'ap-beijing',
        bucket: 'my-bucket',
      },
    },
  ];
};

// 工具函数
const getFileTypeFromMime = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  )
    return 'document';
  return 'other';
};

const generateResourceId = () => {
  return `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const generateVersionId = () => {
  return `version-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

// API模拟函数
const uploadFileToStorage = async (file, options) => {
  // 模拟文件上传过程
  return new Promise((resolve) => {
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      resolve({
        url,
        size: file.size,
        type: getFileTypeFromMime(file.type),
      });
    }, 1500);
  });
};

const createResourceInDB = async (fileInfo, options) => {
  // 模拟创建资源记录
  const resource = {
    id: generateResourceId(),
    name: fileInfo.name,
    type: fileInfo.type,
    url: fileInfo.url,
    size: fileInfo.size,
    uploadTime: new Date().toISOString(),
    storage: options.storage,
    group: options.group,
    description: options.description,
    tags: [],
    versions: [
      {
        id: generateVersionId(),
        url: fileInfo.url,
        tag: 'v1.0',
        createTime: new Date().toISOString(),
        size: fileInfo.size,
        author: '当前用户',
      },
    ],
    access: options.access,
  };

  return resource;
};

// 导出所需的变量和函数
defineExpose({
  refreshResources: fetchData,
});
</script>

<template>
  <div class="resource-manager">
    <!-- 优化的顶部工具栏 - 所有元素在一行 -->
    <div class="toolbar">
      <div class="toolbar-main">
        <!-- 搜索框移到最左边 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            class="search-input"
            clearable
            placeholder="搜索文件名、描述或标签..."
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- 左侧工具区域移到中间 -->
        <div class="action-tools">
          <el-button class="upload-btn" type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>上传资源
          </el-button>
          <el-button class="storage-btn" @click="showStorageManagement">
            <el-icon><Setting /></el-icon>存储策略
          </el-button>
        </div>

        <!-- 右侧工具区域 -->
        <div class="right-tools">
          <el-dropdown trigger="click" @command="handleSaveFilter">
            <el-button class="filter-btn">
              存储策略: <span>{{ currentStorageLabel }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="all">全部</el-dropdown-item>
                <el-dropdown-item
                  v-for="policy in storagePolicies"
                  :key="policy.id"
                  :command="policy.id"
                >
                  {{ policy.strategyName }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click" @command="handleTypeFilter">
            <el-button class="filter-btn">
              类型: <span>{{ currentTypeLabel }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="all">全部</el-dropdown-item>
                <el-dropdown-item command="image">图片</el-dropdown-item>
                <el-dropdown-item command="video">视频</el-dropdown-item>
                <el-dropdown-item command="audio">音频</el-dropdown-item>
                <el-dropdown-item command="document">文档</el-dropdown-item>
                <el-dropdown-item command="other">其他</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click" @command="handleSortChange">
            <el-button class="filter-btn">
              排序: <span>{{ currentSortLabel }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="default">默认</el-dropdown-item>
                <el-dropdown-item command="time-desc">
                  上传时间 ↓
                </el-dropdown-item>
                <el-dropdown-item command="time-asc">
                  上传时间 ↑
                </el-dropdown-item>
                <el-dropdown-item command="name-asc">
                  文件名 A-Z
                </el-dropdown-item>
                <el-dropdown-item command="name-desc">
                  文件名 Z-A
                </el-dropdown-item>
                <el-dropdown-item command="size-desc">
                  文件大小 ↓
                </el-dropdown-item>
                <el-dropdown-item command="size-asc">
                  文件大小 ↑
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-radio-group v-model="viewMode" class="view-mode">
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 搜索标签显示 -->
      <div v-if="searchTags.length > 0" class="search-tags">
        <el-tag
          v-for="tag in searchTags"
          :key="tag.value"
          class="search-tag"
          closable
          @close="removeSearchTag(tag)"
        >
          {{ tag.label }}: {{ tag.value }}
        </el-tag>
      </div>
    </div>

    <!-- 优化的资源分类导航 - 更靠上 -->
    <div class="resource-tabs">
      <el-tabs
        v-model="activeTabName"
        class="custom-tabs"
        @tab-click="handleTabChange"
      >
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未分组" name="uncategorized" />
        <el-tab-pane
          v-for="group in resourceGroups"
          :key="group.id"
          :label="group.groupName"
          :name="group.id"
        />
        <el-tab-pane name="new">
          <template #label>
            <el-icon><Plus /></el-icon> 新建分组
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 资源展示区域 -->
    <div v-loading="loading" class="resource-content">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="resource-grid">
        <el-empty
          v-if="filteredResources.length === 0"
          description="没有找到资源"
        />
        <div
          v-for="resource in filteredResources"
          v-else
          :key="resource.id"
          class="resource-item"
          @click="handleResourceClick(resource)"
        >
          <!-- 图片预览 -->
          <div
            :class="{ 'is-video': resource.fileType === 'video' }"
            class="resource-preview"
          >
            <img
              v-if="resource.fileType === 'Image'"
              :alt="resource.fileName"
              :src="resource.filePath"
            />
            <div v-else-if="resource.fileType === 'Video'" class="video-preview">
              <video :src="resource.filePath" controls="false"></video>
              <div class="play-indicator">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <div v-else class="file-icon">
              <el-icon v-if="resource.fileType === 'Audio'"><Headset /></el-icon>
              <el-icon v-else-if="resource.fileType === 'document'">
                <Document />
              </el-icon>
              <el-icon v-else><Files /></el-icon>
            </div>
          </div>

          <!-- 资源信息 -->
          <div class="resource-info">
            <div :title="resource.fileName" class="resource-name">
              {{ resource.fileName }}
            </div>
<!--            <div class="resource-meta">-->
<!--              <span class="resource-size">{{-->
<!--                formatFileSize(resource.size)-->
<!--              }}</span>-->
<!--              <span class="resource-time">{{-->
<!--                formatDate(resource.uploadTime)-->
<!--              }}</span>-->
<!--            </div>-->
<!--            &lt;!&ndash; 版本标记 &ndash;&gt;-->
<!--            <div-->
<!--              v-if="resource.versions && resource.versions.length > 1"-->
<!--              class="version-badge"-->
<!--            >-->
<!--              <el-tag size="small" type="info">-->
<!--                v{{ resource.versions.length }}-->
<!--              </el-tag>-->
<!--            </div>-->
          </div>

          <!-- 优化的资源操作按钮 - 悬浮显示 -->
          <div class="resource-actions">
            <el-tooltip :show-after="300" content="复制链接" placement="top">
              <el-button
                circle
                size="small"
                @click.stop="copyResourceUrl(resource)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :show-after="300" content="编辑资源" placement="top">
              <el-button
                circle
                size="small"
                type="primary"
                @click.stop="editResource(resource)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="resource.versions && resource.versions.length > 1"
              :show-after="300"
              content="查看版本"
              placement="top"
            >
              <el-button
                circle
                size="small"
                type="info"
                @click.stop="showVersions(resource)"
              >
                <el-icon><MoreFilled /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :show-after="300" content="删除资源" placement="top">
              <el-button
                circle
                size="small"
                type="danger"
                @click.stop="deleteResource(resource)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="resource-list">
        <el-table
          :data="filteredResources"
          border
          highlight-current-row
          stripe
          style="width: 100%"
          @row-click="handleResourceClick"
        >
          <el-table-column label="预览" width="80">
            <template #default="{ row }">
              <div class="table-preview">
                <img
                  v-if="row.fileType === 'Image'"
                  :alt="row.fileName"
                  :src="row.filePath"
                />
                <el-icon v-else-if="row.fileType === 'video'">
                  <VideoCamera />
                </el-icon>
                <el-icon v-else-if="row.fileType === 'audio'"><Headset /></el-icon>
                <el-icon v-else-if="row.fileType === 'document'">
                  <Document />
                </el-icon>
                <el-icon v-else><Files /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="文件名"
            min-width="200"
            prop="fileName"
            show-overflow-tooltip
          />
          <el-table-column label="类型" prop="type" width="100">
            <template #default="{ row }">
              <el-tag :type="getFileTypeTagType(row.fileType)">
                {{ getFileTypeLabel(row.fileType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" prop="size" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column label="上传时间" prop="uploadTime" width="180">
            <template #default="{ row }">
              {{ formatDate(row.uploadTime) }}
            </template>
          </el-table-column>
          <el-table-column label="存储策略" prop="storage" width="150">
            <template #default="{ row }">
              {{ getStorageName(row.storage) }}
            </template>
          </el-table-column>
          <el-table-column label="版本" width="80">
            <template #default="{ row }">
              <el-tag
                v-if="row.versions && row.versions.length > 0"
                size="small"
                type="info"
              >
                v{{ row.versions.length }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="250">
            <template #default="{ row }">
              <el-button-group>
                <el-tooltip
                  :show-after="300"
                  content="复制链接"
                  placement="top"
                >
                  <el-button size="small" @click.stop="copyResourceUrl(row)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  :show-after="300"
                  content="编辑资源"
                  placement="top"
                >
                  <el-button
                    size="small"
                    type="primary"
                    @click.stop="editResource(row)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  :show-after="300"
                  content="查看版本"
                  placement="top"
                >
                  <el-button
                    :disabled="!row.versions || row.versions.length <= 1"
                    size="small"
                    type="info"
                    @click.stop="showVersions(row)"
                  >
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  :show-after="300"
                  content="删除资源"
                  placement="top"
                >
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="deleteResource(row)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页器 - 调整到左下角 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 40, 80, 100]"
        :total="totals"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 优化的上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      class="upload-dialog"
      destroy-on-close
      title="上传资源"
      top="5vh"
      width="70%"
    >
      <div class="upload-container">
        <div class="upload-area">
          <el-upload
            :auto-upload="false"
            :before-upload="beforeUpload"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            class="resource-uploader"
            :http-request=customUpload
            drag
            multiple
          >
            <div class="upload-content">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                <h3>拖拽文件到此处或 <em>点击上传</em></h3>
                <p>支持单个或批量上传</p>
              </div>
            </div>
          </el-upload>

          <div v-if="uploadingFiles.length > 0" class="upload-progress">
            <div
              v-for="file in uploadingFiles"
              :key="file.uid"
              class="upload-file-item"
            >
              <div class="file-info">
                <el-icon v-if="getFileTypeIcon(file.raw.type)">
                  <component :is="getFileTypeIcon(file.raw.type)" />
                </el-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
              </div>
              <el-progress
                :percentage="file.percentage || 0"
                :status="file.status === 'fail' ? 'exception' : ''"
              />
            </div>
          </div>
        </div>

        <div class="upload-options">
          <h3>上传设置</h3>
          <el-form class="upload-form" label-width="100px">
            <el-form-item label="存储策略">
              <el-select
                v-model="uploadOptions.storage"
                placeholder="请选择存储策略"
              >
                <el-option
                  v-for="policy in storagePolicies"
                  :key="policy.id"
                  :label="policy.strategyName"
                  :value="policy.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="文件分组">
              <el-select v-model="uploadOptions.group" placeholder="请选择分组">
                <el-option label="未分组" value="uncategorized" />
                <el-option
                  v-for="group in resourceGroups"
                  :key="group.id"
                  :label="group.groupName"
                  :value="group.id"
                />
                <el-option label="+ 新建分组" value="new" />
              </el-select>
            </el-form-item>

            <el-form-item label="权限设置">
              <el-radio-group v-model="uploadOptions.access">
                <el-radio label="read">公开</el-radio>
                <el-radio label="write">私有</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="文件版本">
              <el-radio-group v-model="uploadOptions.versionPolicy">
                <el-radio label="new">作为新文件</el-radio>
                <el-radio label="replace">替换同名文件</el-radio>
                <el-radio label="version">创建新版本</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="uploadOptions.versionPolicy === 'version'"
              label="标签"
            >
              <el-input
                v-model="uploadOptions.versionTag"
                placeholder="输入版本标签，例如: v1.0.1"
              />
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="uploadOptions.description"
                placeholder="输入文件描述信息（可选）"
                rows="3"
                type="textarea"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button
            :disabled="uploadFileList.length === 0"
            :loading="uploading"
            type="primary"
            @click="submitUpload"
          >
            开始上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 完全优化的资源详情/编辑对话框 -->
    <el-dialog
      v-model="resourceDialogVisible"
      :title="currentResource ? '资源详情' : ''"
      class="resource-dialog"
      destroy-on-close
      fullscreen
      top="3vh"
      width="80%"
    >
      <div v-if="currentResource" class="resource-detail">
        <!-- 添加返回按钮和操作顶栏 -->
        <div class="resource-detail-header">
          <div class="resource-header-title">
            <h2>{{ currentResource.fileName }}</h2>
            <el-tag
              :type="getFileTypeTagType(currentResource.fileType)"
              class="resource-type-tag"
            >
              {{ getFileTypeLabel(currentResource.fileType) }}
            </el-tag>
          </div>
          <div class="resource-header-actions">
            <el-button-group>
              <el-button size="small" @click="copyResourceUrl(currentResource)">
                <el-icon><CopyDocument /></el-icon> 复制链接
              </el-button>
              <el-button
                size="small"
                type="success"
                @click="downloadResource(currentResource)"
              >
                <el-icon><Download /></el-icon> 下载
              </el-button>
              <el-button size="small" type="warning" @click="uploadNewVersion">
                <el-icon><Upload /></el-icon> 上传新版本
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteResource(currentResource)"
              >
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </el-button-group>
          </div>
        </div>

        <div class="resource-detail-container">
          <!-- 左侧预览区域 - 优化显示 -->
          <div class="resource-preview-panel">
            <div
              :class="{ 'image-preview': currentResource.fileType === 'Image' }"
              class="resource-preview-large"
            >
              <img
                v-if="currentResource.fileType === 'Image'"
                :alt="currentResource.fileName"
                :src="currentResource.filePath"
              />
              <video
                v-else-if="currentResource.fileType === 'Video'"
                :src="currentResource.filePath"
                autoplay
                class="video-player"
                controls
              ></video>
              <audio
                v-else-if="currentResource.fileType === 'Audio'"
                :src="currentResource.filePath"
                class="audio-player"
                controls
              ></audio>
              <div
                v-else-if="
                  currentResource.fileType === 'Document' &&
                  isPreviewableDocument(currentResource)
                "
                class="document-preview"
              >
                <iframe
                  :src="getDocumentPreviewUrl(currentResource)"
                  frameborder="0"
                ></iframe>
              </div>
              <div v-else class="file-preview">
                <el-icon><Document /></el-icon>
                <span>{{ currentResource.fileName }}</span>
                <el-button
                  type="primary"
                  @click="downloadResource(currentResource)"
                >
                  <el-icon><Download /></el-icon> 下载文件
                </el-button>
              </div>
            </div>

            <!-- 版本选择器 - 优化显示 -->
            <div
              v-if="
                currentResource.versions && currentResource.versions.length > 1
              "
              class="version-selector"
            >
              <div class="version-selector-header">
                <h3>版本切换</h3>
                <el-tooltip content="版本历史" placement="top">
                  <el-button
                    class="version-history-link"
                    type="text"
                    @click="scrollToVersionHistory"
                  >
                    查看完整版本历史 <el-icon><ArrowDown /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              <el-radio-group
                v-model="selectedVersionIndex"
                size="small"
                @change="switchVersion"
              >
                <el-radio-button
                  v-for="(version, index) in currentResource.versions"
                  :key="index"
                  :label="index"
                >
                  {{ version.tag || `版本 ${index + 1}` }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- 右侧详情表单 - 添加分组和选项卡 -->
          <div class="resource-info-panel">
            <el-tabs class="resource-detail-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <el-form class="resource-form" label-width="100px">
                  <el-form-item label="文件名">
                    <el-input v-model="currentResource.fileName" />
                  </el-form-item>

                  <el-form-item label="URL">
                    <el-input v-model="currentResource.filePath" readonly>
                      <template #append>
                        <el-button @click="copyResourceUrl(currentResource)">
                          复制
                        </el-button>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="存储策略">
                    <el-select v-model="currentResource.storage">
                      <el-option
                        v-for="policy in storagePolicies"
                        :key="policy.id"
                        :label="policy.strategyName"
                        :value="policy.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="文件类型">
                    <el-tag :type="getFileTypeTagType(currentResource.type)">
                      {{ getFileTypeLabel(currentResource.fileType) }}
                    </el-tag>
                  </el-form-item>

                  <el-form-item label="文件大小">
                    {{ formatFileSize(currentResource.fileSize) }}
                  </el-form-item>

                  <el-form-item label="创建时间">
                    {{ formatDate(currentResource.uploadTime) }}
                  </el-form-item>

                  <el-form-item
                    v-if="currentResource.lastModified"
                    label="最后修改"
                  >
                    {{ formatDate(currentResource.lastModified) }}
                  </el-form-item>

                  <el-form-item label="分组">
                    <el-select v-model="currentResource.group">
                      <el-option label="未分组" value="uncategorized" />
                      <el-option
                        v-for="group in resourceGroups"
                        :key="group.id"
                        :label="group.groupName"
                        :value="group.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="权限设置">
                    <el-radio-group v-model="currentResource.access">
                      <el-radio label="public">公开</el-radio>
                      <el-radio label="private">私有</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="标签与描述" name="tags">
                <el-form class="resource-form" label-width="100px">
                  <el-form-item label="标签">
                    <div class="tag-container">
                      <el-tag
                        v-for="tag in currentResource.tags"
                        :key="tag"
                        class="resource-tag"
                        closable
                        @close="removeTag(tag)"
                      >
                        {{ tag }}
                      </el-tag>
                      <el-input
                        v-if="inputTagVisible"
                        ref="tagInputRef"
                        v-model="inputTagValue"
                        class="tag-input"
                        size="small"
                        @blur="handleInputConfirm"
                        @keyup.enter="handleInputConfirm"
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

                  <el-form-item label="描述">
                    <el-input
                      v-model="currentResource.description"
                      placeholder="输入资源描述信息..."
                      rows="6"
                      type="textarea"
                    />
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane v-if="hasUsageData" label="使用情况" name="usage">
                <div class="usage-stats">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-statistic
                        :value="currentResource.downloads || 0"
                        title="总下载次数"
                      />
                    </el-col>
                    <el-col :span="8">
                      <el-statistic
                        :value="currentResource.references || 0"
                        title="链接引用"
                      />
                    </el-col>
                    <el-col :span="8">
                      <el-statistic
                        :value="formatDate(currentResource.lastAccessed)"
                        title="上次访问"
                      />
                    </el-col>
                  </el-row>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 优化的版本历史区域 -->
        <div
          v-if="currentResource.versions && currentResource.versions.length > 0"
          ref="versionHistorySection"
          class="version-history"
        >
          <div class="version-history-header">
            <h3>版本历史</h3>
            <el-button size="small" type="primary" @click="uploadNewVersion">
              <el-icon><Upload /></el-icon> 上传新版本
            </el-button>
          </div>

          <el-timeline class="version-timeline">
            <el-timeline-item
              v-for="(version, index) in currentResource.versions"
              :key="index"
              :hollow="index !== selectedVersionIndex"
              :timestamp="formatDate(version.createTime)"
              :type="index === selectedVersionIndex ? 'primary' : ''"
            >
              <div
                :class="{ 'active-version': selectedVersionIndex === index }"
                class="version-timeline-item"
              >
                <div class="version-timeline-content">
                  <div class="version-info">
                    <h4>
                      {{ version.tag || `版本 ${index + 1}` }}
                      <el-tag v-if="index === 0" size="small" type="success">
                        最新
                      </el-tag>
                    </h4>
                    <p v-if="version.description" class="version-description">
                      {{ version.description }}
                    </p>
                    <div class="version-meta">
                      <span class="version-size">
                        大小: {{ formatFileSize(version.size) }}</span>
                      <span v-if="version.author" class="version-author">上传者: {{ version.author }}</span>
                    </div>
                  </div>

                  <div class="version-actions">
                    <el-tooltip content="预览此版本" placement="top">
                      <el-button
                        :type="selectedVersionIndex === index ? 'primary' : ''"
                        circle
                        size="small"
                        @click="switchVersion(index)"
                      >
                        <el-icon><View /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="下载此版本" placement="top">
                      <el-button
                        circle
                        size="small"
                        @click="downloadVersion(version)"
                      >
                        <el-icon><Download /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="复制此版本链接" placement="top">
                      <el-button
                        circle
                        size="small"
                        @click="copyVersionUrl(version)"
                      >
                        <el-icon><CopyDocument /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip
                      v-if="
                        index !== 0 || currentResource.versions.length === 1
                      "
                      content="删除此版本"
                      placement="top"
                    >
                      <el-button
                        circle
                        size="small"
                        type="danger"
                        @click="deleteVersion(version, index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resourceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveResourceChanges"
            >保存更改</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 存储策略管理对话框 -->
    <StorageManagement
      v-model:visible="storageManagementVisible"
      @update:policies="handleStoragePoliciesUpdate"
    />

    <!-- 新建分组对话框 -->
    <el-dialog
      v-model="newGroupDialogVisible"
      destroy-on-close
      title="新建分组"
      width="500px"
    >
      <el-form :model="newGroupForm" label-width="80px">
        <el-form-item label="分组名称" required>
          <el-input v-model="newGroupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="newGroupForm.description"
            placeholder="分组说明（可选）"
            rows="3"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewGroup">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传新版本对话框 -->
    <el-dialog
      v-model="newVersionDialogVisible"
      destroy-on-close
      title="上传新版本"
      width="500px"
    >
      <div class="new-version-upload">
        <el-upload
          :auto-upload="false"
          :before-upload="beforeUploadVersion"
          :file-list="versionFileList"
          :http-request="uploadVersionFile"
          :limit="1"
          :on-change="handleVersionFileChange"
          action="#"
          class="version-uploader"
          drag
        >
          <div class="upload-content">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              <h3>拖拽文件到此处或 <em>点击上传</em></h3>
              <p>请选择新的版本文件</p>
            </div>
          </div>
        </el-upload>

        <el-form :model="versionForm" class="version-form" label-width="100px">
          <el-form-item label="版本标签">
            <el-input
              v-model="versionForm.tag"
              placeholder="输入版本标签，例如: v1.0.1"
            />
          </el-form-item>
          <el-form-item label="版本说明">
            <el-input
              v-model="versionForm.description"
              placeholder="描述此版本的更改（可选）"
              rows="3"
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newVersionDialogVisible = false">取消</el-button>
          <el-button
            :disabled="versionFileList.length === 0"
            :loading="uploadingVersion"
            type="primary"
            @click="submitNewVersion"
          >
            上传新版本
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 资源预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewResource ? previewResource.name : '资源预览'"
      destroy-on-close
      width="70%"
    >
      <div v-if="previewResource" class="resource-preview-dialog">
        <div class="preview-content">
          <img
            v-if="previewResource.fileType === 'Image'"
            :alt="previewResource.fileName"
            :src="previewResource.filePath"
            class="image-preview-full"
          />
          <video
            v-else-if="previewResource.fileType === 'Video'"
            :src="previewResource.filePath"
            autoplay
            class="video-preview-full"
            controls
          ></video>
          <audio
            v-else-if="previewResource.fileType === 'Audio'"
            :src="previewResource.filePath"
            class="audio-preview-full"
            controls
          ></audio>
          <div
            v-else-if="
              previewResource.fileType === 'Document' &&
              isPreviewableDocument(previewResource)
            "
            class="document-preview-full"
          >
            <iframe
              :src="getDocumentPreviewUrl(previewResource)"
              frameborder="0"
            ></iframe>
          </div>
          <div v-else class="file-preview-full">
            <el-icon><Document /></el-icon>
            <p>此文件类型无法预览</p>
            <el-button
              type="primary"
              @click="downloadResource(previewResource)"
            >
              <el-icon><Download /></el-icon> 下载文件
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<style scoped>
/* Base styling and color scheme */
:root {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  --bg-color: #1e1e2d;
  --card-bg: #2a2a3c;
  --border-color: #363645;
  --text-color: #e9e9e9;
  --text-secondary: #b0b0b0;
  --hover-color: #32324a;
}

/* Main container */
.resource-manager {
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
}

/* Toolbar styling */
.toolbar {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.toolbar-main {
  display: flex;
  align-items: center;
  gap: 20px; /* Reduce gap between elements to bring upload button closer to search */
}

/* Search box styling */
.search-box {
  flex: 1;
  max-width: 600px;
}

/* Make search input background darker */
.search-input .el-input__inner {
  background-color: var(--bg-color) !important;
  border-color: var(--border-color) !important;
  color: var(--text-color) !important;
}

.search-icon {
  color: var(--text-secondary);
}

/* Action tools - centered */
.action-tools {
  display: flex;
  gap: 10px;
}

.upload-btn,
.storage-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Right tools - filtering and view options */
.right-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: auto;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: var(--bg-color);
  border-color: var(--border-color);
  color: var(--text-color);
}

.view-mode {
  border-color: var(--border-color);
}

.view-mode .el-radio-button__inner {
  background-color: var(--bg-color);
  border-color: var(--border-color);
  color: var(--text-color);
}

.view-mode .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* Search tags */
.search-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  margin-right: 0;
}

/* Resource tabs */
.resource-tabs {
  background-color: var(--card-bg);
  padding: 0 16px;
}

.custom-tabs .el-tabs__nav-wrap::after {
  background-color: var(--border-color);
}

.custom-tabs .el-tabs__item {
  color: var(--text-secondary);
}

.custom-tabs .el-tabs__item.is-active {
  color: var(--primary-color);
}

/* Main content area */
.resource-content {
  flex: 1;
  padding: 16px;
  background-color: var(--bg-color);
  min-height: 500px;
  overflow: hidden;
}

/* Grid view */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.resource-item {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
  border: 1px solid var(--border-color);
}

.resource-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.resource-preview {
  height: 180px; /* 增加预览区域高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  overflow: hidden;
  position: relative;
  padding: 0; /* 移除内边距 */
}

.resource-preview img {
  width: 100%; /* 改为100%宽度 */
  height: 100%; /* 改为100%高度 */
  object-fit: cover; /* 保持比例填充容器 */
  transition: transform 0.3s ease; /* 添加缩放动画 */
}
.resource-item:hover img {
  transform: scale(1.05); /* 悬停时轻微放大 */
}
.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 10px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  font-size: 48px;
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: var(--bg-color);
}

.resource-info {
  padding: 12px;
  position: relative;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); /* 添加渐变遮罩 */
}

.resource-name {
  font-weight: 500;
  font-size: 0.9em; /* 缩小字体 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
  color: #fff; /* 白色字体 */
  text-shadow: 0 1px 3px rgba(0,0,0,0.3); /* 添加文字阴影 */
  font-family: 'Segoe UI', system-ui, sans-serif; /* 使用现代字体 */
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.version-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}

.resource-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
  gap: 5px;
  background-color: rgba(42, 42, 60, 0.8);
  border-radius: 4px;
  padding: 5px;
}

.resource-item:hover .resource-actions {
  display: flex;
}

/* List view */
.resource-list {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
}

/* Override el-table styles for dark theme */
.el-table {
  background-color: var(--card-bg) !important;
  color: var(--text-color) !important;
}

.el-table th {
  background-color: var(--bg-color) !important;
  color: var(--text-color) !important;
  border-bottom-color: var(--border-color) !important;
}

.el-table td {
  border-bottom-color: var(--border-color) !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: var(--hover-color) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: var(--hover-color) !important;
}

.table-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
}

.table-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.table-preview i {
  font-size: 24px;
  color: var(--text-secondary);
}

/* Pagination - position at left bottom */
.pagination {
  padding: 16px;
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-start; /* Align to left */
  margin-top: auto; /* Push to bottom */
}

/* Override pagination styles for dark theme */
.el-pagination {
  --el-pagination-bg-color: var(--bg-color) !important;
  --el-pagination-text-color: var(--text-color) !important;
  --el-pagination-button-color: var(--text-secondary) !important;
  --el-pagination-button-bg-color: var(--bg-color) !important;
  --el-pagination-button-disabled-color: var(--border-color) !important;
  --el-pagination-button-disabled-bg-color: var(--bg-color) !important;
  --el-pagination-hover-color: var(--primary-color) !important;
}

/* Upload dialog */
.upload-dialog .el-dialog {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-radius: 8px;
}

.upload-dialog .el-dialog__title {
  color: var(--text-color);
}

.upload-container {
  display: flex;
  gap: 20px;
}

.upload-area {
  flex: 1;
}

.resource-uploader {
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-color);
  transition: border-color 0.3s;
}

.resource-uploader:hover {
  border-color: var(--primary-color);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-secondary);
}

.el-icon--upload {
  font-size: 48px;
  margin-bottom: 10px;
  color: var(--primary-color);
}

.el-upload__text h3 {
  margin: 0;
  font-weight: 500;
}

.el-upload__text p {
  margin: 5px 0 0;
}

.el-upload__text em {
  color: var(--primary-color);
  font-style: normal;
}

.upload-progress {
  margin-top: 20px;
}

.upload-file-item {
  margin-bottom: 10px;
  background-color: var(--bg-color);
  border-radius: 4px;
  padding: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  color: var(--text-secondary);
  font-size: 12px;
}

.upload-options {
  width: 300px;
  padding: 10px;
  background-color: var(--bg-color);
  border-radius: 8px;
}

.upload-options h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-weight: 500;
  color: var(--text-color);
}

/* Resource detail dialog */
.resource-dialog .el-dialog {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resource-dialog .el-dialog__title {
  color: var(--text-color);
}

.resource-dialog .el-dialog__body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.resource-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resource-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.resource-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resource-header-title h2 {
  margin: 0;
  font-size: 1.3rem;
}

.resource-type-tag {
  font-size: 0.8rem;
}

.resource-header-actions {
  display: flex;
  gap: 10px;
}

.resource-detail-container {
  display: flex;
  padding: 20px;
  gap: 20px;
  min-height: 400px;
}

.resource-preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-preview-large {
  background-color: var(--bg-color);
  border-radius: 8px;
  overflow: hidden;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-preview {
  padding: 10px;
  height: auto;
  max-height: 500px;
}

.resource-preview-large img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.video-player,
.audio-player {
  width: 100%;
  height: 100%;
  background-color: #000;
}

.audio-player {
  padding: 20px;
  height: auto;
}

.document-preview {
  width: 100%;
  height: 100%;
}

.document-preview iframe {
  width: 100%;
  height: 100%;
  background-color: white;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
}

.file-preview i {
  font-size: 64px;
  color: var(--text-secondary);
}

.version-selector {
  background-color: var(--bg-color);
  border-radius: 8px;
  padding: 15px;
}

.version-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.version-selector-header h3 {
  margin: 0;
  font-size: 1rem;
}

.version-history-link {
  color: var(--primary-color);
  font-size: 0.9rem;
}

.resource-info-panel {
  width: 40%;
  min-width: 400px;
}

.resource-detail-tabs {
  height: 100%;
}

.resource-form {
  padding: 10px;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-tag {
  margin-right: 0;
}

.tag-input {
  width: 100px;
}

.usage-stats {
  padding: 20px;
}

/* Version history */
.version-history {
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.version-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.version-history-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.version-timeline {
  margin-top: 20px;
}

/* Override el-timeline styles for dark theme */
.el-timeline-item__tail {
  border-left-color: var(--border-color) !important;
}

.el-timeline-item__node {
  background-color: var(--info-color) !important;
}

.el-timeline-item__node--primary {
  background-color: var(--primary-color) !important;
}

.version-timeline-item {
  padding: 16px;
  background-color: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.active-version {
  border-color: var(--primary-color);
  background-color: rgba(64, 158, 255, 0.1);
}

.version-timeline-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  flex: 1;
}

.version-info h4 {
  margin: 0 0 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-description {
  margin: 5px 0 10px;
  color: var(--text-secondary);
}

.version-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.version-actions {
  display: flex;
  gap: 5px;
}

/* Preview dialog */
.resource-preview-dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-content {
  max-width: 100%;
  max-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview-full {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.video-preview-full,
.audio-preview-full {
  width: 100%;
  max-height: 70vh;
}

.document-preview-full {
  width: 100%;
  height: 70vh;
}

.document-preview-full iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.file-preview-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
}

.file-preview-full i {
  font-size: 64px;
  color: var(--text-secondary);
}
</style>
