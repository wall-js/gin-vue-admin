<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline">
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable>
            <el-option label="活跃" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div style="margin-bottom: 12px;">
        <el-button type="primary" @click="openDialog('create')">新增租户</el-button>
      </div>

      <el-table :data="tableData" border style="width: 100%" v-loading="tableLoading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="租户名称" min-width="150" />
        <el-table-column prop="slug" label="标识 (Slug)" width="150" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="email" label="联系邮箱" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createdAt }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog('update', row)">编辑</el-button>
            <el-popconfirm title="确定删除此租户？" @confirm="handleDelete(row)">
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
          @size-change="getTableData"
          @current-change="getTableData"
        />
      </div>
    </div>

    <!-- 租户编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增租户' : '编辑租户'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="formData.slug" placeholder="英文标识，如 my-tenant" :disabled="dialogType === 'update'" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="formData.contact" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="formData.email" placeholder="联系邮箱" />
        </el-form-item>
        <el-form-item label="状态" v-if="dialogType === 'update'">
          <el-select v-model="formData.status">
            <el-option label="活跃" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listTenants, getTenant, createTenant, updateTenant, deleteTenant } from '../api/tenant.js'

// 搜索
const searchInfo = ref({ status: undefined })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表格
const tableData = ref([])
const tableLoading = ref(false)

const getTableData = async () => {
  tableLoading.value = true
  try {
    const params = {
      offset: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      ...searchInfo.value
    }
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
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

const resetSearch = () => {
  searchInfo.value = { status: undefined }
  page.value = 1
  getTableData()
}

// 对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const saveLoading = ref(false)
const formRef = ref(null)
const editingId = ref(0)

const formData = reactive({
  name: '',
  slug: '',
  contact: '',
  email: '',
  status: 1
})

const formRules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入标识', trigger: 'blur' },
    { pattern: /^[a-z0-9][a-z0-9-]*$/, message: '仅允许小写字母、数字和短横线', trigger: 'blur' }
  ]
}

const resetForm = () => {
  formData.name = ''
  formData.slug = ''
  formData.contact = ''
  formData.email = ''
  formData.status = 1
}

const openDialog = async (type, row) => {
  dialogType.value = type
  resetForm()

  if (type === 'update' && row) {
    editingId.value = row.id
    try {
      const res = await getTenant(row.id)
      if (res.code === 0) {
        const d = res.data
        formData.name = d.name || ''
        formData.slug = d.slug || ''
        formData.contact = d.contact || ''
        formData.email = d.email || ''
        formData.status = d.status || 1
      }
    } catch (e) {
      console.error('加载租户详情失败:', e)
    }
  }

  dialogVisible.value = true
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
      contact: formData.contact,
      email: formData.email
    }

    let res
    if (dialogType.value === 'create') {
      res = await createTenant(data)
    } else {
      data.status = formData.status
      res = await updateTenant(editingId.value, data)
    }

    if (res.code === 0) {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
      dialogVisible.value = false
      getTableData()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    const res = await deleteTenant(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      getTableData()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

onMounted(() => {
  getTableData()
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
