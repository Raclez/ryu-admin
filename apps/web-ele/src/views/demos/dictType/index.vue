<template>
  <div class="dictType-list">
    <div class="header">
    <el-form :inline="true"  class="filter-container">
      <el-form-item  class="form-item">
        <el-input v-model="keyword" placeholder="请输入字典项类型" size="large" clearable></el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="fetchDictType">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="handleAddDictType">添加字典项类型</el-button>
      </el-form-item>
      <el-form-item>
        <el-button
          type="danger"
          v-show="selectedRows.length !== 0"
          @click="handleBatchDelete"
        >
          批量删除 {{ selectedRows.length }} 项
        </el-button>
      </el-form-item>
    </el-form>
  </div>
    <div class="content" style="flex:1; height:calc(100vh - 200px)">
    <el-table
      :data="tableData"
      ref="multipleTableRef"
      row-key="id"
      border
      @selection-change="handleSelectionChange"
      style="width: 100%">
      <el-table-column type="selection"  width="55"
                       :reserve-selection="true"
      />
      <el-table-column prop="typeName" label="字典名称"  align="center"></el-table-column>
      <el-table-column prop="dictType" label="字典标识"  align="center"></el-table-column>
      <el-table-column prop="remark" label="备注"  align="center"></el-table-column>
      <el-table-column prop="status" label="状态"  align="center" width="90">
        <template #default="{row}" >
          <el-tag :type="row.status===1 ? 'success' : 'danger'">
            {{ row.status ===1? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间"  align="center"></el-table-column>
      <el-table-column prop="updateTime" label="更新时间"  align="center"></el-table-column>
      <el-table-column label="操作"  align="center">
        <template #default="scope">
          <el-button size="small" @click="handleUpdateDictType(scope.row)">修改</el-button>
          <el-button size="small" type="danger" @click="handlerDeleteDictType(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-dialog
      :title="dialogType === 'add' ? '新增字典类型' : '编辑字典类型'"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="字典名称" prop="typeName">
          <el-input v-model="formData.typeName" />
        </el-form-item>
        <el-form-item label="字典标识" prop="dictType">
          <el-input v-model="formData.dictType" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <div class="footer">
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10 ,20, 30, 40]"
        :size="'default'"
        :disabled="disabled"
        :background="background"
        :hide-on-single-page="singlePage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref,reactive,onMounted, onUpdated, onBeforeUnmount } from 'vue';
import {
  getDictTypePage,
  addDictType,
  updateDictType,
  deleteDictType,
  batchDeleteDictType
} from "#/api/core/dictType";
  const tableData = ref([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const background = ref(false)
  const disabled = ref(false)
  const singlePage =ref(false)

  const typeName = ref('');
  const total =ref(0);
const selectedRows = ref<DictType[]>([])

interface DictType {
  id: string
  typeName: string
  dictType: string
  remark: string
  status: number
}
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()
const formData = reactive<DictType>({
  id: '',
  typeName: '',
  dictType: '',
  remark: '',
  status: 1
})
// 表单验证规则
const rules = {
  typeName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典标识', trigger: 'blur' }]
}

  const fetchDictType = async () => {
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      typeName: typeName.value,
    };

    const response = await getDictTypePage(params);
    tableData.value = response.records;
    total.value = response.total;
    currentPage.value = response.current;
    pageSize.value = response.size;

  };

const handleSelectionChange= (val) => {
  selectedRows.value = val
}
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的项')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除选中的${selectedRows.value.length}项吗？`, '提示', {
      type: 'warning'
    })

    const ids = selectedRows.value.map(item => (item.id))
    await batchDeleteDictType(ids)
    ElMessage.success('删除成功')
    await fetchDictType()
  } catch (error) {
    console.error('删除失败:', error)
  }
}
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchDictType();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchDictType();
};

// 重置功能
const reset = () => {
  typeName.value = ''
  currentPage.value = 1
  pageSize.value = 10
  fetchDictType()
}

// 添加字典类型
const handleAddDictType = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: '',
    typeName: '',
    dictType: '',
    remark: '',
    status: 1
  })
  dialogVisible.value = true
}

// 修改字典类型
const handleUpdateDictType = (row: DictType) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  await formRef.value.validate()
  try {
    // 创建新对象排除id字段
    const submitData = dialogType.value === 'add'
      ? { ...formData, id: undefined }
      : formData

    const api = dialogType.value === 'add' ? addDictType : updateDictType
    await api(submitData)
    ElMessage.success(`${dialogType.value === 'add' ? '添加' : '修改'}成功`)
    dialogVisible.value = false
    await fetchDictType()
  } catch (error) {
    console.error(error)
  }
}

// 删除字典类型
const handlerDeleteDictType = async (row: DictType) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.typeName} 吗？`, '警告', {
      type: 'warning'
    })
    await deleteDictType(row.id)
    ElMessage.success('删除成功')
    await fetchDictType()
  } catch (error) {
    console.error(error)
  }
}
// 生命周期钩子
    onMounted(() => {
      fetchDictType();
    });

    onUpdated(() => {

    });

    onBeforeUnmount(() => {

    });


</script>
<style scoped>
.dictType-list{
  padding: 10px;

}

.filter-container {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
  position: fixed;
  bottom: 0;
  //left: 0;
  width: 100%;
  padding: 10px 20px;
}


</style>
