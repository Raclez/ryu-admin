<template>
  <div class="image-manager-container">
    <div class="toolbar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索图片..."
            prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterType" placeholder="图片来源" @change="handleFilterChange">
            <el-option label="全部" value="all" />
            <el-option label="图床" value="remote" />
            <el-option label="本地" value="local" />
          </el-select>
        </el-col>
        <el-col :span="12" class="action-buttons">
          <el-upload
            :action="uploadActionUrl"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :show-file-list="false"
            multiple
            accept="image/*"
          >
            <el-button type="primary">上传图片</el-button>
          </el-upload>
          <el-button type="primary" @click="syncRemoteImages">同步图床</el-button>
          <el-button type="danger" :disabled="!selectedImages.length" @click="deleteSelected">删除选中</el-button>
        </el-col>
      </el-row>
    </div>

    <div class="image-grid-container">
      <el-empty v-if="filteredImages.length === 0" description="没有找到图片" />

      <el-pagination
        v-if="filteredImages.length > 0"
        layout="prev, pager, next"
        :total="filteredImages.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        class="pagination-top"
      />

      <el-row :gutter="20" class="image-grid">
        <el-col
          v-for="image in paginatedImages"
          :key="image.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
        >
          <div
            class="image-card"
            :class="{ 'selected': isSelected(image.id) }"
            @click="toggleSelection(image.id)"
          >
            <div class="image-container">
              <img :src="image.url" :alt="image.name" />
              <div class="image-overlay">
                <div class="actions">
                  <el-button
                    size="small"
                    circle
                    @click.stop="previewImage(image)"
                  >
                    <el-icon>
                      <View/>
                    </el-icon>
                  </el-button>
                  <el-button
                    size="small"
                    circle
                    @click.stop="copyImageUrl(image.url)"
                  >
                    <el-icon>
                      <DocumentCopy/>
                    </el-icon>
                  </el-button>
                  <el-button
                    size="small"
                    circle
                    @click.stop="confirmDelete(image)"
                  >
                    <el-icon>
                      <Delete/>
                    </el-icon>
                  </el-button>
                </div>
                <div class="image-type">
                  {{ image.source === 'remote' ? '图床' : '本地' }}
                </div>
              </div>
            </div>
            <div class="image-info">
              <div class="image-name" :title="image.name">{{ image.name }}</div>
              <div class="image-meta">
                {{ formatSize(image.size) }} · {{ formatDate(image.uploadDate) }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-pagination
        v-if="filteredImages.length > 0"
        layout="prev, pager, next"
        :total="filteredImages.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        class="pagination-bottom"
      />
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>您确定要删除选中的图片吗？此操作不可逆。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteAction">确认删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :hide-on-click-modal="false"
      :initial-index="previewIndex"
      :url-list="previewImageUrls"
      @close="closeImageViewer"
    >
      <!-- 图片信息 -->
      <template #extra>
        <div v-if="currentPreviewImage" class="image-viewer-extra">
          <div class="image-viewer-info">
            <p><strong>文件名:</strong> {{ currentPreviewImage.name }}</p>
            <p><strong>大小:</strong> {{ formatSize(currentPreviewImage.size) }}</p>
            <p><strong>上传时间:</strong> {{ formatDate(currentPreviewImage.uploadDate) }}</p>
          </div>
          <div class="image-viewer-actions">
            <el-button size="small" type="primary" @click="copyImageUrl(currentPreviewImage.url)">
              <el-icon>
                <DocumentCopy/>
              </el-icon>
              复制链接
            </el-button>
          </div>
        </div>
      </template>
    </el-image-viewer>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import {ElMessage, ElMessageBox, ElImageViewer} from 'element-plus';
import {View, DocumentCopy, Delete, Search} from '@element-plus/icons-vue';

/**
 * 图片资源接口定义
 */
interface ImageResource {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadDate: Date;
  source: 'remote' | 'local';
}

const props = defineProps({
  /**
   * API基础路径
   */
  apiBaseUrl: {
    type: String,
    default: '/api'
  }
});

// === 状态变量 ===
// 图片数组，实际应用中应从API获取
const images = ref<ImageResource[]>([
  {
    id: '3',
    url: 'https://picsum.photos/200/300?random=3',
    name: '产品截图-1.jpg',
    size: 786432, // 768KB
    uploadDate: new Date('2024-02-28'),
    source: 'remote'
  },
  {
    id: '4',
    url: 'https://picsum.photos/200/300?random=4',
    name: '设计稿-v1.psd',
    size: 5242880, // 5MB
    uploadDate: new Date('2024-02-25'),
    source: 'local'
  },
  {
    id: '5',
    url: 'https://picsum.photos/200/300?random=5',
    name: '会议纪要配图.jpeg',
    size: 3670016, // 3.5MB
    uploadDate: new Date('2024-02-29'),
    source: 'remote'
  }
]);

// 搜索和过滤
const searchQuery = ref('');
const filterType = ref('all');
const selectedImages = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const deleteDialogVisible = ref(false);
const imageToDelete = ref<ImageResource | null>(null);

// 图片预览相关
const imageViewerVisible = ref(false);
const previewIndex = ref(0);
const previewImageUrls = computed(() => {
  return filteredImages.value.map(img => img.url);
});
const currentPreviewImage = computed(() => {
  if (previewIndex.value >= 0 && previewIndex.value < filteredImages.value.length) {
    return filteredImages.value[previewIndex.value];
  }
  return null;
});

/**
 * 上传图片的API URL
 */
const uploadActionUrl = computed(() => `${props.apiBaseUrl}/upload-image`);

/**
 * 过滤后的图片列表
 */
const filteredImages = computed(() => {
  return images.value.filter(image => {
    const matchesSearch =
      !searchQuery.value ||
      image.name.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesFilter =
      filterType.value === 'all' ||
      image.source === filterType.value;

    return matchesSearch && matchesFilter;
  });
});

/**
 * 当前页的图片列表
 */
const paginatedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredImages.value.slice(start, end);
});

