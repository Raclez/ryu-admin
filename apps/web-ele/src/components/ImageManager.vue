<template>
  <div class="image-manager-container">
    <div class="toolbar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索图片..."
            prefix-icon="el-icon-search"
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
                    icon="el-icon-view"
                    @click.stop="previewImage(image)"
                  />
                  <el-button
                    size="small"
                    circle
                    icon="el-icon-copy-document"
                    @click.stop="copyImageUrl(image.url)"
                  />
                  <el-button
                    size="small"
                    circle
                    icon="el-icon-delete"
                    @click.stop="confirmDelete(image)"
                  />
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

    <!-- 图片预览对话框 -->
<!--    <el-dialog v-model="previewVisible" title="图片预览" width="auto">-->
<!--      <img :src="previewImageUrl" class="preview-image" />-->
<!--      <div class="image-details">-->
<!--        <p><strong>文件名:</strong> {{ currentImage?.name }}</p>-->
<!--        <p><strong>大小:</strong> {{ formatSize(currentImage?.size) }}</p>-->
<!--        <p><strong>上传日期:</strong> {{ formatDate(currentImage?.uploadDate) }}</p>-->
<!--        <p><strong>链接:</strong> <el-input v-model="currentImage?.url" readonly>-->
<!--          <template #append>-->
<!--            <el-button @click="copyImageUrl(currentImage?.url)">复制</el-button>-->
<!--          </template>-->
<!--        </el-input>-->
<!--        </p>-->
<!--      </div>-->
<!--    </el-dialog>-->

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
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';

