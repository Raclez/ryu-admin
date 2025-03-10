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

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Loading } from '@element-plus/icons-vue';
import {
  deleteStorageStrategy,
  getStorageStrategyPage,
  saveStorageStrategy,
  updateStorageStrategy
} from "#/api/core/storageStrategy.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'update:policies']);

// 双向绑定visible属性
const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

// 数据状态
const loading = ref(false);
const saving = ref(false);
const policies = ref([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalPolicies = ref(0);

// 过滤后的策略列表
const filteredPolicies = computed(() => {
  if (!searchKeyword.value) {
    return policies.value;
  }
  return policies.value.filter(policy =>
    policy.strategyName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 对话框状态
const policyDialogVisible = ref(false);
const testResultDialogVisible = ref(false);
const isEdit = ref(false);

// 表单相关
const policyFormRef = ref(null);
const policyForm = reactive({
  id: null,
  strategyName: '',
  strategyKey: 'local',
  accessUrl: '',
  config: {
    // 本地存储配置
    basePath: '',

    // 对象存储通用配置
    bucket: '',
    prefix: '',

    // 阿里云OSS配置
    endpoint: '',
    accessKeyId: '',
    accessKeySecret: '',

    // 腾讯云COS配置
    region: '',
    secretId: '',
    secretKey: '',

    // 七牛云配置
    zone: 'z0',
    accessKey: '',

    // MinIO配置
    useSSL: true,

    // AWS S3配置
    secretAccessKey: ''
  },
  isEnable: false,
  status: true,
  description: ''
});

// 表单验证规则
const policyRules = {
  strategyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  strategyKey: [{ required: true, message: '请选择存储类型', trigger: 'change' }],
  accessUrl: [{ required: true, message: '请输入访问URL前缀', trigger: 'blur' }]
};

// 测试结果
const testLoading = ref(false);
const testResult = reactive({
  success: false,
  message: ''
});

// 初始化加载数据
onMounted(() => {
  fetchPolicies();
});

// 监听抽屉显示状态
watch(visible, (newVal) => {
  if (newVal) {
    fetchPolicies();
  }
});

// 获取存储策略列表
const fetchPolicies = async () => {
  loading.value = true;
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500));

    // 示例数据
    policies.value = [
      {
        id: 1,
        strategyName: '本地存储',
        strategyKey: 'local',
        accessUrl: 'https://example.com/uploads/',
        config: {
          basePath: '/var/www/uploads/'
        },
        isEnable: true,
        status: true,
        createTime: '2025-02-25 10:00:00',
        description: '默认本地存储策略'
      },
      {
        id: 2,
        strategyName: '阿里云OSS',
        strategyKey: 'aliyun',
        accessUrl: 'https://bucket.oss-cn-beijing.aliyuncs.com/',
        config: {
          endpoint: 'oss-cn-beijing.aliyuncs.com',
          bucket: 'my-bucket',
          accessKeyId: 'LTAI4*****',
          accessKeySecret: '********',
          prefix: 'blog/'
        },
        isEnable: false,
        status: true,
        createTime: '2025-02-25 11:30:00',
        description: '阿里云OSS存储'
      }
    ];

    totalPolicies.value = policies.value.length;
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      strategyName: searchKeyword.value,
    }
    const res= await getStorageStrategyPage(params)
    policies.value = res.records
    totalPolicies.value = res.total;
    currentPage.value = res.current;
    pageSize.value = res.size;

    emit('update:policies', policies.value);
  } catch (error) {
    console.error('获取存储策略失败:', error);
    ElMessage.error('获取存储策略失败');
  } finally {
    loading.value = false;
  }
};

// 搜索策略
const searchPolicies = () => {
  // 客户端过滤即可，无需发送请求
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  // 实际应用中这里应该重新请求数据
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  // 实际应用中这里应该重新请求数据
};

// 新增策略
const showAddPolicy = () => {
  isEdit.value = false;
  resetPolicyForm();
  policyDialogVisible.value = true;
};

// 编辑策略
const editPolicy = async (row) => {
  isEdit.value = true;
  resetPolicyForm();
  // 填充表单数据
  policyForm.id = row.id;
  policyForm.strategyName = row.strategyName;
  policyForm.strategyKey = row.strategyKey;
  policyForm.accessUrl = row.accessUrl;
  policyForm.isEnable = row.isEnable;
  // policyForm.status = row.status;
  policyForm.description = row.description;

  // 深拷贝配置信息
  Object.assign(policyForm.config, row.config);

  policyDialogVisible.value = true;
};

// 删除策略
const deletePolicy = async (row) => {
  if (row.isEnable) {
    ElMessage.warning('默认策略不能删除');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确定要删除该存储策略吗？删除后使用此策略的资源将无法访问',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    loading.value = true;


    // 移除策略
    const index = policies.value.findIndex(item => item.id === row.id);
    if (index !== -1) {
    await deleteStorageStrategy(row.id)
      policies.value.splice(index, 1);
      totalPolicies.value--;
      emit('update:policies', policies.value);
      ElMessage.success('删除成功');
    }

    // 实际应用中应调用API
    // await fetch(`/api/storage-policies/${row.id}`, {
    //   method: 'DELETE'
    // });

  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除策略失败:', error);
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 测试策略连接
const testPolicy = async (policy) => {
  testResultDialogVisible.value = true;
  testLoading.value = true;
  testResult.success = false;
  testResult.message = '';

  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 模拟测试结果
    if (Math.random() > 0.2) {
      testResult.success = true;
      testResult.message = `成功连接到${getStorageTypeName(policy.strategyKey)}服务`;
      if (policy.strategyKey !== 'local') {
        testResult.message += `，Bucket: ${policy.config.bucket} 可正常访问`;
      }
    } else {
      testResult.success = false;
      if (policy.strategyKey === 'local') {
        testResult.message = '目录不存在或无写入权限';
      } else {
        testResult.message = '连接失败，请检查配置信息是否正确';
      }
    }

    // 实际应用中应调用API进行测试
    // const response = await fetch('/api/storage-policies/test', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(policy)
    // });
    // const result = await response.json();
    // testResult.success = result.success;
    // testResult.message = result.message;

  } catch (error) {
    console.error('测试连接失败:', error);
    testResult.success = false;
    testResult.message = '测试过程发生错误，请重试';
  } finally {
    testLoading.value = false;
  }
};

// 保存策略
const savePolicy = async () => {
  await policyFormRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;

    try {
      // 检查是否为默认策略
      if (policyForm.isEnable) {
        // 将其他策略设为非默认
        policies.value.forEach(item => {
          if (item.id !== policyForm.id) {
            item.isEnable = false;
          }
        });
      } else if (!isEdit.value && policies.value.length === 0) {
        // 如果是新增且没有策略，则默认设为默认策略
        policyForm.isEnable = true;
      }

      if (isEdit.value) {
        // 更新策略
        const index = policies.value.findIndex(item => item.id === policyForm.id);
        if (index !== -1) {
          policies.value[index] = { ...policies.value[index], ...policyForm };
        console.log('update:policies', policies.value[index]);
          const submitData = {
            ...policyForm,
            config: { ...policyForm.config },
            // 显式删除时间字段
            createTime: undefined,
            updateTime: undefined,
            status: undefined
          };
          delete submitData.createTime;
          delete submitData.updateTime;
          delete submitData.status;

         await updateStorageStrategy(submitData)
          console.log(submitData,"fdfd")
        }
        ElMessage.success('更新成功');
      } else {
        // 新增策略

        const strategyData = {
          strategyName: policyForm.strategyName,
          strategyKey: policyForm.strategyKey,
          accessUrl: policyForm.accessUrl,
          isEnable: policyForm.isEnable,
          // status: policyForm.status,
          description: policyForm.description,
          config: {}
        };

        // 根据存储类型设置不同的配置字段
        switch (policyForm.strategyKey) {
          case 'local':
            strategyData.config = {
              basePath: policyForm.config.basePath
            };
            break;
          case 'aliyun':
            strategyData.config = {
              endpoint: policyForm.config.endpoint,
              bucket: policyForm.config.bucket,
              accessKeyId: policyForm.config.accessKeyId,
              accessKeySecret: policyForm.config.accessKeySecret,
              prefix: policyForm.config.prefix
            };
            break;
          case 'tencent':
            strategyData.config = {
              region: policyForm.config.region,
              bucket: policyForm.config.bucket,
              secretId: policyForm.config.secretId,
              secretKey: policyForm.config.secretKey,
              prefix: policyForm.config.prefix
            };
            break;
          case 'qiniu':
            strategyData.config = {
              zone: policyForm.config.zone,
              bucket: policyForm.config.bucket,
              accessKey: policyForm.config.accessKey,
              secretKey: policyForm.config.secretKey,
              prefix: policyForm.config.prefix
            };
            break;
          case 'minio':
            strategyData.config = {
              endpoint: policyForm.config.endpoint,
              bucket: policyForm.config.bucket,
              accessKey: policyForm.config.accessKey,
              secretKey: policyForm.config.secretKey,
              useSSL: policyForm.config.useSSL,
              prefix: policyForm.config.prefix
            };
            break;
          case 's3':
            strategyData.config = {
              region: policyForm.config.region,
              bucket: policyForm.config.bucket,
              accessKeyId: policyForm.config.accessKeyId,
              secretAccessKey: policyForm.config.secretAccessKey,
              prefix: policyForm.config.prefix
            };
            break;
        }

        await saveStorageStrategy(strategyData)

        // const newPolicy = {
        //   ...policyForm,
        //   id: Date.now(), // 模拟ID生成
        //   createTime: new Date().toLocaleString()
        // };
        policies.value.push(strategyData);
        totalPolicies.value++;
        ElMessage.success('添加成功');
      }

      // 更新父组件的策略列表
      emit('update:policies', policies.value);

      // 关闭对话框
      policyDialogVisible.value = false;

    } catch (error) {
      console.error('保存策略失败:', error);
      ElMessage.error('保存失败');
    } finally {
      saving.value = false;
    }
  });
};