/**
 * 处理页码变化
 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

/**
 * 处理搜索查询
 */
const handleSearch = () => {
  currentPage.value = 1;
};

/**
 * 处理过滤选项变化
 */
const handleFilterChange = () => {
  currentPage.value = 1;
};

/**
 * 检查图片是否被选中
 */
const isSelected = (id: string): boolean => {
  return selectedImages.value.includes(id);
};

/**
 * 切换图片选中状态
 */
const toggleSelection = (id: string) => {
  const index = selectedImages.value.indexOf(id);
  if (index === -1) {
    selectedImages.value.push(id);
  } else {
    selectedImages.value.splice(index, 1);
  }
};

/**
 * 处理图片上传成功
 */
const handleUploadSuccess = (response: any, file: File) => {
  ElMessage.success(`图片 ${file.name} 上传成功`);
  // 实际应用中，应该从响应中获取上传后的图片信息并添加到列表中
  // getImageList(); // 刷新图片列表
};

/**
 * 处理图片上传失败
 */
const handleUploadError = (error: any, file: File) => {
  ElMessage.error(`图片 ${file.name} 上传失败: ${error}`);
};

/**
 * 同步远程图床图片
 */
const syncRemoteImages = async () => {
  try {
    ElMessage.success('图床同步成功');
    // 实际应用中应调用API同步远程图片
    // await syncRemoteImagesApi();
    // getImageList(); // 刷新图片列表
  } catch (error) {
    ElMessage.error('图床同步失败');
  }
};

/**
 * 删除选中的图片
 */
const deleteSelected = () => {
  if (selectedImages.value.length === 0) return;

  deleteDialogVisible.value = true;
};

/**
 * 确认删除特定图片
 */
const confirmDelete = (image: ImageResource) => {
  imageToDelete.value = image;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除操作
 */
const confirmDeleteAction = async () => {
  try {
    if (imageToDelete.value) {
      // 删除单个图片
      // await deleteImageApi(imageToDelete.value.id);
      images.value = images.value.filter(img => img.id !== imageToDelete.value?.id);
      ElMessage.success('图片删除成功');
    } else {
      // 删除多个选中的图片
      // await deleteMultipleImagesApi(selectedImages.value);
      images.value = images.value.filter(img => !selectedImages.value.includes(img.id));
      ElMessage.success(`已删除 ${selectedImages.value.length} 张图片`);
      selectedImages.value = [];
    }
  } catch (error) {
    ElMessage.error('删除图片失败');
  } finally {
    deleteDialogVisible.value = false;
    imageToDelete.value = null;
  }
};

/**
 * 复制图片URL到剪贴板
 */
const copyImageUrl = (url: string) => {
  navigator.clipboard.writeText(url)
    .then(() => {
      ElMessage.success('图片链接已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};

/**
 * 预览图片
 */
const previewImage = (image: ImageResource) => {
  // 找到图片在过滤后列表中的索引
  const index = filteredImages.value.findIndex(img => img.id === image.id);
  if (index !== -1) {
    previewIndex.value = index;
    imageViewerVisible.value = true;
  }
};

/**
 * 关闭图片预览
 */
const closeImageViewer = () => {
  imageViewerVisible.value = false;
};

/**
 * 格式化文件大小
 */
const formatSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * 格式化日期
 */
const formatDate = (date: Date): string => {
  if (!date) return '未知';
  return new Date(date).toLocaleDateString();
};

/**
 * 获取图片列表数据
 * 实际应用中应该从API获取
 */
const getImageList = async () => {
  try {
    // const response = await fetch(`${props.apiBaseUrl}/images`);
    // const data = await response.json();
    // images.value = data.images;
    // 这里使用模拟数据，实际应用中应该从API获取
  } catch (error) {
    ElMessage.error('获取图片列表失败');
  }
};

// 组件挂载时获取图片列表
onMounted(getImageList);
</script>

<style scoped>
.image-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.toolbar {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-grid-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 20px;
}

.image-grid {
  margin-top: 20px;
  margin-bottom: 20px;
}

.pagination-top {
  margin-bottom: 20px;
}

.pagination-bottom {
  margin-top: 20px;
}

.image-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  background-color: #fff;
  position: relative;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.image-card.selected {
  border: 2px solid #409EFF;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.image-container {
  position: relative;
  overflow: hidden;
  height: 180px;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.image-container:hover img {
  transform: scale(1.1);
}

.actions {
  display: flex;
  gap: 10px;
}

.image-type {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.image-info {
  padding: 10px;
}

.image-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.image-meta {
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-viewer-extra {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-viewer-info {
  font-size: 14px;
}

.image-viewer-info p {
  margin: 5px 0;
}

.image-viewer-actions {
  display: flex;
  gap: 10px;
}
</style>
