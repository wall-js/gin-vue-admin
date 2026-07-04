<template>
  <div>
    <LocaleSwitcher
      entity-type="site"
      :on-translated="loadSite"
    />

    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">{{ t('plugins.uni.site.settings') }}</h2>
          <div>
            <el-button type="primary" :loading="saveLoading" @click="handleSave">{{ t('plugins.uni.save') }}</el-button>
          </div>
        </div>

        <el-form ref="formRef" :model="formData" label-width="120px" v-loading="pageLoading">
          <!-- 基本信息 -->
          <el-divider content-position="left">{{ t('plugins.uni.site.basicInfo') }}</el-divider>

          <el-form-item :label="t('plugins.uni.site.siteName')">
            <el-input v-model="i18n('name').value" :placeholder="t('plugins.uni.site.enterSiteName')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.siteDescription')">
            <el-input v-model="i18n('description').value" type="textarea" :rows="3" :placeholder="t('plugins.uni.site.enterSiteDescription')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.logoUrl')">
            <el-input v-model="i18n('logoUrl').value" :placeholder="t('plugins.uni.site.enterLogoUrl')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.faviconUrl')">
            <el-input v-model="formData.faviconUrl" :placeholder="t('plugins.uni.site.enterFaviconUrl')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.bindDomain')">
            <el-input v-model="formData.domain" :placeholder="t('plugins.uni.site.domainPlaceholder')">
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              {{ t('plugins.uni.site.domainNote') }}
            </div>
          </el-form-item>

          <!-- TLS 证书 -->
          <el-divider content-position="left">{{ t('plugins.uni.site.tlsCert') }}</el-divider>

          <el-form-item :label="t('plugins.uni.site.certStatus')">
            <template v-if="certInfo.certStatus > 0">
              <el-tag :type="certStatusType(certInfo.certStatus)" size="small">{{ certStatusText(certInfo.certStatus) }}</el-tag>
              <span style="margin-left: 8px; font-size: 12px; color: #999;">{{ certSourceText(certInfo.certSource) }}</span>
              <span v-if="certInfo.certExpiresAt" style="margin-left: 8px; font-size: 12px; color: #999;">{{ t('plugins.uni.site.certExpiresPrefix') }} {{ certInfo.certExpiresAt.slice(0, 10) }}</span>
            </template>
            <span v-else style="color: #999; font-size: 13px;">{{ t('plugins.uni.site.notConfigured') }}</span>
            <el-button type="primary" link style="margin-left: 12px;" @click="openCertDrawer">{{ t('plugins.uni.site.manageCert') }}</el-button>
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.autoIssue')">
            <el-switch v-model="formData.tlsAuto" :active-value="1" :inactive-value="0"
              :active-text="t('plugins.uni.site.autoIssueOn')" :inactive-text="t('plugins.uni.site.autoIssueOff')" />
            <span style="margin-left: 12px; font-size: 12px; color: #999;">
              {{ formData.tlsAuto ? t('plugins.uni.site.autoIssueNote') : t('plugins.uni.site.manualUploadNote') }}
            </span>
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.acmeEmail')" v-if="formData.tlsAuto">
            <el-input v-model="formData.tlsEmail" placeholder="admin@example.com" style="width: 280px;" />
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              {{ t('plugins.uni.site.acmeEmailNote') }}
            </div>
          </el-form-item>

          <!-- 语言设置 -->
          <el-divider content-position="left">{{ t('plugins.uni.site.langSettings') }}</el-divider>

          <el-form-item :label="t('plugins.uni.site.defaultLang')">
            <el-select v-model="formData.locale" :placeholder="t('plugins.uni.site.selectDefaultLang')">
              <el-option label="中文" value="zh" />
              <el-option label="繁體中文" value="zh-TW" />
              <el-option label="English" value="en" />
              <el-option label="العربية" value="ar" />
              <el-option label="Русский" value="ru" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.availableLangs')">
            <el-select v-model="localesList" multiple :placeholder="t('plugins.uni.site.selectAvailableLangs')">
              <el-option label="中文" value="zh" />
              <el-option label="繁體中文" value="zh-TW" />
              <el-option label="English" value="en" />
              <el-option label="العربية" value="ar" />
              <el-option label="Русский" value="ru" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.template')">
            <el-input v-model="formData.template" :placeholder="t('plugins.uni.site.templateName')" />
          </el-form-item>

          <!-- SEO 设置 -->
          <el-divider content-position="left">{{ t('plugins.uni.site.seoSettings') }}</el-divider>

          <el-form-item label="Meta Title">
            <el-input v-model="i18n('metaTitle').value" :placeholder="t('plugins.uni.site.enterSeoTitle')" />
          </el-form-item>

          <el-form-item label="Meta Description">
            <el-input v-model="i18n('metaDescription').value" type="textarea" :rows="2" :placeholder="t('plugins.uni.site.enterSeoDescription')" />
          </el-form-item>

          <el-form-item label="Meta Keywords">
            <el-input v-model="i18n('metaKeywords').value" :placeholder="t('plugins.uni.site.enterSeoKeywords')" />
          </el-form-item>

          <!-- 站点状态 -->
          <el-divider content-position="left">{{ t('plugins.uni.site.otherSettings') }}</el-divider>

          <el-form-item :label="t('plugins.uni.site.phone')">
            <el-input v-model="settingI18n('phone').value" :placeholder="t('plugins.uni.site.enterPhone')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.email')">
            <el-input v-model="settingI18n('email').value" :placeholder="t('plugins.uni.site.enterEmail')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.address')">
            <el-input v-model="settingI18n('address').value" :placeholder="t('plugins.uni.site.enterAddress')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.copyright')">
            <el-input v-model="settingI18n('copyright').value" :placeholder="t('plugins.uni.site.enterCopyright')" />
          </el-form-item>

          <el-form-item :label="t('plugins.uni.site.footerHtml')">
            <el-input v-model="settingI18n('footer_html').value" type="textarea" :rows="4" :placeholder="t('plugins.uni.site.enterFooterHtml')" />
          </el-form-item>

          <el-divider content-position="left">{{ t('plugins.uni.site.miscSettings') }}</el-divider>

          <el-form-item :label="t('plugins.uni.site.siteStatus')">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">{{ t('plugins.uni.site.statusNormal') }}</el-radio>
              <el-radio :value="2">{{ t('plugins.uni.site.statusMaintenance') }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- TLS 证书管理抽屉 -->
    <el-drawer v-model="certDrawerVisible" :title="t('plugins.uni.site.certManagement')" size="520px" direction="rtl">
      <div v-loading="certLoading">
        <div v-if="certInfo.certStatus > 0" style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 4px;">
          <h4 style="margin: 0 0 12px 0;">{{ t('plugins.uni.site.currentCert') }}</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item :label="t('plugins.uni.site.certStatus')">
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
          {{ t('plugins.uni.site.noCertNote') }}
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import { getSite, updateSite, getCert, uploadCert, clearCert } from '../api/site.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const { t } = useI18n()
const cmsLocaleStore = useCmsLocaleStore()

const pageLoading = ref(false)
const saveLoading = ref(false)

const formData = ref({
  name: {},
  description: {},
  logoUrl: {},
  faviconUrl: '',
  domain: '',
  locale: 'zh',
  locales: '["zh","en"]',
  template: 'default',
  metaTitle: {},
  metaDescription: {},
  metaKeywords: {},
  settingsJson: {},
  status: 1,
  tlsAuto: 0,
  tlsEmail: ''
})

// TLS 证书
const certDrawerVisible = ref(false)
const certLoading = ref(false)
const certUploadLoading = ref(false)
const certInfo = ref({ certStatus: 0, certSource: 0 })
const certUploadForm = ref({ certPem: '', keyPem: '' })

const certStatusText = (s) => ({ 1: t('plugins.uni.site.certValid'), 2: t('plugins.uni.site.certExpiringSoon'), 3: t('plugins.uni.site.certExpired') }[s] || t('plugins.uni.unknown'))
const certStatusType = (s) => ({ 1: 'success', 2: 'warning', 3: 'danger' }[s] || 'info')
const certSourceText = (s) => ({ 1: t('plugins.uni.site.certSourceLetsEncrypt'), 2: t('plugins.uni.site.certSourceManual'), 3: t('plugins.uni.site.certSourceSelfSigned') }[s] || t('plugins.uni.unknown'))

const localesList = computed({
  get() {
    try {
      return JSON.parse(formData.value.locales)
    } catch {
      return ['zh']
    }
  },
  set(val) {
    formData.value.locales = JSON.stringify(val)
  }
})

const siteLocales = computed(() => cmsLocaleStore.availableLocales)

// 解析 I18nText JSON 字符串为 Object
const parseI18nField = (val) => {
  if (!val) return {}
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return {}
    }
  }
  return val
}

