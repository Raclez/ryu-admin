import {defineStore} from 'pinia'
import type {DictType} from '#/types/dict'
import {reactive} from 'vue';
import {batchDeleteDictType, getDictTypePage} from '#/api/core/dictType'

export const useDictTypeStore = defineStore('dictType', () => {
  // 共享状态
  const state = reactive({
    loading: false,
    tableData: [] as DictType[],
    currentPage: 1,
    pageSize: 10,
    total: 0,
    selectedRows: [] as DictType[],
    filters: {
      typeName: ''
    },
    showFilter: true
  })

  // 核心业务方法
  const fetchData = async () => {
    try {
      state.loading = true
      const res = await getDictTypePage({
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        typeName: state.filters.typeName
      })
      state.tableData = res.records
      state.total = res.total
    } catch (error) {
      console.error('获取数据失败:', error)
      throw error // 抛出错误由组件处理
    } finally {
      state.loading = false
    }
  }

  const handleBatchDelete = async () => {
    if (state.selectedRows.length === 0) return

    try {
      state.loading = true
      const ids = state.selectedRows.map(item => item.id)
      await batchDeleteDictType(ids)
      await fetchData()
      return true // 返回结果由组件处理消息提示
    } catch (error) {
      console.error('删除失败:', error)
      throw error
    } finally {
      state.loading = false
    }
  }

  // 持久化相关
  const toggleFilter = () => {
    state.showFilter = !state.showFilter
    localStorage.setItem('dictTypeFilterVisible', state.showFilter.toString())
  }

  const initFilterState = () => {
    const saved = localStorage.getItem('dictTypeFilterVisible')
    state.showFilter = saved ? saved === 'true' : true
  }

  return {
    state,
    fetchData,
    handleBatchDelete,
    toggleFilter,
    initFilterState
  }
})
