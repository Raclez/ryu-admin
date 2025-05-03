<template>
  <div class="user-management-container">
    <!-- 筛选区域 -->
    <el-card
      v-if="showFilter"
      :class="{ 'filter-card-slide': showFilter }"
      class="filter-card mb-4"
    >
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item class="form-item">
          <el-input
            v-model="queryParams.username"
            class="search-input"
            clearable
            placeholder="请输入用户名搜索"
            prefix-icon="Search"
            size="large"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <div class="action-buttons">
            <el-button type="primary" @click="handleSearch">
              <el-icon>
                <Search/>
              </el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon>
                <RefreshRight/>
              </el-icon>
              重置
            </el-button>
            <el-button type="success" @click="openUserDialog('add')">
              <el-icon>
                <Plus/>
              </el-icon>
              新增用户
            </el-button>
            <el-button
              v-show="selectedUsers.length > 0"
              type="danger"
              @click="handleBatchDelete"
            >
              <el-icon>
                <Delete/>
              </el-icon>
              批量删除
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格卡片 -->
    <el-card
      v-loading="loading"
      class="table-card"
      element-loading-background="rgba(0, 0, 0, 0.1)"
      element-loading-text="加载中..."
    >
      <div class="table-header">
        <div class="table-title">用户管理</div>
        <div class="table-actions">
          <el-tooltip content="筛选条件" placement="top">
            <el-button
              :icon="Filter"
              circle
              text
              type="primary"
              @click="toggleFilter"
            />
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button
              :icon="Refresh"
              :loading="loading"
              circle
              text
              type="primary"
              @click="fetchUserList"
            />
          </el-tooltip>
          <el-tooltip content="导出数据" placement="top">
            <el-button
              :icon="Download"
              circle
              text
              type="primary"
              @click="exportData"
            />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        v-loading="loading"
        :data="userList"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <el-table-column label="用户名" min-width="100" prop="username" show-overflow-tooltip/>
        <el-table-column label="用户昵称" min-width="100" prop="nickname" show-overflow-tooltip/>
        <el-table-column label="邮箱" min-width="140" prop="email" show-overflow-tooltip/>
        <el-table-column label="手机号" min-width="120" prop="phone" show-overflow-tooltip/>
        <el-table-column label="角色" min-width="140" prop="roleNames" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag
              v-for="(role, index) in row.roleNames"
              :key="index"
              class="mx-1"
              effect="light"
              size="small"
              type="info"
            >
              {{ role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="dark" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录时间" min-width="160" prop="lastLoginTime"
                         show-overflow-tooltip/>
        <el-table-column label="创建时间" min-width="160" prop="createTime" show-overflow-tooltip/>
        <el-table-column fixed="right" label="操作" width="180">
          <template #default="{ row }">
            <div class="action-cell">
              <el-tooltip content="编辑用户" placement="top">
                <el-button
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="openUserDialog('edit', row)"
                >
                  <el-icon>
                    <Edit/>
                  </el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="重置密码" placement="top">
                <el-button
                  circle
                  class="action-button"
                  size="small"
                  type="warning"
                  @click="openResetPwdDialog(row)"
                >
                  <el-icon>
                    <Key/>
                  </el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除用户" placement="top">
                <el-button
                  circle
                  class="action-button delete-button"
                  size="small"
                  type="danger"
                  @click="handleDeleteUser(row)"
                >
                  <el-icon>
                    <Delete/>
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.currentPage"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>

    <!-- 用户编辑对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :close-on-click-modal="false"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      destroy-on-close
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        class="optimized-form"
        label-width="100px"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                :disabled="dialogType === 'edit'"
                class="full-width-input"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickname">
              <el-input
                v-model="userForm.nickname"
                class="full-width-input"
                placeholder="请输入用户昵称"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="dialogType === 'add'" :gutter="24">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="userForm.password"
                class="full-width-input"
                placeholder="请输入密码"
                show-password
                type="password"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="userForm.confirmPassword"
                class="full-width-input"
                placeholder="请再次输入密码"
                show-password
                type="password"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="userForm.email"
                class="full-width-input"
                placeholder="请输入邮箱"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="userForm.phone"
                class="full-width-input"
                placeholder="请输入手机号"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">

          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="userForm.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="userForm.roleIds"
            class="full-width-input"
            multiple
            placeholder="请选择角色"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="userForm.remark"
            :rows="3"
            placeholder="请输入备注信息"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUserForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      :close-on-click-modal="false"
      destroy-on-close
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdForm"
        :rules="resetPwdRules"
        class="optimized-form"
        label-width="100px"
      >
        <el-form-item label="用户名">
          <el-input v-model="resetPwdForm.username" disabled/>
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetPwdForm.password"
            placeholder="请输入新密码"
            show-password
            type="password"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            placeholder="请再次输入新密码"
            show-password
            type="password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPwdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPwd">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {ref, reactive, onMounted} from 'vue';
import {ElMessage, ElMessageBox, ElTable} from 'element-plus';
import {
  Plus,
  Delete,
  Search,
  RefreshRight,
  Download,
  Filter,
  Refresh,
  Edit,
  Key
} from '@element-plus/icons-vue';
import {
  getUserPageApi,
  getUserDetailApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  batchDeleteUserApi,
  resetPasswordApi
} from '#/api/core/user';
import {getAllRoles} from '#/api/core/roles';
import type {UserApi} from '#/api/core/user';
import type {UserInfo} from '@vben/types';

// 导出数据的工具函数
interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any) => any;
}

