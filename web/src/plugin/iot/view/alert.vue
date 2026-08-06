<template>
  <div>
    <div class="gva-table-box">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="告警规则" name="rule">
          <div class="gva-btn-list">
            <el-button type="primary" icon="plus" @click="openRuleDialog()">新建规则</el-button>
          </div>
          <el-table :data="ruleData" row-key="ID">
            <el-table-column label="规则名称" prop="name" min-width="140" />
            <el-table-column label="所属产品" min-width="120">
              <template #default="{ row }">{{ row.product?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="条件" min-width="160">
              <template #default="{ row }">
                {{ row.field }} {{ operatorText(row.operator) }} {{ row.threshold }}
              </template>
            </el-table-column>
            <el-table-column label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="levelType(row.level)">{{ levelText(row.level) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="冷却(秒)" prop="cooldown" width="100" />
            <el-table-column label="启用" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link icon="edit" @click="openRuleDialog(row)">编辑</el-button>
                <el-popconfirm title="确定删除该规则吗？" @confirm="onDeleteRule(row)">
                  <template #reference>
                    <el-button type="danger" link icon="delete">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="gva-pagination">
            <el-pagination
              :current-page="rulePage"
              :page-size="rulePageSize"
              :page-sizes="[10, 30, 50, 100]"
              :total="ruleTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="(v) => { rulePage = v; getRuleData() }"
              @size-change="(v) => { rulePageSize = v; getRuleData() }"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="告警记录" name="record">
          <el-form :inline="true" class="gva-search-box" style="padding: 0">
            <el-form-item label="级别">
              <el-select v-model="recordSearch.level" placeholder="请选择" clearable>
                <el-option label="紧急" value="critical" />
                <el-option label="重要" value="major" />
                <el-option label="次要" value="minor" />
              </el-select>
            </el-form-item>
            <el-form-item label="处理状态">
              <el-select v-model="recordSearch.handled" placeholder="请选择" clearable>
                <el-option label="未处理" :value="false" />
                <el-option label="已处理" :value="true" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="search" @click="onRecordSearch">查询</el-button>
            </el-form-item>
          </el-form>
          <el-table :data="recordData" row-key="ID">
            <el-table-column label="时间" min-width="160">
              <template #default="{ row }">{{ formatDate(row.CreatedAt) }}</template>
            </el-table-column>
            <el-table-column label="设备" min-width="120">
              <template #default="{ row }">{{ row.device?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="告警内容" prop="content" min-width="260" show-overflow-tooltip />
            <el-table-column label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="levelType(row.level)">{{ levelText(row.level) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.handled ? 'success' : 'danger'">{{ row.handled ? '已处理' : '未处理' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button v-if="!row.handled" type="primary" link @click="onHandle(row)">处理</el-button>
                <span v-else>{{ formatDate(row.handledAt) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="gva-pagination">
            <el-pagination
              :current-page="recordPage"
              :page-size="recordPageSize"
              :page-sizes="[10, 30, 50, 100]"
              :total="recordTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="(v) => { recordPage = v; getRecordData() }"
              @size-change="(v) => { recordPageSize = v; getRecordData() }"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="ruleDialogVisible" :title="ruleType === 'create' ? '新建规则' : '编辑规则'" width="560px">
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="ruleRules" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="所属产品" prop="productId">
          <el-select v-model="ruleForm.productId" placeholder="请选择产品" style="width: 100%">
            <el-option v-for="p in productOptions" :key="p.ID" :label="p.name" :value="p.ID" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件" prop="field">
          <div class="flex gap-2 w-full">
            <el-input v-model="ruleForm.field" placeholder="遥测字段" class="flex-1" />
            <el-select v-model="ruleForm.operator" style="width: 110px">
              <el-option label="大于" value="gt" />
              <el-option label="大于等于" value="ge" />
              <el-option label="小于" value="lt" />
              <el-option label="小于等于" value="le" />
              <el-option label="等于" value="eq" />
            </el-select>
            <el-input-number v-model="ruleForm.threshold" :controls="false" style="width: 130px" />
          </div>
        </el-form-item>
        <el-form-item label="告警级别" prop="level">
          <el-select v-model="ruleForm.level" style="width: 100%">
            <el-option label="紧急" value="critical" />
            <el-option label="重要" value="major" />
            <el-option label="次要" value="minor" />
          </el-select>
        </el-form-item>
        <el-form-item label="冷却时间(秒)">
          <el-input-number v-model="ruleForm.cooldown" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="enterRuleDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAlertRule,
  deleteAlertRule,
  getAlertRecordList,
  getAlertRuleList,
  handleAlertRecord,
  updateAlertRule,
} from '@/plugin/iot/api/alert'
import { getAllProducts } from '@/plugin/iot/api/product'
import { formatDate } from '@/utils/format'

defineOptions({ name: 'IotAlert' })

const activeTab = ref('rule')
const productOptions = ref([])

// ===== 规则 =====
const ruleData = ref([])
const rulePage = ref(1)
const ruleTotal = ref(0)
const rulePageSize = ref(10)
const ruleDialogVisible = ref(false)
const ruleType = ref('create')
const ruleFormRef = ref(null)
const ruleForm = ref({})
const ruleRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
  field: [{ required: true, message: '请输入遥测字段', trigger: 'blur' }],
  level: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
}

// ===== 记录 =====
const recordData = ref([])
const recordPage = ref(1)
const recordTotal = ref(0)
const recordPageSize = ref(10)
const recordSearch = reactive({ level: '', handled: undefined })

const operatorText = (op) => ({ gt: '>', ge: '>=', lt: '<', le: '<=', eq: '=' }[op] || op)
const levelText = (level) => ({ critical: '紧急', major: '重要', minor: '次要' }[level] || level)
const levelType = (level) => ({ critical: 'danger', major: 'warning', minor: 'info' }[level] || 'info')

const loadProducts = async () => {
  const res = await getAllProducts()
  if (res.code === 0) {
    productOptions.value = res.data || []
  }
}

const getRuleData = async () => {
  const res = await getAlertRuleList({ page: rulePage.value, pageSize: rulePageSize.value })
  if (res.code === 0) {
    ruleData.value = res.data.list || []
    ruleTotal.value = res.data.total
  }
}

const getRecordData = async () => {
  const res = await getAlertRecordList({
    page: recordPage.value,
    pageSize: recordPageSize.value,
    level: recordSearch.level || undefined,
    handled: recordSearch.handled,
  })
  if (res.code === 0) {
    recordData.value = res.data.list || []
    recordTotal.value = res.data.total
  }
}

loadProducts()
getRuleData()
getRecordData()

const onRecordSearch = () => {
  recordPage.value = 1
  getRecordData()
}

const openRuleDialog = (row) => {
  ruleType.value = row ? 'update' : 'create'
  ruleForm.value = row
    ? { ...row }
    : { name: '', productId: undefined, field: '', operator: 'gt', threshold: 0, level: 'major', cooldown: 60, enable: true }
  ruleDialogVisible.value = true
}

const enterRuleDialog = async () => {
  await ruleFormRef.value.validate()
  const res = ruleType.value === 'create'
    ? await createAlertRule(ruleForm.value)
    : await updateAlertRule(ruleForm.value)
  if (res.code === 0) {
    ElMessage.success(ruleType.value === 'create' ? '创建成功' : '编辑成功')
    ruleDialogVisible.value = false
    getRuleData()
  }
}

const onDeleteRule = async (row) => {
  const res = await deleteAlertRule({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getRuleData()
  }
}

const onHandle = async (row) => {
  const res = await handleAlertRecord({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('处理成功')
    getRecordData()
  }
}
</script>
