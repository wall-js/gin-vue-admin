<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="searchInfo.keyword"
            placeholder="搜索名称 / 标识 / 邮箱"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h2 style="margin: 0;">租户管理</h2>
          <el-tag type="info" size="small">共 {{ total }} 条</el-tag>
          <el-button type="primary" link @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="openDrawer('create')">
            <el-icon><Plus /></el-icon>
            新增租户
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" stripe v-loading="tableLoading" style="width: 100%">
        <!-- <el-table-column type="index" label="#" width="60" /> -->
        <el-table-column prop="name" label="租户名称" min-width="160">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="标识 (Slug)" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.slug }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ownerId" label="所有者" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.ownerId" size="small" type="warning">UID {{ row.ownerId }}</el-tag>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="120">
          <template #default="{ row }">
            {{ row.contact || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="联系邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              inline-prompt
              active-text="活跃"
              inactive-text="停用"
              @change="(val) => handleToggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createdAt }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDrawer('update', row)">编辑</el-button>
            <el-popconfirm title="确定删除此租户？此操作不可恢复。" @confirm="handleDelete(row)" confirm-button-text="删除" cancel-button-text="取消">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
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
      :title="drawerType === 'create' ? '新增租户' : `编辑租户 - ${formData.name}`"
      size="520px"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="formData.slug" placeholder="英文标识，如 my-tenant" :disabled="drawerType === 'update'" />
          <div v-if="drawerType === 'create'" style="color: #999; font-size: 12px; margin-top: 4px;">
            仅允许小写字母、数字和短横线，创建后不可修改
          </div>
        </el-form-item>
        <el-form-item label="所有者ID" prop="ownerId">
          <el-input-number v-model="formData.ownerId" :min="0" placeholder="所有者用户 ID" style="width: 100%;" />
          <div style="color: #999; font-size: 12px; margin-top: 4px;">
            具有该租户下所有权限的用户，0 表示未指定
          </div>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="formData.contact" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="formData.email" placeholder="联系邮箱" />
        </el-form-item>
        <el-form-item label="状态" v-if="drawerType === 'update'">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">活跃</el-radio>
            <el-radio :value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { listTenants, getTenant, createTenant, updateTenant, deleteTenant } from '../api/tenant.js'

// ---- 搜索 ----
const searchInfo = ref({ keyword: '', status: undefined })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// ---- 表格 ----
const tableData = ref([])
const tableLoading = ref(false)

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
      ElMessage.success(active ? '已激活' : '已停用')
    } else {
      ElMessage.error(res.msg || '操作失败')
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
  ownerId: 0,
  contact: '',
  email: '',
  status: 1,
})

const formRules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入标识', trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: '仅允许小写字母、数字和短横线', trigger: 'blur' },
  ],
}

const resetForm = () => {
  formData.name = ''
  formData.slug = ''
  formData.ownerId = 0
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
        formData.ownerId = d.ownerId || 0
        formData.contact = d.contact || ''
        formData.email = d.email || ''
        formData.status = d.status || 1
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
      ownerId: formData.ownerId,
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
      ElMessage.success(drawerType.value === 'create' ? '创建成功' : '更新成功')
      drawerVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.msg || '操作失败')
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
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(res.msg || '删除失败')
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
