<template>
  <div class="role-list">
    <el-card v-show="showFilter" :class="{ 'filter-card-slide': showFilter }"
             class="filter-card mb-4">
      <el-form :inline="true" :model="filters" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="searchQuery" clearable placeholder="请输入角色名称"
                    prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary" @click="searchRoles">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="resetSearch">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="handleAddRole">
              添加角色
            </el-button>
            <div v-show="selectedRoles.length" class="batch-actions">
              <el-button :disabled="loading" :icon="Delete" type="danger"
                         @click="handleBatchDelete">批量删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="table-card" element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">角色列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button :icon="Search" circle text type="primary"
                       @click="showFilter = true"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text
                       type="primary" @click="fetchRoles()"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="rolesList"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column :reserve-selection="true" align="center" type="selection" width="55"/>
        <el-table-column align="center" label="角色名称" min-width="150" prop="name">
          <template #default="scope">
            <span class="role-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="角色描述" min-width="200" prop="description"
                         show-overflow-tooltip/>
        <!--        <el-table-column align="center" label="系统角色" prop="isSystem" width="100">-->
        <!--          <template #default="scope">-->
        <!--            <el-tag :type="scope.row.isSystem === 1 ? 'success' : 'info'" effect="dark" round>-->
        <!--              {{ scope.row.isSystem === 1 ? '是' : '否' }}-->
        <!--            </el-tag>-->
        <!--          </template>-->
        <!--        </el-table-column>-->
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="创建时间" min-width="180"
                         prop="createTime"/>
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="更新时间" min-width="180"
                         prop="updateTime"/>
        <el-table-column align="center" fixed="right" label="操作" width="250">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑角色" placement="top">
                <el-button
                  :disabled="scope.row.isSystem === 1"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="handleEdit(scope.row)"
                >
                </el-button>
              </el-tooltip>
              <el-tooltip content="分配权限" placement="top">
                <el-button
                  :icon="Setting"
                  circle
                  class="action-button permission-button"
                  size="small"
                  type="success"
                  @click="handlePermissions(scope.row)"
                >
                </el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该角色吗？"
                @confirm="handleDelete(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="scope.row.isSystem === 1"
                    :icon="Delete"
                    circle
                    class="action-button delete-button"
                    size="small"
                    type="danger"
                  >
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :background="true"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加角色' : '编辑角色'"
      class="custom-dialog"
      width="600px"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="rules"
        class="optimized-form"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" class="full-width-input" placeholder="请输入角色名称"/>
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            :rows="3"
            class="full-width-input"
            placeholder="请输入角色描述"
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
          <el-button class="submit-button" type="primary" @click="submitRoleForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog
      v-model="permissionsDialogVisible"
      class="custom-dialog permission-dialog"
      title="分配权限"
      width="800px"
    >
      <div v-if="currentRole" class="permission-header">
        <el-alert
          :closable="false"
          show-icon
          type="info"
        >
          <template #title>
            <span>为角色 "<strong>{{ currentRole.name }}</strong>" 分配权限</span>
          </template>
        </el-alert>
      </div>

      <div class="permission-toolbar">
        <el-input
          v-model="permissionSearchQuery"
          clearable
          placeholder="搜索权限名称或标识"
          prefix-icon="Search"
          @input="filterPermissions"
        />
        <div class="permission-actions">
          <el-button size="default" type="primary" @click="selectAllPermissions">全选</el-button>
          <el-button size="default" type="info" @click="deselectAllPermissions">清空</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="permission-tabs">
        <el-tab-pane label="按模块选择" name="module">
          <el-scrollbar height="400px">
            <el-tree
              ref="permissionTreeRef"
              :data="permissionTree"
              :default-checked-keys="checkedPermissionKeys"
              :default-expanded-keys="expandedKeys"
              :props="{
                label: 'name',
                children: 'children'
              }"
              highlight-current
              node-key="id"
              show-checkbox
              @check="handleTreeCheck"
            >
              <template #default="{ node, data }">
                <div class="tree-node-content">
                  <span class="tree-node-label">{{ node.label }}</span>
                  <el-tag
                    v-if="data.identity"
                    class="tree-node-tag"
                    size="small"
                    type="primary"
                  >
                    {{ data.identity }}
                  </el-tag>
                  <span v-if="data.description" class="tree-node-desc">{{ data.description }}</span>
                </div>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-tab-pane>

        <el-tab-pane label="表格视图" name="table">
          <el-scrollbar height="400px">
            <el-table
              :data="filteredPermissionsList"
              border
              class="permission-table"
              row-key="id"
              stripe
              @selection-change="handleTableSelectionChange"
            >
              <el-table-column :selectable="isPermissionSelectable" type="selection" width="55"/>
              <el-table-column label="权限名称" min-width="150" prop="name" show-overflow-tooltip/>
              <el-table-column label="权限标识" min-width="150" prop="identity"
                               show-overflow-tooltip>
                <template #default="scope">
                  <el-tag size="small" type="primary">{{ scope.row.identity }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="所属模块" min-width="120" prop="module" show-overflow-tooltip>
                <template #default="scope">
                  <el-tag size="small" type="success">{{ scope.row.module }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="权限描述" min-width="180" prop="description"
                               show-overflow-tooltip/>
            </el-table>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>

      <div class="permission-footer">
        <div class="permission-stats">
          已选择
          <el-tag effect="dark" type="success">{{ selectedPermissionCount }}</el-tag>
          个权限，共 {{ permissionsList.length }} 个
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-button" @click="cancelPermissionAssignment">取消</el-button>
          <el-button :loading="savingPermissions" class="submit-button" type="primary"
                     @click="saveRolePermissions">保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed, nextTick} from 'vue';
import {Search, Refresh, Plus, Edit, Delete, Filter, Setting} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {addRole, deleteRole, getRoleByCondition, updateRole} from "#/api/core/roles.ts";
import {useWindowSize} from '@vueuse/core';

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 筛选条件显示状态
const showFilter = ref(true);
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  // 保存筛选器状态到localStorage
  try {
    localStorage.setItem('role_filter_status', JSON.stringify(showFilter.value));
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('role_filter_status');
    if (status !== null) {
      showFilter.value = JSON.parse(status);
    }
  } catch (error) {
    console.error('获取存储的筛选器状态出错:', error);
  }
};

