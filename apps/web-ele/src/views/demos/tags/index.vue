<template>
  <div class="tag-list">
    <el-form :inline="true"  class="filter-container">
      <el-form-item  class="form-item">
        <el-input v-model="keyword" placeholder="请输入标签名" size="large" clearable></el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="tagStore.fetchTags()">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="addTags">添加博客标签</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="tagStore.tags"
      ref="multipleTableRef"
      row-key="id"
      border
      @selection-change="handleSelectionChange"
      style="width: 100%">
      <el-table-column type="selection"  width="55"
                       :reserve-selection="true"
      />
      <el-table-column prop="name" label="标签名" align="center"></el-table-column>
      <el-table-column prop="slug" label="标签别名" align="center"></el-table-column>
      <el-table-column prop="description" label="标签简介" align="center"></el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button size="small" @click="editTags(scope.row)">修改</el-button>
          <el-button size="small" type="danger" @click="handlerDeleteTags(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="tagStore.pagination.current"
        v-model:page-size="tagStore.pagination.size"
        :page-sizes="[10 ,20, 30, 40]"
        :size="'default'"
        :disabled="disabled"
        :background="background"
        :hide-on-single-page="singlePage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="tagStore.pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>


    <el-dialog
      v-model="dialogFormVisible"
      title="标签管理"
      width="500px"
      :close-on-click-modal="false"
    >
    <el-form
      :model="form"
      label-width="80px"
      label-position="top"
    class="optimized-form"
    >
    <el-row :gutter="20"> <!-- 栅格布局 -->
      <!-- 标签名称 -->
      <el-col :span="12">
        <el-form-item
          label="名称"
          class="form-item-compact"
        >
          <el-input
            v-model="form.name"
            placeholder="2-10个字符"
            clearable
            size="large"
            :maxlength="10"
            show-word-limit
          />
        </el-form-item>
      </el-col>

      <!-- 标签别名 -->
      <el-col :span="12">
        <el-form-item
          label="唯一标识"
          class="form-item-compact"
        >
          <el-input
            v-model="form.slug"
            placeholder="英文/数字组合"
            clearable
            size="large"
          />
        </el-form-item>
      </el-col>

      <!-- 标签描述 -->
      <el-col :span="24">
        <el-form-item
          label="详细描述"
          class="form-item-compact"
        >
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入标签的详细说明（50字以内）"
            resize="none"
            :maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer-optimized">
        <el-button
          @click="handleCancel"
          size="large"
          class="cancel-btn"
        >取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          size="large"
          class="confirm-btn"
        >确认提交</el-button>
      </div>
    </template>
    </el-dialog>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive,onMounted, onUpdated, onBeforeUnmount } from 'vue'
import {useTagStore} from  '#/store/tag'
import {ElMessage} from "element-plus";

const tagStore = useTagStore()
const dialogType = ref('')

let form = reactive({
  name: '',
  description: '',
  slug: ''
})

const handleConfirm = async () => {
  try {
    if(dialogType.value==='add'){
      await tagStore.saveTag(form)
    }else {
       tagStore.updateTag(form)
    }
    ElMessage.success(`${dialogType.value === 'add' ? '新增' : '修改'}成功`)
    dialogFormVisible.value = false
    Object.assign(form, initialFormState());
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const handleCancel = () => {
  dialogFormVisible.value = false;
  Object.assign(form, initialFormState());
};

const rules = reactive({
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请设置标签别名', trigger: 'blur' }]
})

const handleSizeChange =async (val) => {
  tagStore.pagination.size.value = val;
  await tagStore.fetchTags();
};

const handleCurrentChange = async (val) => {
  tagStore.pagination.current.value = val;
  await tagStore.fetchTags();
};



const keyword = ref('');
const dialogFormVisible = ref(false)

  function reset() {
  keyword.value = '';
  tagStore.fetchTags()
  }


const addTags = () => {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    name: '',
    description: '',
    slug: ''
  });
  dialogFormVisible.value = true;

};

const editTags = (row) => {
  dialogType.value = 'edit'
  dialogFormVisible.value = true;
  Object.assign(form,row);
};

const handlerDeleteTags = async (row) => {

  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '警告', {
      type: 'warning'
    })
    await tagStore.deleteTag(row.id);
  } catch (error) {
    console.error(error)
  }
}
    // 生命周期钩子
    onMounted(async () => {
     await tagStore.fetchTags();
    });



</script>
<style scoped>
.tag-list {
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

</style>
