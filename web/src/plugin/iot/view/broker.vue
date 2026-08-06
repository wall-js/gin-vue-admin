<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span>运行状态</span>
          <div>
            <el-button v-if="!status.running" type="success" icon="video-play" :loading="actionLoading" @click="onStart">启动</el-button>
            <el-button v-else type="danger" icon="video-pause" :loading="actionLoading" @click="onStop">停止</el-button>
            <el-button icon="refresh" @click="loadAll">刷新</el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="运行状态">
          <el-tag v-if="status.running" type="success">运行中</el-tag>
          <el-tag v-else type="danger">已停止</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="接入模式">{{ status.running ? status.authMode : '-' }}</el-descriptions-item>
        <el-descriptions-item label="监听端口">{{ listenPorts }}</el-descriptions-item>
        <el-descriptions-item label="在线连接数">{{ status.running ? status.clientCount : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <span>Broker配置</span>
      </template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="配置由界面统一管理，不再使用config.yaml；保存后若Broker运行中会按新配置自动重启。服务端证书与CA信任池全部由证书管理页面维护（不再读取证书文件）"
        style="margin-bottom: 16px"
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="160px" style="max-width: 640px">
        <el-form-item label="随服务自动启动">
          <el-switch v-model="form.enable" />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary)">开启后服务启动时自动拉起Broker</span>
        </el-form-item>
        <el-form-item label="明文监听端口" prop="port">
          <el-input-number v-model="form.port" :min="0" :max="65535" style="width: 200px" />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary)">0为关闭（等保二级建议关闭明文）</span>
        </el-form-item>
        <el-form-item label="启用TLS监听">
          <el-switch v-model="form.tlsEnable" />
        </el-form-item>
        <template v-if="form.tlsEnable">
          <el-form-item label="TLS监听端口" prop="tlsPort">
            <el-input-number v-model="form.tlsPort" :min="1" :max="65535" style="width: 200px" />
          </el-form-item>
          <el-form-item label="服务端证书" prop="serverCertId">
            <el-select v-model="form.serverCertId" placeholder="请选择服务端证书" style="width: 100%">
              <el-option
                v-for="item in serverCerts"
                :key="item.ID"
                :label="`${item.name}（CN=${item.commonName}）`"
                :value="item.ID"
              />
            </el-select>
            <span style="color: var(--el-text-color-secondary)">库内无可用证书时，请到证书管理页生成服务端证书</span>
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" icon="check" :loading="saveLoading" @click="onSave">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBrokerConfig,
  getBrokerStatus,
  saveBrokerConfig,
  startBroker,
  stopBroker,
} from '@/plugin/iot/api/broker'
import { getCertificateList } from '@/plugin/iot/api/certificate'

defineOptions({ name: 'IotBroker' })

const formRef = ref(null)
const saveLoading = ref(false)
const actionLoading = ref(false)
const status = ref({ running: false, authMode: '', port: 0, tlsEnable: false, tlsPort: 0, clientCount: 0 })
const serverCerts = ref([])
const form = reactive({
  enable: false,
  port: 0,
  tlsEnable: false,
  tlsPort: 8883,
  serverCertId: undefined,
})

const rules = {
  port: [{
    validator: (rule, value, callback) => {
      if (value <= 0 && !form.tlsEnable) {
        callback(new Error('明文端口与TLS监听至少启用一项'))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  }],
  tlsPort: [{ required: true, message: '请输入TLS监听端口', trigger: 'blur' }],
  serverCertId: [{ required: true, message: '请选择服务端证书', trigger: 'change' }],
}

const listenPorts = computed(() => {
  const ports = []
  if (status.value.port > 0) ports.push(`明文 :${status.value.port}`)
  if (status.value.tlsEnable) ports.push(`TLS :${status.value.tlsPort || 8883}`)
  return ports.length ? ports.join('，') : '无监听'
})

const loadAll = async () => {
  const res = await getBrokerConfig()
  if (res.code !== 0) return
  Object.assign(form, res.data.config)
  form.serverCertId = res.data.config.serverCertId || undefined
  status.value = res.data.status
  await loadServerCerts()
}

const loadServerCerts = async () => {
  const res = await getCertificateList({ page: 1, pageSize: 100, certType: 3, status: 1 })
  if (res.code === 0) {
    serverCerts.value = res.data.list || []
  }
}

const refreshStatus = async () => {
  const res = await getBrokerStatus()
  if (res.code === 0) {
    status.value = res.data
  }
}

const onSave = async () => {
  await formRef.value.validate()
  saveLoading.value = true
  try {
    const res = await saveBrokerConfig({ ...form })
    if (res.code !== 0) return
    ElMessage.success(res.msg)
    await refreshStatus()
  } finally {
    saveLoading.value = false
  }
}

const onStart = async () => {
  actionLoading.value = true
  try {
    const res = await startBroker()
    if (res.code !== 0) return
    ElMessage.success('Broker已启动')
    await refreshStatus()
  } finally {
    actionLoading.value = false
  }
}

const onStop = async () => {
  await ElMessageBox.confirm('停止后所有设备将无法接入，确定要停止Broker吗？', '停止Broker', { type: 'warning' })
  actionLoading.value = true
  try {
    const res = await stopBroker()
    if (res.code !== 0) return
    ElMessage.success('Broker已停止')
    await refreshStatus()
  } finally {
    actionLoading.value = false
  }
}

loadAll()
</script>