const filters = ref({
  name: ''
});

// 角色列表数据
const rolesList = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');

const selectedRoles = ref([]);

// 添加/编辑角色对话框
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const roleFormRef = ref(null);
const roleForm = reactive({
  id: null,
  name: '',
  description: ''
});

// 表单验证规则
const rules = {
  name: [
    {required: true, message: '请输入角色名称', trigger: 'blur'},
    {min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur'}
  ],
  description: [
    {max: 200, message: '长度不能超过 200 个字符', trigger: 'blur'}
  ]
};

// 处理表格多选

const handleSelectionChange = (selection) => {
  console.log('选中的行:', selection);
  selectedRoles.value = selection;
};

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRoles.value.length) return;

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRoles.value.length} 个权限吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 这里替换为实际的API调用
      // const ids = selectedPermissions.value.map(item => item.id);
      // await api.batchDeletePermissions(ids);


      ElMessage.success('批量删除成功');
      selectedRoles.value = [];
      // await getPermissionList();
    } catch (error) {
      console.error('批量删除失败', error);
      ElMessage.error('批量删除失败');
    }
  }).catch(() => {
  });
};


// 权限相关
const permissionsDialogVisible = ref(false);
const currentRole = ref(null);
const permissionsList = ref([]);
const filteredPermissionsList = ref([]);
const selectedPermissions = ref({});
const activeTab = ref('module');
const permissionSearchQuery = ref('');
const savingPermissions = ref(false);
const permissionTree = ref([]);
const expandedKeys = ref([]);
// 确保是数组类型
const checkedPermissionKeys = ref([]);
const permissionTableSelection = ref([]);
// 树组件引用
const permissionTreeRef = ref(null);

// 计算已选择的权限数量
const selectedPermissionCount = computed(() => {
  return Object.values(selectedPermissions.value).filter(Boolean).length;
});

// 按模块分组的权限
const groupedPermissions = computed(() => {
  const groups = {};
  permissionsList.value.forEach(permission => {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }
    groups[permission.module].push(permission);
  });
  return groups;
});

// 将权限转换为树形结构
const buildPermissionTree = () => {
  const modules = {};

  // 按模块分组
  permissionsList.value.forEach(permission => {
    if (!modules[permission.module]) {
      modules[permission.module] = {
        id: `module-${permission.module}`,
        name: permission.module,
        children: []
      };
    }

    modules[permission.module].children.push({
      id: permission.id,
      name: permission.name,
      identity: permission.identity,
      description: permission.description
    });
  });

  // 转换为数组
  permissionTree.value = Object.values(modules);

  // 设置默认展开的节点
  expandedKeys.value = permissionTree.value.map(module => module.id);
};

// 处理树形控件选中状态变化
const handleTreeCheck = (data, checkedStatus) => {
  // 获取所有选中的节点ID
  const {checkedNodes} = checkedStatus;

  // 重置选中状态
  permissionsList.value.forEach(permission => {
    selectedPermissions.value[permission.id] = false;
  });

  // 设置新的选中状态 - 只选择叶子节点（实际权限）
  checkedNodes.forEach(node => {
    // 确保不是模块节点（没有children属性的节点为权限节点）
    if (node.id && !node.children && typeof node.id === 'number') {
      selectedPermissions.value[node.id] = true;
    }
  });
};