interface ExportOptions {
  data: any[];
  headers: ExportColumn[];
  filename: string;
}

const exportToExcel = (options: ExportOptions) => {
  const {data, headers, filename} = options;

  // 将数据转换为CSV格式
  const csvContent = [
    // 表头行
    headers.map(col => `"${col.header}"`).join(','),
    // 数据行
    ...data.map(row => {
      return headers.map(col => {
        let value = row[col.key];

        // 如果有格式化函数，使用它来处理值
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(value);
        }

        // 处理特殊情况
        if (value === null || value === undefined) {
          return '""';
        } else if (typeof value === 'string') {
          // 对字符串进行转义，防止CSV注入
          return `"${value.replace(/"/g, '""')}"`;
        } else if (Array.isArray(value)) {
          // 数组转为字符串
          return `"${value.join(', ')}"`;
        } else {
          return `"${value}"`;
        }
      }).join(',');
    })
  ].join('\n');

  // 创建Blob对象
  const blob = new Blob(['\ufeff' + csvContent], {type: 'text/csv;charset=utf-8;'});

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 表格数据
const userList = ref<UserApi.UserDetail[]>([]);
const loading = ref(false);
const total = ref(0);
const multipleTableRef = ref<InstanceType<typeof ElTable>>();
const selectedUsers = ref<UserApi.UserDetail[]>([]);

// 查询参数 - 简化只保留用户名搜索
const queryParams = reactive<UserApi.UserQueryParams>({
  currentPage: 1,
  pageSize: 10,
  username: '',
  nickname: undefined,
  status: undefined,
  roleId: undefined
});

