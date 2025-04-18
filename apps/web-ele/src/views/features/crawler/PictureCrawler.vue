<template>
  <div class="crawler-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-box">
        <el-input
          v-model="form.url"
          class="search-input"
          clearable
          placeholder="输入网址获取图片"
        >
          <template #prefix>
            <el-icon>
              <Search/>
            </el-icon>
          </template>
          <template #append>
            <el-button
              :disabled="!form.url"
              :loading="loading"
              type="primary"
              @click="startCrawling"
            >
              获取图片
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 结果展示区域 -->
    <div v-if="crawlResult.length > 0 || loading" class="result-area">
      <div class="result-header">
        <div class="result-info">
          <el-tag v-if="crawlResult.length > 0" effect="dark" type="success">{{
              crawlResult.length
            }} 张图片
          </el-tag>
          <span v-if="loading" class="loading-text">正在获取图片...</span>
        </div>
        <div class="result-actions">
          <el-button v-if="crawlResult.length > 0" round size="small"
                     type="primary" @click="downloadAllImages">
            <el-icon>
              <Download/>
            </el-icon>
            批量下载
          </el-button>
          <el-button v-if="crawlResult.length > 0" round size="small" type="info"
                     @click="resetForm">
            <el-icon>
              <Delete/>
            </el-icon>
            清空
          </el-button>
        </div>
      </div>

      <div v-loading="loading" class="result-content">
        <div v-if="crawlResult.length === 0 && !loading" class="no-result">
          暂无图片
        </div>

        <div v-else class="image-grid">
          <div
            v-for="(image, index) in paginatedImages"
            :key="index"
            class="image-item"
          >
            <el-image
              :initial-index="(currentPage - 1) * pageSize + index"
              :preview-src-list="crawlResult.map(img => img.url)"
              :src="image.url"
              fit="cover"
              lazy
            >
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon>
                    <Picture/>
                  </el-icon>
                </div>
              </template>
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <PictureFilled/>
                  </el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
            <div class="image-actions">
              <el-button
                circle
                size="small"
                type="primary"
                @click="downloadImage(image.url)"
              >
                <el-icon>
                  <Download/>
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-if="crawlResult.length > pageSize"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            :total="crawlResult.length"
            background
            layout="sizes, prev, pager, next"
            small
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, Download, Delete, Picture, PictureFilled} from '@element-plus/icons-vue'
import axios from 'axios'

// 表单数据
const form = ref({
  url: ''
})

// 爬取状态和结果
const loading = ref(false)
const crawlResult = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(24)

// 计算当前页的图片
const paginatedImages = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  return crawlResult.value.slice(startIndex, startIndex + pageSize.value)
})

// 分页处理函数
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 开始爬取图片
const startCrawling = async () => {
  if (!form.value.url) {
    ElMessage.warning('请输入有效的网址')
    return
  }

  try {
    loading.value = true
    crawlResult.value = []

    // 这里应该调用后端API进行爬取
    const response = await fetchImages(form.value.url)

    crawlResult.value = response
    currentPage.value = 1

    if (crawlResult.value.length === 0) {
      ElMessage.info('未找到图片')
    } else {
      ElMessage.success(`成功获取 ${crawlResult.value.length} 张图片`)
    }
  } catch (error) {
    console.error('获取失败:', error)
    ElMessage.error('获取失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 模拟从后端获取图片数据
const fetchImages = async (url) => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 这里应该是真实的API调用
  // const { data } = await axios.post('/api/crawl/images', { url })
  // return data

  // 模拟返回数据
  return Array.from({length: 50}, (_, i) => ({
    url: `https://picsum.photos/id/${i + 10}/800/600`,
    width: 800,
    height: 600
  }))
}

// 重置表单
const resetForm = () => {
  form.value = {
    url: ''
  }
  crawlResult.value = []
  currentPage.value = 1
}

// 下载单张图片
const downloadImage = (url) => {
  const link = document.createElement('a')
  link.href = url
  link.download = url.split('/').pop() || 'image.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 批量下载所有图片
const downloadAllImages = () => {
  if (crawlResult.value.length === 0) {
    ElMessage.warning('没有可下载的图片')
    return
  }

  ElMessage.success('开始下载所有图片')

  // 延迟下载，避免浏览器阻止多个下载
  crawlResult.value.forEach((image, index) => {
    setTimeout(() => {
      downloadImage(image.url)
    }, index * 300)
  })
}
</script>

<style scoped>
.crawler-container {
  padding: 20px;
  max-width: 1280px;
  margin: 0 auto;
}

.search-area {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
}

.search-box {
  width: 100%;
  max-width: 600px;
}

.search-input :deep(.el-input__wrapper) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-area {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-text {
  color: #409eff;
  font-size: 14px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-content {
  min-height: 200px;
}

.no-result {
  text-align: center;
  padding: 60px;
  color: #909399;
  font-size: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.image-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  background-color: #fff;
  aspect-ratio: 1 / 1;
}

.image-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.image-item:hover .image-actions {
  opacity: 1;
}

.el-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}

.image-placeholder, .image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  background-color: #f5f7fa;
  gap: 10px;
}

.image-placeholder .el-icon, .image-error .el-icon {
  font-size: 32px;
  opacity: 0.5;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  padding: 10px 0;
}

@media (max-width: 768px) {
  .crawler-container {
    padding: 10px;
  }

  .search-box {
    max-width: 100%;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .result-area {
    padding: 15px;
    border-radius: 8px;
  }
}
</style>
