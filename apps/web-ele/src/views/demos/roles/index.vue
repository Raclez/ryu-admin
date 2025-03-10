<!-- src/views/system/role/index.vue -->
<template>
  <div class="role-container">
    <!-- 搜索栏 -->
    <el-form inline>
      <el-form-item>
        <el-input v-model="keyword" placeholder="角色名称" clearable />
      </el-form-item>
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="reset">重置</el-button>
      <el-button type="success" @click="openDialog">新增角色</el-button>
    </el-form>

    <!-- 角色表格 -->
    <el-table :data="roleList" border>
      <el-table-column label="角色名称" prop="name" />
      <el-table-column label="角色编码" prop="code">
        <template #default="{row}">
          <el-tag>{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限列表">
        <template #default="{row}">
          <el-tag
            v-for="perm in row.permissions"
            :key="perm.id"
            class="m-1"
          >
            {{ perm.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{row}">
          <el-button type="text" @click="edit(row)">编辑</el-button>
          <el-button type="text" @click="assignPerm(row)">分配权限</el-button>
          <el-button type="text" danger @click="del(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 权限分配弹窗 -->
    <el-dialog title="分配权限" v-model="showPermDialog">
      <el-tree
        ref="permTree"
        :data="permTree"
        node-key="id"
        show-checkbox
        :props="treeProps"
      />
      <template #footer>
        <el-button @click="showPermDialog = false">取消</el-button>
        <el-button type="primary" @click="savePerm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 树形结构配置
const treeProps = {
  label: 'name',
  children: 'children'
}
</script>