// 筛选区域显示控制
const showFilter = ref(false);
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true;
  try {
    const res = await getUserPageApi(queryParams);
    userList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('获取用户列表失败', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索和重置
const handleSearch = () => {
  queryParams.currentPage = 1;
  fetchUserList();
};

const handleReset = () => {
  queryParams.username = '';
  queryParams.nickname = undefined;
  queryParams.status = undefined;
  queryParams.roleId = undefined;
  queryParams.currentPage = 1;
  fetchUserList();
};

// 分页
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  fetchUserList();
};

const handleCurrentChange = (val: number) => {
  queryParams.currentPage = val;
  fetchUserList();
};

// 表格多选
const handleSelectionChange = (rows: UserApi.UserDetail[]) => {
  selectedUsers.value = rows;
};

// 角色选项
const roleOptions = ref<{ id: string; name: string }[]>([]);
const fetchRoleOptions = async () => {
  try {
    const res = await getAllRoles();
    roleOptions.value = res.map(item => ({
      id: item.id,
      name: item.name
    }));
  } catch (error) {
    console.error('获取角色列表失败', error);
  }
};

// 部门选项（实际项目中应当从API获取）
const deptOptions = ref<{ id: string; name: string }[]>([
  {id: '1', name: '研发部'},
  {id: '2', name: '运营部'},
  {id: '3', name: '市场部'},
  {id: '4', name: '人事部'},
  {id: '5', name: '财务部'}
]);

// 用户表单相关
const userDialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const userFormRef = ref();
const userForm = reactive<UserApi.UserCreateParams & { confirmPassword?: string }>({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
  phone: '',
  roleIds: [],
  deptId: undefined,
  status: 1,
  remark: ''
});

// 表单验证规则
const validatePassword = (rule: any, value: string, callback: Function) => {
  if (dialogType.value === 'add' && !value) {
    callback(new Error('请输入密码'));
  } else if (value && value.length < 6) {
    callback(new Error('密码长度不能小于6位'));
  } else {
    callback();
  }
};

const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (dialogType.value === 'add' && !value) {
    callback(new Error('请再次输入密码'));
  } else if (value !== userForm.password) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const userRules = {
  username: [
    {required: true, message: '请输入用户名', trigger: 'blur'},
    {min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur'}
  ],
  password: [{validator: validatePassword, trigger: 'blur'}],
  confirmPassword: [{validator: validateConfirmPassword, trigger: 'blur'}],
  email: [
    {required: false, message: '请输入邮箱', trigger: 'blur'},
    {type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur'}
  ],
  phone: [
    {required: false, message: '请输入手机号', trigger: 'blur'},
    {pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur'}
  ],
  roleIds: [{required: true, message: '请选择角色', trigger: 'change'}]
};

// 新增/编辑用户对话框
const openUserDialog = async (type: 'add' | 'edit', row?: UserApi.UserDetail) => {
  dialogType.value = type;
  userDialogVisible.value = true;
  resetUserForm();

  if (type === 'edit' && row) {
    try {
      const userDetail = await getUserDetailApi(row.userId || '');
      Object.assign(userForm, {
        id: userDetail.userId,
        username: userDetail.username,
        nickname: userDetail.nickname,
        email: userDetail.email,
        phone: userDetail.phone,
        roleIds: userDetail.roleIds,
        deptId: userDetail.deptId,
        status: userDetail.status,
        remark: userDetail.remark
      });
    } catch (error) {
      console.error('获取用户详情失败', error);
      ElMessage.error('获取用户详情失败');
    }
  }
};

// 重置用户表单
const resetUserForm = () => {
  if (userFormRef.value) {
    userFormRef.value.resetFields();
  }
  Object.assign(userForm, {
    id: undefined,
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: '',
    phone: '',
    roleIds: [],
    deptId: undefined,
    status: 1,
    remark: ''
  });
};

// 关闭对话框
const handleDialogClose = () => {
  resetUserForm();
};

// 提交用户表单
const submitUserForm = async () => {
  if (!userFormRef.value) return;

  await userFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const params: UserApi.UserCreateParams = {
          ...userForm
        };

        // 编辑模式不提交密码和确认密码
        if (dialogType.value === 'edit') {
          delete params.password;
        }

        // 移除确认密码字段（不是API参数的一部分）
        const {confirmPassword, ...apiParams} = params;

        if (dialogType.value === 'add') {
          await createUserApi(apiParams);
          ElMessage.success('新增用户成功');
        } else {
          await updateUserApi(apiParams);
          ElMessage.success('更新用户成功');
        }

        userDialogVisible.value = false;
        fetchUserList();
      } catch (error) {
        console.error('提交用户表单失败', error);
        ElMessage.error('操作失败，请稍后重试');
      }
    }
  });
};

