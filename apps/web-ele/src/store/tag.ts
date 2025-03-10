// stores/tag.ts
import { defineStore } from 'pinia'
import { getTagsPage, saveTags, deleteTags,updateTags } from '#/api/core/tags'

interface Tag {
  id?: string
  name: string
  slug: string
  description: string
}

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [] as Tag[],
    loading: false,
    pagination: {
      current: 1,
      size: 10,
      total: 0,
      keyword: ''
    }
  }),
  actions: {
    async fetchTags() {
      this.loading = true
      try {
        const res = await getTagsPage({
          currentPage: this.pagination.current,
          pageSize: this.pagination.size,
          keyword: this.pagination.keyword
        })
        this.tags = res.records
        this.pagination.total = res.total
      } finally {
        this.loading = false
      }
    },
    async saveTag(data: Tag) {
      await saveTags(data)
      await this.fetchTags()
    },
    async deleteTag(id: string) {
      await deleteTags(id)
      await this.fetchTags()
    },
    async updateTag(data: Tag) {
      await updateTags(data)
      await this.fetchTags()
    }
  }
})
