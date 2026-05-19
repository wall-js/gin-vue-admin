<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchForm" @keyup.enter="onSearch">
        <el-form-item :label="t('plugins.uni.cms.post.title')">
          <el-input v-model="searchForm.title" :placeholder="t('plugins.uni.cms.post.enterTitleNote')" clearable />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.post.category')">
          <el-select v-model="searchForm.categoryId" :placeholder="t('plugins.uni.cms.post.selectCategoryNote')" clearable>
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.post.status')">
          <el-select v-model="searchForm.status" :placeholder="t('plugins.uni.cms.post.selectStatusNote')" clearable>
            <el-option :label="t('plugins.uni.cms.post.published')" :value="1" />
            <el-option :label="t('plugins.uni.cms.post.draft')" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">{{ t('plugins.uni.cms.search') }}</el-button>
          <el-button @click="onReset">{{ t('plugins.uni.cms.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div class="flex justify-between mb-3">
        <el-button type="primary" @click="openDialog('create')">{{ t('plugins.uni.cms.post.create') }}</el-button>
      </div>

      <el-table :data="tableData">
        <el-table-column :label="t('plugins.uni.cms.post.title')" prop="title" />
        <el-table-column :label="t('plugins.uni.cms.post.category')" prop="categoryName" width="150" />
        <el-table-column :label="t('plugins.uni.cms.post.author')" prop="authorName" width="120" />
        <el-table-column :label="t('plugins.uni.cms.post.viewCount')" prop="viewCount" width="100" />
        <el-table-column :label="t('plugins.uni.cms.post.status')" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? t('plugins.uni.cms.post.published') : t('plugins.uni.cms.post.draft') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.cms.post.createdAt')" prop="createdAt" width="180" />
        <el-table-column :label="t('plugins.uni.cms.operations')" width="300">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog('edit', row)">{{ t('plugins.uni.cms.edit') }}</el-button>
            <el-button type="success" link @click="onPublish(row)" v-if="row.status === 0">
              {{ t('plugins.uni.cms.post.publish') }}
            </el-button>
            <el-button type="warning" link @click="onUnpublish(row)" v-if="row.status === 1">
              {{ t('plugins.uni.cms.post.unpublish') }}
            </el-button>
            <el-button type="danger" link @click="onDelete(row)">{{ t('plugins.uni.cms.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="gva-pagination">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-drawer v-model="dialogVisible" :title="dialogTitle" size="900px">
      <el-form ref="postForm" :model="form" label-width="120px" :rules="rules">
        <el-form-item :label="t('plugins.uni.cms.post.title')" prop="title">
          <el-input v-model="form.title" :placeholder="t('plugins.uni.cms.post.enterTitleNote')" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('plugins.uni.cms.post.category')" prop="categoryId">
              <el-select v-model="form.categoryId" :placeholder="t('plugins.uni.cms.post.selectCategoryNote')" style="width: 100%">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('plugins.uni.cms.post.tags')">
              <el-select
                v-model="form.tagIds"
                multiple
                :placeholder="t('plugins.uni.cms.post.selectTagsNote')"
                style="width: 100%"
              >
                <el-option
                  v-for="item in tagOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="t('plugins.uni.cms.post.cover')">
          <el-input v-model="form.coverImage" :placeholder="t('plugins.uni.cms.post.enterCoverUrlNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.post.seoTitle')">
          <el-input v-model="form.seoTitle" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.post.seoDescription')">
          <el-input v-model="form.seoDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.post.content')" prop="content">
          <rich-edit v-model="form.content" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">{{ t('plugins.uni.cms.submit') }}</el-button>
          <el-button @click="closeDialog">{{ t('plugins.uni.cms.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import RichEdit from '@/components/richtext/rich-edit.vue'
import {
  getPostList,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  getCategoryList,
  getTagList
} from '@/plugin/uni/cms/api/cms.js'

const { t } = useI18n()
const route = useRoute()

const searchForm = reactive({
  title: '',
  categoryId: null,
  status: null
})

const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref('')
const categoryOptions = ref([])
const tagOptions = ref([])

const form = reactive({
  id: null,
  title: '',
  categoryId: null,
  tagIds: [],
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  content: '',
  siteId: null
})

const rules = reactive({
  title: [{ required: true, message: t('plugins.uni.cms.post.enterTitleNote'), trigger: 'blur' }],
  content: [{ required: true, message: t('plugins.uni.cms.post.enterContentNote'), trigger: 'blur' }]
})

const postForm = ref(null)

onMounted(() => {
  form.siteId = route.query.siteId
  fetchTableData()
  fetchCategories()
  fetchTags()
})

const fetchTableData = async () => {
  const res = await getPostList({
    page: page.value,
    pageSize: pageSize.value,
    siteId: form.siteId,
    title: searchForm.title,
    categoryId: searchForm.categoryId,
    status: searchForm.status
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const fetchCategories = async () => {
  const res = await getCategoryList({ siteId: form.siteId })
  if (res.code === 0) {
    categoryOptions.value = res.data.list || []
  }
}

const fetchTags = async () => {
  const res = await getTagList({ siteId: form.siteId })
  if (res.code === 0) {
    tagOptions.value = res.data.list || []
  }
}

const onSearch = () => {
  page.value = 1
  fetchTableData()
}

const onReset = () => {
  searchForm.title = ''
  searchForm.categoryId = null
  searchForm.status = null
  onSearch()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchTableData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchTableData()
}

const openDialog = (type, row) => {
  dialogType.value = type
  dialogTitle.value = type === 'create' ? t('plugins.uni.cms.post.create') : t('plugins.uni.cms.post.edit')
  dialogVisible.value = true

  if (type === 'edit' && row) {
    Object.assign(form, {
      id: row.id,
      title: row.title,
      categoryId: row.categoryId,
      tagIds: row.tagIds || [],
      coverImage: row.coverImage || '',
      seoTitle: row.seoTitle || '',
      seoDescription: row.seoDescription || '',
      content: row.content || '',
      siteId: row.siteId
    })
  } else {
    Object.assign(form, {
      id: null,
      title: '',
      categoryId: null,
      tagIds: [],
      coverImage: '',
      seoTitle: '',
      seoDescription: '',
      content: '',
      siteId: route.query.siteId
    })
  }
}

const closeDialog = () => {
  dialogVisible.value = false
}

const onSubmit = async () => {
  if (!postForm.value) return
  await postForm.value.validate(async (valid) => {
    if (valid) {
      const res = dialogType.value === 'create' ? await createPost(form) : await updatePost(form)
      if (res.code === 0) {
        ElMessage.success(dialogType.value === 'create' ? t('plugins.uni.cms.createSuccess') : t('plugins.uni.cms.updateSuccess'))
        closeDialog()
        fetchTableData()
      }
    }
  })
}

const onPublish = async (row) => {
  const res = await publishPost({ id: row.id })
  if (res.code === 0) {
    ElMessage.success(t('plugins.uni.cms.post.publishSuccess'))
    fetchTableData()
  }
}

const onUnpublish = async (row) => {
  const res = await unpublishPost({ id: row.id })
  if (res.code === 0) {
    ElMessage.success(t('plugins.uni.cms.post.unpublishSuccess'))
    fetchTableData()
  }
}

const onDelete = async (row) => {
  ElMessageBox.confirm(t('plugins.uni.cms.deleteConfirm'), t('plugins.uni.cms.warning'))
    .then(async () => {
      const res = await deletePost({ id: row.id })
      if (res.code === 0) {
        ElMessage.success(t('plugins.uni.cms.deleteSuccess'))
        fetchTableData()
      }
    })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.gva-search-box {
  @apply p-4 mb-4 bg-white rounded;
}

.gva-table-box {
  @apply p-4 bg-white rounded;
}

.gva-pagination {
  @apply flex justify-end mt-4;
}
</style>