// 重置密码相关
const resetPwdDialogVisible = ref(false);
const resetPwdFormRef = ref();
const resetPwdForm = reactive({
  userId: '',
  username: '',
  password: '',
  confirmPassword: ''
});

const resetPwdRules = {
  password: [
    {required: true, message: '请输入新密码', trigger: 'blur'},
    {min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur'}
  ],
  confirmPassword: [
    {required: true, message: '请再次输入新密码', trigger: 'blur'},
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== resetPwdForm.password) {
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 打开重置密码对话框
const openResetPwdDialog = (row: UserApi.UserDetail) => {
  resetPwdForm.userId = row.userId || '';
  resetPwdForm.username = row.username || '';
  resetPwdForm.password = '';
  resetPwdForm.confirmPassword = '';
  resetPwdDialogVisible.value = true;
};

// 提交重置密码
const submitResetPwd = async () => {
  if (!resetPwdFormRef.value) return;

  await resetPwdFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 调用重置密码API
        await resetPasswordApi(resetPwdForm.userId, resetPwdForm.password);

        ElMessage.success('密码重置成功');
        resetPwdDialogVisible.value = false;
      } catch (error) {
        console.error('重置密码失败', error);
        ElMessage.error('重置密码失败，请稍后重试');
      }
    }
  });
};

// 删除用户
const handleDeleteUser = (row: UserApi.UserDetail) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUserApi(row.userId || '');
      ElMessage.success('删除成功');
      fetchUserList();
    } catch (error) {
      console.error('删除用户失败', error);
      ElMessage.error('删除失败，请稍后重试');
    }
  }).catch(() => {
  });
};

// 批量删除用户
const handleBatchDelete = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要删除的用户');
    return;
  }

  ElMessageBox.confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const ids = selectedUsers.value.map(item => item.userId || '');
      await batchDeleteUserApi(ids);
      ElMessage.success('批量删除成功');
      fetchUserList();
    } catch (error) {
      console.error('批量删除用户失败', error);
      ElMessage.error('批量删除失败，请稍后重试');
    }
  }).catch(() => {
  });
};

// 导出数据
const exportData = () => {
  const headers = [
    {header: '用户名', key: 'username'},
    {header: '用户昵称', key: 'nickname'},
    {header: '邮箱', key: 'email'},
    {header: '手机号', key: 'phone'},
    {header: '角色', key: 'roleNames'},
    {header: '状态', key: 'status', formatter: (value: number) => (value === 1 ? '启用' : '禁用')},
    {header: '最后登录时间', key: 'lastLoginTime'},
    {header: '创建时间', key: 'createTime'}
  ];

  exportToExcel({
    data: userList.value,
    headers,
    filename: '用户列表'
  });
};

// 生命周期
onMounted(() => {
  fetchUserList();
  fetchRoleOptions();
});
</script>

<style scoped>
.user-management-container {
  padding: 20px;
  min-height: calc(100vh - 60px);
}

/* 筛选卡片样式 */
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

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 15px;
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

.search-input {
  width: 300px;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 400px;
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
  align-items: center;
}

.responsive-table {
  width: 100%;
  overflow-x: auto;
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

.pagination-container {
  margin-top: 16px;
  padding: 10px 0;
  display: flex;
  justify-content: flex-start;
}

.optimized-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.full-width-input {
  width: 100%;
}

.mx-1 {
  margin-left: 4px;
  margin-right: 4px;
}

/* 表格样式增强 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-color-primary-light-9) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-table__header) {
  font-weight: bold;
  background-color: var(--el-color-info-light-9);
}

:deep(.el-table__header th) {
  background-color: var(--el-color-info-light-9);
  color: var(--el-text-color-primary);
}

:deep(.el-backtop) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: #fff;
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 15px 20px;
}

/* 按钮hover效果 */
.table-actions .el-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-management-container {
    padding: 10px;
  }

  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
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
</style>