export default {
  name: 'ImageManager',
  props: {
    apiBaseUrl: {
      type: String,
      default: '/api'
    }
  },
  setup(props) {
    // 状态
    // const images = ref([]);
    const images = ref([
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


    const searchQuery = ref('');
    const filterType = ref('all');
    const selectedImages = ref([]);
    const currentPage = ref(1);
    const pageSize = ref(20);
    const previewVisible = ref(false);
    const previewImageUrl = ref('');
    const currentImage = ref(null);
    const deleteDialogVisible = ref(false);
    const toBeDeleted = ref(null);
    const uploadActionUrl = computed(() => `${props.apiBaseUrl}/images/upload`);

    // 过滤后的图片
    const filteredImages = computed(() => {
      return images.value.filter(image => {
        const matchesSearch = !searchQuery.value ||
          image.name.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesFilter = filterType.value === 'all' ||
          image.source === filterType.value;

        return matchesSearch && matchesFilter;
      });
    });

    // 分页后的图片
    const paginatedImages = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = startIndex + pageSize.value;
      return filteredImages.value.slice(startIndex, endIndex);
    });

    // 获取图片列表
    const fetchImages = async () => {
      const loading = ElLoading.service({
        target: '.image-grid-container',
        text: '加载图片中...'
      });

      // try {
      //   const response = await fetch(`${props.apiBaseUrl}/images`);
      //   if (!response.ok) throw new Error('获取图片失败');
      //
      //   const data = await response.json();
      //   images.value = data.map(img => ({
      //     ...img,
      //     uploadDate: new Date(img.uploadDate)
      //   }));
      // } catch (error) {
      //   console.error('Error fetching images:', error);
      //   ElMessage.error('获取图片列表失败');
      // } finally {
      //   loading.close();
      // }
    };

    // 同步远程图床图片
    const syncRemoteImages = async () => {
      const loading = ElLoading.service({
        text: '同步图床中...'
      });

      try {
        const response = await fetch(`${props.apiBaseUrl}/images/sync`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('同步图片失败');

        const data = await response.json();
        ElMessage.success(`成功同步 ${data.syncedCount} 张图片`);
        await fetchImages(); // 重新加载图片列表
      } catch (error) {
        console.error('Error syncing images:', error);
        ElMessage.error('同步图床失败');
      } finally {
        loading.close();
      }
    };

    // 处理图片上传成功
    const handleUploadSuccess = (response) => {
      ElMessage.success('图片上传成功');
      fetchImages(); // 重新加载图片列表
    };

    // 处理图片上传失败
    const handleUploadError = (error) => {
      console.error('Upload error:', error);
      ElMessage.error('图片上传失败');
    };

    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1; // 重置页码
    };

    // 处理筛选变化
    const handleFilterChange = () => {
      currentPage.value = 1; // 重置页码
    };

    // 处理分页变化
    const handlePageChange = (page) => {
      currentPage.value = page;
    };

    // 检查图片是否被选中
    const isSelected = (id) => {
      return selectedImages.value.includes(id);
    };

    // 切换图片选中状态
    const toggleSelection = (id) => {
      if (isSelected(id)) {
        selectedImages.value = selectedImages.value.filter(imageId => imageId !== id);
      } else {
        selectedImages.value.push(id);
      }
    };

    // 预览图片
    const previewImage = (image) => {
      currentImage.value = image;
      previewImageUrl.value = image.url;
      previewVisible.value = true;
    };

    // 复制图片URL
    const copyImageUrl = (url) => {
      navigator.clipboard.writeText(url)
        .then(() => {
          ElMessage.success('已复制图片链接');
        })
        .catch(() => {
          ElMessage.error('复制失败');
        });
    };

    // 确认删除单张图片
    const confirmDelete = (image) => {
      toBeDeleted.value = [image.id];
      deleteDialogVisible.value = true;
    };

    // 删除选中的图片
    const deleteSelected = () => {
      if (selectedImages.value.length === 0) return;

      toBeDeleted.value = [...selectedImages.value];
      deleteDialogVisible.value = true;
    };

    // 确认删除操作
    const confirmDeleteAction = async () => {
      if (!toBeDeleted.value || toBeDeleted.value.length === 0) return;

      const loading = ElLoading.service({
        text: '删除中...'
      });

      try {
        const response = await fetch(`${props.apiBaseUrl}/images/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ids: toBeDeleted.value
          })
        });

        if (!response.ok) throw new Error('删除图片失败');

        ElMessage.success('图片删除成功');
        // 从选中列表中移除已删除的图片
        selectedImages.value = selectedImages.value.filter(id => !toBeDeleted.value.includes(id));
        await fetchImages(); // 重新加载图片列表
      } catch (error) {
        console.error('Error deleting images:', error);
        ElMessage.error('删除图片失败');
      } finally {
        loading.close();
        deleteDialogVisible.value = false;
        toBeDeleted.value = null;
      }
    };

    // 格式化文件大小
    const formatSize = (bytes) => {
      if (!bytes) return '未知';

      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '未知';

      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // 初始化
    onMounted(() => {
      // fetchImages();
    });

    return {
      images,
      searchQuery,
      filterType,
      selectedImages,
      currentPage,
      pageSize,
      previewVisible,
      previewImageUrl,
      currentImage,
      deleteDialogVisible,
      uploadActionUrl,
      filteredImages,
      paginatedImages,
      fetchImages,
      syncRemoteImages,
      handleUploadSuccess,
      handleUploadError,
      handleSearch,
      handleFilterChange,
      handlePageChange,
      isSelected,
      toggleSelection,
      previewImage,
      copyImageUrl,
      confirmDelete,
      deleteSelected,
      confirmDeleteAction,
      formatSize,
      formatDate
    };
  }
};
</script>

<style scoped>
.image-manager-container {
  padding: 20px;
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
  position: relative;
  min-height: 200px;
}

.pagination-top {
  margin-bottom: 20px;
}

.pagination-bottom {
  margin-top: 20px;
}

.image-grid {
  margin-bottom: 20px;
}

.image-card {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.image-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.image-card.selected {
  border: 2px solid #409EFF;
}

.image-container {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-card:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.actions {
  display: flex;
  justify-content: center;
  padding: 10px;
  gap: 5px;
}

.image-type {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  align-self: flex-start;
  margin: 0 0 5px 5px;
  border-radius: 2px;
}

.image-info {
  padding: 10px;
}

.image-name {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  font-size: 12px;
  color: #909399;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  margin: 0 auto 20px;
}

.image-details {
  padding: 0 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
