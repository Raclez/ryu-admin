// stores/category.ts
import { defineStore } from 'pinia'
import { getCategoryPage, addCategory, updateCategory, deleteCategory } from '#/api/core/category'

interface Category {
  id?: string
  name: string
  description: string
  sort: number
}

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as Category[],
    loading: false,
    pagination: {
      current: 1,
      size: 10,
      total: 0,
      keyword: ''
    }
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        const res = await getCategoryPage({
          currentPage: this.pagination.current,
          pageSize: this.pagination.size,
          keyword: this.pagination.keyword
        })
        this.categories = res.records
        this.pagination.total = res.total
      } finally {
        this.loading = false
      }
    },
    async addCategory(data: Category) {
      await addCategory(data)
      await this.fetchCategories()
    },
    async updateCategory(data: Category) {
      await updateCategory(data)
      await this.fetchCategories()
    },
    async deleteCategory(id: string) {
      await deleteCategory(id)
      await this.fetchCategories()
    }
  }
})
