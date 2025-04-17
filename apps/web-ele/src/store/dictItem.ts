import {defineStore} from 'pinia'
import {deleteDictItem, getDictItemList} from '#/api/core/dictItem'
import {getAllDictType} from '#/api/core/dictType'
import type {DictItem, DictType} from '#/types/dict'

export const useDictItemStore = defineStore('dictItem', () => {
  // 核心状态
  const state = reactive({
    loading: false,
    tableData: [] as DictItem[],
    currentPage: 1,
    pageSize: 10,
    total: 0,
    selectedRows: [] as DictItem[],
    filters: {
      keyword: '',
      dictTypeId: ''
    },
    dictTypeOptions: [] as DictType[],
    showFilter: true
  })

  // 核心业务方法
  const fetchData = async () => {
    try {
      state.loading = true
      const params = {
        currentPage: state.currentPage,
        pageSize: state.pageSize,
        ...state.filters
      }
      const res = await getDictItemList(params)
      state.tableData = res.records
      state.total = res.total
    } finally {
      state.loading = false
    }
  }

  const fetchDictTypes = async () => {
    if (state.dictTypeOptions.length === 0) {
      try {
        const data = await getAllDictType()
        state.dictTypeOptions = data || []
      } catch (error) {
        console.error('获取字典类型失败:', error)
        throw error
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      state.loading = true
      await deleteDictItem(id)
      await fetchData()
    } finally {
      state.loading = false
    }
  }

  const handleBatchDelete = async () => {
    try {
      state.loading = true
      await Promise.all(state.selectedRows.map(row => deleteDictItem(row.id!)))
      await fetchData()
    } finally {
      state.loading = false
    }
  }

  // 筛选状态管理
  const toggleFilter = () => {
    state.showFilter = !state.showFilter
    localStorage.setItem('dictItemFilterVisible', state.showFilter.toString())
  }

  const initFilterState = () => {
    const saved = localStorage.getItem('dictItemFilterVisible')
    state.showFilter = saved ? saved === 'true' : true
  }

  return {
    state,
    fetchData,
    fetchDictTypes,
    handleDelete,
    handleBatchDelete,
    toggleFilter,
    initFilterState
  }
})
