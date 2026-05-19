<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchForm" @keyup.enter="onSearch">
        <el-form-item :label="t('plugins.uni.cms.page.title')">
          <el-input v-model="searchForm.title" :placeholder="t('plugins.uni.cms.page.enterTitleNote')" clearable />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.status')">
          <el-select v-model="searchForm.status" :placeholder="t('plugins.uni.cms.page.selectStatusNote')" clearable>
            <el-option :label="t('plugins.uni.cms.page.published')" :value="1" />
            <el-option :label="t('plugins.uni.cms.page.draft')" :value="0" />
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
        <el-button type="primary" @click="openDialog('create')">{{ t('plugins.uni.cms.page.create') }}</el-button>
        <el-button type="danger" :disabled="!multipleSelection.length" @click="onDeleteBatch">
          {{ t('plugins.uni.cms.page.deleteBatch') }}
        </el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column :label="t('plugins.uni.cms.page.title')" prop="title" />
        <el-table-column :label="t('plugins.uni.cms.page.slug')" prop="slug" />
        <el-table-column :label="t('plugins.uni.cms.page.template')" prop="templateName" />
        <el-table-column :label="t('plugins.uni.cms.page.status')" prop="status">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? t('plugins.uni.cms.page.published') : t('plugins.uni.cms.page.draft') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.cms.page.createdAt')" prop="createdAt" width="180" />
        <el-table-column :label="t('plugins.uni.cms.operations')" width="300">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog('edit', row)">{{ t('plugins.uni.cms.edit') }}</el-button>
            <el-button type="success" link @click="onPublish(row)" v-if="row.status === 0">
              {{ t('plugins.uni.cms.page.publish') }}
            </el-button>
            <el-button type="warning" link @click="onUnpublish(row)" v-if="row.status === 1">
              {{ t('plugins.uni.cms.page.unpublish') }}
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

    <el-drawer v-model="dialogVisible" :title="dialogTitle" size="800px">
      <el-form ref="pageForm" :model="form" label-width="120px" :rules="rules">
        <el-form-item :label="t('plugins.uni.cms.page.title')" prop="title">
          <el-input v-model="form.title" :placeholder="t('plugins.uni.cms.page.enterTitleNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.slug')" prop="slug">
          <el-input v-model="form.slug" :placeholder="t('plugins.uni.cms.page.enterSlugNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.template')" prop="templateId">
          <el-select v-model="form.templateId" :placeholder="t('plugins.uni.cms.page.selectTemplateNote')" style="width: 100%">
            <el-option
              v-for="item in templateOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.seoTitle')">
          <el-input v-model="form.seoTitle" :placeholder="t('plugins.uni.cms.page.enterSeoTitleNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.seoDescription')">
          <el-input v-model="form.seoDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.cms.page.content')">
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
  getPageList,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  unpublishPage,
  getTemplateList
} from '@/plugin/uni/cms/api/cms.js'

const { t } = useI18n()
const route = useRoute()

const searchForm = reactive({
  title: '',
  status: null
})

const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref('')
const multipleSelection = ref([])
const templateOptions = ref([])

const form = reactive({
  id: null,
  title: '',
  slug: '',
  templateId: null,
  seoTitle: '',
  seoDescription: '',
  content: '',
  siteId: null
})

const rules = reactive({
  title: [{ required: true, message: t('plugins.uni.cms.page.enterTitleNote'), trigger: 'blur' }],
  slug: [{ required: true, message: t('plugins.uni.cms.page.enterSlugNote'), trigger: 'blur' }],
  templateId: [{ required: true, message: t('plugins.uni.cms.page.selectTemplateNote'), trigger: 'change' }]
})

const pageForm = ref(null)

onMounted(() => {
  form.siteId = route.query.siteId
  fetchTableData()
  fetchTemplates()
})

const fetchTableData = async () => {
  const res = await getPageList({
    page: page.value,
    pageSize: pageSize.value,
    siteId: form.siteId,
    title: searchForm.title,
    status: searchForm.status
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const fetchTemplates = async () => {
  const res = await getTemplateList({ siteId: form.siteId })
  if (res.code === 0) {
    templateOptions.value = res.data.list || []
  }
}

const onSearch = () => {
  page.value = 1
  fetchTableData()
}

const onReset = () => {
  searchForm.title = ''
  searchForm.status = null
  onSearch()
}

const handleSelectionChange = (val) => {
  multipleSelection.value = val
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
  dialogTitle.value = type === 'create' ? t('plugins.uni.cms.page.create') : t('plugins.uni.cms.page.edit')
  dialogVisible.value = true

  if (type === 'edit' && row) {
    Object.assign(form, {
      id: row.id,
      title: row.title,
      slug: row.slug,
      templateId: row.templateId,
      seoTitle: row.seoTitle || '',
      seoDescription: row.seoDescription || '',
      content: row.content || '',
      siteId: row.siteId
    })
  } else {
    Object.assign(form, {
      id: null,
      title: '',
      slug: '',
      templateId: null,
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
  if (!pageForm.value) return
  await pageForm.value.validate(async (valid) => {
    if (valid) {
      const res = dialogType.value === 'create' ? await createPage(form) : await updatePage(form)
      if (res.code === 0) {
        ElMessage.success(dialogType.value === 'create' ? t('plugins.uni.cms.createSuccess') : t('plugins.uni.cms.updateSuccess'))
        closeDialog()
        fetchTableData()
      }
    }
  })
}

const onPublish = async (row) => {
  const res = await publishPage({ id: row.id })
  if (res.code === 0) {
    ElMessage.success(t('plugins.uni.cms.page.publishSuccess'))
    fetchTableData()
  }
}

const onUnpublish = async (row) => {
  const res = await unpublishPage({ id: row.id })
  if (res.code === 0) {
    ElMessage.success(t('plugins.uni.cms.page.unpublishSuccess'))
    fetchTableData()
  }
}

const onDelete = async (row) => {
  ElMessageBox.confirm(t('plugins.uni.cms.deleteConfirm'), t('plugins.uni.cms.warning'))
    .then(async () => {
      const res = await deletePage({ id: row.id })
      if (res.code === 0) {
        ElMessage.success(t('plugins.uni.cms.deleteSuccess'))
        fetchTableData()
      }
    })
    .catch(() => {})
}

const onDeleteBatch = async () => {
  ElMessageBox.confirm(t('plugins.uni.cms.deleteBatchConfirm'), t('plugins.uni.cms.warning'))
    .then(async () => {
      for (const row of multipleSelection.value) {
        await deletePage({ id: row.id })
      }
      ElMessage.success(t('plugins.uni.cms.deleteSuccess'))
      fetchTableData()
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
