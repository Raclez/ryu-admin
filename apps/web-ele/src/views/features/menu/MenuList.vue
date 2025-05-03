<template>
  <div class="menu-list">
    <el-card v-show="showFilter" :class="{ 'filter-card-slide': showFilter }"
             class="filter-card mb-4">
      <el-form :inline="true" :model="filters" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="keyword" clearable placeholder="请输入菜单名" prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary" @click="fetchMenu">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="reset">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="openDialog">
              添加菜单
            </el-button>
            <div v-show="selectedRows.length" class="batch-actions">
              <el-button :disabled="loading" :icon="Delete" type="danger" @click="deleteSelected">
                批量删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="table-card" element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">菜单列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button :icon="Search" circle text type="primary"
                       @click="showFilter = true"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text type="primary"
                       @click="fetchMenu"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 层级表格 -->
      <el-table
        ref="multipleTableRef"
        :data="tableData"
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <!-- <el-table-column :reserve-selection="true" type="selection" width="55"/> -->
        <!-- 可展开子菜单 -->
        <el-table-column type="expand">
          <template #default="scope">
            <div class="expanded-content">
              <el-table
                :data="scope.row.children || []"

                :show-header="false"
                class="inner-table"
                row-key="id">
                <el-table-column width="55">
                  <template #default>
                    <div class="child-indent-marker"></div>
                  </template>
                </el-table-column>

                <el-table-column align="center" label="菜单名称" min-width="150"
                                 show-overflow-tooltip>
                  <template #default="props">
                    <span class="menu-name">{{ props.row.name }}</span>
                  </template>
                </el-table-column>

                <el-table-column align="center" label="菜单路径" min-width="200"
                                 show-overflow-tooltip>
                  <template #default="props">
                    <span>{{ props.row.url }}</span>
                  </template>
                </el-table-column>

                <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                                 label="图标"
                                 min-width="80">
                  <template #default="props">
                    <i :class="props.row.icon"></i>
                  </template>
                </el-table-column>

                <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                                 label="菜单类型"
                                 min-width="100">
                  <template #default="props">
                    <el-tag :type="getMenuTypeTagType(props.row.menuType)" size="small">
                      {{ menuTypeMap[props.row.menuType] || '未知类型' }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column align="center" label="状态" min-width="80">
                  <template #default="props">
                    <el-tag
                      :type="props.row.isActive ? 'success' : 'danger'"
                      effect="dark"
                      round
                    >
                      {{ props.row.isActive ? '启用' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                                 label="排序"
                                 min-width="80">
                  <template #default="props">
                    <el-progress
                      :color="getSortColor(props.row.sort)"
                      :percentage="getSortPercentage(props.row.sort)"
                      :show-text="false"
                      :stroke-width="10"
                      class="sort-progress"
                    />
                    <span
                      :style="{
                        color: props.row.sort > 50 ? '#e6a23c' : '#409eff',
                        fontWeight: props.row.sort > 50 ? 'bold' : 'normal'
                      }"
                      class="sort-value"
                    >{{ props.row.sort }}</span>
                  </template>
                </el-table-column>

                <el-table-column align="center" fixed="right" label="操作" width="160">
                  <template #default="props">
                    <div class="action-cell">
                      <el-tooltip content="编辑菜单" placement="top">
                        <el-button
                          :disabled="loading"
                          :icon="Edit"
                          circle
                          class="action-button edit-button"
                          size="small"
                          type="primary"
                          @click="handleEdit(props.row)"
                        ></el-button>
                      </el-tooltip>
                      <el-popconfirm
                        :icon="Delete"
                        cancel-button-text="取消"
                        confirm-button-text="删除"
                        confirm-button-type="danger"
                        icon-color="#F56C6C"
                        title="确定删除该菜单吗？"
                        @confirm="handleDelete(props.row)"
                      >
                        <template #reference>
                          <el-button
                            :disabled="loading"
                            :icon="Delete"
                            circle
                            class="action-button delete-button"
                            size="small"
                            type="danger"
                          ></el-button>
                        </template>
                      </el-popconfirm>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <!-- 主表格列 -->
        <el-table-column align="center" label="菜单名称" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <span class="menu-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="菜单路径" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <el-tooltip :content="scope.row.isExternal ? '外部链接' : '内部路由'" placement="top">
              <span :class="{'external-link': scope.row.isExternal}">
                {{ scope.row.url }}
                <el-icon v-if="scope.row.isExternal" class="external-icon"><Link/></el-icon>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="组件路径" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.component">{{ scope.row.component }}</span>
            <span v-else class="no-data-text">{{ scope.row.isExternal ? '外部链接' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center" label="图标"
                         min-width="80">
          <template #default="scope">
            <i :class="scope.row.icon"></i>
          </template>
        </el-table-column>

        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="菜单类型"
                         min-width="100">
          <template #default="scope">
            <el-tag :type="getMenuTypeTagType(scope.row.menuType)" size="small">
              {{ menuTypeMap[scope.row.menuType] || '未知类型' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="状态" min-width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.isActive ? 'success' : 'danger'"
              effect="dark"
              round
            >
              {{ scope.row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center" label="排序"
                         min-width="80">
          <template #default="scope">
            <el-progress
              :color="getSortColor(scope.row.sort)"
              :percentage="getSortPercentage(scope.row.sort)"
              :show-text="false"
              :stroke-width="10"
              class="sort-progress"
            />
            <span
              :style="{
                color: scope.row.sort > 50 ? '#e6a23c' : '#409eff',
                fontWeight: scope.row.sort > 50 ? 'bold' : 'normal'
              }"
              class="sort-value"
            >{{ scope.row.sort }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑菜单" placement="top">
                <el-button
                  :disabled="loading"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="handleEdit(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该菜单吗？"
                @confirm="handleDelete(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="loading"
                    :icon="Delete"
                    circle
                    class="action-button delete-button"
                    size="small"
                    type="danger"
                  ></el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <!-- 这里可以添加分页控件，如果需要的话 -->
      </div>
    </el-card>

    <!-- 新增/编辑模态框 -->
    <el-dialog
      v-model="modalVisible"
      :title="isEdit ? '编辑菜单' : '添加菜单'"
      append-to-body
      custom-class="custom-dialog"
      destroy-on-close
      width="650px"
    >
      <el-form ref="formRef" :model="currentMenu" class="menu-form" label-width="90px">
        <div class="form-header">基本信息</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :rules="[{ required: true, message: '请输入菜单名称', trigger: 'blur' }]"
              label="菜单名称"
              prop="name"
            >
              <el-input v-model="currentMenu.name" placeholder="请输入菜单名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-select v-model="currentMenu.menuType" placeholder="请选择菜单类型"
                         style="width: 100%">
                <el-option :value="0" label="目录"></el-option>
                <el-option :value="1" label="菜单"></el-option>
                <el-option :value="2" label="按钮"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父级菜单">
              <el-cascader
                v-model="selectedParent"
                :change-on-select="true"
                :options="tableData"
                :props="cascaderProps"
                clearable
                placeholder="请选择父级菜单"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <div class="icon-select">
                <el-input v-model="currentMenu.icon" placeholder="请选择图标" readonly
                          @click="showIconSelector = true">
                  <template v-if="currentMenu.icon" #prefix>
                    <el-icon>
                      <component :is="currentMenu.icon"/>
                    </el-icon>
                  </template>
                  <template #append>
                    <el-button @click.stop="showIconSelector = true">
                      <el-icon>
                        <More/>
                      </el-icon>
                    </el-button>
                  </template>
                </el-input>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :rules="[{ required: true, message: '请输入排序值', trigger: 'blur' }]"
              label="排序"
              prop="sort"
            >
              <el-input-number v-model="currentMenu.sort" :min="0" controls-position="right"
                               style="width: 100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch
                v-model="isActiveNumber"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-header">路由设置</div>

        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item
              :rules="[{ required: true, message: '请输入路径', trigger: 'blur' }]"
              label="菜单路径"
              prop="url"
            >
              <el-input v-model="currentMenu.url"
                        :placeholder="currentMenu.isExternal ? '外部链接地址' : '路由路径，如 /dashboard'"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="外部链接">
              <el-switch
                v-model="currentMenu.isExternal"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item
          v-if="currentMenu.menuType === 1 && !currentMenu.isExternal"
          :rules="[{ required: currentMenu.menuType === 1 && !currentMenu.isExternal, message: '请输入组件路径', trigger: 'blur' }]"
          label="组件路径"
          prop="component">
          <el-input v-model="currentMenu.component" placeholder="如: @/views/dashboard/index.vue"/>
        </el-form-item>

        <template v-if="currentMenu.menuType !== 0">
          <div class="form-header">权限设置</div>

          <el-form-item label="权限关联" prop="permissions">
            <el-select
              v-model="selectedPermissionIds"
              :loading="permissionLoading"
              :remote-method="searchPermissions"
              filterable
              multiple
              placeholder="请输入关键词搜索权限"
              remote
              style="width: 100%"
              @visible-change="handlePermissionSelectVisible"
            >
              <el-option
                v-for="item in permissionOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <div class="permission-option">
                  <span>{{ item.name }}</span>
                  <span class="permission-value">{{ item.identity }}</span>
                </div>
              </el-option>
              <el-option class="create-permission-option" value="create_new">
                <div @click.stop="openCreatePermission">
                  <el-icon>
                    <Plus/>
                  </el-icon>
                  创建新权限
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 快速创建权限表单 -->
    <el-dialog
      v-model="permissionDialogVisible"
      append-to-body
      custom-class="custom-dialog"
      title="创建新权限"
      width="500px"
    >
      <el-form
        ref="permFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称"></el-input>
        </el-form-item>
        <el-form-item label="权限标识" prop="identity">
          <el-input v-model="permissionForm.identity" placeholder="请输入权限标识"></el-input>
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-input v-model="permissionForm.module" placeholder="请输入模块名称"></el-input>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            :rows="3"
            placeholder="请输入权限描述"
            type="textarea"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createPermission">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图标选择器弹窗 -->
    <el-dialog
      v-model="showIconSelector"
      append-to-body
      destroy-on-close
      title="选择图标"
      width="680px"
    >
      <div class="icon-dialog-body">
        <div class="icon-search">
          <el-input v-model="iconSearch" clearable placeholder="搜索图标">
            <template #prefix>
              <el-icon>
                <Search/>
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="icon-grid">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            :class="{ 'is-active': currentMenu.icon === icon }"
            class="icon-item"
            @click="selectIcon(icon)"
          >
            <el-icon>
              <component :is="icon"/>
            </el-icon>
            <span class="icon-name">{{ icon }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showIconSelector = false">取消</el-button>
          <el-button type="primary" @click="confirmIconSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'MenuManage'
})
import {ref, reactive, onMounted, computed, watch} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  getMenusByTree,
  saveMenu,
  updateMenu,
  deleteMenu,
  bindPermissionsToMenu
} from '#/api/core/menu';
import {
  getPermissionsByMenuId,
  getPermissionByCondition,
  addPermission

} from '#/api/core/permission';
import {
  Search, Refresh, Plus, Edit, Delete, Filter, CaretRight, Link,
  More, House, Menu, Setting, User, Document, List, Grid, Location,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Check, Close, Warning,
  InfoFilled, QuestionFilled, Star, Bell, Message, Calendar, Picture, Folder,
  Lock, Key, Connection, Share, Upload, Download, CirclePlus, CircleClose
} from "@element-plus/icons-vue";
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
    localStorage.setItem('menu_filter_status', JSON.stringify(showFilter.value));
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('menu_filter_status');
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

const loading = ref(false);
const keyword = ref('');
const tableData = ref([]);
// 选中的行用于批量删除
const selectedRows = ref([]);

const multipleTableRef = ref(null);
const modalVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
// 这里使用一个变量来保存 Cascader 选中的值，设置 emitPath: false 后，它将直接返回选中的菜单 id
const selectedParent = ref(null);

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false,
};

// 菜单类型映射
const menuTypeMap = {
  0: '目录',
  1: '菜单',
  2: '按钮'
}

interface MenuForm {
  id?: string // 可选类型
  name: string
  url: string
  icon: string
  component?: string
  isExternal: boolean
  sort: number
  parentId: string | null
  menuType: number
  isActive: number
}

const currentMenu = reactive(<MenuForm>{
  id: undefined,
  name: '',
  url: '',
  icon: '',
  component: '',
  isExternal: false,
  sort: 0,
  parentId: null,
  menuType: 1,
  isActive: 1,
});

const isActiveNumber = computed({
  get: () => currentMenu.isActive === 1, // 1 → true，0 → false
  set: (val) => currentMenu.isActive = val ? 1 : 0
})

// 计算排序百分比
const getSortPercentage = (sort: number): number => {
  if (sort === undefined || sort === null) return 0;
  return Math.min(100, Math.max(0, sort));
}

// 获取排序颜色
const getSortColor = (sort: number): string => {
  if (sort <= 20) return '#909399'; // 灰色
  if (sort <= 50) return '#409EFF'; // 蓝色
  if (sort <= 80) return '#E6A23C'; // 橙色
  return '#F56C6C'; // 红色
}

// 获取菜单类型标签样式
const getMenuTypeTagType = (type: number): string => {
  const types = ['success', 'primary', 'warning'];
  return types[type] || 'info';
}

// 查询菜单数据（支持关键字过滤）
const fetchMenu = async () => {
  try {
    loading.value = true;
    // 调用接口时可以传入查询条件
    const res = await getMenusByTree({keyword: keyword.value});
    tableData.value = res;
  } catch (error) {
    console.error('获取菜单数据失败：', error);
    ElMessage.error('加载菜单数据失败');
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  keyword.value = '';
  fetchMenu();
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

const deleteSelected = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 个菜单吗？`,
    '批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      // 批量删除逻辑，遍历 selectedRows 调用删除接口
      for (const row of selectedRows.value) {
        await deleteMenu(row.id);
      }
      ElMessage.success('批量删除成功');
      selectedRows.value = [];
      await fetchMenu();
    } catch (error) {
      console.error('批量删除失败：', error);
      ElMessage.error('批量删除失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
};

const openDialog = () => {
  isEdit.value = false;
  selectedParent.value = null;
  Object.assign(currentMenu, {
    name: '',
    url: '',
    icon: '',
    sort: 0,
    parentId: null,
    menuType: 1,
    isActive: 1,
  });
  modalVisible.value = true;
};

const closeDialog = () => {
  modalVisible.value = false;
};

// 权限相关
const permissionDialogVisible = ref(false);
const permissionLoading = ref(false);
const permissionOptions = ref<PermissionApi.Permission[]>([]);
const selectedPermissionIds = ref<string[]>([]);
const permFormRef = ref(null);

const permissionForm = reactive({
  name: '',
  identity: '',
  module: '',
  type: 2, // 默认按钮权限
  description: '',
  isActive: 1
});

// 权限表单验证规则
const permissionRules = reactive({
  name: [
    {required: true, message: '请输入权限名称', trigger: 'blur'},
    {min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur'}
  ],
  identity: [
    {required: true, message: '请输入权限标识', trigger: 'blur'},
    {
      pattern: /^[a-z0-9_]+(\:[a-z0-9_]+)*$/,
      message: '格式不正确，请使用小写字母、数字、下划线，可用冒号分隔',
      trigger: 'blur'
    }
  ],
  module: [
    {required: true, message: '请选择所属模块', trigger: 'change'}
  ]
});

// 加载权限列表
const loadPermissions = async (keyword = '') => {
  try {
    permissionLoading.value = true;
    const params: PermissionApi.PermissionQueryParams = {
      currentPage: 1,
      pageSize: 20
    };

    if (keyword) {
      params.name = keyword;
    }

    const res = await getPermissionByCondition(params);
    permissionOptions.value = res.records;
  } catch (error) {
    console.error('获取权限列表失败', error);
    ElMessage.error('获取权限列表失败');
  } finally {
    permissionLoading.value = false;
  }
};

// 搜索权限
const searchPermissions = (query: string) => {
  if (query) {
    loadPermissions(query);
  }
};

// 处理权限选择框显示状态变化
const handlePermissionSelectVisible = (visible: boolean) => {
  if (visible) {
    loadPermissions();
  }
};

// 打开创建权限对话框
const openCreatePermission = () => {
  permissionDialogVisible.value = true;
  permissionForm.module = currentMenu.id;
};

// 创建新权限
const createPermission = async () => {
  if (!permFormRef.value) return;

  (permFormRef.value as any).validate(async (valid: boolean) => {
    if (valid) {
      try {
        const data = {
          name: permissionForm.name,
          identity: permissionForm.identity,
          type: permissionForm.type,
          module: currentMenu.id,
          status: permissionForm.isActive,
          description: permissionForm.description
        };

        const newPermId = await addPermission(data);

        // 添加到已选权限中
        if (newPermId) {
          selectedPermissionIds.value.push(newPermId);

          // 添加到选项中
          permissionOptions.value.push({
            id: newPermId,
            name: permissionForm.name,
            identity: permissionForm.identity,
            type: permissionForm.type,
            module: currentMenu.id,
            status: permissionForm.isActive,
            description: permissionForm.description
          });
        }

        ElMessage.success('创建权限成功');
        permissionDialogVisible.value = false;

        // 重置表单
        permissionForm.name = '';
        permissionForm.identity = '';
        permissionForm.description = '';
      } catch (error) {
        console.error('创建权限失败', error);
        ElMessage.error('创建权限失败');
      }
    }
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        // 准备菜单数据
        const menuData = {
          name: currentMenu.name,
          url: currentMenu.url,
          component: currentMenu.component || '',
          icon: currentMenu.icon,
          parentId: selectedParent.value,
          isExternal: currentMenu.isExternal ? 1 : 0,
          sort: currentMenu.sort,
          menuType: currentMenu.menuType,
          permission: selectedPermissionIds.value.join(','),
          isActive: currentMenu.isActive,
        };

        if (isEdit.value && currentMenu.id) {
          menuData.id = currentMenu.id;
          await updateMenu(menuData);
          ElMessage.success('菜单更新成功');
        } else {
          await saveMenu(menuData);
          ElMessage.success('菜单添加成功');
        }
        closeDialog();
        await fetchMenu();
      } catch (error) {
        console.error('提交失败', error);
        ElMessage.error('操作失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(currentMenu, row);
  selectedParent.value = row.parentId;

  // 处理权限数据
  if (row.permission) {
    selectedPermissionIds.value = row.permission.split(',').filter(Boolean);
  } else {
    selectedPermissionIds.value = [];
  }

  modalVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '警告', {
      type: 'warning'
    });
    loading.value = true;
    await deleteMenu(row.id);
    ElMessage.success('删除成功');
    await fetchMenu();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 监听菜单类型和外部链接变化
watch(() => [currentMenu.menuType, currentMenu.isExternal], ([newMenuType, newIsExternal]) => {
  // 如果是外部链接或类型不是菜单(1)，则清空组件路径
  if (newIsExternal || newMenuType !== 1) {
    currentMenu.component = '';
  }

  // 如果是外部链接且URL不以http开头，则添加https://前缀
  if (newIsExternal && currentMenu.url && !currentMenu.url.match(/^https?:\/\//)) {
    currentMenu.url = 'https://' + currentMenu.url;
  }
});

// 图标选择器相关
const showIconSelector = ref(false);
const iconSearch = ref('');
const selectedIcon = ref('');

// 图标列表
const iconList = [
  'House', 'Menu', 'Setting', 'User', 'Document', 'List', 'Grid', 'Location',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Check', 'Close', 'Warning',
  'InfoFilled', 'QuestionFilled', 'Star', 'Bell', 'Message', 'Calendar', 'Picture', 'Folder',
  'Lock', 'Key', 'Connection', 'Share', 'Upload', 'Download', 'CirclePlus', 'CircleClose',
  'Search', 'Refresh', 'Plus', 'Edit', 'Delete', 'Filter', 'More', 'Link'
];

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!iconSearch.value) return iconList;
  return iconList.filter(icon =>
    icon.toLowerCase().includes(iconSearch.value.toLowerCase())
  );
});

// 选择图标
const selectIcon = (icon) => {
  selectedIcon.value = icon;
};

// 确认图标选择
const confirmIconSelection = () => {
  if (selectedIcon.value) {
    currentMenu.icon = selectedIcon.value;
  }
  showIconSelector.value = false;
};

// 当打开图标选择器时，预设当前选中的图标
watch(showIconSelector, (newVal) => {
  if (newVal) {
    selectedIcon.value = currentMenu.icon;
  }
});

onMounted(() => {
  getStoredFilterStatus();
  fetchMenu();
});
</script>

<style scoped>
.menu-list {
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
  align-self: flex-end;
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

.expanded-content {
  padding: 0;
  margin: 0;
  width: 100%;
}

.inner-table {
  margin: 0;
  width: 100%;
}

:deep(.inner-table .el-table__body-wrapper) {
  background-color: transparent;
}

:deep(.el-table__expanded-cell) {
  padding: 0 !important;
}

:deep(.inner-table td) {
  background-color: transparent !important;
}

:deep(.inner-table .el-table__row) {
  background-color: transparent;
}

:deep(.inner-table .el-table__row:hover) {
  background-color: var(--el-table-row-hover-bg-color) !important;
}

:deep(.inner-table .el-table__inner-wrapper::before) {
  display: none;
}

.child-indent-marker {
  position: relative;
  height: 16px;
  width: 16px;
  margin: 0 auto;
}

.child-indent-marker::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-primary-light-5);
}

/* 确保展开单元格没有padding */
:deep(.el-table__expanded-cell[class*=cell]) {
  padding: 0 !important;
}

/* 使用同样的边框样式 */
:deep(.inner-table .el-table__inner-wrapper) {
  border: none;
}

:deep(.inner-table .el-table__row td) {
  border-bottom: 1px solid var(--el-table-border-color);
}

:deep(.inner-table .el-table__row:last-child td) {
  border-bottom: none;
}

:deep(.el-table__row.expanded .el-table__expand-icon) {
  transform: rotate(90deg);
}

:deep(.el-table__expand-icon .el-icon) {
  font-size: 12px;
  color: var(--el-color-primary);
}

.child-menu-name {
  position: relative;
  padding-left: 12px;
  color: var(--el-color-primary-dark-2) !important;
  font-weight: bold;
}

.child-menu-name:before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 12px;
  width: 3px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

:deep(.inner-table td.is-center .cell) {
  justify-content: center;
}

:deep(.inner-table .el-table__cell.is-center) {
  text-align: center !important;
}

:deep(.inner-table .el-table__body tr.hover-row td) {
  background-color: var(--el-color-primary-light-7) !important;
}

/* 为保持一致性，调整父表格的样式 */
:deep(.el-table__cell.is-center) {
  text-align: center;
}

:deep(.el-table__expand-icon) {
  font-size: 16px;
  color: var(--el-color-primary);
}

.sort-progress {
  width: 80%;
  margin: 0 auto;
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

.batch-actions {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

.sort-value {
  display: block;
  text-align: center;
  margin-top: 3px;
  font-size: 12px;
}

.menu-name {
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
}

:deep(.el-table__header th) {
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

/* 响应式布局 */
@media (max-width: 768px) {
  .menu-list {
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
}

.permission-select-wrap {
  width: 100%;
}

.permission-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.permission-value {
  color: #909399;
  font-size: 12px;
  margin-left: 10px;
}

.create-permission-option {
  border-top: 1px dashed #e0e0e0;
  padding-top: 5px;
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-permission-option:hover {
  background-color: var(--el-color-primary-light-9);
}

.external-link {
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.external-icon {
  font-size: 12px;
}

.no-data-text {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.form-item-helper-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.2;
}

/* 表单样式优化 */
.optimized-form {
  padding: 0;
  margin: 0;
}

.form-section {
  margin-bottom: 24px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.form-grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.full-span-item {
  grid-column: span 2;
}

.special-switch-item {
  display: flex;
  flex-direction: column;
}

/* 对话框样式 */
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
  padding: 24px 30px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 20px 30px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-info-light-9);
}

.custom-dialog :deep(.el-input__inner),
.custom-dialog :deep(.el-select__wrapper),
.custom-dialog :deep(.el-input-number__decrease),
.custom-dialog :deep(.el-input-number__increase) {
  height: 40px;
}

.form-item-helper-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.cancel-button,
.submit-button {
  min-width: 100px;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
}

.submit-button {
  font-weight: 500;
}

.permission-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.permission-value {
  color: #909399;
  font-size: 12px;
}

.create-permission-option {
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 8px;
  color: var(--el-color-primary);
  cursor: pointer;
}

/* 对移动端适配 */
@media (max-width: 768px) {
  .form-grid-layout {
    grid-template-columns: 1fr;
  }

  .full-span-item {
    grid-column: span 1;
  }

  .custom-dialog {
    width: 100% !important;
    margin: 0 !important;
  }
}

/* 菜单表单样式 */
.menu-form {
  width: 100%;
}

.form-header {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 12px 0 15px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.form-header:first-child {
  margin-top: 0;
}

/* 对话框样式 */
.custom-dialog :deep(.el-dialog__header) {
  padding: 15px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin: 0;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 15px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 0;
}

.custom-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

.custom-dialog :deep(.el-form-item) {
  margin-bottom: 18px;
}

.custom-dialog :deep(.el-form-item__error) {
  padding-top: 2px;
}

.permission-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.permission-value {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.create-permission-option {
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 8px;
  color: var(--el-color-primary);
  cursor: pointer;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .form-row {
    display: block;
  }

  .form-row .el-form-item {
    margin: 0 0 16px;
  }

  .custom-dialog {
    width: 95% !important;
    margin: 0 auto !important;
  }
}

/* 图标选择器样式 */
.icon-dialog-body {
  max-height: 460px;
  overflow-y: auto;
}

.icon-search {
  margin-bottom: 16px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  border-color: var(--el-color-primary-light-5);
  background-color: var(--el-color-primary-light-9);
}

.icon-item.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.icon-item .el-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

.icon-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

.icon-select .el-input__inner {
  cursor: pointer;
}

@media (max-width: 768px) {
  .icon-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