// 处理表格选择变化
const handleTableSelectionChange = (selection) => {
  // 保存当前表格选择
  permissionTableSelection.value = selection;

  // 先清除所有选择状态
  Object.keys(selectedPermissions.value).forEach(key => {
    selectedPermissions.value[key] = false;
  });

  // 设置新的选择状态
  selection.forEach(item => {
    if (item && item.id) {
      selectedPermissions.value[item.id] = true;
    }
  });

  // 如果在表格视图中，同步更新树选择状态
  if (activeTab.value === 'table' && permissionTreeRef.value) {
    const keys = selection.map(item => item.id).filter(id => id);
    nextTick(() => {
      permissionTreeRef.value.setCheckedKeys(keys);
    });
  }
};

// 检查权限是否可选
const isPermissionSelectable = (row) => {
  return true; // 可根据需要添加限制
};

// 筛选权限
const filterPermissions = () => {
  if (!permissionSearchQuery.value) {
    filteredPermissionsList.value = permissionsList.value;
    return;
  }

  const query = permissionSearchQuery.value.toLowerCase();
  filteredPermissionsList.value = permissionsList.value.filter(permission =>
    permission.name.toLowerCase().includes(query) ||
    permission.identity.toLowerCase().includes(query) ||
    permission.module.toLowerCase().includes(query) ||
    (permission.description && permission.description.toLowerCase().includes(query))
  );
};

// 全选权限
const selectAllPermissions = () => {
  // 设置所有权限为选中状态
  permissionsList.value.forEach(permission => {
    selectedPermissions.value[permission.id] = true;
  });

  // 使用组件引用更新树的选中状态
  if (permissionTreeRef.value) {
    const keys = permissionsList.value.map(item => item.id);
    nextTick(() => {
      permissionTreeRef.value.setCheckedKeys(keys);
    });
  }
};

// 清空选择
const deselectAllPermissions = () => {
  // 清空所有选中状态
  permissionsList.value.forEach(permission => {
    selectedPermissions.value[permission.id] = false;
  });

  // 使用组件引用更新树的选中状态
  if (permissionTreeRef.value) {
    nextTick(() => {
      permissionTreeRef.value.setCheckedKeys([]);
    });
  }
};

// 取消权限分配
const cancelPermissionAssignment = () => {
  permissionsDialogVisible.value = false;
  permissionSearchQuery.value = '';
  filteredPermissionsList.value = [];
};

// 分配权限
const handlePermissions = async (row) => {
  currentRole.value = row;
  permissionsDialogVisible.value = true;

  try {
    // 这里替换为实际的API调用
    // const [allPermissions, rolePermissions] = await Promise.all([
    //   api.getAllPermissions(),
    //   api.getRolePermissions(row.id)
    // ]);

    // 模拟数据
    const allPermissions = [
      {
        id: 1,
        name: '查看用户',
        identity: 'user:view',
        module: '用户管理',
        description: '查看用户列表'
      },
      {
        id: 2,
        name: '添加用户',
        identity: 'user:add',
        module: '用户管理',
        description: '添加新用户'
      },
      {
        id: 3,
        name: '编辑用户',
        identity: 'user:edit',
        module: '用户管理',
        description: '编辑用户信息'
      },
      {
        id: 4,
        name: '删除用户',
        identity: 'user:delete',
        module: '用户管理',
        description: '删除用户'
      },
      {
        id: 5,
        name: '查看文章',
        identity: 'article:view',
        module: '内容管理',
        description: '查看文章列表'
      },
      {
        id: 6,
        name: '添加文章',
        identity: 'article:add',
        module: '内容管理',
        description: '添加新文章'
      },
      {
        id: 7,
        name: '编辑文章',
        identity: 'article:edit',
        module: '内容管理',
        description: '编辑文章'
      },
      {
        id: 8,
        name: '删除文章',
        identity: 'article:delete',
        module: '内容管理',
        description: '删除文章'
      },
      {
        id: 9,
        name: '查看评论',
        identity: 'comment:view',
        module: '评论管理',
        description: '查看评论列表'
      },
      {
        id: 10,
        name: '审核评论',
        identity: 'comment:review',
        module: '评论管理',
        description: '审核评论'
      },
    ];

    // 模拟当前角色已有的权限ID
    const rolePermissions = row.id === 1 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] :
      row.id === 2 ? [1, 5, 6, 7, 9, 10] : [1, 5, 9];

    permissionsList.value = allPermissions;
    filteredPermissionsList.value = allPermissions;

    // 初始化选中状态
    const selectedPerms = {};

    allPermissions.forEach(permission => {
      selectedPerms[permission.id] = rolePermissions.includes(permission.id);
    });

    selectedPermissions.value = selectedPerms;

    // 构建权限树
    buildPermissionTree();

    // 设置初始选中的权限 - 确保是数字数组
    const keys = rolePermissions.filter(id => typeof id === 'number');
    checkedPermissionKeys.value = keys;

  } catch (error) {
    console.error('获取权限数据失败:', error);
    ElMessage.error('获取权限数据失败');
  }
};

