<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="证书名称">
          <el-input v-model="searchInfo.name" placeholder="请输入证书名称" clearable />
        </el-form-item>
        <el-form-item label="所属厂家">
          <el-input v-model="searchInfo.vendor" placeholder="请输入厂家名称" clearable />
        </el-form-item>
        <el-form-item label="证书类型">
          <el-select v-model="searchInfo.certType" placeholder="全部" clearable style="width: 140px">
            <el-option label="CA证书" :value="1" />
            <el-option label="客户端证书" :value="2" />
            <el-option label="服务端证书" :value="3" />
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
        <el-button type="primary" icon="plus" @click="openDialog()">新增CA证书</el-button>
        <el-button type="success" icon="magic-stick" @click="openGenCaDialog">自动生成CA</el-button>
        <el-button type="warning" icon="monitor" @click="openGenSrvDialog">生成服务端证书</el-button>
      </div>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="此处统一管理MQTT全部证书：CA信任池（平台CA与各硬件厂家根CA）、Broker服务端证书、已签发客户端证书留档；CA增删后立即热更新Broker信任池，服务端证书在Broker管理页选用"
        style="margin-bottom: 12px"
      />
      <el-table :data="tableData" row-key="ID">
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.certType === 2" type="info" size="small">客户端证书</el-tag>
            <el-tag v-else-if="row.certType === 3" type="warning" size="small">服务端证书</el-tag>
            <el-tag v-else size="small">CA</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="证书名称" prop="name" min-width="140">
          <template #default="{ row }">
            {{ row.name }}
            <el-tag v-if="row.hasKey" type="success" size="small" style="margin-left: 6px">持私钥</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所属厂家" prop="vendor" min-width="120" />
        <el-table-column label="证书CN" prop="commonName" min-width="150" show-overflow-tooltip />
        <el-table-column label="有效期至" min-width="170">
          <template #default="{ row }">
            <span>{{ formatDate(row.notAfter) }}</span>
            <el-tag v-if="isExpired(row.notAfter)" type="danger" size="small" style="margin-left: 6px">已过期</el-tag>
            <el-tag v-else-if="isExpiring(row.notAfter)" type="warning" size="small" style="margin-left: 6px">即将过期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="onToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.CreatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link icon="view" @click="openDetail(row)">查看</el-button>
            <el-button v-if="row.certType === 1 && row.hasKey" type="success" link icon="stamp" @click="openIssueDialog(row)">签发</el-button>
            <el-button v-if="row.certType === 1" type="primary" link icon="edit" @click="openDialog(row)">编辑</el-button>
            <el-popover v-model="row.visible" placement="left" trigger="click" :width="170">
              <p style="margin: 0 0 12px">{{ deleteTip(row) }}</p>
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

    <el-dialog v-model="dialogVisible" :title="type === 'create' ? '新增CA证书' : '编辑CA证书'" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="证书名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：acme厂家根CA" />
        </el-form-item>
        <el-form-item label="所属厂家">
          <el-input v-model="formData.vendor" placeholder="硬件厂家名称，平台自签可留空" />
        </el-form-item>
        <el-form-item label="证书内容" prop="content">
          <div style="width: 100%">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".crt,.pem,.cer"
              :on-change="onFileChange"
            >
              <el-button size="small" icon="upload" style="margin-bottom: 8px">选择证书文件（.crt/.pem）</el-button>
            </el-upload>
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="6"
              :placeholder="type === 'create' ? '请粘贴CA证书PEM内容（-----BEGIN CERTIFICATE----- 开头）' : '留空表示不修改证书内容'"
            />
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="enterDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="证书详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="证书类型">{{ certTypeText(detailRow.certType) }}</el-descriptions-item>
        <el-descriptions-item label="证书名称">{{ detailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="所属厂家">{{ detailRow.vendor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="证书CN">{{ detailRow.commonName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ formatDate(detailRow.notAfter) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status === 1 ? '启用' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <pre style="margin-top: 12px; padding: 12px; background: var(--el-fill-color-light); border-radius: 4px; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow: auto">{{ detailRow.content }}</pre>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="genCaVisible" title="自动生成CA证书" width="600px">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="系统将生成自签名CA并加入信任池；私钥仅在生成成功时返回一次，请立即保存"
        style="margin-bottom: 16px"
      />
      <el-form ref="genCaFormRef" :model="genCaForm" :rules="genCaRules" label-width="100px">
        <el-form-item label="证书名称" prop="name">
          <el-input v-model="genCaForm.name" placeholder="如：acme厂家根CA" />
        </el-form-item>
        <el-form-item label="所属厂家">
          <el-input v-model="genCaForm.vendor" placeholder="硬件厂家名称，平台自签可留空" />
        </el-form-item>
        <el-form-item label="有效期（天）">
          <el-input-number v-model="genCaForm.days" :min="30" :max="7300" style="width: 200px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="genCaForm.remark" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genCaVisible = false">取消</el-button>
        <el-button type="primary" @click="onGenerateCa">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueVisible" title="签发客户端证书" width="600px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        :title="`签发方CA：${issueCaRow.name}；证书不绑定具体设备，CN自由填写（推荐 {productKey}.{deviceName} 约定）`"
        style="margin-bottom: 16px"
      />
      <el-form ref="issueFormRef" :model="issueForm" :rules="issueRules" label-width="100px">
        <el-form-item label="证书CN" prop="commonName">
          <el-input v-model="issueForm.commonName" placeholder="如 pk001.dev001 或任意标识" />
        </el-form-item>
        <el-form-item label="有效期（天）">
          <el-input-number v-model="issueForm.days" :min="30" :max="3650" style="width: 200px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" @click="onIssueCert">签发并下载</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="genSrvVisible" title="生成Broker服务端证书" width="600px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="由库中CA签发给Broker自身使用（设备连接时校验服务端身份）；证书与私钥均保存在数据库，生成后请到Broker管理页选用"
        style="margin-bottom: 16px"
      />
      <el-form ref="genSrvFormRef" :model="genSrvForm" :rules="genSrvRules" label-width="100px">
        <el-form-item label="证书名称" prop="name">
          <el-input v-model="genSrvForm.name" placeholder="如：平台Broker服务端证书" />
        </el-form-item>
        <el-form-item label="签发方CA" prop="certificateId">
          <el-select v-model="genSrvForm.certificateId" placeholder="请选择持私钥的CA" style="width: 100%">
            <el-option
              v-for="item in caOptions"
              :key="item.ID"
              :label="`${item.name}（CN=${item.commonName}）`"
              :value="item.ID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="证书CN" prop="commonName">
          <el-input v-model="genSrvForm.commonName" placeholder="Broker对外访问的域名或IP，如 iot.example.com" />
        </el-form-item>
        <el-form-item label="有效期（天）">
          <el-input-number v-model="genSrvForm.days" :min="30" :max="7300" style="width: 200px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="genSrvForm.remark" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genSrvVisible = false">取消</el-button>
        <el-button type="primary" @click="onGenerateSrv">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createCertificate,
  deleteCertificate,
  generateCA,
  generateServerCert,
  getCertificateList,
  issueDeviceCert,
  updateCertificate,
} from '@/plugin/iot/api/certificate'
import { formatDate } from '@/utils/format'

defineOptions({ name: 'IotCertificate' })

const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const searchInfo = reactive({ name: '', vendor: '', certType: undefined })

const dialogVisible = ref(false)
const detailVisible = ref(false)
const detailRow = ref({})
const type = ref('create')
const formRef = ref(null)
const formData = ref({ name: '', vendor: '', content: '', status: 1, remark: '' })
const rules = {
  name: [{ required: true, message: '请输入证书名称', trigger: 'blur' }],
  content: [{
    validator: (rule, value, callback) => {
      if (type.value === 'create' && !value) {
        callback(new Error('请粘贴或导入CA证书PEM内容'))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  }],
}

// 30天内到期视为即将过期
const isExpired = (t) => t && new Date(t).getTime() < Date.now()
const isExpiring = (t) => t && !isExpired(t) && new Date(t).getTime() < Date.now() + 30 * 24 * 3600 * 1000

const certTypeText = (certType) => {
  if (certType === 2) return '客户端证书（留档，私钥不在平台）'
  if (certType === 3) return '服务端证书（含私钥，供Broker TLS监听）'
  return 'CA证书（信任池）'
}

const deleteTip = (row) => {
  if (row.certType === 2) return '删除后仅移除签发留档记录，已下发设备的证书不受影响，确定要删除吗？'
  if (row.certType === 3) return '若该证书正被Broker用作服务端证书将无法删除，确定要删除吗？'
  return '删除后依赖该CA的设备将无法接入，确定要删除吗？'
}

const getTableData = async () => {
  const res = await getCertificateList({
    page: page.value,
    pageSize: pageSize.value,
    name: searchInfo.name || undefined,
    vendor: searchInfo.vendor || undefined,
    certType: searchInfo.certType || undefined,
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
  searchInfo.vendor = ''
  searchInfo.certType = undefined
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
    ? { ...row, content: '' }
    : { name: '', vendor: '', content: '', status: 1, remark: '' }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const enterDialog = async () => {
  await formRef.value.validate()
  const res = type.value === 'create'
    ? await createCertificate(formData.value)
    : await updateCertificate(formData.value)
  if (res.code === 0) {
    ElMessage.success(type.value === 'create' ? '新增成功，信任池已更新' : '编辑成功，信任池已更新')
    closeDialog()
    getTableData()
  }
}

const onToggleStatus = async (row) => {
  const res = await updateCertificate({
    ID: row.ID,
    name: row.name,
    vendor: row.vendor,
    status: row.status,
    remark: row.remark,
  })
  if (res.code === 0) {
    ElMessage.success('状态已更新，信任池已同步')
  } else {
    row.status = row.status === 1 ? 0 : 1
  }
}

const onDelete = async (row) => {
  const res = await deleteCertificate({ id: row.ID })
  if (res.code === 0) {
    ElMessage.success('删除成功，信任池已更新')
    row.visible = false
    getTableData()
  }
}

const openDetail = (row) => {
  detailRow.value = row
  detailVisible.value = true
}

const onFileChange = (file) => {
  const raw = file.raw
  if (!raw) return
  if (raw.size > 1024 * 100) {
    ElMessage.warning('证书文件过大，请确认为PEM文本格式的CA证书')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.content = (e.target.result || '').trim()
  }
  reader.readAsText(raw)
}

// ========== 自动生成CA ==========
const genCaVisible = ref(false)
const genCaFormRef = ref(null)
const genCaForm = ref({ name: '', vendor: '', days: 3650, remark: '' })
const genCaRules = {
  name: [{ required: true, message: '请输入证书名称', trigger: 'blur' }],
}

const openGenCaDialog = () => {
  genCaForm.value = { name: '', vendor: '', days: 3650, remark: '' }
  genCaVisible.value = true
}

const onGenerateCa = async () => {
  await genCaFormRef.value.validate()
  const res = await generateCA(genCaForm.value)
  if (res.code !== 0) return
  genCaVisible.value = false
  getTableData()
  const cn = res.data.certificate?.commonName || genCaForm.value.name
  downloadText(`${cn}-ca.key`, res.data.privateKey)
  ElMessage.success('CA已生成并加入信任池，私钥已开始下载，请妥善保存')
}

// ========== 签发客户端证书 ==========
const issueVisible = ref(false)
const issueFormRef = ref(null)
const issueCaRow = ref({})
const issueForm = ref({ commonName: '', days: 365 })
const issueRules = {
  commonName: [{ required: true, message: '请输入证书CN', trigger: 'blur' }],
}

const openIssueDialog = (row) => {
  issueCaRow.value = row
  issueForm.value = { commonName: '', days: 365 }
  issueVisible.value = true
}

const onIssueCert = async () => {
  await issueFormRef.value.validate()
  const res = await issueDeviceCert({
    certificateId: issueCaRow.value.ID,
    commonName: issueForm.value.commonName.trim(),
    days: issueForm.value.days,
  })
  if (res.code !== 0) return
  issueVisible.value = false
  const cn = res.data.commonName
  downloadText(`${cn}.crt`, res.data.certPem)
  downloadText(`${cn}.key`, res.data.keyPem)
  ElMessage.success(`证书已签发（CN=${cn}），证书与私钥已开始下载`)
}

// ========== 生成Broker服务端证书 ==========
const genSrvVisible = ref(false)
const genSrvFormRef = ref(null)
const caOptions = ref([])
const genSrvForm = ref({ name: '', certificateId: undefined, commonName: '', days: 3650, remark: '' })
const genSrvRules = {
  name: [{ required: true, message: '请输入证书名称', trigger: 'blur' }],
  certificateId: [{ required: true, message: '请选择签发方CA', trigger: 'change' }],
  commonName: [{ required: true, message: '请输入证书CN', trigger: 'blur' }],
}

const openGenSrvDialog = async () => {
  genSrvForm.value = { name: '', certificateId: undefined, commonName: '', days: 3650, remark: '' }
  genSrvVisible.value = true
  const res = await getCertificateList({ page: 1, pageSize: 100, certType: 1, status: 1 })
  if (res.code === 0) {
    caOptions.value = (res.data.list || []).filter((item) => item.hasKey)
  }
}

const onGenerateSrv = async () => {
  await genSrvFormRef.value.validate()
  const res = await generateServerCert({
    name: genSrvForm.value.name,
    certificateId: genSrvForm.value.certificateId,
    commonName: genSrvForm.value.commonName.trim(),
    days: genSrvForm.value.days,
    remark: genSrvForm.value.remark,
  })
  if (res.code !== 0) return
  genSrvVisible.value = false
  getTableData()
  ElMessage.success(res.msg || '服务端证书已生成入库')
}

// 浏览器端下载PEM文本文件
const downloadText = (filename, content) => {
  const blob = new Blob([content + '\n'], { type: 'application/x-pem-file' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>
