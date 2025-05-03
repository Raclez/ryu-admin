<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {RefreshRight, Setting} from '@element-plus/icons-vue';

// SpringBoot Admin服务地址 - 根据实际环境配置
const springBootAdminUrl = ref(import.meta.env.VITE_API_URL || 'http://localhost:8080');

// 获取iframe的引用
const iframeRef = ref(null);
const iframeHeight = ref('800px');
const loading = ref(true);

// 加载完成事件处理
const handleLoad = () => {
  loading.value = false;
};

// 更新iframe高度
const updateHeight = () => {
  const height = document.documentElement.clientHeight;
  iframeHeight.value = `${height - 120}px`; // 留出顶部空间
};

onMounted(() => {
  updateHeight();
  window.addEventListener('resize', updateHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateHeight);
});

// 修改SpringBoot Admin URL
const setCustomUrl = (url) => {
  if (url && url.trim() !== '') {
    springBootAdminUrl.value = url.trim();
    loading.value = true; // 重新加载时显示加载状态
  }
};

// 重新加载iframe
const reloadIframe = () => {
  loading.value = true;
  if (iframeRef.value) {
    iframeRef.value.src = springBootAdminUrl.value;
  }
};

// 自定义URL输入
const customUrl = ref('');
const showUrlInput = ref(false);

// 确认更改URL
const confirmUrlChange = () => {
  setCustomUrl(customUrl.value);
  showUrlInput.value = false;
};
</script>

<template>
  <div class="springboot-admin-container">
    <div class="admin-header glassmorphism">
      <h2 class="admin-title">SpringBoot Admin监控中心</h2>

      <div class="admin-actions">
        <el-tooltip content="刷新页面" placement="top">
          <el-button
            :icon="RefreshRight"
            :loading="loading"
            circle
            type="primary"
            @click="reloadIframe"
          />
        </el-tooltip>

        <el-tooltip content="设置监控地址" placement="top">
          <el-button
            :icon="Setting"
            circle
            type="info"
            @click="showUrlInput = true"
          />
        </el-tooltip>
      </div>
    </div>

    <el-dialog
      v-model="showUrlInput"
      title="设置SpringBoot Admin监控地址"
      width="500px"
    >
      <el-form>
        <el-form-item label="监控地址">
          <el-input
            v-model="customUrl"
            clearable
            placeholder="输入SpringBoot Admin服务URL"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUrlInput = false">取消</el-button>
          <el-button type="primary" @click="confirmUrlChange">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <div class="admin-content glassmorphism">
      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <el-skeleton :rows="10" animated/>
        </div>
      </div>

      <iframe
        ref="iframeRef"
        :src="springBootAdminUrl"
        :style="{ height: iframeHeight }"
        class="admin-iframe"
        frameborder="0"
        @load="handleLoad"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.springboot-admin-container {
  padding: 24px;
  background-color: #0f172a;
  background-image: radial-gradient(
    circle at 50% 50%,
    #1e293b 0%,
    #0f172a 100%
  );
  min-height: 100vh;
  color: #e2e8f0;
}

/* 玻璃态效果 */
.glassmorphism {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.admin-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(56, 189, 248, 0.15),
    rgba(103, 232, 249, 0.05)
  );
  z-index: 0;
}

.admin-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #f8fafc;
  position: relative;
  z-index: 1;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

.admin-actions {
  display: flex;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.admin-content {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
  position: relative;
}

.admin-iframe {
  width: 100%;
  border: none;
  display: block;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.8);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  width: 80%;
  max-width: 800px;
}
</style>
