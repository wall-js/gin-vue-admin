<template>
  <div>
    <LocaleSwitcher
      entity-type="site"
      :on-translated="loadSite"
    />

    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">站点设置</h2>
          <div>
            <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
          </div>
        </div>

        <el-form ref="formRef" :model="formData" label-width="120px" v-loading="pageLoading">
          <!-- 基本信息 -->
          <el-divider content-position="left">基本信息</el-divider>

          <el-form-item label="站点名称">
            <el-input v-model="i18n('name').value" placeholder="请输入站点名称" />
          </el-form-item>

          <el-form-item label="站点描述">
            <el-input v-model="i18n('description').value" type="textarea" :rows="3" placeholder="请输入站点描述" />
          </el-form-item>

          <el-form-item label="Logo URL">
            <el-input v-model="i18n('logoUrl').value" placeholder="请输入 Logo URL" />
          </el-form-item>

          <el-form-item label="Favicon URL">
            <el-input v-model="formData.faviconUrl" placeholder="请输入 Favicon URL" />
          </el-form-item>

          <el-form-item label="绑定域名">
            <el-input v-model="formData.domain" placeholder="例如: www.example.com">
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              绑定域名后，用户访问该域名时将自动加载此站点内容
            </div>
          </el-form-item>

          <!-- 语言设置 -->
          <el-divider content-position="left">语言设置</el-divider>

          <el-form-item label="默认语言">
            <el-select v-model="formData.locale" placeholder="请选择默认语言">
              <el-option label="中文" value="zh" />
              <el-option label="繁體中文" value="zh-TW" />
              <el-option label="English" value="en" />
              <el-option label="العربية" value="ar" />
              <el-option label="Русский" value="ru" />
            </el-select>
          </el-form-item>

          <el-form-item label="可用语言">
            <el-select v-model="localesList" multiple placeholder="请选择可用语言">
              <el-option label="中文" value="zh" />
              <el-option label="繁體中文" value="zh-TW" />
              <el-option label="English" value="en" />
              <el-option label="العربية" value="ar" />
              <el-option label="Русский" value="ru" />
            </el-select>
          </el-form-item>

          <el-form-item label="模板">
            <el-input v-model="formData.template" placeholder="模板名称" />
          </el-form-item>

          <!-- SEO 设置 -->
          <el-divider content-position="left">SEO 设置</el-divider>

          <el-form-item label="Meta Title">
            <el-input v-model="i18n('metaTitle').value" placeholder="请输入 SEO 标题" />
          </el-form-item>

          <el-form-item label="Meta Description">
            <el-input v-model="i18n('metaDescription').value" type="textarea" :rows="2" placeholder="请输入 SEO 描述" />
          </el-form-item>

          <el-form-item label="Meta Keywords">
            <el-input v-model="i18n('metaKeywords').value" placeholder="请输入 SEO 关键词" />
          </el-form-item>

          <!-- 站点状态 -->
          <el-divider content-position="left">站点设置</el-divider>

          <el-form-item label="联系电话">
            <el-input v-model="settingI18n('phone').value" placeholder="请输入联系电话" />
          </el-form-item>

          <el-form-item label="联系邮箱">
            <el-input v-model="settingI18n('email').value" placeholder="请输入联系邮箱" />
          </el-form-item>

          <el-form-item label="地址">
            <el-input v-model="settingI18n('address').value" placeholder="请输入地址" />
          </el-form-item>

          <el-form-item label="版权信息">
            <el-input v-model="settingI18n('copyright').value" placeholder="请输入版权信息" />
          </el-form-item>

          <el-form-item label="Footer HTML">
            <el-input v-model="settingI18n('footer_html').value" type="textarea" :rows="4" placeholder="请输入 Footer HTML 代码" />
          </el-form-item>

          <el-divider content-position="left">其他设置</el-divider>

          <el-form-item label="站点状态">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">正常运行</el-radio>
              <el-radio :value="2">维护中</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import { getSite, updateSite } from '../api/site.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

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
  status: 1
})

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
        status: data.status || 1
      }
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
      ElMessage.success('保存成功')
      // 刷新全局语言配置（可用语言可能已变更）
      await cmsLocaleStore.refresh()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saveLoading.value = false
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