// i18n 字段绑定：读写当前语言的值
const i18n = (field) => {
  return {
    get value() {
      const obj = formData.value[field]
      return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
    },
    set value(val) {
      if (!formData.value[field] || typeof formData.value[field] !== 'object') {
        formData.value[field] = {}
      }
      formData.value[field][cmsLocaleStore.activeLocale] = val
    }
  }
}

// settingsJson 嵌套 i18n 字段绑定：读写当前语言的某个设置项
const settingI18n = (key) => {
  return {
    get value() {
      const locale = cmsLocaleStore.activeLocale
      const settings = formData.value.settingsJson
      if (settings && settings[locale]) {
        return settings[locale][key] || ''
      }
      return ''
    },
    set value(val) {
      const locale = cmsLocaleStore.activeLocale
      if (!formData.value.settingsJson || typeof formData.value.settingsJson !== 'object') {
        formData.value.settingsJson = {}
      }
      if (!formData.value.settingsJson[locale]) {
        formData.value.settingsJson[locale] = {}
      }
      formData.value.settingsJson[locale][key] = val
    }
  }
}

// 加载站点配置
const loadSite = async () => {
  pageLoading.value = true
  try {
    const res = await getSite()
    if (res.code === 0) {
      const data = res.data
      formData.value = {
        name: parseI18nField(data.name),
        description: parseI18nField(data.description),
        logoUrl: parseI18nField(data.logoUrl),
        faviconUrl: data.faviconUrl || '',
        domain: data.domain || '',
        locale: data.locale || 'zh',
        locales: data.locales || '["zh","en"]',
        template: data.template || 'default',
        metaTitle: parseI18nField(data.metaTitle),
        metaDescription: parseI18nField(data.metaDescription),
        metaKeywords: parseI18nField(data.metaKeywords),
        settingsJson: parseI18nField(data.settingsJson),
        status: data.status || 1,
        tlsAuto: data.tlsAuto || 0,
        tlsEmail: data.tlsEmail || ''
      }
      // 加载证书信息
      loadCertInfo()
    }
  } catch (e) {
    console.error('加载站点配置失败:', e)
  } finally {
    pageLoading.value = false
  }
}

