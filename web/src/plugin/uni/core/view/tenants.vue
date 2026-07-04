<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline" @submit.prevent>
        <el-form-item :label="t('plugins.uni.tenants.keyword')">
          <el-input
            v-model="searchInfo.keyword"
            :placeholder="t('plugins.uni.tenants.searchPlaceholder')"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.status')">
          <el-select v-model="searchInfo.status" :placeholder="t('plugins.uni.tenants.allStatus')" clearable style="width: 120px">
            <el-option :label="t('plugins.uni.tenants.active')" :value="1" />
            <el-option :label="t('plugins.uni.tenants.inactive')" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ t('plugins.uni.search') }}</el-button>
          <el-button @click="resetSearch">{{ t('plugins.uni.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h2 style="margin: 0;">{{ t('plugins.uni.tenants.management') }}</h2>
          <el-tag type="info" size="small">{{ t('plugins.uni.total', { count: total }) }}</el-tag>
          <el-button type="primary" link @click="loadData">
            <el-icon><Refresh /></el-icon>
            {{ t('plugins.uni.refresh') }}
          </el-button>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="openDrawer('create')">
            <el-icon><Plus /></el-icon>
            {{ t('plugins.uni.tenants.newTenant') }}
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" stripe v-loading="tableLoading" style="width: 100%">
        <!-- <el-table-column type="index" label="#" width="60" /> -->
        <el-table-column prop="name" :label="t('plugins.uni.tenants.tenantName')" min-width="160">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="slug" :label="t('plugins.uni.tenants.slug')" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.slug }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ownerId" :label="t('plugins.uni.tenants.owner')" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.ownerId">{{ userMap[row.ownerId] || `UID ${row.ownerId}` }}</span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="contact" :label="t('plugins.uni.tenants.contact')" width="120">
          <template #default="{ row }">
            {{ row.contact || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" :label="t('plugins.uni.tenants.contactEmail')" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.tenants.status')" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              inline-prompt
              :active-text="t('plugins.uni.tenants.active')"
              :inactive-text="t('plugins.uni.tenants.inactive')"
              @change="(val) => handleToggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.tenants.createdAt')" width="180">
          <template #default="{ row }">
            {{ row.createdAt }}
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.operations')" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDrawer('update', row)">{{ t('plugins.uni.tenants.edit') }}</el-button>
            <el-popconfirm :title="t('plugins.uni.tenants.deleteConfirm')" @confirm="handleDelete(row)" :confirm-button-text="t('plugins.uni.delete')" :cancel-button-text="t('plugins.uni.cancel')">
              <template #reference>
                <el-button type="danger" link>{{ t('plugins.uni.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 租户编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerType === 'create' ? t('plugins.uni.tenants.newDrawerTitle') : t('plugins.uni.tenants.editDrawerTitle', { name: formData.name })"
      size="520px"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="t('plugins.uni.tenants.tenantName')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('plugins.uni.tenants.enterTenantName')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.slugLabel')" prop="slug">
          <el-input v-model="formData.slug" :placeholder="t('plugins.uni.tenants.slugPlaceholder')" :disabled="drawerType === 'update'" />
          <div v-if="drawerType === 'create'" style="color: #999; font-size: 12px; margin-top: 4px;">
            {{ t('plugins.uni.tenants.slugNote') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.ownerLabel')" prop="ownerId">
          <el-select
            v-model="formData.ownerId"
            filterable
            remote
            reserve-keyword
            clearable
            :placeholder="t('plugins.uni.tenants.searchUserPlaceholder')"
            :remote-method="handleSearchUser"
            :loading="userSearchLoading"
            style="width: 100%;"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.ID"
              :label="`${u.nickName} (${u.userName})`"
              :value="u.ID"
            />
          </el-select>
          <div style="color: #999; font-size: 12px; margin-top: 4px;">
            {{ t('plugins.uni.tenants.ownerNote') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.contact')">
          <el-input v-model="formData.contact" :placeholder="t('plugins.uni.tenants.contactNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.contactEmail')">
          <el-input v-model="formData.email" :placeholder="t('plugins.uni.tenants.contactEmailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.tenants.status')" v-if="drawerType === 'update'">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">{{ t('plugins.uni.tenants.active') }}</el-radio>
            <el-radio :value="2">{{ t('plugins.uni.tenants.inactive') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">{{ t('plugins.uni.save') }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { listTenants, getTenant, createTenant, updateTenant, deleteTenant } from '../api/tenant.js'
import { getUserList } from '@/api/user'

const { t } = useI18n()

// ---- 搜索 ----
const searchInfo = ref({ keyword: '', status: undefined })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// ---- 表格 ----
const tableData = ref([])
const tableLoading = ref(false)
const userMap = ref({}) // userId -> 显示名

// ---- 用户搜索（所有者选择） ----
const userOptions = ref([])
const userSearchLoading = ref(false)

const handleSearchUser = async (query) => {
  userSearchLoading.value = true
  try {
    const res = await getUserList({ page: 1, pageSize: 20, nickname: query, username: query })
    if (res.code === 0) {
      userOptions.value = res.data.list || []
      // 缓存到 userMap
      for (const u of userOptions.value) {
        userMap.value[u.ID] = u.nickName || u.userName
      }
    }
  } catch (e) {
    console.error('搜索用户失败:', e)
  } finally {
    userSearchLoading.value = false
  }
}

// 批量加载所有者用户名（一次性加载）
const usersLoaded = ref(false)
const loadAllUsers = async () => {
  if (usersLoaded.value) return
  try {
    const res = await getUserList({ page: 1, pageSize: 100 })
    if (res.code === 0 && res.data.list) {
      for (const u of res.data.list) {
        userMap.value[u.ID] = u.nickName || u.userName
      }
      usersLoaded.value = true
    }
  } catch (e) { /* ignore */ }
}

const loadData = async () => {
  tableLoading.value = true
  try {
    const params = {
      offset: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
    }
    if (searchInfo.value.keyword) {
      params.keyword = searchInfo.value.keyword
    }
    if (searchInfo.value.status) {
      params.status = searchInfo.value.status
    }
    const res = await listTenants(params)
    if (res.code === 0) {
      tableData.value = res.data.items || []
      total.value = res.data.total || 0
      // 加载所有者用户名
      const hasOwners = tableData.value.some(t => t.ownerId)
      if (hasOwners) loadAllUsers()
    }
  } catch (e) {
    console.error('加载租户列表失败:', e)
  } finally {
    tableLoading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const resetSearch = () => {
  searchInfo.value = { keyword: '', status: undefined }
  page.value = 1
  loadData()
}

const handlePageChange = () => {
  loadData()
}

// ---- 状态快速切换 ----
const handleToggleStatus = async (row, active) => {
  const newStatus = active ? 1 : 2
  try {
    const res = await updateTenant(row.id, { status: newStatus })
    if (res.code === 0) {
      row.status = newStatus
      ElMessage.success(active ? t('plugins.uni.tenants.activated') : t('plugins.uni.tenants.deactivated'))
    } else {
      ElMessage.error(res.msg || t('plugins.uni.tenants.operationFailed'))
    }
  } catch (e) {
    console.error('状态切换失败:', e)
  }
}

// ---- 抽屉 ----
const drawerVisible = ref(false)
const drawerType = ref('create')
const saveLoading = ref(false)
const formRef = ref(null)
const editingId = ref(0)

const formData = reactive({
  name: '',
  slug: '',
  ownerId: null,
  contact: '',
  email: '',
  status: 1,
})

const formRules = {
  name: [{ required: true, message: t('plugins.uni.tenants.nameRequired'), trigger: 'blur' }],
  slug: [
    { required: true, message: t('plugins.uni.tenants.slugRequired'), trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: t('plugins.uni.tenants.slugPattern'), trigger: 'blur' },
  ],
}

const resetForm = () => {
  formData.name = ''
  formData.slug = ''
  formData.ownerId = null
  formData.contact = ''
  formData.email = ''
  formData.status = 1
}

const openDrawer = async (type, row) => {
  drawerType.value = type
  resetForm()

  if (type === 'update' && row) {
    editingId.value = row.id
    try {
      const res = await getTenant(row.id)
      if (res.code === 0) {
        const d = res.data
        formData.name = d.name || ''
        formData.slug = d.slug || ''
        formData.ownerId = d.ownerId || null
        formData.contact = d.contact || ''
        formData.email = d.email || ''
        formData.status = d.status || 1
        // 预加载当前所有者到下拉选项
        if (d.ownerId && userMap.value[d.ownerId]) {
          userOptions.value = [{ ID: d.ownerId, nickName: userMap.value[d.ownerId], userName: '' }]
        } else if (d.ownerId) {
          await handleSearchUser('') // 加载用户列表
        }
      }
    } catch (e) {
      console.error('加载租户详情失败:', e)
    }
  }

  drawerVisible.value = true
}

const handleSave = async () => {
  if (formRef.value) {
    try {
      await formRef.value.validate()
    } catch {
      return
    }
  }

  saveLoading.value = true
  try {
    const data = {
      name: formData.name,
      slug: formData.slug,
      ownerId: formData.ownerId || 0,
      contact: formData.contact,
      email: formData.email,
    }

    let res
    if (drawerType.value === 'create') {
      res = await createTenant(data)
    } else {
      data.status = formData.status
      res = await updateTenant(editingId.value, data)
    }

    if (res.code === 0) {
      ElMessage.success(drawerType.value === 'create' ? t('plugins.uni.createSuccess') : t('plugins.uni.updateSuccess'))
      drawerVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.tenants.operationFailed'))
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saveLoading.value = false
  }
}

// ---- 删除 ----
const handleDelete = async (row) => {
  try {
    const res = await deleteTenant(row.id)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.deleteSuccess'))
      loadData()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.loadFailed'))
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.gva-search-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
}
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
