<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { getFilesGroup } from '#/api/core/resouce.js'

const props = defineProps({
  fileType: {
    type: String,
    default: 'image'
  }
})

const emit = defineEmits(['select'])

// 资源列表
const resources = ref([])
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const totals = ref(0)

// 获取图片资源
const fetchResources = async () => {
  try {
   const param={
      currentPage: 1,
      pageSize: 20
    }
    const response = await getFilesGroup(param)
    resources.value = response.records
  } finally {
    loading.value = false
  }
}

onMounted(fetchResources)

// 选择处理
const handleSelect = (resource) => {
  emit('select', resource)
}
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
        >
        <div class="resource-name">{{ resource.fileName }}</div>
      </div>
    </div>
  </div>
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
</template>

<style scoped>
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
}

.resource-item {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.resource-item:hover {
  transform: translateY(-3px);
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
</style>