// 保存站点配置
const handleSave = async () => {
  saveLoading.value = true
  try {
    // I18n 对象转 JSON 字符串
    const data = {
      ...formData.value,
      name: JSON.stringify(formData.value.name),
      description: JSON.stringify(formData.value.description),
      logoUrl: JSON.stringify(formData.value.logoUrl),
      metaTitle: JSON.stringify(formData.value.metaTitle),
      metaDescription: JSON.stringify(formData.value.metaDescription),
      metaKeywords: JSON.stringify(formData.value.metaKeywords),
      settingsJson: JSON.stringify(formData.value.settingsJson)
    }
    const res = await updateSite(data)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.saveSuccess'))
      // 刷新全局语言配置（可用语言可能已变更）
      await cmsLocaleStore.refresh()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.saveFailed'))
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saveLoading.value = false
  }
}

// 加载证书信息
const loadCertInfo = async () => {
  try {
    const res = await getCert()
    if (res.code === 0) {
      certInfo.value = res.data
    } else {
      certInfo.value = { certStatus: 0, certSource: 0 }
    }
  } catch {
    certInfo.value = { certStatus: 0, certSource: 0 }
  }
}

const openCertDrawer = () => {
  certUploadForm.value = { certPem: '', keyPem: '' }
  certDrawerVisible.value = true
  loadCertInfo()
}

const handleUploadCert = async () => {
  if (!certUploadForm.value.certPem || !certUploadForm.value.keyPem) {
    ElMessage.warning(t('plugins.uni.site.fillCertAndKey'))
    return
  }
  certUploadLoading.value = true
  try {
    const res = await uploadCert(certUploadForm.value)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.site.certUploadSuccess'))
      certInfo.value = res.data
      certUploadForm.value = { certPem: '', keyPem: '' }
    } else {
      ElMessage.error(res.msg || t('plugins.uni.site.uploadFailed'))
    }
  } catch (e) {
    console.error('上传证书失败:', e)
    ElMessage.error(t('plugins.uni.site.certUploadFailed'))
  } finally {
    certUploadLoading.value = false
  }
}

const handleClearCert = async () => {
  try {
    await ElMessageBox.confirm(t('plugins.uni.site.clearCertConfirm'), t('plugins.uni.site.clearCertTitle'), { type: 'warning' })
  } catch { return }
  certLoading.value = true
  try {
    const res = await clearCert()
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.site.certCleared'))
      certInfo.value = { certStatus: 0, certSource: 0 }
    } else {
      ElMessage.error(res.msg || t('plugins.uni.site.clearCertFailed'))
    }
  } catch (e) {
    console.error('清除证书失败:', e)
    ElMessage.error(t('plugins.uni.site.clearCertFailed'))
  } finally {
    certLoading.value = false
  }
}

onMounted(() => {
  loadSite()
  cmsLocaleStore.init()
})
</script>

<style scoped>
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