// 保存角色权限
const saveRolePermissions = async () => {
  if (!currentRole.value) return;

  // 获取选中的权限ID
  const permissionIds = Object.entries(selectedPermissions.value)
    .filter(([_, selected]) => selected)
    .map(([id]) => parseInt(id));

  try {
    savingPermissions.value = true;
    // 这里替换为实际的API调用
    // await api.updateRolePermissions(currentRole.value.id, permissionIds);

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success(`角色 "${currentRole.value.name}" 的权限已更新`);
    permissionsDialogVisible.value = false;
    permissionSearchQuery.value = '';
    savingPermissions.value = false;
  } catch (error) {
    console.error('保存角色权限失败:', error);
    ElMessage.error('保存角色权限失败');
    savingPermissions.value = false;
  }
};

// 初始化
onMounted(() => {
  fetchRoles();
});

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true;
  try {
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      name: searchQuery.value
    };
    const res = await getRoleByCondition(params)
    rolesList.value = res.records || [];
    total.value = res.total || 0;
    currentPage.value = res.current;
    pageSize.value = res.size;
    loading.value = false;

  } catch (error) {
    console.error('获取角色列表失败:', error);
    ElMessage.error('获取角色列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索角色
const searchRoles = () => {
  currentPage.value = 1;
  fetchRoles();
};

// 重置搜索
const resetSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchRoles();
};

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchRoles();
};

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchRoles();
};

// 添加角色
const handleAddRole = () => {
  dialogType.value = 'add';
  roleForm.id = null;
  roleForm.name = '';
  roleForm.description = '';
  dialogVisible.value = true;
};

// 编辑角色
const handleEdit = (row) => {
  dialogType.value = 'edit';
  roleForm.id = row.id;
  roleForm.name = row.name;
  roleForm.description = row.description;
  dialogVisible.value = true;
};

// 删除角色
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除角色 "${row.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await deleteRole(row.id)
        ElMessage.success('删除成功');
        await fetchRoles();
      } catch (error) {
        console.error('删除角色失败:', error);
        ElMessage.error('删除角色失败');
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

// 提交角色表单
const submitRoleForm = async () => {
  if (!roleFormRef.value) return;

  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          roleForm.id = undefined;
          await addRole(roleForm)
          ElMessage.success('添加角色成功');
        } else {
          await updateRole(roleForm)
          ElMessage.success('更新角色成功');
        }

        dialogVisible.value = false;
        await fetchRoles();
      } catch (error) {
        console.error('保存角色失败:', error);
        ElMessage.error('保存角色失败');
      }
    } else {
      return false;
    }
  });
};
</script>

<style scoped>
.role-list {
  padding: 20px;
}

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

.filter-container {
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
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 15px 0;
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

.permission-button {
  background-color: var(--el-color-success);
  border-color: var(--el-color-success);
}

.delete-button {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

.role-name {
  font-weight: 500;
  color: var(--el-color-primary);
}

.full-width-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 权限对话框样式 */
.permission-dialog {
  --el-dialog-padding-primary: 0;
}

.permission-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
}

.permission-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.permission-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 15px;
}

.permission-actions {
  display: flex;
  gap: 10px;
}

.permission-tabs {
  padding: 0 16px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.tree-node-label {
  font-weight: 500;
}

.tree-node-tag {
  font-size: 12px;
  height: 22px;
  line-height: 20px;
}

.tree-node-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.permission-footer {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.permission-table {
  margin-top: 10px;
  border-radius: 4px;
  overflow: hidden;
}

.custom-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 30px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-info-light-9);
}

.custom-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 30px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 20px 30px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-info-light-9);
}

.cancel-button,
.submit-button {
  min-width: 100px;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
}

.submit-button {
  font-weight: 500;
}

/* 表格行hover效果 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-color-primary-light-9) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表头样式 */
:deep(.el-table__header) {
  font-weight: bold;
  background-color: var(--el-color-info-light-9);
}

:deep(.el-table__header th) {
  background-color: var(--el-color-info-light-9);
  color: var(--el-text-color-primary);
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 15px 20px;
}

:deep(.el-backtop) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: #fff;
}

/* 按钮hover效果 */
.table-actions .el-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

@media (max-width: 768px) {
  .role-list {
    padding: 10px;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;
  }

  .el-input,
  .el-select,
  .el-date-editor {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .batch-actions {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
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

  .action-cell {
    flex-wrap: wrap;
  }

  .permission-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .permission-actions {
    justify-content: space-between;
    margin-top: 10px;
  }
}
</style>
