<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchForm" @keyup.enter="onSearch">
        <el-form-item :label="t('plugins.uni.console.siteName')">
          <el-input v-model="searchForm.keyword" :placeholder="t('plugins.uni.console.enterSiteNameNote')" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">{{ t('plugins.uni.console.search') }}</el-button>
          <el-button @click="onReset">{{ t('plugins.uni.console.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div class="flex justify-between mb-3">
        <el-button type="primary" @click="openDialog">{{ t('plugins.uni.console.createSite') }}</el-button>
      </div>

      <el-table :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column :label="t('plugins.uni.console.siteName')" prop="name" />
        <el-table-column :label="t('plugins.uni.console.domain')" prop="domain" />
        <el-table-column :label="t('plugins.uni.console.status')" prop="status">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? t('plugins.uni.console.active') : t('plugins.uni.console.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.console.createdAt')" prop="createdAt" />
        <el-table-column :label="t('plugins.uni.console.operations')" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="managePages(row)">{{ t('plugins.uni.console.managePages') }}</el-button>
            <el-button type="primary" link @click="managePosts(row)">{{ t('plugins.uni.console.managePosts') }}</el-button>
            <el-button type="danger" link @click="onDelete(row)">{{ t('plugins.uni.console.delete') }}</el-button>
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

    <el-drawer v-model="dialogVisible" :title="dialogTitle" size="600px">
      <el-form ref="siteForm" :model="form" label-width="120px" :rules="rules">
        <el-form-item :label="t('plugins.uni.console.siteName')" prop="name">
          <el-input v-model="form.name" :placeholder="t('plugins.uni.console.enterSiteNameNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.console.domain')" prop="domain">
          <el-input v-model="form.domain" :placeholder="t('plugins.uni.console.enterDomainNote')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.console.description')" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">{{ t('plugins.uni.console.submit') }}</el-button>
          <el-button @click="closeDialog">{{ t('plugins.uni.console.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getUserSites, createSite, deleteSite } from '@/plugin/uni/console/api/console.js'

const { t } = useI18n()
const router = useRouter()

const searchForm = reactive({
  keyword: ''
})

const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const multipleSelection = ref([])

const form = reactive({
  name: '',
  domain: '',
  description: ''
})

const rules = reactive({
  name: [{ required: true, message: t('plugins.uni.console.enterSiteNameNote'), trigger: 'blur' }],
  domain: [{ required: true, message: t('plugins.uni.console.enterDomainNote'), trigger: 'blur' }]
})

const siteForm = ref(null)

onMounted(() => {
  fetchTableData()
})

const fetchTableData = async () => {
  const res = await getUserSites({
    page: page.value,
    pageSize: pageSize.value,
    keyword: searchForm.keyword
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  }
}

const onSearch = () => {
  page.value = 1
  fetchTableData()
}

const onReset = () => {
  searchForm.keyword = ''
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

const openDialog = () => {
  dialogTitle.value = t('plugins.uni.console.createSite')
  dialogVisible.value = true
  Object.assign(form, { name: '', domain: '', description: '' })
}

const closeDialog = () => {
  dialogVisible.value = false
}

const onSubmit = async () => {
  if (!siteForm.value) return
  await siteForm.value.validate(async (valid) => {
    if (valid) {
      const res = await createSite(form)
      if (res.code === 0) {
        ElMessage.success(t('plugins.uni.console.createSuccess'))
        closeDialog()
        fetchTableData()
      }
    }
  })
}

const onDelete = async (row) => {
  ElMessageBox.confirm(t('plugins.uni.console.deleteConfirm'), t('plugins.uni.console.warning'))
    .then(async () => {
      const res = await deleteSite({ id: row.id })
      if (res.code === 0) {
        ElMessage.success(t('plugins.uni.console.deleteSuccess'))
        fetchTableData()
      }
    })
    .catch(() => {})
}

const managePages = (row) => {
  router.push({ path: '/layout/uni/cms/page', query: { siteId: row.id } })
}

const managePosts = (row) => {
  router.push({ path: '/layout/uni/cms/post', query: { siteId: row.id } })
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
