<template>
  <div class="menu-table">
    <!-- 搜索与操作区域 -->
    <el-form inline class="filter-container">
      <el-form-item>
        <el-input v-model="keyword" placeholder="请输入菜单名" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchMenu">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="openDialog">添加菜单</el-button>
        <el-button type="danger" @click="deleteSelected">删除选中</el-button>
      </el-form-item>
    </el-form>

    <!-- 层级表格 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%;"
      @selection-change="handleSelectionChange"
    >
      <!-- 可展开子菜单 -->
      <el-table-column type="expand">
        <template #default="scope">
          <el-table
            border
            :data="scope.row.children"
            style="width: 100%;"
          >
            <el-table-column label="序号" min-width="60" align="center">
              <template #default="scopeChild">
                <span>{{ scopeChild.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="菜单名称" min-width="150" align="center">
              <template #default="scopeChild">
                <span>{{ scopeChild.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="菜单路径" min-width="200" align="center">
              <template #default="scopeChild">
                <span>{{ scopeChild.row.url }}</span>
              </template>
            </el-table-column>
            <el-table-column label="图标" min-width="80" align="center">
              <template #default="scopeChild">
                <span>{{ scopeChild.row.icon }}</span>
              </template>
            </el-table-column>
              <el-table-column label="菜单类型" min-width="150" align="center">
                <template #default="scopeChild">
                  <span> {{ menuTypeMap[scopeChild.row.menuType] || '未知类型' }} </span>
                </template>
              </el-table-column>

              <el-table-column label="是否启用" min-width="100" align="center">
                <template #default="scopeChild">
                  <el-tag type="warning">{{ scopeChild.row.isActive ? '启用' : '禁用' }}</el-tag>
                </template>
              </el-table-column>

            <el-table-column label="排序" min-width="100" align="center">
              <template #default="scopeChild">
                <el-tag type="warning">{{ scopeChild.row.sort }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" min-width="180" align="center">
              <template #default="scopeChild">
                <el-button @click="handleStick(scope.row)" type="warning" size="small" v-permission="'/categoryMenu/stick'">置顶</el-button>
                <el-button @click="handleEdit(scopeChild.row)" type="primary" size="small">编辑</el-button>
                <el-button @click="handleDelete(scopeChild.row)" type="danger" size="small">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>

      <!-- 主表格列 -->
      <el-table-column label="序号" min-width="60" align="center">
        <template #default="scope">
          <span>{{ scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="菜单名称" min-width="150" align="center">
        <template #default="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="菜单路径" min-width="200" align="center">
        <template #default="scope">
          <span>{{ scope.row.url }}</span>
        </template>
      </el-table-column>
      <el-table-column label="图标" min-width="80" align="center">
        <template #default="scope">
          <i :class="scope.row.icon"></i>
        </template>
      </el-table-column>

      <el-table-column label="菜单类型" min-width="150" align="center">
        <template #default="scope">
          <span>{{ menuTypeMap[scope.row.menuType] || '未知类型' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="是否启用" min-width="100" align="center">
        <template #default="scope">
          <el-tag type="warning">{{ scope.row.isActive ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="排序" min-width="100" align="center">
        <template #default="scope">
          <el-tag type="warning">{{ scope.row.sort }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" min-width="500" align="center">
        <template #default="scope">
          <el-button @click="handleStick(scope.row)" type="warning" size="small" v-permission="'/categoryMenu/stick'">置顶</el-button>
          <el-button @click="handleEdit(scope.row)" type="primary" size="small">编辑</el-button>
          <el-button @click="handleDelete(scope.row)" type="danger" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑模态框 -->
      <el-dialog
        v-model="modalVisible"
        :title="isEdit ? '编辑菜单' : '添加菜单'"
        width="600px"
        custom-class="menu-dialog"
        append-to-body
      >
        <el-form ref="formRef" :model="currentMenu" label-width="120px" label-position="right" size="medium">
          <el-form-item
            label="菜单名称"
            prop="name"
            :rules="[{ required: true, message: '请输入菜单名称', trigger: 'blur' }]"
          >
            <el-input v-model="currentMenu.name" placeholder="请输入菜单名称" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="父级菜单">
            <el-cascader
              v-model="selectedParent"
              :options="tableData"
              :props="cascaderProps"
              placeholder="请选择父级菜单（为空则为顶级菜单）"
              clearable
              style="width: 100%;"
              :change-on-select="true"
            />
          </el-form-item>

          <el-form-item
            label="菜单路径"
            prop="path"
          >
            <el-input v-model="currentMenu.url" placeholder="请输入菜单路径" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="图标" prop="icon">
            <el-input v-model="currentMenu.icon" placeholder="请输入图标类名" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="菜单类型" prop="menuType">
            <el-select v-model="currentMenu.menuType" placeholder="请选择菜单类型">
              <el-option label="目录" :value="0"></el-option>
              <el-option label="菜单" :value="1"></el-option>
              <el-option label="按钮" :value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            label="排序"
            prop="sort"
            :rules="[{ required: true, message: '请输入排序值', trigger: 'blur' }]"
          >
            <el-input-number v-model="currentMenu.sort" :min="0" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="状态">
            <el-switch
              v-model="isActiveNumber"
              active-text="启用"
              inactive-text="禁用"
              active-color="#13ce66"
              inactive-color="#ff4949"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeDialog">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确定</el-button>
          </div>
        </template>
      </el-dialog>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'MenuManage'
})
import { ref, reactive, onMounted ,computed} from 'vue';
import { ElMessage } from 'element-plus';
import { getMenusByTree, saveMenu, updateMenu, deleteMenu } from '#/api/core/menu';


const keyword = ref('');
const tableData = ref([]);
// 选中的行用于批量删除
const selectedRows = ref([]);

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

interface MenuForm {
  id?: number // 可选类型
  name: string
  url: string
  icon: string
  sort: number
  parentId: number | null
  menuType: number
  isActive: number
}

const currentMenu = reactive(<MenuForm>{
  id: undefined,
  name: '',
  url: '',
  icon: '',
  sort: 0,
  parentId: null,
  menuType: 1,
  isActive: 1,
});

const menuTypeMap: Record<number, string> = {
  0: '目录',
  1: '菜单',
  2: '按钮'
}

const isActiveNumber = computed({
  get: () => currentMenu.isActive === 1, // 1 → true，0 → false
  set: (val) => currentMenu.isActive = val ? 1 : 0
})

// 查询菜单数据（支持关键字过滤）
const fetchMenu = async () => {
  try {
    // 调用接口时可以传入查询条件
    const res = await getMenusByTree({ keyword: keyword.value });
    tableData.value = res;
  } catch (error) {
    console.error('获取菜单数据失败：', error);
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
  // 批量删除逻辑，可遍历 selectedRows 调用删除接口
  console.log('待删除的选中项：', selectedRows.value);
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

const handleSubmit = async () => {
  // 将 Cascader 选中的值赋给 currentMenu.parentId
  // currentMenu.parentId = selectedParent.value;
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateMenu(currentMenu);
          ElMessage.success('菜单更新成功');
        } else {
          await saveMenu(currentMenu);
          ElMessage.success('菜单添加成功');
        }
        closeDialog();
        // 此处可调用刷新列表的方法
        await fetchMenu();
      } catch (error) {
        console.error('提交失败', error);
      }
    }
  });
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(currentMenu, row);
  selectedParent.value = row.parentId;
  modalVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '警告', {
      type: 'warning'
    })
    await deleteMenu(row.id);
    ElMessage.success('删除成功');
    await fetchMenu();
  } catch (error) {
    console.error('删除失败：', error);
  }
};



onMounted(() => {
  fetchMenu();
});
</script>

<style scoped>
.menu-table {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .el-table {
    font-size: 12px;
  }

  .el-table .el-button {
    padding: 5px 8px;
    font-size: 12px;
  }

  .el-dialog {
    max-width: 90%;
  }
}

/* 表格宽度和溢出处理 */
.el-table {
  width: 100%;
  overflow-x: auto;
}

.el-table .cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.menu-dialog .el-dialog__header {
  background-color: #409EFF;
  color: #fff;
  text-align: center;
  padding: 15px 20px;
}

.menu-dialog .el-dialog__body {
  padding: 20px;
}

.menu-dialog .el-form-item {
  margin-bottom: 24px;
}

.menu-dialog .el-input,
.menu-dialog .el-select,
.menu-dialog .el-cascader {
  width: 100%;
}

.dialog-footer {
  text-align: right;
  padding: 10px 20px;
}
</style>
