<template>
  <el-drawer
    v-model="visible"
    title="存储策略管理"
    size="60%"
    :destroy-on-close="false"
  >
    <div class="storage-management-container">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" @click="showAddPolicy">
          <el-icon><Plus /></el-icon>新增存储策略
        </el-button>
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索策略名称..."
            clearable
            prefix-icon="Search"
            @input="searchPolicies"
          />
        </div>
      </div>

      <!-- 策略列表 -->
      <el-table
        :data="filteredPolicies"
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="strategyName" label="策略名称" min-width="120" />
        <el-table-column prop="strategyKey" label="存储类型" min-width="100">
          <template #default="scope">
            <el-tag :type="getStorageTypeTag(scope.row.strategyKey)">
              {{ getStorageTypeName(scope.row.strategyKey) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEnable" label="是否默认" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.isEnable"
              disabled
              inline-prompt
              :active-value="true"
              :inactive-value="false"
            />
          </template>
        </el-table-column>
        <el-table-column prop="accessUrl" label="访问地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="修改时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
<!--        <el-table-column prop="status" label="状态" width="100">-->
<!--          <template #default="scope">-->
<!--            <el-tag :type="scope.row.status ? 'success' : 'danger'">-->
<!--              {{ scope.row.status ? '启用' : '禁用' }}-->
<!--            </el-tag>-->
<!--          </template>-->
<!--        </el-table-column>-->
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              @click="testPolicy(scope.row)"
            >
              测试
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="editPolicy(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="scope.row.isEnable"
              @click="deletePolicy(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalPolicies"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑存储策略对话框 -->
    <el-dialog
      v-model="policyDialogVisible"
      :title="isEdit ? '编辑存储策略' : '新增存储策略'"
      width="60%"
      destroy-on-close
    >
      <el-form
        ref="policyFormRef"
        :model="policyForm"
        :rules="policyRules"
        label-width="120px"
      >
        <el-form-item label="策略名称" prop="strategyName">
          <el-input v-model="policyForm.strategyName" placeholder="请输入策略名称" />
        </el-form-item>

        <el-form-item label="存储类型" prop="strategyKey">
          <el-select v-model="policyForm.strategyKey" placeholder="请选择存储类型" @change="handleTypeChange">
            <el-option label="本地存储" value="local" />
            <el-option label="阿里云OSS" value="aliyun" />
            <el-option label="腾讯云COS" value="tencent" />
            <el-option label="七牛云" value="qiniu" />
            <el-option label="MinIO" value="minio" />
            <el-option label="AWS S3" value="s3" />
          </el-select>
        </el-form-item>

        <el-form-item label="访问URL前缀" prop="accessUrl">
          <el-input v-model="policyForm.accessUrl" placeholder="请输入访问URL前缀" />
          <div class="form-tip">访问文件时使用的URL前缀，例如：https://example.com/files/</div>
        </el-form-item>

        <!-- 本地存储配置 -->
        <template v-if="policyForm.strategyKey === 'local'">
          <el-form-item label="存储路径" prop="config.basePath">
            <el-input v-model="policyForm.config.basePath" placeholder="请输入文件存储的本地路径" />
            <div class="form-tip">服务器上文件存储的绝对路径，例如：/var/www/uploads/</div>
          </el-form-item>
        </template>

        <!-- 阿里云OSS配置 -->
        <template v-if="policyForm.strategyKey === 'aliyun'">
          <el-form-item label="Endpoint" prop="config.endpoint">
            <el-input v-model="policyForm.config.endpoint" placeholder="请输入OSS Endpoint" />
          </el-form-item>
          <el-form-item label="Bucket" prop="config.bucket">
            <el-input v-model="policyForm.config.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey ID" prop="config.accessKeyId">
            <el-input v-model="policyForm.config.accessKeyId" placeholder="请输入AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessKey Secret" prop="config.accessKeySecret">
            <el-input
              v-model="policyForm.config.accessKeySecret"
              placeholder="请输入AccessKey Secret"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item label="目录前缀" prop="config.prefix">
            <el-input v-model="policyForm.config.prefix" placeholder="请输入目录前缀(可选)" />
            <div class="form-tip">上传文件的目录前缀，例如：uploads/</div>
          </el-form-item>
        </template>

        <!-- 腾讯云COS配置 -->
        <template v-if="policyForm.strategyKey === 'tencent'">
          <el-form-item label="Region" prop="config.region">
            <el-input v-model="policyForm.config.region" placeholder="请输入COS Region" />
          </el-form-item>
          <el-form-item label="Bucket" prop="config.bucket">
            <el-input v-model="policyForm.config.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="SecretId" prop="config.secretId">
            <el-input v-model="policyForm.config.secretId" placeholder="请输入SecretId" />
          </el-form-item>
          <el-form-item label="SecretKey" prop="config.secretKey">
            <el-input
              v-model="policyForm.config.secretKey"
              placeholder="请输入SecretKey"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item label="目录前缀" prop="config.prefix">
            <el-input v-model="policyForm.config.prefix" placeholder="请输入目录前缀(可选)" />
          </el-form-item>
        </template>

        <!-- 七牛云配置 -->
        <template v-if="policyForm.strategyKey === 'qiniu'">
          <el-form-item label="Zone" prop="config.zone">
            <el-select v-model="policyForm.config.zone" placeholder="请选择区域">
              <el-option label="华东" value="z0" />
              <el-option label="华北" value="z1" />
              <el-option label="华南" value="z2" />
              <el-option label="北美" value="na0" />
              <el-option label="东南亚" value="as0" />
            </el-select>
          </el-form-item>
          <el-form-item label="Bucket" prop="config.bucket">
            <el-input v-model="policyForm.config.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey" prop="config.accessKey">
            <el-input v-model="policyForm.config.accessKey" placeholder="请输入AccessKey" />
          </el-form-item>
          <el-form-item label="SecretKey" prop="config.secretKey">
            <el-input
              v-model="policyForm.config.secretKey"
              placeholder="请输入SecretKey"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item label="目录前缀" prop="config.prefix">
            <el-input v-model="policyForm.config.prefix" placeholder="请输入目录前缀(可选)" />
          </el-form-item>
        </template>

        <!-- MinIO配置 -->
        <template v-if="policyForm.strategyKey === 'minio'">
          <el-form-item label="Endpoint" prop="config.endpoint">
            <el-input v-model="policyForm.config.endpoint" placeholder="请输入MinIO服务地址" />
          </el-form-item>
          <el-form-item label="Bucket" prop="config.bucket">
            <el-input v-model="policyForm.config.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey" prop="config.accessKey">
            <el-input v-model="policyForm.config.accessKey" placeholder="请输入AccessKey" />
          </el-form-item>
          <el-form-item label="SecretKey" prop="config.secretKey">
            <el-input
              v-model="policyForm.config.secretKey"
              placeholder="请输入SecretKey"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item label="使用SSL" prop="config.useSSL">
            <el-switch v-model="policyForm.config.useSSL" />
          </el-form-item>
          <el-form-item label="目录前缀" prop="config.prefix">
            <el-input v-model="policyForm.config.prefix" placeholder="请输入目录前缀(可选)" />
          </el-form-item>
        </template>

        <!-- AWS S3配置 -->
        <template v-if="policyForm.strategyKey === 's3'">
          <el-form-item label="Region" prop="config.region">
            <el-input v-model="policyForm.config.region" placeholder="请输入S3 Region" />
          </el-form-item>
          <el-form-item label="Bucket" prop="config.bucket">
            <el-input v-model="policyForm.config.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey ID" prop="config.accessKeyId">
            <el-input v-model="policyForm.config.accessKeyId" placeholder="请输入AccessKey ID" />
          </el-form-item>
          <el-form-item label="Secret Access Key" prop="config.secretAccessKey">
            <el-input
              v-model="policyForm.config.secretAccessKey"
              placeholder="请输入Secret Access Key"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item label="目录前缀" prop="config.prefix">
            <el-input v-model="policyForm.config.prefix" placeholder="请输入目录前缀(可选)" />
          </el-form-item>
        </template>

        <el-form-item label="默认策略" prop="isEnable">
          <el-switch v-model="policyForm.isEnable" />
          <div class="form-tip">设为默认策略后，上传资源将默认使用此策略</div>
        </el-form-item>

        <el-form-item label="启用状态" prop="status">
          <el-switch
            v-model="policyForm.status"
            :active-value="true"
            :inactive-value="false"
          />
        </el-form-item>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="policyForm.description"
            type="textarea"
            placeholder="请输入备注信息(可选)"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="policyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePolicy" :loading="saving">保存</el-button>
          <el-button v-if="isEdit" @click="testPolicy(policyForm)">测试连接</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 测试结果对话框 -->
    <el-dialog
      v-model="testResultDialogVisible"
      title="测试结果"
      width="40%"
    >
      <div class="test-result">
        <div v-if="testLoading" class="test-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在测试连接，请稍候...</span>
        </div>
        <div v-else class="test-info">
          <el-result
            :icon="testResult.success ? 'success' : 'error'"
            :title="testResult.success ? '连接成功' : '连接失败'"
            :sub-title="testResult.message"
          >
            <template #extra>
              <el-button type="primary" @click="testResultDialogVisible = false">确定</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type {FormInstance, FormRules} from 'element-plus';
import {Plus, Loading, Search} from '@element-plus/icons-vue';
import {
  deleteStorageStrategy,
  getStorageStrategyPage,
  saveStorageStrategy,
  updateStorageStrategy
} from "#/api/core/storageStrategy.js";

/**
 * 测试结果接口
 */
interface TestResult {
  success: boolean;
  message: string;
}

/**
 * 存储策略接口
 */
interface StoragePolicy {
  id: string;
  strategyName: string;
  strategyKey: string;
  accessUrl: string;
  isEnable: boolean;
  createTime: string;
  updateTime: string;
  status?: boolean;
  description?: string;
  config: {
    [key: string]: any;
  };
}

/**
 * 存储策略表单数据
 */
interface PolicyForm {
  id?: string;
  strategyName: string;
  strategyKey: string;
  accessUrl: string;
  isEnable: boolean;
  status?: boolean;
  description?: string;
  config: {
    // 本地存储配置
    basePath?: string;

    // 阿里云OSS配置
    endpoint?: string;
    bucket?: string;
    accessKeyId?: string;
    accessKeySecret?: string;

    // 腾讯云COS配置
    region?: string;
    secretId?: string;
    secretKey?: string;

    // 七牛云配置
    accessKey?: string;
    zone?: string;

    // MinIO配置
    useSSL?: boolean;

    // AWS S3配置
    secretAccessKey?: string;

    // 通用配置
    prefix?: string;
  };
}

// 组件属性
const props = defineProps({
  /**
   * 是否可见
   */
  modelValue: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', visible: boolean): void;
  (e: 'refresh'): void;
}>();

// 组件可见性
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// === 状态变量 ===
const policies = ref<StoragePolicy[]>([]);
const loading = ref(false);
const saving = ref(false);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalPolicies = ref(0);
const policyDialogVisible = ref(false);
const isEdit = ref(false);
const policyFormRef = ref<FormInstance>();
const testResultDialogVisible = ref(false);
const testLoading = ref(false);
const testResult = reactive<TestResult>({
  success: false,
  message: ''
});

// 过滤后的策略列表
const filteredPolicies = computed(() => {
  if (!searchKeyword.value) {
    return policies.value;
  }

  return policies.value.filter(policy =>
    policy.strategyName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 策略表单初始值
const defaultPolicyForm: PolicyForm = {
  strategyName: '',
  strategyKey: 'local',
  accessUrl: '',
  isEnable: false,
  status: true,
  description: '',
  config: {
    basePath: '',
    prefix: '',
    zone: 'z0',
    useSSL: true
  }
};

// 当前编辑的策略表单
const policyForm = reactive<PolicyForm>({...defaultPolicyForm});

// 表单验证规则
const policyRules = reactive<FormRules>({
  strategyName: [
    {required: true, message: '请输入策略名称', trigger: 'blur'},
    {min: 2, max: 50, message: '长度应为 2 到 50 个字符', trigger: 'blur'}
  ],
  strategyKey: [
    {required: true, message: '请选择存储类型', trigger: 'change'}
  ],
  accessUrl: [
    {required: true, message: '请输入访问URL前缀', trigger: 'blur'}
  ],
  'config.basePath': [
    {
      required: true, message: '请输入存储路径', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'local' && !value) {
          callback(new Error('请输入存储路径'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.endpoint': [
    {
      required: true, message: '请输入Endpoint', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'aliyun' && !value) {
          callback(new Error('请输入Endpoint'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.bucket': [
    {
      required: true, message: '请输入Bucket名称', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (['aliyun', 'tencent', 'qiniu', 'minio', 's3'].includes(policyForm.strategyKey) && !value) {
          callback(new Error('请输入Bucket名称'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.accessKeyId': [
    {
      required: true, message: '请输入AccessKey ID', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'aliyun' && !value) {
          callback(new Error('请输入AccessKey ID'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.accessKeySecret': [
    {
      required: true, message: '请输入AccessKey Secret', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'aliyun' && !value) {
          callback(new Error('请输入AccessKey Secret'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.region': [
    {
      required: true, message: '请输入Region', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'tencent' && !value) {
          callback(new Error('请输入Region'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.secretId': [
    {
      required: true, message: '请输入SecretId', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'tencent' && !value) {
          callback(new Error('请输入SecretId'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.secretKey': [
    {
      required: true, message: '请输入SecretKey', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (['tencent', 'qiniu'].includes(policyForm.strategyKey) && !value) {
          callback(new Error('请输入SecretKey'));
        } else {
          callback();
        }
      }
    }
  ],
  'config.accessKey': [
    {
      required: true, message: '请输入AccessKey', trigger: 'blur',
      validator: (rule, value, callback) => {
        if (policyForm.strategyKey === 'qiniu' && !value) {
          callback(new Error('请输入AccessKey'));
        } else {
          callback();
        }
      }
    }
  ]
});

/**
 * 处理存储类型变更
 */
const handleTypeChange = () => {
  // 清空特定于存储类型的配置
  policyForm.config = {
    prefix: policyForm.config.prefix || ''
  };

  // 根据存储类型添加默认配置
  switch (policyForm.strategyKey) {
    case 'local':
      policyForm.config.basePath = '';
      break;
    case 'aliyun':
      policyForm.config.endpoint = '';
      policyForm.config.bucket = '';
      policyForm.config.accessKeyId = '';
      policyForm.config.accessKeySecret = '';
      break;
    case 'tencent':
      policyForm.config.region = '';
      policyForm.config.bucket = '';
      policyForm.config.secretId = '';
      policyForm.config.secretKey = '';
      break;
    case 'qiniu':
      policyForm.config.bucket = '';
      policyForm.config.accessKey = '';
      policyForm.config.secretKey = '';
      policyForm.config.zone = 'z0';
      break;
    case 'minio':
      policyForm.config.endpoint = '';
      policyForm.config.bucket = '';
      policyForm.config.accessKey = '';
      policyForm.config.secretKey = '';
      policyForm.config.useSSL = true;
      break;
    case 's3':
      policyForm.config.endpoint = '';
      policyForm.config.bucket = '';
      policyForm.config.accessKeyId = '';
      policyForm.config.secretAccessKey = '';
      policyForm.config.region = '';
      break;
  }
};

/**
 * 获取存储类型标签类型
 */
const getStorageTypeTag = (type: string): string => {
  const tagMap: Record<string, string> = {
    local: '',
    aliyun: 'success',
    tencent: 'warning',
    qiniu: 'danger',
    minio: 'info',
    s3: 'primary'
  };

  return tagMap[type] || '';
};

/**
 * 获取存储类型名称
 */
const getStorageTypeName = (type: string): string => {
  const nameMap: Record<string, string> = {
    local: '本地存储',
    aliyun: '阿里云OSS',
    tencent: '腾讯云COS',
    qiniu: '七牛云',
    minio: 'MinIO',
    s3: 'AWS S3'
  };

  return nameMap[type] || type;
};

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

/**
 * 搜索策略
 */
const searchPolicies = () => {
  // 在本地过滤，已通过计算属性实现
};

/**
 * 显示添加策略对话框
 */
const showAddPolicy = () => {
  isEdit.value = false;
  Object.assign(policyForm, defaultPolicyForm);
  policyDialogVisible.value = true;
};

/**
 * 编辑策略
 */
const editPolicy = (policy: StoragePolicy) => {
  isEdit.value = true;

  // 深拷贝策略数据到表单
  Object.assign(policyForm, {
    id: policy.id,
    strategyName: policy.strategyName,
    strategyKey: policy.strategyKey,
    accessUrl: policy.accessUrl,
    isEnable: policy.isEnable,
    status: policy.status,
    description: policy.description,
    config: {...policy.config}
  });

  policyDialogVisible.value = true;
};

/**
 * 删除策略
 */
const deletePolicy = (policy: StoragePolicy) => {
  if (policy.isEnable) {
    ElMessage.warning('默认策略不能删除');
    return;
  }

  ElMessageBox.confirm(
    '确定要删除该存储策略吗？删除后将无法恢复。',
    '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    try {
      await deleteStorageStrategy(policy.id);
      ElMessage.success('删除成功');
      fetchPolicies();
  } catch (error) {
      ElMessage.error('删除失败');
    }
  }).catch(() => {
    // 取消操作
  });
};

/**
 * 测试策略
 */
const testPolicy = async (policy: StoragePolicy) => {
  try {
    testLoading.value = true;
    testResultDialogVisible.value = true;

    // 模拟API调用测试结果
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 实际应用中应调用API
    // const result = await testStorageStrategy(policy.id);

    // 模拟测试结果
    if (Math.random() > 0.3) {
      testResult.success = true;
      testResult.message = `成功连接到${getStorageTypeName(policy.strategyKey)}服务`;
    } else {
      testResult.success = false;
      testResult.message = '连接失败，请检查配置信息';
    }
  } catch (error) {
    testResult.success = false;
    testResult.message = '测试过程出错';
    ElMessage.error('测试失败');
  } finally {
    testLoading.value = false;
  }
};

/**
 * 保存策略
 */
const savePolicy = async () => {
  if (!policyFormRef.value) return;

  await policyFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
    saving.value = true;

      if (isEdit.value) {
        // 更新策略
        await updateStorageStrategy({
            ...policyForm,
            createTime: undefined,
          updateTime: undefined
        } as any);
        ElMessage.success('更新成功');
      } else {
        // 添加策略
        await saveStorageStrategy(policyForm as any);
        ElMessage.success('添加成功');
      }

      policyDialogVisible.value = false;
      fetchPolicies();
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新失败' : '添加失败');
    } finally {
      saving.value = false;
    }
  });
};

/**
 * 处理分页大小变化
 */
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchPolicies();
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchPolicies();
};

/**
 * 获取策略列表
 */
const fetchPolicies = async () => {
  try {
    loading.value = true;
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value
    };

    const res = await getStorageStrategyPage(params);
    policies.value = res.records || [];
    totalPolicies.value = res.total || 0;
  } catch (error) {
    ElMessage.error('获取存储策略列表失败');
  } finally {
    loading.value = false;
  }
};

// 监听对话框可见性变化
watch(() => visible.value, (newVal) => {
  if (newVal) {
    fetchPolicies();
  }
});

// 组件挂载时获取数据
onMounted(() => {
  if (visible.value) {
    fetchPolicies();
  }
});
</script>

<style scoped>
/* 存储策略管理整体容器样式 */
.storage-management-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 搜索容器样式 */
.search-container {
  width: 300px;
}

/* 表格容器样式 - 使表格自动填充可用空间 */
.el-table {
  flex: 1;
  margin-bottom: 20px;
}

/* 分页容器样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 表单提示文本样式 */
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}

/* 弹窗底部按钮容器样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 测试结果容器样式 */
.test-result {
  padding: 20px;
  text-align: center;
}

/* 测试加载中样式 */
.test-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 10px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 测试信息容器样式 */
.test-info {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 针对不同类型存储的表单区块样式 */
.el-form-item {
  margin-bottom: 22px;
}

/* 密码类输入框样式调整 */
.el-input--password {
  width: 100%;
}

/* 确保抽屉内容可以滚动 */
.el-drawer__body {
  overflow-y: auto;
}

/* 适配移动设备的响应式样式 */
@media screen and (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-container {
    width: 100%;
    margin-top: 10px;
  }

  .el-drawer.rtl {
    width: 100% !important;
  }
}
</style>
