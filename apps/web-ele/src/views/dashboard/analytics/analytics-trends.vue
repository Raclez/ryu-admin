<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

onMounted(() => {
  renderEcharts({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2 %',
    },
    series: [
      {
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(100, 100, 100, 0.6)'
              },
              {
                offset: 1,
                color: 'rgba(100, 100, 100, 0.1)'
              }
            ]
          }
        },
        data: [
          111, 2000, 6000, 16_000, 33_333, 55_555, 64_000, 33_333, 18_000,
          36_000, 70_000, 42_444, 23_222, 13_000, 8000, 4000, 1200, 333, 222,
          111,
        ],
        itemStyle: {
          color: '#666666',
        },
        smooth: true,
        type: 'line',
      },
      {
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(180, 180, 180, 0.5)'
              },
              {
                offset: 1,
                color: 'rgba(180, 180, 180, 0.1)'
              }
            ]
          }
        },
        data: [
          33, 66, 88, 333, 3333, 6200, 20_000, 3000, 1200, 13_000, 22_000,
          11_000, 2221, 1201, 390, 198, 60, 30, 22, 11,
        ],
        itemStyle: {
          color: '#909399',
        },
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#909399',
          width: 1,
        },
      },
      trigger: 'axis',
    },
    // xAxis: {
    //   axisTick: {
    //     show: false,
    //   },
    //   boundaryGap: false,
    //   data: Array.from({ length: 18 }).map((_item, index) => `${index + 6}:00`),
    //   type: 'category',
    // },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: Array.from({ length: 18 }).map((_item, index) => `${index + 6}:00`),
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 1,
        },
        show: true,
      },
      type: 'category',
    },
    yAxis: [
      {
        axisTick: {
          show: false,
        },
        max: 80_000,
        splitArea: {
          show: true,
        },
        splitNumber: 4,
        type: 'value',
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
