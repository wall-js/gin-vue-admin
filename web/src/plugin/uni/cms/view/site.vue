<template>
  <div>
    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;">站点设置</h2>
          <div>
            <el-button type="warning" :loading="demoLoading" @click="handleDemoData">生成演示数据</el-button>
            <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
          </div>
        </div>

        <el-form ref="formRef" :model="formData" label-width="120px" v-loading="pageLoading">
          <!-- 基本信息 -->
          <el-divider content-position="left">基本信息</el-divider>

          <el-form-item label="站点名称">
            <I18nInput v-model="formData.name" :locales="siteLocales" placeholder="请输入站点名称" />
          </el-form-item>

          <el-form-item label="站点描述">
            <I18nInput v-model="formData.description" :locales="siteLocales" type="textarea" :rows="3" placeholder="请输入站点描述" />
          </el-form-item>

          <el-form-item label="Logo URL">
            <I18nInput v-model="formData.logoUrl" :locales="siteLocales" placeholder="请输入 Logo URL" />
          </el-form-item>

          <el-form-item label="Favicon URL">
            <el-input v-model="formData.faviconUrl" placeholder="请输入 Favicon URL" />
          </el-form-item>

          <!-- 语言设置 -->
          <el-divider content-position="left">语言设置</el-divider>

          <el-form-item label="默认语言">
            <el-select v-model="formData.locale" placeholder="请选择默认语言">
              <el-option label="中文" value="zh" />
              <el-option label="English" value="en" />
              <el-option label="العربية" value="ar" />
              <el-option label="Русский" value="ru" />
            </el-select>
          </el-form-item>

          <el-form-item label="可用语言">
            <el-select v-model="localesList" multiple placeholder="请选择可用语言">
              <el-option label="中文" value="zh" />
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
            <I18nInput v-model="formData.metaTitle" :locales="siteLocales" placeholder="请输入 SEO 标题" />
          </el-form-item>

          <el-form-item label="Meta Description">
            <I18nInput v-model="formData.metaDescription" :locales="siteLocales" type="textarea" :rows="2" placeholder="请输入 SEO 描述" />
          </el-form-item>

          <el-form-item label="Meta Keywords">
            <I18nInput v-model="formData.metaKeywords" :locales="siteLocales" placeholder="请输入 SEO 关键词" />
          </el-form-item>

          <!-- 站点状态 -->
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
import { ElMessage, ElMessageBox } from 'element-plus'
import I18nInput from '../components/I18nInput.vue'
import { getSite, updateSite, createDemoData } from '../api/site.js'

const pageLoading = ref(false)
const saveLoading = ref(false)
const demoLoading = ref(false)

const formData = ref({
  name: {},
  description: {},
  logoUrl: {},
  faviconUrl: '',
  locale: 'zh',
  locales: '["zh","en"]',
  template: 'default',
  metaTitle: {},
  metaDescription: {},
  metaKeywords: {},
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

const siteLocales = computed(() => localesList.value)

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
        locale: data.locale || 'zh',
        locales: data.locales || '["zh","en"]',
        template: data.template || 'default',
        metaTitle: parseI18nField(data.metaTitle),
        metaDescription: parseI18nField(data.metaDescription),
        metaKeywords: parseI18nField(data.metaKeywords),
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
      metaKeywords: JSON.stringify(formData.value.metaKeywords)
    }
    const res = await updateSite(data)
    if (res.code === 0) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saveLoading.value = false
  }
}

// 生成演示数据
const handleDemoData = async () => {
  try {
    await ElMessageBox.confirm('此操作将为当前站点生成演示数据（纯插入，不删除现有数据），是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  demoLoading.value = true
  try {
    const res = await createDemoData()
    if (res.code === 0) {
      ElMessage.success('演示数据生成成功')
      loadSite()
    } else {
      ElMessage.error(res.msg || '生成失败')
    }
  } catch (e) {
    console.error('生成演示数据失败:', e)
  } finally {
    demoLoading.value = false
  }
}

onMounted(() => {
  loadSite()
})
</script>

<style scoped>
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
