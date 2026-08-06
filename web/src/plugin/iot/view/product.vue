<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="产品名称">
          <el-input v-model="searchInfo.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="请选择" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" @click="openDialog()">新建产品</el-button>
      </div>
      <el-table :data="tableData" row-key="ID">
        <el-table-column label="产品名称" prop="name" min-width="140" />
        <el-table-column label="ProductKey" prop="productKey" min-width="160" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" min-width="160">
          <template #default="{ row }">{{ formatDate(row.CreatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link icon="edit" @click="openDialog(row)">编辑</el-button>
            <el-popover v-model="row.visible" placement="left" trigger="click" :width="170">
              <p style="margin: 0 0 12px">确定要删除吗？</p>
              <div style="text-align: right; margin: 0">
                <el-button size="small" @click="row.visible = false">取消</el-button>
                <el-button size="small" type="primary" @click="onDelete(row)">确定</el-button>
              </div>
              <template #reference>
                <el-button type="danger" link icon="delete">删除</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="type === 'create' ? '新建产品' : '编辑产品'" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="enterDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createProduct, deleteProduct, getProductList, updateProduct } from '@/plugin/iot/api/product'
import { formatDate } from '@/utils/format'

defineOptions({ name: 'IotProduct' })

const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const searchInfo = reactive({ name: '', status: undefined })

const dialogVisible = ref(false)
const type = ref('create')
const formRef = ref(null)
const formData = ref({ name: '', description: '', status: 1 })
const rules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
}

const getTableData = async () => {
  const res = await getProductList({
    page: page.value,
    pageSize: pageSize.value,
    name: searchInfo.name || undefined,
    status: searchInfo.status,
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total
  }
}

getTableData()

const onSubmit = () => {
  page.value = 1
  getTableData()
}

const onReset = () => {
  searchInfo.name = ''
  searchInfo.status = undefined
  onSubmit()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

const openDialog = (row) => {
  type.value = row ? 'update' : 'create'
  formData.value = row
    ? { ...row }
    : { name: '', description: '', status: 1 }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const enterDialog = async () => {
  await formRef.value.validate()
  const res = type.value === 'create'
    ? await createProduct(formData.value)
    : await updateProduct(formData.value)
  if (res.code === 0) {
    ElMessage.success(type.value === 'create' ? '创建成功' : '编辑成功')
    closeDialog()
    getTableData()
  }
}

const onDelete = async (row) => {
  const res = await deleteProduct({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('删除成功')
    row.visible = false
    getTableData()
  }
}
</script>