// 重置表单
const resetPolicyForm = () => {
  if (policyFormRef.value) {
    policyFormRef.value.resetFields();
  }

  // 重置表单状态
  policyForm.id = null;
  policyForm.strategyName = '';
  policyForm.strategyKey = 'local';
  policyForm.accessUrl = '';
  policyForm.isEnable = false;
  policyForm.status = true;
  policyForm.description = '';

  // 重置配置信息
  policyForm.config = {
    basePath: '',
    bucket: '',
    prefix: '',
    endpoint: '',
    accessKeyId: '',
    accessKeySecret: '',
    region: '',
    secretId: '',
    secretKey: '',
    zone: 'z0',
    accessKey: '',
    useSSL: true,
    secretAccessKey: ''
  };
};

// 存储类型变更处理
const handleTypeChange = (type) => {
  // 根据存储类型重置配置
  resetPolicyForm();
  policyForm.strategyKey = type;
};

// 获取存储类型标签样式
const getStorageTypeTag = (type) => {
  const types = {
    local: '',
    aliyun: 'danger',
    tencent: 'success',
    qiniu: 'warning',
    minio: 'info',
    s3: 'primary'
  };
  return types[type] || '';
};

// 获取存储类型名称
const getStorageTypeName = (type) => {
  const types = {
    local: '本地存储',
    aliyun: '阿里云OSS',
    tencent: '腾讯云COS',
    qiniu: '七牛云',
    minio: 'MinIO',
    s3: 'AWS S3'
  };
  return types[type] || type;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

// 将更新后的策略列表暴露给父组件
const updateStoragePolicies = () => {
  emit('update:policies', policies.value);
};
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
