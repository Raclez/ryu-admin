<script lang="ts" setup>
import {ref, onMounted, watch} from 'vue';
import {useElementSize} from '@vueuse/core';

// 模拟数据
const chartRef = ref<HTMLElement | null>(null);
const {width, height} = useElementSize(chartRef);
let chart: any = null;

// 生成过去12个月的月份标签
const getMonthLabels = () => {
  const months = [];
  const date = new Date();
  for (let i = 11; i >= 0; i--) {
    const month = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push(`${month.getFullYear()}/${month.getMonth() + 1}`);
  }
  return months;
};

// 模拟数据
const months = getMonthLabels();
const postCounts = [8, 10, 15, 18, 12, 9, 14, 16, 20, 22, 28, 24];
const draftCounts = [6, 8, 10, 12, 8, 6, 8, 10, 12, 14, 16, 18];

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return;

  try {
    // 动态导入echarts
    const {init} = await import('echarts/core');

    // 创建echarts实例
    chart = init(chartRef.value);

    // 设置图表配置项
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['已发布文章', '草稿箱', '发布趋势'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '文章数量',
      },
      series: [
        {
          name: '已发布文章',
          type: 'bar',
          data: postCounts,
          itemStyle: {
            color: '#409EFF',
          },
        },
        {
          name: '草稿箱',
          type: 'bar',
          data: draftCounts,
          itemStyle: {
            color: '#E6A23C',
          },
        },
        {
          name: '发布趋势',
          type: 'line',
          smooth: true,
          data: postCounts,
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#67C23A',
          },
          itemStyle: {
            color: '#67C23A',
          },
        },
      ],
    };

    // 使用配置项设置图表
    chart.setOption(option);
  } catch (error) {
    console.error('加载图表失败:', error);
  }
};

// 监听容器尺寸变化，重新调整图表大小
watch([width, height], () => {
  if (chart) {
    chart.resize();
  }
});

// 生命周期钩子
onMounted(() => {
  initChart();

  // 监听窗口大小变化，重新调整图表大小
  window.addEventListener('resize', () => {
    if (chart) {
      chart.resize();
    }
  });
});
</script>

<template>
  <div ref="chartRef" class="h-96 w-full"></div>
</template>
