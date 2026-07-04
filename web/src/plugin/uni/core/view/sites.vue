<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline" @submit.prevent>
        <el-form-item :label="t('plugins.uni.sites.keyword')">
          <el-input
            v-model="searchInfo.keyword"
            :placeholder="t('plugins.uni.sites.searchPlaceholder')"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.status')">
          <el-select v-model="searchInfo.status" :placeholder="t('plugins.uni.sites.allStatus')" clearable style="width: 120px">
            <el-option :label="t('plugins.uni.sites.statusNormal')" :value="1" />
            <el-option :label="t('plugins.uni.sites.statusMaintenance')" :value="2" />
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
          <h2 style="margin: 0;">{{ t('plugins.uni.sites.management') }}</h2>
          <el-tag type="info" size="small">{{ t('plugins.uni.total', { count: filteredSites.length }) }}</el-tag>
          <el-tag v-if="activeSiteName" type="success" size="small" effect="dark">
            {{ t('plugins.uni.sites.currentSite') }}{{ activeSiteName }}
          </el-tag>
          <el-button v-if="activeSiteId" type="warning" link @click="handleClearSite">{{ t('plugins.uni.sites.clearSwitch') }}</el-button>
          <el-button type="primary" link @click="loadSites">
            <el-icon><Refresh /></el-icon>
            {{ t('plugins.uni.refresh') }}
          </el-button>
        </div>
        <div style="display: flex; gap: 8px;">
          <el-button type="primary" @click="openCreateDrawer">
            <el-icon><Plus /></el-icon>
            {{ t('plugins.uni.sites.newSite') }}
          </el-button>
        </div>
      </div>

      <el-table :data="filteredSites" v-loading="loading" stripe style="width: 100%"
        :row-class-name="tableRowClassName">
        <el-table-column :label="t('plugins.uni.sites.siteName')" min-width="200">
          <template #default="{ row }">
            <span>{{ parseName(row.name) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.sites.tenant')" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.tenantId" size="small">{{ getTenantName(row.tenantId) }}</el-tag>
            <el-tag v-else type="info" size="small">{{ t('plugins.uni.sites.unassigned') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.sites.domain')" prop="domain" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.domain" type="success" size="small">{{ row.domain }}</el-tag>
            <span v-else style="color: #999;">{{ t('plugins.uni.sites.unbound') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.sites.defaultLang')" prop="locale" width="100" />
        <el-table-column :label="t('plugins.uni.sites.template')" prop="template" width="120" />
        <el-table-column :label="t('plugins.uni.sites.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? t('plugins.uni.sites.statusNormal') : t('plugins.uni.sites.statusMaintenance') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.sites.tlsCert')" width="160">
          <template #default="{ row }">
            <template v-if="row.certStatus > 0">
              <el-tag :type="certStatusType(row.certStatus)" size="small">
                {{ certStatusText(row.certStatus) }}
              </el-tag>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">
                {{ certSourceText(row.certSource) }}
                <span v-if="row.certExpiresAt"> | {{ t('plugins.uni.sites.certExpiresPrefix') }} {{ row.certExpiresAt.slice(0, 10) }}</span>
              </div>
            </template>
            <span v-else style="color: #999;">{{ t('plugins.uni.sites.notConfigured') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('plugins.uni.operations')" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">{{ t('plugins.uni.sites.edit') }}</el-button>
            <el-button type="success" link @click="handleCertManage(row)">{{ t('plugins.uni.sites.cert') }}</el-button>
            <el-button type="warning" link @click="handleDemoData(row)">{{ t('plugins.uni.sites.demoData') }}</el-button>
            <el-button v-if="activeSiteId !== row.id" type="success" link @click="handleSwitchSite(row)">{{ t('plugins.uni.sites.switch') }}</el-button>
            <el-tag v-else type="success" size="small" effect="dark">{{ t('plugins.uni.sites.current') }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="t('plugins.uni.sites.editDrawerTitle', { name: editSiteName })" size="520px" direction="rtl">
      <el-form :model="editForm" label-width="100px" v-loading="editLoading">
        <el-form-item :label="t('plugins.uni.sites.siteName')">
          <el-input v-model="editNameValue" :placeholder="t('plugins.uni.sites.enterSiteNameWarn')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.tenant')">
          <el-select v-model="editForm.tenantId" :placeholder="t('plugins.uni.sites.selectTenant')" clearable filterable>
            <el-option
              v-for="tenant in tenants"
              :key="tenant.id"
              :label="tenant.name"
              :value="tenant.id"
            >
              <span>{{ tenant.name }}</span>
              <el-tag size="small" type="info" style="margin-left: 8px;">{{ tenant.slug }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.bindDomain')">
          <el-input v-model="editForm.domain" :placeholder="t('plugins.uni.sites.domainPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.defaultLang')">
          <el-select v-model="editForm.locale" :placeholder="t('plugins.uni.sites.pleaseSelect')">
            <el-option :label="t('plugins.uni.sites.langZh')" value="zh" />
            <el-option :label="t('plugins.uni.sites.langZhTW')" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.availableLangs')">
          <el-select v-model="editLocalesList" multiple :placeholder="t('plugins.uni.sites.selectAvailableLangs')">
            <el-option :label="t('plugins.uni.sites.langZh')" value="zh" />
            <el-option :label="t('plugins.uni.sites.langZhTW')" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.template')">
          <el-input v-model="editForm.template" :placeholder="t('plugins.uni.sites.templateName')" />
        </el-form-item>
        <el-form-item label="Favicon URL">
          <el-input v-model="editForm.faviconUrl" placeholder="Favicon URL" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.siteStatus')">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">{{ t('plugins.uni.sites.statusNormal') }}</el-radio>
            <el-radio :value="2">{{ t('plugins.uni.sites.statusMaintenance') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveEdit">{{ t('plugins.uni.save') }}</el-button>
      </template>
    </el-drawer>

    <!-- 证书管理抽屉 -->
    <el-drawer v-model="certDrawerVisible" :title="t('plugins.uni.sites.certDrawerTitle', { name: certSiteName })" size="520px" direction="rtl">
      <div v-loading="certLoading">
        <!-- TLS 自动签发设置 -->
        <div style="margin-bottom: 20px; padding: 16px; background: #ecf5ff; border-radius: 4px; border-left: 4px solid #409eff;">
          <h4 style="margin: 0 0 12px 0; color: #409eff;">{{ t('plugins.uni.site.autoCert') }} (Let's Encrypt)</h4>
          <el-form label-width="100px" size="small">
            <el-form-item :label="t('plugins.uni.site.autoIssue')">
              <el-switch v-model="tlsAutoForm.tlsAuto" :active-value="1" :inactive-value="0"
                :active-text="t('plugins.uni.site.enabled')" :inactive-text="t('plugins.uni.site.disabled')" />
              <span style="margin-left: 12px; font-size: 12px; color: #999;">
                {{ tlsAutoForm.tlsAuto ? t('plugins.uni.site.autoCertDesc') : t('plugins.uni.site.manualCertDesc') }}
              </span>
            </el-form-item>
            <el-form-item :label="t('plugins.uni.site.acmeEmail')" v-if="tlsAutoForm.tlsAuto">
              <el-input v-model="tlsAutoForm.tlsEmail" placeholder="admin@example.com" style="width: 280px;" />
              <div style="font-size: 12px; color: #999; margin-top: 4px;">
                {{ t('plugins.uni.site.acmeEmailDesc') }}
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" :loading="tlsAutoLoading" @click="handleSaveTlsSettings">{{ t('plugins.uni.site.saveSettings') }}</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="certInfo.certStatus > 0" style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px;">
          <h4 style="margin: 0 0 12px 0;">{{ t('plugins.uni.site.currentCert') }}</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item :label="t('plugins.uni.sites.status')">
              <el-tag :type="certStatusType(certInfo.certStatus)" size="small">{{ certStatusText(certInfo.certStatus) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('plugins.uni.site.certSource')">{{ certSourceText(certInfo.certSource) }}</el-descriptions-item>
            <el-descriptions-item :label="t('plugins.uni.site.certIssuedAt')" v-if="certInfo.certIssuedAt">{{ certInfo.certIssuedAt }}</el-descriptions-item>
            <el-descriptions-item :label="t('plugins.uni.site.certExpiresAt')" v-if="certInfo.certExpiresAt">{{ certInfo.certExpiresAt }}</el-descriptions-item>
            <el-descriptions-item :label="t('plugins.uni.site.certRenewedAt')" v-if="certInfo.certRenewedAt">{{ certInfo.certRenewedAt }}</el-descriptions-item>
            <el-descriptions-item :label="t('plugins.uni.site.certFingerprint')" v-if="certInfo.certFingerprint">
              <span style="font-family: monospace; font-size: 11px; word-break: break-all;">{{ certInfo.certFingerprint }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top: 12px;">
            <el-button type="danger" size="small" @click="handleClearCert">{{ t('plugins.uni.site.clearCert') }}</el-button>
          </div>
        </div>
        <div v-else style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px; text-align: center; color: #999;">
          {{ t('plugins.uni.site.noCertConfigured') }}
        </div>
        <el-divider content-position="left">{{ t('plugins.uni.site.manualUpload') }}</el-divider>
        <el-form label-width="80px">
          <el-form-item :label="t('plugins.uni.site.certPem')">
            <el-input v-model="certUploadForm.certPem" type="textarea" :rows="5" :placeholder="t('plugins.uni.site.certPemPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('plugins.uni.site.keyPem')">
            <el-input v-model="certUploadForm.keyPem" type="textarea" :rows="5" :placeholder="t('plugins.uni.site.keyPemPlaceholder')" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="certUploadLoading" @click="handleUploadCert">{{ t('plugins.uni.site.uploadCert') }}</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>

    <!-- 新建站点抽屉 -->
    <el-drawer v-model="createDrawerVisible" :title="t('plugins.uni.sites.newSiteDrawerTitle')" size="520px" direction="rtl" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="100px" v-loading="createLoading">
        <el-form-item :label="t('plugins.uni.sites.siteName')">
          <el-input v-model="createForm.name" :placeholder="t('plugins.uni.sites.enterSiteNameWarn')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.tenant')">
          <el-select v-model="createForm.tenantId" :placeholder="t('plugins.uni.sites.selectTenant')" clearable filterable>
            <el-option v-for="tenant in tenants" :key="tenant.id" :label="tenant.name" :value="tenant.id">
              <span>{{ tenant.name }}</span>
              <el-tag size="small" type="info" style="margin-left: 8px;">{{ tenant.slug }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.bindDomain')">
          <el-input v-model="createForm.domain" :placeholder="t('plugins.uni.sites.domainPlaceholderOptional')" />
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.defaultLang')">
          <el-select v-model="createForm.locale" :placeholder="t('plugins.uni.sites.pleaseSelect')">
            <el-option :label="t('plugins.uni.sites.langZh')" value="zh" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('plugins.uni.sites.template')">
          <el-input v-model="createForm.template" placeholder="default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDrawerVisible = false">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button type="primary" :loading="createSaving" @click="handleCreateSite">{{ t('plugins.uni.sites.create') }}</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { listSites, getSite, updateSite, createDemoData, getCert, uploadCert, clearCert, createSite } from '../../cms/api/site.js'
import { listTenants } from '../api/tenant.js'

const { t } = useI18n()

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
    ElMessage.warning(t('plugins.uni.sites.enterSiteNameWarn'))
    return
  }
  if (!createForm.value.tenantId) {
    ElMessage.warning(t('plugins.uni.sites.selectTenantWarn'))
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
      ElMessage.success(t('plugins.uni.sites.createSuccess'))
      createDrawerVisible.value = false
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.sites.createFailed'))
    }
  } catch (e) {
    console.error('创建站点失败:', e)
    ElMessage.error(t('plugins.uni.sites.createFailed'))
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
  const found = tenants.value.find(t => t.id === tenantId)
  return found ? found.name : tenantId ? t('plugins.uni.sites.tenantPrefix', { id: tenantId }) : t('plugins.uni.sites.unassigned')
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
      ElMessage.error(res.msg || t('plugins.uni.sites.loadFailed'))
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
      ElMessage.error(t('plugins.uni.sites.loadDetailFailed'))
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
      ElMessage.success(t('plugins.uni.saveSuccess'))
      drawerVisible.value = false
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.saveFailed'))
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error(t('plugins.uni.saveFailed'))
  } finally {
    saveLoading.value = false
  }
}

// 切换当前维护站点（设置 cms_site_id，所有 CMS 页面生效）
const handleSwitchSite = (row) => {
  activeSiteId.value = row.id
  localStorage.setItem('cms_site_id', String(row.id))
  ElMessage.success(t('plugins.uni.sites.switchedTo', { name: parseName(row.name) }))
}

// 清除站点切换
const handleClearSite = () => {
  activeSiteId.value = null
  localStorage.removeItem('cms_site_id')
  ElMessage.info(t('plugins.uni.sites.clearedSiteSwitch'))
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
      t('plugins.uni.sites.demoDataDesc', { name: siteName }),
      t('plugins.uni.sites.demoDataTitle1'),
      { confirmButtonText: t('plugins.uni.sites.continue'), cancelButtonText: t('plugins.uni.cancel'), type: 'warning' }
    )
  } catch {
    return
  }
  // 第二步：最终确认
  try {
    await ElMessageBox.confirm(
      t('plugins.uni.sites.demoDataDesc2', { name: siteName }),
      t('plugins.uni.sites.finalConfirmTitle'),
      { confirmButtonText: t('plugins.uni.sites.confirmGenerate'), cancelButtonText: t('plugins.uni.sites.abort'), type: 'error', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  // 执行生成
  loading.value = true
  try {
    const res = await withSiteId(row.id, () => createDemoData())
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.sites.demoDataSuccess', { name: siteName }))
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.sites.generateFailed'))
    }
  } catch (e) {
    console.error('生成演示数据失败:', e)
    ElMessage.error(t('plugins.uni.sites.generateFailed'))
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

// TLS 自动签发设置
const tlsAutoForm = ref({ tlsAuto: 0, tlsEmail: '' })
const tlsAutoLoading = ref(false)

const certStatusText = (s) => ({ 1: t('plugins.uni.site.certValid'), 2: t('plugins.uni.site.certExpiring'), 3: t('plugins.uni.site.certExpired') }[s] || t('plugins.uni.site.certUnknown'))
const certStatusType = (s) => ({ 1: 'success', 2: 'warning', 3: 'danger' }[s] || 'info')
const certSourceText = (s) => ({ 1: 'Let\'s Encrypt', 2: t('plugins.uni.site.certManualUpload'), 3: t('plugins.uni.site.certSelfSigned') }[s] || t('plugins.uni.site.certUnknown'))

const handleCertManage = async (row) => {
  certSiteId.value = row.id
  certSiteName.value = parseName(row.name)
  certUploadForm.value = { certPem: '', keyPem: '' }
  // 初始化 TLS 设置
  tlsAutoForm.value = { tlsAuto: row.tlsAuto || 0, tlsEmail: row.tlsEmail || '' }
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
    ElMessage.warning(t('plugins.uni.site.fillCertAndKey'))
    return
  }
  certUploadLoading.value = true
  try {
    const res = await withSiteId(certSiteId.value, () => uploadCert(certUploadForm.value))
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.site.certUploadSuccess'))
      certInfo.value = res.data
      certUploadForm.value = { certPem: '', keyPem: '' }
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.site.uploadFailed'))
    }
  } catch (e) {
    console.error('上传证书失败:', e)
    ElMessage.error(t('plugins.uni.site.uploadCertFailed'))
  } finally {
    certUploadLoading.value = false
  }
}

const handleClearCert = async () => {
  try {
    await ElMessageBox.confirm(t('plugins.uni.site.clearCertConfirm'), t('plugins.uni.site.clearCert'), { type: 'warning' })
  } catch { return }
  certLoading.value = true
  try {
    const res = await withSiteId(certSiteId.value, () => clearCert())
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.site.certCleared'))
      certInfo.value = { certStatus: 0, certSource: 0 }
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.site.clearFailed'))
    }
  } catch (e) {
    console.error('清除证书失败:', e)
    ElMessage.error(t('plugins.uni.site.clearCertFailed'))
  } finally {
    certLoading.value = false
  }
}

// 保存 TLS 自动签发设置
const handleSaveTlsSettings = async () => {
  tlsAutoLoading.value = true
  try {
    const res = await withSiteId(certSiteId.value, () => updateSite({
      tlsAuto: tlsAutoForm.value.tlsAuto,
      tlsEmail: tlsAutoForm.value.tlsEmail || '',
    }))
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.site.tlsSettingsSaved'))
      loadSites()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.saveFailed'))
    }
  } catch (e) {
    console.error('保存 TLS 设置失败:', e)
    ElMessage.error(t('plugins.uni.site.tlsSaveFailed'))
  } finally {
    tlsAutoLoading.value = false
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
