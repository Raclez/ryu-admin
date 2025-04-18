<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {ElLoading} from 'element-plus';

// 从正确重命名的resource.ts中导入
import {getFilesGroup, type PageParams} from '#/api/core/resource';

/**
 * 资源项接口定义
 */
interface ResourceItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  createTime?: string;
}

/**
 * 分页数据接口
 */
interface PaginationData {
  records: ResourceItem[];
  total: number;
  size: number;
  current: number;
}

const props = defineProps({
  /**
   * 文件类型
   */
  fileType: {
    type: String,
    default: 'image',
  },
});

const emit = defineEmits(['select']);

// 资源列表状态
const resources = ref<ResourceItem[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = ref(20);
const totals = ref(0);

/**
 * 获取资源列表
 * 根据分页参数从服务器获取资源列表数据
 */
const fetchResources = async () => {
  try {
    const params: PageParams = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
    };

    const response = await getFilesGroup(params) as PaginationData;
    resources.value = response.records;
    totals.value = response.total;
    currentPage.value = response.current;
    pageSize.value = response.size;
  } finally {
    loading.value = false;
  }
};

/**
 * 处理每页显示数量变化
 * @param size 新的每页数量
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  fetchResources();
};

/**
 * 处理页码变化
 * @param page 新的页码
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchResources();
};

// 组件挂载时获取资源
onMounted(fetchResources);

/**
 * 选择资源时触发事件
 * @param resource 选中的资源项
 */
const handleSelect = (resource: ResourceItem) => {
  emit('select', resource);
};
</script>

<template>
  <div class="resource-selector">
    <div v-loading="loading" class="resource-grid">
      <div
        v-for="resource in resources"
        :key="resource.id"
        class="resource-item"
        @click="handleSelect(resource)"
      >
        <img
          :src="resource.filePath"
          :alt="resource.fileName"
          class="resource-image"
        />
        <div class="resource-name">{{ resource.fileName }}</div>
      </div>

      <!-- 空状态显示 -->
      <div v-if="resources.length === 0 && !loading" class="empty-state">
        暂无资源数据
      </div>
    </div>

    <!-- 分页控件 -->
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
  </div>
</template>

<style scoped>
.resource-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.resource-item {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.resource-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.resource-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}

.resource-name {
  padding: 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.pagination {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
}
</style>
