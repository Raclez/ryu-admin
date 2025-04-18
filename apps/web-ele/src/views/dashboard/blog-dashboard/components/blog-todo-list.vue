<script lang="ts" setup>
import {ref, defineEmits, defineProps} from 'vue';
import {Delete, Plus, Calendar} from '@element-plus/icons-vue';
import dayjs from 'dayjs';

// 定义待办事项类型
export interface TodoItem {
  id: number;
  title: string;
  description?: string;
  deadline: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

// 定义属性
const props = defineProps({
  todoItems: {
    type: Array as () => TodoItem[],
    default: () => [],
  },
});

// 定义事件
const emit = defineEmits(['add', 'toggle', 'delete']);

// 新增任务
const newTodoTitle = ref('');
const newTodoPriority = ref<'high' | 'medium' | 'low'>('medium');
const priorityOptions = [
  {value: 'high', label: '高'},
  {value: 'medium', label: '中'},
  {value: 'low', label: '低'}
];

// 添加新待办事项
const addTodo = () => {
  if (!newTodoTitle.value.trim()) return;

  emit('add', {
    title: newTodoTitle.value,
    priority: newTodoPriority.value
  });

  newTodoTitle.value = '';
  newTodoPriority.value = 'medium';
};

// 切换任务完成状态
const toggleTodoComplete = (id: number) => {
  emit('toggle', id);
};

// 删除待办事项
const deleteTodo = (id: number) => {
  emit('delete', id);
};

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#F56C6C';
    case 'medium':
      return '#E6A23C';
    case 'low':
      return '#67C23A';
    default:
      return '#909399';
  }
};

// 获取优先级标签
const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '默认';
  }
};

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = dayjs(timestamp);
  const now = dayjs();

  if (date.isSame(now, 'day')) {
    return '今天';
  } else if (date.isSame(now.add(1, 'day'), 'day')) {
    return '明天';
  } else if (date.isSame(now.add(2, 'day'), 'day')) {
    return '后天';
  } else {
    return date.format('MM月DD日');
  }
};

// 获取距离截止日期的文本
const getDeadlineText = (timestamp: number) => {
  const date = dayjs(timestamp);
  const now = dayjs();
  const diff = date.diff(now, 'day');

  if (diff < 0) {
    return '已逾期';
  } else if (diff === 0) {
    return '今天截止';
  } else if (diff === 1) {
    return '明天截止';
  } else if (diff <= 3) {
    return `${diff}天后截止`;
  } else {
    return date.format('MM月DD日截止');
  }
};
</script>

<template>
  <div class="todo-list-component">
    <!-- 添加新任务 -->
    <div class="add-todo mb-3 flex items-center">
      <el-input
        v-model="newTodoTitle"
        class="mr-2"
        placeholder="添加新任务..."
        @keyup.enter="addTodo"
      >
        <template #prefix>
          <el-icon>
            <Plus/>
          </el-icon>
        </template>
      </el-input>
      <el-select v-model="newTodoPriority" class="w-20 mr-2" size="default">
        <el-option
          v-for="option in priorityOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-button :icon="Plus" type="primary" @click="addTodo"/>
    </div>

    <!-- 任务列表 -->
    <div class="todo-list space-y-3">
      <div
        v-for="todo in props.todoItems"
        :key="todo.id"
        :class="[
          todo.completed ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700',
          {'border-l-4': !todo.completed}
        ]"
        :style="!todo.completed ? { borderLeftColor: getPriorityColor(todo.priority) } : {}"
        class="todo-item rounded-md border p-3 transition-all"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start">
            <el-checkbox
              v-model="todo.completed"
              class="mr-2 mt-1"
              @change="() => toggleTodoComplete(todo.id)"
            />
            <div>
              <div
                :class="{'line-through text-gray-400': todo.completed}"
                class="todo-title font-medium"
              >
                {{ todo.title }}
              </div>
              <div class="todo-meta mt-1 flex items-center text-xs text-gray-500">
                <el-tag
                  :type="todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warning' : 'success'"
                  class="mr-2"
                  size="small"
                >
                  {{ getPriorityLabel(todo.priority) }}
                </el-tag>
                <span class="flex items-center">
                  <el-icon class="mr-1"><Calendar/></el-icon>
                  {{ getDeadlineText(todo.deadline) }}
                </span>
              </div>
              <div v-if="todo.description" class="mt-1 text-xs text-gray-500">
                {{ todo.description }}
              </div>
            </div>
          </div>
          <el-button
            :icon="Delete"
            circle
            class="ml-2"
            size="small"
            type="danger"
            @click="deleteTodo(todo.id)"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="props.todoItems.length === 0" class="empty-state py-4 text-center text-gray-500">
        暂无待办事项，添加一项开始吧！
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  transition: all 0.3s ease;
}

.todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
</style>
