<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="设备名称">
          <el-input v-model="searchInfo.name" placeholder="请输入设备名称" clearable />
        </el-form-item>
        <el-form-item label="所属产品">
          <el-select v-model="searchInfo.productId" placeholder="请选择" clearable>
            <el-option v-for="p in productOptions" :key="p.ID" :label="p.name" :value="p.ID" />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select v-model="searchInfo.online" placeholder="请选择" clearable>
            <el-option label="在线" :value="true" />
            <el-option label="离线" :value="false" />
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
        <el-button type="primary" icon="plus" @click="openDialog()">新建设备</el-button>
      </div>
      <el-table :data="tableData" row-key="ID">
        <el-table-column label="设备名称" prop="name" min-width="120" />
        <el-table-column label="设备标识" prop="deviceName" min-width="120" />
        <el-table-column label="所属产品" min-width="120">
          <template #default="{ row }">{{ row.product?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="在线状态" prop="online" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后上线时间" prop="lastSeenAt" min-width="160">
          <template #default="{ row }">{{ row.lastSeenAt ? formatDate(row.lastSeenAt) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link icon="edit" @click="openDialog(row)">编辑</el-button>
            <el-button type="primary" link icon="dataLine" @click="openTelemetry(row)">遥测</el-button>
            <el-popconfirm title="确定重置接入密钥吗？" @confirm="onResetSecret(row)">
              <template #reference>
                <el-button type="warning" link icon="key">密钥</el-button>
              </template>
            </el-popconfirm>
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

    <el-dialog v-model="dialogVisible" :title="type === 'create' ? '新建设备' : '编辑设备'" width="500px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备标识" prop="deviceName">
          <el-input v-model="formData.deviceName" placeholder="产品内唯一的设备标识" />
        </el-form-item>
        <el-form-item label="所属产品" prop="productId">
          <el-select v-model="formData.productId" placeholder="请选择产品" style="width: 100%">
            <el-option v-for="p in productOptions" :key="p.ID" :label="p.name" :value="p.ID" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="enterDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="telemetryVisible" :title="`遥测数据 - ${telemetryDevice?.name || ''}`" width="700px">
      <el-form :inline="true">
        <el-form-item label="字段">
          <el-input v-model="telemetryQuery.field" placeholder="留空查全部" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="条数">
          <el-input-number v-model="telemetryQuery.limit" :min="10" :max="2000" :step="100" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTelemetry">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="telemetryData" max-height="420">
        <el-table-column label="时间" min-width="180">
          <template #default="{ row }">{{ formatDate(row.time) }}</template>
        </el-table-column>
        <el-table-column label="字段" prop="field" min-width="120" />
        <el-table-column label="值" prop="value" min-width="120" />
        <template #empty>暂无遥测数据</template>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createDevice, deleteDevice, getDeviceList, getTelemetry, resetDeviceSecret, updateDevice } from '@/plugin/iot/api/device'
import { getAllProducts } from '@/plugin/iot/api/product'
import { formatDate } from '@/utils/format'

defineOptions({ name: 'IotDevice' })

const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const productOptions = ref([])
const searchInfo = reactive({ name: '', productId: undefined, online: undefined })

const dialogVisible = ref(false)
const type = ref('create')
const formRef = ref(null)
const formData = ref({ name: '', deviceName: '', productId: undefined })
const rules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备标识', trigger: 'blur' }],
  productId: [{ required: true, message: '请选择所属产品', trigger: 'change' }],
}

const telemetryVisible = ref(false)
const telemetryDevice = ref(null)
const telemetryData = ref([])
const telemetryQuery = reactive({ field: '', limit: 200 })

const loadProducts = async () => {
  const res = await getAllProducts()
  if (res.code === 0) {
    productOptions.value = res.data || []
  }
}

const getTableData = async () => {
  const res = await getDeviceList({
    page: page.value,
    pageSize: pageSize.value,
    name: searchInfo.name || undefined,
    productId: searchInfo.productId || undefined,
    online: searchInfo.online,
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total
  }
}

loadProducts()
getTableData()

const onSubmit = () => {
  page.value = 1
  getTableData()
}

const onReset = () => {
  searchInfo.name = ''
  searchInfo.productId = undefined
  searchInfo.online = undefined
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
    ? { id: row.ID, name: row.name, deviceName: row.deviceName, productId: row.productId }
    : { name: '', deviceName: '', productId: undefined }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const enterDialog = async () => {
  await formRef.value.validate()
  const res = type.value === 'create'
    ? await createDevice(formData.value)
    : await updateDevice(formData.value)
  if (res.code === 0) {
    ElMessage.success(type.value === 'create' ? '创建成功' : '编辑成功')
    closeDialog()
    getTableData()
  }
}

const onDelete = async (row) => {
  const res = await deleteDevice({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('删除成功')
    row.visible = false
    getTableData()
  }
}

const onResetSecret = async (row) => {
  const res = await resetDeviceSecret({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success(`密钥已重置：${res.data.deviceSecret}`)
  }
}

const openTelemetry = (row) => {
  telemetryDevice.value = row
  telemetryData.value = []
  telemetryVisible.value = true
  loadTelemetry()
}

const loadTelemetry = async () => {
  const res = await getTelemetry({
    deviceId: telemetryDevice.value.ID,
    field: telemetryQuery.field || undefined,
    limit: telemetryQuery.limit,
  })
  if (res.code === 0) {
    telemetryData.value = res.data || []
  }
}
</script>
