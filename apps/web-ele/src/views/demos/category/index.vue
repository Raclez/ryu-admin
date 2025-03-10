<template>
  <div class="category-list">
    <el-form :inline="true"  class="filter-container">
      <el-form-item  class="form-item">
        <el-input v-model="keyword" placeholder="请输入分类名" size="large" clearable></el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="fetchCategory">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="handleAddCategory">添加博客分类</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="categoryStore.categories"
      ref="multipleTableRef"
      row-key="id"
      stripe
      border
      v-loading="categoryStore.loading"
      @selection-change="handleSelectionChange"
      style="width: 100%">
      <el-table-column type="selection"  width="55"
                       :reserve-selection="true"
      />
      <el-table-column prop="name" label="分类名" align="center"  min-width="80"></el-table-column>
      <el-table-column prop="description" label="分类简介" align="center"  min-width="240"></el-table-column>
      <el-table-column prop="sort" label="分类排序" align="center" width="100">
        <template #default="{ row }">
          <el-tag>{{ row.sort }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center" min-width="180"></el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="handleEdit(row)">修改</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="categoryStore.pagination.current"
        v-model:page-size="categoryStore.pagination.size"
        :page-sizes="[10 ,20, 30, 40]"
        :size="'default'"
        :disabled="disabled"
        :background="background"
        :hide-on-single-page="singlePage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="categoryStore.pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
      v-model="dialogVisible"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类简介"
          />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup  lang="ts">
import { ref, reactive,onMounted, onUpdated, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useCategoryStore } from '#/store/category'


const categoryStore = useCategoryStore()
  const keyword = ref('');
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()


const formData = reactive<Category>({
  name: '',
  description: '',
  sort: 0,
})
// 表单验证规则
const formRules = {
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
}

  function reset() {
    keyword.value = '';
    fetchCategory();
  }

// 分页处理
const handleSizeChange = (size: number) => {
  categoryStore.pagination.size = size
  categoryStore.fetchCategories()
}

const handleCurrentChange = (current: number) => {
  categoryStore.pagination.current = current
  categoryStore.fetchCategories()
}


// 新增/编辑处理
const handleAddCategory = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: undefined,
    name: '',
    description: '',
    sort: 0,
  })
  dialogVisible.value = true
}

const handleEdit = (row: Category) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}


// 提交表单
const submitForm = async () => {
  await formRef.value?.validate()
  try {

    if(dialogType.value==='add'){
      await categoryStore.addCategory(formData)
    }else {
      await categoryStore.updateCategory(formData)
    }
    ElMessage.success(`${dialogType.value === 'add' ? '新增' : '修改'}成功`)
    dialogVisible.value = false
    await fetchCategory()
  } catch (error) {
    console.error(error)
  }
}

// 删除处理
const handleDelete = async (row: Category) => {
  try {
    await ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？`, '提示', {
      type: 'warning',
    })
    await categoryStore.deleteCategory(row.id!)
    ElMessage.success('删除成功')
    await fetchCategory()
  } catch (error) {
    console.error(error)
  }
}
    onMounted(() => {
      // 在组件挂载后调用
      categoryStore.fetchCategories()
    });

</script>


<style scoped>
.category-list {
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
