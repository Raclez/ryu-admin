<template>
  <div class="blog-list">
    <el-form :inline="true" :model="filters" class="filter-container">
      <el-form-item  class="form-item">
        <el-input v-model="filters.title" placeholder="标题" size="large" clearable></el-input>
      </el-form-item>

      <el-form-item  class="form-item">
        <el-select v-model="filters.categoryId" placeholder="选择分类" size="large" clearable @click="categoryStore.fetchCategories()">
          <el-option v-for="item in categoryStore.categories" :key="item.id" :label="item.name" :value="item.id"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item  class="form-item">
        <el-date-picker v-model="filters.publishTimeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd HH:mm:ss" size="large"></el-date-picker>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <el-button type="success" @click="addBlog">添加博客</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="tableData"
      ref="multipleTableRef"
      row-key="id"
      border
      stripe
      highlight-current-row
      @selection-change="handleSelectionChange"
      style="width: 100%">
      <el-table-column type="selection"  width="55"
                       :reserve-selection="true"
      />
      <el-table-column prop="title" label="标题" align="center"></el-table-column>
      <el-table-column prop="categoryName" label="分类名称" align="center"></el-table-column>
      <el-table-column prop="excerpt" label="摘要" align="center"></el-table-column>
<!--      <el-table-column prop="isOriginal" label="是否原创" align="center"></el-table-column>-->
<!--      <el-table-column prop="allowComment" label="允许评论" align="center"></el-table-column>-->
      <el-table-column prop="isOriginal" label="是否原创" align="center" width="120">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isOriginal"
            active-color="#13ce66"
            inactive-color="#ff4949"
            inline-prompt
            :active-icon="Check"
            :inactive-icon="Close"
          />
        </template>
      </el-table-column>
      <el-table-column prop="allowComment" label="允许评论" align="center" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.allowComment ? 'success' : 'danger'"
            effect="plain"
          >
            {{ row.allowComment ? '允许' : '禁止' }}
          </el-tag>
        </template>
      </el-table-column>
<!--      <el-table-column prop="visibility" label="博客访问权限" align="center"></el-table-column>-->
      <el-table-column prop="visibility" label="访问权限" align="center" width="130">
        <template #default="{ row }">
          <el-tooltip :content="getVisibilityLabel(row.visibility)">
            <el-icon :color="getVisibilityColor(row.visibility)">
              <component :is="getVisibilityIcon(row.visibility)" />
            </el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center">
        <template #default="row">
          <el-tag
            :type="row.status === 0 ? 'warning' : 'success'"
            effect="dark"
            round
          >
            {{ row.status === 0 ? '草稿' : '已发布' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="views" label="浏览量" align="center"></el-table-column>
      <el-table-column prop="sort" label="排序" align="center" width="90">
        <template #default="{ row }">
    <span
      :style="{
        color: row.sort > 50 ? '#e6a23c' : '#409eff',
        fontWeight: row.sort > 50 ? 'bold' : 'normal'
      }"
    >
      {{ row.sort }}
    </span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
      <el-table-column prop="updateTime" label="修改时间" align="center"></el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button size="small" @click="editBlog(scope.row)">修改</el-button>
          <el-button size="small" type="danger" @click="deleteBlog(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
</template>

<script setup lang="ts">
defineOptions({
  name: 'PostsList'
})
import { ref ,onMounted,reactive} from 'vue';
import { useRouter ,useRoute} from 'vue-router';
import {batchDeletePosts, getPostsPage } from "#/api/core/posts.js";
import { ElMessage, ElMessageBox } from 'element-plus'
import {View,Lock,Key} from "@element-plus/icons-vue";
import { useCategoryStore } from '#/store/category'

    const categoryStore = useCategoryStore()
    const background = ref(false)
    const disabled = ref(false)
    const singlePage =ref(false)

const visibilityMap = {
  public: { label: '公开访问', color: '#67c23a', icon: View },
  private: { label: '私密文章', color: '#f56c6c', icon: Lock },
  password: { label: '密码访问', color: '#e6a23c', icon: Key }
}

const getVisibilityLabel = (type) => visibilityMap[type]?.label || '未知'
const getVisibilityColor = (type) => visibilityMap[type]?.color
const getVisibilityIcon = (type) => visibilityMap[type]?.icon



const handleSelectionChange = (selectedRows) => {
      console.log('选中的行：', selectedRows);

    };

const router = useRouter(); // 初始化 useRouter
const route = useRoute()


const filters = ref({
      title: '',
      categoryId: '',
      publishTimeRange: [],
    });

    const tableData = ref([]); // 假设从后端获取数据
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);



    const fetchData = async () => {
      try {
        const params = {
          currentPage:  currentPage.value,
          pageSize:  pageSize.value,
          categoryId: filters.value.categoryId,
          title: filters.value.title
        }
        const res = await getPostsPage(params)
        tableData.value = res.records
        console.log('[调试] 接收到的数据:', tableData.value )
        total.value = res.total

        currentPage.value = res.current
        pageSize.value = res.size
      } catch (err) {
        console.error('数据加载失败:', err)
      }
    }


    const reset = () => {
      filters.value = {
        title: '',
        categoryName: '',
        publishTimeRange: [],
      };
      fetchData();
    };

    const handleSizeChange = (val) => {
      pageSize.value = val;
      fetchData();
    };

    const handleCurrentChange = (val) => {
      currentPage.value = val;
      fetchData();
    };

    const addBlog = () => {
      router.push('/posts/save')
    };

    const editBlog = (row) => {
      router.push(`/posts/save/${row.id}`);
    };

    const deleteBlog = async (row) => {
      // 发送删除请求
      console.log('删除博客', row);
      await ElMessageBox.confirm(`确定删除 ${row.title} 吗？`, '警告', {
        type: 'warning'
      })
      await batchDeletePosts([row.id])
      await fetchData()
    };

    onMounted(async () => {
      await fetchData()
    })
</script>

<style scoped>
.blog-list {
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
