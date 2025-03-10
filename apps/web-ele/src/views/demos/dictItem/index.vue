<template>
  <div class="dictItem-list">
    <el-form :inline="true" class="filter-container">
      <el-form-item >
        <el-input v-model="filters.keyword" placeholder="请输入字典项名称" size="large" clearable></el-input>
      </el-form-item>

      <el-form-item >
        <el-select v-model="filters.dictTypeId" placeholder="请选择字典类型" size="large" clearable @click="fetchDictType"  >
          <el-option v-for="item in dictTypeOptions" :key="item.id" :label="item.typeName" :value="item.id"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="success" @click="handleAdd">新增字典项</el-button>
      </el-form-item>
    </el-form>


    <el-table
      :data="tableData"
      border
      row-key="id"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      v-loading="loading"
    >
      <el-table-column type="selection"  width="55"
                       :reserve-selection="true"/>
      <el-table-column prop="dictItemKey" label="字典项键" align="center"></el-table-column>
      <el-table-column prop="dictItemValue" label="字典项值" align="center"></el-table-column>
      <el-table-column prop="dictTypeId" label="字典项类型" align="center"></el-table-column>
      <el-table-column prop="sort" label="排序" align="center" width="60"></el-table-column>
      <el-table-column prop="status" label="状态" align="center" >
        <template #default="{row}">
          <el-tag :type="row.status ===1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
          </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" align="center" ></el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
      <el-table-column prop="updateTime" label="更新时间" align="center" ></el-table-column>
      <el-table-column label="操作" align="center" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :title="dialogType === 'add' ? '新增字典项' : '编辑字典项'"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="显示名称" prop="label">
          <el-input v-model="formData.label" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="字典值" prop="value">
          <el-input v-model="formData.value" placeholder="请输入字典值" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
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
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 30, 50]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import type {FormInstance} from 'element-plus'
import {ElMessage, ElMessageBox} from 'element-plus'
import {addDictItem, deleteDictItem, getDictItemList, updateDictItem} from '#/api/core/dictItem'
import {getAllDictType} from "#/api/core/dictType";

interface DictItem {
  id?: string
  label: string
  value: string
  sort: number
  status: number
  remark?: string
}

// 响应式数据
const loading = ref(false)
const tableData = ref<DictItem[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const dictTypeOptions= ref([])

const filters = reactive({
  keyword: '',
  dictTypeId: ''
})



// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const formData = reactive<DictItem>({
  label: '',
  value: '',
  sort: 0,
  status: 1,
  remark: ''
})

// 验证规则
const rules = {
  label: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
}

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value
    }
    const res = await getDictItemList(params)
    tableData.value = res.records
    total.value = res.total
    currentPage.value=res.current
    pageSize.value=res.size
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  keyword.value = ''
  currentPage.value = 1
  fetchData()
}

// 新增/编辑处理
const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: undefined,
    label: '',
    value: '',
    sort: 0,
    status: 1,
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: DictItem) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  await formRef.value?.validate()
  try {
    const api = dialogType.value === 'add' ? addDictItem : updateDictItem
    await api(formData)
    ElMessage.success(`${dialogType.value === 'add' ? '新增' : '修改'}成功`)
    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
  }
}

// 删除处理
const handleDelete = async (row: DictItem) => {
  try {
    await ElMessageBox.confirm(`确认删除 ${row.label} 吗？`, '提示', {
      type: 'warning'
    })
    await deleteDictItem(row.id!)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    console.error(error)
  }
}

const fetchDictType=async () => {
  dictTypeOptions.value = await getAllDictType()
}


onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dictItem-list {
  padding: 20px;

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
.el-input,
.el-select,
.el-date-editor {
  width: 200px;
}
</style>
