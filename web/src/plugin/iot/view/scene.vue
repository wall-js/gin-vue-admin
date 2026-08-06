<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="场景名称">
          <el-input v-model="searchInfo.name" placeholder="请输入场景名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" @click="openDialog()">新建场景</el-button>
      </div>
      <el-table :data="tableData" row-key="ID">
        <el-table-column label="场景名称" prop="name" min-width="140" />
        <el-table-column label="触发方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.triggerType === 'device' ? 'primary' : 'warning'">
              {{ row.triggerType === 'device' ? '设备触发' : '手动触发' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近触发时间" min-width="160">
          <template #default="{ row }">{{ row.lastTriggeredAt ? formatDate(row.lastTriggeredAt) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link icon="edit" @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link icon="videoPlay" @click="onTrigger(row)">触发</el-button>
            <el-popconfirm title="确定删除该场景吗？" @confirm="onDelete(row)">
              <template #reference>
                <el-button type="danger" link icon="delete">删除</el-button>
              </template>
            </el-popconfirm>
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

    <el-dialog v-model="dialogVisible" :title="type === 'create' ? '新建场景' : '编辑场景'" width="640px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="场景名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="触发方式" prop="triggerType">
          <el-radio-group v-model="formData.triggerType">
            <el-radio value="device">设备触发</el-radio>
            <el-radio value="manual">手动触发</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formData.triggerType === 'device'">
          <el-form-item label="触发设备" prop="triggerDeviceId">
            <el-select v-model="formData.triggerDeviceId" placeholder="请选择设备" style="width: 100%">
              <el-option v-for="d in deviceOptions" :key="d.ID" :label="d.name" :value="d.ID" />
            </el-select>
          </el-form-item>
          <el-form-item label="触发条件" prop="triggerField">
            <div class="flex gap-2 w-full">
              <el-input v-model="formData.triggerField" placeholder="遥测字段" class="flex-1" />
              <el-select v-model="formData.triggerOperator" style="width: 110px">
                <el-option label="大于" value="gt" />
                <el-option label="大于等于" value="ge" />
                <el-option label="小于" value="lt" />
                <el-option label="小于等于" value="le" />
                <el-option label="等于" value="eq" />
              </el-select>
              <el-input-number v-model="formData.triggerThreshold" :controls="false" style="width: 130px" />
            </div>
          </el-form-item>
        </template>
        <el-form-item label="执行动作">
          <div class="w-full">
            <div v-for="(action, index) in formData.actions" :key="index" class="flex gap-2 mb-2">
              <el-select v-model="action.deviceId" placeholder="目标设备" style="width: 200px">
                <el-option v-for="d in deviceOptions" :key="d.ID" :label="d.name" :value="d.ID" />
              </el-select>
              <el-input v-model="action.payloadText" placeholder='指令JSON，如 {"switch":"on"}' class="flex-1" />
              <el-button type="danger" link icon="delete" @click="formData.actions.splice(index, 1)" />
            </div>
            <el-button link type="primary" icon="plus" @click="formData.actions.push({ deviceId: undefined, payloadText: '' })">
              添加动作
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="formData.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="enterDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createScene, deleteScene, getSceneList, triggerScene, updateScene } from '@/plugin/iot/api/scene'
import { getDeviceList } from '@/plugin/iot/api/device'
import { formatDate } from '@/utils/format'

defineOptions({ name: 'IotScene' })

const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const deviceOptions = ref([])
const searchInfo = reactive({ name: '' })

const dialogVisible = ref(false)
const type = ref('create')
const formRef = ref(null)
const formData = ref({})
const rules = {
  name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }],
  triggerType: [{ required: true, message: '请选择触发方式', trigger: 'change' }],
  triggerDeviceId: [{ required: true, message: '请选择触发设备', trigger: 'change' }],
  triggerField: [{ required: true, message: '请输入遥测字段', trigger: 'blur' }],
}

const loadDevices = async () => {
  const res = await getDeviceList({ page: 1, pageSize: 1000 })
  if (res.code === 0) {
    deviceOptions.value = res.data.list || []
  }
}

const getTableData = async () => {
  const res = await getSceneList({
    page: page.value,
    pageSize: pageSize.value,
    name: searchInfo.name || undefined,
  })
  if (res.code === 0) {
    tableData.value = res.data.list || []
    total.value = res.data.total
  }
}

loadDevices()
getTableData()

const onSubmit = () => {
  page.value = 1
  getTableData()
}

const onReset = () => {
  searchInfo.name = ''
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
  if (row) {
    let trigger = {}
    let actions = []
    try { trigger = JSON.parse(row.triggerConfig || '{}') } catch (e) { trigger = {} }
    try { actions = JSON.parse(row.actions || '[]') } catch (e) { actions = [] }
    formData.value = {
      id: row.ID,
      name: row.name,
      triggerType: row.triggerType,
      enable: row.enable,
      triggerDeviceId: trigger.deviceId,
      triggerField: trigger.field || '',
      triggerOperator: trigger.operator || 'gt',
      triggerThreshold: trigger.threshold ?? 0,
      actions: actions.map((a) => ({ deviceId: a.deviceId, payloadText: JSON.stringify(a.payload || {}) })),
    }
  } else {
    formData.value = {
      name: '',
      triggerType: 'manual',
      enable: true,
      triggerDeviceId: undefined,
      triggerField: '',
      triggerOperator: 'gt',
      triggerThreshold: 0,
      actions: [],
    }
  }
  dialogVisible.value = true
}

const enterDialog = async () => {
  await formRef.value.validate()
  const actions = []
  for (const action of formData.value.actions) {
    if (!action.deviceId) continue
    let payload = {}
    try {
      payload = action.payloadText ? JSON.parse(action.payloadText) : {}
    } catch (e) {
      ElMessage.error('动作指令必须是合法的JSON')
      return
    }
    actions.push({ deviceId: action.deviceId, payload })
  }
  const body = {
    id: formData.value.id,
    name: formData.value.name,
    triggerType: formData.value.triggerType,
    enable: formData.value.enable,
    triggerConfig: formData.value.triggerType === 'device'
      ? {
          deviceId: formData.value.triggerDeviceId,
          field: formData.value.triggerField,
          operator: formData.value.triggerOperator,
          threshold: formData.value.triggerThreshold,
        }
      : {},
    actions,
  }
  const res = type.value === 'create' ? await createScene(body) : await updateScene(body)
  if (res.code === 0) {
    ElMessage.success(type.value === 'create' ? '创建成功' : '编辑成功')
    dialogVisible.value = false
    getTableData()
  }
}

const onDelete = async (row) => {
  const res = await deleteScene({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

const onTrigger = async (row) => {
  const res = await triggerScene({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('触发成功')
    getTableData()
  }
}
</script>
