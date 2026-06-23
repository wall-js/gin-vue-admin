<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="searchInfo.keyword"
            placeholder="搜索名称 / 域名"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="维护中" :value="2" />
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
          <h2 style="margin: 0;">站点管理</h2>
          <el-tag type="info" size="small">共 {{ filteredSites.length }} 条</el-tag>
          <el-tag v-if="activeSiteName" type="success" size="small" effect="dark">
            当前维护：{{ activeSiteName }}
          </el-tag>
          <el-button v-if="activeSiteId" type="warning" link @click="handleClearSite">清除切换</el-button>
          <el-button type="primary" link @click="loadSites">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="openCreateDrawer">
            <el-icon><Plus /></el-icon>
            新建站点
          </el-button>
        </div>
      </div>

      <el-table :data="filteredSites" v-loading="loading" stripe style="width: 100%"
        :row-class-name="tableRowClassName">
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="站点名称" min-width="200">
          <template #default="{ row }">
            <span>{{ parseName(row.name) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="所属租户" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.tenantId" size="small">{{ getTenantName(row.tenantId) }}</el-tag>
            <el-tag v-else type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="域名" prop="domain" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.domain" type="success" size="small">{{ row.domain }}</el-tag>
            <span v-else style="color: #999;">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column label="默认语言" prop="locale" width="100" />
        <el-table-column label="模板" prop="template" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? '正常' : '维护中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="TLS 证书" width="160">
          <template #default="{ row }">
            <template v-if="row.certStatus > 0">
              <el-tag :type="certStatusType(row.certStatus)" size="small">
                {{ certStatusText(row.certStatus) }}
              </el-tag>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">
                {{ certSourceText(row.certSource) }}
                <span v-if="row.certExpiresAt"> | 过期: {{ row.certExpiresAt.slice(0, 10) }}</span>
              </div>
            </template>
            <span v-else style="color: #999;">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleCertManage(row)">证书</el-button>
            <el-button type="warning" link @click="handleDemoData(row)">演示数据</el-button>
            <el-button v-if="activeSiteId !== row.id" type="success" link @click="handleSwitchSite(row)">切换</el-button>
            <el-tag v-else type="success" size="small" effect="dark">当前</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`编辑站点 - ${editSiteName}`" size="520px" direction="rtl">
      <el-form :model="editForm" label-width="100px" v-loading="editLoading">
        <el-form-item label="站点名称">
          <el-input v-model="editNameValue" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="所属租户">
          <el-select v-model="editForm.tenantId" placeholder="选择租户" clearable filterable>
            <el-option
              v-for="t in tenants"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            >
              <span>{{ t.name }}</span>
              <el-tag size="small" type="info" style="margin-left: 8px;">{{ t.slug }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="绑定域名">
          <el-input v-model="editForm.domain" placeholder="如 example.com" />
        </el-form-item>
        <el-form-item label="默认语言">
          <el-select v-model="editForm.locale" placeholder="请选择">
            <el-option label="中文" value="zh" />
            <el-option label="繁體中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item label="可用语言">
          <el-select v-model="editLocalesList" multiple placeholder="请选择可用语言">
            <el-option label="中文" value="zh" />
            <el-option label="繁體中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板">
          <el-input v-model="editForm.template" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="Favicon URL">
          <el-input v-model="editForm.faviconUrl" placeholder="Favicon URL" />
        </el-form-item>
        <el-form-item label="站点状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="2">维护中</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-drawer>

    <!-- 证书管理抽屉 -->
    <el-drawer v-model="certDrawerVisible" :title="`TLS 证书 - ${certSiteName}`" size="520px" direction="rtl">
      <div v-loading="certLoading">
        <div v-if="certInfo.certStatus > 0" style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px;">
          <h4 style="margin: 0 0 12px 0;">当前证书</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="状态">
              <el-tag :type="certStatusType(certInfo.certStatus)" size="small">{{ certStatusText(certInfo.certStatus) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="来源">{{ certSourceText(certInfo.certSource) }}</el-descriptions-item>
            <el-descriptions-item label="签发时间" v-if="certInfo.certIssuedAt">{{ certInfo.certIssuedAt }}</el-descriptions-item>
            <el-descriptions-item label="过期时间" v-if="certInfo.certExpiresAt">{{ certInfo.certExpiresAt }}</el-descriptions-item>
            <el-descriptions-item label="最近续期" v-if="certInfo.certRenewedAt">{{ certInfo.certRenewedAt }}</el-descriptions-item>
            <el-descriptions-item label="指纹" v-if="certInfo.certFingerprint">
              <span style="font-family: monospace; font-size: 11px; word-break: break-all;">{{ certInfo.certFingerprint }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top: 12px;">
            <el-button type="danger" size="small" @click="handleClearCert">清除证书</el-button>
          </div>
        </div>
        <div v-else style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px; text-align: center; color: #999;">
          暂未配置 TLS 证书
        </div>
        <el-divider content-position="left">手动上传证书</el-divider>
        <el-form label-width="80px">
          <el-form-item label="证书 PEM">
            <el-input v-model="certUploadForm.certPem" type="textarea" :rows="5" placeholder="粘贴 PEM 格式证书（含完整证书链）" />
          </el-form-item>
          <el-form-item label="私钥 PEM">
            <el-input v-model="certUploadForm.keyPem" type="textarea" :rows="5" placeholder="粘贴 PEM 格式私钥" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="certUploadLoading" @click="handleUploadCert">上传证书</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

    <!-- 新建站点抽屉 -->
    <el-drawer v-model="createDrawerVisible" title="新建站点" size="520px" direction="rtl" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="100px" v-loading="createLoading">
        <el-form-item label="站点名称">
          <el-input v-model="createForm.name" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="所属租户">
          <el-select v-model="createForm.tenantId" placeholder="选择租户" clearable filterable>
            <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id">
              <span>{{ t.name }}</span>
              <el-tag size="small" type="info" style="margin-left: 8px;">{{ t.slug }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="绑定域名">
          <el-input v-model="createForm.domain" placeholder="如 example.com（可选）" />
        </el-form-item>
        <el-form-item label="默认语言">
          <el-select v-model="createForm.locale" placeholder="请选择">
            <el-option label="中文" value="zh" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板">
          <el-input v-model="createForm.template" placeholder="default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDrawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSaving" @click="handleCreateSite">创建</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { listSites, getSite, updateSite, createDemoData, getCert, uploadCert, clearCert, createSite } from '../api/site.js'
import { listTenants } from '../../core/api/tenant.js'

const loading = ref(false)
const siteList = ref([])
const tenants = ref([])

// 新建站点
const createDrawerVisible = ref(false)
const createLoading = ref(false)
const createSaving = ref(false)
const createForm = ref({ name: '', tenantId: null, domain: '', locale: 'zh', template: 'default' })
const openCreateDrawer = () => {
  createForm.value = { name: '', tenantId: null, domain: '', locale: 'zh', template: 'default' }
  createDrawerVisible.value = true
}
const handleCreateSite = async () => {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入站点名称')
    return
  }
  if (!createForm.value.tenantId) {
    ElMessage.warning('请选择所属租户')
    return
  }
  createSaving.value = true
  try {
    const nameJson = JSON.stringify({ zh: createForm.value.name })
    const res = await createSite({
      name: nameJson,
      tenantId: createForm.value.tenantId,
      domain: createForm.value.domain || '',
      locale: createForm.value.locale,
      template: createForm.value.template || 'default',
    })
    if (res.code === 0) {
      ElMessage.success('站点创建成功')
      createDrawerVisible.value = false
      loadSites()
    } else {
      ElMessage.error(res.msg || '创建失败')
    }
  } catch (e) {
    console.error('创建站点失败:', e)
    ElMessage.error('创建站点失败')
  } finally {
    createSaving.value = false
  }
}

// 搜索相关
const searchInfo = ref({ keyword: '', status: null })
const filteredSites = computed(() => {
  let list = siteList.value
  const kw = searchInfo.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(s => {
      const name = parseName(s.name).toLowerCase()
      const domain = (s.domain || '').toLowerCase()
      return name.includes(kw) || domain.includes(kw)
    })
  }
  if (searchInfo.value.status) {
    list = list.filter(s => s.status === searchInfo.value.status)
  }
  return list
})
const handleSearch = () => {} // computed 自动响应，保留空函数以匹配 GVA 模板调用
const resetSearch = () => {
  searchInfo.value = { keyword: '', status: null }
}

// 加载租户列表
const loadTenants = async () => {
  try {
    const res = await listTenants({ offset: 0, limit: 100 })
    if (res.code === 0) {
      tenants.value = res.data.items || []
    }
  } catch (e) {
    console.error('加载租户列表失败:', e)
  }
}

// 根据 tenantId 获取租户名称
const getTenantName = (tenantId) => {
  const t = tenants.value.find(t => t.id === tenantId)
  return t ? t.name : tenantId ? `租户 #${tenantId}` : '未分配'
}

// 当前激活站点
const activeSiteId = ref(Number(localStorage.getItem('cms_site_id')) || null)
const activeSiteName = computed(() => {
  if (!activeSiteId.value) return ''
  const site = siteList.value.find(s => s.id === activeSiteId.value)
  return site ? parseName(site.name) : ''
})

// 编辑相关
const drawerVisible = ref(false)
const editLoading = ref(false)
const saveLoading = ref(false)
const editingSiteId = ref(null)
const editSiteName = ref('')
const editForm = ref({
  tenantId: null,
  domain: '',
  locale: 'zh',
  locales: '["zh","en"]',
  template: 'default',
  faviconUrl: '',
  status: 1,
  _full: null
})

// 解析 I18nText JSON 获取显示名称
const parseName = (name) => {
  if (!name) return '-'
  if (typeof name === 'string') {
    try {
      const obj = JSON.parse(name)
      return obj.zh || obj.en || obj['zh-TW'] || Object.values(obj)[0] || name
    } catch {
      return name
    }
  }
  if (typeof name === 'object') {
    return name.zh || name.en || name['zh-TW'] || Object.values(name)[0] || '-'
  }
  return name
}

// 编辑时的站点名称
const editNameValue = computed({
  get() {
    const full = editForm.value._full
    if (!full) return ''
    const name = full.name
    if (typeof name === 'string') {
      try {
        const obj = JSON.parse(name)
        return obj.zh || obj.en || Object.values(obj)[0] || ''
      } catch {
        return name
      }
    }
    return (name && typeof name === 'object') ? (name.zh || name.en || '') : ''
  },
  set(val) {
    const full = editForm.value._full
    if (!full) return
    let name = full.name
    if (typeof name === 'string') {
      try { name = JSON.parse(name) } catch { name = {} }
    }
    if (typeof name !== 'object') name = {}
    name.zh = val
    full.name = JSON.stringify(name)
  }
})

// 可用语言列表绑定
const editLocalesList = computed({
  get() {
    try {
      return JSON.parse(editForm.value.locales)
    } catch {
      return ['zh']
    }
  },
  set(val) {
    editForm.value.locales = JSON.stringify(val)
  }
})

// 临时切换 site_id 执行请求，完成后恢复
const withSiteId = async (siteId, fn) => {
  const original = localStorage.getItem('cms_site_id')
  localStorage.setItem('cms_site_id', String(siteId))
  try {
    return await fn()
  } finally {
    if (original) {
      localStorage.setItem('cms_site_id', original)
    } else {
      localStorage.removeItem('cms_site_id')
    }
  }
}

// 加载站点列表
const loadSites = async () => {
  loading.value = true
  try {
    const res = await listSites()
    if (res.code === 0) {
      siteList.value = res.data.list || []
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (e) {
    console.error('加载站点列表失败:', e)
  } finally {
    loading.value = false
  }
}

// 打开编辑抽屉
const handleEdit = async (row) => {
  editingSiteId.value = row.id
  editSiteName.value = parseName(row.name)
  editLoading.value = true
  drawerVisible.value = true

  try {
    const res = await withSiteId(row.id, () => getSite())
    if (res.code === 0) {
      const data = res.data
      editForm.value = {
        tenantId: data.tenantId || null,
        domain: data.domain || '',
        locale: data.locale || 'zh',
        locales: data.locales || '["zh","en"]',
        template: data.template || 'default',
        faviconUrl: data.faviconUrl || '',
        status: data.status || 1,
        _full: data
      }
    } else {
      ElMessage.error('加载站点详情失败')
      drawerVisible.value = false
    }
  } catch (e) {
    console.error('加载站点详情失败:', e)
    drawerVisible.value = false
  } finally {
    editLoading.value = false
  }
}

// 保存编辑
const handleSaveEdit = async () => {
  saveLoading.value = true
  try {
    const full = editForm.value._full
    const data = {
      name: typeof full.name === 'string' ? full.name : JSON.stringify(full.name || {}),
      description: typeof full.description === 'string' ? full.description : JSON.stringify(full.description || {}),
      logoUrl: typeof full.logoUrl === 'string' ? full.logoUrl : JSON.stringify(full.logoUrl || {}),
      faviconUrl: editForm.value.faviconUrl || '',
      locale: editForm.value.locale,
      locales: editForm.value.locales,
      template: editForm.value.template,
      metaTitle: typeof full.metaTitle === 'string' ? full.metaTitle : JSON.stringify(full.metaTitle || {}),
      metaDescription: typeof full.metaDescription === 'string' ? full.metaDescription : JSON.stringify(full.metaDescription || {}),
      metaKeywords: typeof full.metaKeywords === 'string' ? full.metaKeywords : JSON.stringify(full.metaKeywords || {}),
      settingsJson: typeof full.settingsJson === 'string' ? full.settingsJson : JSON.stringify(full.settingsJson || {}),
      domain: editForm.value.domain || '',
      status: editForm.value.status,
      tenantId: editForm.value.tenantId,
    }

    const res = await withSiteId(editingSiteId.value, () => updateSite(data))
    if (res.code === 0) {
      ElMessage.success('保存成功')
      drawerVisible.value = false
      loadSites()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 切换当前维护站点（设置 cms_site_id，所有 CMS 页面生效）
const handleSwitchSite = (row) => {
  activeSiteId.value = row.id
  localStorage.setItem('cms_site_id', String(row.id))
  ElMessage.success(`已切换到站点：${parseName(row.name)}`)
}

// 清除站点切换
const handleClearSite = () => {
  activeSiteId.value = null
  localStorage.removeItem('cms_site_id')
  ElMessage.info('已清除站点切换')
}

// 高亮当前激活站点行
const tableRowClassName = ({ row }) => {
  return row.id === activeSiteId.value ? 'active-site-row' : ''
}

// 生成演示数据（两步确认）
const handleDemoData = async (row) => {
  const siteName = parseName(row.name)
  // 第一步：确认目标站点
  try {
    await ElMessageBox.confirm(
      `即将为站点「${siteName}」生成演示数据，包括示例文章、分类、标签、菜单等内容。此操作为纯插入，不会删除现有数据。`,
      '生成演示数据 - 第一步确认',
      { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  // 第二步：最终确认
  try {
    await ElMessageBox.confirm(
      `请再次确认：确定要为站点「${siteName}」生成演示数据吗？此操作不可撤销。`,
      '最终确认',
      { confirmButtonText: '确定生成', cancelButtonText: '放弃', type: 'error', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  // 执行生成
  loading.value = true
  try {
    const res = await withSiteId(row.id, () => createDemoData())
    if (res.code === 0) {
      ElMessage.success(`站点「${siteName}」演示数据生成成功`)
      loadSites()
    } else {
      ElMessage.error(res.msg || '生成失败')
    }
  } catch (e) {
    console.error('生成演示数据失败:', e)
    ElMessage.error('生成演示数据失败')
  } finally {
    loading.value = false
  }
}

// ── 证书管理 ──
const certDrawerVisible = ref(false)
const certLoading = ref(false)
const certUploadLoading = ref(false)
const certSiteName = ref('')
const certSiteId = ref(null)
const certInfo = ref({ certStatus: 0, certSource: 0 })
const certUploadForm = ref({ certPem: '', keyPem: '' })

const certStatusText = (s) => ({ 1: '有效', 2: '即将过期', 3: '已过期' }[s] || '未知')
const certStatusType = (s) => ({ 1: 'success', 2: 'warning', 3: 'danger' }[s] || 'info')
const certSourceText = (s) => ({ 1: 'Let\'s Encrypt', 2: '手动上传', 3: '自签名' }[s] || '未知')

const handleCertManage = async (row) => {
  certSiteId.value = row.id
  certSiteName.value = parseName(row.name)
  certUploadForm.value = { certPem: '', keyPem: '' }
  certDrawerVisible.value = true
  certLoading.value = true
  try {
    const res = await withSiteId(row.id, () => getCert())
    if (res.code === 0) {
      certInfo.value = res.data
    } else {
      certInfo.value = { certStatus: 0, certSource: 0 }
    }
  } catch {
    certInfo.value = { certStatus: 0, certSource: 0 }
  } finally {
    certLoading.value = false
  }
}

const handleUploadCert = async () => {
  if (!certUploadForm.value.certPem || !certUploadForm.value.keyPem) {
    ElMessage.warning('请填写证书和私钥')
    return
  }
  certUploadLoading.value = true
  try {
    const res = await withSiteId(certSiteId.value, () => uploadCert(certUploadForm.value))
    if (res.code === 0) {
      ElMessage.success('证书上传成功')
      certInfo.value = res.data
      certUploadForm.value = { certPem: '', keyPem: '' }
      loadSites()
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (e) {
    console.error('上传证书失败:', e)
    ElMessage.error('上传证书失败')
  } finally {
    certUploadLoading.value = false
  }
}

const handleClearCert = async () => {
  try {
    await ElMessageBox.confirm('确定要清除该站点的 TLS 证书吗？清除后需重新配置或等待自动签发。', '清除证书', { type: 'warning' })
  } catch { return }
  certLoading.value = true
  try {
    const res = await withSiteId(certSiteId.value, () => clearCert())
    if (res.code === 0) {
      ElMessage.success('证书已清除')
      certInfo.value = { certStatus: 0, certSource: 0 }
      loadSites()
    } else {
      ElMessage.error(res.msg || '清除失败')
    }
  } catch (e) {
    console.error('清除证书失败:', e)
    ElMessage.error('清除证书失败')
  } finally {
    certLoading.value = false
  }
}

onMounted(() => {
  loadSites()
  loadTenants()
})
</script>

<style scoped>
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

:deep(.active-site-row) {
  background-color: #f0f9eb !important;
}

:deep(.active-site-row td) {
  background-color: #f0f9eb !important;
}
</style>
